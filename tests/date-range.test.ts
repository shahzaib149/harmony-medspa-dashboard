import assert from "node:assert/strict";
import test from "node:test";
import { DateTime } from "luxon";
import {
  clinicRangeToUtc,
  dateRangeParams,
  previousRange,
  resolveDateRange,
} from "../src/lib/date-range";
import {
  dateRanges,
  resolveAnalyticsRange,
} from "../src/lib/google/analytics-range";
import { callWindowForRange } from "../src/lib/leads/call-filter";
import { buildLeadFormula } from "../src/lib/leads/query";

// 2026-10-26 20:00 New York time (EDT), still 2026-10-27 in UTC.
const NOW = DateTime.fromISO("2026-10-27T00:00:00Z");
const ALL = ["today", "7", "14", "30", "90", "this-month", "last-month", "month", "custom"] as const;
const options = { presets: ALL, now: NOW };

function ok(input: Parameters<typeof resolveDateRange>[0], extra = {}) {
  const result = resolveDateRange(input, { ...options, ...extra });
  assert.ok(result?.ok, JSON.stringify(result));
  return result.range;
}

test("presets resolve in the clinic timezone, not UTC", () => {
  assert.deepEqual(ok({ preset: "today" }), { preset: "today", from: "2026-10-26", to: "2026-10-26", days: 1, label: "Today" });
  const seven = ok({ preset: "7" });
  assert.equal(seven.from, "2026-10-20");
  assert.equal(seven.to, "2026-10-26");
  assert.equal(seven.days, 7);
});

test("this month runs from the 1st to today; last month is the full prior month", () => {
  const thisMonth = ok({ preset: "this-month" });
  assert.deepEqual([thisMonth.from, thisMonth.to, thisMonth.days], ["2026-10-01", "2026-10-26", 26]);
  const lastMonth = ok({ preset: "last-month" });
  assert.deepEqual([lastMonth.from, lastMonth.to, lastMonth.days], ["2026-09-01", "2026-09-30", 30]);
});

test("last month crosses a year boundary and handles leap February", () => {
  const january = { ...options, now: DateTime.fromISO("2027-01-15T15:00:00Z") };
  const dec = resolveDateRange({ preset: "last-month" }, january);
  assert.ok(dec?.ok && dec.range.from === "2026-12-01" && dec.range.to === "2026-12-31");
  const march = { ...options, now: DateTime.fromISO("2028-03-10T15:00:00Z") };
  const feb = resolveDateRange({ preset: "last-month" }, march);
  assert.ok(feb?.ok && feb.range.to === "2028-02-29" && feb.range.days === 29);
});

test("a named month is the full month, the current month stops at today", () => {
  const june = ok({ preset: "month", month: "2026-06" });
  assert.deepEqual([june.from, june.to, june.label], ["2026-06-01", "2026-06-30", "June 2026"]);
  assert.equal(ok({ preset: "month", month: "2026-10" }).to, "2026-10-26");
});

test("future or malformed months are rejected", () => {
  for (const month of ["2026-11", "2027-01", "2026-13", "June", ""]) {
    const result = resolveDateRange({ preset: "month", month }, options);
    assert.equal(result?.ok, false, month);
  }
});

test("custom ranges validate order, calendar dates and the future", () => {
  assert.deepEqual(
    [ok({ preset: "custom", from: "2026-07-04", to: "2026-07-04" }).days],
    [1],
  );
  const bad = [
    { from: "2026-07-10", to: "2026-07-01" },
    { from: "2026-07-01", to: "2026-10-27" },
    { from: "2026-02-30", to: "2026-03-01" },
    { from: "", to: "2026-03-01" },
    { from: "2026-07-01", to: "07/10/2026" },
  ];
  for (const range of bad) {
    assert.equal(resolveDateRange({ preset: "custom", ...range }, options)?.ok, false, JSON.stringify(range));
  }
  assert.equal(resolveDateRange({ preset: "custom", from: "2024-01-01", to: "2026-10-01" }, { ...options, maxDays: 366 })?.ok, false);
});

test("unknown, empty and all presets mean no selection; disallowed presets are ignored", () => {
  assert.equal(resolveDateRange({ preset: "all" }, options), null);
  assert.equal(resolveDateRange({ preset: null }, options), null);
  assert.equal(resolveDateRange({ preset: "bogus" }, options), null);
  assert.equal(resolveDateRange({ preset: "90" }, { presets: ["today", "7"], now: NOW }), null);
});

