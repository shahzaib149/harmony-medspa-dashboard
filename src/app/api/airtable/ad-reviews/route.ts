import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { logAuditEvent } from "@/lib/audit/log-audit-event";
import {
  PENDING_ADS_BASE_ID,
  PENDING_ADS_TABLE_ID,
  AirtableRequestError,
  adReviewCounts,
  getPendingAd,
  listAdReviews,
  publicationFields,
  reviewPackageFields,
  updatePendingAd,
  type AdReviewStatusFilter,
} from "@/lib/airtable/pending-ads";
import {
  buildSerializedDescriptionAssets,
  buildSerializedHeadlineAssets,
  isGoogleAdResourceName,
  isVerifiedPublishedAd,
  parseReviewPackage,
  unconfirmedApprovals,
  validatePendingAdPackage,
  type PendingAd,
} from "@/lib/google/pending-ads";
import { postPublishAdToMake } from "@/lib/make/publish-ad";

const STATUS_FILTERS = new Set<AdReviewStatusFilter>(["pending", "published", "failed", "all"]);

function actorLabel(actor: { full_name: string | null; email: string | null }) {
  return actor.full_name?.trim() || actor.email || "Dashboard admin";
}

function publicError(message: string, status = 500) {
  return Response.json({ error: message }, { status });
}

function airtablePublicError(error: unknown) {
  if (error instanceof AirtableRequestError && error.status === 403) {
    return publicError(
      "Airtable record access is not authorized. Grant this integration data.records:read and data.records:write access to the Ads base.",
      503,
    );
  }
  return publicError("Ad publishing records could not be loaded. Please refresh and try again.");
}

function historyFields(ad: PendingAd, entry: { type: string; at: string; actor: string; detail: string }) {
  return reviewPackageFields({
    ...ad.reviewPackage,
    history: [...(ad.reviewPackage.history ?? []), entry].slice(-50),
  });
}

function publishingPayload(ad: PendingAd, requestedAt: string, publishedBy: string) {
  const review = ad.reviewPackage;
  const headlineAssetsJson = buildSerializedHeadlineAssets(review.headlines);
  const descriptionAssetsJson = buildSerializedDescriptionAssets(review.descriptions);

  return {
    event: "publish_as_paused_ad_requested",
    action: "CREATE_PAUSED_RESPONSIVE_SEARCH_AD",
    idempotencyKey: ad.idempotency_key,
    requestedStatus: "PAUSED",
    source: "pending_ad_review",
    sentAt: requestedAt,
    publishRequestedAt: requestedAt,
    publishedBy,
    airtableBaseId: PENDING_ADS_BASE_ID,
    airtableTableId: PENDING_ADS_TABLE_ID,
    publicationStatusField: "status",
    googleAdsStatusField: "Google Ads Status",
    googleResourceNameField: "ad_resource_name",
    publishedAtField: "Published At",
    publishedByField: "Published By",
    publishErrorField: "Publish Error",
    idempotencyKeyField: "Idempotency Key",
    lastStatusSyncField: "Last Status Sync",
    pendingAdId: ad.id,
    businessName: ad.business_name,
    campaignId: review.campaignId?.trim() || "",
    campaignName: review.campaignName,
    adGroupId: review.adGroupId?.trim() || "",
    adGroupName: review.adGroupName,
    adType: "RESPONSIVE_SEARCH_AD",
    finalUrl: review.finalUrl,
    path1: review.path1,
    path2: review.path2,
    headlineAssetsJson,
    descriptionAssetsJson,
    ...Object.fromEntries(review.headlines.map((item, index) => [`headline${index + 1}`, item.text])),
    ...Object.fromEntries(review.headlines.map((item, index) => [`headline${index + 1}PinnedField`, item.pinnedField ?? ""])),
    allHeadlines: review.headlines.map((item) => item.text),
    headlineAssets: review.headlines,
    ...Object.fromEntries(review.descriptions.map((item, index) => [`description${index + 1}`, item.text])),
    ...Object.fromEntries(review.descriptions.map((item, index) => [`description${index + 1}PinnedField`, item.pinnedField ?? ""])),
    allDescriptions: review.descriptions.map((item) => item.text),
    descriptionAssets: review.descriptions,
    strategyLabel: review.strategyLabel,
    notes: review.notes,
    recommendedKeywords: review.recommendedKeywords,
    recommendedNegativeKeywords: review.recommendedNegativeKeywords,
    assets: review.assets,
    approvalChecklist: review.approvalChecklist,
    history: review.history,
    pendingAd: ad,
    reviewPackage: review,
  };
}

