import { AIRTABLE_LEADS_BASE_ID, getAirtableApiKey, isAirtableConfigured } from "@/lib/airtable/config";
import type { NurtureEnrollment, NurtureStatus } from "@/lib/types/nurture";

const BASE_ID = AIRTABLE_LEADS_BASE_ID;
const ENROLLMENTS_TABLE = "Nurture Enrollments";
const LEADS_TABLE = "Leads";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AirtableRecord = { id: string; createdTime: string; fields: Record<string, unknown> };

function str(fields: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = fields[key];
    if (value !== undefined && value !== null && value !== "") return String(value);
  }
  return "";
}

function linkedId(value: unknown) {
  if (Array.isArray(value)) return value.find((item): item is string => typeof item === "string") ?? "";
  return typeof value === "string" ? value : "";
}

function checked(value: unknown) {
  return value === true || value === 1 || String(value).toLowerCase() === "true";
}

function escapeFormula(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function fetchRecords(table: string, params = new URLSearchParams()) {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;
  do {
    const page = new URLSearchParams(params);
    page.set("pageSize", "100");
    if (offset) page.set("offset", offset);
    const response = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}?${page}`,
      { headers: { Authorization: `Bearer ${getAirtableApiKey()}` }, cache: "no-store" },
    );
    if (!response.ok) {
      const raw = await response.text().catch(() => "");
      throw new Error(`Airtable ${response.status}: ${raw.slice(0, 240)}`);
    }
    const data = await response.json() as { records: AirtableRecord[]; offset?: string };
    records.push(...data.records);
    offset = data.offset;
  } while (offset);
  return records;
}

export async function GET(request: Request) {
  if (!isAirtableConfigured()) {
    return Response.json(
      { enrollments: [], count: 0, configured: false },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
  try {
    const records = await fetchRecords(ENROLLMENTS_TABLE, new URLSearchParams({
      "sort[0][field]": "Next Send At",
      "sort[0][direction]": "asc",
    }));
    const leadIds = Array.from(new Set(records.map((record) => linkedId(record.fields.Lead)).filter(Boolean)));
    const leadMap = new Map<string, AirtableRecord>();
    for (let index = 0; index < leadIds.length; index += 20) {
      const batch = leadIds.slice(index, index + 20);
      const formula = `OR(${batch.map((id) => `RECORD_ID()='${escapeFormula(id)}'`).join(",")})`;
      const leads = await fetchRecords(LEADS_TABLE, new URLSearchParams({ filterByFormula: formula }));
      leads.forEach((lead) => leadMap.set(lead.id, lead));
    }

    const enrollments = records.map<NurtureEnrollment>((record) => {
      const leadId = linkedId(record.fields.Lead);
      const lead = leadMap.get(leadId);
      const fields = lead?.fields ?? {};
      const rawStatus = str(record.fields, "Status");
      const status: NurtureStatus = rawStatus === "Stopped" || rawStatus === "Completed" ? rawStatus : "Active";
      return {
        id: record.id,
        leadId,
        leadName: str(fields, "Name", "Full Name", "Lead Name") || "Unnamed lead",
        leadPhone: str(fields, "Phone", "Phone Number", "Mobile"),
        leadEmail: str(fields, "Email", "Email Address"),
        leadStatus: str(fields, "Status", "Lead Status") || "Unknown",
        leadTreatmentInterest: str(fields, "Treatment Interested In", "Treatment Interest", "Treatment"),
        leadSource: str(fields, "Source", "Lead Source"),
        leadReplied: checked(fields.Replied),
        status,
        currentStep: str(record.fields, "Current Step"),
        nextSendAt: str(record.fields, "Next Send At") || null,
        lastSentAt: str(record.fields, "Last Sent At") || null,
        stopReason: str(record.fields, "Stop Reason") || null,
        enrolledAt: record.createdTime,
        bookedAt: str(fields, "Booked At", "Booking Date", "Booked Date") || null,
      };
    });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const step = searchParams.get("step");
    const search = (searchParams.get("search") ?? "").trim().toLowerCase();
    const filtered = enrollments.filter((item) => {
      const statusMatch = !status || status === "all" || item.status === status;
      const stepMatch = !step || step === "all" || item.currentStep === step;
      const haystack = `${item.leadName} ${item.leadPhone} ${item.leadEmail}`.toLowerCase();
      return statusMatch && stepMatch && (!search || haystack.includes(search));
    });
    return Response.json({ enrollments: filtered, count: filtered.length }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not load nurture enrollments" }, { status: 500 });
  }
}
