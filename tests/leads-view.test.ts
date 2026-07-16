import assert from "node:assert/strict";
import test from "node:test";
import {
  leadBelongsToView,
  leadViewFormula,
  normalizeLeadView,
  type LeadView,
} from "../src/lib/leads/view";

test("unknown and legacy Lead views normalize to All Leads", () => {
  assert.equal(normalizeLeadView(null), "all");
  assert.equal(normalizeLeadView("unknown"), "all");
  assert.equal(normalizeLeadView("leads"), "all");
  assert.equal(normalizeLeadView("all"), "all");
  assert.equal(normalizeLeadView("replied"), "replied");
  assert.equal(normalizeLeadView("booked"), "booked");
});

test("Lead views overlap while All Leads always contains every record", () => {
  const examples: Array<{
    lead: { status: string; replied: boolean };
    views: LeadView[];
  }> = [
    { lead: { status: "Contacted", replied: false }, views: ["all"] },
    { lead: { status: "Contacted", replied: true }, views: ["all", "replied"] },
    { lead: { status: "Booked", replied: false }, views: ["all", "booked"] },
    { lead: { status: "Booked", replied: true }, views: ["all", "replied", "booked"] },
  ];

  for (const example of examples) {
    assert.deepEqual(
      (["all", "replied", "booked"] as LeadView[]).filter((view) =>
        leadBelongsToView(example.lead, view),
      ),
      example.views,
    );
  }
});

test("Airtable view formulas preserve overlapping membership", () => {
  assert.equal(leadViewFormula("all"), "");
  assert.equal(leadViewFormula("replied"), "{Replied}=TRUE()");
  assert.equal(leadViewFormula("booked"), 'LOWER({Status}&"")="booked"');
  assert.doesNotMatch(leadViewFormula("replied"), /Status/);
});
