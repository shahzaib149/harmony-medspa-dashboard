import { setCampaignStatus } from "@/lib/google/ads-client";

export async function POST(request: Request) {
  if (!process.env.GOOGLE_ADS_DEVELOPER_TOKEN) {
    return Response.json({ error: "Google Ads not connected" }, { status: 503 });
  }

  const { campaignId, status } = await request.json();

  if (!campaignId || !["ENABLED", "PAUSED"].includes(status)) {
    return Response.json({ error: "campaignId and status (ENABLED|PAUSED) required" }, { status: 400 });
  }

  try {
    await setCampaignStatus(campaignId, status);
    return Response.json({ success: true, message: `Campaign ${status.toLowerCase()}` });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
