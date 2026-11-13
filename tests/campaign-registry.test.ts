import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  ACTIVE_CAMPAIGNS,
  ALL_UTM_CAMPAIGNS,
  CAMPAIGNS,
  adCampaignLabel,
  adGroupLabel,
  callBucket,
  callLabelsForCampaign,
  callSourceLabel,
  campaignById,
  utmCampaignsFor,
} from "../src/lib/google/campaign-registry";
import { groupCallSources, mapCallRecord, pageOfCall } from "../src/lib/leads/call-records";
import { filterCallLeads } from "../src/lib/leads/call-filter";
import { KNOWN_CALL_CAMPAIGNS, planCallSync } from "../src/lib/leads/call-sync-plan";
import { buildLeadFormula } from "../src/lib/leads/query";
import { groupByAdCampaign, type LeadSummaryRecord } from "../src/lib/leads/summary";

test("registry: Nov 12 structure (CS2 Harmony Main $45, CS5 $5 active; CS3/CS4 paused; Website ended)", () => {
  assert.deepEqual(
    CAMPAIGNS.map((c) => [c.code, c.id, c.lifecycle, c.dailyBudget]),
    [
      ["CS2", "24134330302", "active", 45],
      ["CS5", "24447046761", "active", 5],
      ["CS3", "24452301491", "paused", null],
      ["CS4", "24452305673", "paused", null],
      ["Website", "24080482948", "ended", null],
    ],
  );
  assert.deepEqual(ACTIVE_CAMPAIGNS.map((c) => c.code), ["CS2", "CS5"]);
  assert.equal(campaignById("24134330302")?.name, "CS2 | Harmony Main | Sarasota");
  assert.deepEqual(campaignById("24134330302")?.adGroups.map((g) => g.id), ["194482691170", "203567439833", "203567451553", "202693470432", "201362020079", "202693487912"]);
});

test("lead labels: cs2_main and cs2_weight_loss are both CS2; ad groups match the Airtable formula", () => {
  assert.equal(adCampaignLabel("cs2_main"), "CS2 Harmony Main");
  assert.equal(adCampaignLabel("cs2_weight_loss"), "CS2 Harmony Main");
  assert.equal(adCampaignLabel("cs5_brand"), "CS5 Brand");
  assert.equal(adCampaignLabel("spring_promo"), "spring_promo");
  const airtable = readFileSync("tests/fixtures/airtable-ad-group-formula.txt", "utf8");
  for (const campaign of CAMPAIGNS) for (const group of campaign.adGroups) {
    assert.equal(adGroupLabel(group.id), group.label);
    assert.ok(airtable.includes(`"${group.id}","${group.label}"`), `Airtable formula maps ${group.id} to ${group.label}`);
  }
  assert.equal(adGroupLabel("205771059487"), "Hormone Therapy (old CS3)");
  assert.equal(adGroupLabel("202132713276"), "RF Microneedling + CO2 (old CS4)");
  assert.equal(adGroupLabel("999"), "999");
});

