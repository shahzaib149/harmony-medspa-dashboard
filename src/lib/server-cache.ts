/**
 * Server-side in-memory response cache.
 *
 * Cached responses keep routine dashboard navigation off Airtable. Identical
 * requests that arrive while a value is loading share the same promise, so a
 * page render and an API preload cannot start duplicate upstream work.
 */
import "server-only";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const store = new Map<string, CacheEntry<any>>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const inFlight = new Map<string, Promise<any>>();
const revisions = new Map<string, number>();

export function getCache<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache<T>(key: string, data: T, ttlSeconds: number): void {
  store.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

function invalidateKey(key: string) {
  store.delete(key);
  inFlight.delete(key);
  revisions.set(key, (revisions.get(key) ?? 0) + 1);
}

export function bustCache(...keys: string[]): void {
  keys.forEach(invalidateKey);
}

export function bustCachePrefix(prefix: string): void {
  const matches = new Set(
    [...store.keys(), ...inFlight.keys()].filter((key) => key.startsWith(prefix)),
  );
  matches.forEach(invalidateKey);
}

export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>,
): Promise<T> {
  const cached = getCache<T>(key);
  if (cached !== null) return cached;

  const pending = inFlight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const revision = revisions.get(key) ?? 0;
  const request: Promise<T> = fn()
    .then((fresh) => {
      if ((revisions.get(key) ?? 0) === revision) {
        setCache(key, fresh, ttlSeconds);
      }
      return fresh;
    })
    .finally(() => {
      if (inFlight.get(key) === request) inFlight.delete(key);
    });

  inFlight.set(key, request);
  return request;
}
