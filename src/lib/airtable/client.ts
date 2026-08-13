const BASE_ID = process.env.AIRTABLE_BASE_ID!;
const API_KEY = process.env.AIRTABLE_API_KEY!;

export interface RawRecord {
  id: string;
  createdTime: string;
  fields: Record<string, unknown>;
}

const AIRTABLE_TIMEOUT_MS = 10_000;
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

type AirtableCacheMode = "cached" | "no-store";

async function fetchAirtablePage(url: string, cacheMode: AirtableCacheMode) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${API_KEY}` },
        ...(cacheMode === "no-store"
          ? { cache: "no-store" as const }
          : { next: { revalidate: 180 } }),
        signal: AbortSignal.timeout(AIRTABLE_TIMEOUT_MS),
      });
      if (!RETRYABLE_STATUS.has(response.status) || attempt === 3) return response;
      const retryAfter = Number(response.headers.get("retry-after"));
      await new Promise((resolve) =>
        setTimeout(resolve, Number.isFinite(retryAfter) ? retryAfter * 1_000 : 250 * attempt),
      );
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
    }
  }
  throw new Error("Airtable request failed");
}

const recordsCache = new Map<string, { expiresAt: number; records: RawRecord[] }>();
const recordsRequests = new Map<string, Promise<RawRecord[]>>();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes in-memory cache

async function fetchAllRecordsRequest(
  tableName: string,
  query = new URLSearchParams(),
  options: { cache?: AirtableCacheMode; forceRefresh?: boolean } = {},
): Promise<RawRecord[]> {
  const cacheKey = `${tableName}:${query.toString()}`;
  if (!options.forceRefresh) {
    const cached = recordsCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.records;
    }
  }

  const records: RawRecord[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams(query);
    params.set("pageSize", "100");
    if (offset) params.set("offset", offset);

    const res = await fetchAirtablePage(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(tableName)}?${params}`,
      options.cache ?? "cached",
    );

    if (!res.ok) {
      const raw = await res.text().catch(() => "");
      let detail = "";
      try {
        const parsed = JSON.parse(raw) as { error?: { message?: string; type?: string } };
        detail = parsed?.error?.message ?? parsed?.error?.type ?? "";
      } catch { detail = raw.slice(0, 300); }
      throw new Error(`Airtable ${res.status} on table "${tableName}"${detail ? `: ${detail}` : ""}`);
    }

    const data = await res.json() as { records: Array<{ id: string; createdTime: string; fields: Record<string, unknown> }>; offset?: string };
    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  recordsCache.set(cacheKey, {
    records,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return records;
}

export async function fetchAllRecords(
  tableName: string,
  query = new URLSearchParams(),
  options: { cache?: AirtableCacheMode; forceRefresh?: boolean } = {},
): Promise<RawRecord[]> {
  const cacheKey = tableName + ":" + query.toString();
  if (!options.forceRefresh) {
    const activeRequest = recordsRequests.get(cacheKey);
    if (activeRequest) return activeRequest;
  }

  const request = fetchAllRecordsRequest(tableName, query, options);
  recordsRequests.set(cacheKey, request);
  try {
    return await request;
  } finally {
    if (recordsRequests.get(cacheKey) === request) recordsRequests.delete(cacheKey);
  }
}

// Flexible field getter — tries multiple key variants in order
export function g(fields: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) {
    const v = fields[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

export function num(fields: Record<string, unknown>, ...keys: string[]): number {
  const v = g(fields, ...keys);
  return v === undefined ? 0 : Number(v);
}

export function str(fields: Record<string, unknown>, ...keys: string[]): string {
  const v = g(fields, ...keys);
  return v === undefined ? "" : String(v);
}
