import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  normalizeDevices,
  normalizeGaDate,
  normalizeSites,
  normalizeSources,
  normalizeSummary,
  normalizeTrend,
  safeRate,
} from "../src/lib/google/analytics-normalization";

type Report = Parameters<typeof normalizeSummary>[0];

function report(
  rows: Array<{ dimensions?: string[]; metrics?: Array<number | string> }>,
): Report {
  return {
    rows: rows.map((row) => ({
      dimensionValues: (row.dimensions ?? []).map((value) => ({ value })),
      metricValues: (row.metrics ?? []).map((value) => ({ value: String(value) })),
    })),
  };
}

test("website summary computes visit and lead rates safely", () => {
  const summary = normalizeSummary(
    report([
      {
        metrics: [80, 92, 44, 100, 61, 145, 0.61, 0.39, 2400],
      },
    ]),
    5,
  );

  assert.equal(summary.activeUsers, 80);
  assert.equal(summary.sessions, 100);
  assert.equal(summary.pageViews, 145);
  assert.equal(summary.averageEngagementSeconds, 30);
  assert.equal(summary.viewsPerSession, 1.45);
  assert.equal(summary.leadRate, 0.05);
  assert.equal(safeRate(3, 0), 0);
});

test("website trend fills missing dates and joins generate_lead events", () => {
  const trend = normalizeTrend(
    report([
      { dimensions: ["20260810"], metrics: [5, 6, 8] },
      { dimensions: ["20260812"], metrics: [7, 9, 11] },
    ]),
    report([{ dimensions: ["20260812"], metrics: [2] }]),
    "2026-08-10",
    "2026-08-12",
  );

  assert.equal(normalizeGaDate("20260812"), "2026-08-12");
  assert.deepEqual(
    trend.map((point) => [point.date, point.sessions, point.leads]),
    [
      ["2026-08-10", 6, 0],
      ["2026-08-11", 0, 0],
      ["2026-08-12", 9, 2],
    ],
  );
});

test("source, device, and hostname reports preserve separate websites", () => {
  const sources = normalizeSources(
    report([
      {
        dimensions: ["google / cpc", "Website new", "Paid Search"],
        metrics: [40, 31, 28],
      },
    ]),
    report([
      {
        dimensions: ["google / cpc", "Website new", "Paid Search"],
        metrics: [4],
      },
    ]),
  );
  assert.equal(sources[0]?.leadRate, 0.1);

  const devices = normalizeDevices(
    report([
      { dimensions: ["mobile"], metrics: [30, 60] },
      { dimensions: ["desktop"], metrics: [20, 40] },
    ]),
  );
  assert.equal(devices[0]?.share, 0.6);

  const sites = normalizeSites(
    report([
      {
        dimensions: ["harmony-medspa.vercel.app", "123", "New marketing site"],
        metrics: [30, 60, 80],
      },
      {
        dimensions: ["www.harmonymedspafl.com", "456", "Main website"],
        metrics: [20, 40, 55],
      },
    ]),
  );
  assert.deepEqual(
    sites.map((site) => [site.hostName, site.sessions, site.share]),
    [
      ["harmony-medspa.vercel.app", 60, 0.6],
      ["www.harmonymedspafl.com", 40, 0.4],
    ],
  );
});

test("Website Analytics route preserves auth, URL filters, and responsive tables", () => {
  const root = process.cwd();
  const page = readFileSync(
    join(root, "src", "app", "website-analytics", "page.tsx"),
    "utf8",
  );
  const client = readFileSync(
    join(root, "src", "app", "website-analytics", "WebsiteAnalyticsClient.tsx"),
    "utf8",
  );
  const api = readFileSync(
    join(root, "src", "app", "api", "google-analytics", "overview", "route.ts"),
    "utf8",
  );

  assert.match(page, /requirePageAuth\(\{ next: "\/website-analytics" \}\)/);
  assert.match(api, /requireRole\(request, "viewer"\)/);
  assert.match(client, /searchParams\.get\("days"\)/);
  assert.match(client, /searchParams\.get\("hostname"\)/);
  assert.match(client, /md:hidden/);
  assert.match(client, /hidden overflow-x-auto md:block/);
  assert.match(client, /harmony-medspa\.vercel\.app/);
  assert.match(client, /www\.harmonymedspafl\.com/);
  assert.match(client, /role="listbox"/);
  assert.match(client, /Awaiting GA4 access/);
  assert.doesNotMatch(client, /<select/);
});
