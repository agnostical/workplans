/**
 * Minimal semver helpers for major.minor.patch versions.
 * No prerelease/build support — the framework only uses plain triples.
 */

export function parseVersion(str) {
  if (typeof str !== "string") return null;
  const m = str.trim().match(/^v?(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/**
 * Returns -1 if a < b, 0 if equal, 1 if a > b.
 * Returns null when either version is not a valid major.minor.patch string.
 */
export function compareVersions(a, b) {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  if (!pa || !pb) return null;
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1;
  }
  return 0;
}
