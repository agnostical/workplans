import { existsSync } from "node:fs";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { compareVersions } from "../lib/semver.mjs";
import { parseFrontmatter, getField, upsertReadmeWorkOn } from "../lib/frontmatter.mjs";
import {
  downloadInit,
  fetchRemoteVersion,
  readVersionFromRules,
  registerTempDir,
  unregisterTempDir,
} from "../lib/download.mjs";

// The root README is user-owned after init and is never overwritten here;
// update creates it from the template only when missing (#69).
const SYSTEM_FILES = ["RULES.md"];
const STATE_FOLDERS = ["backlog", "doing", "done"];

/**
 * One-time migration (#69): `work_on` used to live in the RULES.md
 * frontmatter, which update replaces. Move it to the root README
 * frontmatter — its home since 0.4.0 — before RULES.md is overwritten.
 * The default "." is not migrated: absent means "this same repo".
 */
async function migrateWorkOn(workplansDir) {
  const rulesPath = join(workplansDir, "RULES.md");
  if (!existsSync(rulesPath)) return;
  const parsed = parseFrontmatter(await readFile(rulesPath, "utf8"));
  if (!parsed) return;
  const workOn = getField(parsed, "work_on");
  if (!workOn || workOn === ".") return;

  const readmePath = join(workplansDir, "README.md");
  const readme = existsSync(readmePath) ? await readFile(readmePath, "utf8") : "";
  const updated = upsertReadmeWorkOn(readme, workOn);
  if (updated !== null) {
    await writeFile(readmePath, updated);
    console.log(`  Moved work_on to workplans/README.md frontmatter (${workOn})`);
  }
}

/**
 * One-time migration (#91): project settings used to live in the root README
 * frontmatter, with the machine-local `work_on` path in LOCAL.yml. Move both
 * into `settings.yml`/`settings.local.yml` — their home since 0.5.0 — and
 * return the README to its informative role. Nothing to declare, no file:
 * settings.yml appears only when a constant or local path exists.
 */
async function migrateToSettings(workplansDir) {
  if (existsSync(join(workplansDir, "settings.yml"))) return;

  const readmePath = join(workplansDir, "README.md");
  const readme = existsSync(readmePath) ? await readFile(readmePath, "utf8") : null;
  const parsed = readme ? parseFrontmatter(readme) : null;
  const constant = (key) => (parsed ? getField(parsed, key) : null);
  const workOn = constant("work_on");
  const tracker = constant("tracker");
  const estimateScale = constant("estimate_scale");

  const localPath = join(workplansDir, "LOCAL.yml");
  const localWorkOn = existsSync(localPath)
    ? (await readFile(localPath, "utf8")).match(/^work_on:\s*"?([^"\n]*)"?\s*$/m)?.[1] ?? null
    : null;

  if (!tracker && !estimateScale && (!workOn || workOn === ".") && !localWorkOn) return;

  const lines = [];
  if (tracker) lines.push(`tracker: "${tracker}"`);
  if (estimateScale) lines.push(`estimate_scale: "${estimateScale}"`);
  if (lines.length > 0) lines.push("");
  lines.push("projects:", "  main:");
  if (workOn && workOn !== ".") lines.push(`    work_on: "${workOn}"`);
  await writeFile(join(workplansDir, "settings.yml"), lines.join("\n") + "\n");
  console.log("  Moved project settings to workplans/settings.yml");

  if (localWorkOn) {
    await writeFile(
      join(workplansDir, "settings.local.yml"),
      `# Machine-local overrides. Do not commit.\nprojects:\n  main:\n    work_on: "${localWorkOn}"\n`
    );
    await rm(localPath);
    console.log("  Migrated workplans/LOCAL.yml to workplans/settings.local.yml");

    const gitignorePath = resolve(workplansDir, "..", ".gitignore");
    const gitignore = existsSync(gitignorePath) ? await readFile(gitignorePath, "utf8") : "";
    if (!gitignore.split("\n").includes("workplans/settings.local.yml")) {
      const sep = gitignore === "" || gitignore.endsWith("\n") ? "" : "\n";
      await writeFile(gitignorePath, `${gitignore}${sep}workplans/settings.local.yml\n`);
      console.log("  Added workplans/settings.local.yml to .gitignore");
    }
  }

  // Return the README to informative: drop the migrated constants from its
  // frontmatter, removing the block entirely when nothing else remains.
  if (parsed && (workOn || tracker || estimateScale)) {
    const content = readme.split("\n");
    const end = content.indexOf("---", 1);
    const kept = content
      .slice(1, end)
      .filter((line) => !/^(work_on|tracker|estimate_scale):/.test(line));
    const body = content.slice(end + 1);
    const rebuilt =
      kept.some((line) => line.trim() !== "")
        ? ["---", ...kept, "---", ...body]
        : body.slice(body[0] === "" ? 1 : 0);
    await writeFile(readmePath, rebuilt.join("\n"));
  }
}

