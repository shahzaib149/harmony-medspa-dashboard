import { isAirtableConfigured } from "@/lib/airtable/config";
import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { isOptOut } from "@/lib/black-friday/audience";
import { AudienceError, optOutContact } from "@/lib/black-friday/audience-server";

export const dynamic = "force-dynamic";

const SUMMARY = { email: "Stopped Black Friday emails", sms: "Stopped Black Friday texts", all: "Unsubscribed from Black Friday messages" } as const;

/** Stop emails, texts or everything for one Black Friday contact. Body: { stop: "email" | "sms" | "all" }. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let actor;
  try {
    ({ profile: actor } = await requireRole(request, "editor"));
  } catch (error) {
    return authErrorResponse(error);
  }
  if (!isAirtableConfigured()) return Response.json({ error: "Airtable is not configured." }, { status: 503 });
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { stop?: unknown } | null;
  if (!isOptOut(body?.stop)) return Response.json({ error: "Choose email, sms or all." }, { status: 400 });
  try {
    const result = await optOutContact(id, body.stop, actor.full_name || actor.email || "");
    if (!result) return Response.json({ error: "This contact is not on the Black Friday list." }, { status: 404 });
    await logAuditEvent({ actor, action: "bf_contact_opt_out", category: "campaigns", resource: { type: "bf_audience", id, label: result.name }, summary: `${SUMMARY[body.stop]}: ${result.name}`, after: result.fields, request });
    return Response.json({ ok: true, fields: result.fields });
  } catch (error) {
    return Response.json({ error: error instanceof AudienceError ? error.message : "Could not update the contact. Please try again." }, { status: 503 });
  }
}
