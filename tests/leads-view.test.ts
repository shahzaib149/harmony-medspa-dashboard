import assert from "node:assert/strict";
import test from "node:test";
import {
  leadBelongsToView,
  leadViewFormula,
  normalizeLeadView,
  type LeadView,
} from "../src/lib/leads/view";

type ViewLead = Parameters<typeof leadBelongsToView>[0];

function lead(overrides: Partial<ViewLead> = {}): ViewLead {
  return { status: "Contacted", replied: false, leadType: "", isRealLead: false, aiTags: [], ...overrides };
}

test("unknown Lead views normalize to Real leads; known views are kept", () => {
  assert.equal(normalizeLeadView(null), "leads");
  assert.equal(normalizeLeadView("unknown"), "leads");
  assert.equal(normalizeLeadView("leads"), "leads");
  assert.equal(normalizeLeadView("all"), "all");
  assert.equal(normalizeLeadView("not-lead"), "not-lead");
  assert.equal(normalizeLeadView("review"), "review");
  assert.equal(normalizeLeadView("replied"), "replied");
  assert.equal(normalizeLeadView("booked"), "booked");
});

test("classification views split real leads from non-leads", () => {
  const views: LeadView[] = ["leads", "review", "not-lead", "replied", "booked", "all"];
  const examples: Array<{ lead: ViewLead; views: LeadView[] }> = [
    // Records from before AI classification keep counting as real leads.
    { lead: lead(), views: ["leads", "all"] },
    { lead: lead({ leadType: "Real Lead", isRealLead: true }), views: ["leads", "all"] },
    { lead: lead({ leadType: "Unclear", isRealLead: true, aiTags: ["Needs Review"] }), views: ["leads", "review", "all"] },
    { lead: lead({ leadType: "Solicitor", status: "Not a Lead", aiTags: ["Solicitor", "Vendor"] }), views: ["not-lead", "all"] },
    { lead: lead({ leadType: "Existing Patient", replied: true }), views: ["not-lead", "replied", "all"] },
    { lead: lead({ leadType: "Real Lead", isRealLead: true, status: "Booked" }), views: ["leads", "booked", "all"] },
  ];

  for (const example of examples) {
    assert.deepEqual(views.filter((view) => leadBelongsToView(example.lead, view)), example.views);
  }
});

test("Airtable view formulas mirror view membership", () => {
  assert.equal(leadViewFormula("all"), "");
  assert.equal(leadViewFormula("replied"), "{Replied}=TRUE()");
  assert.equal(leadViewFormula("booked"), 'LOWER({Status}&"")="booked"');
  assert.match(leadViewFormula("leads"), /\{Is Real Lead\}=TRUE\(\)/);
  assert.match(leadViewFormula("leads"), /LEN\(\{Lead Type\}&""\)=0/);
  assert.match(leadViewFormula("not-lead"), /NOT\(\{Is Real Lead\}\)/);
  assert.match(leadViewFormula("review"), /Needs Review/);
});
