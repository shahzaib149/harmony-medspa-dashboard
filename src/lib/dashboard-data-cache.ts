"use client";

import { useSyncExternalStore } from "react";

type CacheEntry = { data: unknown; savedAt: number };

const cache = new Map<string, CacheEntry>();
const pending = new Map<string, Promise<unknown>>();
const listeners = new Set<() => void>();
const MAX_AGE = 2 * 60 * 1000;
const STORAGE_PREFIX = "harmony-dashboard:v1:";

export function getCachedData<T>(key: string): T | null {
  let entry = cache.get(key);
  if (!entry && typeof window !== "undefined") {
    try {
      const stored = window.sessionStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (stored) {
        entry = JSON.parse(stored) as CacheEntry;
        cache.set(key, entry);
      }
    } catch { /* Storage can be unavailable in privacy-restricted browsers. */ }
  }
  if (!entry || Date.now() - entry.savedAt > MAX_AGE) return null;
  return entry.data as T;
}

export function setCachedData(key: string, data: unknown) {
  const entry = { data, savedAt: Date.now() };
  cache.set(key, entry);
  if (typeof window !== "undefined") {
    try { window.sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(entry)); }
    catch { /* The in-memory cache remains available. */ }
  }
  listeners.forEach((listener) => listener());
}

export function invalidateDashboardData(key: string) {
  cache.delete(key);
  pending.delete(key);
  if (typeof window !== "undefined") {
    try { window.sessionStorage.removeItem(`${STORAGE_PREFIX}${key}`); }
    catch { /* The in-memory cache has still been invalidated. */ }
  }
  listeners.forEach((listener) => listener());
}

export function clearDashboardDataCache() {
  cache.clear(); pending.clear();
  if (typeof window !== "undefined") {
    for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = window.sessionStorage.key(index);
      if (key?.startsWith(STORAGE_PREFIX)) window.sessionStorage.removeItem(key);
    }
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useDashboardCachedData<T>(key: string): T | null {
  return useSyncExternalStore(
    subscribe,
    () => getCachedData<T>(key),
    () => null,
  );
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
  campaigns: "ads:campaigns:30",
  adGroups: "ads:ad-groups:30",
  creatives: "ads:creatives:30",
  keywords: "ads:keywords:30",
} as const;
