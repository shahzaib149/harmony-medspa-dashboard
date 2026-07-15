import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { airtableFetch, linkedIds, listRecords, mapLead, normalizeUsPhone, safeAirtableError, type AirtableRecord } from "@/lib/airtable/leads-base";
import { isAirtableConfigured } from "@/lib/airtable/config";
import type { BulkEnrollmentRequest, BulkEnrollmentResult, BulkEnrollNewLead } from "@/lib/types/campaigns";
import { logAuditEvent } from "@/lib/audit/log-audit-event";

const blocked = new Set(["Booked", "Duplicate", "Failed", "Not Interested"]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneDigits = (value: string) => value.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
function validRecordId(value: string) { return /^rec[a-zA-Z0-9]+$/.test(value); }
function normalize(value: string | undefined) { return (value ?? "").trim().toLowerCase(); }
function validateNew(input: BulkEnrollNewLead) {
  const name = input.name?.trim(); const email = input.email?.trim(); const phone = input.phone?.trim();
  if (!name) return "Name is required";
  if (!email || !phone) return "Email and phone are required for the complete nurture sequence";
  if (email && !emailPattern.test(email)) return "Email is invalid";
  if (!normalizeUsPhone(phone)) return "Enter a valid US phone number";
  return null;
}
async function createEnrollment(leadId: string, firstSendAt: string, note = "Manually enrolled from Harmony dashboard") {
  const response = await airtableFetch(encodeURIComponent("Nurture Enrollments"), { method: "POST", body: JSON.stringify({ fields: { Lead: [leadId], Status: "Active", "Current Step": "Day 1 SMS", "Next Send At": firstSendAt, Notes: note } }) });
  if (!response.ok) throw new Error(safeAirtableError(response.status));
  return response.json() as Promise<AirtableRecord>;
}

export async function POST(request: Request) {
  let actor;
  try { ({ profile: actor } = await requireRole(request, "editor")); } catch (error) { return authErrorResponse(error); }
  if (!isAirtableConfigured()) return Response.json({ error: "Airtable is not configured" }, { status: 503 });
  const body = await request.json().catch(() => null) as (BulkEnrollmentRequest & { enrollmentNote?: string }) | null;
  if (!body || !Array.isArray(body.leadIds) || !Array.isArray(body.newLeads) || !body.firstSendAt || body.timezone !== "America/New_York") return Response.json({ error: "Invalid enrollment request" }, { status: 400 });
  if (!Number.isFinite(Date.parse(body.firstSendAt)) || !/[zZ]|[+-]\d\d:\d\d$/.test(body.firstSendAt)) return Response.json({ error: "First send time must be an ISO date-time with offset" }, { status: 400 });
  if (body.leadIds.length + body.newLeads.length > 500) return Response.json({ error: "Enrollment is limited to 500 leads" }, { status: 400 });
  const result: BulkEnrollmentResult = { enrolled: [], skipped: [], failed: [] };
  try {
    const [leadRecords, enrollments] = await Promise.all([listRecords("Leads"), listRecords("Nurture Enrollments")]);
    const leadMap = new Map(leadRecords.map((record) => [record.id, record]));
    const activeIds = new Set(enrollments.filter((record) => String(record.fields.Status) === "Active").flatMap((record) => linkedIds(record.fields.Lead)));
    const byEmail = new Map(leadRecords.filter((record) => record.fields.Email).map((record) => [normalize(String(record.fields.Email)), record]));
    const byPhone = new Map(leadRecords.filter((record) => record.fields.Phone).map((record) => [phoneDigits(String(record.fields.Phone)), record]));
    const requested = [...new Set(body.leadIds)];
    for (const leadId of requested) {
      const record = validRecordId(leadId) ? leadMap.get(leadId) : undefined; const lead = record ? mapLead(record) : null;
      const reason = !record ? "Lead does not exist" : activeIds.has(leadId) ? "Already active in nurture" : blocked.has(lead!.status) ? lead!.status : lead!.replied ? "Replied" : !lead!.email || !normalizeUsPhone(lead!.phone) ? "Valid email and US phone are required" : null;
      if (reason) { result.skipped.push({ leadId, name: lead?.name, reason }); continue; }
      try {
        if (lead!.status !== "Contacted") await airtableFetch(`${encodeURIComponent("Leads")}/${leadId}`, { method: "PATCH", body: JSON.stringify({ fields: { Status: "Contacted" } }) });
        const enrollment = await createEnrollment(leadId, body.firstSendAt, body.enrollmentNote); activeIds.add(leadId); result.enrolled.push({ leadId, name: lead!.name, enrollmentId: enrollment.id });
      } catch (error) { result.failed.push({ leadId, name: lead!.name, reason: error instanceof Error ? error.message : "Enrollment failed" }); }
    }
    const batchKeys = new Set<string>();
    for (const input of body.newLeads) {
      const error = validateNew(input); const key = normalize(input.email) || phoneDigits(input.phone ?? "");
      if (error) { result.failed.push({ name: input.name, reason: error }); continue; }
      if (batchKeys.has(key)) { result.skipped.push({ name: input.name, reason: "Duplicate row in this submission" }); continue; } batchKeys.add(key);
      let record = (input.email ? byEmail.get(normalize(input.email)) : undefined) ?? (input.phone ? byPhone.get(phoneDigits(input.phone)) : undefined);
      let leadId = record?.id;
      if (record && activeIds.has(record.id)) { result.skipped.push({ leadId: record.id, name: input.name, reason: "Already active in nurture" }); continue; }
      if (record) { const lead = mapLead(record); if (blocked.has(lead.status) || lead.replied) { result.skipped.push({ leadId: record.id, name: lead.name, reason: lead.replied ? "Replied" : lead.status }); continue; } }
      try {
        if (!record) {
          const fields: Record<string, unknown> = { Name: input.name.trim(), Status: "Contacted", Source: input.source?.trim() || "Manual Campaign Entry", "Lead Created At": new Date().toISOString(), Replied: false };
          if (input.email?.trim()) fields.Email = input.email.trim(); if (input.phone?.trim()) fields.Phone = normalizeUsPhone(input.phone)!; if (input.message?.trim()) fields.Message = input.message.trim(); if (input.notes?.trim()) fields.Notes = input.notes.trim();
          const response = await airtableFetch(encodeURIComponent("Leads"), { method: "POST", body: JSON.stringify({ fields, typecast: true }) });
          if (!response.ok) throw new Error(safeAirtableError(response.status)); record = await response.json() as AirtableRecord; leadId = record.id;
        } else if (mapLead(record).status !== "Contacted") await airtableFetch(`${encodeURIComponent("Leads")}/${record.id}`, { method: "PATCH", body: JSON.stringify({ fields: { Status: "Contacted" } }) });
        const enrollment = await createEnrollment(leadId!, body.firstSendAt, body.enrollmentNote); activeIds.add(leadId!); result.enrolled.push({ leadId, name: input.name, enrollmentId: enrollment.id });
      } catch (caught) { result.failed.push({ leadId, name: input.name, reason: caught instanceof Error ? caught.message : "Enrollment failed" }); }
    }
    await logAuditEvent({ actor, action: "campaign_enrollment_started", category: "campaigns", resource: { type: "campaign", id: "14-day-nurture", label: "14-Day Nurture" }, summary: `Started nurture enrollment for ${result.enrolled.length} leads`, metadata: { requested: body.leadIds.length + body.newLeads.length, enrolled: result.enrolled.length, skipped: result.skipped.length, failed: result.failed.length }, result: result.failed.length && !result.enrolled.length ? "failed" : "success", request });
    return Response.json(result, { status: result.enrolled.length ? 201 : result.failed.length ? 422 : 200 });
  } catch {
    await logAuditEvent({ actor, action: "action_failed", category: "campaigns", resource: { type: "campaign", id: "14-day-nurture", label: "14-Day Nurture" }, summary: "Nurture enrollment could not be completed", metadata: { operation: "campaign_enrollment_started", requested: body.leadIds.length + body.newLeads.length }, result: "failed", request });
    return Response.json({ error: "Could not complete enrollment" }, { status: 500 });
  }
}
