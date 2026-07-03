import { fetchAllRecords, num, str } from "@/lib/airtable/client";

const TABLE_NAMES = {
  campaigns: "Google Ads Campaign Analytics",
  "ad-groups": "Google Ads Ad Group Analytics",
  creatives: "Google Ads Ad Creative Analytics",
  keywords: "Google Ads Keyword Performance",
  "ad-preview": "tblsokwqKQuj3rFSB",   // "Google Ad Preview" table — ad copy (headlines/descriptions)
};

/**
 * Pick the best date to use for range-filtering a record.
 * Tries performance/segment date fields first (what Make.com writes from Google Ads
 * segments.date), then sync-timestamp fields, then Airtable's createdTime.
 */
function pickFilterDate(fields: Record<string, unknown>, createdTime: string): string {
  return (
    str(fields, "Date", "date", "Day", "day", "Segment Date", "Reporting Date", "Report Date", "Period") ||
    str(fields, "pulledAt", "Pulled At", "Last Updated", "Updated At", "Synced At") ||
    createdTime ||
    ""
  );
}

type Summable = {
  id: string; _ts: string; _key: string;
  cost: number; clicks: number; impressions: number;
  conversions: number; conversionValue: number;
  _roasWtd: number; // roas * cost, for weighted average
  [key: string]: unknown;
};

