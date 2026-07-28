import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { fetchAllRecords, num, str } from "@/lib/airtable/client";

const TABLES = {
  campaign: "Google Ads Campaign Analytics",
  "ad-group": "Google Ads Ad Group Analytics",
  ad: "Google Ads Ad Creative Analytics",
  keyword: "Google Ads Keyword Performance",
} as const;

type EntityKind = keyof typeof TABLES;

function rowIdentity(kind: EntityKind, fields: Record<string, unknown>) {
  if (kind === "campaign") return str(fields, "Campaign ID", "campaignId", "Campaign Id");
  if (kind === "ad-group") return str(fields, "Ad Group ID", "adGroupId", "Ad Group Id");
  if (kind === "ad") return str(fields, "Ad ID", "adId", "Ad Id");
  return str(fields, "Keyword ID", "Criterion ID", "criterionId", "Keyword Criterion ID");
}

function hasConversionValue(fields: Record<string, unknown>) {
  return ["Conversion Value", "conversionValue", "Conv Value", "Revenue", "All Conversion Value"]
    .some((key) => fields[key] !== undefined && fields[key] !== null && fields[key] !== "");
}

export async function GET(request: Request) {
  try { await requireRole(request, "viewer"); } catch (error) { return authErrorResponse(error); }
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("entity") as EntityKind | null;
  const id = searchParams.get("id")?.trim() || "";
  const days = Math.min(365, Math.max(1, Number(searchParams.get("days") || 30)));
  if (!kind || !TABLES[kind] || !id) return Response.json({ error: "A valid entity and ID are required." }, { status: 400 });

  try {
    const cutoff = new Date(Date.now() - days * 86_400_000);
    const rows = await fetchAllRecords(TABLES[kind], new URLSearchParams(), { cache: "no-store" });
    const daily = new Map<string, { date: string; cost: number; impressions: number; clicks: number; conversions: number; conversionValue: number; conversionValueAvailable: boolean }>();
    for (const row of rows) {
      if (rowIdentity(kind, row.fields) !== id) continue;
      const date = str(row.fields, "Date", "date", "Day") || row.createdTime.slice(0, 10);
      if (new Date(date) < cutoff) continue;
      const current = daily.get(date) ?? { date, cost: 0, impressions: 0, clicks: 0, conversions: 0, conversionValue: 0, conversionValueAvailable: false };
      current.cost += num(row.fields, "Cost", "cost", "Spend");
      current.impressions += num(row.fields, "Impressions", "impressions");
      current.clicks += num(row.fields, "Clicks", "clicks");
      current.conversions += num(row.fields, "Conversions", "conversions");
      current.conversionValue += num(row.fields, "Conversion Value", "conversionValue", "Conv Value", "Revenue", "All Conversion Value");
      current.conversionValueAvailable ||= hasConversionValue(row.fields);
      daily.set(date, current);
    }
    const data = [...daily.values()].sort((a, b) => a.date.localeCompare(b.date)).map((item) => ({
      ...item,
      ctrPct: item.impressions ? item.clicks / item.impressions * 100 : 0,
      avgCpc: item.clicks ? item.cost / item.clicks : 0,
      cpa: item.conversions ? item.cost / item.conversions : 0,
      roas: item.conversionValueAvailable && item.cost ? item.conversionValue / item.cost : null,
    }));
    return Response.json({ source: "airtable-performance-snapshots", entity: kind, id, count: data.length, data });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "History could not be loaded." }, { status: 500 });
  }
}
