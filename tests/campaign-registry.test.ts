import assert from "node:assert/strict";
import test from "node:test";
import {
  ACTIVE_CAMPAIGNS,
  adCampaignLabel,
  adGroupLabel,
  campaignById,
  canonicalCallSource,
} from "../src/lib/google/campaign-registry";
import { mapCallRecord, groupCallSources } from "../src/lib/leads/call-records";
import { buildLeadFormula } from "../src/lib/leads/query";
import { groupByAdCampaign, type LeadSummaryRecord } from "../src/lib/leads/summary";

test("registry: four active campaigns with their November budgets; Website new ended", () => {
  assert.deepEqual(
    ACTIVE_CAMPAIGNS.map((c) => [c.code, c.id, c.utmCampaign, c.dailyBudget]),
    [
      ["CS2", "24134330302", "cs2_weight_loss", 5],
      ["CS3", "24452301491", "cs3_hormone", 13],
      ["CS4", "24452305673", "cs4_aesthetics", 11],
      ["CS5", "24447046761", "cs5_brand", 3],
    ],
  );
  assert.equal(campaignById("24080482948")?.lifecycle, "ended");
});

test("labels match the Airtable Ad Campaign / Ad Group formulas", () => {
  assert.equal(adCampaignLabel("cs4_aesthetics"), "CS4 Aesthetics & Memberships");
  assert.equal(adCampaignLabel("CS3_Hormone"), "CS3 Hormone Optimization");
  assert.equal(adCampaignLabel("spring_promo"), "spring_promo");
  assert.equal(adGroupLabel("208834347024"), "Menopause & Symptoms");
  assert.equal(adGroupLabel("202132713276"), "RF Microneedling + CO2");
  assert.equal(adGroupLabel("999"), "999");
});

test("calls: full campaign names and short codes land in one group", () => {
  assert.equal(canonicalCallSource("CS3 | Hormone Optimization | Sarasota"), "CS3");
  assert.equal(canonicalCallSource("cs2"), "CS2");
  assert.equal(canonicalCallSource("Website"), "Website");
  assert.equal(canonicalCallSource("Some other campaign"), "Some other campaign");
  const row = (id: string, source: string) =>
    mapCallRecord({ fields: { "Call ID": id, "Occurred At": "2026-11-11T14:00:00.000Z", Source: source } })!;
  const groups = groupCallSources([
    row("gads-1", "CS3 | Hormone Optimization | Sarasota"),
    row("cs3-2", "CS3"),
    row("cs2-1", "CS2"),
  ]);
  assert.deepEqual(groups.map((g) => [g.id, g.calls.length]), [["cs2", 1], ["cs3", 2]]);
});

test("lead filter: one ad campaign, any Google Ads campaign, one ad group", () => {
  assert.equal(
    buildLeadFormula(new URLSearchParams("view=all&adCampaign=cs3_hormone")),
    'LOWER({UTM Campaign}&"")="cs3_hormone"',
  );
  const any = buildLeadFormula(new URLSearchParams("view=all&adCampaign=google-ads"));
  for (const code of ["cs2_weight_loss", "cs3_hormone", "cs4_aesthetics", "cs5_brand"]) assert.match(any, new RegExp(code));
  assert.equal(
    buildLeadFormula(new URLSearchParams("view=all&adGroup=205117916634")),
    'TRIM({UTM Ad Group}&"")="205117916634"',
  );
  assert.equal(buildLeadFormula(new URLSearchParams("view=all&adGroup=1)OR(1")), "");
});

test("summary breakdown groups by campaign then ad group", () => {
  const base: LeadSummaryRecord = {
    id: "", name: "", source: "", status: "New", replied: false, createdAt: "2026-11-11T14:00:00Z",
    email: "", phone: "", duplicate: false, leadType: "Real Lead", isRealLead: true, aiTags: [],
  };
  const rows = [
    { ...base, id: "a", utmCampaign: "cs3_hormone", utmAdGroup: "205771059487" },
    { ...base, id: "b", utmCampaign: "cs3_hormone", utmAdGroup: "208834347024", status: "Booked" },
    { ...base, id: "c", utmCampaign: "cs3_hormone", utmAdGroup: "208834347024" },
    { ...base, id: "d", utmCampaign: "cs5_brand", utmAdGroup: "" },
    { ...base, id: "e" },
  ];
  assert.deepEqual(groupByAdCampaign(rows), [
    { code: "cs3_hormone", label: "CS3 Hormone Optimization", total: 3, booked: 1, adGroups: [
      { id: "208834347024", label: "Menopause & Symptoms", total: 2 },
      { id: "205771059487", label: "Hormone Therapy", total: 1 },
    ] },
    { code: "cs5_brand", label: "CS5 Brand", total: 1, booked: 0, adGroups: [{ id: "(none)", label: "No ad group", total: 1 }] },
  ]);
});

test("publishing: no default campaign, ended campaigns blocked in dialog and API", async () => {
  const { readFileSync } = await import("node:fs");
  const dialog = readFileSync("src/app/dashboard/PendingAdReviewDialog.tsx", "utf8");
  const route = readFileSync("src/app/api/airtable/ad-reviews/route.ts", "utf8");
  assert.doesNotMatch(dialog, /setSelectedCampaignId\(match\.campaignId\)/);
  assert.match(dialog, /lifecycle !== "ended"/);
  assert.match(route, /Choose the campaign this ad should publish to/);
  assert.match(route, /has ended\. Choose an active campaign/);
  const workspace = readFileSync("src/app/google-ads-analytics/components/GoogleAdsWorkspace.tsx", "utf8");
  assert.match(workspace, /"campaigns",\s*rows,\s*campaignSearch,\s*campaignStatus,\s*"ENABLED",/);
});
