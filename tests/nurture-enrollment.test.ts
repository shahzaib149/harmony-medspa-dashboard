import assert from "node:assert/strict";
import test from "node:test";
import {
  activeNurtureLeadIds,
  airtableTransportFailure,
  buildNurtureEnrollmentFields,
  isAirtableRecordId,
  NURTURE_FIELDS,
  parseAirtableErrorResponse,
  removeEmptyOptionalAirtableFields,
} from "../src/lib/airtable/nurture-enrollment";
import { campaignRequiresSmsPermission } from "../src/lib/campaigns/registry";

const leadRecordId = "recABCDEFGHIJKL12";

test("enrollment payload uses a linked-record array and only writable schema fields", () => {
  const fields = buildNurtureEnrollmentFields({
    leadRecordId,
    nextSendAt: "2026-07-29T20:00:00.000Z",
    notes: "  ",
  });

  assert.deepEqual(fields, {
    Lead: [leadRecordId],
    Status: "Active",
    "Current Step": "Day 1 SMS",
    "Next Send At": "2026-07-29T20:00:00.000Z",
  });
  assert.equal("Created At" in fields, false);
  assert.deepEqual(Object.keys(fields), [
    NURTURE_FIELDS.lead,
    NURTURE_FIELDS.status,
    NURTURE_FIELDS.currentStep,
    NURTURE_FIELDS.nextSendAt,
  ]);
});

test("invalid linked-record IDs and invalid UTC datetimes are rejected before Airtable", () => {
  assert.equal(isAirtableRecordId(leadRecordId), true);
  assert.equal(isAirtableRecordId("Kriselia Marte"), false);
  assert.equal(isAirtableRecordId("recTooShort"), false);
  assert.throws(
    () => buildNurtureEnrollmentFields({ leadRecordId: "lead@example.com", nextSendAt: "2026-07-29T20:00:00.000Z" }),
    /linked Lead record ID is invalid/,
  );
  assert.throws(
    () => buildNurtureEnrollmentFields({ leadRecordId, nextSendAt: "07\/29\/2026 04:00 PM" }),
    /valid UTC datetime/,
  );
});

test("optional Airtable cleanup removes empty values and preserves valid false and zero values", () => {
  assert.deepEqual(removeEmptyOptionalAirtableFields({
    empty: "",
    missing: undefined,
    nothing: null,
    noLinks: [],
    checked: false,
    step: 0,
    note: "Ready",
  }), { checked: false, step: 0, note: "Ready" });
});

test("active duplicate detection compares canonical linked Lead record IDs", () => {
  const active = activeNurtureLeadIds([
    { fields: { Lead: [leadRecordId] } },
    { fields: { Lead: ["recZYXWVUTSRQPO98", "not-a-record-id"] } },
    { fields: { Lead: "Kriselia Marte" } },
  ]);

  assert.deepEqual([...active], [leadRecordId, "recZYXWVUTSRQPO98"]);
  assert.equal(active.has("Kriselia Marte"), false);
});

test("Airtable 422 responses become safe field-level validation errors", async () => {
  const parsed = await parseAirtableErrorResponse(new Response(JSON.stringify({
    error: {
      type: "INVALID_VALUE_FOR_COLUMN",
      message: "Field 'Created At' cannot accept the provided value",
    },
  }), { status: 422 }));

  assert.equal(parsed.code, "AIRTABLE_VALIDATION_ERROR");
  assert.equal(parsed.message, "Airtable rejected the enrollment record.");
  assert.equal(parsed.details, "Field 'Created At' is read-only and cannot accept a value.");
  assert.equal(parsed.retryable, false);
});

test("Airtable authorization and transient failures are classified without leaking credentials", async () => {
  for (const status of [401, 403]) {
    const parsed = await parseAirtableErrorResponse(new Response(JSON.stringify({
      error: { type: "AUTHENTICATION_REQUIRED", message: "Bearer secret-token-value" },
    }), { status }));
    assert.equal(parsed.code, "AIRTABLE_AUTH_ERROR");
    assert.equal(parsed.retryable, false);
    assert.doesNotMatch(parsed.providerMessage, /secret-token-value/);
  }

  const unavailable = await parseAirtableErrorResponse(new Response("upstream unavailable", { status: 503 }));
  assert.equal(unavailable.code, "AIRTABLE_REQUEST_FAILED");
  assert.equal(unavailable.retryable, true);
});

test("Airtable timeouts are retryable without retrying completed rows", () => {
  const failure = airtableTransportFailure(new DOMException("request timed out", "TimeoutError"));
  assert.deepEqual(failure, {
    code: "AIRTABLE_TIMEOUT",
    message: "Airtable took too long to respond.",
    details: "Retry the failed rows; completed rows will not be duplicated.",
    reason: "Airtable took too long to respond.",
    retryable: true,
  });
});

test("SMS verification is required because 14-Day Nurture contains SMS steps", () => {
  assert.equal(campaignRequiresSmsPermission("14-day-nurture"), true);
  assert.equal(campaignRequiresSmsPermission("unknown-campaign"), false);
});
