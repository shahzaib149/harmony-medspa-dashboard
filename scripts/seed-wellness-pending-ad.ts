import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  reviewPackageFromJson,
  WELLNESS_PENDING_AD,
  type PendingAdPackage,
} from "../src/lib/google/pending-ads";

function reviewFields(review: PendingAdPackage) {
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

function loadLocalEnv() {
  const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([^#][^=]*)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    const value = match[2].trim().replace(/^(['"])(.*)\1$/, "$2");
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  loadLocalEnv();

  const apiKey = process.env.AIRTABLE_API_KEY?.trim();
  const baseId = process.env.AIRTABLE_BASE_ID?.trim();
  const tableId = "tbl8XpPEGCr720IUi";
  if (!apiKey || !baseId) throw new Error("Airtable configuration is required.");

  const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
  const formula = `{business_name}="${WELLNESS_PENDING_AD.internalTitle.replaceAll('"', '\\"')}"`;
  const query = new URLSearchParams({ filterByFormula: formula, pageSize: "1" });
  const existingResponse = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}?${query}`, { headers });
  if (!existingResponse.ok) throw new Error(`Airtable lookup failed (${existingResponse.status}).`);
  const existing = await existingResponse.json() as {
    records?: Array<{ id: string; fields?: Record<string, unknown> }>;
  };
  const existingRecord = existing.records?.[0];
  if (existingRecord) {
    const currentReview = reviewPackageFromJson(String(existingRecord.fields?.review_package_json ?? ""));
    const syncedAt = new Date().toISOString();
    const review: PendingAdPackage = currentReview ? {
      ...currentReview,
      headlines: WELLNESS_PENDING_AD.headlines,
      descriptions: WELLNESS_PENDING_AD.descriptions,
      history: [
        ...(currentReview.history ?? []),
        {
          type: "ad_copy_corrected",
          at: syncedAt,
          actor: "Dashboard deployment",
          detail: "Headlines and descriptions updated to comply with Google Ads character limits.",
        },
      ].slice(-50),
    } : WELLNESS_PENDING_AD;
    const updateResponse = await fetch(
      `https://api.airtable.com/v0/${baseId}/${tableId}/${existingRecord.id}?typecast=true`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({ fields: reviewFields(review) }),
      },
    );
    const updated = await updateResponse.json().catch(() => null) as { error?: { message?: string } } | null;
    if (!updateResponse.ok) throw new Error(updated?.error?.message || `Airtable update failed (${updateResponse.status}).`);
    console.log(`Updated Wellness pending ad record ${existingRecord.id} with compliant copy.`);
    return;
  }

  const review = WELLNESS_PENDING_AD;
  const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}?typecast=true`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      fields: {
        ...reviewFields(review),
        status: "Pending Review",
        created_at: "2026-07-16",
      },
    }),
  });
  const data = await response.json().catch(() => null) as { id?: string; error?: { message?: string } } | null;
  if (!response.ok || !data?.id) throw new Error(data?.error?.message || `Airtable create failed (${response.status}).`);
  console.log(`Created Wellness pending ad record ${data.id}.`);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Seed failed.");
  process.exitCode = 1;
});
