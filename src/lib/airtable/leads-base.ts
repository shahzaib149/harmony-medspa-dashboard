import { AIRTABLE_LEADS_BASE_ID, getAirtableApiKey } from "@/lib/airtable/config";

export type AirtableRecord = { id: string; createdTime: string; fields: Record<string, unknown> };

const root = `https://api.airtable.com/v0/${AIRTABLE_LEADS_BASE_ID}`;
const AIRTABLE_TIMEOUT_MS = 10_000;
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

export function textField(fields: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = fields[key];
    if (value !== undefined && value !== null && value !== "") return String(value);
  }
  return "";
}

export function linkedIds(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : typeof value === "string" ? [value] : [];
}

export function normalizeUsPhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return national.length === 10 ? `+1${national}` : null;
}

export function safeAirtableError(status: number) {
  return status === 401 || status === 403 ? "Airtable access is not authorized" : `Airtable request failed (${status})`;
}

export async function airtableFetch(path: string, init?: RequestInit) {
  const method = (init?.method ?? "GET").toUpperCase();
  const maxAttempts = method === "GET" ? 3 : 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const timeout = AbortSignal.timeout(AIRTABLE_TIMEOUT_MS);
    const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
    try {
      const response = await fetch(`${root}/${path}`, {
        ...init,
        signal,
        headers: { Authorization: `Bearer ${getAirtableApiKey()}`, "Content-Type": "application/json", ...init?.headers },
        cache: "no-store",
      });
      const mayRetryWrite = method === "GET" || response.status === 429;
      if (attempt === maxAttempts || !RETRYABLE_STATUS.has(response.status) || !mayRetryWrite) return response;
      const retryAfter = Number(response.headers.get("retry-after"));
      await new Promise((resolve) => setTimeout(resolve, Number.isFinite(retryAfter) ? retryAfter * 1_000 : 250 * attempt));
    } catch (error) {
      if (attempt === maxAttempts || method !== "GET") throw error;
      await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
    }
  }

  throw new Error("Airtable request failed");
}

export async function listRecords(table: string, params = new URLSearchParams()) {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;
  do {
    const page = new URLSearchParams(params);
    page.set("pageSize", "100");
    if (offset) page.set("offset", offset);
    const response = await airtableFetch(`${encodeURIComponent(table)}?${page}`);
    if (!response.ok) throw new Error(safeAirtableError(response.status));
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
