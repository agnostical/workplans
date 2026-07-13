import { existsSync } from "node:fs";
import { copyFile, mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { compareVersions } from "../lib/semver.mjs";
import {
  downloadInit,
  fetchRemoteVersion,
  readVersionFromRules,
  registerTempDir,
  unregisterTempDir,
} from "../lib/download.mjs";

const SYSTEM_FILES = ["RULES.md", "README.md"];
const STATE_FOLDERS = ["backlog", "doing", "done"];

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
      for (const file of SYSTEM_FILES) {
        await copyFile(join(sourceDir, file), join(workplansDir, file));
        console.log(`  Updated workplans/${file}`);
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
