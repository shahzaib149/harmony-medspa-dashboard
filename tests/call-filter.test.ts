import assert from "node:assert/strict";
import test from "node:test";
import { DateTime } from "luxon";
import { callDateWindow, filterCalls } from "../src/lib/leads/call-filter";
import { ALL_CALLS, CALL_SOURCES } from "../src/lib/leads/call-records";

test("Call Leads source filter can show the complete Overview history", () => {
  const window = callDateWindow("all", DateTime.fromISO("2026-10-08T12:00:00Z"));
  assert.equal(filterCalls(ALL_CALLS, window.fromDate, window.toDate).length, 45);
});

test("seven-day range matches Overview and includes the missed call", () => {
  const window = callDateWindow("7", DateTime.fromISO("2026-10-08T12:00:00Z"));
  assert.equal(window.fromDate, "2026-10-02");
  const calls = filterCalls(ALL_CALLS, window.fromDate, window.toDate);
  assert.equal(calls.length, 7);
  assert.equal(calls.filter((call) => call.missed).length, 1);
  assert.equal(filterCalls(CALL_SOURCES[0].calls, window.fromDate, window.toDate).length, 0);
});

test("date windows follow the clinic timezone rather than UTC midnight", () => {
  const window = callDateWindow("today", DateTime.fromISO("2026-10-08T02:00:00Z"));
  assert.deepEqual(window, { fromDate: "2026-10-07", toDate: "2026-10-07" });
  assert.deepEqual(filterCalls(ALL_CALLS, window.fromDate, window.toDate).map((call) => call.id), ["cs2-2026-10-07-1130"]);
});

test("30-day range includes both boundaries and excludes earlier history", () => {
  const window = callDateWindow("30", DateTime.fromISO("2026-10-07T20:00:00Z"));
  assert.equal(window.fromDate, "2026-09-08");
  assert.equal(filterCalls(ALL_CALLS, window.fromDate, window.toDate).length, 17);
});
