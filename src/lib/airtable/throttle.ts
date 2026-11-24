/** Airtable allows 5 requests/second per base. Every request in this server instance waits for a slot. */
export const AIRTABLE_MIN_SPACING_MS = 220;

/**
 * A start-time limiter: callers resolve in order, each at least `spacingMs` after the
 * previous one started. Requests themselves still run in parallel once started.
 */
export function createLimiter(spacingMs = AIRTABLE_MIN_SPACING_MS, now: () => number = Date.now, sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))) {
  let nextSlotAt = 0;
  let chain: Promise<void> = Promise.resolve();
  return function waitForSlot(): Promise<void> {
    const slot = chain.then(async () => {
      const wait = Math.max(0, nextSlotAt - now());
      if (wait) await sleep(wait);
      nextSlotAt = now() + spacingMs;
    });
    chain = slot.catch(() => undefined);
    return slot;
  };
}

/** Shared by every Airtable call in this server instance. */
export const waitForAirtableSlot = createLimiter();

/** Backoff before retry n (1-based): Retry-After when Airtable sends it (capped at 8s), else 1s, 2s, 4s. */
export function retryDelayMs(attempt: number, retryAfterHeader: string | null) {
  const retryAfter = Number(retryAfterHeader);
  if (retryAfterHeader && Number.isFinite(retryAfter) && retryAfter > 0) return Math.min(retryAfter * 1_000, 8_000);
  return 1_000 * 2 ** (attempt - 1);
}
