import "server-only";
import { unstable_cache } from "next/cache";
import { CAMPAIGNS } from "@/lib/campaigns/registry";
import { campaignData, summarizeCampaigns } from "@/lib/campaigns/data";
import { campaignSummary } from "@/lib/reactivation/server";
import { blackFridaySummary, giftCardSummary } from "@/lib/black-friday/server";
import type { CampaignSummary } from "@/lib/types/campaigns";
import type { ReactivationCampaignSummary } from "@/lib/reactivation/campaign";
import type { BlackFridayCampaignSummary } from "@/lib/black-friday/campaign";
import type { GiftCardCampaignSummary } from "@/lib/gift-cards/campaign";

/**
 * Tags for Next's data cache. It is shared by every server instance (Vercel Data Cache) and
 * is stale-while-revalidate, so a visitor never waits on a cold Airtable rebuild. Lead and
 * nurture writes already call revalidateTag("airtable-leads") via invalidateLeadsBaseCache.
 */
export const CAMPAIGN_TAGS = ["airtable-leads", "campaigns"];
const REVALIDATE = 300;

const registrySummaries = unstable_cache(async () => summarizeCampaigns(await campaignData()), ["campaigns-registry-summary-v2"], { tags: CAMPAIGN_TAGS, revalidate: REVALIDATE });
const reactivationSummary = unstable_cache(() => campaignSummary(), ["campaigns-reactivation-summary-v2"], { tags: [...CAMPAIGN_TAGS, "reactivation"], revalidate: 900 });
const bfSummary = unstable_cache(() => blackFridaySummary(), ["campaigns-black-friday-summary-v2"], { tags: CAMPAIGN_TAGS, revalidate: REVALIDATE });
const giftSummary = unstable_cache(() => giftCardSummary(), ["campaigns-gift-card-summary-v2"], { tags: CAMPAIGN_TAGS, revalidate: REVALIDATE });

export type CampaignsOverview = {
  /** null = that section could not load; its cards show "Couldn't load" instead of failing the page. */
  campaigns: CampaignSummary[] | null;
  reactivation: ReactivationCampaignSummary | null;
  blackFriday: BlackFridayCampaignSummary | null;
  giftCards: GiftCardCampaignSummary | null;
  failed: string[];
  generatedAt: string;
};

export function emptyCampaignsOverview(): CampaignsOverview {
  return {
    campaigns: CAMPAIGNS.map((item) => ({ ...item, totalLeads: 0, activeLeads: 0, completedLeads: 0, messagesSent: 0, lastActivity: null, metrics: {} })),
    reactivation: null, blackFriday: null, giftCards: null, failed: [], generatedAt: new Date().toISOString(),
  };
}

const settle = <T,>(result: PromiseSettledResult<T>) => (result.status === "fulfilled" ? result.value : null);

/** Every campaign card's summary; each section succeeds or fails on its own. */
export async function loadCampaignsOverview(): Promise<CampaignsOverview> {
  const [campaigns, reactivation, blackFriday, giftCards] = await Promise.allSettled([registrySummaries(), reactivationSummary(), bfSummary(), giftSummary()]);
  const failed = ([["campaigns", campaigns], ["reactivation", reactivation], ["blackFriday", blackFriday], ["giftCards", giftCards]] as const)
    .filter(([, result]) => result.status === "rejected")
    .map(([name, result]) => {
      console.error(`[campaigns] ${name} summary failed`, (result as PromiseRejectedResult).reason);
      return name;
    });
  return {
    campaigns: settle(campaigns),
    reactivation: settle(reactivation) as ReactivationCampaignSummary | null,
    blackFriday: settle(blackFriday),
    giftCards: settle(giftCards),
    failed,
    generatedAt: new Date().toISOString(),
  };
}
