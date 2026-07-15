import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { airtableFetch, safeAirtableError } from "@/lib/airtable/leads-base";
import { logAuditEvent } from "@/lib/audit/log-audit-event";
export async function PATCH(request: Request, { params }: { params: Promise<{ recordId: string }> }) {
  let actor;
  try { ({ profile: actor } = await requireRole(request, "editor")); } catch (error) { return authErrorResponse(error); }
  const { recordId } = await params;
  if (!/^rec[a-zA-Z0-9]+$/.test(recordId)) return Response.json({ error: "Invalid enrollment ID" }, { status: 400 });
  const body = await request.json().catch(() => null) as { action?: string; status?: string } | null;
  if (!body) return Response.json({ error: "Invalid request" }, { status: 400 });
  const existing = await airtableFetch(`${encodeURIComponent("Nurture Enrollments")}/${recordId}`);
  if (!existing.ok) return Response.json({ error: safeAirtableError(existing.status) }, { status: existing.status === 404 ? 404 : 502 });
  const record = await existing.json() as { fields: Record<string, unknown> };
  const fields = body.action === "stop" ? { Status: "Stopped", "Stop Reason": "Manual", "Stopped At Step": record.fields["Current Step"] ?? null } : body.status === "Active" || body.status === "Stopped" || body.status === "Completed" ? { Status: body.status } : null;
  if (!fields) return Response.json({ error: "Unsupported update" }, { status: 400 });
  const response = await airtableFetch(`${encodeURIComponent("Nurture Enrollments")}/${recordId}`, { method: "PATCH", body: JSON.stringify({ fields }) });
  if (!response.ok) {
    await logAuditEvent({ actor, action: "action_failed", category: "campaigns", resource: { type: "nurture_enrollment", id: recordId }, summary: "Campaign enrollment update could not be completed", metadata: { operation: body.action === "stop" ? "campaign_enrollment_stopped" : "campaign_step_changed" }, result: "failed", request });
    return Response.json({ error: safeAirtableError(response.status) }, { status: 502 });
  }
  await logAuditEvent({ actor, action: body.action === "stop" ? "campaign_enrollment_stopped" : "campaign_step_changed", category: "campaigns", resource: { type: "nurture_enrollment", id: recordId }, summary: body.action === "stop" ? "Stopped nurture enrollment" : "Changed nurture enrollment status", before: { status: record.fields.Status ?? null, current_step: record.fields["Current Step"] ?? null }, after: { status: fields.Status }, request });
  return Response.json({ success: true, enrollment: await response.json() });
}
