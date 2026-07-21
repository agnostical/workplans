/**
 * Per-version format transitions (the Compatibility section's transition
 * table). Pure content-in/content-out helpers shared by `migrate` and `add`.
 */

import { compareVersions } from "./semver.mjs";
import { parseFrontmatter, getField, getFieldAliased } from "./frontmatter.mjs";

// 0.4.0 frontmatter contract: exact field order and empty forms.
export const FIELDS_040 = [
  "format",
  "id",
  "title",
  "priority",
  "estimate",
  "author",
  "author_model",
  "assignee",
  "assignee_model",
  "state",
  "backlog_date",
  "doing_date",
  "done_date",
  "tracked_in",
  "relations",
];

// 0.5.0 frontmatter contract: attribution renamed to planner/executor and
// priority/estimate moved below done_date into the trailing optional block.
export const FIELDS_050 = [
  "format",
  "id",
  "title",
  "planner",
  "planner_model",
  "executor",
  "executor_model",
  "state",
  "backlog_date",
  "doing_date",
  "done_date",
  "priority",
  "estimate",
  "tracked_in",
  "relations",
];

// 0.4.x → 0.5.0 mechanical key renames; the old names stay read-aliases.
export const RENAMES_050 = {
  planner: "author",
  planner_model: "author_model",
  executor: "assignee",
  executor_model: "assignee_model",
};

export const SCALES = {
  fibonacci: ["1", "2", "3", "5", "8", "13", "21"],
  tshirt: ["xs", "s", "m", "l", "xl"],
};

const SECTION_ORDER_030 = ["Objective", "Progress", "Context", "Implementation", "Closing Summary"];

/** Declared plan format: `format` with `format_version` as read-alias. */
export function planFormat(parsed) {
  return getFieldAliased(parsed, "format");
}

