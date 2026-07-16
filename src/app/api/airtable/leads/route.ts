import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { AIRTABLE_LEADS_BASE_ID, getAirtableApiKey, isAirtableConfigured } from "@/lib/airtable/config";
import type { LeadCampaignSummary } from "@/lib/types/campaigns";
import { normalizeUsPhone } from "@/lib/airtable/leads-base";
import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { leadViewFormula, normalizeLeadView } from "@/lib/leads/view";

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

const PAGE_SIZES = new Set([20, 30, 50]);

function formulaString(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').slice(0, 150);
}

function leadFormula(searchParams: URLSearchParams) {
  const filters: string[] = [leadViewFormula(normalizeLeadView(searchParams.get("view")))];
  const search = searchParams.get("search")?.trim();
  if (search) {
    const term = formulaString(search.toLowerCase());
    filters.push(`OR(FIND("${term}",LOWER({Name}&""))>0,FIND("${term}",LOWER({Email}&""))>0,FIND("${term}",LOWER({Phone}&""))>0,FIND("${term}",LOWER({Source}&""))>0)`);
  }
  const recordId = searchParams.get("recordId")?.trim();
  if (recordId && /^rec[a-zA-Z0-9]+$/.test(recordId)) filters.push(`RECORD_ID()="${recordId}"`);
  const exact = (param: string, field: string) => {
    const value = searchParams.get(param)?.trim();
    if (value && value.toLowerCase() !== "all") filters.push(`{${field}}="${formulaString(value)}"`);
  };
  const status = searchParams.get("status")?.trim();
  if (status && status.toLowerCase() !== "all") filters.push(status === "Duplicate" ? `OR({Status}="Duplicate",{Duplicate Flag}=TRUE())` : `{Status}="${formulaString(status)}"`);
  exact("source", "Source");
  const delivery = (param: string, field: string) => {
    const value = searchParams.get(param);
    if (value === "sent") filters.push(`OR(LOWER({${field}}&"")="sent",LOWER({${field}}&"")="delivered")`);
    if (value === "not_sent") filters.push(`AND(LOWER({${field}}&"")!="sent",LOWER({${field}}&"")!="delivered")`);
  };
  delivery("emailStatus", "Email Sent Status");
  delivery("smsStatus", "SMS Sent Status");
  const replied = searchParams.get("replied");
  if (replied === "true" || replied === "false") filters.push(`{Replied}=${replied === "true" ? "TRUE()" : "FALSE()"}`);
  const campaign = searchParams.get("campaign")?.trim();
  if (campaign === "speed-to-lead") filters.push(`OR(LOWER({Email Sent Status}&"")="sent",LOWER({Email Sent Status}&"")="delivered",LOWER({SMS Sent Status}&"")="sent",LOWER({SMS Sent Status}&"")="delivered")`);
  if (campaign === "14-day-nurture") filters.push(`COUNTA({Nurture Enrollments})>0`);
  if (campaign === "none") filters.push(`AND(COUNTA({Nurture Enrollments})=0,LOWER({Email Sent Status}&"")!="sent",LOWER({Email Sent Status}&"")!="delivered",LOWER({SMS Sent Status}&"")!="sent",LOWER({SMS Sent Status}&"")!="delivered")`);
  exact("campaignStatus", "Nurture Status");
  exact("campaignStep", "Nurture Current Step");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  if (dateFrom && /^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) filters.push(`IS_AFTER({Lead Created At},DATEADD(DATETIME_PARSE("${dateFrom}"),-1,'seconds'))`);
  if (dateTo && /^\d{4}-\d{2}-\d{2}$/.test(dateTo)) filters.push(`IS_BEFORE({Lead Created At},DATEADD(DATETIME_PARSE("${dateTo}"),1,'days'))`);
  return filters.length > 1 ? `AND(${filters.join(",")})` : filters[0];
}

