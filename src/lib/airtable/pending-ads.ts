import "server-only";

import {
  createLegacyReviewPackage,
  type PendingAd,
  type PendingAdPackage,
  reviewPackageFromJson,
} from "@/lib/google/pending-ads";

const BASE_ID = process.env.AIRTABLE_BASE_ID ?? "appGumYdPTtL5GW6M";
export const PENDING_ADS_TABLE_ID = "tbl8XpPEGCr720IUi";
const API_KEY = process.env.AIRTABLE_API_KEY?.trim() ?? "";

type AirtableRecord = {
  id: string;
  createdTime: string;
  fields: Record<string, unknown>;
};

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

async function airtableResponse(response: Response) {
  if (response.ok) return response;
  const data = await response.json().catch(() => null) as { error?: { message?: string } } | null;
  throw new Error(data?.error?.message || `Airtable request failed (${response.status}).`);
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

  return {
    id: record.id,
    ad_resource_name: str(fields, "ad_resource_name"),
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
    status: str(fields, "status"),
    created_at: str(fields, "created_at") || record.createdTime.slice(0, 10),
    reviewPackage,
  };
}

export async function listPendingAds() {
  assertConfigured();
  const params = new URLSearchParams({
    filterByFormula: `{status}="Pending Review"`,
    "sort[0][field]": "created_at",
    "sort[0][direction]": "desc",
    pageSize: "50",
  });
  const response = await airtableResponse(await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${PENDING_ADS_TABLE_ID}?${params}`,
    { headers: { Authorization: `Bearer ${API_KEY}` }, cache: "no-store" },
  ));
  const data = await response.json() as { records: AirtableRecord[] };
  return data.records.map(mapPendingAd);
}

export async function getPendingAd(id: string) {
  assertConfigured();
  const response = await airtableResponse(await fetch(
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
  const response = await airtableResponse(await fetch(
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
