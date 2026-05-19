import { existsSync } from "node:fs";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { downloadTemplate } from "giget";

export async function runInit() {
  const target = resolve(process.cwd(), "workplans");

  if (existsSync(target)) {
    throw new Error(
      "workplans/ already exists in the current directory.\n" +
      "Did you mean 'npx workplans update'?"
    );
  }

  console.log("Scaffolding workplans framework...");

  const tempDir = await mkdtemp(join(tmpdir(), "workplans-init-"));

  try {
    await downloadTemplate("gh:agnostical/workplans/init", {
      dir: tempDir,
      force: true,
    });

    await cp(join(tempDir, "workplans"), target, { recursive: true });

    console.log("");
    console.log("Done. workplans/ created.");
    console.log("");
    console.log("Next steps:");
    console.log("  - Read workplans/README.md");
    console.log("  - Create your first plan in workplans/backlog/");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
