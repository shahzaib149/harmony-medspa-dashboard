import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServiceClient();

    const mockData = [
      { campaign_id: "c1", campaign_name: "Botox — Local Search", spend: 285, impressions: 4200, clicks: 142, ctr: 3.38, conversions: 8, cpl: 35.63 },
      { campaign_id: "c2", campaign_name: "HydraFacial — Brand Awareness", spend: 148, impressions: 11500, clicks: 89, ctr: 0.77, conversions: 1, cpl: 148.00 },
      { campaign_id: "c3", campaign_name: "Filler — High Intent", spend: 195, impressions: 2800, clicks: 73, ctr: 2.61, conversions: 5, cpl: 39.00 },
      { campaign_id: "c4", campaign_name: "Laser Hair — Promo", spend: 112, impressions: 6300, clicks: 44, ctr: 0.70, conversions: 0, cpl: 0 },
      { campaign_id: "c5", campaign_name: "Microneedling — Retargeting", spend: 78, impressions: 3100, clicks: 61, ctr: 1.97, conversions: 4, cpl: 19.50 },
    ].map(c => ({
      ...c,
      date: new Date().toISOString().split("T")[0],
      synced_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("google_ads_snapshots")
      .upsert(mockData, { onConflict: "campaign_id,date" });

    if (error) throw error;

    return Response.json({
      success: true,
      synced: mockData.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("/api/google-ads/sync error:", err);
    return Response.json({ error: "Sync failed" }, { status: 500 });
  }
}
