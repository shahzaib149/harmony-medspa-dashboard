import test from "node:test";
import assert from "node:assert/strict";
import {
  blackFridayCard, giftCardCard, percent, reactivationCard, registryCard, showSpotlight, statusCounts,
} from "../src/lib/campaigns/card-model";
import type { CampaignSummary } from "../src/lib/types/campaigns";
import type { BlackFridayCampaignSummary } from "../src/lib/black-friday/campaign";
import type { GiftCardCampaignSummary } from "../src/lib/gift-cards/campaign";

test("percent is whole, clamped, and 0 when there is nothing to measure", () => {
  assert.equal(percent(25, 48), 52);
  assert.equal(percent(5, 0), 0);
  assert.equal(percent(Number.NaN, 10), 0);
  assert.equal(percent(12, 10), 100);
});

test("registry campaigns: leads headline, completed ring, three stats", () => {
  const card = registryCard({
    slug: "14-day-nurture", name: "14-Day Nurture", description: "d", type: "Manual Enrollment", status: "Active", channels: ["Email", "SMS"],
    accent: "#4ECDC4", icon: "x", capabilities: {} as CampaignSummary["capabilities"], totalLeads: 48, activeLeads: 0, completedLeads: 36, messagesSent: 1183, lastActivity: null, metrics: {},
  });
  assert.deepEqual([card.href, card.icon, card.headline.value, card.ring.percent], ["/campaigns/14-day-nurture", "branch", 48, 75]);
  assert.deepEqual(card.stats, [["Active", "0"], ["Completed", "36"], ["Messages", "1,183"]]);
});

const bf = (status: BlackFridayCampaignSummary["status"]): BlackFridayCampaignSummary => ({
  name: "Black Friday 2026", status, lastActivity: "", generatedAt: "",
  metrics: { contacts: 1724, members: 44, patients: 1680, emailOk: 1499, smsOk: 1660, unsubscribed: 1, reached: 1690, websiteLeads: 1, replies: 2, messagesSent: 3161 },
  steps: [{ id: "Members Early Access", label: "Members early access", window: "Nov 23–26", eligible: 1724, sent: 1690, remaining: 34, state: "Sending" }],
});

test("Black Friday: reach ring against the list, spotlight only while running or scheduled", () => {
  const card = blackFridayCard(bf("Active"));
  assert.equal(card.ring.percent, 98);
  assert.equal(card.headline.value, 1690);
  assert.ok(showSpotlight(bf("Active")) && showSpotlight(bf("Scheduled")));
  assert.ok(!showSpotlight(bf("Ended")) && !showSpotlight(null));
});

test("gift cards: amount headline in dollars, fulfilled ring ignores cancelled requests", () => {
  const g: GiftCardCampaignSummary = {
    name: "Gift Card Requests", status: "Active", bonus: "Live", lastActivity: "", generatedAt: "",
    metrics: { requests: 5, open: 2, paid: 1, issued: 1, completed: 0, cancelled: 1, amountRequested: 750, bonusPromised: 50, confirmations: 4 },
  };
  const card = giftCardCard(g);
  assert.deepEqual([card.headline.format, card.ring.percent, card.chips[0]], ["usd", 50, "Bonus live"]);
  assert.deepEqual(card.stats[2], ["Bonus promised", "$50"]);
});

test("reactivation works with no data and reports Idle", () => {
  const card = reactivationCard(null);
  assert.deepEqual([card.status, card.headline.value, card.ring.percent], ["Idle", 0, 0]);
});

test("status counts include All", () => {
  assert.deepEqual(statusCounts(["Active", "Active", "Idle"]), { All: 3, Active: 2, Idle: 1 });
});
