import { AIRTABLE_LEADS_BASE_ID, getAirtableApiKey } from "@/lib/airtable/config";
import { AirtableRequestError, parseAirtableErrorResponse } from "@/lib/airtable/nurture-enrollment";
import { retryDelayMs, waitForAirtableSlot } from "@/lib/airtable/throttle";

import { linkedIds, normalizeUsPhone, textField, type AirtableRecord } from "@/lib/airtable/fields";
export { linkedIds, normalizeUsPhone, textField, type AirtableRecord };

const root = `https://api.airtable.com/v0/${AIRTABLE_LEADS_BASE_ID}`;
const AIRTABLE_TIMEOUT_MS = 10_000;
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

export function safeAirtableError(status: number) {
  return status === 401 || status === 403 ? "Airtable access is not authorized" : `Airtable request failed (${status})`;
}

export async function airtableFetch(path: string, init?: RequestInit, api: "data" | "schema" = "data") {
  const method = (init?.method ?? "GET").toUpperCase();
  const maxAttempts = method === "GET" ? 4 : 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    await waitForAirtableSlot();
    const timeout = AbortSignal.timeout(AIRTABLE_TIMEOUT_MS);
    const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
    try {
      const response = await fetch(`${api === "schema" ? `https://api.airtable.com/v0/meta/bases/${AIRTABLE_LEADS_BASE_ID}` : root}/${path}`, {
        ...init,
        signal,
        headers: { Authorization: `Bearer ${getAirtableApiKey()}`, "Content-Type": "application/json", ...init?.headers },
        ...(init?.cache ? {} : method === "GET" ? { next: { revalidate: 180, tags: ["airtable-leads"] } } : { cache: "no-store" }),
      });
      const mayRetryWrite = method === "GET" || response.status === 429;
      if (attempt === maxAttempts || !RETRYABLE_STATUS.has(response.status) || !mayRetryWrite) return response;
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs(attempt, response.headers.get("retry-after"))));
    } catch (error) {
      if (attempt === maxAttempts || method !== "GET") throw error;
      await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
    }
  }

  throw new Error("Airtable request failed");
}

const listRecordsCache = new Map<string, { records: AirtableRecord[]; expiresAt: number }>();
/** Concurrent callers asking for the same table + query share one paged read. */
const listRecordsInFlight = new Map<string, Promise<AirtableRecord[]>>();
const LIST_CACHE_TTL_MS = 60_000;

import { revalidateTag } from "next/cache";
import { bustCachePrefix } from "@/lib/server-cache";

export function invalidateLeadsBaseCache() {
  listRecordsCache.clear();
  listRecordsInFlight.clear();
  // Campaign summaries / workspaces are built from these tables; drop them too.
  bustCachePrefix("campaigns:");
  try {
    revalidateTag("airtable-leads", "default");
  } catch (error) {
    // ignore outside next.js request context
  }
}

export async function listRecords(table: string, params = new URLSearchParams(), options: { forceRefresh?: boolean } = {}) {
  const cacheKey = `${table}:${params.toString()}`;
  if (!options.forceRefresh) {
    const cached = listRecordsCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.records;
    }
    const pending = listRecordsInFlight.get(cacheKey);
    if (pending) return pending;
  }

  const read = readAllPages(table, params).then((records) => {
    listRecordsCache.set(cacheKey, { records, expiresAt: Date.now() + LIST_CACHE_TTL_MS });
    return records;
  }).finally(() => {
    if (listRecordsInFlight.get(cacheKey) === read) listRecordsInFlight.delete(cacheKey);
  });
  listRecordsInFlight.set(cacheKey, read);
  return read;
}

async function readAllPages(table: string, params: URLSearchParams) {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;
  do {
    const page = new URLSearchParams(params);
    page.set("pageSize", "100");
    if (offset) page.set("offset", offset);
    // Paged reads skip the Next fetch cache: a cached page could carry an expired offset.
    const response = await airtableFetch(`${encodeURIComponent(table)}?${page}`, { cache: "no-store" });
    if (!response.ok) throw new AirtableRequestError(await parseAirtableErrorResponse(response));
    const data = await response.json() as { records: AirtableRecord[]; offset?: string };
    records.push(...data.records);
    offset = data.offset;
  } while (offset);
  return records;
}

export function mapLead(record: AirtableRecord) {
  const f = record.fields;
  return {
    id: record.id, name: textField(f, "Name") || "Unnamed lead", email: textField(f, "Email"), phone: textField(f, "Phone"),
    status: textField(f, "Status") || "New", source: textField(f, "Source"), message: textField(f, "Message"), notes: textField(f, "Notes"),
    replied: f.Replied === true, createdAt: textField(f, "Lead Created At") || record.createdTime,
    lastContactedAt: textField(f, "Last Contacted At") || null, emailSentStatus: textField(f, "Email Sent Status"), smsSentStatus: textField(f, "SMS Sent Status"),
  };
}
