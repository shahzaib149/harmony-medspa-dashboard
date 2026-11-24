import test from "node:test";
import assert from "node:assert/strict";
import { buildBlackFridayCampaign, campaignStatus, isSendable, segmentMessagesSent, type AudienceContact } from "../src/lib/black-friday/campaign";

const base: AudienceContact = {
  id: "rec00000000000001", name: "Fictional Member", firstName: "Fictional", email: "member@example.com", phone: "+19415550100",
  segment: "Member", emailOk: true, smsOk: true, unsubscribed: false, alsoLead: false, sentSteps: [], notes: "", createdAt: "2026-11-23T12:00:00Z",
};
const contact = (over: Partial<AudienceContact>): AudienceContact => ({ ...base, ...over });
const nov24 = new Date("2026-11-24T18:00:00Z");

test("status follows the Nov 23–30 window in Eastern time", () => {
  assert.equal(campaignStatus(new Date("2026-11-23T04:59:00Z")), "Scheduled");
  assert.equal(campaignStatus(new Date("2026-11-23T05:00:00Z")), "Active");
  assert.equal(campaignStatus(new Date("2026-12-01T05:00:00Z")), "Ended");
});

test("sendable excludes unsubscribed, website leads and unreachable contacts", () => {
  assert.equal(isSendable(base), true);
  assert.equal(isSendable(contact({ unsubscribed: true })), false);
  assert.equal(isSendable(contact({ alsoLead: true })), false);
  assert.equal(isSendable(contact({ emailOk: false, smsOk: false })), false);
  assert.equal(isSendable(contact({ email: "", smsOk: false })), false);
  assert.equal(isSendable(contact({ emailOk: false })), true);
});

test("a partial early-access send shows sent, remaining and Sending during its window", () => {
  const audience = [
    contact({ id: "a", segment: "Existing Patient", sentSteps: ["Members Early Access"] }),
    contact({ id: "b", segment: "Member" }),
    contact({ id: "c", segment: "Existing Patient", unsubscribed: true }),
  ];
  const data = buildBlackFridayCampaign(audience, [], [], nov24);
  const early = data.steps.find((s) => s.id === "Members Early Access")!;
  assert.deepEqual([early.sent, early.remaining, early.eligible, early.state], [1, 1, 2, "Sending"]);
  assert.equal(data.steps.find((s) => s.id === "Public Sale Open")!.state, "Scheduled");
  assert.deepEqual([data.metrics.members, data.metrics.patients, data.metrics.reached, data.metrics.unsubscribed], [1, 2, 1, 1]);
  assert.equal(data.audience[0].segment, "Member");
});

test("a step is Sent once everyone sendable has it, and Partly sent once its window is over", () => {
  const done = buildBlackFridayCampaign([contact({ sentSteps: ["Members Early Access"] })], [], [], nov24);
  assert.equal(done.steps[0].state, "Sent");
  const late = buildBlackFridayCampaign([contact({ sentSteps: ["Members Early Access"] }), contact({ id: "x" })], [], [], new Date("2026-11-28T15:00:00Z"));
  assert.equal(late.steps[0].state, "Partly sent");
  assert.equal(late.steps[1].state, "Not sent");
});

test("website leads and logged replies are counted; failures are kept apart", () => {
  const data = buildBlackFridayCampaign([], [
    { id: "m1", step: "BF-Instant", channel: "Email", status: "sent", sentAt: "2026-11-23T20:00:00Z" },
    { id: "m2", step: "BF-1 Early Access", channel: "SMS", status: "rejected", sentAt: "2026-11-24T15:00:00Z" },
  ], [{ id: "l1", name: "Fictional Lead", source: "Black Friday Landing Page", treatment: "Glo2Facial", status: "New", leadType: "Real Lead", createdAt: "2026-11-23T19:59:00Z" }], nov24);
  assert.deepEqual(data.messages, { instant: 1, followUp: 0, failed: 1 });
  assert.equal(data.metrics.websiteLeads, 1);
  assert.equal(data.lastActivity, "2026-11-24T15:00:00Z");
});

test("segment messages count one per allowed channel per step", () => {
  assert.equal(segmentMessagesSent([contact({ sentSteps: ["Members Early Access"] }), contact({ smsOk: false, sentSteps: ["Members Early Access", "Public Sale Open"] })]), 4);
});
