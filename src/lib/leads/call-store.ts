import "server-only";
import { chunkAirtableRecords } from "@/lib/airtable/batch";
import { AirtableRequestError, parseAirtableErrorResponse } from "@/lib/airtable/nurture-enrollment";
import { airtableFetch, invalidateLeadsBaseCache, listRecords, type AirtableRecord } from "@/lib/airtable/leads-base";
import { CALL_FIELDS, mapCallRecord, type CallRecord } from "./call-records";
import type { ExistingCall } from "./call-sync-plan";

export function callsTable() {
  return process.env.AIRTABLE_CALLS_TABLE_ID?.trim() || "Calls";
}

const byTime = (a: CallRecord, b: CallRecord) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt);

export async function listCalls(): Promise<CallRecord[]> {
  const records = await listRecords(callsTable());
  return records.map(mapCallRecord).filter((call): call is CallRecord => Boolean(call)).sort(byTime);
}

/** Uncached read for imports, so a sync never plans against stale rows. */
export async function listExistingCalls(): Promise<ExistingCall[]> {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;
  do {
    const params = new URLSearchParams({ pageSize: "100" });
    if (offset) params.set("offset", offset);
    const response = await airtableFetch(`${encodeURIComponent(callsTable())}?${params}`, { cache: "no-store" });
    if (!response.ok) throw new AirtableRequestError(await parseAirtableErrorResponse(response));
    const data = await response.json() as { records: AirtableRecord[]; offset?: string };
    records.push(...data.records);
    offset = data.offset;
  } while (offset);
  return records.flatMap((record) => {
    const call = mapCallRecord(record);
    return call ? [{
      recordId: record.id,
      id: call.id,
      occurredAt: call.occurredAt,
      duration: call.duration,
      googleCall: String(record.fields[CALL_FIELDS.googleCall] ?? "").trim(),
    }] : [];
  });
}

async function writeBatches(method: "POST" | "PATCH", records: { id?: string; fields: Record<string, unknown> }[]) {
  for (const batch of chunkAirtableRecords(records)) {
    const response = await airtableFetch(encodeURIComponent(callsTable()), {
      method,
      body: JSON.stringify({ records: batch, typecast: true }),
    });
    if (!response.ok) throw new AirtableRequestError(await parseAirtableErrorResponse(response));
  }
}

export async function createCalls(fields: Record<string, unknown>[]) {
  await writeBatches("POST", fields.map((item) => ({ fields: item })));
}

export async function attachGoogleCalls(links: { recordId: string; googleCall: string }[]) {
  await writeBatches("PATCH", links.map((link) => ({ id: link.recordId, fields: { [CALL_FIELDS.googleCall]: link.googleCall } })));
}

export function invalidateCallsCache() {
  invalidateLeadsBaseCache();
}