/** Group records by _key, sum numeric metrics, keep most-recent status fields */
function groupAndSum(items: Summable[]): Summable[] {
  const map = new Map<string, Summable>();
  for (const item of items) {
    const key = item._key || item.id;
    const ex = map.get(key);
    if (!ex) {
      map.set(key, { ...item });
    } else {
      ex.cost += item.cost;
      ex.clicks += item.clicks;
      ex.impressions += item.impressions;
      ex.conversions += item.conversions;
      ex.conversionValue += item.conversionValue;
      ex._roasWtd += item._roasWtd;
      if (item._ts > ex._ts) {
        ex._ts = item._ts;
        // copy status/name fields from the most-recent record
        ex.pulledAt = item.pulledAt;
        ex.campaignStatus = item.campaignStatus;
        ex.adGroupStatus = item.adGroupStatus;
        ex.channelType = item.channelType;
        ex.campaignName = item.campaignName;
        ex.adGroupName = item.adGroupName;
        ex.accountName = item.accountName;
      }
    }
  }
  return Array.from(map.values()).map(r => ({
    ...r,
    ctrPct: r.impressions > 0 ? (r.clicks / r.impressions) * 100 : 0,
    roas: r.cost > 0
      ? r.conversionValue > 0
        ? r.conversionValue / r.cost
        : r._roasWtd / r.cost   // spend-weighted average of daily ROAS values
      : 0,
  }));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get("table") as keyof typeof TABLE_NAMES | null;
  const days = Number(searchParams.get("days") ?? 30);
  const cutoff = new Date(Date.now() - days * 86_400_000);

  if (!table || !TABLE_NAMES[table]) {
    return Response.json({ error: "Invalid table. Use: campaigns, ad-groups, creatives, keywords" }, { status: 400 });
  }

  try {
    const raw = await fetchAllRecords(TABLE_NAMES[table]);

    if (table === "campaigns") {
      const mapped: Summable[] = raw.map((r) => {
        const _ts = pickFilterDate(r.fields, r.createdTime);
        const cost = num(r.fields, "cost", "Cost", "Spend");
        const roas = num(r.fields, "roas", "ROAS", "Roas", "Return on Ad Spend");
        return {
          id: r.id,
          _ts,
          _key: str(r.fields, "campaignId", "Campaign ID", "Campaign Id") ||
                str(r.fields, "campaignName", "Campaign Name", "Campaign") ||
                r.id,
          accountName: str(r.fields, "accountName", "Account Name", "Account"),
          campaignId: str(r.fields, "campaignId", "Campaign ID", "Campaign Id"),
          campaignName: str(r.fields, "campaignName", "Campaign Name", "Campaign"),
          campaignStatus: str(r.fields, "campaignStatus", "Campaign Status", "Status"),
          channelType: str(r.fields, "channelType", "Channel Type", "Channel", "Type"),
          cost,
          clicks: num(r.fields, "clicks", "Clicks"),
          impressions: num(r.fields, "impressions", "Impressions"),
          ctrPct: num(r.fields, "ctrPct", "CTR", "Ctr", "ctr"),
          conversions: num(r.fields, "conversions", "Conversions"),
          conversionValue: num(r.fields, "conversionValue", "Conversion Value", "Conv Value", "Revenue", "All Conversion Value", "All Conv. Value"),
          roas,
          _roasWtd: roas * cost,
          optimizationScore: num(r.fields, "optimizationScore", "Optimization Score", "Opt Score"),
          impressionShare: num(r.fields, "impressionShare", "Impression Share", "IS", "Search IS", "Search Impression Share"),
          impressionShareLostBudget: num(r.fields, "impressionShareLostBudget", "IS Lost Budget", "Budget Lost IS", "Search Lost IS (Budget)"),
          impressionShareLostRank: num(r.fields, "impressionShareLostRank", "IS Lost Rank", "Rank Lost IS", "Search Lost IS (Rank)"),
          pulledAt: _ts,
          _raw: r.fields,
        };
      });

      // Filter to selected date window (skip if record has no timestamp)
      const filtered = mapped.filter(r => !r._ts || new Date(r._ts) >= cutoff);

      // Aggregate daily rows per campaign
      const data = groupAndSum(filtered);

      return Response.json({ table, count: data.length, totalRecords: raw.length, data });
    }

    if (table === "ad-groups") {
      const mapped: Summable[] = raw.map((r) => {
        const _ts = pickFilterDate(r.fields, r.createdTime);
        const cost = num(r.fields, "cost", "Cost", "Spend");
        const roas = num(r.fields, "roas", "ROAS", "Roas");
        return {
          id: r.id,
          _ts,
          _key: str(r.fields, "adGroupId", "Ad Group ID", "Ad Group Id") ||
                str(r.fields, "adGroupName", "Ad Group Name", "Ad Group") ||
                r.id,
          accountName: str(r.fields, "accountName", "Account Name", "Account"),
          campaignId: str(r.fields, "campaignId", "Campaign ID", "Campaign Id"),
          campaignName: str(r.fields, "campaignName", "Campaign Name", "Campaign"),
          adGroupId: str(r.fields, "adGroupId", "Ad Group ID", "Ad Group Id"),
          adGroupName: str(r.fields, "adGroupName", "Ad Group Name", "Ad Group"),
          adGroupStatus: str(r.fields, "adGroupStatus", "Ad Group Status", "Status"),
          cost,
          clicks: num(r.fields, "clicks", "Clicks"),
          impressions: num(r.fields, "impressions", "Impressions"),
          ctrPct: num(r.fields, "ctrPct", "CTR", "Ctr", "ctr"),
          conversions: num(r.fields, "conversions", "Conversions"),
          conversionValue: num(r.fields, "conversionValue", "Conversion Value", "Conv Value", "Revenue", "All Conversion Value"),
          roas,
          _roasWtd: roas * cost,
          pulledAt: _ts,
          _raw: r.fields,
        };
      });

      const filtered = mapped.filter(r => !r._ts || new Date(r._ts) >= cutoff);
      const data = groupAndSum(filtered);

      return Response.json({ table, count: data.length, totalRecords: raw.length, data });
    }

    if (table === "creatives") {
      // Creatives have a real per-row date field — filter by it directly
      const data = raw
        .map((r) => ({
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
          conversionValue: num(r.fields, "conversionValue", "Conversion Value", "Conv Value", "Revenue", "All Conversion Value"),
          roas: num(r.fields, "roas", "ROAS", "Roas"),
          date: str(r.fields, "date", "Date", "Day"),
          creativeTagSuggestions: (() => {
            const v = r.fields["creativeTagSuggestions"] ?? r.fields["Creative Tag Suggestions"] ?? r.fields["Tags"] ?? r.fields["Creative Tags"];
            if (v == null || v === "") return "";
            // Airtable returns {state:"empty",value:null,...} for unloaded lookup fields — ignore
            if (typeof v === "object" && !Array.isArray(v)) {
              const obj = v as Record<string, unknown>;
              if (obj.state === "empty" || obj.value == null) return "";
              if (Array.isArray(obj.value)) return (obj.value as unknown[]).map(String).join(", ");
              return String(obj.value);
            }
            if (Array.isArray(v)) return v.map(x => (typeof x === "object" && x !== null ? (x as Record<string, unknown>).name ?? String(x) : String(x))).join(", ");
            return String(v);
          })(),
          headlines: str(r.fields, "headlines", "Headlines", "Ad Headlines", "headline", "Headline", "RSA Headlines", "Responsive Headlines"),
          descriptions: str(r.fields, "descriptions", "Descriptions", "Ad Descriptions", "description", "Description", "RSA Descriptions", "Responsive Descriptions"),
          finalUrl: str(r.fields, "finalUrl", "Final URL", "Final URLs", "Landing Page URL", "Landing Page", "URL", "finalUrls"),
          displayUrl: str(r.fields, "displayUrl", "Display URL", "Display Path", "Domain", "Display Domain"),
          path1: str(r.fields, "path1", "Path 1", "URL Path 1", "Path1", "urlPath1"),
          path2: str(r.fields, "path2", "Path 2", "URL Path 2", "Path2", "urlPath2"),
          _raw: r.fields,
        }))
        .filter(r => {
          if (!r.date) return true;
          return new Date(r.date) >= cutoff;
        });

      return Response.json({ table, count: data.length, totalRecords: raw.length, data });
    }

    if (table === "keywords") {
      const mapped: Summable[] = raw.map((r) => {
        const _ts = pickFilterDate(r.fields, r.createdTime);
        const cost = num(r.fields, "cost", "Cost", "Spend");
        const roas = num(r.fields, "roas", "ROAS", "Roas");
        const kwText = str(r.fields, "keywordText", "Keyword Text", "Keyword", "keyword");
        const agName = str(r.fields, "adGroupName", "Ad Group Name", "Ad Group");
        const campId = str(r.fields, "campaignId", "Campaign ID", "Campaign Id");
        return {
          id: r.id,
          _ts,
          _key: `${kwText}||${agName}||${campId}` || r.id,
          keywordText: kwText,
          matchType: str(r.fields, "matchType", "Match Type", "Match"),
          campaignId: campId,
          campaignName: str(r.fields, "campaignName", "Campaign Name", "Campaign"),
          adGroupName: agName,
          cost,
          clicks: num(r.fields, "clicks", "Clicks"),
          impressions: num(r.fields, "impressions", "Impressions"),
          ctrPct: num(r.fields, "ctrPct", "CTR", "Ctr", "ctr"),
          conversions: num(r.fields, "conversions", "Conversions"),
          conversionValue: num(r.fields, "conversionValue", "Conversion Value", "Conv Value", "Revenue", "All Conversion Value"),
          roas,
          _roasWtd: roas * cost,
          pulledAt: _ts,
          _raw: r.fields,
        };
      });

      const filtered = mapped.filter(r => !r._ts || new Date(r._ts) >= cutoff);
      const data = groupAndSum(filtered);

      return Response.json({ table, count: data.length, totalRecords: raw.length, data });
    }

    if (table === "ad-preview") {
      // No date filtering — this is a lookup table of ad copy, not time-series
      const data = raw.map((r) => {
        const h = (n: number) => str(r.fields, `Headline ${n}`, `headline${n}`, `headline_${n}`);
        const d = (n: number) => str(r.fields, `Description ${n}`, `description${n}`, `description_${n}`);
        return {
          id: r.id,
          adId: str(r.fields, "Ad ID", "adId", "ad_id"),
          adName: str(r.fields, "Ad Name", "adName", "ad_name", "Name"),
          adType: str(r.fields, "Ad Type", "adType", "ad_type", "Type"),
          adGroupResource: str(r.fields, "Ad Group Resource", "adGroupResource"),
          status: str(r.fields, "Status", "status"),
          headline1: h(1),  headline2: h(2),  headline3: h(3),  headline4: h(4),
          headline5: h(5),  headline6: h(6),  headline7: h(7),  headline8: h(8),
          headline9: h(9),  headline10: h(10), headline11: h(11), headline12: h(12),
          headline13: h(13), headline14: h(14), headline15: h(15),
          description1: d(1), description2: d(2), description3: d(3), description4: d(4),
          targetUrl: str(r.fields, "Target URL", "targetUrl", "Final URL", "Final URLs", "finalUrl"),
          _raw: r.fields,
        };
      });
      return Response.json({ table, count: data.length, data });
    }

    const sample = raw[0]?.fields ?? {};
    return Response.json({ table, fieldNames: Object.keys(sample), sample });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
