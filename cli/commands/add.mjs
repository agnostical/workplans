import { existsSync, readdirSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fetchTemplate, readVersionFromRules } from "../lib/download.mjs";
import { generateId, frontmatterDate } from "../lib/planid.mjs";
import { compareVersions } from "../lib/semver.mjs";
import { transitionTo040 } from "../lib/transitions.mjs";

/**
 * Rewrites the template frontmatter for a fresh plan: new id, backlog state,
 * creation date now, format_version from the local RULES.md. Authorship fields
 * stay empty — the plan belongs to whoever refines it.
 */
function instantiate(content, { id, date, formatVersion }) {
  const fm = content.match(/^---\n[\s\S]*?\n---/);
  if (!fm) throw new Error("Template is malformed (missing frontmatter). Please report this issue.");
  let block = fm[0];
  block = block.replace(/^id:.*$/m, `id: ${id}`);
  block = block.replace(/^state:.*$/m, `state: "backlog"`);
  block = block.replace(/^backlog_date:.*$/m, `backlog_date: "${date}"`);
  block = block.replace(/^doing_date:.*$/m, `doing_date: ""`);
  block = block.replace(/^done_date:.*$/m, `done_date: ""`);
  if (formatVersion) {
    block = block.replace(/^format_version:.*$/m, `format_version: "${formatVersion}"`);
  }
  return content.replace(fm[0], block);
}

export async function runAdd(name) {
  const workplansDir = resolve(process.cwd(), "workplans");
  const backlogDir = join(workplansDir, "backlog");

  if (!existsSync(backlogDir)) {
    throw new Error(
      "workplans/backlog/ not found in the current directory.\n" +
      "Did you mean 'npx workplans init'?"
    );
  }

  // Non-destructive: one instance of a template per backlog.
  const existing = readdirSync(backlogDir).find((f) => f.endsWith(`_${name}.md`));
  if (existing) {
    throw new Error(
      `A plan from this template already exists: workplans/backlog/${existing}\n` +
      "Rename or complete it before adding the template again."
    );
  }

  console.log(`Fetching template '${name}'...`);
  const content = await fetchTemplate(name);
  if (content === null) {
    throw new Error(
      `Template '${name}' not found.\n` +
      "See available templates with 'npx workplans list'."
    );
  }

  // Ids are seconds-precision: two adds in the same second would collide,
  // and relations reference plans by bare id. Advance one second until free
  // across all state folders.
  let now = new Date();
  let id = generateId(now);
  const idTaken = (candidate) =>
    ["backlog", "doing", "done"].some((folder) => {
      const dir = join(workplansDir, folder);
      return existsSync(dir) && readdirSync(dir).some((f) => f.startsWith(`${candidate}_`));
    });
  while (idTaken(id)) {
    now = new Date(now.getTime() + 1000);
    id = generateId(now);
  }

  const rulesPath = join(workplansDir, "RULES.md");
  const formatVersion = existsSync(rulesPath)
    ? readVersionFromRules(await readFile(rulesPath, "utf8"))
    : null;

  // On a 0.4.0+ framework, keep the template's own declared format and apply
  // the documented transition instead of stamping a version the shape of the
  // frontmatter would contradict.
  const needs040 =
    formatVersion !== null && (compareVersions(formatVersion, "0.4.0") ?? -1) >= 0;
  let plan = instantiate(content, {
    id,
    date: frontmatterDate(now),
    formatVersion: needs040 ? null : formatVersion,
  });
  if (needs040) plan = transitionTo040(plan);
  const filename = `${id}_${name}.md`;

  try {
    await writeFile(join(backlogDir, filename), plan, { flag: "wx" });
  } catch (err) {
    if (err.code === "EACCES" || err.code === "EPERM") {
      throw new Error(
        "Permission denied writing to workplans/backlog/.\n" +
        "Check that you have write permissions here and try again."
      );
    }
    throw err;
  }

  console.log("");
  console.log(`Done. Created workplans/backlog/${filename}`);
  console.log("");
  console.log("Next steps:");
  console.log("  - Complete Phase 1: Definition with your agent (refine objective, phases and steps)");
  console.log("  - Move the plan to doing/ when Phase 1 is checked");
}
