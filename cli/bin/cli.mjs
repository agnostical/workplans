#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { installSigintCleanup } from "../lib/download.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8"));

/**
 * Command registry. Adding a command is one entry here plus one module in
 * commands/ — the router needs no other change.
 *   load        dynamic import of the command module
 *   fn          exported function to run
 *   positionals number of positional arguments after the command name
 *   flags       allowed flags; when present, the matched flags are passed
 *               to fn as a trailing Set
 *   summary     one-line description for --help
 */
const registry = new Map([
  [
    "init",
    {
      load: () => import("../commands/init.mjs"),
      fn: "runInit",
      positionals: 0,
      summary: "Scaffold the workplans framework in the current directory",
    },
  ],
  [
    "update",
    {
      load: () => import("../commands/update.mjs"),
      fn: "runUpdate",
      positionals: 0,
      summary:
        "Refresh system files and ensure state folders exist (never touches user plans or the root README)",
    },
  ],
  [
    "migrate",
    {
      load: () => import("../commands/migrate.mjs"),
      fn: "runMigrate",
      positionals: 0,
      flags: ["--doing", "--dry-run"],
      usage: "migrate [--doing] [--dry-run]",
      summary: "Migrate backlog plans to the installed format (doing/ needs --doing; done/ never)",
    },
  ],
  [
    "list",
    {
      load: () => import("../commands/list.mjs"),
      fn: "runList",
      positionals: 0,
      summary: "List available plan templates",
    },
  ],
  [
    "add",
    {
      load: () => import("../commands/add.mjs"),
      fn: "runAdd",
      positionals: 1,
      usage: "add <template>",
      summary: "Add a plan template to your backlog with a fresh id",
    },
  ],
]);

function buildHelp() {
  const lines = [...registry.entries()].map(
    ([name, cmd]) => `  ${(cmd.usage || name).padEnd(16)}${cmd.summary}`
  );
  return `workplans v${pkg.version}

Usage:
  npx workplans <command>

Commands:
${lines.join("\n")}

Options:
  -h, --help     Show this help
  -V, --version  Show version

More: https://github.com/agnostical/workplans`;
}

async function main() {
  installSigintCleanup();

  const [arg, ...rest] = process.argv.slice(2);

  if (!arg || arg === "-h" || arg === "--help") {
    console.log(buildHelp());
    return;
  }

  if (arg === "-V" || arg === "--version") {
    console.log(pkg.version);
    return;
  }

  const command = registry.get(arg);
  if (!command) {
    console.error(`Unknown command: ${arg}\n`);
    console.error(buildHelp());
    process.exit(1);
  }

  const allowedFlags = new Set(command.flags || []);
  const flagArgs = rest.filter((a) => a.startsWith("-"));
  const positionals = rest.filter((a) => !a.startsWith("-"));

  for (const flag of flagArgs) {
    if (!allowedFlags.has(flag)) {
      console.error(`Unknown flag for '${arg}': ${flag}\n`);
      console.error(buildHelp());
      process.exit(1);
    }
  }

  if (positionals.length !== command.positionals) {
    console.error(
      `'${arg}' expects ${command.positionals} argument(s), got ${positionals.length}.\n`
    );
    console.error(buildHelp());
    process.exit(1);
  }

  try {
    const mod = await command.load();
    const args = command.flags ? [...positionals, new Set(flagArgs)] : positionals;
    await mod[command.fn](...args);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
