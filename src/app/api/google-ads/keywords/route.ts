import { addKeyword, addNegativeKeyword } from "@/lib/google/ads-client";

export async function POST(request: Request) {
  if (!process.env.GOOGLE_ADS_DEVELOPER_TOKEN) {
    return Response.json({ error: "Google Ads not connected" }, { status: 503 });
  }

  const { action, adGroupId, campaignId, keyword, matchType } = await request.json();

  try {
    if (action === "add_keyword") {
      await addKeyword(adGroupId, keyword, matchType ?? "BROAD");
      return Response.json({ success: true, message: `Added "${keyword}" as ${matchType ?? "BROAD"} keyword` });
    }
    if (action === "add_negative") {
      await addNegativeKeyword(campaignId, keyword);
      return Response.json({ success: true, message: `Added "${keyword}" as negative keyword` });
    }
    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
