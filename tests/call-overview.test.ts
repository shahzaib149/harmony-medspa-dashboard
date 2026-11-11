import assert from "node:assert/strict";
import test from "node:test";
import { NEEDS_DETAILS_FROM, callMarker } from "../src/lib/leads/call-records";
import { callNeedsDetails } from "../src/lib/leads/call-filter";
import { ALL_CALLS, CALL_SOURCES } from "./fixtures/call-history";
import { callsNeedingDetails, withCallOpportunities } from "../src/lib/leads/call-overview";
import { countsAsRealLead } from "../src/lib/leads/classification";

function totalBetween(from: string, to: string) {
  return withCallOpportunities([], ALL_CALLS).filter((record) => {
    const time = Date.parse(String(record.fields["Lead Created At"]));
    return time >= Date.parse(from) && time <= Date.parse(to);
  }).length;
}

test("All combines both call sources with unique call identities", () => {
  assert.equal(ALL_CALLS.length, 53);
  assert.equal(new Set(ALL_CALLS.map((call) => call.id)).size, 53);
  assert.equal(CALL_SOURCES.find((source) => source.id === "website")?.calls.length, 24);
  assert.equal(CALL_SOURCES.find((source) => source.id === "cs2")?.calls.length, 29);
});

test("seven-day totals include the October calls through midday Oct 8, including the missed call", () => {
  assert.equal(totalBetween("2026-10-02T00:00:00-04:00", "2026-10-08T12:00:00-04:00"), 9);
  assert.equal(totalBetween("2026-09-25T00:00:00-04:00", "2026-10-01T23:59:59-04:00"), 0);
});

test("30-day and month totals use occurrence dates rather than import dates", () => {
  assert.equal(totalBetween("2026-09-08T00:00:00-04:00", "2026-10-07T23:59:59-04:00"), 17);
  assert.equal(totalBetween("2026-10-01T00:00:00-04:00", "2026-10-08T12:00:00-04:00"), 9);
});

test("saving caller details preserves totals and recorded follow-up status", () => {
  const call = ALL_CALLS.find((item) => item.id === "cs2-2026-10-02-0921")!;
  for (const field of ["Notes", "Message"]) {
    const records = withCallOpportunities([{
      id: "recSaved", createdTime: "2026-10-08T16:00:00Z",
      fields: { Source: "Call Leads", Status: "Booked", Replied: true,
        "Lead Created At": "2026-10-08T16:00:00Z", [field]: callMarker(call.id) },
    }], ALL_CALLS);
    assert.equal(records.length, 53);
    assert.equal(records.some((record) => record.id === call.id), false);
    const saved = records.find((record) => record.id === "recSaved")!;
    assert.equal(saved.fields["Lead Created At"], call.occurredAt);
    assert.equal(saved.fields.Status, "Booked");
    assert.equal(saved.fields.Replied, true);
  }
});

test("call opportunities count as unverified leads without invented contact activity", () => {
  for (const record of withCallOpportunities([], ALL_CALLS)) {
    assert.equal(countsAsRealLead({ leadType: String(record.fields["Lead Type"]) }), true);
    assert.equal(record.fields.Status, "New");
    assert.equal(record.fields.Replied, undefined);
    assert.equal(record.fields["Last Contacted At"], undefined);
    assert.equal(record.fields.Phone, undefined);
  }
});

test("a saved call classified as spam stays excluded rather than reappearing as a call", () => {
  const call = ALL_CALLS[0];
  const records = withCallOpportunities([{
    id: "recSpam", createdTime: call.occurredAt,
    fields: { Source: "Call Leads", Message: callMarker(call.id), "Lead Type": "Spam" },
  }], ALL_CALLS);
  assert.equal(records.length, 53);
  assert.equal(records.filter((record) => countsAsRealLead({ leadType: String(record.fields["Lead Type"]) })).length, 52);
});

test("calls needing details: since NEEDS_DETAILS_FROM, without a saved Call Lead marker", () => {
  const [base] = ALL_CALLS;
  const november = (id: string, occurredAt: string) => ({ ...base, id, occurredAt });
  const saved = november("cs2-2026-11-05-1547", "2026-11-05T15:47:00-05:00");
  const open = november("cs2-2026-11-09-1022", "2026-11-09T10:22:00-05:00");
  const lastDayBefore = november("cs2-2026-10-31-2300", "2026-10-31T23:00:00-04:00");
  const records = [
    // Marked "Not a lead" later: still a saved lead, so its call never needs details again.
    { id: "rec1", createdTime: saved.occurredAt, fields: { Source: "Call Leads", "Lead Type": "Spam", Message: callMarker(saved.id) } },
    { id: "rec2", createdTime: saved.occurredAt, fields: { Source: "Website", Message: callMarker(open.id) } },
  ];
  assert.equal(NEEDS_DETAILS_FROM, "2026-11-01");
  assert.deepEqual(callsNeedingDetails(records, [saved, open, lastDayBefore, base]).map((call) => call.id), [open.id]);
});

test("the Needs details chip and counts use the same window and skip saved calls", () => {
  const [base] = ALL_CALLS;
  const recent = { ...base, id: "x", occurredAt: "2026-11-01T00:30:00-04:00" };
  assert.equal(callNeedsDetails(recent, new Set()), true);
  assert.equal(callNeedsDetails(recent, new Set(["x"])), false);
  assert.equal(callNeedsDetails(base, new Set()), false, "calls before Nov 1 keep Add details but are not flagged");
});
