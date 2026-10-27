import assert from "node:assert/strict";
import test from "node:test";
import {
  aggregateAds,
  aggregateCampaigns,
  aggregateConversionActions,
  aggregateKeywords,
  aggregateSearchTerms,
  dailySeries,
  dedupeRows,
  inDayRange,
  rowDay,
  totalsOf,
  type AdsRow,
} from "../src/lib/google/ads-aggregate";

const row = (id: string, fields: Record<string, unknown>): AdsRow => ({ id, fields });

test("dedupeRows keeps one row per Unique Key, the most recently pulled", () => {
  const rows = [
    row("a", { "Unique Key": "K1", "Pulled At": "2026-09-09T10:00:00.000Z", Cost: 2.02 }),
    row("b", { "Unique Key": "K1", "Pulled At": "2026-09-14T08:31:00.000Z", Cost: 23.84 }),
    row("c", { "Unique Key": "K2", "Pulled At": "2026-09-14T08:31:00.000Z", Cost: 5 }),
    row("d", { Cost: 1 }),
  ];
  const result = dedupeRows(rows);
  assert.equal(result.length, 3);
  assert.equal(result.find((item) => item.fields["Unique Key"] === "K1")?.id, "b");
  assert.equal(totalsOf(result).cost, 23.84 + 5 + 1);
});

test("reporting days are compared as clinic-day strings, never shifted by time zone", () => {
  const sample = row("a", { Date: "2026-10-26" });
  assert.equal(rowDay(sample), "2026-10-26");
  assert.equal(inDayRange("2026-10-26", "2026-10-20", "2026-10-26"), true);
  assert.equal(inDayRange("2026-10-27", "2026-10-20", "2026-10-26"), false);
  assert.equal(inDayRange("", "2026-10-20", "2026-10-26"), false);
});

test("campaign ratios come from summed totals, not averaged daily ratios", () => {
  const rows = [
    row("1", { Date: "2026-10-20", "Campaign ID": "9", "Campaign Name": "CS2", Impressions: 100, Clicks: 10, Cost: 50, Conversions: 1, "Conversion Value": 100, "Search Impression Share": 0.5 }),
    row("2", { Date: "2026-10-21", "Campaign ID": "9", "Campaign Name": "CS2", "Campaign Status": "PAUSED", Impressions: 300, Clicks: 3, Cost: 10, Conversions: 0, "Conversion Value": 0, "Search Impression Share": 0.1 }),
  ];
  const [campaign] = aggregateCampaigns(rows, "Harmony MedSpa");
  assert.equal(campaign.cost, 60);
  assert.equal(campaign.clicks, 13);
  assert.ok(Math.abs(campaign.ctrPct - (13 / 400) * 100) < 1e-9);
  assert.equal(campaign.cpa, 60);
  assert.ok(Math.abs(campaign.roas - 100 / 60) < 1e-9);
  // Status comes from the newest day; impression share is impression-weighted.
  assert.equal(campaign.campaignStatus, "PAUSED");
  assert.ok(Math.abs(campaign.impressionShare - ((0.5 * 100 + 0.1 * 300) / 400) * 100) < 1e-9);
});

test("ads and keywords are keyed by ad group + ID so equal IDs in different groups stay apart", () => {
  const ads = aggregateAds([
    row("1", { "Ad ID": "77", "Ad Group ID": "A", Cost: 1 }),
    row("2", { "Ad ID": "77", "Ad Group ID": "B", Cost: 2 }),
    row("3", { "Ad ID": "77", "Ad Group ID": "A", Cost: 3 }),
  ]);
  assert.equal(ads.length, 2);
  assert.equal(ads.find((ad) => ad.adGroupId === "A")?.cost, 4);
  const keywords = aggregateKeywords([
    row("1", { "Keyword ID": "5", "Ad Group ID": "A", "Keyword Text": "weight loss", Clicks: 1 }),
    row("2", { "Keyword ID": "5", "Ad Group ID": "B", "Keyword Text": "weight loss", Clicks: 2 }),
  ]);
  assert.equal(keywords.length, 2);
});

test("search terms and conversion actions aggregate per term and per action", () => {
  const terms = aggregateSearchTerms([
    row("1", { "Search Term": "glp1 near me", "Ad Group ID": "A", "Matched Keyword": "glp1", "Match Type": "PHRASE", Cost: 5, Clicks: 1 }),
    row("2", { "Search Term": "glp1 near me", "Ad Group ID": "A", "Matched Keyword": "glp1", "Match Type": "PHRASE", Cost: 7, Clicks: 2 }),
  ]);
  assert.equal(terms.length, 1);
  assert.equal(terms[0].cost, 12);
  assert.equal(terms[0].conversions, 0);
  const actions = aggregateConversionActions([
    row("1", { "Conversion Action ID": "1", "Campaign ID": "9", "Conversion Action": "Lead form", Conversions: 1, "All Conversions": 1, "All Conversion Value": 100 }),
    row("2", { "Conversion Action ID": "1", "Campaign ID": "9", "Conversion Action": "Lead form", Conversions: 2, "All Conversions": 3, "All Conversion Value": 50 }),
  ]);
  assert.equal(actions[0].conversions, 3);
  assert.equal(actions[0].allConversionValue, 150);
});

test("dailySeries zero-fills every day in the range", () => {
  const points = dailySeries(
    [row("1", { Date: "2026-10-21", Cost: 10, Clicks: 2 })],
    "2026-10-20",
    "2026-10-22",
  );
  assert.deepEqual(points.map((point) => point.date), ["2026-10-20", "2026-10-21", "2026-10-22"]);
  assert.equal(points[1].cost, 10);
  assert.equal(points[0].cost, 0);
});
