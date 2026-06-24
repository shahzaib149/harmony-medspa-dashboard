import { fetchGBPInsights } from "@/lib/google/business-client";
import { createServiceClient } from "@/lib/supabase/server";

const MOCK_INSIGHTS = {
  QUERIES_DIRECT: 142,
  QUERIES_INDIRECT: 389,
  VIEWS_MAPS: 284,
  VIEWS_SEARCH: 531,
  ACTIONS_PHONE: 67,
  ACTIONS_DRIVING_DIRECTIONS: 43,
  ACTIONS_WEBSITE: 112,
  PHOTOS_VIEWS_MERCHANT: 1840,
};

async function getRefreshToken(): Promise<string | null> {
  const supabase = await createServiceClient();
  const { data } = await supabase.from("settings").select("value").eq("key", "google_tokens").single();
  return (data?.value as { refresh_token?: string })?.refresh_token ?? null;
}

export async function POST(request: Request) {
  const { days = 30 } = await request.json().catch(() => ({}));
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    return Response.json({ source: "mock", insights: MOCK_INSIGHTS });
  }

  const endTime = new Date().toISOString();
  const startTime = new Date(Date.now() - Number(days) * 86_400_000).toISOString();

  try {
    const data = await fetchGBPInsights(
      refreshToken,
      process.env.GOOGLE_BUSINESS_ACCOUNT_ID!,
      process.env.GOOGLE_BUSINESS_LOCATION_ID!,
      startTime,
      endTime
    );
    return Response.json({ source: "live", insights: data });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
