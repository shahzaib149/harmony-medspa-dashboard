import { AIRTABLE_LEADS_BASE_ID, getAirtableApiKey } from "@/lib/airtable/config";

export type AirtableRecord = { id: string; createdTime: string; fields: Record<string, unknown> };

const root = `https://api.airtable.com/v0/${AIRTABLE_LEADS_BASE_ID}`;

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
  return fetch(`${root}/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${getAirtableApiKey()}`, "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
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
