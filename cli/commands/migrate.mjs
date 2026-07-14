import { existsSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { compareVersions } from "../lib/semver.mjs";
import { parseFrontmatter, getField } from "../lib/frontmatter.mjs";

/**
 * `workplans migrate` — bring plans up to the installed framework version.
 *
 * Scope (per the Compatibility spec): backlog/ by default, doing/ only with
 * --doing, done/ never (historical record). Content sections are preserved
 * byte for byte except the 0.2.x section reorder; only frontmatter and
 * section order change.
 */

// 0.4.0 frontmatter contract: exact field order and empty forms.
const FIELDS_040 = [
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

const SECTION_ORDER_030 = ["Objective", "Progress", "Context", "Implementation", "Closing Summary"];

const SCALES = {
  fibonacci: ["1", "2", "3", "5", "8", "13", "21"],
  tshirt: ["xs", "s", "m", "l", "xl"],
};

/** Declared plan format: `format` with `format_version` as read-alias. */
function planFormat(parsed) {
  return getField(parsed, "format") ?? getField(parsed, "format_version");
}

/** Reorders the five H2 sections to the 0.3.0 layout (Objective first). */
function reorderSections030(body) {
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
 * Rebuilds the frontmatter in the 0.4.0 contract. Returns the new block
 * lines, or throws when the plan carries fields outside the schema.
 */
function frontmatter040(parsed) {
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

/** Validates the migrated frontmatter against the 0.4.0 contract. */
function validate040(content, scale) {
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

async function migratePlan(path, currentVersion, scale, dryRun) {
  const content = await readFile(path, "utf8");
  const parsed = parseFrontmatter(content);
  if (!parsed) throw new Error("no frontmatter");

  const from = planFormat(parsed) ?? "pre-0.2.1";
  const cmpCurrent = compareVersions(from, currentVersion);
  if (cmpCurrent !== null && cmpCurrent >= 0) return null;

  let body = parsed.body;
  const cmp030 = compareVersions(from, "0.3.0");
  if (cmp030 === null || cmp030 < 0) {
    body = reorderSections030(body);
  }
  const migrated = `${frontmatter040(parsed)}\n${body}`;
  validate040(migrated, scale);

  if (!dryRun) await writeFile(path, migrated);
  return { from, to: "0.4.0" };
}

export async function runMigrate(flags = new Set()) {
  const workplansDir = resolve(process.cwd(), "workplans");
  if (!existsSync(workplansDir)) {
    throw new Error(
      "workplans/ not found in the current directory.\n" +
      "Did you mean 'npx workplans init'?"
    );
  }

  const rules = existsSync(join(workplansDir, "RULES.md"))
    ? parseFrontmatter(await readFile(join(workplansDir, "RULES.md"), "utf8"))
    : null;
  const currentVersion = rules ? getField(rules, "version") : null;
  if (!currentVersion) {
    throw new Error("Could not read the framework version from workplans/RULES.md.");
  }
  if (compareVersions(currentVersion, "0.4.0") < 0) {
    throw new Error(
      `Installed framework is v${currentVersion}; migrate targets 0.4.0+.\n` +
      "Run 'npx workplans update' first."
    );
  }

  const readmePath = join(workplansDir, "README.md");
  const readme = existsSync(readmePath)
    ? parseFrontmatter(await readFile(readmePath, "utf8"))
    : null;
  const scale = (readme && getField(readme, "estimate_scale")) || "fibonacci";

  const dryRun = flags.has("--dry-run");
  const folders = ["backlog", ...(flags.has("--doing") ? ["doing"] : [])];

  console.log(`Migrating plans to format ${currentVersion}${dryRun ? " (dry run)" : ""}...`);
  console.log(`  Scope: ${folders.join(", ")} (done/ is never migrated)`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const folder of folders) {
    const dir = join(workplansDir, folder);
    if (!existsSync(dir)) continue;
    const files = (await readdir(dir)).filter((f) => f.endsWith(".md") && f !== "README.md").sort();
    for (const file of files) {
      const rel = `${folder}/${file}`;
      try {
        const result = await migratePlan(join(dir, file), currentVersion, scale, dryRun);
        if (result === null) {
          skipped++;
        } else {
          migrated++;
          console.log(`  ${dryRun ? "Would migrate" : "Migrated"} ${rel}: ${result.from} -> ${result.to}`);
        }
      } catch (err) {
        failed++;
        console.error(`  Skipped ${rel}: ${err.message}`);
      }
    }
  }

  console.log("");
  const verb = dryRun ? "would be migrated" : "migrated";
  console.log(`${migrated} plan(s) ${verb}, ${skipped} already current${failed ? `, ${failed} failed` : ""}.`);
  if (failed > 0) process.exitCode = 1;
}
