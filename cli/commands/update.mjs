import { existsSync } from "node:fs";
import { copyFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { downloadTemplate } from "giget";

const SYSTEM_FILES = ["RULES.md", "README.md"];
const STATE_FOLDERS = ["backlog", "doing", "done"];

export async function runUpdate() {
  const workplansDir = resolve(process.cwd(), "workplans");

  if (!existsSync(workplansDir)) {
    throw new Error(
      "workplans/ not found in the current directory.\n" +
      "Did you mean 'npx workplans init'?"
    );
  }

  console.log("Updating workplans framework...");

  const tempDir = await mkdtemp(join(tmpdir(), "workplans-update-"));

  try {
    await downloadTemplate("gh:agnostical/workplans/init", {
      dir: tempDir,
      force: true,
    });

    const sourceDir = join(tempDir, "workplans");

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
    }

    console.log("");
    console.log("Done. User plans were not modified.");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
