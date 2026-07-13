/**
 * Integration tests: run the real binary via child_process against a local
 * template fixture (WORKPLANS_TEMPLATE_SOURCE), fully offline.
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
const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8"));

let fixtureDir;

function buildFixture(version) {
  const src = mkdtempSync(join(tmpdir(), "workplans-fixture-"));
  const wp = join(src, "workplans");
  mkdirSync(wp, { recursive: true });
  writeFileSync(
    join(wp, "RULES.md"),
    `---\nname: workplans\nversion: ${version}\n---\n\n# Workplans: Rules\n\nFixture rules.\n`
  );
  writeFileSync(join(wp, "README.md"), `# Workplans\n\nFixture readme.\n`);
  for (const folder of ["backlog", "doing", "done"]) {
    mkdirSync(join(wp, folder), { recursive: true });
    writeFileSync(join(wp, folder, "README.md"), `# ${folder}\n`);
  }
  return src;
}

function run(args, cwd, env = {}) {
  return spawnSync(process.execPath, [CLI, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, WORKPLANS_TEMPLATE_SOURCE: fixtureDir, ...env },
  });
}

function freshDir() {
  return mkdtempSync(join(tmpdir(), "workplans-cwd-"));
}

before(() => {
  fixtureDir = buildFixture("0.9.0");
});

after(() => {
  rmSync(fixtureDir, { recursive: true, force: true });
});

test("--version prints the package version with exit 0", () => {
  const r = run(["--version"], freshDir());
  assert.equal(r.status, 0);
  assert.equal(r.stdout.trim(), pkg.version);
});

test("--help shows usage and known commands with exit 0", () => {
  const r = run(["--help"], freshDir());
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Usage:/);
  assert.match(r.stdout, /init/);
  assert.match(r.stdout, /update/);
});

test("unknown command exits 1 and shows help", () => {
  const r = run(["frobnicate"], freshDir());
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Unknown command: frobnicate/);
  assert.match(r.stderr, /Usage:/);
});

test("extra positional arguments are rejected with exit 1", () => {
  const r = run(["update", "extra"], freshDir());
  assert.equal(r.status, 1);
  assert.match(r.stderr, /expects 0 argument/);
});

test("init scaffolds workplans/ in a clean directory", () => {
  const cwd = freshDir();
  const r = run(["init"], cwd);
  assert.equal(r.status, 0);
  assert.ok(existsSync(join(cwd, "workplans", "RULES.md")));
  assert.ok(existsSync(join(cwd, "workplans", "backlog", "README.md")));
  assert.ok(existsSync(join(cwd, "workplans", "doing")));
  assert.ok(existsSync(join(cwd, "workplans", "done")));
});

test("init fails clearly when workplans/ already exists", () => {
  const cwd = freshDir();
  assert.equal(run(["init"], cwd).status, 0);
  const r = run(["init"], cwd);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /already exists/);
  assert.match(r.stderr, /npx workplans update/);
});

test("update fails clearly when workplans/ does not exist", () => {
  const r = run(["update"], freshDir());
  assert.equal(r.status, 1);
  assert.match(r.stderr, /workplans\/ not found/);
  assert.match(r.stderr, /npx workplans init/);
});

test("update skips the download when local version equals remote", () => {
  const cwd = freshDir();
  run(["init"], cwd);
  const r = run(["update"], cwd);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /already up to date \(v0\.9\.0\)/);
  assert.doesNotMatch(r.stdout, /Downloading/);
});

test("update skips when local version is newer than remote", () => {
  const cwd = freshDir();
  run(["init"], cwd);
  const rules = join(cwd, "workplans", "RULES.md");
  writeFileSync(rules, readFileSync(rules, "utf8").replace("version: 0.9.0", "version: 9.9.9"));
  const r = run(["update"], cwd);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /is newer than remote/);
});

test("update refreshes system files and preserves user plans when remote is newer", () => {
  const cwd = freshDir();
  run(["init"], cwd);

  // Simulate an older local install and a user plan.
  const rules = join(cwd, "workplans", "RULES.md");
  writeFileSync(rules, readFileSync(rules, "utf8").replace("version: 0.9.0", "version: 0.1.0"));
  const planPath = join(cwd, "workplans", "backlog", "2601551600_user-plan.md");
  writeFileSync(planPath, "user plan content — must survive update\n");
  rmSync(join(cwd, "workplans", "done"), { recursive: true });

  const r = run(["update"], cwd);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Updated to v0\.9\.0 \(from v0\.1\.0\)/);
  assert.match(readFileSync(rules, "utf8"), /version: 0\.9\.0/);
  assert.equal(readFileSync(planPath, "utf8"), "user plan content — must survive update\n");
  assert.ok(existsSync(join(cwd, "workplans", "done", "README.md")), "missing state folder is recreated");
});
