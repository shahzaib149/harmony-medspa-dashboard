import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CALL_FIELDS, groupCallSources, mapCallRecord, type CallRecord } from "../../src/lib/leads/call-records";

type BackfillRow = { id: string; occurredAt: string; source: string; line: string; areaCode: string; duration: number; missed: boolean; kind: string; assessment: string };

const rows = JSON.parse(readFileSync(join(process.cwd(), "scripts", "data", "call-history-backfill.json"), "utf8")) as BackfillRow[];

// Shaped like Airtable rows: Occurred At comes back in UTC.
export const CALL_TABLE_ROWS = rows.map((row) => ({
  fields: {
    [CALL_FIELDS.id]: row.id,
    [CALL_FIELDS.occurredAt]: new Date(row.occurredAt).toISOString(),
    [CALL_FIELDS.source]: row.source,
    [CALL_FIELDS.line]: row.line,
    [CALL_FIELDS.areaCode]: row.areaCode,
    [CALL_FIELDS.duration]: row.duration,
    [CALL_FIELDS.missed]: row.missed,
    [CALL_FIELDS.kind]: row.kind,
    [CALL_FIELDS.assessment]: row.assessment,
  },
}));

export const BACKFILL_ROWS = rows;
export const ALL_CALLS: CallRecord[] = CALL_TABLE_ROWS.map(mapCallRecord).filter((call): call is CallRecord => Boolean(call));
export const CALL_SOURCES = groupCallSources(ALL_CALLS);
