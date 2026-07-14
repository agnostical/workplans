import { existsSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { compareVersions } from "../lib/semver.mjs";
import { parseFrontmatter, getField } from "../lib/frontmatter.mjs";
import { planFormat, reorderSections030, frontmatter040, validate040 } from "../lib/transitions.mjs";

/**
 * `workplans migrate` — bring plans up to the installed framework version.
 *
 * Scope (per the Compatibility spec): backlog/ by default, doing/ only with
 * --doing, done/ never (historical record). Content sections are preserved
 * byte for byte except the 0.2.x section reorder; only frontmatter and
 * section order change.
 */

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
