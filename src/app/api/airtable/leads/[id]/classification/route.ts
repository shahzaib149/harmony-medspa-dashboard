import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { isAirtableConfigured } from "@/lib/airtable/config";
import {
  airtableFetch,
  invalidateLeadsBaseCache,
  linkedIds,
  safeAirtableError,
  textField,
} from "@/lib/airtable/leads-base";
import { logAuditEvent } from "@/lib/audit/log-audit-event";
import {
  isLeadType,
  NEEDS_REVIEW_TAG,
  NOT_A_LEAD_STATUS,
  NOT_A_LEAD_TYPES,
  REAL_LEAD_TYPES,
} from "@/lib/leads/classification";
import { mapLead, type AirtableRecord } from "@/lib/leads/map-lead";
import { bustCachePrefix } from "@/lib/server-cache";

const LEADS_TABLE = encodeURIComponent("Leads");
const ENROLLMENTS_TABLE = encodeURIComponent("Nurture Enrollments");
const RECORD_ID = /^rec[a-zA-Z0-9]{14}$/;
// Statuses a manual reclassification must never overwrite.
const PRESERVED_STATUSES = new Set(["Booked", "Duplicate"]);

async function stopActiveEnrollments(lead: AirtableRecord) {
  const stopped: string[] = [];
  for (const enrollmentId of linkedIds(lead.fields["Nurture Enrollments"])) {
    const response = await airtableFetch(`${ENROLLMENTS_TABLE}/${enrollmentId}`, { cache: "no-store" });
    if (!response.ok) continue;
    const enrollment = (await response.json()) as AirtableRecord;
    if (textField(enrollment.fields, "Status") !== "Active") continue;
    const currentStep = textField(enrollment.fields, "Current Step");
    const update = await airtableFetch(`${ENROLLMENTS_TABLE}/${enrollmentId}`, {
      method: "PATCH",
      body: JSON.stringify({
        fields: {
          Status: "Stopped",
          "Stop Reason": "Manual",
          ...(currentStep ? { "Stopped At Step": currentStep } : {}),
        },
      }),
    });
    if (!update.ok) throw new Error(`Could not stop nurture enrollment (${update.status})`);
    stopped.push(enrollmentId);
  }
  return stopped;
}

// POST — staff override of the AI classification.
// Body: { leadType: "Real Lead" | "Existing Patient" | ... }
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  let actor;
  try { ({ profile: actor } = await requireRole(request, "editor")); }
  catch (error) { return authErrorResponse(error); }

  const { id } = await context.params;
  if (!RECORD_ID.test(id)) return Response.json({ error: "Invalid lead ID." }, { status: 400 });
  if (!isAirtableConfigured()) return Response.json({ error: "Airtable is not configured." }, { status: 500 });

  const body = (await request.json().catch(() => null)) as { leadType?: unknown } | null;
  const leadType = body?.leadType;
  if (!isLeadType(leadType) || (leadType !== "Real Lead" && !NOT_A_LEAD_TYPES.includes(leadType))) {
    return Response.json({ error: "Choose Real Lead or one of the not-a-lead types." }, { status: 400 });
  }

  const existingResponse = await airtableFetch(`${LEADS_TABLE}/${id}`, { cache: "no-store" });
  if (!existingResponse.ok) {
    return Response.json({ error: existingResponse.status === 404 ? "Lead not found." : safeAirtableError(existingResponse.status) }, { status: existingResponse.status === 404 ? 404 : 502 });
  }
  const existing = (await existingResponse.json()) as AirtableRecord;
  const before = mapLead(existing);
  const markingReal = REAL_LEAD_TYPES.includes(leadType);
  const actorName = actor.full_name?.trim() || actor.email || "Harmony dashboard user";

  const tags = before.aiTags.filter((tag) => tag !== NEEDS_REVIEW_TAG);
  const fields: Record<string, unknown> = {
    "Lead Type": leadType,
    "Is Real Lead": markingReal,
    "Classification Method": "Manual",
    "Classified At": new Date().toISOString(),
    "Classification Overridden By": actorName,
    "AI Tags": tags,
  };
  if (!PRESERVED_STATUSES.has(before.status)) {
    if (!markingReal) fields.Status = NOT_A_LEAD_STATUS;
    else if (before.status === NOT_A_LEAD_STATUS) fields.Status = "Contacted";
  }

  const updateResponse = await airtableFetch(`${LEADS_TABLE}/${id}`, {
    method: "PATCH",
    // typecast only so a missing "Not a Lead" status option can never block an override.
    body: JSON.stringify({ fields, typecast: true }),
  });
  const updated = (await updateResponse.json().catch(() => null)) as (AirtableRecord & { error?: { message?: string } }) | null;
  if (!updateResponse.ok || !updated) {
    await logAuditEvent({ actor, action: "action_failed", category: "leads", resource: { type: "lead", id, label: before.name }, summary: "Lead classification override could not be saved", metadata: { operation: "lead_classification_overridden", lead_type: leadType }, result: "failed", request });
    return Response.json({ error: updated?.error?.message ?? safeAirtableError(updateResponse.status) }, { status: 502 });
  }

  let stoppedEnrollments: string[] = [];
  let stopError: string | null = null;
  if (!markingReal) {
    try { stoppedEnrollments = await stopActiveEnrollments(existing); }
    catch (error) { stopError = error instanceof Error ? error.message : "Could not stop nurture enrollment"; }
  }

  invalidateLeadsBaseCache();
  bustCachePrefix("leads:");
  const after = mapLead(updated);
  const audit = await logAuditEvent({
    actor,
    action: "lead_classification_overridden",
    category: "leads",
    resource: { type: "lead", id, label: before.name },
    summary: markingReal
      ? `Marked ${before.name || "lead"} as a real lead`
      : `Marked ${before.name || "lead"} as not a lead (${leadType})`,
    before: { lead_type: before.leadType || null, is_real_lead: before.isRealLead, classification_method: before.classificationMethod || null, status: before.status },
    after: { lead_type: after.leadType, is_real_lead: after.isRealLead, classification_method: after.classificationMethod, status: after.status },
    metadata: { stopped_enrollments: stoppedEnrollments, stop_error: stopError },
    result: stopError ? "failed" : "success",
    request,
  });

  return Response.json({
    success: true,
    lead: after,
    stoppedEnrollments: stoppedEnrollments.length,
    stopError,
    requestId: audit.requestId,
  });
}
