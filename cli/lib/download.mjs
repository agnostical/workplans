/**
 * Template download with classified errors, timeout, and SIGINT cleanup.
 *
 * WORKPLANS_TEMPLATE_SOURCE (env) overrides the GitHub source with a local
 * directory of the same shape as init/ (used by tests and local development).
 */

import { rmSync } from "node:fs";
import { cp, readFile } from "node:fs/promises";
import { join } from "node:path";

const REMOTE_SOURCE = "gh:agnostical/workplans/init";
const RAW_RULES_URL =
  "https://raw.githubusercontent.com/agnostical/workplans/main/init/workplans/RULES.md";
const DOWNLOAD_TIMEOUT_MS = 30_000;
const VERSION_CHECK_TIMEOUT_MS = 10_000;

export class DownloadError extends Error {
  constructor(kind, message) {
    super(message);
    this.name = "DownloadError";
    this.kind = kind;
  }
}

function localSource() {
  return process.env.WORKPLANS_TEMPLATE_SOURCE || null;
}

function classify(err) {
  const msg = String((err && err.message) || err);
  if (/(429|rate.?limit)/i.test(msg)) {
    return new DownloadError(
      "rate-limit",
      "GitHub rate limit reached. Wait a few minutes and try again."
    );
  }
  if (/(404|not found)/i.test(msg)) {
    return new DownloadError(
      "not-found",
      "Template not found on GitHub. Check https://github.com/agnostical/workplans"
    );
  }
  if (/(ENOTFOUND|ECONNREFUSED|ECONNRESET|EAI_AGAIN|ETIMEDOUT|fetch failed|network)/i.test(msg)) {
    return new DownloadError(
      "offline",
      "Could not reach GitHub. Check your internet connection and try again."
    );
  }
  return new DownloadError("unknown", `Download failed: ${msg}`);
}

function withTimeout(promise, ms, what) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new DownloadError(
            "timeout",
            `${what} timed out after ${Math.round(ms / 1000)}s. Check your connection and try again.`
          )
        ),
      ms
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Downloads the init template (the directory containing workplans/) into destDir.
 * Transient failures (offline, timeout) are retried once after a short delay.
 */
export async function downloadInit(destDir, { timeoutMs = DOWNLOAD_TIMEOUT_MS } = {}) {
  const local = localSource();
  if (local) {
    await cp(local, destDir, { recursive: true });
    return;
  }
  const { downloadTemplate } = await import("giget");
  const RETRIABLE = new Set(["offline", "timeout"]);
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await withTimeout(
        downloadTemplate(REMOTE_SOURCE, { dir: destDir, force: true }),
        timeoutMs,
        "Template download"
      );
      return;
    } catch (err) {
      lastError = err instanceof DownloadError ? err : classify(err);
      if (attempt === 2 || !RETRIABLE.has(lastError.kind)) throw lastError;
      console.log("  Download failed, retrying...");
      await new Promise((r) => setTimeout(r, 1_000));
    }
  }
  throw lastError;
}

/** Reads the `version:` field from a RULES.md frontmatter block (first --- block only). */
export function readVersionFromRules(content) {
  const fm = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) return null;
  const line = fm[1].match(/^version:\s*(.+)$/m);
  return line ? line[1].trim().replace(/^["']|["']$/g, "") : null;
}

/**
 * Best-effort remote version check without downloading the full template.
 * Returns null on any failure — callers fall back to the full download path.
 */
export async function fetchRemoteVersion({ timeoutMs = VERSION_CHECK_TIMEOUT_MS } = {}) {
  try {
    const local = localSource();
    if (local) {
      return readVersionFromRules(await readFile(join(local, "workplans", "RULES.md"), "utf8"));
    }
    const res = await withTimeout(fetch(RAW_RULES_URL), timeoutMs, "Version check");
    if (!res.ok) return null;
    return readVersionFromRules(await res.text());
  } catch {
    return null;
  }
}

// ─── Templates ──────────────────────────────────────────────────
// WORKPLANS_TEMPLATES_SOURCE (env) overrides the GitHub source with a local
// directory shaped like templates/ (index.json + <name>.md files).

const RAW_TEMPLATES_BASE =
  "https://raw.githubusercontent.com/agnostical/workplans/main/templates";

function templatesLocalSource() {
  return process.env.WORKPLANS_TEMPLATES_SOURCE || null;
}

async function fetchRawTemplateFile(file, timeoutMs, what) {
  const local = templatesLocalSource();
  if (local) {
    try {
      return await readFile(join(local, file), "utf8");
    } catch (err) {
      if (err.code === "ENOENT") return null;
      throw err;
    }
  }
  let res;
  try {
    res = await withTimeout(fetch(`${RAW_TEMPLATES_BASE}/${file}`), timeoutMs, what);
  } catch (err) {
    throw err instanceof DownloadError ? err : classify(err);
  }
  if (res.status === 404) return null;
  if (!res.ok) throw classify(new Error(`HTTP ${res.status}`));
  return res.text();
}

/** Returns the template catalog: [{ name, title, description }]. */
export async function fetchTemplatesIndex({ timeoutMs = VERSION_CHECK_TIMEOUT_MS } = {}) {
  const raw = await fetchRawTemplateFile("index.json", timeoutMs, "Template list download");
  if (raw === null) {
    throw new DownloadError("not-found", "Template catalog not found. Check https://github.com/agnostical/workplans/tree/main/templates");
  }
  try {
    return JSON.parse(raw).templates;
  } catch {
    throw new DownloadError("unknown", "Template catalog is malformed. Please report this at https://github.com/agnostical/workplans/issues");
  }
}

/** Returns the raw markdown of one template, or null when it does not exist. */
export async function fetchTemplate(name, { timeoutMs = VERSION_CHECK_TIMEOUT_MS } = {}) {
  return fetchRawTemplateFile(`${name}.md`, timeoutMs, "Template download");
}

// ─── SIGINT cleanup ──────────────────────────────────────────────
// Temp dirs registered here are removed if the user interrupts a download.

const activeTempDirs = new Set();
let sigintInstalled = false;

export function registerTempDir(dir) {
  activeTempDirs.add(dir);
}

export function unregisterTempDir(dir) {
  activeTempDirs.delete(dir);
}

export function installSigintCleanup() {
  if (sigintInstalled) return;
  sigintInstalled = true;
  process.on("SIGINT", () => {
    for (const dir of activeTempDirs) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // best effort — the OS temp cleaner will get it eventually
      }
    }
    console.error("\nInterrupted. Temporary files cleaned up.");
    process.exit(130);
  });
}
