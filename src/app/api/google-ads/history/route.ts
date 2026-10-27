import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { num, str } from "@/lib/airtable/client";
import { fetchAdsDaily } from "@/lib/google/ads-airtable";
import { adsReportingRange } from "@/lib/google/ads-range";
import type { AdsDailyTable } from "@/lib/google/ads-tables";

const TABLES: Record<string, AdsDailyTable> = {
  campaign: "campaign",
  "ad-group": "adGroup",
  ad: "ad",
  keyword: "keyword",
};

const ID_FIELD: Record<AdsDailyTable, string> = {
  campaign: "Campaign ID",
  adGroup: "Ad Group ID",
  ad: "Ad ID",
  keyword: "Keyword ID",
  searchTerm: "Search Term",
  conversionAction: "Conversion Action ID",
};

/** Daily metrics for one entity, from the de-duplicated Airtable daily tables. */
export async function GET(request: Request) {
  try { await requireRole(request, "viewer"); } catch (error) { return authErrorResponse(error); }
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("entity") ?? "";
  const id = searchParams.get("id")?.trim() || "";
  // Ad and keyword IDs are only unique within an ad group; narrow by it when known.
  const adGroupId = searchParams.get("adGroupId")?.trim() || "";
  const table = TABLES[kind];
  if (!table || !id) return Response.json({ error: "A valid entity and ID are required." }, { status: 400 });

  try {
    const range = adsReportingRange(searchParams);
    const rows = await fetchAdsDaily(table, range);
    const daily = new Map<string, { date: string; cost: number; impressions: number; clicks: number; conversions: number; conversionValue: number }>();
    for (const row of rows) {
      if (str(row.fields, ID_FIELD[table]) !== id) continue;
      if (adGroupId && (table === "ad" || table === "keyword") && str(row.fields, "Ad Group ID") !== adGroupId) continue;
      const date = str(row.fields, "Date").slice(0, 10);
      const current = daily.get(date) ?? { date, cost: 0, impressions: 0, clicks: 0, conversions: 0, conversionValue: 0 };
      current.cost += num(row.fields, "Cost");
      current.impressions += num(row.fields, "Impressions");
      current.clicks += num(row.fields, "Clicks");
      current.conversions += num(row.fields, "Conversions");
      current.conversionValue += num(row.fields, "Conversion Value");
      daily.set(date, current);
    }
    const data = [...daily.values()].sort((a, b) => a.date.localeCompare(b.date)).map((item) => ({
      ...item,
      conversionValueAvailable: true,
      ctrPct: item.impressions ? item.clicks / item.impressions * 100 : 0,
      avgCpc: item.clicks ? item.cost / item.clicks : 0,
      cpa: item.conversions ? item.cost / item.conversions : 0,
      roas: item.cost ? item.conversionValue / item.cost : null,
    }));
    return Response.json({ source: "airtable-daily", entity: kind, id, count: data.length, data });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "History could not be loaded." }, { status: 500 });
  }
}
