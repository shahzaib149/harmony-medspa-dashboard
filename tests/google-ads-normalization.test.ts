import assert from "node:assert/strict";
import test from "node:test";
import {
  aggregateEntitySnapshots,
  canonicalAdKey,
  canonicalKeywordKey,
  mergeInventoryAndPerformance,
  type SnapshotMetric,
} from "../src/lib/google/ads-normalization";

test("daily ad snapshots become one canonical ad with recomputed ratios", () => {
  const rows: SnapshotMetric[] = Array.from({ length: 30 }, (_, index) => ({
    id: `airtable-${index}`,
    _key: "customers/1/adGroupAds/22~33",
    _ts: `2026-07-${String(index + 1).padStart(2, "0")}`,
    name: index === 29 ? "Latest ad label" : "Earlier ad label",
    status: index === 29 ? "PAUSED" : "ENABLED",
    cost: 10,
    impressions: 100,
    clicks: 10,
    conversions: 1,
    conversionValue: 25,
    conversionValueAvailable: true,
    _roasWtd: 25,
  }));
  const [ad] = aggregateEntitySnapshots(rows);
  assert.equal(aggregateEntitySnapshots(rows).length, 1);
  assert.equal(ad.cost, 300);
  assert.equal(ad.impressions, 3000);
  assert.equal(ad.clicks, 300);
  assert.equal(ad.ctrPct, 10);
  assert.equal(ad.avgCpc, 1);
  assert.equal(ad.cpa, 10);
  assert.equal(ad.roas, 2.5);
  assert.equal(ad.name, "Latest ad label");
  assert.equal(ad.status, "PAUSED");
});

test("missing conversion value stays explicitly unavailable", () => {
  const [row] = aggregateEntitySnapshots<SnapshotMetric>([
    {
      id: "one",
      _key: "one",
      _ts: "2026-07-01",
      cost: 50,
      impressions: 1000,
      clicks: 25,
      conversions: 2,
      conversionValue: 0,
      conversionValueAvailable: false,
      _roasWtd: 0,
    },
  ]);
  assert.equal(row.conversionValueAvailable, false);
  assert.equal(row.roas, 0);
  assert.equal(row.ctrPct, 2.5);
  assert.equal(row.avgCpc, 2);
  assert.equal(row.cpa, 25);
});

test("canonical identities never use entity names", () => {
  assert.equal(
    canonicalAdKey({
      resourceName: "customers/1/adGroupAds/2~3",
      adId: "3",
      adGroupId: "2",
      fallbackId: "rec",
    }),
    "customers/1/adGroupAds/2~3",
  );
  assert.equal(
    canonicalAdKey({ adId: "3", adGroupId: "2", fallbackId: "rec" }),
    "2~3",
  );
  assert.equal(
    canonicalKeywordKey({
      criterionId: "9",
      adGroupId: "2",
      fallbackId: "rec",
    }),
    "2~9",
  );
});

test("inventory entities remain visible when the selected range has no metrics", () => {
  const oldSnapshot: SnapshotMetric = {
    id: "airtable-old",
    _key: "customers/1/adGroups/22",
    _ts: "2025-01-01",
    name: "Quiet ad group",
    status: "PAUSED",
    cost: 100,
    impressions: 1000,
    clicks: 50,
    conversions: 3,
    conversionValue: 250,
    conversionValueAvailable: true,
    _roasWtd: 250,
  };

  const [entity] = mergeInventoryAndPerformance([oldSnapshot], []);
  assert.equal(entity.name, "Quiet ad group");
  assert.equal(entity.status, "PAUSED");
  assert.equal(entity.cost, 0);
  assert.equal(entity.impressions, 0);
  assert.equal(entity.conversionValueAvailable, false);
});
