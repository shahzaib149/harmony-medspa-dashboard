import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { listRecords } from "@/lib/airtable/leads-base";
import { callsNeedingDetails } from "@/lib/leads/call-overview";
import { listCalls } from "@/lib/leads/call-store";

export const dynamic = "force-dynamic";

/** Saved call leads, any Lead Type: enough to tell which calls already have details. */
function savedCallLeads() {
  const params = new URLSearchParams({ filterByFormula: '{Source}="Call Leads"' });
  for (const field of ["Source", "Message", "Notes"]) params.append("fields[]", field);
  return listRecords("Leads", params);
}

export async function GET(request: Request) {
  try { await requireRole(request, "viewer"); } catch (error) { return authErrorResponse(error); }
  try {
    const calls = await listCalls();
    // ?summary=needs-details: just the count the reminder pop-up needs.
    if (new URL(request.url).searchParams.get("summary") === "needs-details") {
      const needsDetails = callsNeedingDetails(await savedCallLeads(), calls).length;
      return Response.json({ needsDetails }, { headers: { "Cache-Control": "no-store" } });
    }
    return Response.json({ calls }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Call history is temporarily unavailable." }, { status: 503 });
  }
}
