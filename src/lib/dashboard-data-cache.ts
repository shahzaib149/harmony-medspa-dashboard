type CacheEntry = { data: unknown; savedAt: number };

const cache = new Map<string, CacheEntry>();
const pending = new Map<string, Promise<unknown>>();
const MAX_AGE = 2 * 60 * 1000;

export function getCachedData<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() - entry.savedAt > MAX_AGE) return null;
  return entry.data as T;
}

export function setCachedData(key: string, data: unknown) {
  cache.set(key, { data, savedAt: Date.now() });
}

export function preloadDashboardData(key: string, url: string) {
  if (getCachedData(key) || pending.has(key)) return pending.get(key) ?? Promise.resolve();
  const request = fetch(url, { credentials: "same-origin", cache: "no-store" })
    .then(async response => {
      const data = await response.json();
      if (response.ok && !data.error) setCachedData(key, data);
      return data;
    })
    .catch(() => null)
    .finally(() => pending.delete(key));
  pending.set(key, request);
  return request;
}

export const DATA_CACHE_KEYS = {
  leads: "leads:all",
  messageLogs: "message-logs:default",
  nurture: "nurture:all",
  staff: "staff:all",
} as const;
