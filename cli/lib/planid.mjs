/**
 * Plan id and date helpers following the framework's file naming rule:
 * {YYDDDsssss} = 2-digit year + ordinal day (001-366) + seconds of day (00000-86399).
 */

export function generateId(date = new Date()) {
  const yy = String(date.getFullYear() % 100).padStart(2, "0");
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date - start) / 86_400_000);
  const ddd = String(dayOfYear).padStart(3, "0");
  const seconds = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
  const sssss = String(seconds).padStart(5, "0");
  return `${yy}${ddd}${sssss}`;
}

/** Frontmatter datetime: YYYY-MM-DDThh:mm in local time. */
export function frontmatterDate(date = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
}
