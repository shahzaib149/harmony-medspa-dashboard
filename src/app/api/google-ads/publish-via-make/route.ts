import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { logAuditEvent } from "@/lib/audit/log-audit-event";
import {
  formatAssetsForWebhook,
  formatDescriptionsForWebhook,
  formatHeadlinesForWebhook,
} from "@/lib/google/pending-ads";
import { postPublishAdToMake } from "@/lib/make/publish-ad";

const MAX_REQUEST_BYTES = 250_000;

export async function POST(request: Request) {
  let actor;
  try { ({ profile: actor } = await requireRole(request, "admin")); } catch (error) { return authErrorResponse(error); }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return Response.json({ error: "The ad publishing request is too large." }, { status: 413 });
  }

  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return Response.json({ error: "A valid ad publishing payload is required." }, { status: 400 });
  }
  if (String(payload.adType || "").trim() !== "RESPONSIVE_SEARCH_AD") {
    return Response.json({ error: "Only responsive search ads can use this publishing workflow." }, { status: 400 });
  }

  const headlineAssets = formatHeadlinesForWebhook(
    Array.isArray(payload.headlineAssets)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (payload.headlineAssets as any)
      : Array.isArray(payload.allHeadlines)
        ? (payload.allHeadlines as string[]).map((text) => ({ text, pinnedField: null }))
        : []
  );

  const descriptionAssets = formatDescriptionsForWebhook(
    Array.isArray(payload.descriptionAssets)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (payload.descriptionAssets as any)
      : Array.isArray(payload.allDescriptions)
        ? (payload.allDescriptions as string[]).map((text) => ({ text, pinnedField: null }))
        : []
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedAssets = formatAssetsForWebhook((payload.assets as any) || {});

  const sentAt = new Date().toISOString();
  try {
    await postPublishAdToMake({
      ...payload,
      campaignId: String(payload.campaignId || "").trim(),
      adGroupId: String(payload.adGroupId || "").trim(),
      headlineAssets,
      descriptionAssets,
      assets: formattedAssets,
      event: String(payload.event || "publish_ad_requested"),
      requestedStatus: "PAUSED",
      sentAt,
    });
    const audit = await logAuditEvent({
      actor,
      action: "ad_publish_sent_to_make",
      category: "google_ads",
      resource: { type: "ad_suggestion", label: String(payload.businessName || "Responsive search ad") },
      summary: "Sent a paused responsive search ad request to Make",
      metadata: { source: payload.source, requested_status: "PAUSED" },
      request,
    });
    return Response.json({ success: true, acceptedAt: sentAt, requestId: audit.requestId });
  } catch (error) {
    console.error("[publish-via-make] webhook failed", error);
    const audit = await logAuditEvent({
      actor,
      action: "ad_publish_make_failed",
      category: "google_ads",
      resource: { type: "ad_suggestion", label: String(payload.businessName || "Responsive search ad") },
      summary: "Make rejected a paused responsive search ad request",
      metadata: { source: payload.source },
      result: "failed",
      request,
    });
    return Response.json({ error: "The publishing workflow could not accept this ad.", requestId: audit.requestId }, { status: 502 });
  }
}
