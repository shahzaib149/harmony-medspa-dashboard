import test from "node:test";
import assert from "node:assert/strict";
import { bonusWindow, buildGiftCardCampaign } from "../src/lib/gift-cards/campaign";
import type { Lead } from "../src/lib/leads/map-lead";

// Only the fields the builder reads; the rest of Lead is irrelevant here.
const lead = (over: Partial<Lead>): Lead =>
  ({ id: "rec00000000000001", name: "Fictional Buyer", createdAt: "2026-11-27T15:00:00Z", giftCardAmount: 200, giftCardBonus: 20, giftCardStatus: "Requested", ...over }) as Lead;

test("bonus window is Nov 27–30 Eastern", () => {
  assert.equal(bonusWindow(new Date("2026-11-27T04:59:00Z")), "Upcoming");
  assert.equal(bonusWindow(new Date("2026-11-27T05:00:00Z")), "Live");
  assert.equal(bonusWindow(new Date("2026-12-01T05:00:00Z")), "Ended");
});

test("metrics group gift card statuses and total the requested amounts", () => {
  const data = buildGiftCardCampaign([
    lead({ id: "a" }),
    lead({ id: "b", giftCardStatus: "Paid", giftCardAmount: 150.5, giftCardBonus: 15.05 }),
    lead({ id: "c", giftCardStatus: "Cancelled", giftCardAmount: null, giftCardBonus: null }),
    lead({ id: "d", giftCardStatus: "", createdAt: "2026-11-28T15:00:00Z" }),
  ], [
    { id: "m1", leadIds: ["a"], channel: "Email", status: "sent", sentAt: "2026-11-27T15:01:00Z" },
    { id: "m2", leadIds: ["b"], channel: "Email", status: "rejected", sentAt: "2026-11-27T15:02:00Z" },
    { id: "m3", leadIds: ["someone-else"], channel: "Email", status: "sent", sentAt: "2026-11-27T15:03:00Z" },
  ], new Date("2026-11-28T16:00:00Z"));
  assert.equal(data.metrics.requests, 4);
  assert.equal(data.metrics.open, 3);
  assert.equal(data.metrics.paid, 1);
  assert.equal(data.metrics.cancelled, 1);
  assert.equal(data.metrics.amountRequested, 550.5);
  assert.equal(data.metrics.bonusPromised, 55.05);
  assert.equal(data.metrics.confirmations, 1);
  assert.equal(data.byStatus.find((s) => s.status === "Requested")!.count, 2);
  assert.equal(data.leads[0].id, "d");
  assert.equal(data.status, "Active");
  assert.equal(data.bonus, "Live");
});

test("empty campaign has truthful zero states", () => {
  const data = buildGiftCardCampaign([], [], new Date("2026-12-02T00:00:00Z"));
  assert.equal(data.metrics.requests, 0);
  assert.equal(data.lastActivity, "");
  assert.equal(data.status, "Ended");
});