async function readLocalVersion(rulesPath) {
  if (!existsSync(rulesPath)) return null;
  return readVersionFromRules(await readFile(rulesPath, "utf8"));
}

function reportSkip(cmp, localVersion, remoteVersion) {
  if (cmp === 0) {
    console.log("");
    console.log(`Workplans framework is already up to date (v${localVersion}).`);
    return true;
  }
  if (cmp === -1) {
    console.log("");
    console.log(
      `Local version (v${localVersion}) is newer than remote (v${remoteVersion}). Nothing to do.`
    );
    return true;
  }
  return false;
}

export async function runUpdate() {
  const workplansDir = resolve(process.cwd(), "workplans");

  if (!existsSync(workplansDir)) {
    throw new Error(
      "workplans/ not found in the current directory.\n" +
      "Did you mean 'npx workplans init'?"
    );
  }

  console.log("Updating workplans framework...");

  const localVersion = await readLocalVersion(join(workplansDir, "RULES.md"));

  // Cheap remote version check first: skip the full download when there is
  // nothing to update. Best effort — on failure we fall through to download.
  if (localVersion) {
    const remoteVersion = await fetchRemoteVersion();
    if (remoteVersion && reportSkip(compareVersions(remoteVersion, localVersion), localVersion, remoteVersion)) {
      return;
    }
  }

  console.log("  Downloading template...");
  const tempDir = await mkdtemp(join(tmpdir(), "workplans-update-"));
  registerTempDir(tempDir);

  try {
    await downloadInit(tempDir);

    const sourceDir = join(tempDir, "workplans");
    const remoteVersion = await readLocalVersion(join(sourceDir, "RULES.md"));

    // Authoritative comparison against the downloaded template.
    if (
      remoteVersion &&
      localVersion &&
      reportSkip(compareVersions(remoteVersion, localVersion), localVersion, remoteVersion)
    ) {
      return;
    }

    try {
      await migrateWorkOn(workplansDir);
      if (remoteVersion && (compareVersions(remoteVersion, "0.5.0") ?? -1) >= 0) {
        await migrateToSettings(workplansDir);
      }

      for (const file of SYSTEM_FILES) {
        await copyFile(join(sourceDir, file), join(workplansDir, file));
        console.log(`  Updated workplans/${file}`);
      }

      if (!existsSync(join(workplansDir, "README.md"))) {
        await copyFile(join(sourceDir, "README.md"), join(workplansDir, "README.md"));
        console.log("  Created workplans/README.md");
      }

      for (const folder of STATE_FOLDERS) {
        const target = join(workplansDir, folder);
        if (!existsSync(target)) {
          await mkdir(target, { recursive: true });
          console.log(`  Created workplans/${folder}/`);
        }
        await copyFile(
          join(sourceDir, folder, "README.md"),
          join(target, "README.md")
        );
        console.log(`  Updated workplans/${folder}/README.md`);
      }
    } catch (err) {
      if (err.code === "EACCES" || err.code === "EPERM") {
        throw new Error(
          "Permission denied writing to workplans/.\n" +
          "Check that you have write permissions here and try again."
        );
      }
      throw err;
    }

    console.log("");
    if (remoteVersion && localVersion) {
      console.log(`Updated to v${remoteVersion} (from v${localVersion}). User plans were not modified.`);
    } else if (remoteVersion) {
      console.log(`Updated to v${remoteVersion}. User plans were not modified.`);
    } else {
      console.log("Done. User plans were not modified.");
    }
  } finally {
    unregisterTempDir(tempDir);
    await rm(tempDir, { recursive: true, force: true });
  }
}
