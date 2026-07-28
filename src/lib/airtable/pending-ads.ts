import "server-only";

import {
  createLegacyReviewPackage,
  isGoogleAdResourceName,
  normalizePublicationStatus,
  type PublicationStatus,
  type PendingAd,
  type PendingAdPackage,
  reviewPackageFromJson,
} from "@/lib/google/pending-ads";
import { resilientFetch } from "@/lib/network/resilient-fetch";

const BASE_ID = process.env.AIRTABLE_BASE_ID ?? "appGumYdPTtL5GW6M";
export const PENDING_ADS_TABLE_ID = "tbl8XpPEGCr720IUi";
export const PENDING_ADS_BASE_ID = BASE_ID;
const API_KEY = process.env.AIRTABLE_API_KEY?.trim() ?? "";
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const RETRY_DELAYS_MS = [250, 750];

type AirtableRecord = {
  id: string;
  createdTime: string;
  fields: Record<string, unknown>;
};

export class AirtableRequestError extends Error {
  status: number;
  type: string | null;

  constructor(status: number, type: string | null, message: string) {
    super(message);
    this.name = "AirtableRequestError";
    this.status = status;
    this.type = type;
  }
}

function str(fields: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = fields[key];
    if (value !== undefined && value !== null && value !== "") return String(value);
  }
  return "";
}

function assertConfigured() {
  if (!API_KEY) throw new Error("Airtable is not configured.");
}

async function pendingAdsFetch(url: string, init: RequestInit) {
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const response = await resilientFetch(url, init);
      if (!RETRYABLE_STATUS.has(response.status) || attempt === RETRY_DELAYS_MS.length) {
        return response;
      }
      await response.body?.cancel().catch(() => undefined);
    } catch (error) {
      if (attempt === RETRY_DELAYS_MS.length) {
        throw new Error("Airtable could not be reached. Refresh and try again.", {
          cause: error,
        });
      }
    }
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
  }
  throw new Error("Airtable could not be reached. Refresh and try again.");
}

async function airtableResponse(response: Response) {
  if (response.ok) return response;
  const data = await response.json().catch(() => null) as { error?: { type?: string; message?: string } } | null;
  throw new AirtableRequestError(
    response.status,
    data?.error?.type ?? null,
    data?.error?.message || `Airtable request failed (${response.status}).`,
  );
}

export function mapPendingAd(record: AirtableRecord): PendingAd {
  const fields = record.fields;
  const legacyHeadlines = [str(fields, "headline1"), str(fields, "headline2"), str(fields, "headline3")];
  const legacyDescriptions = [str(fields, "description1"), str(fields, "description2")];
  const reviewPackage = reviewPackageFromJson(str(fields, "review_package_json")) ?? createLegacyReviewPackage({
    businessName: str(fields, "business_name"),
    campaignName: str(fields, "campaign_name"),
    adGroupName: str(fields, "ad_group_name"),
    finalUrl: str(fields, "final_url"),
    path1: str(fields, "path1"),
    path2: str(fields, "path2"),
    headlines: legacyHeadlines,
    descriptions: legacyDescriptions,
  });

  const googleAdsStatus = str(fields, "Google Ads Status", "google_ads_status")
    || reviewPackage.publication?.status
    || "";
  const resourceName = str(fields, "Google Ads Resource Name", "ad_resource_name")
    || reviewPackage.publication?.resourceName
    || "";
  const publishRequestedAt = str(fields, "Publish Requested At", "publish_requested_at");
  const publishedAt = str(fields, "Published At", "published_at")
    || reviewPackage.publication?.publishedAt
    || "";
  const publishedBy = str(fields, "Published By", "published_by")
    || reviewPackage.publication?.publishedBy
    || "";
  const publishError = str(fields, "Publish Error", "publish_error");
  let publicationStatus = normalizePublicationStatus(str(fields, "Publication Status", "status"));
  const rejectedInHistory = reviewPackage.history.some((item) => item.type === "pending_ad_rejected");
  if (publicationStatus !== "Published" && rejectedInHistory) publicationStatus = "Rejected";
  else if (publicationStatus !== "Published" && publishError.trim()) publicationStatus = "Failed";
  else if (publicationStatus !== "Published" && publishRequestedAt.trim()) publicationStatus = "Publishing";
  if (publicationStatus === "Published" && (
    googleAdsStatus.trim().toUpperCase() !== "PAUSED"
    || !isGoogleAdResourceName(resourceName)
    || !publishedAt.trim()
    || !publishedBy.trim()
    || Boolean(publishError.trim())
  )) publicationStatus = publishError.trim()
    ? "Failed"
    : publishRequestedAt
      ? "Publishing"
      : "Failed";
  if (publicationStatus === "Publishing" && publishRequestedAt) {
    const requestedAtMs = Date.parse(publishRequestedAt);
    if (Number.isFinite(requestedAtMs) && Date.now() - requestedAtMs > 60_000) publicationStatus = "Failed";
  }
  return {
    id: record.id,
    ad_resource_name: resourceName,
    business_name: str(fields, "business_name") || reviewPackage.internalTitle,
    campaign_name: str(fields, "campaign_name") || reviewPackage.campaignName,
    ad_group_name: str(fields, "ad_group_name") || reviewPackage.adGroupName,
    headline1: legacyHeadlines[0] || reviewPackage.headlines[0]?.text || "",
    headline2: legacyHeadlines[1] || reviewPackage.headlines[1]?.text || "",
    headline3: legacyHeadlines[2] || reviewPackage.headlines[2]?.text || "",
    description1: legacyDescriptions[0] || reviewPackage.descriptions[0]?.text || "",
    description2: legacyDescriptions[1] || reviewPackage.descriptions[1]?.text || "",
    path1: str(fields, "path1") || reviewPackage.path1,
    path2: str(fields, "path2") || reviewPackage.path2,
    final_url: str(fields, "final_url") || reviewPackage.finalUrl,
    status: publicationStatus,
    publication_status: publicationStatus,
    google_ads_status: googleAdsStatus,
    publish_requested_at: publishRequestedAt,
    published_at: publishedAt,
    published_by: publishedBy,
    publish_error: publishError,
    idempotency_key: str(fields, "Idempotency Key", "idempotency_key"),
    last_status_sync: str(fields, "Last Status Sync", "last_status_sync"),
    created_at: str(fields, "created_at") || record.createdTime.slice(0, 10),
    reviewPackage,
  };
}

