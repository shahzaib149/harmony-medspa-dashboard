import test from "node:test";
import assert from "node:assert/strict";
import { segmentMessages, firstNameFor, optedOutAt } from "../src/lib/black-friday/copy";
import type { AudienceContact } from "../src/lib/black-friday/campaign";

const contact = (over: Partial<AudienceContact>): AudienceContact => ({
  id: "recC", name: 'Lauren "Laurie" Fictional', firstName: "Laurie", email: "laurie@example.com", phone: "+19415550100",
  segment: "Member", emailOk: true, smsOk: true, unsubscribed: false, alsoLead: false, sentSteps: ["Members Early Access"], notes: "", createdAt: "", ...over,
});

test("a member who got early access has the member email and text, addressed by first name", () => {
  const msgs = segmentMessages(contact({}));
  assert.deepEqual(msgs.map((m) => m.channel), ["Email", "SMS"]);
  assert.match(msgs[0].messageBody, /^Subject: Your Harmony Black Friday early access is open/);
  assert.match(msgs[0].messageBody, /Hi Laurie,/);
  assert.match(msgs[0].messageBody, /As a Harmony member/);
  assert.match(msgs[1].messageBody, /member early access is open through Nov 26/);
  assert.ok(msgs.every((m) => m.deliveryStatus === "Sent" && m.recipientLeadId === "recC" && m.sequence === "Black Friday 2026"));
});

test("patients get patient wording; channels follow Email OK / SMS OK", () => {
  const msgs = segmentMessages(contact({ segment: "Existing Patient", smsOk: false }));
  assert.deepEqual(msgs.map((m) => m.channel), ["Email"]);
  assert.match(msgs[0].messageBody, /Not a member yet\?/);
});

test("nothing for steps not reached or contacts with no usable channel", () => {
  assert.equal(segmentMessages(contact({ sentSteps: [] })).length, 0);
  assert.equal(segmentMessages(contact({ emailOk: false, smsOk: false })).length, 0);
  assert.equal(segmentMessages(contact({ sentSteps: ["Members Early Access", "Public Sale Open"] })).length, 4);
});

test("first name falls back to the first word of the name, then 'there'", () => {
  assert.equal(firstNameFor({ firstName: "", name: "Ann Szynal" }), "Ann");
  assert.equal(firstNameFor({ firstName: " ", name: "" }), "there");
});

test("an unsubscribe after a send keeps that send's messages; a send after it does not get the channel", () => {
  const carol = contact({ emailOk: false, smsOk: false, unsubscribed: true, notes: "Unsubscribed (email + SMS) per Hayden, Nov 25" });
  assert.deepEqual(segmentMessages(carol).map((m) => m.channel), ["Email", "SMS"]);
  const stoppedEmail = contact({ emailOk: false, notes: "Shared inbox.\nEmails stopped Nov 25 · Hayden", sentSteps: ["Members Early Access", "Public Sale Open"] });
  assert.deepEqual(segmentMessages(stoppedEmail).map((m) => `${m.sequenceStep}:${m.channel}`), ["Members early access:Email", "Members early access:SMS", "Public sale is live:SMS"]);
  assert.equal(optedOutAt("Texts stopped Nov 30", "email"), null);
});

test("from Nov 27 the email footer points to the personal unsubscribe link", () => {
  const [email] = segmentMessages(contact({ sentSteps: ["Public Sale Open"] }));
  assert.match(email.messageBody, /unsubscribe here/);
  assert.doesNotMatch(email.messageBody, /Reply "unsubscribe"/);
});
