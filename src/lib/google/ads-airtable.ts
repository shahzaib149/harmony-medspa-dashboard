import { fetchAllRecords, type RawRecord } from "@/lib/airtable/client";
import { previousRange } from "@/lib/date-range";
import { ADS_TABLES, type AdsDailyTable, type AdsStructureTable } from "@/lib/google/ads-tables";
import {
  aggregateAdGroups,
  aggregateAds,
  aggregateCampaigns,
  aggregateConversionActions,
  aggregateKeywords,
  aggregateSearchTerms,
  dailySeries,
  dedupeRows,
  inDayRange,
  rowDay,
  structureAdGroups,
  structureAds,
  structureCampaigns,
  structureKeywords,
  totalsOf,
  withStructure,
} from "@/lib/google/ads-aggregate";
import type { WorkspaceSnapshot, WorkspaceSync } from "@/app/google-ads-analytics/workspace-types";

export type DayRange = { from: string; to: string };
type FetchOptions = { forceRefresh?: boolean };
type WorkspaceOptions = FetchOptions & { includeSearchTerms?: boolean };

const ACCOUNT_NAME = "Harmony MedSpa";

/** Airtable formula selecting rows whose clinic-day `Date` is within [from, to]. */
export function dateRangeFormula({ from, to }: DayRange) {
  return `AND(NOT(IS_BEFORE({Date}, '${from}')), NOT(IS_AFTER({Date}, '${to}')))`;
}

/**
 * Rows of one daily table for a date range, de-duplicated by Unique Key.
 * The range is applied in Airtable (no full-history download) and again in
 * code on the plain YYYY-MM-DD string, so time zones can't shift a day.
 */
export async function fetchAdsDaily(
  table: AdsDailyTable,
  range: DayRange,
  options: FetchOptions = {},
): Promise<RawRecord[]> {
  // Airtable pages are sequential (100 rows each), so long ranges are split
  // into chunks fetched in parallel; client.ts retries on 429 rate limits.
  const chunks = await Promise.all(
    splitRange(range, CHUNK_DAYS).map((chunk) =>
      fetchAllRecords(ADS_TABLES[table], new URLSearchParams({ filterByFormula: dateRangeFormula(chunk) }), {
        cache: options.forceRefresh ? "no-store" : "cached",
        forceRefresh: options.forceRefresh,
      }),
    ),
  );
  return dedupeRows(chunks.flat()).filter((row) => inDayRange(rowDay(row), range.from, range.to));
}

const CHUNK_DAYS = 21;

