export const PAGE_SIZES = [20, 30, 50] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

/** Client-side page slice. Clamps the page into range, so filtering never strands you on an empty page. */
export function paginate<T>(items: readonly T[], page: number, pageSize: number) {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pages);
  const start = (current - 1) * pageSize;
  const rows = items.slice(start, start + pageSize);
  return { rows, page: current, pages, total, from: total ? start + 1 : 0, to: start + rows.length };
}

/** Initials for an avatar: first letters of the first and last words, ignoring quotes and brackets. */
export function initials(name: string) {
  const words = name.replace(/["“”()]/g, " ").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  const first = words[0][0] ?? "";
  const last = words.length > 1 ? words[words.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}

/** "in 2d 4h", "in 35m", "now" — for countdowns to the next send. */
export function countdown(target: number, now: number) {
  const ms = target - now;
  if (ms <= 0) return "now";
  const mins = Math.floor(ms / 60_000);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  if (days) return `in ${days}d ${hours}h`;
  if (hours) return `in ${hours}h ${mins % 60}m`;
  return `in ${Math.max(1, mins)}m`;
}

/** "3m ago", "5h ago", "2d ago". */
export function relativeTime(value: string | null | undefined, now = Date.now()) {
  const t = Date.parse(value ?? "");
  if (!Number.isFinite(t)) return "";
  const mins = Math.round((now - t) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