function mapLead(r: AirtableRecord): Lead {
  return {
    id: r.id,
    name: str(r.fields, "Name"),
    phone: str(r.fields, "Phone"),
    email: str(r.fields, "Email"),
    treatment: str(r.fields, "Treatment Interest"),
    message: str(r.fields, "Message"),
    source: str(r.fields, "Source"),
    status: str(r.fields, "Status") || "New",
    utmSource: str(r.fields, "UTM Source"),
    utmCampaign: str(r.fields, "UTM Campaign"),
    utmMedium: str(r.fields, "UTM Medium"),
    pageUrl: str(r.fields, "Page URL"),
    createdAt: str(r.fields, "Lead Created At") || r.createdTime,
    emailSentStatus: str(r.fields, "Email Sent Status"),
    smsSentStatus: str(r.fields, "SMS Sent Status"),
    replied: r.fields.Replied === true,
    notes: str(r.fields, "Notes"),
    lastContactedAt: str(r.fields, "Last Contacted At"),
    campaigns: campaignSummaries(r.fields),
  };
}

async function airtableRecord(id: string) {
  const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${getAirtableApiKey()}` }, cache: "no-store" });
  if (!response.ok) return null;
  return response.json() as Promise<AirtableRecord>;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const view = normalizeLeadView(searchParams.get("view"));
  if (!isAirtableConfigured()) {
    return Response.json(
      { items: [], leads: [], view, pageSize: 20, nextCursor: null, hasNextPage: false, hasPreviousPage: false, visibleFrom: 0, visibleTo: 0, total: null, configured: false },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  const requestedPageSize = Number(searchParams.get("pageSize") || 20);
  const pageSize = PAGE_SIZES.has(requestedPageSize) ? requestedPageSize : 20;
  const cursor = searchParams.get("cursor")?.trim() || null;
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
  if (cursor && !/^[a-zA-Z0-9/_-]{1,200}$/.test(cursor)) return Response.json({ error: "Invalid pagination cursor" }, { status: 400 });
  const sort = searchParams.get("sort") === "oldest" ? "asc" : "desc";

  const params = new URLSearchParams({
    "sort[0][field]":     "Lead Created At",
    "sort[0][direction]": sort,
    pageSize: String(pageSize),
  });
  if (cursor) params.set("offset", cursor);
  const formula = leadFormula(searchParams);
  if (formula) params.set("filterByFormula", formula);

  let data: { records: AirtableRecord[]; offset?: string };
  try {
    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}?${params}`, { headers: { Authorization: `Bearer ${getAirtableApiKey()}` }, cache: "no-store" });
    if (!response.ok) throw new Error(`Airtable ${response.status}`);
    data = await response.json() as { records: AirtableRecord[]; offset?: string };
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not load Airtable leads" }, { status: 500 });
  }

  const leads = data.records.map(mapLead);
  const visibleFrom = leads.length ? (page - 1) * pageSize + 1 : 0;

  return Response.json(
    { items: leads, leads, view, pageSize, nextCursor: data.offset ?? null, hasNextPage: Boolean(data.offset), hasPreviousPage: page > 1, visibleFrom, visibleTo: visibleFrom ? visibleFrom + leads.length - 1 : 0, total: null },
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
  let actor;
  try {
    ({ profile: actor } = await requireRole(request, "editor"));
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
      if (!response.ok) {
        await logAuditEvent({ actor, action: "action_failed", category: "leads", summary: "Lead CSV import could not be completed", metadata: { operation: "leads_imported", total_rows: validated.length, imported_rows: created, failed_rows: validated.length - created }, result: "failed", request });
        return Response.json({ error: data.error?.message ?? `Airtable ${response.status}`, created }, { status: 500 });
      }
      created += data.records?.length ?? records.length;
    }
    await logAuditEvent({ actor, action: "leads_imported", category: "leads", resource: { type: "lead_import", label: "CSV import" }, summary: `Imported ${created} leads from CSV`, metadata: { total_rows: validated.length, imported_rows: created, skipped_duplicates: 0, failed_rows: validated.length - created }, request });
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
  if (!res.ok) {
    await logAuditEvent({ actor, action: "action_failed", category: "leads", resource: { type: "lead", label: validated.name }, summary: "Manual lead creation could not be completed", metadata: { operation: "lead_created" }, result: "failed", request });
    return Response.json({ error: data.error?.message ?? `Airtable ${res.status}` }, { status: 500 });
  }
  await logAuditEvent({ actor, action: "lead_created", category: "leads", resource: { type: "lead", id: data.id, label: validated.name }, summary: `Created lead ${validated.name}`, after: { name: validated.name, email: validated.email, phone: validated.phone, source: "Manual Entry", status: "New" }, request });
  return Response.json({ success: true, id: data.id }, { status: 201 });
}

