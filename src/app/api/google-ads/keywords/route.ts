import { addKeyword, addNegativeKeyword } from "@/lib/google/ads-client";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { logAuditEvent } from "@/lib/audit/log-audit-event";

export async function POST(request: Request) {
  let actor;
  try { ({ profile: actor } = await requireRole(request, "editor")); } catch (error) { return authErrorResponse(error); }
  if (!process.env.GOOGLE_ADS_DEVELOPER_TOKEN) {
    return Response.json({ error: "Google Ads not connected" }, { status: 503 });
  }

  const { action, adGroupId, campaignId, keyword, matchType } = await request.json();

  try {
    await logAuditEvent({ actor, action: "google_ads_change_requested", category: "google_ads", resource: { type: action === "add_keyword" ? "ad_group" : "campaign", id: String(action === "add_keyword" ? adGroupId : campaignId) }, summary: action === "add_keyword" ? "Requested a Google Ads keyword addition" : "Requested a negative keyword addition", metadata: { change_type: action, match_type: matchType ?? null }, request });
    if (action === "add_keyword") {
      await addKeyword(adGroupId, keyword, matchType ?? "BROAD");
      await logAuditEvent({ actor, action: "google_ads_change_completed", category: "google_ads", resource: { type: "ad_group", id: String(adGroupId) }, summary: "Added a Google Ads keyword", metadata: { change_type: action, match_type: matchType ?? "BROAD" }, request });
      return Response.json({ success: true, message: `Added "${keyword}" as ${matchType ?? "BROAD"} keyword` });
    }
    if (action === "add_negative") {
      await addNegativeKeyword(campaignId, keyword);
      await logAuditEvent({ actor, action: "google_ads_change_completed", category: "google_ads", resource: { type: "campaign", id: String(campaignId) }, summary: "Added a negative Google Ads keyword", metadata: { change_type: action }, request });
      return Response.json({ success: true, message: `Added "${keyword}" as negative keyword` });
    }
    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    await logAuditEvent({ actor, action: "action_failed", category: "google_ads", resource: { type: "google_ads", id: String(adGroupId || campaignId || "unknown") }, summary: "Google Ads keyword change failed", metadata: { operation: "google_ads_change_completed", change_type: action }, result: "failed", request });
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
