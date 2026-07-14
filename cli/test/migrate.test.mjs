/**
 * Integration tests for `workplans migrate` and the update ownership fix
 * (#69, #70): README preservation, work_on migration, per-version plan
 * transitions, scope flags, and dry-run.
 */

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI = join(__dirname, "..", "bin", "cli.mjs");

let fixtureDir;

function buildFixture(version) {
  const src = mkdtempSync(join(tmpdir(), "workplans-fixture-"));
  const wp = join(src, "workplans");
  mkdirSync(wp, { recursive: true });
  writeFileSync(
    join(wp, "RULES.md"),
    `---\nname: workplans\nversion: ${version}\n---\n\n# Workplans: Rules\n\nFixture rules.\n`
  );
  writeFileSync(join(wp, "README.md"), `# Workplans\n\nTemplate readme.\n`);
  for (const folder of ["backlog", "doing", "done"]) {
    mkdirSync(join(wp, folder), { recursive: true });
    writeFileSync(join(wp, folder, "README.md"), `# ${folder}\n`);
  }
  return src;
}

function run(args, cwd) {
  return spawnSync(process.execPath, [CLI, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, WORKPLANS_TEMPLATE_SOURCE: fixtureDir },
  });
}

const PLAN_BODY_030 = `
# Sample plan

## Objective
Do the thing.

## Progress
### Phase 1: Definition
- [x] Define objective and context
- [x] Define phases and steps
- [x] Refine with the user

### Phase 2: Closing
- [ ] Write Closing Summary
- [ ] Validate implementation with the user

## Context
Some context with accents: definición, ejecución.

## Implementation
### Phase 1: Definition
Define the Objective, Context, and subsequent phases. Once complete, the plan is ready for execution.

### Phase 2: Closing
Validate the implementation with the user and write the Closing Summary. Once complete, the plan is ready to move to done.

## Closing Summary
_To be written when the last phase is completed._
`;

function plan030(id, state) {
  return `---
id: ${id}
title: "Sample plan"
state: "${state}"
author: "Alice"
author_model: "claude-opus-4-6"
assignee: ""
assignee_model: ""
backlog_date: "2026-03-05T09:30"
doing_date: ""
done_date: ""
format_version: "0.3.0"
---${PLAN_BODY_030}`;
}

/** A 0.2.x plan: Progress above Objective, older format_version. */
function plan020(id, state) {
  return `---
id: ${id}
title: "Sample plan"
state: "${state}"
author: "Alice"
author_model: "claude-opus-4-6"
assignee: ""
assignee_model: ""
backlog_date: "2026-03-05T09:30"
doing_date: ""
done_date: ""
format_version: "0.2.1"
---

# Sample plan

## Progress
### Phase 1: Definition
- [x] Define objective and context
- [x] Define phases and steps
- [x] Refine with the user

## Objective
Do the thing.

## Context
Some context.

## Implementation
### Phase 1: Definition
Define the Objective, Context, and subsequent phases. Once complete, the plan is ready for execution.

## Closing Summary
_To be written when the last phase is completed._
`;
}

/** Scaffolds a 0.4.0 install with one 0.3.0 plan per state folder. */
function scaffold() {
  const cwd = mkdtempSync(join(tmpdir(), "workplans-migrate-"));
  const wp = join(cwd, "workplans");
  for (const folder of ["backlog", "doing", "done"]) {
    mkdirSync(join(wp, folder), { recursive: true });
    writeFileSync(join(wp, folder, "README.md"), `# ${folder}\n`);
  }
  writeFileSync(join(wp, "RULES.md"), `---\nname: workplans\nversion: 0.4.0\n---\n\n# Rules\n`);
  writeFileSync(join(wp, "README.md"), `# My project\n`);
  writeFileSync(join(wp, "backlog", "2601000001_sample-plan.md"), plan030("2601000001", "backlog"));
  writeFileSync(join(wp, "doing", "2601000002_sample-plan.md"), plan030("2601000002", "doing"));
  writeFileSync(join(wp, "done", "2601000003_sample-plan.md"), plan030("2601000003", "done"));
  return cwd;
}

before(() => {
  fixtureDir = buildFixture("9.9.9");
});

after(() => {
  rmSync(fixtureDir, { recursive: true, force: true });
});

// ─── migrate ──────────────────────────────────────────────────────

test("migrate rewrites a 0.3.0 backlog plan to the 0.4.0 contract, body untouched", () => {
  const cwd = scaffold();
  const r = run(["migrate"], cwd);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Migrated backlog\/2601000001_sample-plan\.md: 0\.3\.0 -> 0\.4\.0/);

  const out = readFileSync(join(cwd, "workplans", "backlog", "2601000001_sample-plan.md"), "utf8");
  const fm = out.split("---")[1];
  const keys = fm.trim().split("\n").map((l) => l.split(":")[0]);
  assert.deepEqual(keys, [
    "format", "id", "title", "priority", "estimate", "author", "author_model",
    "assignee", "assignee_model", "state", "backlog_date", "doing_date",
    "done_date", "tracked_in", "relations",
  ]);
  assert.match(fm, /format: "0\.4\.0"/);
  assert.match(fm, /priority: ""/);
  assert.match(fm, /tracked_in: ""/);
  assert.match(fm, /relations:\n$/);
  assert.ok(!fm.includes("format_version"), "format_version renamed");
  assert.ok(out.endsWith(PLAN_BODY_030), "content sections preserved byte for byte");
});

