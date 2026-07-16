import assert from "node:assert/strict";
import test from "node:test";
import {
  leadBelongsToView,
  leadViewFor,
  leadViewFormula,
  normalizeLeadView,
} from "../src/lib/leads/view";

test("unknown lead views fall back to leads", () => {
  assert.equal(normalizeLeadView(null), "leads");
  assert.equal(normalizeLeadView("unknown"), "leads");
  assert.equal(normalizeLeadView("replied"), "replied");
  assert.equal(normalizeLeadView("booked"), "booked");
});

test("lead views are mutually exclusive with booked taking priority", () => {
  const examples = [
    { lead: { status: "Contacted", replied: false }, view: "leads" },
    { lead: { status: "Contacted", replied: true }, view: "replied" },
    { lead: { status: "Booked", replied: false }, view: "booked" },
    { lead: { status: "Booked", replied: true }, view: "booked" },
  ] as const;

  for (const example of examples) {
    assert.equal(leadViewFor(example.lead), example.view);
    assert.deepEqual(
      ["leads", "replied", "booked"].filter((view) =>
        leadBelongsToView(example.lead, view as typeof example.view),
      ),
      [example.view],
    );
  }
});

test("Airtable formulas encode the same booked-first priority", () => {
  assert.match(leadViewFormula("leads"), /NOT\(\{Replied\}=TRUE\(\)\)/);
  assert.match(leadViewFormula("leads"), /!="booked"/);
  assert.match(leadViewFormula("replied"), /\{Replied\}=TRUE\(\)/);
  assert.match(leadViewFormula("replied"), /!="booked"/);
  assert.equal(leadViewFormula("booked"), 'LOWER({Status}&"")="booked"');
});