export async function listPendingAds() {
  return (await listAdReviews()).filter((ad) => ad.publication_status === "Pending Review");
}

export type AdReviewStatusFilter = "pending" | "published" | "failed" | "all";

export async function listAdReviews(status: AdReviewStatusFilter = "all") {
  assertConfigured();
  const records: AirtableRecord[] = [];
  let offset = "";
  do {
    const params = new URLSearchParams({ pageSize: "100" });
    if (offset) params.set("offset", offset);
    const response = await airtableResponse(await pendingAdsFetch(
      `https://api.airtable.com/v0/${BASE_ID}/${PENDING_ADS_TABLE_ID}?${params}`,
      { headers: { Authorization: `Bearer ${API_KEY}` }, cache: "no-store" },
    ));
    const data = await response.json() as { records: AirtableRecord[]; offset?: string };
    records.push(...data.records);
    offset = data.offset ?? "";
  } while (offset);

  const ads = records.map(mapPendingAd).sort((a, b) => {
    const left = a.published_at || a.publish_requested_at || a.created_at;
    const right = b.published_at || b.publish_requested_at || b.created_at;
    return right.localeCompare(left);
  });
  if (status === "pending") return ads.filter((ad) => ad.publication_status === "Pending Review" || ad.publication_status === "Publishing");
  if (status === "published") return ads.filter((ad) => ad.publication_status === "Published");
  if (status === "failed") return ads.filter((ad) => ad.publication_status === "Failed");
  return ads;
}

export function adReviewCounts(ads: PendingAd[]) {
  return {
    pending: ads.filter((ad) => ad.publication_status === "Pending Review" || ad.publication_status === "Publishing").length,
    published: ads.filter((ad) => ad.publication_status === "Published").length,
    failed: ads.filter((ad) => ad.publication_status === "Failed").length,
  };
}

export function publicationFields(input: {
  status: PublicationStatus;
  googleAdsStatus?: string;
  resourceName?: string;
  requestedAt?: string;
  publishedAt?: string;
  publishedBy?: string;
  error?: string;
  idempotencyKey?: string;
  lastStatusSync?: string;
}) {
  return {
    // The Airtable select intentionally has only Pending Review and Published.
    // Publishing and Failed are derived from the timestamp/error fields so the
    // workflow never needs permission to create new single-select options.
    status: input.status === "Published" ? "Published" : "Pending Review",
    ...(input.googleAdsStatus !== undefined ? { "Google Ads Status": input.googleAdsStatus } : {}),
    ...(input.resourceName !== undefined ? { ad_resource_name: input.resourceName } : {}),
    ...(input.requestedAt !== undefined ? { "Publish Requested At": input.requestedAt } : {}),
    ...(input.publishedAt !== undefined ? { "Published At": input.publishedAt } : {}),
    ...(input.publishedBy !== undefined ? { "Published By": input.publishedBy } : {}),
    ...(input.error !== undefined ? { "Publish Error": input.error } : {}),
    ...(input.idempotencyKey !== undefined ? { "Idempotency Key": input.idempotencyKey } : {}),
    ...(input.lastStatusSync !== undefined ? { "Last Status Sync": input.lastStatusSync } : {}),
  };
}

export async function getPendingAd(id: string) {
  assertConfigured();
  const response = await airtableResponse(await pendingAdsFetch(
    `https://api.airtable.com/v0/${BASE_ID}/${PENDING_ADS_TABLE_ID}/${encodeURIComponent(id)}`,
    { headers: { Authorization: `Bearer ${API_KEY}` }, cache: "no-store" },
  ));
  return mapPendingAd(await response.json() as AirtableRecord);
}

export async function updatePendingAd(
  id: string,
  fields: Record<string, unknown>,
) {
  assertConfigured();
  const response = await airtableResponse(await pendingAdsFetch(
    `https://api.airtable.com/v0/${BASE_ID}/${PENDING_ADS_TABLE_ID}/${encodeURIComponent(id)}?typecast=true`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
      cache: "no-store",
    },
  ));
  return mapPendingAd(await response.json() as AirtableRecord);
}

export function reviewPackageFields(review: PendingAdPackage) {
  return {
    business_name: review.internalTitle,
    campaign_name: review.campaignName,
    ad_group_name: review.adGroupName,
    headline1: review.headlines[0]?.text ?? "",
    headline2: review.headlines[1]?.text ?? "",
    headline3: review.headlines[2]?.text ?? "",
    description1: review.descriptions[0]?.text ?? "",
    description2: review.descriptions[1]?.text ?? "",
    path1: review.path1,
    path2: review.path2,
    final_url: review.finalUrl,
    review_package_json: JSON.stringify(review),
  };
}