/** Consecutive, non-overlapping sub-ranges of at most `days` days covering [from, to]. */
export function splitRange({ from, to }: DayRange, days: number): DayRange[] {
  const chunks: DayRange[] = [];
  const cursor = new Date(`${from}T12:00:00Z`);
  const end = new Date(`${to}T12:00:00Z`);
  while (cursor <= end) {
    const start = cursor.toISOString().slice(0, 10);
    cursor.setUTCDate(cursor.getUTCDate() + days - 1);
    const stop = cursor > end ? to : cursor.toISOString().slice(0, 10);
    chunks.push({ from: start, to: stop });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return chunks;
}

export async function fetchAdsSync(options: FetchOptions = {}): Promise<WorkspaceSync> {
  const rows = await fetchAllRecords(ADS_TABLES.syncLog, new URLSearchParams(), {
    cache: options.forceRefresh ? "no-store" : "cached",
    forceRefresh: options.forceRefresh,
  }).catch(() => [] as RawRecord[]);
  const reports = rows
    .map((row) => ({
      report: String(row.fields["Report"] ?? ""),
      dateFrom: String(row.fields["Date From"] ?? ""),
      dateTo: String(row.fields["Date To"] ?? ""),
      rows: Number(row.fields["Rows"] ?? 0),
      ranAt: String(row.fields["Ran At"] ?? row.createdTime),
    }))
    .filter((row) => row.report)
    .sort((a, b) => b.ranAt.localeCompare(a.ranAt));
  // Newest-first, so the first row seen per report is its latest run.
  const newest = new Map<string, (typeof reports)[number]>();
  for (const row of reports) if (!newest.has(row.report)) newest.set(row.report, row);
  const campaignRuns = reports.filter((row) => row.report === "Campaign");
  return {
    lastRunAt: reports[0]?.ranAt ?? null,
    dataThrough: campaignRuns.reduce<string | null>(
      (latest, row) => (!latest || row.dateTo > latest ? row.dateTo : latest),
      null,
    ),
    reports: [...newest.values()],
  };
}

/** Every row of a (small) structure table: the current state of each entity. */
async function fetchStructure(table: AdsStructureTable, options: FetchOptions) {
  return fetchAllRecords(ADS_TABLES[table], new URLSearchParams(), {
    cache: options.forceRefresh ? "no-store" : "cached",
    forceRefresh: options.forceRefresh,
  }).catch(() => [] as RawRecord[]);
}

/**
 * The whole Google Ads workspace for a range, built only from Airtable:
 * every entity level, search terms, conversion actions, account totals for the
 * range and the previous period of equal length, a daily trend and sync status.
 */
export async function buildAirtableWorkspace(
  range: DayRange,
  options: WorkspaceOptions = {},
): Promise<WorkspaceSnapshot> {
  const previous = previousRange(range);
  const [
    campaignRows,
    previousCampaignRows,
    adGroupRows,
    adRows,
    keywordRows,
    searchTermRows,
    conversionRows,
    sync,
    campaignStructure,
    adGroupStructure,
    adStructure,
    keywordStructure,
  ] =
    await Promise.all([
      fetchAdsDaily("campaign", range, options),
      fetchAdsDaily("campaign", previous, options),
      fetchAdsDaily("adGroup", range, options),
      fetchAdsDaily("ad", range, options),
      fetchAdsDaily("keyword", range, options),
      // Search terms are the largest table; only the Search terms tab asks for them.
      options.includeSearchTerms ? fetchAdsDaily("searchTerm", range, options) : Promise.resolve([]),
      fetchAdsDaily("conversionAction", range, options),
      fetchAdsSync(options),
      fetchStructure("campaignStructure", options),
      fetchStructure("adGroupStructure", options),
      fetchStructure("adStructure", options),
      fetchStructure("keywordStructure", options),
    ]);

  const status = (key: string) => (item: Record<string, unknown>) => String(item[key] ?? "");
  const campaigns = withStructure(
    structureCampaigns(campaignStructure, ACCOUNT_NAME),
    aggregateCampaigns(campaignRows, ACCOUNT_NAME),
    (item) => item.campaignId,
    status("campaignStatus"),
    ["impressionShare", "impressionShareLostBudget", "impressionShareLostRank"],
  );
  const adGroups = withStructure(
    structureAdGroups(adGroupStructure),
    aggregateAdGroups(adGroupRows),
    (item) => item.adGroupId,
    status("adGroupStatus"),
  );
  const ads = withStructure(
    structureAds(adStructure),
    aggregateAds(adRows),
    (item) => `${item.adGroupId}~${item.adId}`,
    status("status"),
  );
  const keywords = withStructure(
    structureKeywords(keywordStructure),
    aggregateKeywords(keywordRows),
    (item) => `${item.adGroupId}~${item.criterionId}`,
    status("status"),
  );
  const searchTerms = aggregateSearchTerms(searchTermRows);

  return {
    source: "airtable",
    accountName: ACCOUNT_NAME,
    fetchedAt: sync.lastRunAt ?? new Date().toISOString(),
    dateRange: range,
    campaigns,
    adGroups,
    ads,
    keywords,
    searchTerms,
    assets: [],
    totals: {
      campaigns: campaigns.length,
      adGroups: adGroups.length,
      ads: ads.length,
      keywords: keywords.length,
      searchTerms: searchTerms.length,
      assets: 0,
    },
    summary: {
      current: totalsOf(campaignRows),
      previous: totalsOf(previousCampaignRows),
      previousRange: previous,
    },
    daily: dailySeries(campaignRows, range.from, range.to),
    conversionActions: aggregateConversionActions(conversionRows),
    sync,
  };
}
