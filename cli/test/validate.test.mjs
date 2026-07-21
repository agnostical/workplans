/**
 * Tests for `workplans validate` (#84): contract errors vs style lints,
 * corpus-level relation checks, settings schema lint, exit codes.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseSettings, validatePlan, validateCorpus } from "../lib/validate.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI = join(__dirname, "..", "bin", "cli.mjs");

function plan050({
  id = "2601000001",
  title = "Sample plan",
  state = "backlog",
  planner = "Alice",
  executor = "",
  estimate = "",
  backlog = "2026-07-01T09:00",
  doing = "",
  done = "",
  relations = "",
  brief = "A sample thing was asked for. It should work.",
  objective = "Deliver the sample thing. In scope: the thing; everything else stays out.",
  phase1 = "- [x] Define objective and context\n- [x] Define phases and steps\n- [x] Refine with the user",
  closing = "_To be written when the last phase is completed._",
} = {}) {
  return `---
format: "0.5.0"
id: ${id}
title: "${title}"
planner: "${planner}"
planner_model: "claude-opus-4-6"
executor: "${executor}"
executor_model: ""
state: "${state}"
backlog_date: "${backlog}"
doing_date: "${doing}"
done_date: "${done}"
priority: ""
estimate: "${estimate}"
tracked_in: ""
relations:${relations}
---

# ${title}

## Brief
${brief}

## Objective
${objective}

## Progress
### Phase 1: Definition
${phase1}

### Phase 2: Closing
- [${state === "done" ? "x" : " "}] Write Closing Summary
- [${state === "done" ? "x" : " "}] Validate implementation with the user

## Context
Some context.

## Implementation
### Phase 1: Definition
Define the Objective, Context, and subsequent phases. Once complete, the plan is ready for execution.

### Phase 2: Closing
Validate the implementation with the user and write the Closing Summary. Once complete, the plan is ready to move to done.

## Closing Summary
${closing}
`;
}

const CTX = { scale: "fibonacci", roster: null, staleDays: 90, now: new Date("2026-07-20T12:00").getTime() };
const run = (opts) => validatePlan({ folder: "backlog", name: "2601000001_sample-plan.md", content: plan050(opts), ...CTX, ...opts?.ctx });

test("a clean 0.5.0 plan passes with no errors or warnings", () => {
  const r = run();
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
  assert.equal(r.id, "2601000001");
});

test("contract errors: state, dates, order and emoji", () => {
  const bad = validatePlan({
    folder: "doing",
    name: "2601000001_sample-plan.md",
    content: plan050({ state: "backlog", doing: "", done: "2026-07-02T10:00" }).replace("Some context.", "Some context 🎉."),
    ...CTX,
  });
  assert.ok(bad.errors.some((e) => e.includes("state mismatch")));
  assert.ok(bad.errors.some((e) => e.includes("doing plan needs doing_date")));
  assert.ok(bad.errors.some((e) => e.includes("emojis")));
});

test("contract errors: blocked_by targeting the parent", () => {
  const r = run({ relations: "\n  blocked_by: \"2601000002\"\n  parent: \"2601000002\"" });
  assert.ok(r.errors.some((e) => e.includes("blocked_by targets the plan's own parent")));
});

test("done plan with placeholder Closing Summary fails; missing link in References warns", () => {
  const r = validatePlan({
    folder: "done",
    name: "2601000001_sample-plan.md",
    content: plan050({ state: "done", doing: "2026-07-02T10:00", done: "2026-07-03T10:00" }),
    ...CTX,
  });
  assert.ok(r.errors.some((e) => e.includes("still has the placeholder")));

  const ok = validatePlan({
    folder: "done",
    name: "2601000001_sample-plan.md",
    content: plan050({
      state: "done", doing: "2026-07-02T10:00", done: "2026-07-03T10:00",
      closing: "The thing shipped complete. It was verified end to end. Nothing was deferred.\n\n### References\n- PR without a link",
    }),
    ...CTX,
  });
  assert.deepEqual(ok.errors, []);
  assert.ok(ok.warnings.some((w) => w.includes("References bullet without a link")));
});

test("style lints: objective, brief, executor in backlog, premature estimate, stale backlog", () => {
  const r = validatePlan({
    folder: "backlog",
    name: "2601000001_sample-plan.md",
    content: plan050({
      executor: "Bob",
      estimate: "5",
      backlog: "2026-01-01T09:00",
      phase1: "- [x] Define objective and context\n- [ ] Define phases and steps\n- [ ] Refine with the user",
      brief: "One. Two. Three. Four. Five sentences here.",
      objective: "Deliver the thing, see [docs](https://example.com).",
    }),
    ...CTX,
  });
  assert.deepEqual(r.errors, []);
  assert.ok(r.warnings.some((w) => w.includes("Objective carries links")));
  assert.ok(r.warnings.some((w) => w.includes("Brief has 5 sentences")));
  assert.ok(r.warnings.some((w) => w.includes("executor set while in backlog")));
  assert.ok(r.warnings.some((w) => w.includes("estimate set while Phase 1")));
  assert.ok(r.warnings.some((w) => w.includes("in backlog for")));
});

test("roster lint flags unresolvable attribution", () => {
  const r = run({ ctx: { roster: new Set(["Alice"]) }, planner: "A. Example" });
  assert.ok(r.warnings.some((w) => w.includes("planner 'A. Example' not resolvable")));
});

test("language lint flags English canonical steps on an accented plan", () => {
  const r = run({ title: "Configuración de prueba" });
  assert.ok(r.warnings.some((w) => w.includes("read as English")));
});

test("corpus checks: duplicates, missing targets, redundant and bilateral pairs", () => {
  const corpus = validateCorpus([
    { folder: "backlog", name: "a.md", id: "1", relations: { blocked_by: ["2"], relates_to: ["2", "9"] } },
    { folder: "backlog", name: "b.md", id: "2", relations: { relates_to: ["1"] } },
    { folder: "done", name: "c.md", id: "2", relations: {} },
  ]);
  assert.ok(corpus.errors.some((e) => e.includes("duplicate ID 2")));
  assert.ok(corpus.warnings.some((w) => w.includes("cites id 9")));
  assert.ok(corpus.warnings.some((w) => w.includes("redundant pair")));
  assert.ok(corpus.warnings.some((w) => w.includes("bilateral relates_to")));
});

test("parseSettings flags schema problems without crashing", () => {
  const { data, issues } = parseSettings(
    `tracker: "https://github.com/acme/a"\nunknown_key: "x"\n\nprojects:\n  main:\n    work_on: "."\n  extra:\n    work_on: "."\n\npeople:\n  Alice: "alice@acme.example"\n  Bob:\n    github: "bob-acme"\n`
  );
  assert.equal(data.tracker, "https://github.com/acme/a");
  assert.equal(Object.keys(data.projects).length, 2);
  assert.ok(issues.some((i) => i.includes("unknown key 'unknown_key'")));
  assert.ok(issues.some((i) => i.includes("'Bob' (extended form) has no email")));
});

// ─── integration through the CLI ────────────────────────────────

function workspace() {
  const cwd = mkdtempSync(join(tmpdir(), "workplans-validate-"));
  const wp = join(cwd, "workplans");
  for (const folder of ["backlog", "doing", "done"]) {
    mkdirSync(join(wp, folder), { recursive: true });
    writeFileSync(join(wp, folder, "README.md"), `# ${folder}\n`);
  }
  writeFileSync(join(wp, "RULES.md"), `---\nname: workplans\nversion: 0.5.0\n---\n\n# Rules\n`);
  writeFileSync(join(wp, "README.md"), `# My project\n`);
  return cwd;
}

test("validate exits 0 on a clean corpus and 1 on contract errors", () => {
  const cwd = workspace();
  writeFileSync(join(cwd, "workplans", "backlog", "2601000001_sample-plan.md"), plan050());
  let r = spawnSync(process.execPath, [CLI, "validate", "--stale-days=9999"], { cwd, encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /All checks passed/);

  writeFileSync(
    join(cwd, "workplans", "backlog", "2601000002_broken-plan.md"),
    plan050({ id: "2601000002", state: "doing" })
  );
  r = spawnSync(process.execPath, [CLI, "validate", "--stale-days=9999"], { cwd, encoding: "utf8" });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /state mismatch/);
});

test("validate reads scale and roster from settings.yml and lints extra projects", () => {
  const cwd = workspace();
  writeFileSync(
    join(cwd, "workplans", "settings.yml"),
    `estimate_scale: "tshirt"\n\nprojects:\n  main:\n  extra:\n\npeople:\n  Alice: "alice@acme.example"\n`
  );
  writeFileSync(
    join(cwd, "workplans", "backlog", "2601000001_sample-plan.md"),
    plan050({ estimate: "5", planner: "Zoe" })
  );
  const r = spawnSync(process.execPath, [CLI, "validate", "--stale-days=9999"], { cwd, encoding: "utf8" });
  assert.equal(r.status, 1, r.stdout);
  assert.match(r.stdout, /estimate '5' not in the tshirt scale/);
  assert.match(r.stdout, /planner 'Zoe' not resolvable/);
  assert.match(r.stdout, /2 projects entries in a single-project workspace/);
});