test("importer mapping matches the Make scenario 6807651 table", () => {
  assert.deepEqual(callLabelsForCampaign("24134330302", "x"), { source: "CS2", line: "CS2", prefix: "cs2" });
  assert.deepEqual(callLabelsForCampaign("24447046761", "x"), { source: "CS5", line: "CS5 Brand", prefix: "cs5" });
  assert.deepEqual(callLabelsForCampaign("24452301491", "x"), { source: "CS3", line: "CS3 Hormone", prefix: "cs3" });
  assert.deepEqual(callLabelsForCampaign("24452305673", "x"), { source: "CS4", line: "CS4 Aesthetics", prefix: "cs4" });
  assert.deepEqual(callLabelsForCampaign("24080482948", "x"), { source: "Website", line: "Website new", prefix: "web" });
  assert.deepEqual(callLabelsForCampaign("999", "Spring Promo"), { source: "Spring Promo", line: "Spring Promo", prefix: "gads" });
  assert.equal(Object.keys(KNOWN_CALL_CAMPAIGNS).length, 5);
  // Same dedupe key as Make: an already-imported Google call is never written again.
  const plan = planCallSync(
    [{ recordId: "rec1", id: "cs5-2026-11-12-0934", occurredAt: "2026-11-12T09:34:00-05:00", duration: 1980, googleCall: "customers/1/callViews/abc" }],
    [{ googleCall: "customers/1/callViews/abc", occurredAt: "2026-11-12T09:34:00-05:00", durationSeconds: 1980, missed: false, areaCode: "941", countryCode: "US", campaignId: "24447046761", campaignName: "CS5 | Brand | Sarasota" }],
    "2026-11-13T13:00:00Z",
  );
  assert.deepEqual([plan.create.length, plan.link.length, plan.unchanged], [0, 0, 1]);
  const fresh = planCallSync([], [{ googleCall: "customers/1/callViews/new", occurredAt: "2026-11-12T09:34:00-05:00", durationSeconds: 1980, missed: false, areaCode: "941", countryCode: "US", campaignId: "24447046761", campaignName: "CS5 | Brand | Sarasota" }], "2026-11-13T13:00:00Z");
  assert.equal(fresh.create[0]["Call ID"], "cs5-2026-11-12-0934");
  assert.equal(fresh.create[0].Source, "CS5");
  assert.equal(fresh.create[0].Line, "CS5 Brand");
  assert.equal(fresh.create[0]["Campaign ID"], "24447046761");
  assert.equal(fresh.create[0].Kind, "conversation");
});

const row = (fields: Record<string, unknown>) =>
  mapCallRecord({ fields: { "Occurred At": "2026-11-12T14:34:00.000Z", Duration: 1980, ...fields } })!;

test("calls: Campaign ID first, Source fallback, unknown Google Ads → Other Google Ads", () => {
  assert.equal(row({ "Call ID": "cs2-1", Source: "CS2" }).source, "CS2"); // older rows: no Campaign ID
  assert.equal(row({ "Call ID": "web-1", Source: "Website", Line: "Website new" }).source, "Website");
  assert.equal(row({ "Call ID": "cs5-1", Source: "CS5", Line: "CS5 Brand", "Campaign ID": "24447046761" }).line, "CS5 Brand");
  assert.equal(row({ "Call ID": "x-1", Source: "something odd", "Campaign ID": "24447046761" }).source, "CS5");
  assert.equal(row({ "Call ID": "gads-1", Source: "Spring Promo", "Campaign ID": "999" }).source, "Other Google Ads");
  assert.equal(row({ "Call ID": "gads-2", Source: "Spring Promo", Origin: "Google Ads sync" }).source, "Other Google Ads");
  assert.equal(row({ "Call ID": "m-1", Source: "Walk-in" }).source, "Walk-in"); // hand-entered keeps its Source
  assert.equal(callBucket({ source: "CS3 | Hormone Optimization | Sarasota" }).code, "CS3");
});

test("calls filter lists every campaign even before its first call; deep links work for every prefix", () => {
  const calls = ["cs2-2026-11-10-1000", "web-2026-08-10-1000", "cs5-2026-11-12-0934", "cs3-2026-11-11-1000", "cs4-2026-11-11-1100", "gads-2026-11-12-1200"].map((id, i) =>
    row({ "Call ID": id, "Occurred At": `2026-11-1${i % 3}T1${i}:00:00.000Z`, Source: id.startsWith("gads") ? "Spring Promo" : "", "Campaign ID": { cs2: "24134330302", web: "24080482948", cs5: "24447046761", cs3: "24452301491", cs4: "24452305673", gads: "999" }[id.split("-")[0]] }));
  assert.deepEqual(groupCallSources([], { includeCampaigns: true }).map((g) => [g.id, g.calls.length]), [["cs2", 0], ["cs5", 0], ["cs3", 0], ["cs4", 0], ["website", 0]]);
  assert.deepEqual(groupCallSources(calls).map((g) => g.id), ["cs2", "cs5", "cs3", "cs4", "website", "other-google-ads"]);
  for (const call of calls) {
    const visible = filterCallLeads(calls, { source: "all" }, new Set());
    assert.notEqual(pageOfCall(visible, call.id, 10), null, `${call.id} is reachable from the deep link`);
    assert.equal(filterCallLeads(calls, { source: call.source === "Other Google Ads" ? "other-google-ads" : call.source.toLowerCase() }, new Set()).some((c) => c.id === call.id), true);
  }
  assert.equal(callSourceLabel("CS2"), "CS2 Harmony Main");
  assert.equal(callSourceLabel("CS5"), "CS5 Brand");
  assert.equal(callSourceLabel("CS3"), "CS3 Hormone (paused)");
  assert.equal(callSourceLabel("Website"), "Website new (ended)");
});

