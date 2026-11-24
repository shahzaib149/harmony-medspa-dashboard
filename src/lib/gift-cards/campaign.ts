// Gift Card Requests (website /gift-cards → Make 7108868 → Leads with Lead Type "Gift Card Lead").
// Pure functions only, so they are unit-tested in tests/gift-card-campaign.test.ts.
import type { Lead } from "@/lib/leads/map-lead";

export const GIFT_CARDS_PATH = "/campaigns/gift-cards";
export const GIFT_CARDS_NAME = "Gift Card Requests";
export const GIFT_CARD_CONFIRMATION_STEP = "Gift Card Confirmation";
/** Black Friday bonus window: $100+ gift cards paid Nov 27–30 get 10% back (America/New_York). */
export const GIFT_BONUS_STARTS_AT = "2026-11-27T00:00:00-05:00";
export const GIFT_BONUS_ENDS_AT = "2026-12-01T00:00:00-05:00";

export type GiftCardMessage = { id: string; leadIds: string[]; channel: string; status: string; sentAt: string };

export type GiftCardCampaignData = {
  name: string;
  status: "Active" | "Ended";
  bonus: "Upcoming" | "Live" | "Ended";
  leads: Lead[];
  metrics: {
    requests: number;
    open: number;
    paid: number;
    issued: number;
    completed: number;
    cancelled: number;
    amountRequested: number;
    bonusPromised: number;
    confirmations: number;
  };
  byStatus: { status: string; count: number }[];
  lastActivity: string;
  generatedAt: string;
};

export type GiftCardCampaignSummary = Pick<GiftCardCampaignData, "name" | "status" | "bonus" | "metrics" | "lastActivity" | "generatedAt">;

const STATUSES = ["Requested", "Contacted", "Paid", "Issued", "Completed", "Cancelled"];
const statusOf = (lead: Lead) => lead.giftCardStatus?.trim() || "Requested";
const round = (n: number) => Math.round(n * 100) / 100;

export function bonusWindow(now: Date): GiftCardCampaignData["bonus"] {
  const t = now.getTime();
  if (t < Date.parse(GIFT_BONUS_STARTS_AT)) return "Upcoming";
  if (t < Date.parse(GIFT_BONUS_ENDS_AT)) return "Live";
  return "Ended";
}

export function buildGiftCardCampaign(leads: Lead[], messages: GiftCardMessage[], now = new Date()): GiftCardCampaignData {
  const ids = new Set(leads.map((lead) => lead.id));
  const confirmations = messages.filter((m) => m.leadIds.some((id) => ids.has(id)) && !/fail|reject|bounce|invalid|error/i.test(m.status));
  const count = (status: string) => leads.filter((lead) => statusOf(lead) === status).length;
  const lastActivity = [...leads.map((l) => l.createdAt), ...confirmations.map((m) => m.sentAt)].filter(Boolean).sort().at(-1) ?? "";
  return {
    name: GIFT_CARDS_NAME,
    status: now.getTime() < Date.parse(GIFT_BONUS_ENDS_AT) ? "Active" : "Ended",
    bonus: bonusWindow(now),
    leads: [...leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    metrics: {
      requests: leads.length,
      open: leads.filter((lead) => !["Completed", "Cancelled"].includes(statusOf(lead))).length,
      paid: count("Paid"),
      issued: count("Issued"),
      completed: count("Completed"),
      cancelled: count("Cancelled"),
      amountRequested: round(leads.reduce((sum, lead) => sum + (lead.giftCardAmount ?? 0), 0)),
      bonusPromised: round(leads.reduce((sum, lead) => sum + (lead.giftCardBonus ?? 0), 0)),
      confirmations: confirmations.length,
    },
    byStatus: STATUSES.map((status) => ({ status, count: count(status) })),
    lastActivity,
    generatedAt: now.toISOString(),
  };
}

export function summarizeGiftCards(data: GiftCardCampaignData): GiftCardCampaignSummary {
  const { name, status, bonus, metrics, lastActivity, generatedAt } = data;
  return { name, status, bonus, metrics, lastActivity, generatedAt };
}
