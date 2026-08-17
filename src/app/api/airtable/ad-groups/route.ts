import { fetchAllRecords, str } from "@/lib/airtable/client";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { withCache, bustCache } from "@/lib/server-cache";

export const dynamic = "force-dynamic";

const AD_GROUPS_TABLE = "Google Ads Ad Groups";
const CAMPAIGNS_TABLE = "Google Ads Campaigns";
const TTL_SECONDS = 60;

export async function GET(request: Request) {
  try {
    await requireRole(request, "viewer");
  } catch (error) {
    return authErrorResponse(error);
  }

  const { searchParams } = new URL(request.url);
  const targetCampaignId = searchParams.get("campaignId")?.trim();
  const forceRefresh = searchParams.get("refresh") === "1";
  const cacheKey = `airtable:ad-groups:${targetCampaignId || "all"}`;
  if (forceRefresh) bustCache(cacheKey);

  try {
    const payload = await withCache(cacheKey, TTL_SECONDS, async () => {
      const [rawAdGroups, rawCampaigns] = await Promise.all([
        fetchAllRecords(AD_GROUPS_TABLE, new URLSearchParams(), {
          cache: forceRefresh ? "no-store" : "cached",
          forceRefresh,
        }),
        fetchAllRecords(CAMPAIGNS_TABLE, new URLSearchParams(), {
          cache: forceRefresh ? "no-store" : "cached",
          forceRefresh,
        }),
      ]);

      // Build lookup map for linked campaigns: Airtable Record ID -> Campaign Details
      const campaignMap = new Map<
        string,
        { campaignId: string; campaignName: string; campaignResourceName: string }
      >();

      for (const record of rawCampaigns) {
        const f = record.fields;
        campaignMap.set(record.id, {
          campaignId: str(f, "Campaign ID", "campaignId") || record.id,
          campaignName: str(f, "Campaign Name", "campaignName") || "Unresolved campaign",
          campaignResourceName: str(f, "Campaign Resource Name", "campaignResourceName"),
        });
      }

      const adGroups = rawAdGroups
        .map((record) => {
          const f = record.fields;
          const linkedCampaignIds = Array.isArray(f["Campaign"]) ? f["Campaign"] : [];
          const firstLinkedId = linkedCampaignIds[0] ? String(linkedCampaignIds[0]) : "";
          const parentCampaign = campaignMap.get(firstLinkedId);

          const adGroupName = str(f, "Ad Group Name", "adGroupName") || `Ad Group ${record.id}`;
          const adGroupId = str(f, "Ad Group ID", "adGroupId") || record.id;
          const adGroupResourceName = str(f, "Ad Group Resource Name", "adGroupResourceName");
          const status = (str(f, "Status", "status") || "ENABLED").toUpperCase();
          const lastSyncedAt = str(f, "Last Synced At", "lastSyncedAt", "pulledAt") || record.createdTime;

          return {
            id: record.id,
            adGroupName,
            adGroupId,
            adGroupResourceName,
            resourceName: adGroupResourceName,
            status,
            adGroupStatus: status,
            lastSyncedAt,
            pulledAt: lastSyncedAt,
            campaignId: parentCampaign?.campaignId || "",
            campaignName: parentCampaign?.campaignName || "Unresolved campaign",
            campaignResourceName: parentCampaign?.campaignResourceName || "",
          };
        })
        .filter((group) => {
          if (!targetCampaignId) return true;
          return (
            group.campaignId === targetCampaignId ||
            group.campaignName.toLowerCase() === targetCampaignId.toLowerCase()
          );
        });

      return { adGroups, data: adGroups };
    });

    return Response.json(payload);
  } catch (error) {
    console.error("[airtable/ad-groups] Failed to fetch ad groups:", error);
    return Response.json({ error: "Could not load Google Ads ad groups data" }, { status: 500 });
  }
}
