import { setCampaignStatus } from "@/lib/google/ads-client";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { logAuditEvent } from "@/lib/audit/log-audit-event";

export async function POST(request: Request) {
  let actor;
  try { ({ profile: actor } = await requireRole(request, "editor")); } catch (error) { return authErrorResponse(error); }
  if (!process.env.GOOGLE_ADS_DEVELOPER_TOKEN) {
    return Response.json({ error: "Google Ads not connected" }, { status: 503 });
  }

  const { campaignId, status } = await request.json();

  if (!campaignId || !["ENABLED", "PAUSED"].includes(status)) {
    return Response.json({ error: "campaignId and status (ENABLED|PAUSED) required" }, { status: 400 });
  }

  try {
    await logAuditEvent({ actor, action: "google_ads_change_requested", category: "google_ads", resource: { type: "campaign", id: String(campaignId), label: `Google Ads campaign ${campaignId}` }, summary: `Requested campaign status change to ${status}`, after: { status }, request });
    await setCampaignStatus(campaignId, status);
    await logAuditEvent({ actor, action: "google_ads_change_completed", category: "google_ads", resource: { type: "campaign", id: String(campaignId), label: `Google Ads campaign ${campaignId}` }, summary: `Changed campaign status to ${status}`, after: { status }, request });
    return Response.json({ success: true, message: `Campaign ${status.toLowerCase()}` });
  } catch (err) {
    await logAuditEvent({ actor, action: "action_failed", category: "google_ads", resource: { type: "campaign", id: String(campaignId) }, summary: "Google Ads campaign status change failed", metadata: { operation: "google_ads_change_completed", proposed_status: status }, result: "failed", request });
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
