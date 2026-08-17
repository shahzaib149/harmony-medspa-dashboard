import { isAirtableConfigured } from "@/lib/airtable/config";
import { campaignData, summarizeCampaigns } from "@/lib/campaigns/data";
import { CAMPAIGNS } from "@/lib/campaigns/registry";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { withCache, bustCache } from "@/lib/server-cache";

export const dynamic = "force-dynamic";
const CAMPAIGNS_TTL = 60;

export async function GET(request: Request) {
  try {
    await requireRole(request, "viewer");
  } catch (error) {
    return authErrorResponse(error);
  }

  if (!isAirtableConfigured()) {
    return Response.json({
      campaigns: CAMPAIGNS.map((item) => ({
        ...item,
        totalLeads: 0,
        activeLeads: 0,
        completedLeads: 0,
        messagesSent: 0,
        lastActivity: null,
        metrics: {}
      })),
      configured: false
    });
  }

  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "1";
  const cacheKey = "airtable:campaigns:summary";
  if (forceRefresh) bustCache(cacheKey);

  try {
    const campaigns = await withCache(cacheKey, CAMPAIGNS_TTL, async () => {
      return summarizeCampaigns(await campaignData());
    });
    return Response.json({ campaigns });
  } catch (error) {
    return Response.json({ error: "Could not load campaign data" }, { status: 500 });
  }
}

