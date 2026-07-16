import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { logAuditEvent } from "@/lib/audit/log-audit-event";
import {
  getPendingAd,
  listPendingAds,
  reviewPackageFields,
  updatePendingAd,
} from "@/lib/airtable/pending-ads";
import { parseReviewPackage, type PendingAd } from "@/lib/google/pending-ads";

export type { PendingAd } from "@/lib/google/pending-ads";

function actorLabel(actor: { full_name: string | null; email: string | null }) {
  return actor.full_name?.trim() || actor.email || "Dashboard admin";
}

export async function GET() {
  try {
    const ads = await listPendingAds();
    return Response.json({ ads, count: ads.length });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Pending ads could not be loaded." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let actor;
  try {
    ({ profile: actor } = await requireRole(request, "viewer"));
  } catch (error) {
    return authErrorResponse(error);
  }

  const body = await request.json().catch(() => null) as { action?: string; id?: string } | null;
  if (body?.action !== "opened" || !body.id) {
    return Response.json({ error: "A valid pending ad open action is required." }, { status: 400 });
  }

  try {
    const ad = await getPendingAd(body.id);
    const audit = await logAuditEvent({
      actor,
      action: "pending_ad_opened",
      category: "google_ads",
      resource: { type: "pending_ad", id: ad.id, label: ad.reviewPackage.internalTitle },
      summary: "Opened a pending ad for review",
      metadata: {
        campaign: ad.reviewPackage.campaignName,
        ad_group: ad.reviewPackage.adGroupName,
        final_url: ad.reviewPackage.finalUrl,
        result: "opened",
      },
      request,
    });
    return Response.json({ success: true, requestId: audit.requestId });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Pending ad could not be opened." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  let actor;
  try {
    ({ profile: actor } = await requireRole(request, "admin"));
  } catch (error) {
    return authErrorResponse(error);
  }

  const body = await request.json().catch(() => null) as {
    action?: "update" | "reject";
    id?: string;
    reviewPackage?: unknown;
    reason?: string;
  } | null;
  if (!body?.id || !body.action) {
    return Response.json({ error: "Pending ad ID and action are required." }, { status: 400 });
  }

  let before: PendingAd;
  try {
    before = await getPendingAd(body.id);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Pending ad could not be loaded." },
      { status: 500 },
    );
  }

  if (before.status !== "Pending Review") {
    return Response.json({ error: "Only pending ads can be changed." }, { status: 409 });
  }

  try {
    if (body.action === "update") {
      const review = parseReviewPackage(body.reviewPackage);
      if (!review) return Response.json({ error: "The review package is invalid." }, { status: 400 });
      const now = new Date().toISOString();
      const updatedReview = {
        ...review,
        history: [
          ...(review.history ?? []),
          { type: "pending_ad_updated", at: now, actor: actorLabel(actor), detail: "Review copy or approvals updated." },
        ].slice(-50),
      };
      const after = await updatePendingAd(body.id, reviewPackageFields(updatedReview));
      const audit = await logAuditEvent({
        actor,
        action: "pending_ad_updated",
        category: "google_ads",
        resource: { type: "pending_ad", id: body.id, label: updatedReview.internalTitle },
        summary: "Updated a pending ad review package",
        before: { campaign: before.reviewPackage.campaignName, ad_group: before.reviewPackage.adGroupName, final_url: before.reviewPackage.finalUrl },
        after: { campaign: updatedReview.campaignName, ad_group: updatedReview.adGroupName, final_url: updatedReview.finalUrl },
        metadata: { result: "updated" },
        request,
      });
      return Response.json({ success: true, ad: after, requestId: audit.requestId });
    }

    const reason = body.reason?.trim().slice(0, 500) || "No reason provided.";
    const rejectedReview = {
      ...before.reviewPackage,
      history: [
        ...(before.reviewPackage.history ?? []),
        { type: "pending_ad_rejected", at: new Date().toISOString(), actor: actorLabel(actor), detail: reason },
      ].slice(-50),
    };
    const after = await updatePendingAd(body.id, {
      ...reviewPackageFields(rejectedReview),
      status: "Rejected",
    });
    const audit = await logAuditEvent({
      actor,
      action: "pending_ad_rejected",
      category: "google_ads",
      resource: { type: "pending_ad", id: body.id, label: rejectedReview.internalTitle },
      summary: "Rejected a pending ad and retained it for history",
      before: { status: before.status },
      after: { status: "Rejected" },
      metadata: {
        campaign: rejectedReview.campaignName,
        ad_group: rejectedReview.adGroupName,
        final_url: rejectedReview.finalUrl,
        reason,
        result: "rejected",
      },
      request,
    });
    return Response.json({ success: true, ad: after, requestId: audit.requestId });
  } catch (error) {
    const audit = await logAuditEvent({
      actor,
      action: body.action === "reject" ? "pending_ad_rejected" : "pending_ad_updated",
      category: "google_ads",
      resource: { type: "pending_ad", id: body.id },
      summary: body.action === "reject" ? "Pending ad rejection failed" : "Pending ad update failed",
      metadata: { operation: body.action, result: "failed" },
      result: "failed",
      request,
    });
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Pending ad change failed.",
        requestId: audit.requestId,
      },
      { status: 500 },
    );
  }
}
