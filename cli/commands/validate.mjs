import { existsSync, readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parseFrontmatter, getField } from "../lib/frontmatter.mjs";
import { parseSettings, validatePlan, validateCorpus } from "../lib/validate.mjs";

/**
 * `workplans validate` — validate the whole corpus.
 *
 * Two severities with distinct exit codes: contract errors (objective
 * format violations, exit 1) and style warnings (editorial lints, exit 0).
 * Plans are validated against their own declared format, as Compatibility
 * defines. The command is optional tooling — RULES.md alone remains the
 * source of truth.
 */

const STATE_FOLDERS = ["backlog", "doing", "done"];

export async function runValidate(flags = new Set()) {
  const workplansDir = resolve(process.cwd(), "workplans");
  if (!existsSync(workplansDir)) {
    throw new Error(
      "workplans/ not found in the current directory.\n" +
      "Did you mean 'npx workplans init'?"
    );
  }

  let staleDays = 90;
  for (const flag of flags) {
    const m = flag.match(/^--stale-days=(\d+)$/);
    if (m) staleDays = Number(m[1]);
  }

  const errors = [];
  const warnings = [];

  // Structure: system files, state folders, foreign entries
  if (!existsSync(join(workplansDir, "RULES.md"))) {
    errors.push("RULES.md not found");
  } else {
    const rules = parseFrontmatter(await readFile(join(workplansDir, "RULES.md"), "utf8"));
    if (!rules || !getField(rules, "version")) errors.push("RULES.md — missing version field");
  }
  for (const folder of STATE_FOLDERS) {
    if (!existsSync(join(workplansDir, folder))) errors.push(`${folder}/ not found`);
    else if (!existsSync(join(workplansDir, folder, "README.md"))) errors.push(`${folder}/README.md not found`);
  }
  if (!existsSync(join(workplansDir, "README.md"))) errors.push("Root README.md not found");
  for (const entry of readdirSync(workplansDir, { withFileTypes: true })) {
    if (entry.isDirectory() && !STATE_FOLDERS.includes(entry.name) && entry.name !== "extend") {
      errors.push(`Foreign subfolder in workplans/: ${entry.name}/ (rule 34: single-project layout)`);
    }
  }

  // Settings: schema lint plus scale and roster inputs
  let scale = "fibonacci";
  let roster = null;
  const settingsPath = join(workplansDir, "settings.yml");
  if (existsSync(settingsPath)) {
    const { data, issues } = parseSettings(await readFile(settingsPath, "utf8"));
    warnings.push(...issues);
    if (data.estimate_scale) scale = data.estimate_scale;
    if (data.people) roster = new Set(Object.keys(data.people));
    const projectKeys = Object.keys(data.projects ?? {});
    if (projectKeys.length > 1) {
      warnings.push(`settings.yml — ${projectKeys.length} projects entries in a single-project workspace`);
    }
  } else {
    // Pre-0.5.0 home of the scale: the root README frontmatter
    const readmePath = join(workplansDir, "README.md");
    if (existsSync(readmePath)) {
      const readme = parseFrontmatter(await readFile(readmePath, "utf8"));
      const legacyScale = readme && getField(readme, "estimate_scale");
      if (legacyScale) scale = legacyScale;
    }
  }

  // Per-plan checks, then corpus-level checks over the collected graph
  const plans = [];
  let checked = 0;
  for (const folder of STATE_FOLDERS) {
    const dir = join(workplansDir, folder);
    if (!existsSync(dir)) continue;
    const files = readdirSync(dir).filter((f) => f.endsWith(".md") && f !== "README.md").sort();
    for (const name of files) {
      checked++;
      const buffer = await readFile(join(dir, name));
      let content;
      try {
        content = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
      } catch {
        errors.push(`${folder}/${name} — invalid UTF-8 encoding`);
        continue;
      }
      const result = validatePlan({
        folder, name, content, scale, roster, staleDays, now: Date.now(),
      });
      errors.push(...result.errors);
      warnings.push(...result.warnings);
      plans.push({ folder, name, id: result.id, relations: result.relations });
    }
  }
  const corpus = validateCorpus(plans);
  errors.push(...corpus.errors);
  warnings.push(...corpus.warnings);

  for (const message of errors) console.log(`  FAIL ${message}`);
  for (const message of warnings) console.log(`  WARN ${message}`);
  console.log("");
  console.log(`Plans checked: ${checked}`);
  console.log(`Errors:        ${errors.length}`);
  console.log(`Warnings:      ${warnings.length}`);
  console.log("");
  if (errors.length > 0) {
    console.log(`Validation failed with ${errors.length} error(s).`);
    process.exitCode = 1;
  } else {
    console.log(warnings.length > 0 ? "No contract errors; style warnings above." : "All checks passed.");
  }
}
