import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { CALL_FIELDS, describeCallLines, formatCallRange, mapCallRecord } from "../src/lib/leads/call-records";
import { classifyCall, googleCallTime, planCallSync, type ExistingCall, type IncomingCall } from "../src/lib/leads/call-sync-plan";
import { ALL_CALLS, CALL_SOURCES } from "./fixtures/call-history";

test("the Calls table reproduces the previously hard-coded history exactly", () => {
  // Fingerprint of the 53 calls as they were hard-coded before the move to Airtable.
  const fingerprint = createHash("sha256").update(JSON.stringify([...ALL_CALLS]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((c) => [c.id, c.occurredAt, c.areaCode, c.duration, c.assessment, c.kind, !!c.missed]))).digest("hex").slice(0, 16);
  assert.equal(fingerprint, "53190a3001f34e9e");
  const call = ALL_CALLS.find((item) => item.id === "cs2-2026-08-31-1306")!;
  assert.deepEqual([call.date, call.time, call.source, call.line], ["Aug 31", "1:06 PM", "CS2", "CS2"]);
});

test("sources, ranges and labels are derived from the data", () => {
  assert.deepEqual(CALL_SOURCES.map((source) => [source.id, source.label, source.line, source.calls.length, source.range]), [
    ["website", "Website", "Website new", 24, "Aug 3–Sep 8, 2026"],
    ["cs2", "CS2", "CS2", 29, "Aug 31–Oct 21, 2026"],
  ]);
  assert.equal(describeCallLines(CALL_SOURCES), "Website and CS2");
  assert.equal(formatCallRange(ALL_CALLS), "Aug 3–Oct 21, 2026");
  assert.equal(formatCallRange([]), "No calls yet");
});

test("rows without an id or a valid time are ignored; unknown kinds fall back to brief", () => {
  assert.equal(mapCallRecord({ fields: { [CALL_FIELDS.occurredAt]: "2026-10-01T13:00:00.000Z" } }), null);
  assert.equal(mapCallRecord({ fields: { [CALL_FIELDS.id]: "x", [CALL_FIELDS.occurredAt]: "not a date" } }), null);
  const call = mapCallRecord({ fields: { [CALL_FIELDS.id]: "x", [CALL_FIELDS.occurredAt]: "2026-10-01T13:00:00.000Z", [CALL_FIELDS.kind]: "weird" } })!;
  assert.equal(call.kind, "brief");
  assert.equal(call.occurredAt, "2026-10-01T09:00:00-04:00");
  assert.equal(call.source, "Other");
});

test("classification separates missed, out-of-state, hangups and conversations", () => {
  const call = (durationSeconds: number, areaCode = "941", missed = false, countryCode = "US") => classifyCall({ durationSeconds, areaCode, missed, countryCode });
  assert.deepEqual(call(0, "", true), { kind: "hangup", assessment: "Missed call", areaLabel: "Unknown" });
  assert.deepEqual(call(87, "330"), { kind: "out-of-state", assessment: "Out of state, but long", areaLabel: "330" });
  assert.equal(call(20, "416", false, "CA").areaLabel, "416 · CA");
  assert.deepEqual(call(10), { kind: "hangup", assessment: "Hangup", areaLabel: "941" });
  assert.deepEqual(call(20, "813"), { kind: "brief", assessment: "Brief", areaLabel: "813 · Florida" });
  assert.equal(call(38).assessment, "Short but real");
  assert.equal(call(70).assessment, "Real conversation");
  assert.equal(call(713).assessment, "Long conversation");
  assert.equal(call(40, "656").kind, "conversation", "Tampa overlay counts as Florida");
});

test("Google call times convert from the account time zone to clinic time", () => {
  assert.equal(googleCallTime("2026-10-21 09:52:00", "America/New_York"), "2026-10-21T09:52:00-04:00");
  assert.equal(googleCallTime("2026-10-21 13:52:00", "UTC"), "2026-10-21T09:52:00-04:00");
  assert.equal(googleCallTime("garbage", "America/New_York"), null);
});

const incoming = (overrides: Partial<IncomingCall>): IncomingCall => ({
  googleCall: "customers/1/callViews/1", occurredAt: "2026-10-21T09:52:00-04:00", durationSeconds: 18,
  missed: false, areaCode: "352", countryCode: "US", campaignId: "24134330302", campaignName: "CS Campaign2", ...overrides,
});
const existing = (overrides: Partial<ExistingCall>): ExistingCall => ({
  recordId: "rec1", id: "cs2-2026-10-21-0952", occurredAt: "2026-10-21T09:52:00-04:00", duration: 18, googleCall: "", ...overrides,
});

test("an import claims hand-entered calls instead of duplicating them", () => {
  const plan = planCallSync([existing({})], [incoming({ occurredAt: "2026-10-21T09:52:40-04:00", durationSeconds: 19 })], "2026-10-27T00:00:00Z");
  assert.deepEqual(plan.link, [{ recordId: "rec1", id: "cs2-2026-10-21-0952", googleCall: "customers/1/callViews/1" }]);
  assert.equal(plan.create.length, 0);
});

test("already-imported calls are left untouched so staff edits survive", () => {
  const plan = planCallSync([existing({ googleCall: "customers/1/callViews/1" })], [incoming({})], "2026-10-27T00:00:00Z");
  assert.deepEqual([plan.create.length, plan.link.length, plan.unchanged], [0, 0, 1]);
});

test("new calls get stable source-prefixed ids that never collide", () => {
  const plan = planCallSync(
    [existing({ id: "web-2026-10-22-1000", occurredAt: "2026-10-22T08:00:00-04:00", duration: 300, googleCall: "customers/1/callViews/9" })],
    [
      incoming({ googleCall: "customers/1/callViews/2", occurredAt: "2026-10-22T10:00:00-04:00", campaignId: "24080482948", durationSeconds: 75 }),
      incoming({ googleCall: "customers/1/callViews/3", occurredAt: "2026-10-22T10:00:30-04:00", campaignId: "24080482948", durationSeconds: 0, missed: true }),
      incoming({ googleCall: "customers/1/callViews/4", occurredAt: "2026-10-23T11:05:00-04:00", campaignId: "999", campaignName: "Weight Loss" }),
    ],
    "2026-10-27T00:00:00Z",
  );
  assert.deepEqual(plan.create.map((fields) => fields[CALL_FIELDS.id]), ["web-2026-10-22-1000-2", "web-2026-10-22-1000-3", "weight-loss-2026-10-23-1105"]);
  const [first, missed, other] = plan.create;
  assert.equal(first[CALL_FIELDS.source], "Website");
  assert.equal(first[CALL_FIELDS.line], "Website new");
  assert.equal(first[CALL_FIELDS.areaCode], "352 · Florida");
  assert.equal(missed[CALL_FIELDS.assessment], "Missed call");
  assert.equal(other[CALL_FIELDS.source], "Weight Loss");
  assert.equal(other[CALL_FIELDS.origin], "Google Ads sync");
});

test("one hand-entered call is claimed by at most one imported call", () => {
  const plan = planCallSync([existing({})], [
    incoming({ googleCall: "customers/1/callViews/1" }),
    incoming({ googleCall: "customers/1/callViews/2" }),
  ], "2026-10-27T00:00:00Z");
  assert.equal(plan.link.length, 1);
  assert.equal(plan.create.length, 1);
});
