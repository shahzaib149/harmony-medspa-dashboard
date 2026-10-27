/**
 * Pure aggregation of the Make → Airtable Google Ads daily tables into the
 * workspace shapes. No I/O here so it can be unit-tested.
 *
 * Every ratio (CTR, CPC, CPA, ROAS, conversion rate) is derived from summed
 * totals, never by averaging stored per-row ratios.
 */
import type {
  AdGroup,
  Campaign,
  ConversionActionRow,
  Creative,
  DailyPoint,
  Keyword,
  SearchTerm,
  WorkspaceTotals,
} from "@/app/google-ads-analytics/workspace-types";

export type AdsRow = { id: string; createdTime?: string; fields: Record<string, unknown> };

function text(fields: Record<string, unknown>, key: string) {
  const value = fields[key];
  return value === undefined || value === null ? "" : String(value);
}

function amount(fields: Record<string, unknown>, key: string) {
  const value = Number(fields[key]);
  return Number.isFinite(value) ? value : 0;
}

/** Airtable "Date" fields are clinic days ("YYYY-MM-DD"); never parse them as UTC instants. */
export function rowDay(row: AdsRow) {
  return text(row.fields, "Date").slice(0, 10);
}

function pulledAt(row: AdsRow) {
  return text(row.fields, "Pulled At") || row.createdTime || "";
}

/**
 * Safety net on top of the Make upsert: one row per Unique Key, keeping the
 * most recently pulled copy. Rows without a key are kept as-is.
 */
export function dedupeRows<T extends AdsRow>(rows: T[]): T[] {
  const byKey = new Map<string, T>();
  const unkeyed: T[] = [];
  for (const row of rows) {
    const key = text(row.fields, "Unique Key");
    if (!key) {
      unkeyed.push(row);
      continue;
    }
    const existing = byKey.get(key);
    if (!existing || pulledAt(row) > pulledAt(existing)) byKey.set(key, row);
  }
  return [...byKey.values(), ...unkeyed];
}

export function inDayRange(day: string, from: string, to: string) {
  return Boolean(day) && day >= from && day <= to;
}

type Sums = {
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  conversionValue: number;
  allConversions: number;
};

const emptySums = (): Sums => ({
  impressions: 0,
  clicks: 0,
  cost: 0,
  conversions: 0,
  conversionValue: 0,
  allConversions: 0,
});

function addRow(sums: Sums, fields: Record<string, unknown>) {
  sums.impressions += amount(fields, "Impressions");
  sums.clicks += amount(fields, "Clicks");
  sums.cost += amount(fields, "Cost");
  sums.conversions += amount(fields, "Conversions");
  sums.conversionValue += amount(fields, "Conversion Value");
  sums.allConversions += amount(fields, "All Conversions");
}

export function derived(sums: Pick<Sums, "impressions" | "clicks" | "cost" | "conversions" | "conversionValue">) {
  return {
    ctrPct: sums.impressions ? (sums.clicks / sums.impressions) * 100 : 0,
    avgCpc: sums.clicks ? sums.cost / sums.clicks : 0,
    cpa: sums.conversions ? sums.cost / sums.conversions : 0,
    conversionRatePct: sums.clicks ? (sums.conversions / sums.clicks) * 100 : 0,
    roas: sums.cost ? sums.conversionValue / sums.cost : 0,
  };
}

/** Group rows by a key; descriptive fields come from the newest row of each group. */
function group(rows: AdsRow[], keyOf: (row: AdsRow) => string) {
  const groups = new Map<string, { latest: AdsRow; sums: Sums; rows: AdsRow[] }>();
  for (const row of rows) {
    const key = keyOf(row);
    if (!key) continue;
    const current = groups.get(key);
    if (!current) {
      const sums = emptySums();
      addRow(sums, row.fields);
      groups.set(key, { latest: row, sums, rows: [row] });
      continue;
    }
    addRow(current.sums, row.fields);
    current.rows.push(row);
    if (rowDay(row) > rowDay(current.latest)) current.latest = row;
  }
  return [...groups.entries()];
}

const resource = (accountId: string, collection: string, id: string) =>
  accountId && id ? `customers/${accountId.replace(/-/g, "")}/${collection}/${id}` : "";

/** Impression-weighted average of a per-day share (e.g. search impression share). */
function weightedShare(rows: AdsRow[], key: string) {
  let weight = 0;
  let total = 0;
  for (const row of rows) {
    const value = row.fields[key];
    if (value === undefined || value === null || value === "") continue;
    const impressions = amount(row.fields, "Impressions");
    weight += impressions;
    total += Number(value) * impressions;
  }
  return weight ? total / weight : 0;
}

