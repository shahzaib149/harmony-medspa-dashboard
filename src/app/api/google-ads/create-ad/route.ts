import { createResponsiveSearchAd } from "@/lib/google/ads-client";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { logAuditEvent } from "@/lib/audit/log-audit-event";

export async function POST(request: Request) {
  let actor;
  try { ({ profile: actor } = await requireRole(request, "editor")); } catch (error) { return authErrorResponse(error); }
  if (!process.env.GOOGLE_ADS_DEVELOPER_TOKEN) {
    return Response.json({ error: "Google Ads not connected" }, { status: 503 });
  }

  const { adGroupId, headlines, descriptions, finalUrl } = await request.json();

  if (!adGroupId || !headlines?.length || !descriptions?.length || !finalUrl) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const badH = (headlines as string[]).filter((h) => h.length > 30);
  const badD = (descriptions as string[]).filter((d) => d.length > 90);
  if (badH.length) return Response.json({ error: `Headlines must be ≤30 chars: ${badH.join(", ")}` }, { status: 400 });
  if (badD.length) return Response.json({ error: "Descriptions must be ≤90 chars" }, { status: 400 });

  try {
    await logAuditEvent({ actor, action: "google_ads_change_requested", category: "google_ads", resource: { type: "ad_group", id: String(adGroupId), label: `Ad group ${adGroupId}` }, summary: "Requested a new paused responsive search ad", metadata: { headline_count: headlines.length, description_count: descriptions.length }, request });
    await createResponsiveSearchAd({ adGroupId, headlines, descriptions, finalUrl });
    await logAuditEvent({ actor, action: "google_ads_change_completed", category: "google_ads", resource: { type: "ad_group", id: String(adGroupId), label: `Ad group ${adGroupId}` }, summary: "Created a paused responsive search ad", metadata: { headline_count: headlines.length, description_count: descriptions.length }, request });
    return Response.json({ success: true, message: "Ad created in PAUSED state. Review in Google Ads before enabling." });
  } catch (err) {
    await logAuditEvent({ actor, action: "action_failed", category: "google_ads", resource: { type: "ad_group", id: String(adGroupId) }, summary: "Responsive search ad creation failed", metadata: { operation: "google_ads_change_completed" }, result: "failed", request });
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
