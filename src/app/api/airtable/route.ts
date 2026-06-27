import { fetchAllRecords, g, num, str } from "@/lib/airtable/client";

const TABLE_NAMES = {
  campaigns: "Google Ads Campaign Analytics",
  "ad-groups": "Google Ads Ad Group Analytics",
  creatives: "Google Ads Ad Creative Analytics",
  keywords: "Google Ads Keyword Performance",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get("table") as keyof typeof TABLE_NAMES | null;

  if (!table || !TABLE_NAMES[table]) {
    return Response.json({ error: "Invalid table. Use: campaigns, ad-groups, creatives, keywords" }, { status: 400 });
  }

  try {
    const raw = await fetchAllRecords(TABLE_NAMES[table]);

    if (table === "campaigns") {
      const data = raw.map((r) => ({
        id: r.id,
        accountName: str(r.fields, "accountName", "Account Name", "Account"),
        campaignId: str(r.fields, "campaignId", "Campaign ID", "Campaign Id"),
        campaignName: str(r.fields, "campaignName", "Campaign Name", "Campaign"),
        campaignStatus: str(r.fields, "campaignStatus", "Campaign Status", "Status"),
        channelType: str(r.fields, "channelType", "Channel Type", "Channel", "Type"),
        cost: num(r.fields, "cost", "Cost", "Spend"),
        clicks: num(r.fields, "clicks", "Clicks"),
        impressions: num(r.fields, "impressions", "Impressions"),
        ctrPct: num(r.fields, "ctrPct", "CTR", "Ctr", "ctr"),
        conversions: num(r.fields, "conversions", "Conversions"),
        conversionValue: num(r.fields, "conversionValue", "Conversion Value", "Conv Value", "Revenue"),
        roas: num(r.fields, "roas", "ROAS", "Roas"),
        optimizationScore: num(r.fields, "optimizationScore", "Optimization Score", "Opt Score"),
        impressionShare: num(r.fields, "impressionShare", "Impression Share", "IS", "Search IS"),
        impressionShareLostBudget: num(r.fields, "impressionShareLostBudget", "IS Lost Budget", "Budget Lost IS"),
        impressionShareLostRank: num(r.fields, "impressionShareLostRank", "IS Lost Rank", "Rank Lost IS"),
        pulledAt: str(r.fields, "pulledAt", "Pulled At", "Last Updated", "Updated At", "Synced At"),
        _raw: r.fields,
      }));
      return Response.json({ table, count: data.length, data });
    }

    if (table === "ad-groups") {
      const data = raw.map((r) => ({
        id: r.id,
        accountName: str(r.fields, "accountName", "Account Name", "Account"),
        campaignId: str(r.fields, "campaignId", "Campaign ID", "Campaign Id"),
        campaignName: str(r.fields, "campaignName", "Campaign Name", "Campaign"),
        adGroupId: str(r.fields, "adGroupId", "Ad Group ID", "Ad Group Id"),
        adGroupName: str(r.fields, "adGroupName", "Ad Group Name", "Ad Group"),
        adGroupStatus: str(r.fields, "adGroupStatus", "Ad Group Status", "Status"),
        cost: num(r.fields, "cost", "Cost", "Spend"),
        clicks: num(r.fields, "clicks", "Clicks"),
        impressions: num(r.fields, "impressions", "Impressions"),
        ctrPct: num(r.fields, "ctrPct", "CTR", "Ctr", "ctr"),
        conversions: num(r.fields, "conversions", "Conversions"),
        conversionValue: num(r.fields, "conversionValue", "Conversion Value", "Conv Value"),
        roas: num(r.fields, "roas", "ROAS", "Roas"),
        _raw: r.fields,
      }));
      return Response.json({ table, count: data.length, data });
    }

    if (table === "creatives") {
      const data = raw.map((r) => ({
        id: r.id,
        adId: str(r.fields, "adId", "Ad ID", "Ad Id"),
        adName: str(r.fields, "adName", "Ad Name", "Ad", "Name"),
        adType: str(r.fields, "adType", "Ad Type", "Type"),
        campaignId: str(r.fields, "campaignId", "Campaign ID", "Campaign Id"),
        campaignName: str(r.fields, "campaignName", "Campaign Name", "Campaign"),
        adGroupName: str(r.fields, "adGroupName", "Ad Group Name", "Ad Group"),
        cost: num(r.fields, "cost", "Cost", "Spend"),
        clicks: num(r.fields, "clicks", "Clicks"),
        impressions: num(r.fields, "impressions", "Impressions"),
        ctrPct: num(r.fields, "ctrPct", "CTR", "Ctr", "ctr"),
        conversions: num(r.fields, "conversions", "Conversions"),
        conversionValue: num(r.fields, "conversionValue", "Conversion Value", "Conv Value"),
        roas: num(r.fields, "roas", "ROAS", "Roas"),
        date: str(r.fields, "date", "Date", "Day"),
        creativeTagSuggestions: (() => {
          const v = r.fields["creativeTagSuggestions"] ?? r.fields["Creative Tag Suggestions"] ?? r.fields["Tags"] ?? r.fields["Creative Tags"] ?? "";
          if (Array.isArray(v)) return v.map(x => (typeof x === "object" && x !== null ? (x as Record<string,unknown>).name ?? JSON.stringify(x) : String(x))).join(", ");
          if (typeof v === "object" && v !== null) return JSON.stringify(v);
          return String(v);
        })(),
        _raw: r.fields,
      }));
      return Response.json({ table, count: data.length, data });
    }

    if (table === "keywords") {
      const data = raw.map((r) => ({
        id: r.id,
        keywordText: str(r.fields, "keywordText", "Keyword Text", "Keyword", "keyword"),
        matchType: str(r.fields, "matchType", "Match Type", "Match"),
        campaignId: str(r.fields, "campaignId", "Campaign ID", "Campaign Id"),
        campaignName: str(r.fields, "campaignName", "Campaign Name", "Campaign"),
        adGroupName: str(r.fields, "adGroupName", "Ad Group Name", "Ad Group"),
        cost: num(r.fields, "cost", "Cost", "Spend"),
        clicks: num(r.fields, "clicks", "Clicks"),
        impressions: num(r.fields, "impressions", "Impressions"),
        ctrPct: num(r.fields, "ctrPct", "CTR", "Ctr", "ctr"),
        conversions: num(r.fields, "conversions", "Conversions"),
        conversionValue: num(r.fields, "conversionValue", "Conversion Value", "Conv Value"),
        roas: num(r.fields, "roas", "ROAS", "Roas"),
        _raw: r.fields,
      }));
      return Response.json({ table, count: data.length, data });
    }

    // Return first record's field names to aid debugging
    const sample = raw[0]?.fields ?? {};
    return Response.json({ table, fieldNames: Object.keys(sample), sample });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
