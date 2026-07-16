import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { getPendingAd } from "@/lib/airtable/pending-ads";
import { addKeywordsBatch, addNegativeKeywordsBatch, resolveSearchAdTarget } from "@/lib/google/ads-client";

export async function POST(request: Request) {
  let actor;
  try {
    ({ profile: actor } = await requireRole(request, "admin"));
  } catch (error) {
    return authErrorResponse(error);
  }

  const body = await request.json().catch(() => null) as {
    pendingAdId?: string;
    action?: "add_keywords" | "add_negatives";
    explicitConfirmation?: boolean;
  } | null;
  if (!body?.pendingAdId || !body.action || body.explicitConfirmation !== true) {
    return Response.json({ error: "A pending ad, action, and explicit confirmation are required." }, { status: 400 });
  }

  try {
    const ad = await getPendingAd(body.pendingAdId);
    if (ad.status !== "Pending Review") {
      return Response.json({ error: "Recommendations can only be added from an active pending review." }, { status: 409 });
    }
    const review = ad.reviewPackage;
    const target = await resolveSearchAdTarget(review.campaignName, review.adGroupName);
    const resource = body.action === "add_keywords"
      ? { type: "ad_group", id: target.adGroupId, label: target.adGroupName }
      : { type: "campaign", id: target.campaignId, label: target.campaignName };
    if (body.action === "add_keywords") {
      await addKeywordsBatch(target.adGroupId, review.recommendedKeywords);
    } else {
      await addNegativeKeywordsBatch(target.campaignId, review.recommendedNegativeKeywords);
    }
    const count = body.action === "add_keywords"
      ? review.recommendedKeywords.length
      : review.recommendedNegativeKeywords.length;
    const audit = await logAuditEvent({
      actor,
      action: body.action === "add_keywords" ? "google_ads_keywords_added" : "google_ads_negatives_added",
      category: "google_ads",
      resource,
      summary: body.action === "add_keywords"
        ? "Added explicitly confirmed keyword recommendations"
        : "Added explicitly confirmed campaign negative recommendations",
      metadata: {
        pending_ad_id: ad.id,
        campaign: review.campaignName,
        ad_group: review.adGroupName,
        final_url: review.finalUrl,
        count,
        result: "completed",
      },
      request,
    });
    return Response.json({ success: true, count, requestId: audit.requestId });
  } catch {
    const audit = await logAuditEvent({
      actor,
      action: "google_ads_recommendations_failed",
      category: "google_ads",
      resource: { type: "pending_ad", id: body.pendingAdId },
      summary: "A confirmed Google Ads recommendation action failed",
      metadata: { pending_ad_id: body.pendingAdId, operation: body.action, result: "failed" },
      result: "failed",
      request,
    });
    return Response.json({
      error: "The recommendations could not be added.",
      message: "Google Ads rejected or could not complete the request. Review the account before retrying.",
      requestId: audit.requestId,
    }, { status: 500 });
  }
}