// Update a lead's status and/or replied flag.
export async function PATCH(request: Request) {
  let actor;
  try {
    ({ profile: actor } = await requireRole(request, "editor"));
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
  const existing = await airtableRecord(String(id));
  const beforeFields = existing?.fields ?? {};

  const res = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}/${id}`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${getAirtableApiKey()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields, typecast: true }),
    }
  );

  const updatedRecord = await res.json().catch(() => null) as AirtableRecord | null;
  if (!res.ok) {
    const err = (updatedRecord ?? {}) as { error?: { message?: string } };
    await logAuditEvent({ actor, action: "action_failed", category: "leads", resource: { type: "lead", id: String(id), label: str(beforeFields, "Name") }, summary: "Lead update could not be completed", metadata: { operation: "lead_updated", changed_fields: Object.keys(fields) }, result: "failed", request });
    return Response.json({ error: err?.error?.message ?? `Airtable ${res.status}` }, { status: 500 });
  }
  const fieldNames: Record<string, string> = { Status: "status", Replied: "replied", Name: "name", Email: "email", Phone: "phone", Message: "message", Source: "source", Notes: "notes" };
  const before = Object.fromEntries(Object.keys(fields).map((field) => [fieldNames[field] || field, beforeFields[field] ?? null]));
  const after = Object.fromEntries(Object.entries(fields).map(([field, value]) => [fieldNames[field] || field, value]));
  const action = "Status" in fields && Object.keys(fields).length === 1 ? "lead_status_changed" : "Replied" in fields && Object.keys(fields).length === 1 ? "lead_replied_changed" : "lead_updated";
  await logAuditEvent({ actor, action, category: "leads", resource: { type: "lead", id: String(id), label: str(beforeFields, "Name") || (typeof name === "string" ? name : null) }, summary: action === "lead_status_changed" ? `Changed ${str(beforeFields, "Name") || "lead"} status` : action === "lead_replied_changed" ? `Changed ${str(beforeFields, "Name") || "lead"} replied state` : `Updated ${str(beforeFields, "Name") || "lead"}`, before, after, request });
  return Response.json({ success: true, lead: updatedRecord ? mapLead(updatedRecord) : null });
}

export async function DELETE(request: Request) {
  let actor;
  try {
    ({ profile: actor } = await requireRole(request, "editor"));
  } catch (error) {
    return authErrorResponse(error);
  }

  if (!isAirtableConfigured()) return Response.json({ error: "AIRTABLE_API_KEY not configured" }, { status: 500 });

  const { id } = await request.json() as { id: string };
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  const existing = await airtableRecord(id);

  const res = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}/${id}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getAirtableApiKey()}` },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    await logAuditEvent({ actor, action: "action_failed", category: "leads", resource: { type: "lead", id, label: existing ? str(existing.fields, "Name") : null }, summary: "Lead deletion could not be completed", metadata: { operation: "lead_deleted" }, result: "failed", request });
    return Response.json({ error: err?.error?.message ?? `Airtable ${res.status}` }, { status: 500 });
  }

  await logAuditEvent({ actor, action: "lead_deleted", category: "leads", resource: { type: "lead", id, label: existing ? str(existing.fields, "Name") : null }, summary: `Deleted ${existing ? str(existing.fields, "Name") || "a lead" : "a lead"}`, before: existing ? { name: str(existing.fields, "Name"), email: str(existing.fields, "Email"), phone: str(existing.fields, "Phone"), status: str(existing.fields, "Status"), source: str(existing.fields, "Source") } : undefined, request });
  return Response.json({ success: true });
}
