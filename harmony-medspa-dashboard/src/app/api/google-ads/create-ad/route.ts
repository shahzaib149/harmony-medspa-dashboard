import { createResponsiveSearchAd } from "@/lib/google/ads-client";

export async function POST(request: Request) {
  const { adGroupId, headlines, descriptions, finalUrl } = await request.json();

  if (!process.env.GOOGLE_ADS_DEVELOPER_TOKEN) {
    return Response.json({ error: "Google Ads not connected" }, { status: 503 });
  }

  if (!adGroupId || !headlines?.length || !descriptions?.length || !finalUrl) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Validate character limits
  const invalidHeadlines = headlines.filter((h: string) => h.length > 30);
  const invalidDescriptions = descriptions.filter((d: string) => d.length > 90);

  if (invalidHeadlines.length > 0) {
    return Response.json({
      error: `Headlines must be 30 characters or fewer. Offending: ${invalidHeadlines.join(", ")}`,
    }, { status: 400 });
  }

  if (invalidDescriptions.length > 0) {
    return Response.json({
      error: `Descriptions must be 90 characters or fewer.`,
    }, { status: 400 });
  }

  try {
    await createResponsiveSearchAd({ adGroupId, headlines, descriptions, finalUrl });
    return Response.json({
      success: true,
      message: "Ad created in PAUSED state. Review in Google Ads before enabling.",
    });
  } catch (err) {
    console.error("/api/google-ads/create-ad error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
