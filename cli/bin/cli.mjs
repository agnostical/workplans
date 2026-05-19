#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInit } from "../commands/init.mjs";
import { runUpdate } from "../commands/update.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8"));

const HELP = `workplans v${pkg.version}

Usage:
  npx workplans <command>

Commands:
  init      Scaffold the workplans framework in the current directory
  update    Refresh RULES.md/README.md and ensure state folders exist
            (never touches user plans)

Options:
  -h, --help     Show this help
  -V, --version  Show version

More: https://github.com/agnostical/workplans`;

async function main() {
  const arg = process.argv[2];

  if (!arg || arg === "-h" || arg === "--help") {
    console.log(HELP);
    return;
  }

  if (arg === "-V" || arg === "--version") {
    console.log(pkg.version);
    return;
  }

  try {
    switch (arg) {
      case "init":
        await runInit();
        break;
      case "update":
        await runUpdate();
        break;
      default:
        console.error(`Unknown command: ${arg}\n`);
        console.error(HELP);
        process.exit(1);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
