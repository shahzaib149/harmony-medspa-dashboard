import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { AIRTABLE_LEADS_BASE_ID, getAirtableApiKey, isAirtableConfigured } from "@/lib/airtable/config";
import { mapLead, str, type AirtableRecord } from "@/lib/leads/map-lead";
import { normalizeUsPhone, invalidateLeadsBaseCache } from "@/lib/airtable/leads-base";
import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { normalizeLeadView } from "@/lib/leads/view";
import { buildLeadFormula } from "@/lib/leads/query";
import { withCache, bustCachePrefix } from "@/lib/server-cache";

const TABLE_NAME = "Leads";
const BASE_ID    = AIRTABLE_LEADS_BASE_ID;

export const dynamic = "force-dynamic";
export const revalidate = 0;

const LEADS_TTL = 30; // 30s cache for fast page navigation

export type { Lead } from "@/lib/leads/map-lead";

const PAGE_SIZES = new Set([20, 30, 50]);

async function airtableRecord(id: string) {
  const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${getAirtableApiKey()}` }, cache: "no-store" });
  if (!response.ok) return null;
  return response.json() as Promise<AirtableRecord>;
}

export async function GET(request: Request) {
  try { await requireRole(request, "viewer"); } catch (error) { return authErrorResponse(error); }
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
  const formula = buildLeadFormula(searchParams);
  if (formula) params.set("filterByFormula", formula);

  const cacheKey = `leads:${params.toString()}`;
  try {
    const payload = await withCache(cacheKey, LEADS_TTL, async () => {
      const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}?${params}`, {
        headers: { Authorization: `Bearer ${getAirtableApiKey()}` },
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Airtable ${response.status}`);
      const data = await response.json() as { records: AirtableRecord[]; offset?: string };
      const leads = data.records.map(mapLead);
      const visibleFrom = leads.length ? (page - 1) * pageSize + 1 : 0;
      return {
        items: leads,
        leads,
        view,
        pageSize,
        nextCursor: data.offset ?? null,
        hasNextPage: Boolean(data.offset),
        hasPreviousPage: page > 1,
        visibleFrom,
        visibleTo: visibleFrom ? visibleFrom + leads.length - 1 : 0,
        total: null,
      };
    });

    return Response.json(payload, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not load Airtable leads" }, { status: 500 });
  }
}

type NewLeadInput = {
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  message?: unknown;
  source?: unknown;
  treatment?: unknown;
  leadCreatedAt?: unknown;
};

function validateNewLead(input: NewLeadInput, row?: number) {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const phone = typeof input.phone === "string" ? input.phone.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const message = typeof input.message === "string" ? input.message.trim() : "";
  const treatment = typeof input.treatment === "string" ? input.treatment.trim() : "";
  const source = input.source === "Call Leads" ? "Call Leads" : "Manual Entry";
  const requestedCreatedAt = typeof input.leadCreatedAt === "string" ? input.leadCreatedAt.trim() : "";
  const parsedCreatedAt = Date.parse(requestedCreatedAt);
  const leadCreatedAt = source === "Call Leads" && Number.isFinite(parsedCreatedAt)
    ? new Date(parsedCreatedAt).toISOString()
    : new Date().toISOString();
  const prefix = row ? `Row ${row}: ` : "";
  const normalizedPhone = normalizeUsPhone(phone);
  if (!name || !phone) throw new Error(`${prefix}Name and phone are required`);
  if (!normalizedPhone) throw new Error(`${prefix}Enter a valid US phone number`);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error(`${prefix}Enter a valid email address`);
  return { name, phone: normalizedPhone, email, message, source, treatment, leadCreatedAt };
}

function newLeadFields(input: ReturnType<typeof validateNewLead>) {
  const fields: Record<string, unknown> = {
    Name: input.name, Phone: input.phone, Source: input.source, Status: "New",
    "Lead Created At": input.leadCreatedAt, "Duplicate Flag": false,
    "Last Contacted At": null, "Email Sent Status": null, "SMS Sent Status": null,
    Notes: input.message, Message: input.message, Replied: false,
    // Staff-entered leads are prospects by definition; record that explicitly.
    "Lead Type": "Real Lead", "Is Real Lead": true, "Classification Method": "Manual",
    "Classified At": input.leadCreatedAt, "AI Reason": `Added by staff (${input.source}).`,
  };
  if (input.email) fields.Email = input.email;
  if (input.treatment) fields["Treatment Interest"] = input.treatment;
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
    invalidateLeadsBaseCache();
    bustCachePrefix("leads:");
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
  invalidateLeadsBaseCache();
  bustCachePrefix("leads:");
  await logAuditEvent({ actor, action: "lead_created", category: "leads", resource: { type: "lead", id: data.id, label: validated.name }, summary: `Created lead ${validated.name}`, after: { name: validated.name, email: validated.email, phone: validated.phone, source: validated.source, status: "New" }, request });
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

  const { id, status, replied, name, email, phone, treatment, message, source, notes } = await request.json() as Record<string, unknown>;
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  const fields: Record<string, unknown> = {};
  if (typeof status === "string" && status.trim()) fields.Status = status.trim();
  if (typeof replied === "boolean") fields.Replied = replied;
  if (typeof name === "string") { if (!name.trim()) return Response.json({ error: "Name is required" }, { status: 400 }); fields.Name = name.trim(); }
  if (typeof email === "string") { if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return Response.json({ error: "Enter a valid email address" }, { status: 400 }); fields.Email = email.trim() || null; }
  if (typeof phone === "string") { const normalized = phone.trim() ? normalizeUsPhone(phone) : null; if (phone.trim() && !normalized) return Response.json({ error: "Enter a valid US phone number" }, { status: 400 }); fields.Phone = normalized; }
  if (typeof treatment === "string") fields["Treatment Interest"] = treatment.trim();
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
  invalidateLeadsBaseCache();
  bustCachePrefix("leads:");
  const fieldNames: Record<string, string> = { Status: "status", Replied: "replied", Name: "name", Email: "email", Phone: "phone", "Treatment Interest": "treatment", Message: "message", Source: "source", Notes: "notes" };
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

  invalidateLeadsBaseCache();
  bustCachePrefix("leads:");
  await logAuditEvent({ actor, action: "lead_deleted", category: "leads", resource: { type: "lead", id, label: existing ? str(existing.fields, "Name") : null }, summary: `Deleted ${existing ? str(existing.fields, "Name") || "a lead" : "a lead"}`, before: existing ? { name: str(existing.fields, "Name"), email: str(existing.fields, "Email"), phone: str(existing.fields, "Phone"), status: str(existing.fields, "Status"), source: str(existing.fields, "Source") } : undefined, request });
  return Response.json({ success: true });
}