test("migrate reorders 0.2.x sections to Objective-first", () => {
  const cwd = scaffold();
  writeFileSync(
    join(cwd, "workplans", "backlog", "2601000009_old-plan.md"),
    plan020("2601000009", "backlog")
  );
  const r = run(["migrate"], cwd);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /2601000009_old-plan\.md: 0\.2\.1 -> 0\.4\.0/);
  const out = readFileSync(join(cwd, "workplans", "backlog", "2601000009_old-plan.md"), "utf8");
  assert.ok(out.indexOf("## Objective") < out.indexOf("## Progress"), "Objective moved above Progress");
  assert.match(out, /- \[x\] Define objective and context/);
});

test("migrate touches doing/ only with --doing and never done/", () => {
  const cwd = scaffold();
  const doingPath = join(cwd, "workplans", "doing", "2601000002_sample-plan.md");
  const donePath = join(cwd, "workplans", "done", "2601000003_sample-plan.md");
  const doneBefore = readFileSync(donePath, "utf8");

  let r = run(["migrate"], cwd);
  assert.equal(r.status, 0);
  assert.match(readFileSync(doingPath, "utf8"), /format_version: "0\.3\.0"/, "doing untouched by default");

  r = run(["migrate", "--doing"], cwd);
  assert.equal(r.status, 0);
  assert.match(readFileSync(doingPath, "utf8"), /format: "0\.4\.0"/, "doing migrated with --doing");
  assert.equal(readFileSync(donePath, "utf8"), doneBefore, "done/ is never migrated");
});

test("migrate --dry-run reports without writing", () => {
  const cwd = scaffold();
  const planPath = join(cwd, "workplans", "backlog", "2601000001_sample-plan.md");
  const before = readFileSync(planPath, "utf8");
  const r = run(["migrate", "--dry-run"], cwd);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Would migrate backlog\/2601000001_sample-plan\.md/);
  assert.equal(readFileSync(planPath, "utf8"), before);
});

test("migrate skips plans already on the current format", () => {
  const cwd = scaffold();
  run(["migrate"], cwd);
  const r = run(["migrate"], cwd);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /0 plan\(s\) migrated, 1 already current/);
});

test("migrate rejects unknown flags", () => {
  const r = run(["migrate", "--all"], scaffold());
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Unknown flag for 'migrate': --all/);
});

test("migrate fails clearly when the installed framework predates 0.4.0", () => {
  const cwd = scaffold();
  writeFileSync(
    join(cwd, "workplans", "RULES.md"),
    `---\nname: workplans\nversion: 0.3.1\n---\n\n# Rules\n`
  );
  const r = run(["migrate"], cwd);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /migrate targets 0\.4\.0\+/);
});

// ─── update ownership (#69) ──────────────────────────────────────

test("update preserves a customized root README and refreshes RULES.md", () => {
  const cwd = scaffold();
  const wp = join(cwd, "workplans");
  writeFileSync(join(wp, "README.md"), `---\ntracker: "https://linear.app/acme/team/ENG"\n---\n\n# Custom\n`);
  const r = run(["update"], cwd);
  assert.equal(r.status, 0);
  assert.match(readFileSync(join(wp, "README.md"), "utf8"), /Custom/, "root README untouched");
  assert.match(readFileSync(join(wp, "RULES.md"), "utf8"), /version: 9\.9\.9/, "RULES.md replaced");
});

test("update migrates work_on from RULES.md to the README frontmatter", () => {
  const cwd = scaffold();
  const wp = join(cwd, "workplans");
  writeFileSync(
    join(wp, "RULES.md"),
    `---\nname: workplans\nversion: 0.4.0\nwork_on: "https://github.com/acme/backend"\n---\n\n# Rules\n`
  );
  const r = run(["update"], cwd);
  assert.equal(r.status, 0);
  const readme = readFileSync(join(wp, "README.md"), "utf8");
  assert.match(readme, /^---\nwork_on: "https:\/\/github\.com\/acme\/backend"\n---\n/);
  assert.match(readme, /# My project/, "existing README content preserved");
});

test("update creates the root README only when missing", () => {
  const cwd = scaffold();
  const wp = join(cwd, "workplans");
  rmSync(join(wp, "README.md"));
  const r = run(["update"], cwd);
  assert.equal(r.status, 0);
  assert.ok(existsSync(join(wp, "README.md")));
  assert.match(readFileSync(join(wp, "README.md"), "utf8"), /Template readme/);
});