export async function GET(request: Request) {
  try { await requireRole(request, "viewer"); } catch (error) { return authErrorResponse(error); }
  const url = new URL(request.url);
  const id = url.searchParams.get("id")?.trim();
  try {
    if (id) return Response.json({ ad: await getPendingAd(id) });
    const requested = (url.searchParams.get("status") || "pending") as AdReviewStatusFilter;
    const status = STATUS_FILTERS.has(requested) ? requested : "pending";
    const all = await listAdReviews("all");
    const ads = status === "all"
      ? all
      : status === "pending"
        ? all.filter((ad) => ad.publication_status === "Pending Review" || ad.publication_status === "Publishing")
        : all.filter((ad) => ad.publication_status.toLowerCase() === status);
    return Response.json({ ads, count: ads.length, counts: adReviewCounts(all) });
  } catch (error) {
    console.error("[ad-reviews] read failed", error);
    return airtablePublicError(error);
  }
}

type WorkflowAction = "publish_requested" | "retry" | "return_pending" | "mark_failed" | "acknowledge_result";

export async function PATCH(request: Request) {
  let actor;
  try { ({ profile: actor } = await requireRole(request, "admin")); } catch (error) { return authErrorResponse(error); }
  const body = await request.json().catch(() => null) as { action?: WorkflowAction; id?: string; error?: string; reviewPackage?: unknown } | null;
  if (!body?.id || !body.action) return publicError("Ad ID and workflow action are required.", 400);

  let before: PendingAd;
  try { before = await getPendingAd(body.id); } catch (error) {
    console.error("[ad-reviews] record read failed", error);
    return airtablePublicError(error);
  }

  if (body.reviewPackage) {
    const review = parseReviewPackage(body.reviewPackage);
    if (review) {
      try {
        before = await updatePendingAd(before.id, reviewPackageFields(review));
      } catch (error) {
        console.error("[ad-reviews] package update failed", error);
      }
    }
  }

  const now = new Date().toISOString();
  const by = actorLabel(actor);
  const resource = { type: "pending_ad", id: before.id, label: before.reviewPackage.internalTitle };

  try {
    if (body.action === "publish_requested" || body.action === "retry") {
      const expected = body.action === "retry" ? "Failed" : "Pending Review";
      if (before.publication_status !== expected) {
        return publicError(
          before.publication_status === "Publishing"
            ? "This ad is already publishing. Wait for the current attempt to finish."
            : "This ad is not available for that publishing action.",
          409,
        );
      }
      if (isGoogleAdResourceName(before.ad_resource_name)) return publicError("This ad already has a Google Ads resource and cannot be published twice.", 409);
      const validationErrors = validatePendingAdPackage(before.reviewPackage);
      const missingApprovals = unconfirmedApprovals(before.reviewPackage);
      if (validationErrors.length || missingApprovals.length) {
        const details = [
          ...validationErrors,
          ...missingApprovals.map((item) => `Approval required: ${item.label}`),
        ];
        console.error("[ad-reviews] validation / approval check failed", details);
        return Response.json({
          error: `The ad is not ready to publish: ${details.join("; ")}`,
          validationErrors,
          missingApprovals: missingApprovals.map((item) => item.label),
        }, { status: 400 });
      }
      const idempotencyKey = before.idempotency_key || `pending-ad:${before.id}`;
      const eventType = body.action === "retry" ? "ad_publish_retried" : "ad_publish_requested";
      const after = await updatePendingAd(before.id, {
        ...historyFields(before, { type: eventType, at: now, actor: by, detail: "Paused-ad publishing sent to the Make workflow." }),
        ...publicationFields({
          status: "Publishing",
          googleAdsStatus: "",
          requestedAt: now,
          publishedAt: "",
          publishedBy: by,
          error: "",
          idempotencyKey,
          lastStatusSync: now,
        }),
      });
      try {
        await postPublishAdToMake(publishingPayload(after, now, by));
      } catch (error) {
        const reason = error instanceof Error ? error.message : "The Make publishing workflow could not be reached.";
        const failed = await updatePendingAd(before.id, {
          ...historyFields(after, { type: "ad_publishing_failed", at: new Date().toISOString(), actor: by, detail: reason }),
          ...publicationFields({ status: "Failed", error: reason, lastStatusSync: new Date().toISOString() }),
        });
        const audit = await logAuditEvent({
          actor,
          action: "ad_publishing_failed",
          category: "google_ads",
          resource,
          summary: "Make could not accept paused ad publishing",
          before: { status: "Publishing" },
          after: { status: "Failed" },
          metadata: { idempotency_key: idempotencyKey, reason },
          result: "failed",
          request,
        });
        return Response.json({ error: reason, ad: failed, requestId: audit.requestId }, { status: 502 });
      }
      const audit = await logAuditEvent({
        actor,
        action: eventType,
        category: "google_ads",
        resource,
        summary: body.action === "retry" ? "Retried paused ad publishing through Make" : "Sent paused ad publishing to Make",
        before: { status: before.publication_status },
        after: { status: "Publishing", requested_at: now },
        metadata: { idempotency_key: idempotencyKey, airtable_base_id: PENDING_ADS_BASE_ID, airtable_table_id: PENDING_ADS_TABLE_ID },
        request,
      });
      return Response.json({ success: true, ad: after, idempotencyKey, requestedAt: now, publishedBy: by, requestId: audit.requestId });
    }

    if (body.action === "mark_failed") {
      if (before.publication_status !== "Publishing" && before.publication_status !== "Failed") return publicError("Only a publishing ad can be marked failed.", 409);
      const reason = body.error?.trim().slice(0, 500) || "The publishing workflow could not be reached.";
      const after = await updatePendingAd(before.id, {
        ...historyFields(before, { type: "ad_publishing_failed", at: now, actor: by, detail: reason }),
        ...publicationFields({ status: "Failed", error: reason, lastStatusSync: now }),
      });
      const audit = await logAuditEvent({ actor, action: "ad_publishing_failed", category: "google_ads", resource, summary: "Paused ad publishing failed", before: { status: before.publication_status }, after: { status: "Failed" }, metadata: { reason }, result: "failed", request });
      return Response.json({ success: true, ad: after, requestId: audit.requestId });
    }

    if (body.action === "return_pending") {
      if (before.publication_status !== "Failed") return publicError("Only failed ads can return to Pending Review.", 409);
      if (isGoogleAdResourceName(before.ad_resource_name)) return publicError("This ad already has a Google Ads resource and cannot return to review.", 409);
      const after = await updatePendingAd(before.id, {
        ...historyFields(before, { type: "ad_returned_to_pending_review", at: now, actor: by, detail: "Returned for review after a failed publishing attempt." }),
        ...publicationFields({ status: "Pending Review", googleAdsStatus: "", requestedAt: "", publishedAt: "", publishedBy: "", error: "", lastStatusSync: now }),
      });
      const audit = await logAuditEvent({ actor, action: "ad_returned_to_pending_review", category: "google_ads", resource, summary: "Returned failed ad to Pending Review", before: { status: "Failed" }, after: { status: "Pending Review" }, request });
      return Response.json({ success: true, ad: after, requestId: audit.requestId });
    }

    if (body.action === "acknowledge_result") {
      const published = isVerifiedPublishedAd(before);
      if (!published && before.publication_status !== "Failed") return publicError("The publishing workflow has not reported a final result yet.", 409);
      const eventType = published ? "ad_published" : "ad_publishing_failed";
      const alreadyRecorded = before.reviewPackage.history.some((item) => item.type === eventType && item.detail?.includes(before.idempotency_key));
      if (!alreadyRecorded) {
        await updatePendingAd(before.id, historyFields(before, {
          type: eventType,
          at: before.published_at || now,
          actor: before.published_by || by,
          detail: published
            ? `Verified PAUSED resource ${before.ad_resource_name} (${before.idempotency_key}).`
            : `${before.publish_error || "Publishing failed."} (${before.idempotency_key}).`,
        }));
        await logAuditEvent({
          actor,
          action: eventType,
          category: "google_ads",
          resource,
          summary: published ? "Verified paused ad publication" : "Recorded failed ad publication",
          before: { status: "Publishing" },
          after: { status: before.publication_status, google_ads_status: before.google_ads_status, resource_name: before.ad_resource_name },
          metadata: { idempotency_key: before.idempotency_key, error: before.publish_error || undefined },
          result: published ? "success" : "failed",
          request,
        });
      }
      return Response.json({ success: true, ad: before });
    }

    return publicError("Unsupported ad publishing action.", 400);
  } catch (error) {
    console.error("[ad-reviews] workflow update failed", { action: body.action, id: body.id, error });
    if (error instanceof AirtableRequestError && error.status === 403) return airtablePublicError(error);
    return publicError("The publishing status could not be updated. Please try again.");
  }
}