test("selections serialize to shareable query params", () => {
  assert.deepEqual(dateRangeParams("date", { preset: "month", month: "2026-06" }), { date: "month", month: "2026-06", from: null, to: null });
  assert.deepEqual(dateRangeParams("date", { preset: "custom", from: "2026-07-01", to: "2026-07-09" }), { date: "custom", month: null, from: "2026-07-01", to: "2026-07-09" });
  assert.deepEqual(dateRangeParams("date", { preset: "all" }), { date: null, month: null, from: null, to: null });
});

test("clinic day boundaries convert to UTC across DST", () => {
  const summer = clinicRangeToUtc("2026-07-01", "2026-07-01")!;
  assert.equal(summer.start.toISO(), "2026-07-01T04:00:00.000Z");
  assert.equal(summer.endExclusive.toISO(), "2026-07-02T04:00:00.000Z");
  const winter = clinicRangeToUtc("2026-12-01", "2026-12-31")!;
  assert.equal(winter.start.toISO(), "2026-12-01T05:00:00.000Z");
  assert.equal(winter.endExclusive.toISO(), "2027-01-01T05:00:00.000Z");
  // The DST change day is 25 hours long in the clinic's calendar.
  const fallBack = clinicRangeToUtc("2026-11-01", "2026-11-01")!;
  assert.equal(fallBack.endExclusive.diff(fallBack.start, "hours").hours, 25);
  assert.equal(clinicRangeToUtc("2026-02-30", "2026-03-01"), null);
});

test("lead formula filters by clinic-local days", () => {
  const formula = buildLeadFormula(
    new URLSearchParams({ view: "all", dateFrom: "2026-06-01", dateTo: "2026-06-30" }),
  );
  assert.match(formula, /NOT\(IS_BEFORE\(\{Lead Created At\},DATETIME_PARSE\("2026-06-01 04:00:00"\)\)\)/);
  assert.match(formula, /IS_BEFORE\(\{Lead Created At\},DATETIME_PARSE\("2026-07-01 04:00:00"\)\)/);
  assert.doesNotMatch(buildLeadFormula(new URLSearchParams({ view: "all", dateFrom: "nope" })), /Lead Created At/);
});

test("previous period is the equal-length window before the range", () => {
  assert.deepEqual(previousRange({ from: "2026-10-01", to: "2026-10-26" }), { from: "2026-09-05", to: "2026-09-30" });
  assert.deepEqual(previousRange({ from: "2026-10-20", to: "2026-10-26" }), { from: "2026-10-13", to: "2026-10-19" });
  assert.deepEqual(previousRange({ from: "2026-03-01", to: "2026-03-01" }), { from: "2026-02-28", to: "2026-02-28" });
});

test("analytics ranges keep legacy days links and pass real dates to GA4", () => {
  const legacy = resolveAnalyticsRange(new URLSearchParams("days=7"), NOW);
  assert.ok(legacy.ok);
  assert.deepEqual(dateRanges(legacy.range), {
    current: { start: "2026-10-20", end: "2026-10-26" },
    previous: { start: "2026-10-13", end: "2026-10-19" },
  });
  const june = resolveAnalyticsRange(new URLSearchParams("range=month&month=2026-06"), NOW);
  assert.ok(june.ok);
  assert.deepEqual(dateRanges(june.range), {
    current: { start: "2026-06-01", end: "2026-06-30" },
    previous: { start: "2026-05-02", end: "2026-05-31" },
  });
  const custom = resolveAnalyticsRange(new URLSearchParams("range=custom&from=2026-07-01&to=2026-07-15"), NOW);
  assert.ok(custom.ok && custom.range.days === 15);
  const defaulted = resolveAnalyticsRange(new URLSearchParams(""), NOW);
  assert.ok(defaulted.ok && defaulted.range.days === 30);
  assert.equal(resolveAnalyticsRange(new URLSearchParams("range=custom&from=2026-07-15&to=2026-07-01"), NOW).ok, false);
});

test("call leads window follows the selected range", () => {
  assert.deepEqual(callWindowForRange({ from: "2026-06-01", to: "2026-06-30" }, NOW), { fromDate: "2026-06-01", toDate: "2026-06-30" });
  assert.deepEqual(callWindowForRange(null, NOW), { fromDate: undefined, toDate: "2026-10-26" });
});
