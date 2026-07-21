/**
 * Corpus validation (#84): contract errors and style lints for `validate`.
 *
 * Pure content-in/results-out helpers — no filesystem access. The command
 * feeds file contents and prints; every check returns { errors, warnings }
 * entries as plain strings prefixed with the plan's folder/name.
 *
 * Severity contract: errors are objective format violations (exit 1);
 * warnings are editorial lints (exit 0) — the validator is a convenience,
 * never the enforcement mechanism of the canon.
 */

import { compareVersions } from "./semver.mjs";
import { parseFrontmatter, getField, getFieldAliased } from "./frontmatter.mjs";
import { FIELDS_040, FIELDS_050, SCALES, planFormat } from "./transitions.mjs";

const LEGACY_REQUIRED = [
  "format_version", "title", "state", "author", "author_model",
  "assignee", "assignee_model", "backlog_date", "doing_date", "done_date",
];
const RELATION_TYPES = new Set(["blocked_by", "relates_to", "supersedes", "parent"]);
const PRIORITIES = new Set(["urgent", "high", "medium", "low", ""]);
const DEPRECATED_SECTIONS = new Set(["Verification", "Risks", "Comments"]);
const SECTIONS_050 = ["Brief", "Objective", "Progress", "Context", "Implementation", "Closing Summary"];
const SECTIONS_030 = ["Objective", "Progress", "Context", "Implementation", "Closing Summary"];
const SECTIONS_LEGACY = ["Progress", "Objective", "Context", "Implementation", "Closing Summary"];
const CLOSING_LABELS = ["Delivered", "Decisions", "Verification", "Deferred", "References"];
const BRIEF_PLACEHOLDER = "_No brief: this plan predates the Brief section._";
const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const EMOJI_RE = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1FA00}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/u;
const ACCENT_RE = /[áéíóúñÁÉÍÓÚÑüÜ]/;

function atLeast(version, target) {
  return version !== null && (compareVersions(version, target) ?? -1) >= 0;
}

function sentences(text) {
  return (text.match(/[.!?](?=\s|$)/g) || []).length;
}

function words(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Body of one H2 section (lines between its heading and the next H2). */
function section(body, name) {
  const lines = body.split("\n");
  const start = lines.findIndex((l) => l === `## ${name}`);
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith("## ")) { end = i; break; }
  }
  return lines.slice(start + 1, end).join("\n");
}

/** First paragraph (consecutive non-blank lines) of a section body. */
function firstParagraph(text) {
  const lines = text.split("\n");
  const out = [];
  let started = false;
  for (const line of lines) {
    if (line.trim() === "") {
      if (started) break;
      continue;
    }
    started = true;
    out.push(line);
  }
  return out.join("\n");
}

