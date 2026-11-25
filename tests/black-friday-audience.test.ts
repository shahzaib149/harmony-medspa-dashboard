import test from "node:test";
import assert from "node:assert/strict";
import { isOptOut, matchContacts, optOutFields, parseContactList } from "../src/lib/black-friday/audience";

const NOV_25 = new Date("2026-11-25T15:00:00Z");

test("opt-out fields: emails, texts, or everything, keeping earlier notes", () => {
  assert.deepEqual(optOutFields("email", "", "Hayden", NOV_25), { "Email OK": false, Notes: "Emails stopped Nov 25 · Hayden" });
  assert.deepEqual(optOutFields("sms", "", "", NOV_25), { "SMS OK": false, Notes: "Texts stopped Nov 25" });
  assert.deepEqual(optOutFields("all", "Shares phone with Ann.", "Abdul", NOV_25), {
    Unsubscribed: true, "Email OK": false, "SMS OK": false, Notes: "Shares phone with Ann.\nUnsubscribed (email + text) Nov 25 · Abdul",
  });
  assert.ok(isOptOut("all") && !isOptOut("everything") && !isOptOut(undefined));
});

test("pasted lists: emails any case, US phones in any format, junk reported", () => {
  const { emails, phones, unreadable } = parseContactList("Carol <CMorwasky@Gmail.com>; (941) 724-0710\n+1 941.555.0100, 19415550101\nhello");
  assert.deepEqual([...emails], ["cmorwasky@gmail.com"]);
  assert.deepEqual([...phones], ["+19417240710", "+19415550100", "+19415550101"]);
  assert.deepEqual(unreadable, ["hello"]);
});

test("matching finds contacts by email or phone and lists what is not on the list", () => {
  const audience = [
    { id: "rec1", name: "Carol", email: "cmorwasky@gmail.com", phone: "+19417240710", unsubscribed: false },
    { id: "rec2", name: "Dee", email: "", phone: "+19415550100", unsubscribed: true },
    { id: "rec3", name: "Eve", email: "eve@example.com", phone: "", unsubscribed: false },
  ];
  const result = matchContacts("CMORWASKY@gmail.com\n941-555-0100\nnobody@example.com\n9415559999", audience);
  assert.deepEqual(result.matched.map((m) => [m.id, m.already]), [["rec1", false], ["rec2", true]]);
  assert.deepEqual(result.unmatched, ["nobody@example.com", "+19415559999"]);
});
