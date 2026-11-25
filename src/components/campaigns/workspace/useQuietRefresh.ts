"use client";

import { useEffect, useRef } from "react";

/**
 * The server serves cached workspace data at once and rebuilds it in the background when it
 * is old. If what the page got is older than `maxAgeMs`, fetch again shortly after mount
 * (by then the background rebuild has usually finished) and swap in the newer copy.
 */
export function useQuietRefresh<T extends { generatedAt: string }>(
  data: T | null,
  url: string,
  onData: (fresh: T) => void,
  { maxAgeMs = 3 * 60_000, delayMs = 4_000 } = {},
) {
  const done = useRef(false);
  const generatedAt = data?.generatedAt ?? "";
  useEffect(() => {
    if (done.current) return;
    const age = Date.now() - Date.parse(generatedAt || "0");
    if (generatedAt && age < maxAgeMs) return;
    done.current = true;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) return;
        const fresh = await response.json() as T & { error?: string };
        if (cancelled || fresh.error || !fresh.generatedAt) return;
        if (!generatedAt || Date.parse(fresh.generatedAt) > Date.parse(generatedAt)) onData(fresh);
      } catch {
        // Keep showing what we have; the Refresh button still works.
      }
    }, delayMs);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [generatedAt, url, onData, maxAgeMs, delayMs]);
}
