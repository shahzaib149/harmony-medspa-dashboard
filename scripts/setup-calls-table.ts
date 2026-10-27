// Creates the Airtable "Calls" table in the leads base (if missing) and backfills
// the call history that used to be hard-coded in src/lib/leads/call-records.ts.
// Idempotent: only Call IDs not already in the table are written.
//   npm run setup:calls-table -- --dry-run
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CALL_FIELDS, CALL_KINDS } from "../src/lib/leads/call-records";

type BackfillRow = {
  id: string; occurredAt: string; source: string; line: string; areaCode: string;
  duration: number; missed: boolean; kind: string; assessment: string;
};

function loadLocalEnv() {
  const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([^#][^=]*)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    const value = match[2].trim().replace(/^(['"])(.*)\1$/, "$2");
    if (!process.env[key]) process.env[key] = value;
  }
}

const dateTime = { dateFormat: { name: "iso" }, timeFormat: { name: "24hour" }, timeZone: "America/New_York" };
const TABLE_FIELDS = [
  { name: CALL_FIELDS.id, type: "singleLineText", description: "Stable id. Saved leads link to it with [Call lead: <id>]; never rename." },
  { name: CALL_FIELDS.occurredAt, type: "dateTime", options: dateTime },
  { name: CALL_FIELDS.source, type: "singleLineText", description: "Dashboard tab, e.g. Website or CS2" },
  { name: CALL_FIELDS.line, type: "singleLineText", description: "Tracking line or campaign shown with the call" },
  { name: CALL_FIELDS.campaignId, type: "singleLineText" },
  { name: CALL_FIELDS.areaCode, type: "singleLineText", description: "Caller region label; staff may edit" },
  { name: CALL_FIELDS.duration, type: "number", options: { precision: 0 }, description: "Seconds" },
  { name: CALL_FIELDS.missed, type: "checkbox", options: { icon: "check", color: "redBright" } },
  { name: CALL_FIELDS.kind, type: "singleSelect", options: { choices: CALL_KINDS.map((name) => ({ name })) } },
  { name: CALL_FIELDS.assessment, type: "singleLineText", description: "Staff may edit; imports never overwrite it" },
  { name: CALL_FIELDS.googleCall, type: "singleLineText", description: "Google Ads call_view resource name; import dedupe key" },
  { name: CALL_FIELDS.origin, type: "singleSelect", options: { choices: [{ name: "Manual entry" }, { name: "Google Ads sync" }] } },
  { name: CALL_FIELDS.importedAt, type: "dateTime", options: dateTime },
];

async function main() {
  loadLocalEnv();
  const dryRun = process.argv.includes("--dry-run");
  const apiKey = process.env.AIRTABLE_API_KEY?.trim();
  const baseId = process.env.AIRTABLE_LEADS_BASE_ID?.trim();
  const tableName = process.env.AIRTABLE_CALLS_TABLE_ID?.trim() || "Calls";
  if (!apiKey || !baseId) throw new Error("AIRTABLE_API_KEY and AIRTABLE_LEADS_BASE_ID are required");
  const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
  const api = async (path: string, init?: RequestInit) => {
    const response = await fetch(`https://api.airtable.com/v0/${path}`, { ...init, headers });
    const body = await response.json();
    if (!response.ok) throw new Error(`Airtable ${response.status}: ${JSON.stringify(body).slice(0, 400)}`);
    return body;
  };

  const { tables } = await api(`meta/bases/${baseId}/tables`) as { tables: { id: string; name: string }[] };
  const existingTable = tables.find((table) => table.id === tableName || table.name === tableName);
  let tableId = existingTable?.id;
  if (!tableId) {
    if (dryRun) {
      console.log(`[dry run] would create table "${tableName}" with ${TABLE_FIELDS.length} fields`);
    } else {
      const created = await api(`meta/bases/${baseId}/tables`, {
        method: "POST",
        body: JSON.stringify({ name: tableName, description: "Inbound call opportunities. Google Ads calls are imported by the dashboard.", fields: TABLE_FIELDS }),
      }) as { id: string };
      tableId = created.id;
      console.log(`Created table ${tableName} (${tableId})`);
    }
  } else {
    console.log(`Table ${tableName} already exists (${tableId})`);
  }

  const backfill = JSON.parse(readFileSync(resolve(process.cwd(), "scripts/data/call-history-backfill.json"), "utf8")) as BackfillRow[];
  const listIds = async () => {
    const ids = new Set<string>();
    if (!tableId) return ids;
    let offset: string | undefined;
    do {
      const params = new URLSearchParams({ pageSize: "100" });
      params.append("fields[]", CALL_FIELDS.id);
      if (offset) params.set("offset", offset);
      const page = await api(`${baseId}/${tableId}?${params}`) as { records: { fields: Record<string, unknown> }[]; offset?: string };
      page.records.forEach((record) => ids.add(String(record.fields[CALL_FIELDS.id] ?? "")));
      offset = page.offset;
    } while (offset);
    return ids;
  };

  const present = await listIds();
  const missing = backfill.filter((row) => !present.has(row.id));
  console.log(`${backfill.length} backfill calls, ${missing.length} missing from the table`);
  if (dryRun || !missing.length) return;

  const importedAt = new Date().toISOString();
  for (let index = 0; index < missing.length; index += 10) {
    await api(`${baseId}/${tableId}`, {
      method: "POST",
      body: JSON.stringify({
        typecast: true,
        records: missing.slice(index, index + 10).map((row) => ({ fields: {
          [CALL_FIELDS.id]: row.id,
          [CALL_FIELDS.occurredAt]: row.occurredAt,
          [CALL_FIELDS.source]: row.source,
          [CALL_FIELDS.line]: row.line,
          [CALL_FIELDS.areaCode]: row.areaCode,
          [CALL_FIELDS.duration]: row.duration,
          [CALL_FIELDS.missed]: row.missed,
          [CALL_FIELDS.kind]: row.kind,
          [CALL_FIELDS.assessment]: row.assessment,
          [CALL_FIELDS.origin]: "Manual entry",
          [CALL_FIELDS.importedAt]: importedAt,
        } })),
      }),
    });
  }

  const after = await listIds();
  const stillMissing = backfill.filter((row) => !after.has(row.id)).map((row) => row.id);
  if (stillMissing.length) throw new Error(`Backfill incomplete; missing: ${stillMissing.join(", ")}`);
  console.log(`Backfill complete: ${after.size} calls in ${tableName}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
