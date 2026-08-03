import { fetchAllRecords, str } from "@/lib/airtable/client";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";

export const dynamic = "force-dynamic";

const CAMPAIGNS_TABLE = "Google Ads Campaigns";

export async function GET(request: Request) {
  try {
    await requireRole(request, "viewer");
  } catch (error) {
    return authErrorResponse(error);
  }

  try {
    const rawRecords = await fetchAllRecords(CAMPAIGNS_TABLE, new URLSearchParams(), {
      cache: "no-store",
    });

    const campaigns = rawRecords.map((record) => {
      const f = record.fields;
      const campaignName = str(f, "Campaign Name", "campaignName") || `Campaign ${record.id}`;
      const campaignId = str(f, "Campaign ID", "campaignId") || record.id;
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
        pulledAt: lastSyncedAt,
        googleAdsAdGroups: linkedAdGroups,
        adGroupsCount: linkedAdGroups.length,
      };
    });

    return Response.json({ campaigns, data: campaigns });
  } catch (error) {
    console.error("[airtable/campaigns] Failed to fetch campaigns:", error);
    return Response.json({ error: "Could not load Google Ads campaigns data" }, { status: 500 });
  }
}
