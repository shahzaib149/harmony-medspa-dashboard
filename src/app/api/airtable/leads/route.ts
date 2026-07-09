import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";

const TABLE_NAME = "Leads";
const BASE_ID    = process.env.AIRTABLE_LEADS_BASE_ID ?? "appNL010pW9LUpgST";
const API_KEY    = process.env.AIRTABLE_API_KEY!;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  treatment: string;
  message: string;
  source: string;
  status: string;
  utmSource: string;
  utmCampaign: string;
  utmMedium: string;
  pageUrl: string;
  createdAt: string;
  emailSentStatus: string;
  smsSentStatus: string;
}

function str(fields: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = fields[k];
    if (v !== undefined && v !== null && v !== "") return String(v);
  }
  return "";
}

type AirtableRecord = { id: string; createdTime: string; fields: Record<string, unknown> };

async function fetchLeadRecords(params: URLSearchParams) {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const pageParams = new URLSearchParams(params);
    if (offset) pageParams.set("offset", offset);

    const res = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}?${pageParams}`,
      { headers: { Authorization: `Bearer ${API_KEY}` }, cache: "no-store" }
    );

    if (!res.ok) {
      const raw = await res.text().catch(() => "");
      let detail = "";
      try {
        const parsed = JSON.parse(raw) as { error?: { message?: string; type?: string } };
        detail = parsed?.error?.message ?? parsed?.error?.type ?? raw.slice(0, 200);
      } catch { detail = raw.slice(0, 200); }
      throw new Error(`Airtable ${res.status}: ${detail}`);
    }

    const data = await res.json() as { records: AirtableRecord[]; offset?: string };
    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}

export async function GET(request: Request) {
  if (!API_KEY) return Response.json({ error: "AIRTABLE_API_KEY not configured" }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status"); // "New" | "Contacted" | "Booked" | "Not Interested" | null = all

  const params = new URLSearchParams({
    "sort[0][field]":     "Lead Created At",
    "sort[0][direction]": "desc",
    pageSize: "100",
  });
  if (statusFilter && statusFilter !== "all") {
    params.set("filterByFormula", `{Status}="${statusFilter}"`);
  }

  let records: AirtableRecord[];
  try {
    records = await fetchLeadRecords(params);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not load Airtable leads" }, { status: 500 });
  }

  const leads: Lead[] = records.map(r => ({
    id:              r.id,
    name:            str(r.fields, "Name"),
    phone:           str(r.fields, "Phone"),
    email:           str(r.fields, "Email"),
    treatment:       str(r.fields, "Treatment Interest"),
    message:         str(r.fields, "Message"),
    source:          str(r.fields, "Source"),
    status:          str(r.fields, "Status") || "New",
    utmSource:       str(r.fields, "UTM Source"),
    utmCampaign:     str(r.fields, "UTM Campaign"),
    utmMedium:       str(r.fields, "UTM Medium"),
    pageUrl:         str(r.fields, "Page URL"),
    createdAt:       str(r.fields, "Lead Created At") || r.createdTime,
    emailSentStatus: str(r.fields, "Email Sent Status"),
    smsSentStatus:   str(r.fields, "SMS Sent Status"),
  }));

  return Response.json(
    { leads, count: leads.length },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}

// PATCH — update a lead's status
export async function PATCH(request: Request) {
  try {
    await requireRole(request, "editor");
  } catch (error) {
    return authErrorResponse(error);
  }

  if (!API_KEY) return Response.json({ error: "AIRTABLE_API_KEY not configured" }, { status: 500 });

  const { id, status } = await request.json() as { id: string; status: string };
  if (!id || !status) return Response.json({ error: "id and status required" }, { status: 400 });

  const res = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}/${id}`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields: { Status: status } }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    return Response.json({ error: err?.error?.message ?? `Airtable ${res.status}` }, { status: 500 });
  }
  return Response.json({ success: true });
}

export async function DELETE(request: Request) {
  try {
    await requireRole(request, "editor");
  } catch (error) {
    return authErrorResponse(error);
  }

  if (!API_KEY) return Response.json({ error: "AIRTABLE_API_KEY not configured" }, { status: 500 });

  const { id } = await request.json() as { id: string };
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  const res = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}/${id}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${API_KEY}` },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    return Response.json({ error: err?.error?.message ?? `Airtable ${res.status}` }, { status: 500 });
  }

  return Response.json({ success: true });
}
