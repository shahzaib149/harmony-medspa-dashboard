import assert from "node:assert/strict";
import test from "node:test";
import { ALL_CALLS, CALL_SOURCES, callMarker } from "../src/lib/leads/call-records";
import { withCallOpportunities } from "../src/lib/leads/call-overview";
import { countsAsRealLead } from "../src/lib/leads/classification";

function totalBetween(from: string, to: string) {
  return withCallOpportunities([]).filter((record) => {
    const time = Date.parse(String(record.fields["Lead Created At"]));
    return time >= Date.parse(from) && time <= Date.parse(to);
  }).length;
}

test("All combines both call sources with unique call identities", () => {
  assert.equal(ALL_CALLS.length, 45);
  assert.equal(new Set(ALL_CALLS.map((call) => call.id)).size, 45);
  assert.equal(CALL_SOURCES.find((source) => source.id === "website")?.calls.length, 24);
  assert.equal(CALL_SOURCES.find((source) => source.id === "cs2")?.calls.length, 21);
});

test("seven-day totals include seven October calls, including the missed call", () => {
  assert.equal(totalBetween("2026-10-02T00:00:00-04:00", "2026-10-08T12:00:00-04:00"), 7);
  assert.equal(totalBetween("2026-09-25T00:00:00-04:00", "2026-10-01T23:59:59-04:00"), 0);
});

test("30-day and month totals use occurrence dates rather than import dates", () => {
  assert.equal(totalBetween("2026-09-08T00:00:00-04:00", "2026-10-07T23:59:59-04:00"), 17);
  assert.equal(totalBetween("2026-10-01T00:00:00-04:00", "2026-10-08T12:00:00-04:00"), 7);
});

test("saving caller details preserves totals and recorded follow-up status", () => {
  const call = ALL_CALLS.find((item) => item.id === "cs2-2026-10-02-0921")!;
  for (const field of ["Notes", "Message"]) {
    const records = withCallOpportunities([{
      id: "recSaved", createdTime: "2026-10-08T16:00:00Z",
      fields: { Source: "Call Leads", Status: "Booked", Replied: true,
        "Lead Created At": "2026-10-08T16:00:00Z", [field]: callMarker(call.id) },
    }]);
    assert.equal(records.length, 45);
    assert.equal(records.some((record) => record.id === call.id), false);
    const saved = records.find((record) => record.id === "recSaved")!;
    assert.equal(saved.fields["Lead Created At"], call.occurredAt);
    assert.equal(saved.fields.Status, "Booked");
    assert.equal(saved.fields.Replied, true);
  }
});

test("call opportunities count as unverified leads without invented contact activity", () => {
  for (const record of withCallOpportunities([])) {
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
  }]);
  assert.equal(records.length, 45);
  assert.equal(records.filter((record) => countsAsRealLead({ leadType: String(record.fields["Lead Type"]) })).length, 44);
});
