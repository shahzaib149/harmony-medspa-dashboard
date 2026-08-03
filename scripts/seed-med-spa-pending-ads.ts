import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  FEEL_LIKE_YOURSELF_AGAIN_PENDING_AD,
  FINALLY_CARE_YOU_TRUST_PENDING_AD,
  validatePendingAdPackage,
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

async function seedPackage(
  apiKey: string,
  baseId: string,
  tableId: string,
  review: PendingAdPackage,
  fallbackRecordId?: string,
) {
  // Validate package before inserting
  const validationErrors = validatePendingAdPackage(review);
  if (validationErrors.length > 0) {
    throw new Error(
      `Validation failed for "${review.internalTitle}":\n` +
        validationErrors.map((err) => `  - ${err}`).join("\n"),
    );
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  // Check if ad already exists in Airtable
  const formula = `{business_name}="${review.internalTitle.replaceAll('"', '\\"')}"`;
  const query = new URLSearchParams({ filterByFormula: formula, pageSize: "1" });
  const existingResponse = await fetch(
    `https://api.airtable.com/v0/${baseId}/${tableId}?${query}`,
    { headers },
  );
  if (!existingResponse.ok) {
    throw new Error(`Airtable lookup failed for "${review.internalTitle}" (${existingResponse.status}).`);
  }

  const existing = (await existingResponse.json()) as {
    records?: Array<{ id: string; fields?: Record<string, unknown> }>;
  };
  const existingRecord = existing.records?.[0];
  if (existingRecord) {
    console.log(`Pending ad "${review.internalTitle}" already exists as ${existingRecord.id}; updating via PATCH.`);
    const patchResponse = await fetch(
      `https://api.airtable.com/v0/${baseId}/${tableId}/${existingRecord.id}?typecast=true`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          fields: {
            ...reviewFields(review),
            status: "Pending Review",
            "Google Ads Status": "",
            "Publish Requested At": "",
            "Published At": "",
            "Published By": "",
            "Publish Error": "",
            created_at: new Date().toISOString().slice(0, 10),
          },
        }),
      },
    );
    if (!patchResponse.ok) {
      throw new Error(`Failed to update existing record ${existingRecord.id} (${patchResponse.status}).`);
    }
    return existingRecord.id;
  }

  // Try POSTing a new record
  const postResponse = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}?typecast=true`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      fields: {
        ...reviewFields(review),
        status: "Pending Review",
        "Google Ads Status": "",
        "Publish Requested At": "",
        "Published At": "",
        "Published By": "",
        "Publish Error": "",
        created_at: new Date().toISOString().slice(0, 10),
      },
    }),
  });

  const postData = (await postResponse.json().catch(() => null)) as {
    id?: string;
    error?: { type?: string; message?: string };
  } | null;

  if (postResponse.ok && postData?.id) {
    console.log(`Created Pending ad record "${review.internalTitle}" (${postData.id}).`);
    return postData.id;
  }

  // If POST failed due to Airtable base record limit (TOO_MANY_RECORDS_IN_BASE), use fallback record if provided
  if (postData?.error?.type === "TOO_MANY_RECORDS_IN_BASE" && fallbackRecordId) {
    console.log(
      `Airtable POST hit record limit. Re-purposing fallback record ${fallbackRecordId} via PATCH for "${review.internalTitle}"...`,
    );
    const patchResponse = await fetch(
      `https://api.airtable.com/v0/${baseId}/${tableId}/${fallbackRecordId}?typecast=true`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          fields: {
            ...reviewFields(review),
            status: "Pending Review",
            "Google Ads Status": "",
            "Publish Requested At": "",
            "Published At": "",
            "Published By": "",
            "Publish Error": "",
            created_at: new Date().toISOString().slice(0, 10),
          },
        }),
      },
    );

    if (patchResponse.ok) {
      console.log(`Successfully seeded "${review.internalTitle}" into record ${fallbackRecordId} via PATCH.`);
      return fallbackRecordId;
    }
  }

  throw new Error(
    postData?.error?.message || `Airtable create failed for "${review.internalTitle}" (${postResponse.status}).`,
  );
}

async function main() {
  loadLocalEnv();

  const apiKey = process.env.AIRTABLE_API_KEY?.trim();
  const baseId = process.env.AIRTABLE_BASE_ID?.trim();
  const tableId = "tbl8XpPEGCr720IUi";

  if (!apiKey || !baseId) throw new Error("Airtable configuration is required.");

  console.log("Validating and seeding Med Spa Sarasota pending ads...");

  // Check existing records to find any reusable/legacy record if needed
  const listResp = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}?pageSize=100`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const listData = (await listResp.json()) as {
    records?: Array<{ id: string; fields?: Record<string, unknown> }>;
  };
  const unusedRecords = (listData.records || []).filter(
    (r) =>
      r.fields?.business_name !== FEEL_LIKE_YOURSELF_AGAIN_PENDING_AD.internalTitle &&
      r.fields?.business_name !== FINALLY_CARE_YOU_TRUST_PENDING_AD.internalTitle &&
      r.fields?.business_name !== "Wellness Free Consultation RSA",
  );

  const fallback1 = unusedRecords[0]?.id;
  const fallback2 = unusedRecords[1]?.id;

  await seedPackage(apiKey, baseId, tableId, FEEL_LIKE_YOURSELF_AGAIN_PENDING_AD, fallback1);
  await seedPackage(apiKey, baseId, tableId, FINALLY_CARE_YOU_TRUST_PENDING_AD, fallback2);

  console.log("Seeding completed successfully.");
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Seed failed.");
  process.exitCode = 1;
});
