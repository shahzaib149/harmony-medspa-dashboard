import {
  fetchCampaignPerformance,
  fetchSearchTerms,
  fetchAdPerformance,
  fetchKeywords,
} from "@/lib/google/ads-client";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";

function dateRange(days: number) {
  const to = new Date().toISOString().split("T")[0];
  const from = new Date(Date.now() - days * 86_400_000).toISOString().split("T")[0];
  return { from, to };
}

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<{ data: T; error?: string }> {
  try {
    return { data: await fn() };
  } catch (err) {
    return { data: fallback, error: String(err) };
  }
}

export async function POST(request: Request) {
  try { await requireRole(request, "viewer"); } catch (error) { return authErrorResponse(error); }
  const { days = 30 } = await request.json().catch(() => ({}));
  const { from, to } = dateRange(Number(days));

  const missing = [
    !process.env.GOOGLE_ADS_CLIENT_ID && "GOOGLE_ADS_CLIENT_ID",
    !process.env.GOOGLE_ADS_CLIENT_SECRET && "GOOGLE_ADS_CLIENT_SECRET",
    !process.env.GOOGLE_ADS_DEVELOPER_TOKEN && "GOOGLE_ADS_DEVELOPER_TOKEN",
    !process.env.GOOGLE_ADS_REFRESH_TOKEN && "GOOGLE_ADS_REFRESH_TOKEN",
    !process.env.GOOGLE_ADS_CUSTOMER_ID && "GOOGLE_ADS_CUSTOMER_ID",
  ].filter(Boolean);

  if (missing.length > 0) {
    return Response.json({ error: `Missing credentials: ${missing.join(", ")}` }, { status: 503 });
  }

  // Run all queries independently — partial failures don't block campaign data
  const [campaigns, searchTerms, adPerformance, keywords] = await Promise.all([
    safe(() => fetchCampaignPerformance(from, to), []),
    safe(() => fetchSearchTerms(from, to), []),
    safe(() => fetchAdPerformance(from, to), []),
    safe(() => fetchKeywords(from, to), []),
  ]);

  // Surface the first critical error (from campaigns) if it exists
  if (campaigns.error && campaigns.data.length === 0) {
    console.error("Google Ads campaigns error:", campaigns.error);
    return Response.json({ error: campaigns.error }, { status: 500 });
  }

  // Log non-critical errors without failing the response
  if (searchTerms.error) console.warn("Search terms error:", searchTerms.error);
  if (adPerformance.error) console.warn("Ad performance error:", adPerformance.error);
  if (keywords.error) console.warn("Keywords error:", keywords.error);

  return Response.json({
    source: "live",
    dateRange: { from, to },
    campaigns: campaigns.data,
    searchTerms: searchTerms.data,
    adPerformance: adPerformance.data,
    keywords: keywords.data,
    warnings: {
      searchTerms: searchTerms.error,
      adPerformance: adPerformance.error,
      keywords: keywords.error,
    },
  });
}
