import { fetchGBPInsights } from "@/lib/google/business-client";

export async function POST(request: Request) {
  const { days = 30 } = await request.json().catch(() => ({}));

  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
  const accountId = process.env.GOOGLE_BUSINESS_ACCOUNT_ID;
  const locationId = process.env.GOOGLE_BUSINESS_LOCATION_ID;

  if (!refreshToken || !accountId || !locationId) {
    return Response.json(
      { error: "Missing Google credentials in environment variables" },
      { status: 503 }
    );
  }

  const endTime = new Date().toISOString();
  const startTime = new Date(Date.now() - Number(days) * 86_400_000).toISOString();

  try {
    const data = await fetchGBPInsights(refreshToken, accountId, locationId, startTime, endTime);
    return Response.json({ source: "live", insights: data });
  } catch (err) {
    console.error("/api/google-business/insights error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
