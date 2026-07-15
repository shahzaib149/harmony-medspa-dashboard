import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { airtableFetch, linkedIds, listRecords, safeAirtableError, textField } from "@/lib/airtable/leads-base";

async function remove(table: string, ids: string[]) {
  let deleted = 0;
  for (let index = 0; index < ids.length; index += 10) {
    const query = new URLSearchParams();
    ids.slice(index, index + 10).forEach((id) => query.append("records[]", id));
    const response = await airtableFetch(`${encodeURIComponent(table)}?${query}`, { method: "DELETE" });
    if (!response.ok) throw new Error(`${table}: ${safeAirtableError(response.status)}`);
    deleted += (await response.json() as { records?: unknown[] }).records?.length ?? 0;
  }
  return deleted;
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let actor;
  try { ({ profile: actor } = await requireRole(request, "editor")); } catch (error) { return authErrorResponse(error); }
  const { id } = await params;
  if (!/^rec[a-zA-Z0-9]+$/.test(id)) return Response.json({ error: "Invalid Lead ID" }, { status: 400 });
  const leadResponse = await airtableFetch(`${encodeURIComponent("Leads")}/${id}`);
  const lead = leadResponse.ok ? await leadResponse.json() as { fields: Record<string, unknown> } : null;
  const label = lead ? textField(lead.fields, "Name") : "Lead";
  const result = { messageLogsDeleted: 0, nurtureEnrollmentsDeleted: 0, leadDeleted: false };
  try {
    const [enrollments, messages] = await Promise.all([listRecords("Nurture Enrollments"), listRecords("Message Log")]);
    result.messageLogsDeleted = await remove("Message Log", messages.filter((item) => linkedIds(item.fields["Recipient Lead"]).includes(id)).map((item) => item.id));
    result.nurtureEnrollmentsDeleted = await remove("Nurture Enrollments", enrollments.filter((item) => linkedIds(item.fields.Lead).includes(id)).map((item) => item.id));
    const response = await airtableFetch(`${encodeURIComponent("Leads")}/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error(`Lead: ${safeAirtableError(response.status)}`);
    result.leadDeleted = true;
    await logAuditEvent({ actor, action: "lead_deleted", category: "leads", resource: { type: "lead", id, label }, summary: `Permanently deleted ${label || "a lead"} and linked activity`, before: lead ? { name: label, email: textField(lead.fields, "Email"), phone: textField(lead.fields, "Phone"), status: textField(lead.fields, "Status") } : undefined, metadata: result, request });
    return Response.json(result);
  } catch (error) {
    await logAuditEvent({ actor, action: "action_failed", category: "leads", resource: { type: "lead", id, label }, summary: `Permanent deletion of ${label || "a lead"} was incomplete`, metadata: { operation: "lead_deleted", ...result }, result: "failed", request });
    return Response.json({ error: error instanceof Error ? error.message : "Permanent deletion failed", partial: true, ...result }, { status: 500 });
  }
}
