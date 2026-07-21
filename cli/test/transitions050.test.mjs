/**
 * 0.5.0 transition tests (#81, #85): attribution rename with field reorder,
 * read-alias fallback, and the catalog contract — every shipped template must
 * land as a valid 0.5.0 plan when added on a 0.5.0 framework. Offline via
 * WORKPLANS_TEMPLATES_SOURCE pointed at the repo's own templates/.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrontmatter, getField, getFieldAliased } from "../lib/frontmatter.mjs";
import { transitionTo050, validate050, FIELDS_050 } from "../lib/transitions.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI = join(__dirname, "..", "bin", "cli.mjs");
const TEMPLATES_DIR = join(__dirname, "..", "..", "templates");

const PLAN_040 = `---
format: "0.4.0"
id: 2606455842
title: "Sample plan"
priority: "high"
estimate: "5"
author: "Alice,Bob"
author_model: "claude-opus-4-6,"
assignee: "Alice"
assignee_model: "claude-opus-4-6"
state: "doing"
backlog_date: "2026-03-05T15:30"
doing_date: "2026-03-06T09:00"
done_date: ""
tracked_in: ""
relations:
  relates_to: "2606123456"
---

# Sample plan

## Objective
Do the thing.
`;

const PLAN_020 = `---
format_version: "0.2.0"
id: 2606455842
title: "Legacy plan"
author: "Alice"
state: "backlog"
backlog_date: "2026-03-05T15:30"
---

# Legacy plan

## Progress
### Phase 1: Definition
- [ ] Define objective and context

## Objective
Do the thing.
`;

// ─── transition unit tests ──────────────────────────────────────

test("transitionTo050 renames attribution and reorders triage fields", () => {
  const migrated = transitionTo050(PLAN_040);
  validate050(migrated, "fibonacci");
  const parsed = parseFrontmatter(migrated);
  assert.equal(getField(parsed, "format"), "0.5.0");
  assert.equal(getField(parsed, "planner"), "Alice,Bob");
  assert.equal(getField(parsed, "planner_model"), "claude-opus-4-6,");
  assert.equal(getField(parsed, "executor"), "Alice");
  assert.equal(getField(parsed, "executor_model"), "claude-opus-4-6");
  assert.equal(getField(parsed, "author"), null);
  assert.equal(getField(parsed, "assignee"), null);
  const order = parsed.fields.filter((f) => f.indent === 0).map((f) => f.key);
  assert.deepEqual(order, FIELDS_050);
  assert.match(migrated, /^  relates_to: "2606123456"$/m);
  assert.match(migrated, /## Brief\n_No brief: this plan predates the Brief section\._\n\n## Objective\nDo the thing\./);
});

test("transitionTo050 leaves a 0.5.0 plan unchanged", () => {
  const migrated = transitionTo050(PLAN_040);
  assert.equal(transitionTo050(migrated), migrated);
});

test("transitionTo050 chains the legacy section reorder", () => {
  const migrated = transitionTo050(PLAN_020);
  validate050(migrated, "fibonacci");
  const parsed = parseFrontmatter(migrated);
  assert.equal(getField(parsed, "planner"), "Alice");
  assert.ok(
    migrated.indexOf("## Objective") < migrated.indexOf("## Progress"),
    "sections should follow the new layout (Objective first)"
  );
  assert.ok(
    migrated.indexOf("## Brief") < migrated.indexOf("## Objective"),
    "migration placeholder Brief should open the plan"
  );
});

test("getFieldAliased reads old names as fallback and prefers the new ones", () => {
  const old = parseFrontmatter(PLAN_040);
  assert.equal(getFieldAliased(old, "planner"), "Alice,Bob");
  assert.equal(getFieldAliased(old, "executor_model"), "claude-opus-4-6");
  assert.equal(getFieldAliased(old, "format"), "0.4.0");
  const migrated = parseFrontmatter(transitionTo050(PLAN_040));
  assert.equal(getFieldAliased(migrated, "planner"), "Alice,Bob");
  assert.equal(getFieldAliased(migrated, "format"), "0.5.0");
});

// ─── catalog contract ───────────────────────────────────────────

function buildWorkspace(version) {
  const src = mkdtempSync(join(tmpdir(), "workplans-050-"));
  const wp = join(src, "workplans");
  mkdirSync(wp, { recursive: true });
  writeFileSync(
    join(wp, "RULES.md"),
    `---\nname: workplans\nversion: ${version}\n---\n\n# Workplans: Rules\n\nFixture rules.\n`
  );
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
    env: { ...process.env, WORKPLANS_TEMPLATES_SOURCE: TEMPLATES_DIR },
  });
}

test("every catalog template instantiates as a valid 0.5.0 plan", () => {
  const index = JSON.parse(readFileSync(join(TEMPLATES_DIR, "index.json"), "utf8"));
  assert.ok(index.templates.length > 0, "catalog is empty");

  const src = buildWorkspace("0.5.0");
  try {
    for (const { name } of index.templates) {
      const res = run(["add", name], src);
      assert.equal(res.status, 0, `add ${name} failed: ${res.stderr || res.stdout}`);
      const file = readdirSync(join(src, "workplans", "backlog")).find((f) =>
        f.endsWith(`_${name}.md`)
      );
      assert.ok(file, `no plan created for ${name}`);
      const content = readFileSync(join(src, "workplans", "backlog", file), "utf8");
      validate050(content, "fibonacci");
      const parsed = parseFrontmatter(content);
      assert.equal(getField(parsed, "format"), "0.5.0");
      assert.equal(getField(parsed, "state"), "backlog");
      assert.equal(getField(parsed, "planner"), "");
      assert.equal(getField(parsed, "executor"), "");
      assert.match(content, /^## Brief$/m, `${name} should carry its Brief seed`);
      assert.ok(
        !content.includes("_No brief:"),
        `${name} should not inherit the migration placeholder`
      );
    }
  } finally {
    rmSync(src, { recursive: true, force: true });
  }
});