/** Reorders the five H2 sections to the 0.3.0 layout (Objective first). */
export function reorderSections030(body) {
  const lines = body.split("\n");
  const starts = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^## /.test(lines[i])) starts.push(i);
  }
  if (starts.length === 0) return body;

  const preamble = lines.slice(0, starts[0]).join("\n");
  const sections = starts.map((start, idx) => {
    const end = idx + 1 < starts.length ? starts[idx + 1] : lines.length;
    return { name: lines[start].replace(/^## /, "").trim(), text: lines.slice(start, end).join("\n") };
  });

  const known = SECTION_ORDER_030.filter((name) => sections.some((s) => s.name === name));
  const ordered = [];
  let cursor = 0;
  for (const section of sections) {
    if (known.includes(section.name)) {
      ordered.push(sections.find((s) => s.name === known[cursor]));
      cursor++;
    } else {
      ordered.push(section);
    }
  }
  return [preamble, ...ordered.map((s) => s.text)].join("\n");
}

/**
 * Rebuilds the frontmatter in the 0.4.0 contract. Throws when the plan
 * carries fields outside the schema (fix those manually first).
 */
export function frontmatter040(parsed) {
  const top = parsed.fields.filter((f) => f.indent === 0);
  const knownSource = new Set([...FIELDS_040, "format_version"]);
  const unknown = top.filter((f) => !knownSource.has(f.key)).map((f) => f.key);
  if (unknown.length > 0) {
    throw new Error(`unknown frontmatter field(s): ${unknown.join(", ")} — fix manually first`);
  }

  const raw = (key) => top.find((f) => f.key === key)?.raw ?? null;
  const lines = ["---"];
  for (const key of FIELDS_040) {
    if (key === "format") {
      lines.push(`format: "0.4.0"`);
    } else if (key === "relations") {
      // Nested sub-keys survive as written; the empty form is the bare key.
      const subs = parsed.fields.filter((f) => f.indent > 0);
      lines.push("relations:");
      for (const sub of subs) lines.push(`  ${sub.key}: ${sub.raw}`);
    } else {
      lines.push(`${key}: ${raw(key) ?? '""'}`);
    }
  }
  lines.push("---");
  return lines.join("\n");
}

/** Validates a plan's frontmatter against the 0.4.0 contract. Throws on violation. */
export function validate040(content, scale) {
  const parsed = parseFrontmatter(content);
  const order = parsed.fields.filter((f) => f.indent === 0).map((f) => f.key);
  if (order.join(" ") !== FIELDS_040.join(" ")) {
    throw new Error(`migrated frontmatter is out of order: [${order.join(", ")}]`);
  }
  const estimate = getField(parsed, "estimate");
  const tokens = SCALES[scale];
  if (estimate && tokens && !tokens.includes(estimate)) {
    throw new Error(`estimate '${estimate}' is not in the ${scale} scale`);
  }
}

/**
 * Rebuilds the frontmatter in the 0.5.0 contract, renaming the four
 * attribution keys from their pre-0.5.0 aliases. Throws when the plan
 * carries fields outside the schema (fix those manually first).
 */
export function frontmatter050(parsed) {
  const top = parsed.fields.filter((f) => f.indent === 0);
  const knownSource = new Set([...FIELDS_050, ...Object.values(RENAMES_050), "format_version"]);
  const unknown = top.filter((f) => !knownSource.has(f.key)).map((f) => f.key);
  if (unknown.length > 0) {
    throw new Error(`unknown frontmatter field(s): ${unknown.join(", ")} — fix manually first`);
  }

  const raw = (key) => top.find((f) => f.key === key)?.raw ?? null;
  const lines = ["---"];
  for (const key of FIELDS_050) {
    if (key === "format") {
      lines.push(`format: "0.5.0"`);
    } else if (key === "relations") {
      // Nested sub-keys survive as written; the empty form is the bare key.
      const subs = parsed.fields.filter((f) => f.indent > 0);
      lines.push("relations:");
      for (const sub of subs) lines.push(`  ${sub.key}: ${sub.raw}`);
    } else {
      const value = raw(key) ?? (RENAMES_050[key] ? raw(RENAMES_050[key]) : null);
      lines.push(`${key}: ${value ?? '""'}`);
    }
  }
  lines.push("---");
  return lines.join("\n");
}

/** Validates a plan's frontmatter against the 0.5.0 contract. Throws on violation. */
export function validate050(content, scale) {
  const parsed = parseFrontmatter(content);
  const order = parsed.fields.filter((f) => f.indent === 0).map((f) => f.key);
  if (order.join(" ") !== FIELDS_050.join(" ")) {
    throw new Error(`migrated frontmatter is out of order: [${order.join(", ")}]`);
  }
  const estimate = getField(parsed, "estimate");
  const tokens = SCALES[scale];
  if (estimate && tokens && !tokens.includes(estimate)) {
    throw new Error(`estimate '${estimate}' is not in the ${scale} scale`);
  }
}

/**
 * Applies the documented transitions to bring a plan to 0.4.0. Returns the
 * content unchanged when the plan already declares 0.4.0 or newer.
 */
export function transitionTo040(content, scale = "fibonacci") {
  const parsed = parseFrontmatter(content);
  if (!parsed) throw new Error("no frontmatter");

  const from = planFormat(parsed);
  const cmp = from === null ? null : compareVersions(from, "0.4.0");
  if (cmp !== null && cmp >= 0) return content;

  let body = parsed.body;
  const cmp030 = from === null ? null : compareVersions(from, "0.3.0");
  if (cmp030 === null || cmp030 < 0) {
    body = reorderSections030(body);
  }
  const migrated = `${frontmatter040(parsed)}\n${body}`;
  validate040(migrated, scale);
  return migrated;
}

const BRIEF_PLACEHOLDER = "_No brief: this plan predates the Brief section._";

/**
 * Inserts `## Brief` with the migration placeholder before `## Objective`
 * (0.4.x → 0.5.0 transition row). Never fabricates a seed: a plan that
 * already carries a Brief passes through untouched.
 */
export function insertBriefPlaceholder(body) {
  if (/^## Brief$/m.test(body)) return body;
  const lines = body.split("\n");
  const at = lines.findIndex((line) => line === "## Objective");
  if (at === -1) return body;
  lines.splice(at, 0, "## Brief", BRIEF_PLACEHOLDER, "");
  return lines.join("\n");
}

/**
 * Applies the documented transitions to bring a plan to 0.5.0. Returns the
 * content unchanged when the plan already declares 0.5.0 or newer.
 */
export function transitionTo050(content, scale = "fibonacci") {
  const parsed = parseFrontmatter(content);
  if (!parsed) throw new Error("no frontmatter");

  const from = planFormat(parsed);
  const cmp = from === null ? null : compareVersions(from, "0.5.0");
  if (cmp !== null && cmp >= 0) return content;

  let body = parsed.body;
  const cmp030 = from === null ? null : compareVersions(from, "0.3.0");
  if (cmp030 === null || cmp030 < 0) {
    body = reorderSections030(body);
  }
  body = insertBriefPlaceholder(body);
  const migrated = `${frontmatter050(parsed)}\n${body}`;
  validate050(migrated, scale);
  return migrated;
}
