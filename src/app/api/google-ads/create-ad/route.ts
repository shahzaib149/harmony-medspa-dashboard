import { createResponsiveSearchAd } from "@/lib/google/ads-client";

export async function POST(request: Request) {
  if (!process.env.GOOGLE_ADS_DEVELOPER_TOKEN) {
    return Response.json({ error: "Google Ads not connected" }, { status: 503 });
  }

  const { adGroupId, headlines, descriptions, finalUrl } = await request.json();

  if (!adGroupId || !headlines?.length || !descriptions?.length || !finalUrl) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const badH = (headlines as string[]).filter((h) => h.length > 30);
  const badD = (descriptions as string[]).filter((d) => d.length > 90);
  if (badH.length) return Response.json({ error: `Headlines must be ≤30 chars: ${badH.join(", ")}` }, { status: 400 });
  if (badD.length) return Response.json({ error: "Descriptions must be ≤90 chars" }, { status: 400 });

  try {
    await createResponsiveSearchAd({ adGroupId, headlines, descriptions, finalUrl });
    return Response.json({ success: true, message: "Ad created in PAUSED state. Review in Google Ads before enabling." });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
