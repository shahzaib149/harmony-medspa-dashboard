import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { AIRTABLE_LEADS_BASE_ID, getAirtableApiKey, isAirtableConfigured } from "@/lib/airtable/config";
import type { LeadCampaignSummary } from "@/lib/types/campaigns";
import { normalizeUsPhone } from "@/lib/airtable/leads-base";

const TABLE_NAME = "Leads";
const BASE_ID    = AIRTABLE_LEADS_BASE_ID;

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
  replied: boolean;
  notes: string;
  lastContactedAt: string;
  campaigns: LeadCampaignSummary[];
}

function str(fields: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = fields[k];
    if (v !== undefined && v !== null && v !== "") return String(v);
  }
  return "";
}

type AirtableRecord = { id: string; createdTime: string; fields: Record<string, unknown> };

function values(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : value ? [String(value)] : [];
}

function campaignSummaries(fields: Record<string, unknown>): LeadCampaignSummary[] {
  const campaigns: LeadCampaignSummary[] = [];
  const speedSent = [str(fields, "Email Sent Status"), str(fields, "SMS Sent Status")].some((value) => ["sent", "delivered"].includes(value.toLowerCase()));
  if (speedSent) campaigns.push({ campaign: "Speed-to-Lead", slug: "speed-to-lead", status: "Completed" });
  const enrollmentIds = values(fields["Nurture Enrollments"]);
  const statuses = values(fields["Nurture Status"]);
  const steps = values(fields["Nurture Current Step"]);
  const next = values(fields["Nurture Next Send At"]);
  const last = values(fields["Nurture Last Sent At"]);
  const reasons = values(fields["Nurture Stop Reason"]);
  const created = values(fields["Nurture Enrollment Created At"]);
  enrollmentIds.forEach((enrollmentId, index) => campaigns.push({ campaign: "14-Day Nurture", slug: "14-day-nurture", status: (statuses[index] || "Completed") as LeadCampaignSummary["status"], currentStep: steps[index] || null, nextSendAt: next[index] || null, lastSentAt: last[index] || null, stopReason: reasons[index] || null, enrolledAt: created[index] || null, enrollmentId }));
  return campaigns;
}

