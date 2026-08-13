import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

test("Airtable creative performance uses Ad Name and strict Date metrics", () => {
  const route = read("src/app/api/airtable/route.ts");
  assert.match(
    route,
    /adName: str\(r\.fields, "Ad Name"\) \|\| \(adId \? `Ad \$\{adId\}` : "Ad"\)/,
  );
  assert.doesNotMatch(route, /"Ad Name", "Ad", "Name"/);
  assert.match(route, /pickPerformanceDate/);
  assert.match(route, /isReportingDateInRange/);
  assert.match(route, /Boolean\(r\.adId\)/);
});

test("Ads default to enabled and expose removed history", () => {
  const route = read("src/app/api/google-ads/workspace/route.ts");
  const workspace = read(
    "src/app/google-ads-analytics/components/GoogleAdsWorkspace.tsx",
  );
  assert.match(route, /searchParams\.get\("status"\) \|\| "ENABLED"/);
  assert.match(workspace, /const defaultStatus = initialStatus \|\| "ENABLED"/);
  assert.match(workspace, />\s*Show removed\s*<\/button>/);
  assert.match(workspace, /<option value="REMOVED">Removed<\/option>/);
});

test("campaign fallback merges canonical inventory with range analytics", () => {
  const client = read(
    "src/app/google-ads-analytics/GoogleAdsAnalyticsClient.tsx",
  );
  const inventory = read("src/app/api/airtable/google-ads-campaigns/route.ts");
  assert.match(client, /function mergeCampaignInventory/);
  assert.match(client, /campaignInventory\?\.campaigns/);
  assert.match(inventory, /budget: num\(f, "Daily Budget", "Budget"\)/);
  assert.match(
    inventory,
    /biddingStrategy: str\(f, "Bidding Strategy", "Bidding"\)/,
  );
  assert.match(inventory, /campaign\.campaignStatus !== "REMOVED"/);
});

test("campaign UI omits bidding and incomplete ads do not render fake previews", () => {
  const workspace = read(
    "src/app/google-ads-analytics/components/GoogleAdsWorkspace.tsx",
  );
  const detail = read(
    "src/app/google-ads-analytics/components/EntityDetailClient.tsx",
  );
  assert.doesNotMatch(workspace, /"Bidding"/);
  assert.doesNotMatch(detail, /rows\.push\(\["Bidding strategy"/);
  assert.match(detail, /const hasSynchronizedPreview/);
  assert.match(detail, /Removed history \(\$\{removedAds\.length\}\)/);
  assert.match(
    detail,
    /const visibleAds = showRemoved \? removedAds : enabledAds/,
  );
  assert.match(detail, />Ad preview unavailable<\/p>/);
});
test("lead source display includes campaign and ad-group attribution", () => {
  const api = read("src/app/api/airtable/leads/route.ts");
  const client = read("src/app/leads/LeadsClient.tsx");
  assert.match(api, /utmAdGroup: str\(r\.fields, "UTM Ad Group"/);
  assert.match(client, /Campaign: \{lead\.utmCampaign\}/);
  assert.match(client, /Ad group: \{lead\.utmAdGroup\}/);
});
