import assert from "node:assert/strict";
import test from "node:test";
import {
  countsAsRealLead,
  NO_AUTO_REPLY_TYPES,
  sendsAutoReply,
} from "../src/lib/leads/classification";
import { buildLeadFormula } from "../src/lib/leads/query";
import {
  LEAD_VIEWS,
  leadBelongsToView,
  leadViewFormula,
  normalizeLeadView,
  type LeadView,
} from "../src/lib/leads/view";

type ViewLead = Parameters<typeof leadBelongsToView>[0];

function lead(overrides: Partial<ViewLead> = {}): ViewLead {
  return { status: "Contacted", leadType: "", isRealLead: false, ...overrides };
}

test("tabs are All | Real Leads | Booked, defaulting to Real Leads", () => {
  assert.deepEqual([...LEAD_VIEWS], ["all", "leads", "booked"]);
  assert.equal(normalizeLeadView(null), "leads");
  assert.equal(normalizeLeadView("unknown"), "leads");
  assert.equal(normalizeLeadView("replied"), "leads");
  assert.equal(normalizeLeadView("all"), "all");
  assert.equal(normalizeLeadView("booked"), "booked");
});

test("Real Leads excludes non-leads; All keeps everything", () => {
  const examples: Array<{ lead: ViewLead; views: LeadView[] }> = [
    // Records from before AI classification keep counting as real leads.
    { lead: lead(), views: ["all", "leads"] },
    { lead: lead({ leadType: "Real Lead", isRealLead: true }), views: ["all", "leads"] },
    { lead: lead({ leadType: "Unclear", isRealLead: true }), views: ["all", "leads"] },
    { lead: lead({ leadType: "Solicitor", status: "Not a Lead" }), views: ["all"] },
    { lead: lead({ leadType: "Real Lead", isRealLead: true, status: "Booked" }), views: ["all", "leads", "booked"] },
  ];
  for (const example of examples) {
    assert.deepEqual(LEAD_VIEWS.filter((view) => leadBelongsToView(example.lead, view)), example.views);
  }
});

test("Airtable view formulas mirror view membership", () => {
  assert.equal(leadViewFormula("all"), "");
  assert.equal(leadViewFormula("booked"), 'LOWER({Status}&"")="booked"');
  // Driven by Lead Type, not the Is Real Lead checkbox: Make drops checkbox mappings on import.
  assert.match(leadViewFormula("leads"), /LEN\(\{Lead Type\}&""\)=0/);
  assert.match(leadViewFormula("leads"), /\{Lead Type\}="Real Lead"/);
  assert.match(leadViewFormula("leads"), /\{Lead Type\}="Unclear"/);
  assert.doesNotMatch(leadViewFormula("leads"), /Is Real Lead/);
});

test("classification stands alone when the Is Real Lead checkbox never got written", () => {
  assert.equal(countsAsRealLead({ leadType: "Real Lead", isRealLead: false }), true);
  assert.equal(countsAsRealLead({ leadType: "Unclear", isRealLead: false }), true);
  assert.equal(countsAsRealLead({ leadType: "Solicitor", isRealLead: true }), false);
  assert.equal(countsAsRealLead({ leadType: "" }), true);
});

test("solicitors, spam and job seekers get no auto-reply; other non-leads still do", () => {
  assert.deepEqual([...NO_AUTO_REPLY_TYPES], ["Solicitor", "Spam", "Job Seeker"]);
  for (const type of ["Solicitor", "Spam", "Job Seeker"]) assert.equal(sendsAutoReply(type), false);
  for (const type of ["Real Lead", "Unclear", "Existing Patient", "Appointment Change", ""]) {
    assert.equal(sendsAutoReply(type), true);
  }
});

test("leadType=not-lead filters every non-lead type", () => {
  const formula = buildLeadFormula(new URLSearchParams({ view: "all", leadType: "not-lead" }));
  assert.match(formula, /LEN\(\{Lead Type\}&""\)>0/);
  assert.match(formula, /\{Lead Type\}!="Real Lead"/);
  assert.doesNotMatch(formula, /\{Lead Type\}="not-lead"/);
});
