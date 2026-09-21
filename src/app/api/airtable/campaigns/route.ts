import { isAirtableConfigured } from "@/lib/airtable/config";
import { campaignData, summarizeCampaigns } from "@/lib/campaigns/data";
import { CAMPAIGNS } from "@/lib/campaigns/registry";
import { cachedCampaignSummary } from "@/lib/reactivation/server";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { withCache, bustCache } from "@/lib/server-cache";

export const dynamic = "force-dynamic";
const CAMPAIGNS_TTL = 60;
const CAMPAIGNS_CACHE_KEY = "airtable:campaigns:summary";

function emptyCampaigns() {
  return CAMPAIGNS.map((item) => ({
    ...item,
    totalLeads: 0,
    activeLeads: 0,
    completedLeads: 0,
    messagesSent: 0,
    lastActivity: null,
    metrics: {},
  }));
}

export async function GET(request: Request) {
  try {
    await requireRole(request, "viewer");
  } catch (error) {
    return authErrorResponse(error);
  }

  if (!isAirtableConfigured()) {
    return Response.json({
      campaigns: emptyCampaigns(),
      reactivation: null,
      configured: false,
    });
  }

  const forceRefresh = new URL(request.url).searchParams.get("refresh") === "1";
  if (forceRefresh) bustCache(CAMPAIGNS_CACHE_KEY);

  try {
    const [campaigns, reactivation] = await Promise.all([
      withCache(CAMPAIGNS_CACHE_KEY, CAMPAIGNS_TTL, async () =>
        summarizeCampaigns(await campaignData()),
      ),
      cachedCampaignSummary(forceRefresh),
    ]);
    return Response.json(
      { campaigns, reactivation },
      { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" } },
    );
  } catch {
    return Response.json({ error: "Could not load campaign data" }, { status: 500 });
  }
}
