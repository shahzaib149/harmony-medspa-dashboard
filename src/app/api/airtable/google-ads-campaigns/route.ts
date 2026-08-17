import { fetchAllRecords, num, str } from "@/lib/airtable/client";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { withCache, bustCache } from "@/lib/server-cache";

export const dynamic = "force-dynamic";

const CAMPAIGNS_TABLE = "Google Ads Campaigns";
const TTL_SECONDS = 60;

export async function GET(request: Request) {
  try {
    await requireRole(request, "viewer");
  } catch (error) {
    return authErrorResponse(error);
  }

  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "1";
  const cacheKey = "airtable:google-ads-campaigns";
  if (forceRefresh) bustCache(cacheKey);

  try {
    const payload = await withCache(cacheKey, TTL_SECONDS, async () => {
      const rawRecords = await fetchAllRecords(CAMPAIGNS_TABLE, new URLSearchParams(), {
        cache: forceRefresh ? "no-store" : "cached",
        forceRefresh,
      });

      const campaigns = rawRecords.map((record) => {
        const f = record.fields;
        const campaignName = str(f, "Campaign Name", "campaignName");
        const campaignId = str(f, "Campaign ID", "campaignId");
        const campaignResourceName = str(f, "Campaign Resource Name", "campaignResourceName");
        const status = (str(f, "Status", "status") || "ENABLED").toUpperCase();
        const channelType = (str(f, "Channel Type", "channelType") || "SEARCH").toUpperCase();
        const lastSyncedAt = str(f, "Last Synced At", "lastSyncedAt", "pulledAt") || record.createdTime;
        const linkedAdGroups = Array.isArray(f["Google Ads Ad Groups"]) ? f["Google Ads Ad Groups"] : [];

        return {
          id: record.id,
          campaignName,
          name: campaignName,
          campaignId,
          campaignResourceName,
          resourceName: campaignResourceName,
          status,
          campaignStatus: status,
          channelType,
          lastSyncedAt,
          budget: num(f, "Daily Budget", "Budget"),
          biddingStrategy: str(f, "Bidding Strategy", "Bidding"),
          pulledAt: lastSyncedAt,
          googleAdsAdGroups: linkedAdGroups,
          adGroupsCount: linkedAdGroups.length,
        };
      }).filter(
        (campaign) =>
          Boolean(campaign.campaignId && campaign.campaignName) &&
          campaign.campaignStatus !== "REMOVED",
      );

      return { campaigns, data: campaigns };
    });

    return Response.json(payload);
  } catch (error) {
    console.error("[airtable/google-ads-campaigns] Failed to fetch campaigns:", error);
    return Response.json({ error: "Could not load Google Ads campaigns data" }, { status: 500 });
  }
}