export function aggregateCampaigns(rows: AdsRow[], accountName: string): Campaign[] {
  return group(rows, (row) => text(row.fields, "Campaign ID")).map(([campaignId, g]) => {
    const f = g.latest.fields;
    const accountId = text(f, "Account ID");
    return {
      id: resource(accountId, "campaigns", campaignId) || campaignId,
      accountName,
      campaignId,
      resourceName: resource(accountId, "campaigns", campaignId),
      campaignName: text(f, "Campaign Name") || `Campaign ${campaignId}`,
      campaignStatus: text(f, "Campaign Status") || "UNKNOWN",
      channelType: text(f, "Channel Type") || "UNSPECIFIED",
      biddingStrategy: text(f, "Bidding Strategy"),
      ...g.sums,
      ...derived(g.sums),
      conversionValueAvailable: true,
      optimizationScore: 0,
      // Shares are stored as fractions (0–1); the workspace shows percentages.
      impressionShare: weightedShare(g.rows, "Search Impression Share") * 100,
      impressionShareLostBudget: weightedShare(g.rows, "Budget Lost IS") * 100,
      impressionShareLostRank: weightedShare(g.rows, "Rank Lost IS") * 100,
      pulledAt: pulledAt(g.latest),
    };
  });
}

export function aggregateAdGroups(rows: AdsRow[]): AdGroup[] {
  return group(rows, (row) => text(row.fields, "Ad Group ID")).map(([adGroupId, g]) => {
    const f = g.latest.fields;
    const accountId = text(f, "Account ID");
    const campaignId = text(f, "Campaign ID");
    return {
      id: resource(accountId, "adGroups", adGroupId) || adGroupId,
      campaignId,
      campaignResourceName: resource(accountId, "campaigns", campaignId),
      campaignName: text(f, "Campaign Name"),
      adGroupId,
      resourceName: resource(accountId, "adGroups", adGroupId),
      adGroupName: text(f, "Ad Group Name") || `Ad group ${adGroupId}`,
      adGroupStatus: text(f, "Ad Group Status") || "UNKNOWN",
      ...g.sums,
      ...derived(g.sums),
      conversionValueAvailable: true,
      pulledAt: pulledAt(g.latest),
    };
  });
}

export function aggregateAds(rows: AdsRow[]): Creative[] {
  return group(rows, (row) => {
    const adId = text(row.fields, "Ad ID");
    return adId ? `${text(row.fields, "Ad Group ID")}~${adId}` : "";
  }).map(([, g]) => {
    const f = g.latest.fields;
    const accountId = text(f, "Account ID");
    const adId = text(f, "Ad ID");
    const adGroupId = text(f, "Ad Group ID");
    const campaignId = text(f, "Campaign ID");
    const resourceName = resource(accountId, "adGroupAds", `${adGroupId}~${adId}`);
    return {
      id: resourceName || adId,
      adId,
      resourceName,
      adGroupAdResourceName: resourceName,
      adName: text(f, "Ad Name"),
      adType: text(f, "Ad Type") || "UNKNOWN",
      campaignId,
      campaignResourceName: resource(accountId, "campaigns", campaignId),
      campaignName: text(f, "Campaign Name"),
      adGroupId,
      adGroupResourceName: resource(accountId, "adGroups", adGroupId),
      adGroupName: text(f, "Ad Group Name"),
      status: text(f, "Ad Status"),
      ...g.sums,
      ...derived(g.sums),
      conversionValueAvailable: true,
      date: rowDay(g.latest),
      lastSynced: pulledAt(g.latest),
      creativeTagSuggestions: "",
      headlines: "",
      descriptions: "",
      finalUrl: "",
      displayUrl: "",
      path1: "",
      path2: "",
    };
  });
}

export function aggregateKeywords(rows: AdsRow[]): Keyword[] {
  return group(rows, (row) => {
    const criterionId = text(row.fields, "Keyword ID");
    return criterionId ? `${text(row.fields, "Ad Group ID")}~${criterionId}` : "";
  }).map(([, g]) => {
    const f = g.latest.fields;
    const accountId = text(f, "Account ID");
    const criterionId = text(f, "Keyword ID");
    const adGroupId = text(f, "Ad Group ID");
    const campaignId = text(f, "Campaign ID");
    const resourceName = resource(accountId, "adGroupCriteria", `${adGroupId}~${criterionId}`);
    const qualityScore = amount(f, "Quality Score");
    return {
      id: resourceName || criterionId,
      criterionId,
      resourceName,
      keywordText: text(f, "Keyword Text") || "Unnamed keyword",
      matchType: text(f, "Match Type") || "UNSPECIFIED",
      status: text(f, "Keyword Status"),
      campaignId,
      campaignResourceName: resource(accountId, "campaigns", campaignId),
      campaignName: text(f, "Campaign Name"),
      adGroupId,
      adGroupResourceName: resource(accountId, "adGroups", adGroupId),
      adGroupName: text(f, "Ad Group Name"),
      ...g.sums,
      ...derived(g.sums),
      conversionValueAvailable: true,
      qualityScore: qualityScore || undefined,
      pulledAt: pulledAt(g.latest),
    };
  });
}

