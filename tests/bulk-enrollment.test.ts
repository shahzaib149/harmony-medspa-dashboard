import assert from "node:assert/strict";
import test from "node:test";
import { chunkAirtableRecords } from "../src/lib/airtable/batch";
import { enrollmentClaimIdentity } from "../src/lib/campaigns/enrollment-idempotency";

test("29 Lead and enrollment writes use provider-supported batches", () => {
  const leads = chunkAirtableRecords(Array.from({ length: 29 }, (_, index) => index));
  const enrollments = chunkAirtableRecords(Array.from({ length: 29 }, (_, index) => index));

  assert.deepEqual(leads.map((batch) => batch.length), [10, 10, 9]);
  assert.deepEqual(enrollments.map((batch) => batch.length), [10, 10, 9]);
  assert.equal(leads.length + enrollments.length, 6);
  assert.ok(leads.every((batch) => batch.length <= 10));
});

test("enrollment claims are deterministic for safe retries", () => {
  const first = enrollmentClaimIdentity("14-day-nurture", "new", "lead@example.com", "2026-07-20T20:00:00.000Z");
  const retry = enrollmentClaimIdentity("14-day-nurture", "new", "lead@example.com", "2026-07-20T20:00:00.000Z");
  const otherSchedule = enrollmentClaimIdentity("14-day-nurture", "new", "lead@example.com", "2026-07-21T20:00:00.000Z");

  assert.deepEqual(retry, first);
  assert.notEqual(otherSchedule.claimKey, first.claimKey);
  assert.equal(first.claimKey.length, 64);
});

test("invalid Airtable batch sizes are rejected", () => {
  assert.throws(() => chunkAirtableRecords([1], 11), /between 1 and 10/);
  assert.throws(() => chunkAirtableRecords([1], 0), /between 1 and 10/);
});