test("lead filter: campaign code covers legacy utm codes; any-Google-Ads covers every known code", () => {
  assert.deepEqual(utmCampaignsFor("CS2"), ["cs2_main", "cs2_weight_loss"]);
  assert.equal(
    buildLeadFormula(new URLSearchParams("view=all&adCampaign=CS2")),
    'OR(LOWER({UTM Campaign}&"")="cs2_main",LOWER({UTM Campaign}&"")="cs2_weight_loss")',
  );
  assert.equal(buildLeadFormula(new URLSearchParams("view=all&adCampaign=cs5_brand")), 'LOWER({UTM Campaign}&"")="cs5_brand"');
  const any = buildLeadFormula(new URLSearchParams("view=all&adCampaign=google-ads"));
  for (const code of ALL_UTM_CAMPAIGNS) assert.match(any, new RegExp(code));
  assert.equal(buildLeadFormula(new URLSearchParams("view=all&adGroup=1)OR(1")), "");
});

test("summary breakdown: one CS2 group for both utm codes, ad groups by label", () => {
  const base: LeadSummaryRecord = {
    id: "", name: "", source: "", status: "New", replied: false, createdAt: "2026-11-11T14:00:00Z",
    email: "", phone: "", duplicate: false, leadType: "Real Lead", isRealLead: true, aiTags: [],
  };
  const rows = [
    { ...base, id: "a", utmCampaign: "cs2_weight_loss", utmAdGroup: "194482691170", status: "Booked" },
    { ...base, id: "b", utmCampaign: "cs2_main", utmAdGroup: "203567451553" },
    { ...base, id: "c", utmCampaign: "cs2_main", utmAdGroup: "203567451553" },
    { ...base, id: "d", utmCampaign: "cs4_aesthetics", utmAdGroup: "202132713276" },
    { ...base, id: "e" },
  ];
  assert.deepEqual(groupByAdCampaign(rows), [
    { code: "CS2", label: "CS2 Harmony Main", total: 3, booked: 1, adGroups: [
      { id: "203567451553", label: "Menopause & Symptoms", total: 2 },
      { id: "194482691170", label: "Medical Weight Loss | Sarasota", total: 1 },
    ] },
    { code: "CS4", label: "CS4 Aesthetics & Memberships", total: 1, booked: 0, adGroups: [{ id: "202132713276", label: "RF Microneedling + CO2 (old CS4)", total: 1 }] },
  ]);
});

test("publishing: no default campaign, ended campaigns blocked in dialog and API", () => {
  const dialog = readFileSync("src/app/dashboard/PendingAdReviewDialog.tsx", "utf8");
  const route = readFileSync("src/app/api/airtable/ad-reviews/route.ts", "utf8");
  assert.doesNotMatch(dialog, /setSelectedCampaignId\(match\.campaignId\)/);
  assert.match(dialog, /lifecycle !== "ended"/);
  assert.match(route, /Choose the campaign this ad should publish to/);
  assert.match(route, /has ended\. Choose an active campaign/);
  const workspace = readFileSync("src/app/google-ads-analytics/components/GoogleAdsWorkspace.tsx", "utf8");
  assert.match(workspace, /"campaigns",\s*rows,\s*campaignSearch,\s*campaignStatus,\s*"ENABLED",/);
});