export function aggregateSearchTerms(rows: AdsRow[]): SearchTerm[] {
  return group(rows, (row) => {
    const term = text(row.fields, "Search Term");
    if (!term) return "";
    return [
      text(row.fields, "Ad Group ID"),
      term,
      text(row.fields, "Matched Keyword"),
      text(row.fields, "Match Type"),
    ].join("|");
  }).map(([key, g]) => {
    const f = g.latest.fields;
    return {
      id: key,
      term: text(f, "Search Term"),
      status: text(f, "Term Status"),
      matchedKeyword: text(f, "Matched Keyword"),
      matchType: text(f, "Match Type"),
      campaignId: text(f, "Campaign ID"),
      campaignName: text(f, "Campaign Name"),
      adGroupId: text(f, "Ad Group ID"),
      adGroupName: text(f, "Ad Group Name"),
      ...g.sums,
      ...derived(g.sums),
    };
  });
}

export function aggregateConversionActions(rows: AdsRow[]): ConversionActionRow[] {
  return group(rows, (row) => {
    const actionId = text(row.fields, "Conversion Action ID");
    return actionId ? `${text(row.fields, "Campaign ID")}~${actionId}` : "";
  }).map(([key, g]) => {
    const f = g.latest.fields;
    return {
      id: key,
      actionId: text(f, "Conversion Action ID"),
      actionName: text(f, "Conversion Action") || "Unnamed conversion action",
      category: text(f, "Category") || "UNKNOWN",
      campaignId: text(f, "Campaign ID"),
      campaignName: text(f, "Campaign Name"),
      conversions: g.sums.conversions,
      conversionValue: g.sums.conversionValue,
      allConversions: g.sums.allConversions,
      allConversionValue: g.rows.reduce((sum, row) => sum + amount(row.fields, "All Conversion Value"), 0),
    };
  });
}

export function totalsOf(rows: AdsRow[]): WorkspaceTotals {
  const sums = emptySums();
  for (const row of rows) addRow(sums, row.fields);
  return { ...sums, ...derived(sums) };
}

/** One point per day in [from, to], zero-filled, from campaign-level rows. */
export function dailySeries(rows: AdsRow[], from: string, to: string): DailyPoint[] {
  const byDay = new Map<string, Sums>();
  for (const row of rows) {
    const day = rowDay(row);
    const sums = byDay.get(day) ?? emptySums();
    addRow(sums, row.fields);
    byDay.set(day, sums);
  }
  const points: DailyPoint[] = [];
  const cursor = new Date(`${from}T12:00:00Z`);
  const end = new Date(`${to}T12:00:00Z`);
  while (cursor <= end) {
    const day = cursor.toISOString().slice(0, 10);
    const sums = byDay.get(day) ?? emptySums();
    points.push({ date: day, ...sums, ...derived(sums) });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return points;
}

// ---------------------------------------------------------------------------
// Structure (current state) + range metrics, like the Google Ads entity tables:
// every campaign / ad group / ad / keyword is listed with its live status, and
// metrics come only from the selected range (zero when it had no impressions).

const METRIC_KEYS = [
  "impressions",
  "clicks",
  "cost",
  "conversions",
  "conversionValue",
  "allConversions",
  "ctrPct",
  "avgCpc",
  "cpa",
  "conversionRatePct",
  "roas",
] as const;

const zeroMetrics = () => ({ ...emptySums(), ...derived(emptySums()) });

/** Newline-separated copy from Make → " | " joined, blanks removed. */
function joinedLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" | ");
}

/**
 * One entity per structure row with range metrics overlaid. Range entities
 * missing from the structure tables (e.g. synced before the structure sync ran)
 * are kept. Removed entities with no activity in the range are dropped.
 */
