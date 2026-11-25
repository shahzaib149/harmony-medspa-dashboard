// What each card on /campaigns shows, built from the campaign summaries. Pure, so the
// numbers are unit-tested in tests/campaign-card-model.test.ts.
import type { CampaignSummary } from "@/lib/types/campaigns";
import { BLACK_FRIDAY_NAME, BLACK_FRIDAY_PATH, type BlackFridayCampaignSummary } from "@/lib/black-friday/campaign";
import { GIFT_CARDS_NAME, GIFT_CARDS_PATH, type GiftCardCampaignSummary } from "@/lib/gift-cards/campaign";
import { DEFAULT_CAMPAIGN } from "@/lib/reactivation/model";
import { REACTIVATION_PATH, type ReactivationCampaignSummary } from "@/lib/reactivation/campaign";

export type CardIcon = "zap" | "branch" | "sparkles" | "gift" | "heart";
export type CampaignKind = "Automatic" | "Manual Enrollment";

export type CampaignCardModel = {
  key: string;
  name: string;
  description: string;
  href: string;
  status: string;
  type: CampaignKind;
  channels: string[];
  /** Extra chips after type + channels (e.g. "Bonus live"). */
  chips: string[];
  /** CSS colour for the accent strip, icon tile and ring. */
  accent: string;
  icon: CardIcon;
  headline: { value: number; label: string; format?: "usd" };
  ring: { percent: number; label: string };
  stats: [string, string][];
  lastActivity: string;
};

/** Whole percent of part / total, 0 when there is nothing to measure. */
export function percent(part: number, total: number) {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((part / total) * 100)));
}

const n = (value: number) => value.toLocaleString("en-US");
export const usd = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: value % 1 ? 2 : 0 });

export const ACCENTS = { blackFriday: "#B9786A", giftCards: "#C8A46A", reactivation: "#6F9A82" } as const;

export function registryCard(c: CampaignSummary): CampaignCardModel {
  return {
    key: c.slug, name: c.name, description: c.description, href: `/campaigns/${c.slug}`, status: c.status, type: c.type,
    channels: c.channels, chips: [], accent: c.accent || "#C9A84C", icon: c.slug === "speed-to-lead" ? "zap" : "branch",
    headline: { value: c.totalLeads, label: c.totalLeads === 1 ? "lead" : "leads" },
    ring: { percent: percent(c.completedLeads, c.totalLeads), label: "completed" },
    stats: [["Active", n(c.activeLeads)], ["Completed", n(c.completedLeads)], ["Messages", n(c.messagesSent)]],
    lastActivity: c.lastActivity ?? "",
  };
}

export const BF_DESCRIPTION = "Hayden's members and patients by email and text, plus website Black Friday leads. Nov 23–30.";

export function blackFridayCard(bf: BlackFridayCampaignSummary): CampaignCardModel {
  const reachable = bf.steps[0]?.eligible ?? 0;
  return {
    key: "black-friday", name: BLACK_FRIDAY_NAME, description: BF_DESCRIPTION, href: BLACK_FRIDAY_PATH, status: bf.status, type: "Automatic",
    channels: ["Email", "SMS"], chips: ["Seasonal"], accent: ACCENTS.blackFriday, icon: "sparkles",
    headline: { value: bf.metrics.reached, label: "people reached" },
    ring: { percent: percent(bf.metrics.reached, reachable), label: "of the list" },
    stats: [["Contacts", n(bf.metrics.contacts)], ["Messages", n(bf.metrics.messagesSent)], ["Website leads", n(bf.metrics.websiteLeads)]],
    lastActivity: bf.lastActivity,
  };
}

export const GIFT_DESCRIPTION = "Gift card requests from the website. Buy $100+ Nov 27–30 and get 10% back.";

export function giftCardCard(g: GiftCardCampaignSummary): CampaignCardModel {
  const live = g.metrics.requests - g.metrics.cancelled;
  return {
    key: "gift-cards", name: GIFT_CARDS_NAME, description: GIFT_DESCRIPTION, href: GIFT_CARDS_PATH, status: g.status, type: "Automatic",
    channels: ["Email"], chips: [g.bonus === "Live" ? "Bonus live" : g.bonus === "Upcoming" ? "Bonus Nov 27–30" : "Bonus ended"],
    accent: ACCENTS.giftCards, icon: "gift",
    headline: { value: g.metrics.amountRequested, label: "requested", format: "usd" },
    ring: { percent: percent(g.metrics.paid + g.metrics.issued + g.metrics.completed, live), label: "fulfilled" },
    stats: [["Requests", n(g.metrics.requests)], ["Open", n(g.metrics.open)], ["Bonus promised", usd(g.metrics.bonusPromised)]],
    lastActivity: g.lastActivity,
  };
}

export const REACTIVATION_DESCRIPTION = "Three-step email follow-up that brings returning patients back.";

export function reactivationStatus(r: ReactivationCampaignSummary | null) {
  return r?.metrics.active ? "Active" : r?.paused ? "Paused" : "Idle";
}

export function reactivationCard(r: ReactivationCampaignSummary | null): CampaignCardModel {
  const m = r?.metrics;
  return {
    key: "reactivation", name: DEFAULT_CAMPAIGN, description: REACTIVATION_DESCRIPTION, href: REACTIVATION_PATH, status: reactivationStatus(r), type: "Manual Enrollment",
    channels: ["Email"], chips: [], accent: ACCENTS.reactivation, icon: "heart",
    headline: { value: m?.total ?? 0, label: (m?.total ?? 0) === 1 ? "patient" : "patients" },
    ring: { percent: percent(m?.completed ?? 0, m?.total ?? 0), label: "completed" },
    stats: [["Active", n(m?.active ?? 0)], ["Emails sent", n(m?.email ?? 0)], ["Booked", n(m?.bookings ?? 0)]],
    lastActivity: r?.lastActivity ?? "",
  };
}

/** Black Friday gets the featured spotlight while it is running or about to run. */
export function showSpotlight(bf: BlackFridayCampaignSummary | null) {
  return !!bf && (bf.status === "Active" || bf.status === "Scheduled");
}

/** Count per status for the filter pills ("All" included). */
export function statusCounts(statuses: string[]) {
  const counts: Record<string, number> = { All: statuses.length };
  for (const s of statuses) counts[s] = (counts[s] ?? 0) + 1;
  return counts;
}
