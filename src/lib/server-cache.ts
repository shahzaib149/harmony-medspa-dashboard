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
    // Keep a recently expired value: withCache may still serve it while refreshing.
    if (Date.now() - entry.expiresAt > STALE_LIMIT_MS) store.delete(key);
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

/** An expired value younger than this is served at once while it refreshes in the background. */
export const STALE_LIMIT_MS = 30 * 60_000;

/**
 * Stale-while-revalidate: a fresh value returns at once; an expired one (within
 * STALE_LIMIT_MS) also returns at once and starts one background refresh. Only a
 * cold or very old key, or one cleared by bustCache, makes the caller wait.
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>,
): Promise<T> {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (entry && Date.now() <= entry.expiresAt) return entry.data;
  if (entry && Date.now() - entry.expiresAt <= STALE_LIMIT_MS) {
    if (!inFlight.has(key)) void load(key, ttlSeconds, fn).catch(() => undefined);
    return entry.data;
  }

  const pending = inFlight.get(key) as Promise<T> | undefined;
  if (pending) return pending;
  return load(key, ttlSeconds, fn);
}

function load<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
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
