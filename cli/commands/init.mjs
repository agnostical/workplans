import { existsSync } from "node:fs";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { downloadInit, registerTempDir, unregisterTempDir } from "../lib/download.mjs";

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
  registerTempDir(tempDir);

  try {
    await downloadInit(tempDir);

    try {
      await cp(join(tempDir, "workplans"), target, { recursive: true });
    } catch (err) {
      if (err.code === "EACCES" || err.code === "EPERM") {
        throw new Error(
          "Permission denied writing to the current directory.\n" +
          "Check that you have write permissions here and try again."
        );
      }
      throw err;
    }

    console.log("");
    console.log("Done. workplans/ created.");
    console.log("");
    console.log("Next steps:");
    console.log("  - Read workplans/README.md");
    console.log("  - Create your first plan in workplans/backlog/");
  } finally {
    unregisterTempDir(tempDir);
    await rm(tempDir, { recursive: true, force: true });
  }
}
