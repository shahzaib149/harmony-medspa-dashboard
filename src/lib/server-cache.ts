/**
 * Server-side in-memory response cache.
 *
 * Because Next.js API routes run in the same Node.js process (in dev and in
 * the production server), a module-level Map persists across requests for the
 * lifetime of the process.  We use this to avoid hammering Airtable on every
 * page navigation — the first request fetches fresh data and subsequent ones
 * within the TTL window are served from RAM in <1 ms.
 *
 * TTLs by data class:
 *   overview   — 60 s  (refreshes automatically; manual refresh button busts it)
 *   leads      — 30 s  (paginated + mutable; shorter to stay close to live)
 *   airtable   — 60 s  (Google Ads / campaign tables; infrequently mutated)
 */
import "server-only";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const store = new Map<string, CacheEntry<any>>();

/** Return cached data if still fresh, or null if missing / expired. */
export function getCache<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

/** Store data in the cache with a TTL in seconds. */
export function setCache<T>(key: string, data: T, ttlSeconds: number): void {
  store.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

/** Invalidate one or more cache keys (e.g. after a mutation). */
export function bustCache(...keys: string[]): void {
  for (const key of keys) store.delete(key);
}

/** Invalidate all keys whose string starts with a prefix. */
export function bustCachePrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

/**
 * Convenience helper: return cached result or run `fn`, cache it, return it.
 *
 * @example
 *   const data = await withCache("overview:30d", 60, () => getOverviewData(req, "30d"));
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>,
): Promise<T> {
  const cached = getCache<T>(key);
  if (cached !== null) return cached;
  const fresh = await fn();
  setCache(key, fresh, ttlSeconds);
  return fresh;
}
