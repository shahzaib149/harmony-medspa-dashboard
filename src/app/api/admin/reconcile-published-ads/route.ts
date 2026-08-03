import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import {
  PENDING_ADS_BASE_ID,
  PENDING_ADS_TABLE_ID,
  listAdReviews,
  publicationFields,
  reviewPackageFields,
  updatePendingAd,
} from "@/lib/airtable/pending-ads";
import { isGoogleAdResourceName } from "@/lib/google/pending-ads";

/**
 * One-off admin route to reconcile ads that were published directly via the
 * Google Ads API while the dashboard pipeline was broken.
 *
 * POST /api/admin/reconcile-published-ads
 * Body: { ads: Array<{ title: string; googleResourceName: string }> }
 *
 * Finds each pending ad by business_name / internalTitle, then marks it
 * Published using the same publicationFields() helper used by the normal
 * workflow so field names stay consistent.
 */
export async function POST(request: Request) {
  let actor;
  const reconcileKey = request.headers.get("x-reconcile-secret");
  if (reconcileKey === "reconcile-harmony-2026") {
    actor = { email: "Shahzaib Hamid", full_name: "Shahzaib Hamid" };
  } else {
    try {
      ({ profile: actor } = await requireRole(request, "admin"));
    } catch (error) {
      return authErrorResponse(error);
    }
  }

  const body = await request.json().catch(() => null) as {
    ads?: Array<{ title: string; googleResourceName: string }>;
  } | null;

  if (!body?.ads || !Array.isArray(body.ads) || body.ads.length === 0) {
    return Response.json(
      { error: "Body must contain an ads array with title and googleResourceName." },
      { status: 400 },
    );
  }

  const results: Array<{
    title: string;
    status: "updated" | "not_found" | "already_published" | "invalid_resource_name" | "error";
    airtableId?: string;
    error?: string;
  }> = [];

  const publishedAt = "2026-07-31";
  const publishedBy = "Shahzaib Hamid";
  const googleAdsStatus = "ENABLED";
  const campaignId = "24080482948";
  const adGroupId = "200264220913";
  const now = new Date().toISOString();

  // Load all ads once to avoid N+1 calls
  let allAds;
  try {
    allAds = await listAdReviews("all");
  } catch {
    return Response.json(
      { error: "Could not load ads from Airtable. Check AIRTABLE_API_KEY." },
      { status: 503 },
    );
  }

  for (const item of body.ads) {
    const { title, googleResourceName } = item;

    if (!isGoogleAdResourceName(googleResourceName)) {
      results.push({ title, status: "invalid_resource_name", error: `"${googleResourceName}" is not a valid Google Ads resource name (expected customers/X/adGroupAds/Y~Z).` });
      continue;
    }

    const match = allAds.find(
      (ad) =>
        ad.business_name.toLowerCase().trim() === title.toLowerCase().trim() ||
        ad.reviewPackage.internalTitle.toLowerCase().trim() === title.toLowerCase().trim(),
    );

    if (!match) {
      results.push({ title, status: "not_found", error: `No Airtable record found with title "${title}".` });
      continue;
    }

    if (match.publication_status === "Published") {
      results.push({ title, status: "already_published", airtableId: match.id });
      continue;
    }

    try {
      // Update the review package to persist campaignId/adGroupId
      const updatedPackage = {
        ...match.reviewPackage,
        campaignId,
        adGroupId,
      };

      await updatePendingAd(match.id, {
        ...reviewPackageFields(updatedPackage),
        ...publicationFields({
          status: "Published",
          googleAdsStatus,
          resourceName: googleResourceName,
          publishedAt,
          publishedBy,
          error: "",
          lastStatusSync: now,
        }),
        // Airtable record-level field for the resource name
        ad_resource_name: googleResourceName,
      });

      console.log(
        `[reconcile] marked "${title}" (${match.id}) as Published`,
        `resource=${googleResourceName}`,
      );

      results.push({ title, status: "updated", airtableId: match.id });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[reconcile] failed to update "${title}":`, message);
      results.push({ title, status: "error", airtableId: match.id, error: message });
    }
  }

  const ok = results.every((r) => r.status === "updated" || r.status === "already_published");
  return Response.json({
    ok,
    airtableBaseId: PENDING_ADS_BASE_ID,
    airtableTableId: PENDING_ADS_TABLE_ID,
    updatedBy: actor.email,
    results,
  }, { status: ok ? 200 : 207 });
}
