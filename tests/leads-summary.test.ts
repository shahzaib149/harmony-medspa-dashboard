import assert from "node:assert/strict";
import test from "node:test";
import { buildLeadFormula } from "../src/lib/leads/query";
import {
  aggregateLeadSummary,
  type LeadSummaryRecord,
} from "../src/lib/leads/summary";

function record(
  id: string,
  overrides: Partial<LeadSummaryRecord> = {},
): LeadSummaryRecord {
  return {
    id,
    name: `Lead ${id}`,
    source: "Website",
    status: "New",
    replied: false,
    createdAt: "2026-07-16T14:00:00.000Z",
    email: `${id}@example.com`,
    phone: `555000${id.padStart(4, "0")}`,
    duplicate: false,
    ...overrides,
  };
}

test("Lead summary aggregates beyond the visible 20-row page", () => {
  const records = Array.from({ length: 28 }, (_, index) =>
    record(String(index + 1), {
      status: index < 9 ? "Contacted" : "New",
    }),
  );

  const { summary, viewCounts } = aggregateLeadSummary(
    records,
    "all",
    new Date("2026-07-16T18:00:00.000Z"),
  );

  assert.equal(summary.total, 28);
  assert.equal(summary.newToday, 28);
  assert.equal(summary.contacted, 9);
  assert.deepEqual(viewCounts, { all: 28, replied: 0, booked: 0 });
});

test("summary tab counts overlap for replied and booked Leads", () => {
  const records = [
    record("lead"),
    record("reply", { status: "Contacted", replied: true }),
    record("booked", { status: "Booked", replied: false }),
    record("booked-reply", { status: "Booked", replied: true }),
  ];

  const aggregate = aggregateLeadSummary(records, "booked");
  assert.deepEqual(aggregate.viewCounts, { all: 4, replied: 2, booked: 2 });
  assert.equal(aggregate.summary.total, 2);
  assert.equal(aggregate.summary.booked, 2);
  assert.equal(aggregate.summary.replied, 1);
  assert.equal(aggregate.summary.notReplied, 1);

  const replied = aggregateLeadSummary(records, "replied").summary;
  assert.equal(replied.total, 2);
  assert.equal(replied.booked, 1);
  assert.equal(replied.notBooked, 1);

  assert.equal(aggregateLeadSummary(records, "all").summary.total, 4);
});

test("duplicate metrics use the complete matching view", () => {
  const records = [
    record("1", { email: "same@example.com" }),
    record("2", { email: " SAME@example.com " }),
    record("3", { duplicate: true }),
    record("4"),
  ];

  assert.equal(aggregateLeadSummary(records, "all").summary.duplicates, 3);
});

test("table and summary formulas share filters while summary can omit the active view", () => {
  const params = new URLSearchParams({
    view: "replied",
    search: "Jane",
    leadStatus: "Contacted",
    source: "Website",
    currentStep: "Day 3 Email",
    smsStatus: "sent",
  });

  const paginatedFormula = buildLeadFormula(params);
  const summaryFormula = buildLeadFormula(params, { includeView: false });

  assert.match(paginatedFormula, /\{Replied\}=TRUE\(\)/);
  assert.doesNotMatch(paginatedFormula, /Status.*booked/);
  assert.doesNotMatch(summaryFormula, /\{Replied\}=TRUE\(\)/);
  assert.match(summaryFormula, /\{Status\}="Contacted"/);
  assert.match(summaryFormula, /\{Source\}="Website"/);
  assert.match(summaryFormula, /\{Nurture Current Step\}="Day 3 Email"/);
  assert.match(summaryFormula, /\{SMS Sent Status\}/);
  assert.match(summaryFormula, /FIND\("jane"/);
});