export function withStructure<T extends Record<string, unknown>>(
  structure: T[],
  ranged: T[],
  keyOf: (item: T) => string,
  statusOf: (item: T) => string,
  extraMetricKeys: string[] = [],
): T[] {
  const byKey = new Map(ranged.map((item) => [keyOf(item), item]));
  const merged = structure.map((item) => {
    const period = byKey.get(keyOf(item));
    byKey.delete(keyOf(item));
    const metrics: Record<string, unknown> = period ? {} : zeroMetrics();
    if (period) for (const key of [...METRIC_KEYS, ...extraMetricKeys]) metrics[key] = period[key];
    else for (const key of extraMetricKeys) metrics[key] = 0;
    // Range rows carry resource names; structure rows carry the current state.
    return { ...(period ?? {}), ...item, ...metrics } as T;
  });
  return [...merged, ...byKey.values()].filter(
    (item) => statusOf(item).toUpperCase() !== "REMOVED" || Number(item.impressions) > 0,
  );
}

export function structureCampaigns(rows: AdsRow[], accountName: string): Campaign[] {
  return rows
    .filter((row) => text(row.fields, "Campaign ID"))
    .map((row) => {
      const f = row.fields;
      const campaignId = text(f, "Campaign ID");
      const budget = amount(f, "Daily Budget");
      return {
        id: campaignId,
        accountName,
        campaignId,
        campaignName: text(f, "Campaign Name") || `Campaign ${campaignId}`,
        campaignStatus: text(f, "Status") || "UNKNOWN",
        channelType: text(f, "Channel Type") || "UNSPECIFIED",
        biddingStrategy: text(f, "Bidding Strategy"),
        budget: budget || undefined,
        ...zeroMetrics(),
        conversionValueAvailable: true,
        optimizationScore: 0,
        impressionShare: 0,
        impressionShareLostBudget: 0,
        impressionShareLostRank: 0,
        pulledAt: text(f, "Pulled At"),
      };
    });
}

export function structureAdGroups(rows: AdsRow[]): AdGroup[] {
  return rows
    .filter((row) => text(row.fields, "Ad Group ID"))
    .map((row) => {
      const f = row.fields;
      const adGroupId = text(f, "Ad Group ID");
      return {
        id: adGroupId,
        campaignId: text(f, "Campaign ID"),
        campaignName: text(f, "Campaign Name"),
        adGroupId,
        adGroupName: text(f, "Ad Group Name") || `Ad group ${adGroupId}`,
        adGroupStatus: text(f, "Status") || "UNKNOWN",
        ...zeroMetrics(),
        conversionValueAvailable: true,
        pulledAt: text(f, "Pulled At"),
      };
    });
}

export function structureAds(rows: AdsRow[]): Creative[] {
  return rows
    .filter((row) => text(row.fields, "Ad ID"))
    .map((row) => {
      const f = row.fields;
      const adId = text(f, "Ad ID");
      const adGroupId = text(f, "Ad Group ID");
      const headlines = joinedLines(text(f, "Headlines"));
      return {
        id: `${adGroupId}~${adId}`,
        adId,
        adName: text(f, "Ad Name") || headlines.split(" | ")[0] || `Ad ${adId}`,
        adType: text(f, "Ad Type") || "UNKNOWN",
        campaignId: text(f, "Campaign ID"),
        campaignName: text(f, "Campaign Name"),
        adGroupId,
        adGroupName: text(f, "Ad Group Name"),
        status: text(f, "Status"),
        primaryStatus: text(f, "Primary Status"),
        approvalStatus: text(f, "Approval Status"),
        reviewStatus: text(f, "Review Status"),
        strength: text(f, "Ad Strength"),
        ...zeroMetrics(),
        conversionValueAvailable: true,
        date: "",
        lastSynced: text(f, "Pulled At"),
        creativeTagSuggestions: "",
        headlines,
        descriptions: joinedLines(text(f, "Descriptions")),
        finalUrl: text(f, "Final URL"),
        displayUrl: text(f, "Final URL"),
        path1: "",
        path2: "",
      };
    });
}

export function structureKeywords(rows: AdsRow[]): Keyword[] {
  return rows
    .filter((row) => text(row.fields, "Keyword ID"))
    .map((row) => {
      const f = row.fields;
      const criterionId = text(f, "Keyword ID");
      const adGroupId = text(f, "Ad Group ID");
      const qualityScore = amount(f, "Quality Score");
      return {
        id: `${adGroupId}~${criterionId}`,
        criterionId,
        keywordText: text(f, "Keyword Text") || "Unnamed keyword",
        matchType: text(f, "Match Type") || "UNSPECIFIED",
        status: text(f, "Status"),
        campaignId: text(f, "Campaign ID"),
        campaignName: text(f, "Campaign Name"),
        adGroupId,
        adGroupName: text(f, "Ad Group Name"),
        ...zeroMetrics(),
        conversionValueAvailable: true,
        qualityScore: qualityScore || undefined,
        pulledAt: text(f, "Pulled At"),
      };
    });
}
