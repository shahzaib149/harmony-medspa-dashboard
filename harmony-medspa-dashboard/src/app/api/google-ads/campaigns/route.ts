import { fetchCampaignPerformance, fetchSearchTerms, fetchAdPerformance, fetchKeywords, fetchHourlyPerformance } from "@/lib/google/ads-client";
import { mockGoogleAdsSnapshots } from "@/lib/mock-data";

function getDateRange(days: number) {
  const to = new Date();
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

export async function POST(request: Request) {
  const { days = 30 } = await request.json().catch(() => ({}));
  const dateRange = getDateRange(Number(days));

  const hasCredentials =
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
    process.env.GOOGLE_ADS_REFRESH_TOKEN &&
    process.env.GOOGLE_ADS_CUSTOMER_ID;

  if (!hasCredentials) {
    // Return mock data when credentials are not yet configured
    return Response.json({
      source: "mock",
      campaigns: mockGoogleAdsSnapshots,
      searchTerms: [],
      adPerformance: [],
      keywords: [],
      hourly: [],
    });
  }

  try {
    const [campaigns, searchTerms, adPerformance, keywords, hourly] = await Promise.all([
      fetchCampaignPerformance(dateRange),
      fetchSearchTerms(dateRange),
      fetchAdPerformance(dateRange),
      fetchKeywords(dateRange),
      fetchHourlyPerformance(dateRange),
    ]);

    return Response.json({
      source: "live",
      campaigns,
      searchTerms,
      adPerformance,
      keywords,
      hourly,
    });
  } catch (err) {
    console.error("/api/google-ads/campaigns error:", err);
    return Response.json(
      { error: "Failed to fetch Google Ads data", details: String(err) },
      { status: 500 }
    );
  }
}
