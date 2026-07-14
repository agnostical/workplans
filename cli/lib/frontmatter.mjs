/**
 * Minimal frontmatter helpers for plan and README files.
 *
 * Parsing is line-based and preserves raw values (quotes included) so a
 * rewrite is byte-faithful for everything the caller does not change.
 */

/**
 * Parses the leading frontmatter block. Returns null when the file does not
 * start with `---`.
 *
 *   fields   [{ key, raw, indent }] in file order; `raw` is everything after
 *            "key:" (trimmed), "" for a bare key; `indent` > 0 for sub-keys
 *   body     everything after the closing `---` (leading newline preserved)
 */
export function parseFrontmatter(content) {
  const lines = content.split("\n");
  if (lines[0] !== "---") return null;
  const fields = [];
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "---") {
      end = i;
      break;
    }
    const m = lines[i].match(/^(\s*)([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (m) {
      fields.push({ key: m[2], raw: m[3].trim(), indent: m[1].length });
    }
  }
  if (end === -1) return null;
  return { fields, body: lines.slice(end + 1).join("\n") };
}

/** Value of a top-level field with surrounding quotes stripped, or null. */
export function getField(parsed, key) {
  const f = parsed.fields.find((f) => f.indent === 0 && f.key === key);
  if (!f) return null;
  return f.raw.replace(/^["']|["']$/g, "");
}

/**
 * Ensures `work_on` is declared in a README's frontmatter, creating the
 * block when the file has none. Existing declarations are left untouched.
 * Returns the updated content, or null when nothing changed.
 */
export function upsertReadmeWorkOn(content, workOn) {
  const parsed = parseFrontmatter(content);
  if (!parsed) {
    return `---\nwork_on: "${workOn}"\n---\n\n${content}`;
  }
  if (getField(parsed, "work_on") !== null) return null;
  const lines = content.split("\n");
  lines.splice(1, 0, `work_on: "${workOn}"`);
  return lines.join("\n");
}
