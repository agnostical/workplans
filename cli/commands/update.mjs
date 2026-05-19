import { existsSync } from "node:fs";
import { copyFile, mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { downloadTemplate } from "giget";

const SYSTEM_FILES = ["RULES.md", "README.md"];
const STATE_FOLDERS = ["backlog", "doing", "done"];

async function readFrameworkVersion(rulesPath) {
  if (!existsSync(rulesPath)) return null;
  const content = await readFile(rulesPath, "utf8");
  const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatter) return null;
  const versionLine = frontmatter[1].match(/^version:\s*(.+)$/m);
  if (!versionLine) return null;
  return versionLine[1].trim().replace(/^["']|["']$/g, "");
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
  console.log("  Downloading template from gh:agnostical/workplans/init...");

  const tempDir = await mkdtemp(join(tmpdir(), "workplans-update-"));

  try {
    await downloadTemplate("gh:agnostical/workplans/init", {
      dir: tempDir,
      force: true,
    });

    const sourceDir = join(tempDir, "workplans");
    const remoteVersion = await readFrameworkVersion(join(sourceDir, "RULES.md"));
    const localVersion = await readFrameworkVersion(join(workplansDir, "RULES.md"));

    if (remoteVersion && localVersion && remoteVersion === localVersion) {
      console.log("");
      console.log(`Workplans framework is already up to date (v${localVersion}).`);
      return;
    }

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

    console.log("");
    if (remoteVersion && localVersion) {
      console.log(`Updated to v${remoteVersion} (from v${localVersion}). User plans were not modified.`);
    } else if (remoteVersion) {
      console.log(`Updated to v${remoteVersion}. User plans were not modified.`);
    } else {
      console.log("Done. User plans were not modified.");
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
