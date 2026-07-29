import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  enrollmentDisplayCounts,
  retryableEnrollmentFailures,
} from "../src/lib/campaigns/enrollment-results";
import type { BulkEnrollmentResult } from "../src/lib/types/campaigns";

const result: BulkEnrollmentResult = {
  success: false,
  partial: true,
  requestId: "da0d0353-8076-4f5d-8a30-4336a40c7de4",
  summary: {
    selected: 4,
    existingLeads: 3,
    newLeadsCreated: 1,
    enrollmentsCreated: 1,
    duplicatesSkipped: 1,
    alreadyEnrolled: 1,
    invalid: 0,
    failed: 1,
  },
  enrolled: [{ leadId: "recABCDEFGHIJKL12", name: "Enrolled Lead" }],
  skipped: [
    { leadId: "recZYXWVUTSRQPON98", name: "Duplicate Lead", reason: "Duplicate" },
    { leadId: "rec1234567890ABCD", name: "Active Lead", reason: "Already active in nurture" },
  ],
  failed: [
    { leadId: "recFAILEDROW12345", name: "Retry Lead", reason: "Timed out", retryable: true },
    { leadId: "recINVALIDROW1234", name: "Invalid Lead", reason: "Invalid", retryable: false },
  ],
};

test("frontend result counts preserve enrolled, skipped, failed, and source summaries", () => {
  assert.deepEqual(enrollmentDisplayCounts(result), {
    enrolled: 1,
    skipped: 2,
    failed: 2,
    newLeadsCreated: 1,
    existingLeads: 3,
    duplicatesSkipped: 1,
    alreadyEnrolled: 1,
  });
});

test("retry selection contains only retryable failed rows", () => {
  assert.deepEqual(retryableEnrollmentFailures(result.failed).map((item) => item.name), ["Retry Lead"]);
});

test("the modal guards double-click submissions in state and synchronously", () => {
  const source = readFileSync("src/components/campaigns/AddLeadsToCampaignModal.tsx", "utf8");
  assert.match(source, /if \(inFlight\.current\) return/);
  assert.match(source, /inFlight\.current = true/);
  assert.match(source, /disabled=\{!ready \|\| saving\}/);
  assert.match(source, /loading=\{saving\}/);
});