async function fetchLeadRecords(params: URLSearchParams) {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const pageParams = new URLSearchParams(params);
    if (offset) pageParams.set("offset", offset);

    const res = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}?${pageParams}`,
      { headers: { Authorization: `Bearer ${getAirtableApiKey()}` }, cache: "no-store" }
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
  if (!isAirtableConfigured()) {
    return Response.json(
      { leads: [], count: 0, configured: false },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

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
    replied:         r.fields.Replied === true,
    notes:           str(r.fields, "Notes"),
    lastContactedAt: str(r.fields, "Last Contacted At"),
    campaigns:       campaignSummaries(r.fields),
  }));

  return Response.json(
    { leads, count: leads.length },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}

type NewLeadInput = { name?: unknown; phone?: unknown; email?: unknown; message?: unknown };

function validateNewLead(input: NewLeadInput, row?: number) {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const phone = typeof input.phone === "string" ? input.phone.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const message = typeof input.message === "string" ? input.message.trim() : "";
  const prefix = row ? `Row ${row}: ` : "";
  const normalizedPhone = normalizeUsPhone(phone);
  if (!name || !phone) throw new Error(`${prefix}Name and phone are required`);
  if (!normalizedPhone) throw new Error(`${prefix}Enter a valid US phone number`);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error(`${prefix}Enter a valid email address`);
  return { name, phone: normalizedPhone, email, message };
}

function newLeadFields(input: ReturnType<typeof validateNewLead>) {
  const fields: Record<string, unknown> = {
    Name: input.name, Phone: input.phone, Source: "Manual Entry", Status: "New",
    "Lead Created At": new Date().toISOString(), "Duplicate Flag": false,
    "Last Contacted At": null, "Email Sent Status": null, "SMS Sent Status": null,
    Notes: input.message, Message: input.message, Replied: false,
  };
  if (input.email) fields.Email = input.email;
  return fields;
}

// POST — create one manually entered lead or a CSV import batch
export async function POST(request: Request) {
  try {
    await requireRole(request, "editor");
  } catch (error) {
    return authErrorResponse(error);
  }
  if (!isAirtableConfigured()) return Response.json({ error: "AIRTABLE_API_KEY not configured" }, { status: 500 });

  const body = await request.json().catch(() => null) as (NewLeadInput & { leads?: NewLeadInput[] }) | null;
  if (!body) return Response.json({ error: "Invalid request body" }, { status: 400 });

  if (Array.isArray(body.leads)) {
    if (body.leads.length === 0) return Response.json({ error: "CSV contains no leads" }, { status: 400 });
    if (body.leads.length > 500) return Response.json({ error: "Import is limited to 500 leads at a time" }, { status: 400 });
    let validated: ReturnType<typeof validateNewLead>[];
    try {
      validated = body.leads.map((lead, index) => validateNewLead(lead, index + 2));
    } catch (error) {
      return Response.json({ error: error instanceof Error ? error.message : "Invalid CSV lead" }, { status: 400 });
    }

    let created = 0;
    for (let index = 0; index < validated.length; index += 10) {
      const records = validated.slice(index, index + 10).map((lead) => ({ fields: newLeadFields(lead) }));
      const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAirtableApiKey()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      });
      const data = await response.json().catch(() => ({})) as { records?: AirtableRecord[]; error?: { message?: string } };
      if (!response.ok) return Response.json({ error: data.error?.message ?? `Airtable ${response.status}`, created }, { status: 500 });
      created += data.records?.length ?? records.length;
    }
    return Response.json({ success: true, created }, { status: 201 });
  }

  let validated: ReturnType<typeof validateNewLead>;
  try { validated = validateNewLead(body); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Invalid lead" }, { status: 400 }); }
  const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getAirtableApiKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: newLeadFields(validated) }),
  });
  const data = await res.json().catch(() => ({})) as AirtableRecord & { error?: { message?: string } };
  if (!res.ok) return Response.json({ error: data.error?.message ?? `Airtable ${res.status}` }, { status: 500 });
  return Response.json({ success: true, id: data.id }, { status: 201 });
}

// Update a lead's status and/or replied flag.
export async function PATCH(request: Request) {
  try {
    await requireRole(request, "editor");
  } catch (error) {
    return authErrorResponse(error);
  }

  if (!isAirtableConfigured()) return Response.json({ error: "AIRTABLE_API_KEY not configured" }, { status: 500 });

  const { id, status, replied, name, email, phone, message, source, notes } = await request.json() as Record<string, unknown>;
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  const fields: Record<string, unknown> = {};
  if (typeof status === "string" && status.trim()) fields.Status = status.trim();
  if (typeof replied === "boolean") fields.Replied = replied;
  if (typeof name === "string") { if (!name.trim()) return Response.json({ error: "Name is required" }, { status: 400 }); fields.Name = name.trim(); }
  if (typeof email === "string") { if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return Response.json({ error: "Enter a valid email address" }, { status: 400 }); fields.Email = email.trim() || null; }
  if (typeof phone === "string") { const normalized = phone.trim() ? normalizeUsPhone(phone) : null; if (phone.trim() && !normalized) return Response.json({ error: "Enter a valid US phone number" }, { status: 400 }); fields.Phone = normalized; }
  if (typeof message === "string") fields.Message = message.trim();
  if (typeof source === "string") fields.Source = source.trim();
  if (typeof notes === "string") fields.Notes = notes.trim();
  if (Object.keys(fields).length === 0) return Response.json({ error: "No editable fields provided" }, { status: 400 });

  const res = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}/${id}`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${getAirtableApiKey()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields, typecast: true }),
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

  if (!isAirtableConfigured()) return Response.json({ error: "AIRTABLE_API_KEY not configured" }, { status: 500 });

  const { id } = await request.json() as { id: string };
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  const res = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}/${id}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getAirtableApiKey()}` },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    return Response.json({ error: err?.error?.message ?? `Airtable ${res.status}` }, { status: 500 });
  }

  return Response.json({ success: true });
}
