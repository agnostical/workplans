/**
 * Tests for the templates system: planid generation (unit) and the
 * list/add commands (integration, offline via WORKPLANS_TEMPLATES_SOURCE).
 */

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateId, frontmatterDate } from "../lib/planid.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI = join(__dirname, "..", "bin", "cli.mjs");

// ─── planid unit tests ──────────────────────────────────────────

test("generateId follows YYDDDsssss with padding", () => {
  // 2026-02-03 00:01:05 → year 26, day 034, seconds 65
  const id = generateId(new Date(2026, 1, 3, 0, 1, 5));
  assert.equal(id, "2603400065");
  assert.equal(id.length, 10);
});

test("generateId covers year boundaries and end of day", () => {
  assert.equal(generateId(new Date(2026, 0, 1, 0, 0, 0)), "2600100000");
  assert.equal(generateId(new Date(2026, 11, 31, 23, 59, 59)), "2636586399");
});

test("frontmatterDate formats local ISO minutes", () => {
  assert.equal(frontmatterDate(new Date(2026, 6, 13, 9, 5)), "2026-07-13T09:05");
});

// ─── list / add integration ─────────────────────────────────────

let initFixture;
let templatesFixture;

function buildInitFixture(version) {
  const src = mkdtempSync(join(tmpdir(), "workplans-init-fixture-"));
  const wp = join(src, "workplans");
  mkdirSync(wp, { recursive: true });
  writeFileSync(join(wp, "RULES.md"), `---\nname: workplans\nversion: ${version}\n---\n\n# Rules\n`);
  writeFileSync(join(wp, "README.md"), `# Workplans\n`);
  for (const folder of ["backlog", "doing", "done"]) {
    mkdirSync(join(wp, folder), { recursive: true });
    writeFileSync(join(wp, folder, "README.md"), `# ${folder}\n`);
  }
  return src;
}

function buildTemplatesFixture() {
  const src = mkdtempSync(join(tmpdir(), "workplans-templates-fixture-"));
  writeFileSync(
    join(src, "index.json"),
    JSON.stringify({
      templates: [
        { name: "demo-template", title: "Demo template", description: "A demo template for tests" },
        { name: "other-template", title: "Other template", description: "A second template for id collision tests" },
      ],
    })
  );
  writeFileSync(
    join(src, "other-template.md"),
    `---
id: 0000000000
title: "Other template"
state: "backlog"
author: ""
author_model: ""
assignee: ""
assignee_model: ""
backlog_date: ""
doing_date: ""
done_date: ""
format_version: "0.0.0"
---

# Other template

## Objective
Other objective.
`
  );
  writeFileSync(
    join(src, "demo-template.md"),
    `---
id: 0000000000
title: "Demo template"
state: "backlog"
author: ""
author_model: ""
assignee: ""
assignee_model: ""
backlog_date: ""
doing_date: ""
done_date: ""
format_version: "0.0.0"
---

# Demo template

## Objective
Demo objective.
`
  );
  return src;
}

function run(args, cwd) {
  return spawnSync(process.execPath, [CLI, ...args], {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      WORKPLANS_TEMPLATE_SOURCE: initFixture,
      WORKPLANS_TEMPLATES_SOURCE: templatesFixture,
    },
  });
}

function freshProject() {
  const cwd = mkdtempSync(join(tmpdir(), "workplans-proj-"));
  run(["init"], cwd);
  return cwd;
}

before(() => {
  initFixture = buildInitFixture("0.9.0");
  templatesFixture = buildTemplatesFixture();
});

after(() => {
  rmSync(initFixture, { recursive: true, force: true });
  rmSync(templatesFixture, { recursive: true, force: true });
});

test("list prints the catalog with exit 0", () => {
  const r = run(["list"], mkdtempSync(join(tmpdir(), "workplans-any-")));
  assert.equal(r.status, 0);
  assert.match(r.stdout, /demo-template/);
  assert.match(r.stdout, /A demo template for tests/);
  assert.match(r.stdout, /workplans add <template>/);
});

test("add fails clearly outside an initialized project", () => {
  const r = run(["add", "demo-template"], mkdtempSync(join(tmpdir(), "workplans-empty-")));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /workplans\/backlog\/ not found/);
  assert.match(r.stderr, /npx workplans init/);
});

test("add fails clearly for an unknown template", () => {
  const r = run(["add", "does-not-exist"], freshProject());
  assert.equal(r.status, 1);
  assert.match(r.stderr, /not found/);
  assert.match(r.stderr, /npx workplans list/);
});

test("add requires exactly one positional argument", () => {
  const r = run(["add"], freshProject());
  assert.equal(r.status, 1);
  assert.match(r.stderr, /expects 1 argument/);
});

test("add instantiates the template with fresh id, dates and local format_version", () => {
  const cwd = freshProject();
  const r = run(["add", "demo-template"], cwd);
  assert.equal(r.status, 0);

  const files = readdirSync(join(cwd, "workplans", "backlog")).filter((f) => f.endsWith("_demo-template.md"));
  assert.equal(files.length, 1);
  const [file] = files;
  assert.match(file, /^\d{10}_demo-template\.md$/);

  const content = readFileSync(join(cwd, "workplans", "backlog", file), "utf8");
  const id = file.slice(0, 10);
  assert.match(content, new RegExp(`^id: ${id}$`, "m"), "frontmatter id matches filename");
  assert.match(content, /^state: "backlog"$/m);
  assert.match(content, /^backlog_date: "\d{4}-\d{2}-\d{2}T\d{2}:\d{2}"$/m);
  assert.match(content, /^doing_date: ""$/m);
  assert.match(content, /^format_version: "0\.9\.0"$/m, "format_version comes from local RULES.md");
  assert.match(content, /# Demo template/, "body is preserved");
});

test("add is non-destructive: refuses a second instance of the same template", () => {
  const cwd = freshProject();
  assert.equal(run(["add", "demo-template"], cwd).status, 0);
  const r = run(["add", "demo-template"], cwd);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /already exists/);
});

test("two adds in the same second get distinct ids", () => {
  const cwd = freshProject();
  assert.equal(run(["add", "demo-template"], cwd).status, 0);
  assert.equal(run(["add", "other-template"], cwd).status, 0);
  const ids = readdirSync(join(cwd, "workplans", "backlog"))
    .filter((f) => /^\d{10}_/.test(f))
    .map((f) => f.slice(0, 10));
  assert.equal(new Set(ids).size, ids.length, `ids must be unique, got: ${ids.join(", ")}`);
});
