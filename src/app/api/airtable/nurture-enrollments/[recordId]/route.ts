import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { airtableFetch, safeAirtableError } from "@/lib/airtable/leads-base";
export async function PATCH(request: Request, { params }: { params: Promise<{ recordId: string }> }) {
  try { await requireRole(request, "editor"); } catch (error) { return authErrorResponse(error); }
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
  if (!response.ok) return Response.json({ error: safeAirtableError(response.status) }, { status: 502 });
  return Response.json({ success: true, enrollment: await response.json() });
}
