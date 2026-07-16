import {
  createResponsiveSearchAd,
  GoogleAdsWriteError,
  resolveSearchAdTarget,
  verifyPausedSearchAd,
} from "@/lib/google/ads-client";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { getPendingAd, reviewPackageFields, updatePendingAd } from "@/lib/airtable/pending-ads";
import { unconfirmedApprovals, validatePendingAdPackage } from "@/lib/google/pending-ads";

function actorLabel(actor: { full_name: string | null; email: string | null }) {
  return actor.full_name?.trim() || actor.email || "Dashboard admin";
}

function credentialsConfigured() {
  return Boolean(
    process.env.GOOGLE_ADS_CLIENT_ID &&
    process.env.GOOGLE_ADS_CLIENT_SECRET &&
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
    process.env.GOOGLE_ADS_REFRESH_TOKEN &&
    process.env.GOOGLE_ADS_CUSTOMER_ID
  );
}

function safeGoogleError(error: unknown) {
  if (error instanceof GoogleAdsWriteError) {
    const knownMessage = [
      "The selected campaign and ad group were not found in Google Ads.",
      "More than one matching ad group was found. Use a unique campaign and ad group.",
      "Google Ads did not return the created ad resource name.",
      "The created ad could not be verified in Google Ads.",
      "Google Ads returned the created ad with an unexpected status.",
    ].includes(error.message)
      ? error.message
      : "Google Ads rejected the request. Review the ad copy, URL, pins, account access, and API configuration before retrying.";
    return {
      message: knownMessage,
      providerRequestId: error.requestId,
    };
  }
  return {
    message: "Google Ads could not create the paused ad.",
    providerRequestId: null,
  };
}

export async function POST(request: Request) {
  let actor;
  try {
    ({ profile: actor } = await requireRole(request, "admin"));
  } catch (error) {
    return authErrorResponse(error);
  }

  if (!credentialsConfigured()) {
    return Response.json({ error: "Google Ads is not connected." }, { status: 503 });
  }

  const body = await request.json().catch(() => null) as {
    pendingAdId?: string;
    explicitConfirmation?: boolean;
  } | null;
  if (!body?.pendingAdId || body.explicitConfirmation !== true) {
    return Response.json({ error: "Explicit confirmation is required." }, { status: 400 });
  }

  let ad;
  try {
    ad = await getPendingAd(body.pendingAdId);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Pending ad could not be loaded." },
      { status: 500 },
    );
  }

  const review = ad.reviewPackage;
  const metadata = {
    pending_ad_id: ad.id,
    campaign: review.campaignName,
    ad_group: review.adGroupName,
    final_url: review.finalUrl,
    proposed_status: "PAUSED",
    risk_level: "Medium",
  };

  if (ad.status !== "Pending Review") {
    return Response.json({ error: "Only ads in Pending Review can be published." }, { status: 409 });
  }

  const validationErrors = validatePendingAdPackage(review);
  const missingApprovals = unconfirmedApprovals(review);
  if (validationErrors.length || missingApprovals.length) {
    return Response.json({
      error: "The ad is not ready to publish.",
      validationErrors,
      missingApprovals: missingApprovals.map((item) => item.label),
    }, { status: 400 });
  }

  await logAuditEvent({
    actor,
    action: "pending_ad_publish_confirmed",
    category: "google_ads",
    resource: { type: "pending_ad", id: ad.id, label: review.internalTitle },
    summary: "Confirmed creation of a paused responsive search ad",
    metadata: { ...metadata, result: "confirmed" },
    request,
  });

  let createdResourceName = "";
  try {
    let publishReview = review;
    const canRecover = Boolean(
      ad.ad_resource_name &&
      review.history?.some((item) => item.type === "google_ad_resource_created"),
    );
    if (canRecover) {
      createdResourceName = ad.ad_resource_name;
    } else {
      const target = await resolveSearchAdTarget(review.campaignName, review.adGroupName);
      const created = await createResponsiveSearchAd({
        adGroupId: target.adGroupId,
        headlines: review.headlines.map((asset) => ({ text: asset.text, pinnedField: asset.pinnedField })),
        descriptions: review.descriptions.map((asset) => ({ text: asset.text, pinnedField: asset.pinnedField })),
        finalUrl: review.finalUrl,
        path1: review.path1,
        path2: review.path2,
      });
      createdResourceName = created.resourceName;
      publishReview = {
        ...review,
        history: [
          ...(review.history ?? []),
          {
            type: "google_ad_resource_created",
            at: new Date().toISOString(),
            actor: actorLabel(actor),
            detail: "Google Ads returned a resource name; paused-status verification is pending.",
          },
        ].slice(-50),
      };
      await updatePendingAd(ad.id, {
        ...reviewPackageFields(publishReview),
        ad_resource_name: createdResourceName,
      });
    }
    const verified = await verifyPausedSearchAd(createdResourceName);
    const publishedAt = new Date().toISOString();
    const publishedBy = actorLabel(actor);
    const publishedReview = {
      ...publishReview,
      publication: {
        resourceName: verified.resourceName,
        adId: verified.adId,
        status: verified.status,
        publishedAt,
        publishedBy,
      },
      history: [
        ...(review.history ?? []),
        {
          type: "google_ad_created_paused",
          at: publishedAt,
          actor: publishedBy,
          detail: `Google Ads resource ${verified.resourceName} verified as PAUSED.`,
        },
      ].slice(-50),
    };
    await updatePendingAd(ad.id, {
      ...reviewPackageFields(publishedReview),
      status: "Published / Created Paused",
      ad_resource_name: verified.resourceName,
    });
    const audit = await logAuditEvent({
      actor,
      action: "google_ad_created_paused",
      category: "google_ads",
      resource: { type: "pending_ad", id: ad.id, label: review.internalTitle },
      summary: "Created and verified a paused responsive search ad",
      after: {
        status: verified.status,
        google_ads_resource_id: verified.resourceName,
        google_ads_ad_id: verified.adId,
        published_at: publishedAt,
        published_by: publishedBy,
      },
      metadata: { ...metadata, result: "created_paused", google_ads_resource_id: verified.resourceName },
      request,
    });
    return Response.json({
      success: true,
      message: "Paused ad created in Google Ads.",
      detail: "This ad is not live yet. Hayden can review and enable it from the Google Ads account.",
      status: verified.status,
      resourceName: verified.resourceName,
      adId: verified.adId,
      requestId: audit.requestId,
    });
  } catch (error) {
    const safe = safeGoogleError(error);
    const audit = await logAuditEvent({
      actor,
      action: "google_ad_create_failed",
      category: "google_ads",
      resource: { type: "pending_ad", id: ad.id, label: review.internalTitle },
      summary: "Paused responsive search ad creation failed",
      metadata: { ...metadata, result: "failed", provider_request_id: safe.providerRequestId, google_ads_resource_id: createdResourceName || null },
      result: "failed",
      request,
    });
    return Response.json({
      error: "Ad could not be created.",
      message: createdResourceName
        ? "Google Ads returned a resource, but the paused ad could not be fully verified and saved. Check Google Ads before retrying; the dashboard record remains pending."
        : safe.message,
      requestId: audit.requestId,
      providerRequestId: safe.providerRequestId,
    }, { status: 500 });
  }
}
