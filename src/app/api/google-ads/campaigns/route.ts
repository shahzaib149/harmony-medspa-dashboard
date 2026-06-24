import {
  fetchCampaignPerformance,
  fetchSearchTerms,
  fetchAdPerformance,
  fetchKeywords,
  fetchHourlyPerformance,
} from "@/lib/google/ads-client";
import { mockGoogleAdsSnapshots } from "@/lib/mock-data";

function dateRange(days: number) {
  const to = new Date().toISOString().split("T")[0];
  const from = new Date(Date.now() - days * 86_400_000).toISOString().split("T")[0];
  return { from, to };
}

export async function POST(request: Request) {
  const { days = 30 } = await request.json().catch(() => ({}));
  const { from, to } = dateRange(Number(days));

  const hasCredentials =
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
    process.env.GOOGLE_ADS_REFRESH_TOKEN &&
    process.env.GOOGLE_ADS_CUSTOMER_ID;

  if (!hasCredentials) {
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
      fetchCampaignPerformance(from, to),
      fetchSearchTerms(from, to),
      fetchAdPerformance(from, to),
      fetchKeywords(from, to),
      fetchHourlyPerformance(from, to),
    ]);
    return Response.json({ source: "live", campaigns, searchTerms, adPerformance, keywords, hourly });
  } catch (err) {
    console.error("/api/google-ads/campaigns error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
