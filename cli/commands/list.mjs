import { fetchTemplatesIndex } from "../lib/download.mjs";

export async function runList() {
  console.log("Available templates:\n");

  const templates = await fetchTemplatesIndex();

  const width = Math.max(...templates.map((t) => t.name.length)) + 2;
  for (const t of templates) {
    console.log(`  ${t.name.padEnd(width)}${t.description}`);
  }

  console.log("");
  console.log("Add one to your backlog with: npx workplans add <template>");
}
