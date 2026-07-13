import { test } from "node:test";
import assert from "node:assert/strict";
import { parseVersion, compareVersions } from "../lib/semver.mjs";
import { readVersionFromRules } from "../lib/download.mjs";

test("parseVersion accepts plain and v-prefixed triples", () => {
  assert.deepEqual(parseVersion("0.3.1"), [0, 3, 1]);
  assert.deepEqual(parseVersion("v1.2.3"), [1, 2, 3]);
  assert.deepEqual(parseVersion(" 0.10.0 "), [0, 10, 0]);
});

test("parseVersion rejects invalid input", () => {
  assert.equal(parseVersion("0.3"), null);
  assert.equal(parseVersion("0.3.1-beta"), null);
  assert.equal(parseVersion("abc"), null);
  assert.equal(parseVersion(""), null);
  assert.equal(parseVersion(undefined), null);
});

test("compareVersions orders numerically, not lexicographically", () => {
  assert.equal(compareVersions("0.10.0", "0.9.9"), 1);
  assert.equal(compareVersions("0.9.9", "0.10.0"), -1);
  assert.equal(compareVersions("0.3.1", "0.3.1"), 0);
  assert.equal(compareVersions("1.0.0", "0.99.99"), 1);
  assert.equal(compareVersions("0.3.0", "0.3.1"), -1);
});

test("compareVersions returns null on unparseable input", () => {
  assert.equal(compareVersions("0.3", "0.3.1"), null);
  assert.equal(compareVersions("0.3.1", "nope"), null);
});

test("readVersionFromRules reads only the frontmatter block", () => {
  const content = `---
name: workplans
version: 0.3.1
---

# Rules

Some body with a YAML example:

\`\`\`yaml
version: 9.9.9
\`\`\`
`;
  assert.equal(readVersionFromRules(content), "0.3.1");
});

test("readVersionFromRules handles quoted values and missing fields", () => {
  assert.equal(readVersionFromRules(`---\nversion: "0.4.0"\n---\n`), "0.4.0");
  assert.equal(readVersionFromRules(`---\nname: workplans\n---\n`), null);
  assert.equal(readVersionFromRules(`no frontmatter here`), null);
});
