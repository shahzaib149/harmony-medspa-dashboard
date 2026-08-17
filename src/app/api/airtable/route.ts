import { fetchAllRecords, num, str } from "@/lib/airtable/client";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { withCache, bustCache } from "@/lib/server-cache";
import {
  canonicalAdKey,
  canonicalKeywordKey,
  mergeInventoryAndPerformance,
  isReportingDateInRange,
  type SnapshotMetric as Summable,
} from "@/lib/google/ads-normalization";

const TABLE_NAMES = {
  campaigns: "Google Ads Campaign Analytics",
  "ad-groups": "Google Ads Ad Group Analytics",
  creatives: "Google Ads Ad Creative Analytics",
  keywords: "Google Ads Keyword Performance",
  "ad-preview": "tblsokwqKQuj3rFSB", // "Google Ad Preview" table — ad copy (headlines/descriptions)
};

/**
 * Pick the best date to use for range-filtering a record.
 * Tries performance/segment date fields first (what Make.com writes from Google Ads
 * segments.date), then sync-timestamp fields, then Airtable's createdTime.
 */
function pickFilterDate(
  fields: Record<string, unknown>,
  createdTime: string,
): string {
  return (
    str(
      fields,
      "Date",
      "date",
      "Day",
      "day",
      "Segment Date",
      "Reporting Date",
      "Report Date",
      "Period",
    ) ||
    str(
      fields,
      "pulledAt",
      "Pulled At",
      "Last Updated",
      "Updated At",
      "Synced At",
    ) ||
    createdTime ||
    ""
  );
}
function pickPerformanceDate(fields: Record<string, unknown>): string {
  return str(
    fields,
    "Date",
    "date",
    "Day",
    "day",
    "Segment Date",
    "Reporting Date",
    "Report Date",
    "Period",
  );
}


/** The time Make actually refreshed the row, independent of its reporting day. */
function pickPulledAt(
  fields: Record<string, unknown>,
  createdTime: string,
): string {
  return (
    str(
      fields,
      "pulledAt",
      "Pulled At",
      "Last Updated",
      "Updated At",
      "Synced At",
    ) ||
    createdTime ||
    ""
  );
}

function hasAnyField(fields: Record<string, unknown>, ...keys: string[]) {
  return keys.some(
    (key) =>
      fields[key] !== undefined && fields[key] !== null && fields[key] !== "",
  );
}

function googleResource(accountId: string, collection: string, id: string) {
  return accountId && id
    ? `customers/${accountId.replace(/-/g, "")}/${collection}/${id}`
    : "";
}

const AIRTABLE_ROUTE_TTL = 60; // 60s cache