function phaseNumbers(text) {
  const out = new Set();
  for (const m of text?.matchAll(/^### Phase (\d+):/gm) ?? []) out.add(m[1]);
  return out;
}

/** English-canonical step texts that signal an untranslated Phase 1/Closing. */
const ENGLISH_STEPS = /Define objective and context|Define phases and steps|Refine with the user|Write Closing Summary|Validate implementation with the user/;

// ─── settings.yml ───────────────────────────────────────────────

const SETTINGS_TOP_KEYS = new Set(["tracker", "estimate_scale", "projects", "people"]);

/**
 * Minimal YAML-subset parser for settings.yml: top-level scalars plus the
 * two-level `projects`/`people` maps. Returns { data, issues } — schema
 * problems become lint warnings, never crashes.
 */
export function parseSettings(text) {
  const data = {};
  const issues = [];
  let block = null;   // current top-level map key
  let entry = null;   // current second-level entry name
  for (const [i, raw] of text.split("\n").entries()) {
    const line = raw.replace(/\s+$/, "");
    if (line === "" || line.trim().startsWith("#")) continue;
    const indent = line.match(/^ */)[0].length;
    const m = line.trim().match(/^([A-Za-z_][\w.\- ]*):\s*(.*)$/);
    if (!m) {
      issues.push(`settings.yml line ${i + 1}: unparseable line`);
      continue;
    }
    const key = m[1];
    const value = m[2].replace(/^["']|["']$/g, "");
    if (indent === 0) {
      block = null; entry = null;
      if (!SETTINGS_TOP_KEYS.has(key)) issues.push(`settings.yml: unknown key '${key}'`);
      if (key === "projects" || key === "people") {
        data[key] = {};
        block = key;
      } else {
        data[key] = value;
      }
    } else if (indent === 2 && block) {
      entry = key;
      data[block][key] = value === "" ? {} : value;
    } else if (indent === 4 && block && entry) {
      if (typeof data[block][entry] === "string") {
        issues.push(`settings.yml: '${entry}' mixes short and extended form`);
      } else {
        data[block][entry][key] = value;
      }
    } else {
      issues.push(`settings.yml line ${i + 1}: unexpected indentation`);
    }
  }
  for (const [name, value] of Object.entries(data.people ?? {})) {
    if (typeof value === "object" && !value.email) {
      issues.push(`settings.yml: people entry '${name}' (extended form) has no email`);
    }
  }
  return { data, issues };
}

// ─── per-plan validation ────────────────────────────────────────

export function validatePlan({ folder, name, content, scale, roster, staleDays, now }) {
  const errors = [];
  const warnings = [];
  const err = (msg) => errors.push(`${folder}/${name} — ${msg}`);
  const warn = (msg) => warnings.push(`${folder}/${name} — ${msg}`);

  // Naming
  const nameMatch = name.match(/^(\d{10})_([a-z0-9-]+)\.md$/);
  if (!nameMatch) {
    err(/^(DRAFT|BACKLOG|DOING|DONE)-/.test(name)
      ? "old v0.1.0 naming format"
      : "does not match {YYDDDsssss}_{description}.md pattern");
  }

  if (EMOJI_RE.test(content)) err("contains emojis (rule 24: use plain descriptive text instead)");

  const parsed = parseFrontmatter(content);
  if (!parsed) {
    err("no frontmatter (first line is not ---)");
    return { errors, warnings, id: null, relations: {} };
  }

  const format = planFormat(parsed);
  const is040 = atLeast(format, "0.4.0");
  const is050 = atLeast(format, "0.5.0");
  const top = parsed.fields.filter((f) => f.indent === 0).map((f) => f.key);

  // First field and required set per format
  const expectedFirst = is040 ? "format" : "id";
  if (top[0] !== expectedFirst) err(`${expectedFirst} is not first field (found: ${top[0]})`);
  const required = is050 ? FIELDS_050 : is040 ? FIELDS_040 : LEGACY_REQUIRED;
  for (const field of required) {
    if (!top.includes(field)) err(`missing field: ${field}`);
  }
  if (is040) {
    const contract = is050 ? FIELDS_050 : FIELDS_040;
    if (top.join(" ") !== contract.join(" ") && required.every((f) => top.includes(f))) {
      err(`frontmatter fields out of ${is050 ? "0.5.0" : "0.4.0"} order: [${top.join(", ")}]`);
    }
  }

  // Field values
  const id = getField(parsed, "id");
  if (nameMatch && id !== nameMatch[1]) err(`id mismatch: frontmatter=${id} filename=${nameMatch[1]}`);
  const state = getField(parsed, "state");
  if (state !== folder) err(`state mismatch: frontmatter=${state} folder=${folder}`);

  if (is040) {
    const priority = getField(parsed, "priority") ?? "";
    if (!PRIORITIES.has(priority)) err(`invalid priority: '${priority}'`);
    const estimate = getField(parsed, "estimate");
    const tokens = SCALES[scale];
    if (estimate && !tokens) warn(`unknown estimate_scale '${scale}'; estimate not validated`);
    if (estimate && tokens && !tokens.includes(estimate)) err(`estimate '${estimate}' not in the ${scale} scale`);
  }
  const relations = {};
  for (const sub of parsed.fields.filter((f) => f.indent > 0)) {
    if (!RELATION_TYPES.has(sub.key)) err(`invalid relations type: ${sub.key}`);
    relations[sub.key] = sub.raw.replace(/^["']|["']$/g, "").split(",").filter(Boolean);
  }
  if ((relations.blocked_by ?? []).some((t) => (relations.parent ?? []).includes(t))) {
    err("blocked_by targets the plan's own parent (bad decomposition)");
  }

  // Dates: coherence with state plus ISO shape
  for (const key of ["backlog_date", "doing_date", "done_date"]) {
    const value = getField(parsed, key);
    if (value && !DATETIME_RE.test(value)) err(`${key} is not YYYY-MM-DDThh:mm: '${value}'`);
  }
  const dates = {
    backlog: getField(parsed, "backlog_date"),
    doing: getField(parsed, "doing_date"),
    done: getField(parsed, "done_date"),
  };
  if (!dates.backlog) err("backlog_date is empty");
  if (folder === "backlog" && (dates.doing || dates.done)) err("backlog plan carries doing_date or done_date");
  if (folder === "doing" && (!dates.doing || dates.done)) err("doing plan needs doing_date set and done_date empty");
  // A supersession closure moves backlog → done directly, so doing_date may
  // legally stay empty on a done plan; done_date never may.
  if (folder === "done" && !dates.done) err("done plan needs done_date set");

  // H1 and sections
  const body = parsed.body;
  const h1 = body.match(/^# (.*)$/m)?.[1] ?? null;
  const title = getField(parsed, "title");
  if (h1 !== title) err(`H1 mismatch: title='${title}' H1='${h1}'`);

  const sections = [...body.matchAll(/^## (.*)$/gm)].map((m) => m[1]);
  const expected = is050 ? SECTIONS_050 : atLeast(format, "0.3.0") ? SECTIONS_030 : SECTIONS_LEGACY;
  for (const s of sections) {
    if (DEPRECATED_SECTIONS.has(s)) err(`deprecated section: ## ${s}`);
    else if (is050 && !SECTIONS_050.includes(s)) err(`invalid section for 0.5.0: ## ${s}`);
  }
  const missing = expected.filter((s) => !sections.includes(s));
  for (const s of missing) err(`missing required section: ## ${s}`);
  if (missing.length === 0) {
    const positions = expected.map((s) => sections.indexOf(s));
    if (positions.some((p, i) => i > 0 && p < positions[i - 1])) {
      err(`sections out of order for format ${format ?? "unset"}: [${sections.join(", ")}]`);
    }
  }
  if (!/^### Phase 1:/m.test(body)) err("missing mandatory Phase 1");
  if (!/^#{2,3} Phase \d+:/m.test(body)) err("missing mandatory Closing phase");
  if (/^#+ Phase [^0-9:]+:/m.test(body)) err("phase heading without a number (literal 'Phase N:'?)");

  // Progress phases must have an Implementation section each
  const progress = section(body, "Progress");
  const implementation = section(body, "Implementation");
  if (progress !== null && implementation !== null) {
    const impl = phaseNumbers(implementation);
    for (const n of phaseNumbers(progress)) {
      if (!impl.has(n)) warn(`Phase ${n} has steps in Progress but no Implementation section`);
    }
  }

  // Attribution lints
  const executor = getFieldAliased(parsed, "executor");
  if (folder === "backlog" && executor) warn(`executor set while in backlog: '${executor}'`);
  const phase1 = progress?.match(/### Phase 1:[^]*?(?=\n### |$)/)?.[0] ?? "";
  const estimate = getField(parsed, "estimate");
  if (estimate && /- \[ \]/.test(phase1)) warn("estimate set while Phase 1: Definition is incomplete");
  if (roster) {
    for (const key of ["planner", "executor"]) {
      const value = getFieldAliased(parsed, key);
      for (const person of (value ?? "").split(",").filter(Boolean)) {
        if (!roster.has(person)) warn(`${key} '${person}' not resolvable against the people roster`);
      }
    }
  }

  // Language: accented title with English-canonical Phase 1/Closing steps
  const accented = title !== null && ACCENT_RE.test(title);
  if (accented && progress && ENGLISH_STEPS.test(progress)) {
    warn("Phase 1/Closing steps read as English while the plan is not (rule 27)");
  }

  // Objective lint
  const objective = section(body, "Objective");
  if (objective !== null) {
    const text = objective.trim();
    if (/\]\(|https?:\/\//.test(text)) warn("Objective carries links; pointers live in Context");
    if (/^[-*] /m.test(text)) warn("Objective carries bullets; one focused paragraph");
    if (text.split(/\n\s*\n/).filter((p) => p.trim()).length > 1) warn("Objective is multi-paragraph");
    if (words(text) > 120) warn(`Objective is ${words(text)} words; the lint threshold is ~120`);
  }

  // Brief lint (0.5.0, skip the migration placeholder)
  const brief = is050 ? section(body, "Brief") : null;
  const briefText = brief?.trim() ?? "";
  if (brief !== null && briefText !== BRIEF_PLACEHOLDER) {
    if (briefText.split(/\n\s*\n/).filter((p) => p.trim()).length > 1) warn("Brief is multi-paragraph");
    else if (sentences(briefText) > 4) warn(`Brief has ${sentences(briefText)} sentences; the canon says 2-4`);
  }

  // Misplaced italic placeholders
  for (const m of body.matchAll(/^_[^_\n]+_$/gm)) {
    const line = m[0];
    const inClosing = section(body, "Closing Summary")?.includes(line) ?? false;
    if (line === BRIEF_PLACEHOLDER || (inClosing && folder !== "done")) continue;
    warn(`italic placeholder outside its legal spots: ${line}`);
  }

  // Done plans: Closing Summary contract and lints
  if (folder === "done" && is040) {
    const closing = section(body, "Closing Summary") ?? "";
    const leader = firstParagraph(closing);
    if (!leader) err("Closing Summary is empty in a done plan");
    else if (leader.startsWith("_")) err("Closing Summary still has the placeholder in a done plan");
    else if (/^[#\-*]/.test(leader)) err("Closing Summary must open with the leader paragraph (found heading or bullet first)");
    else {
      const n = sentences(leader);
      if (n < 3 || n > 6) warn(`leader paragraph has ${n} sentence(s); the rule says 3-6`);
      const stopwords = new Set((leader.toLowerCase().match(/\b(the|and|with|from|was|were|is|are)\b/g) || []));
      if (accented && !ACCENT_RE.test(leader) && stopwords.size >= 3) {
        warn("leader paragraph may not be in the plan's language (title is accented, leader reads as English)");
      }
    }
    for (const label of CLOSING_LABELS) {
      if (new RegExp(`^${label}:?\\s*$`, "m").test(closing)) {
        err(`Closing Summary label written as plain text; use an H3 heading (### ${label})`);
      }
    }
    const references = closing.match(/### References\n([^]*?)(?=\n### |$)/)?.[1];
    if (references !== undefined) {
      const bullets = references.split("\n").filter((l) => /^[-*] /.test(l));
      if (bullets.length === 0) warn("References is present but empty");
      for (const bullet of bullets) {
        if (!/https?:\/\//.test(bullet)) warn(`References bullet without a link: ${bullet.slice(0, 60)}`);
      }
    }
  }

  // Stale backlog
  if (folder === "backlog" && dates.backlog && DATETIME_RE.test(dates.backlog) && now) {
    const age = Math.floor((now - new Date(dates.backlog).getTime()) / 86400000);
    if (age > staleDays) warn(`in backlog for ${age} days (threshold ${staleDays})`);
  }

  return { errors, warnings, id, relations };
}

// ─── corpus-level validation ────────────────────────────────────

export function validateCorpus(plans) {
  const errors = [];
  const warnings = [];
  const byId = new Map();
  for (const plan of plans) {
    if (!plan.id) continue;
    if (byId.has(plan.id)) {
      errors.push(`${plan.folder}/${plan.name} — duplicate ID ${plan.id} (also in ${byId.get(plan.id).folder}/${byId.get(plan.id).name})`);
    } else {
      byId.set(plan.id, plan);
    }
  }
  for (const plan of plans) {
    const rel = plan.relations ?? {};
    for (const [type, targets] of Object.entries(rel)) {
      for (const target of targets) {
        if (!byId.has(target)) {
          warnings.push(`${plan.folder}/${plan.name} — ${type} cites id ${target}, which does not exist in the corpus`);
        }
      }
    }
    for (const target of rel.blocked_by ?? []) {
      if ((rel.relates_to ?? []).includes(target)) {
        warnings.push(`${plan.folder}/${plan.name} — redundant pair: blocked_by and relates_to on ${target} (the dependency already implies the association)`);
      }
    }
    for (const target of rel.relates_to ?? []) {
      const other = byId.get(target);
      if (other && (other.relations?.relates_to ?? []).includes(plan.id) && plan.id < target) {
        warnings.push(`${plan.folder}/${plan.name} — bilateral relates_to with ${target}; the edge is written on the newer plan only`);
      }
    }
  }
  return { errors, warnings };
}
