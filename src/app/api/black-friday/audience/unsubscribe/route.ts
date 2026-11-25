import { isAirtableConfigured } from "@/lib/airtable/config";
import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { AudienceError, unsubscribeList } from "@/lib/black-friday/audience-server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Paste a list of emails / phones (e.g. Hayden's unsubscribes). Body: { text, confirm? }.
 * Without confirm it only previews the matches; with confirm it unsubscribes them from everything.
 */
export async function POST(request: Request) {
  let actor;
  try {
    ({ profile: actor } = await requireRole(request, "editor"));
  } catch (error) {
    return authErrorResponse(error);
  }
  if (!isAirtableConfigured()) return Response.json({ error: "Airtable is not configured." }, { status: 503 });
  const body = (await request.json().catch(() => null)) as { text?: unknown; confirm?: unknown } | null;
  const text = typeof body?.text === "string" ? body.text.slice(0, 200_000) : "";
  if (!text.trim()) return Response.json({ error: "Paste at least one email or phone number." }, { status: 400 });
  const apply = body?.confirm === true;
  try {
    const result = await unsubscribeList(text, actor.full_name || actor.email || "", apply);
    if (apply && result.applied) {
      await logAuditEvent({ actor, action: "bf_bulk_unsubscribe", category: "campaigns", resource: { type: "bf_audience", label: "Black Friday list" }, summary: `Unsubscribed ${result.applied} Black Friday contacts from a pasted list`, metadata: { applied: result.applied, unmatched: result.unmatched.length }, request });
    }
    return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof AudienceError ? error.message : "Could not update the list. Please try again." }, { status: 503 });
  }
}