export async function GET(request: Request) {
  try {
    await requireRole(request, "viewer");
  } catch (error) {
    return authErrorResponse(error);
  }
  const { searchParams } = new URL(request.url);
  const table = searchParams.get("table") as keyof typeof TABLE_NAMES | null;
  const days = Number(searchParams.get("days") ?? 30);
  const forceRefresh =
    searchParams.get("refresh") === "1" ||
    request.headers.get("x-force-refresh") === "1";

  if (!table || !TABLE_NAMES[table]) {
    return Response.json(
      {
        error: "Invalid table. Use: campaigns, ad-groups, creatives, keywords",
      },
      { status: 400 },
    );
  }

  const cacheKey = `airtable_api:${table}:${days}`;
  if (forceRefresh) {
    bustCache(cacheKey);
  }

  try {
    const raw = await fetchAllRecords(
      TABLE_NAMES[table],
      new URLSearchParams(),
      { cache: forceRefresh ? "no-store" : "cached", forceRefresh },
    );

    if (table === "campaigns") {
      const mapped: Summable[] = raw.map((r) => {
        const _ts = pickFilterDate(r.fields, r.createdTime);
        const cost = num(r.fields, "cost", "Cost", "Spend");
        const roas = num(
          r.fields,
          "roas",
          "ROAS",
          "Roas",
          "Return on Ad Spend",
        );
        const campaignId = str(
          r.fields,
          "campaignId",
          "Campaign ID",
          "Campaign Id",
        );
        const accountId = str(
          r.fields,
          "accountId",
          "Account ID",
          "Customer ID",
        );
        return {
          id: r.id,
          _ts,
          _performanceDate: pickPerformanceDate(r.fields),
          _key:
            str(
              r.fields,
              "campaignResourceName",
              "Campaign Resource Name",
              "Campaign Resource",
              "campaign_resource_name",
            ) ||
            campaignId ||
            r.id,
          accountName: str(r.fields, "accountName", "Account Name", "Account"),
          accountId,
          campaignId,
          resourceName:
            str(
              r.fields,
              "campaignResourceName",
              "Campaign Resource Name",
              "Campaign Resource",
              "campaign_resource_name",
            ) || googleResource(accountId, "campaigns", campaignId),
          campaignName: str(
            r.fields,
            "campaignName",
            "Campaign Name",
            "Campaign",
          ),
          campaignStatus: str(
            r.fields,
            "campaignStatus",
            "Campaign Status",
            "Status",
          ),
          channelType: str(
            r.fields,
            "channelType",
            "Channel Type",
            "Channel",
            "Type",
          ),
          budget: num(
            r.fields,
            "budget",
            "Budget",
            "Daily Budget",
            "Budget Amount",
          ),
          biddingStrategy: str(
            r.fields,
            "biddingStrategy",
            "Bidding Strategy",
            "Bidding Strategy Type",
          ),
          startDate: str(r.fields, "startDate", "Start Date"),
          endDate: str(r.fields, "endDate", "End Date"),
          cost,
          clicks: num(r.fields, "clicks", "Clicks"),
          impressions: num(r.fields, "impressions", "Impressions"),
          ctrPct: num(r.fields, "ctrPct", "CTR", "Ctr", "ctr"),
          conversions: num(r.fields, "conversions", "Conversions"),
          conversionValue: num(
            r.fields,
            "conversionValue",
            "Conversion Value",
            "Conv Value",
            "Revenue",
            "All Conversion Value",
            "All Conv. Value",
          ),
          conversionValueAvailable: hasAnyField(
            r.fields,
            "conversionValue",
            "Conversion Value",
            "Conv Value",
            "Revenue",
            "All Conversion Value",
            "All Conv. Value",
          ),
          roas,
          _roasWtd: roas * cost,
          optimizationScore: num(
            r.fields,
            "optimizationScore",
            "Optimization Score",
            "Opt Score",
          ),
          impressionShare: num(
            r.fields,
            "impressionShare",
            "Impression Share",
            "IS",
            "Search IS",
            "Search Impression Share",
          ),
          impressionShareLostBudget: num(
            r.fields,
            "impressionShareLostBudget",
            "IS Lost Budget",
            "Budget Lost IS",
            "Search Lost IS (Budget)",
          ),
          impressionShareLostRank: num(
            r.fields,
            "impressionShareLostRank",
            "IS Lost Rank",
            "Rank Lost IS",
            "Search Lost IS (Rank)",
          ),
          pulledAt: pickPulledAt(r.fields, r.createdTime),
          _raw: r.fields,
        };
      });

      const inventory = mapped.filter((r) => Boolean(r.campaignId || r.campaignName));
      const filtered = inventory.filter((r) =>
        isReportingDateInRange(String(r._performanceDate || ""), days),
      );

      // Keep complete valid inventory, but aggregate metrics only from Date.
      const data = mergeInventoryAndPerformance(inventory, filtered);

      return Response.json({
        table,
        count: data.length,
        totalRecords: raw.length,
        data,
      });
    }

    if (table === "ad-groups") {
      const mapped: Summable[] = raw.map((r) => {
        const _ts = pickFilterDate(r.fields, r.createdTime);
        const cost = num(r.fields, "cost", "Cost", "Spend");
        const roas = num(r.fields, "roas", "ROAS", "Roas");
        const campaignId = str(
          r.fields,
          "campaignId",
          "Campaign ID",
          "Campaign Id",
        );
        const adGroupId = str(
          r.fields,
          "adGroupId",
          "Ad Group ID",
          "Ad Group Id",
        );
        const accountId = str(
          r.fields,
          "accountId",
          "Account ID",
          "Customer ID",
        );
        return {
          id: r.id,
          _ts,
          _performanceDate: pickPerformanceDate(r.fields),
          _key:
            str(
              r.fields,
              "adGroupResourceName",
              "Ad Group Resource Name",
              "Ad Group Resource",
              "ad_group_resource_name",
            ) ||
            adGroupId ||
            r.id,
          accountName: str(r.fields, "accountName", "Account Name", "Account"),
          accountId,
          campaignId,
          campaignResourceName:
            str(
              r.fields,
              "campaignResourceName",
              "Campaign Resource Name",
              "Campaign Resource",
              "campaign_resource_name",
            ) || googleResource(accountId, "campaigns", campaignId),
          campaignName: str(
            r.fields,
            "campaignName",
            "Campaign Name",
            "Campaign",
          ),
          adGroupId,
          resourceName:
            str(
              r.fields,
              "adGroupResourceName",
              "Ad Group Resource Name",
              "Ad Group Resource",
              "ad_group_resource_name",
            ) || googleResource(accountId, "adGroups", adGroupId),
          adGroupName: str(
            r.fields,
            "adGroupName",
            "Ad Group Name",
            "Ad Group",
          ),
          adGroupStatus: str(
            r.fields,
            "adGroupStatus",
            "Ad Group Status",
            "Status",
          ),
          adGroupType: str(r.fields, "adGroupType", "Ad Group Type", "Type"),
          cost,
          clicks: num(r.fields, "clicks", "Clicks"),
          impressions: num(r.fields, "impressions", "Impressions"),
          ctrPct: num(r.fields, "ctrPct", "CTR", "Ctr", "ctr"),
          conversions: num(r.fields, "conversions", "Conversions"),
          conversionValue: num(
            r.fields,
            "conversionValue",
            "Conversion Value",
            "Conv Value",
            "Revenue",
            "All Conversion Value",
          ),
          conversionValueAvailable: hasAnyField(
            r.fields,
            "conversionValue",
            "Conversion Value",
            "Conv Value",
            "Revenue",
            "All Conversion Value",
          ),
          roas,
          _roasWtd: roas * cost,
          pulledAt: pickPulledAt(r.fields, r.createdTime),
          _raw: r.fields,
        };
      });

      const inventory = mapped.filter((r) => Boolean(r.adGroupId || r.adGroupName));
      const filtered = inventory.filter((r) =>
        isReportingDateInRange(String(r._performanceDate || ""), days),
      );
      const data = mergeInventoryAndPerformance(inventory, filtered);

      return Response.json({
        table,
        count: data.length,
        totalRecords: raw.length,
        data,
      });
    }

    if (table === "creatives") {
      // Creatives have a real per-row date field — filter by it directly
      const mapped: Summable[] = raw.map((r) => {
        const _ts = pickFilterDate(r.fields, r.createdTime);
        const adId = str(r.fields, "adId", "Ad ID", "Ad Id");
        const adGroupId = str(
          r.fields,
          "adGroupId",
          "Ad Group ID",
          "Ad Group Id",
        );
        const campaignId = str(
          r.fields,
          "campaignId",
          "Campaign ID",
          "Campaign Id",
        );
        const accountId = str(
          r.fields,
          "accountId",
          "Account ID",
          "Customer ID",
        );
        const cost = num(r.fields, "cost", "Cost", "Spend");
        const dailyRoas = num(r.fields, "roas", "ROAS", "Roas");
        const resourceName =
          str(
            r.fields,
            "adGroupAdResourceName",
            "Ad Group Ad Resource Name",
            "Ad Group Ad Resource",
            "adResourceName",
            "Ad Resource Name",
            "Google Ads Resource Name",
            "ad_resource_name",
          ) ||
          (accountId && adGroupId && adId
            ? `customers/${accountId.replace(/-/g, "")}/adGroupAds/${adGroupId}~${adId}`
            : "");
        return {
          id: r.id,
          _ts,
          _performanceDate: pickPerformanceDate(r.fields),
          _key: canonicalAdKey({
            resourceName,
            adId,
            adGroupId,
            fallbackId: r.id,
          }),
          adId,
          resourceName,
          adGroupAdResourceName: resourceName,
          adName: str(r.fields, "Ad Name") || (adId ? `Ad ${adId}` : "Ad"),
          adType: str(r.fields, "adType", "Ad Type", "Type"),
          accountId,
          campaignId,
          campaignResourceName:
            str(
              r.fields,
              "campaignResourceName",
              "Campaign Resource Name",
              "Campaign Resource",
            ) || googleResource(accountId, "campaigns", campaignId),
          campaignName: str(
            r.fields,
            "campaignName",
            "Campaign Name",
            "Campaign",
          ),
          adGroupId,
          adGroupResourceName:
            str(
              r.fields,
              "adGroupResourceName",
              "Ad Group Resource Name",
              "Ad Group Resource",
            ) || googleResource(accountId, "adGroups", adGroupId),
          adGroupName: str(
            r.fields,
            "adGroupName",
            "Ad Group Name",
            "Ad Group",
          ),
          status: str(
            r.fields,
            "status",
            "Status",
            "Ad Status",
            "Google Ads Status",
          ),
          primaryStatus: str(r.fields, "primaryStatus", "Primary Status"),
          approvalStatus: str(
            r.fields,
            "approvalStatus",
            "Approval Status",
            "Policy Approval Status",
          ),
          reviewStatus: str(
            r.fields,
            "reviewStatus",
            "Review Status",
            "Policy Review Status",
          ),
          strength: str(r.fields, "strength", "Ad Strength"),
          publishSource: str(
            r.fields,
            "publishSource",
            "Publish Source",
            "Published Via",
            "Source",
          ),
          createdAt: str(r.fields, "createdAt", "Created At") || r.createdTime,
          lastSynced: pickPulledAt(r.fields, r.createdTime),
          cost,
          clicks: num(r.fields, "clicks", "Clicks"),
          impressions: num(r.fields, "impressions", "Impressions"),
          ctrPct: num(r.fields, "ctrPct", "CTR", "Ctr", "ctr"),
          conversions: num(r.fields, "conversions", "Conversions"),
          conversionValue: num(
            r.fields,
            "conversionValue",
            "Conversion Value",
            "Conv Value",
            "Revenue",
            "All Conversion Value",
          ),
          conversionValueAvailable: hasAnyField(
            r.fields,
            "conversionValue",
            "Conversion Value",
            "Conv Value",
            "Revenue",
            "All Conversion Value",
          ),
          roas: dailyRoas,
          _roasWtd: dailyRoas * cost,
          date: str(r.fields, "date", "Date", "Day"),
          creativeTagSuggestions: (() => {
            const v =
              r.fields["creativeTagSuggestions"] ??
              r.fields["Creative Tag Suggestions"] ??
              r.fields["Tags"] ??
              r.fields["Creative Tags"];
            if (v == null || v === "") return "";
            // Airtable returns {state:"empty",value:null,...} for unloaded lookup fields — ignore
            if (typeof v === "object" && !Array.isArray(v)) {
              const obj = v as Record<string, unknown>;
              if (obj.state === "empty" || obj.value == null) return "";
              if (Array.isArray(obj.value))
                return (obj.value as unknown[]).map(String).join(", ");
              return String(obj.value);
            }
            if (Array.isArray(v))
              return v
                .map((x) =>
                  typeof x === "object" && x !== null
                    ? ((x as Record<string, unknown>).name ?? String(x))
                    : String(x),
                )
                .join(", ");
            return String(v);
          })(),
          headlines: str(
            r.fields,
            "headlines",
            "Headlines",
            "Ad Headlines",
            "headline",
            "Headline",
            "RSA Headlines",
            "Responsive Headlines",
          ),
          descriptions: str(
            r.fields,
            "descriptions",
            "Descriptions",
            "Ad Descriptions",
            "description",
            "Description",
            "RSA Descriptions",
            "Responsive Descriptions",
          ),
          finalUrl: str(
            r.fields,
            "finalUrl",
            "Final URL",
            "Final URLs",
            "Landing Page URL",
            "Landing Page",
            "URL",
            "finalUrls",
          ),
          displayUrl: str(
            r.fields,
            "displayUrl",
            "Display URL",
            "Display Path",
            "Domain",
            "Display Domain",
          ),
          path1: str(
            r.fields,
            "path1",
            "Path 1",
            "URL Path 1",
            "Path1",
            "urlPath1",
          ),
          path2: str(
            r.fields,
            "path2",
            "Path 2",
            "URL Path 2",
            "Path2",
            "urlPath2",
          ),
          pulledAt: pickPulledAt(r.fields, r.createdTime),
          _raw: r.fields,
        };
      });
      const inventory = mapped.filter((r) => Boolean(r.adId));
      const filtered = inventory.filter((r) =>
        isReportingDateInRange(String(r._performanceDate || ""), days),
      );
      const data = mergeInventoryAndPerformance(inventory, filtered);

      return Response.json({
        table,
        count: data.length,
        totalRecords: raw.length,
        data,
      });
    }

    if (table === "keywords") {
      const mapped: Summable[] = raw.map((r) => {
        const _ts = pickFilterDate(r.fields, r.createdTime);
        const cost = num(r.fields, "cost", "Cost", "Spend");
        const roas = num(r.fields, "roas", "ROAS", "Roas");
        const kwText = str(
          r.fields,
          "keywordText",
          "Keyword Text",
          "Keyword",
          "keyword",
        );
        const agName = str(
          r.fields,
          "adGroupName",
          "Ad Group Name",
          "Ad Group",
        );
        const campId = str(
          r.fields,
          "campaignId",
          "Campaign ID",
          "Campaign Id",
        );
        const criterionId = str(
          r.fields,
          "criterionId",
          "Criterion ID",
          "Keyword ID",
          "Keyword Criterion ID",
        );
        const adGroupId = str(
          r.fields,
          "adGroupId",
          "Ad Group ID",
          "Ad Group Id",
        );
        const accountId = str(
          r.fields,
          "accountId",
          "Account ID",
          "Customer ID",
        );
        const resourceName =
          str(
            r.fields,
            "keywordResourceName",
            "Keyword Resource Name",
            "Criterion Resource Name",
            "resourceName",
          ) ||
          (accountId && adGroupId && criterionId
            ? `customers/${accountId.replace(/-/g, "")}/adGroupCriteria/${adGroupId}~${criterionId}`
            : "");
        return {
          id: r.id,
          _ts,
          _performanceDate: pickPerformanceDate(r.fields),
          _key: canonicalKeywordKey({
            resourceName,
            criterionId,
            adGroupId,
            fallbackId: r.id,
          }),
          criterionId,
          resourceName,
          keywordText: kwText,
          matchType: str(r.fields, "matchType", "Match Type", "Match"),
          status: str(r.fields, "status", "Status", "Keyword Status"),
          negative:
            str(
              r.fields,
              "negative",
              "Negative",
              "Is Negative",
            ).toLowerCase() === "true",
          campaignId: campId,
          accountId,
          campaignResourceName:
            str(
              r.fields,
              "campaignResourceName",
              "Campaign Resource Name",
              "Campaign Resource",
            ) || googleResource(accountId, "campaigns", campId),
          campaignName: str(
            r.fields,
            "campaignName",
            "Campaign Name",
            "Campaign",
          ),
          adGroupId,
          adGroupResourceName:
            str(
              r.fields,
              "adGroupResourceName",
              "Ad Group Resource Name",
              "Ad Group Resource",
            ) || googleResource(accountId, "adGroups", adGroupId),
          adGroupName: agName,
          qualityScore: num(r.fields, "qualityScore", "Quality Score"),
          cost,
          clicks: num(r.fields, "clicks", "Clicks"),
          impressions: num(r.fields, "impressions", "Impressions"),
          ctrPct: num(r.fields, "ctrPct", "CTR", "Ctr", "ctr"),
          conversions: num(r.fields, "conversions", "Conversions"),
          conversionValue: num(
            r.fields,
            "conversionValue",
            "Conversion Value",
            "Conv Value",
            "Revenue",
            "All Conversion Value",
          ),
          conversionValueAvailable: hasAnyField(
            r.fields,
            "conversionValue",
            "Conversion Value",
            "Conv Value",
            "Revenue",
            "All Conversion Value",
          ),
          roas,
          _roasWtd: roas * cost,
          pulledAt: pickPulledAt(r.fields, r.createdTime),
          _raw: r.fields,
        };
      });

      const inventory = mapped.filter((r) => Boolean(r.criterionId || r.keywordText));
      const filtered = inventory.filter((r) =>
        isReportingDateInRange(String(r._performanceDate || ""), days),
      );
      const data = mergeInventoryAndPerformance(inventory, filtered);

      return Response.json({
        table,
        count: data.length,
        totalRecords: raw.length,
        data,
      });
    }

    if (table === "ad-preview") {
      // No date filtering — this is a lookup table of ad copy, not time-series
      const data = raw.map((r) => {
        const h = (n: number) =>
          str(r.fields, `Headline ${n}`, `headline${n}`, `headline_${n}`);
        const d = (n: number) =>
          str(
            r.fields,
            `Description ${n}`,
            `description${n}`,
            `description_${n}`,
          );
        const resourceName = str(
          r.fields,
          "Ad Group Resource",
          "adGroupResource",
          "Ad Group Ad Resource",
          "adGroupAdResource",
        );
        const relation = resourceName.match(/\/adGroupAds\/(\d+)~(\d+)$/);
        const headlines = Array.from({ length: 15 }, (_, index) =>
          h(index + 1),
        ).filter(Boolean);
        const descriptions = Array.from({ length: 4 }, (_, index) =>
          d(index + 1),
        ).filter(Boolean);
        return {
          id: r.id,
          adId: str(r.fields, "Ad ID", "adId", "ad_id"),
          adName: str(r.fields, "Ad Name", "adName", "ad_name", "Name"),
          adType: str(r.fields, "Ad Type", "adType", "ad_type", "Type"),
          resourceName,
          adGroupAdResourceName: resourceName,
          adGroupResource: resourceName,
          adGroupId: relation?.[1] ?? "",
          status: str(r.fields, "Status", "status"),
          headline1: h(1),
          headline2: h(2),
          headline3: h(3),
          headline4: h(4),
          headline5: h(5),
          headline6: h(6),
          headline7: h(7),
          headline8: h(8),
          headline9: h(9),
          headline10: h(10),
          headline11: h(11),
          headline12: h(12),
          headline13: h(13),
          headline14: h(14),
          headline15: h(15),
          description1: d(1),
          description2: d(2),
          description3: d(3),
          description4: d(4),
          headlines: headlines.join(" | "),
          descriptions: descriptions.join(" | "),
          targetUrl: str(
            r.fields,
            "Target URL",
            "targetUrl",
            "Final URL",
            "Final URLs",
            "finalUrl",
          ),
          finalUrl: str(
            r.fields,
            "Target URL",
            "targetUrl",
            "Final URL",
            "Final URLs",
            "finalUrl",
          ),
          lastSynced: r.createdTime,
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
