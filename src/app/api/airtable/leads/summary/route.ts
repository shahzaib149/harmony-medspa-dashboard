import {
  airtableFetch,
  listRecords,
  safeAirtableError,
  textField,
  type AirtableRecord,
} from "@/lib/airtable/leads-base";
import { isAirtableConfigured } from "@/lib/airtable/config";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { buildLeadFormula } from "@/lib/leads/query";
import {
  aggregateLeadSummary,
  type LeadSummaryRecord,
} from "@/lib/leads/summary";
import { normalizeLeadView } from "@/lib/leads/view";

const TABLE_NAME = "Leads";
const SUMMARY_FIELDS = [
  "Name",
  "Email",
  "Phone",
  "Source",
  "Status",
  "Lead Created At",
  "Replied",
  "Duplicate Flag",
];

export const dynamic = "force-dynamic";
export const revalidate = 0;

function addFields(params: URLSearchParams) {
  SUMMARY_FIELDS.forEach((field) => params.append("fields[]", field));
  return params;
}

function mapSummaryRecord(record: AirtableRecord): LeadSummaryRecord {
  const status = textField(record.fields, "Status") || "New";
  return {
    id: record.id,
    name: textField(record.fields, "Name"),
    email: textField(record.fields, "Email"),
    phone: textField(record.fields, "Phone"),
    source: textField(record.fields, "Source"),
    status,
    replied: record.fields.Replied === true,
    createdAt: textField(record.fields, "Lead Created At") || record.createdTime,
    duplicate:
      record.fields["Duplicate Flag"] === true || status.toLowerCase() === "duplicate",
  };
}

async function latestAirtableLead() {
  const params = addFields(
    new URLSearchParams({
      maxRecords: "1",
      pageSize: "1",
      "sort[0][field]": "Lead Created At",
      "sort[0][direction]": "desc",
    }),
  );
  const response = await airtableFetch(`${encodeURIComponent(TABLE_NAME)}?${params}`);
  if (!response.ok) throw new Error(safeAirtableError(response.status));
  const body = (await response.json()) as { records: AirtableRecord[] };
  const record = body.records[0];
  if (!record) return null;
  const lead = mapSummaryRecord(record);
  return {
    id: lead.id,
    name: lead.name,
    source: lead.source,
    status: lead.status,
    createdAt: lead.createdAt,
  };
}

export async function GET(request: Request) {
  try { await requireRole(request, "viewer"); } catch (error) { return authErrorResponse(error); }
  const { searchParams } = new URL(request.url);
  const view = normalizeLeadView(searchParams.get("view"));

  if (!isAirtableConfigured()) {
    return Response.json(
      {
        summary: null,
        viewCounts: null,
        latestLead: null,
        configured: false,
      },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  }

  const filteredParams = addFields(new URLSearchParams());
  const formula = buildLeadFormula(searchParams, { includeView: false });
  if (formula) filteredParams.set("filterByFormula", formula);

  try {
    const [records, latestLead] = await Promise.all([
      listRecords(TABLE_NAME, filteredParams),
      latestAirtableLead(),
    ]);
    const aggregate = aggregateLeadSummary(records.map(mapSummaryRecord), view);
    return Response.json(
      { ...aggregate, latestLead, configured: true },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Lead summary could not be loaded.",
      },
      {
        status: 500,
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      },
    );
  }
}
