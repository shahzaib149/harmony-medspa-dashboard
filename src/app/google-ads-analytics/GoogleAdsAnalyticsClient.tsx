"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Loader2,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import GoogleAdsWorkspace, {
  type WorkspaceTab,
} from "./components/GoogleAdsWorkspace";
import type {
  AdGroup,
  Campaign,
  Creative,
  Keyword,
  WorkspaceSnapshot,
} from "./workspace-types";
import { DASHBOARD_REFRESH_EVENT } from "@/lib/dashboard-refresh";
import DateRangeFilter from "@/components/ui/DateRangeFilter";
import { dateRangeParams, formatRangeLabel, type DateRangeInput, type ResolvedDateRange } from "@/lib/date-range";
import { ADS_DATE_PRESETS, ADS_MAX_DAYS, adsRangeQuery, adsSelection, resolveAdsRange } from "@/lib/google/ads-range";

type AdsRange = Pick<ResolvedDateRange, "from" | "to" | "days">;

export type { AdGroup, Campaign, Creative, Keyword } from "./workspace-types";

const VALID_TABS: WorkspaceTab[] = [
  "overview",
  "campaigns",
  "ad-groups",
  "ads",
  "keywords",
  "search-terms",
  "conversions",
  "workflow",
  "ai-suggestions",
];

const TAB_ROUTES: Record<WorkspaceTab, string> = {
  overview: "/google-ads-analytics",
  campaigns: "/google-ads-analytics/campaigns",
  "ad-groups": "/google-ads-analytics/ad-groups",
  ads: "/google-ads-analytics/ads",
  keywords: "/google-ads-analytics/keywords",
  "search-terms": "/google-ads-analytics/search-terms",
  conversions: "/google-ads-analytics/conversions",
  workflow: "/google-ads-analytics/publishing",
  "ai-suggestions": "/google-ads-analytics/ai-suggestions",
};

const WORKSPACE_CACHE_TTL_MS = 2 * 60 * 1000;
type WorkspaceResult = {
  snapshot: WorkspaceSnapshot;
  syncError: string | null;
};
const workspaceCache = new Map<
  string,
  WorkspaceResult & { expiresAt: number }
>();
const workspaceRequests = new Map<string, Promise<WorkspaceResult>>();

function WorkspaceSkeleton() {
  return (
    <div className="animate-pulse space-y-5" aria-label="Loading Google Ads data">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-28 rounded-2xl border"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--surface-1)",
            }}
          />
        ))}
      </div>
      <div
        className="h-14 rounded-2xl border"
        style={{
          borderColor: "var(--border-subtle)",
          background: "var(--surface-1)",
        }}
      />
      <div
        className="overflow-hidden rounded-2xl border p-4"
        style={{
          borderColor: "var(--border-subtle)",
          background: "var(--surface-1)",
        }}
      >
        <div className="h-10 rounded-xl" style={{ background: "var(--surface-2)" }} />
        <div className="mt-4 space-y-3">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="h-14 rounded-xl"
              style={{ background: "var(--surface-2)" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function numeric<T extends Record<string, unknown>>(row: T, key: keyof T) {
  return Number(row[key] ?? 0);
}

function normalizeCampaign(row: Campaign): Campaign {
  return {
    ...row,
    id: row.id || row.resourceName || row.campaignId,
    accountName: row.accountName || "Harmony MedSpa",
    campaignId: String(row.campaignId || ""),
    campaignName: row.campaignName || `Campaign ${row.campaignId}`,
    campaignStatus: row.campaignStatus || "UNKNOWN",
    channelType: row.channelType || "UNSPECIFIED",
    cost: numeric(row, "cost"),
    clicks: numeric(row, "clicks"),
    impressions: numeric(row, "impressions"),
    ctrPct: numeric(row, "ctrPct"),
    conversions: numeric(row, "conversions"),
    conversionValue: numeric(row, "conversionValue"),
    roas: numeric(row, "roas"),
    optimizationScore: numeric(row, "optimizationScore"),
    impressionShare: numeric(row, "impressionShare"),
    impressionShareLostBudget: numeric(row, "impressionShareLostBudget"),
    impressionShareLostRank: numeric(row, "impressionShareLostRank"),
    pulledAt: row.pulledAt || new Date().toISOString(),
  };
}
function mergeCampaignInventory(
  performanceRows: Campaign[],
  inventoryRows: Campaign[],
) {
  const performance = performanceRows
    .map(normalizeCampaign)
    .filter((row) => Boolean(row.campaignId && row.campaignName));
  const inventory = inventoryRows
    .map(normalizeCampaign)
    .filter(
      (row) =>
        Boolean(row.campaignId && row.campaignName) &&
        row.campaignStatus.toUpperCase() !== "REMOVED",
    );
  if (!inventory.length) return performance;

  const performanceById = new Map(
    performance.map((row) => [row.campaignId, row]),
  );
  const merged = inventory.map((identity) => {
    const period = performanceById.get(identity.campaignId);
    return normalizeCampaign({
      ...period,
      ...identity,
      // Daily report rows are newer than the campaign list, so their status wins.
      campaignStatus: period?.campaignStatus || identity.campaignStatus,
      channelType: period?.channelType || identity.channelType,
      biddingStrategy: period?.biddingStrategy || identity.biddingStrategy,
      // An empty budget in the campaign list arrives as 0; treat it as unknown.
      budget: identity.budget || period?.budget || undefined,
      accountName: period?.accountName || identity.accountName,
      pulledAt: period?.pulledAt || identity.pulledAt,
      cost: period?.cost ?? 0,
      clicks: period?.clicks ?? 0,
      impressions: period?.impressions ?? 0,
      ctrPct: period?.ctrPct ?? 0,
      avgCpc: period?.avgCpc,
      conversions: period?.conversions ?? 0,
      cpa: period?.cpa,
      conversionValue: period?.conversionValue ?? 0,
      conversionValueAvailable: period?.conversionValueAvailable ?? false,
      roas: period?.roas ?? 0,
      optimizationScore: period?.optimizationScore ?? 0,
      impressionShare: period?.impressionShare ?? 0,
      impressionShareLostBudget: period?.impressionShareLostBudget ?? 0,
      impressionShareLostRank: period?.impressionShareLostRank ?? 0,
    });
  });
  const inventoryIds = new Set(inventory.map((row) => row.campaignId));
  return [
    ...merged,
    ...performance.filter((row) => !inventoryIds.has(row.campaignId)),
  ];
}


function normalizeAdGroup(row: AdGroup): AdGroup {
  return {
    ...row,
    id: row.id || row.resourceName || row.adGroupId,
    campaignId: String(row.campaignId || ""),
    campaignName: row.campaignName || "Unresolved campaign",
    adGroupId: String(row.adGroupId || ""),
    adGroupName: row.adGroupName || `Ad group ${row.adGroupId}`,
    adGroupStatus: row.adGroupStatus || "UNKNOWN",
    cost: numeric(row, "cost"),
    clicks: numeric(row, "clicks"),
    impressions: numeric(row, "impressions"),
    ctrPct: numeric(row, "ctrPct"),
    conversions: numeric(row, "conversions"),
    conversionValue: numeric(row, "conversionValue"),
    roas: numeric(row, "roas"),
  };
}

function normalizeCreative(row: Creative): Creative {
  return {
    ...row,
    id: row.id || row.resourceName || row.adId,
    adId: String(row.adId || ""),
    adName: row.adName || `Ad ${row.adId}`,
    adType: row.adType || "UNKNOWN",
    campaignId: String(row.campaignId || ""),
    campaignName: row.campaignName || "Unresolved campaign",
    adGroupName: row.adGroupName || "Unresolved ad group",
    cost: numeric(row, "cost"),
    clicks: numeric(row, "clicks"),
    impressions: numeric(row, "impressions"),
    ctrPct: numeric(row, "ctrPct"),
    conversions: numeric(row, "conversions"),
    conversionValue: numeric(row, "conversionValue"),
    roas: numeric(row, "roas"),
    date: row.date || "",
    creativeTagSuggestions: row.creativeTagSuggestions || "",
    headlines: row.headlines || "",
    descriptions: row.descriptions || "",
    finalUrl: row.finalUrl || "",
    displayUrl: row.displayUrl || "",
    path1: row.path1 || "",
    path2: row.path2 || "",
  };
}

function normalizeKeyword(row: Keyword): Keyword {
  return {
    ...row,
    id: row.id || row.resourceName || row.criterionId || row.keywordText,
    keywordText: row.keywordText || "Unnamed keyword",
    matchType: row.matchType || "UNSPECIFIED",
    campaignId: String(row.campaignId || ""),
    campaignName: row.campaignName || "Unresolved campaign",
    adGroupName: row.adGroupName || "Unresolved ad group",
    cost: numeric(row, "cost"),
    clicks: numeric(row, "clicks"),
    impressions: numeric(row, "impressions"),
    ctrPct: numeric(row, "ctrPct"),
    conversions: numeric(row, "conversions"),
    conversionValue: numeric(row, "conversionValue"),
    roas: numeric(row, "roas"),
  };
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  const data = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | null;
  if (!response.ok || !data)
    throw new Error(data?.error || `Request failed (${response.status})`);
  return data;
}

const LIVE_STATUS_TIMEOUT_MS = 8_000;

function withTimeout<T>(promise: Promise<T>, ms: number) {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Live Google Ads status timed out")), ms),
    ),
  ]);
}

/**
 * Overlay live Google Ads *status* onto the Airtable snapshot. Metrics are
 * never taken from the live API, so a page can't show two different totals.
 * Live-only entities (no impressions in the range) are added with zero metrics
 * so paused or quiet items stay visible.
 */
function overlayLiveStatus(snapshot: WorkspaceSnapshot, live: WorkspaceSnapshot): WorkspaceSnapshot {
  const zero = {
    cost: 0,
    clicks: 0,
    impressions: 0,
    ctrPct: 0,
    avgCpc: 0,
    conversions: 0,
    cpa: 0,
    conversionValue: 0,
    roas: 0,
  };
  const liveCampaigns = new Map(live.campaigns.map((item) => [String(item.campaignId), item]));
  const campaigns = snapshot.campaigns.map((item) => {
    const status = liveCampaigns.get(item.campaignId);
    return status
      ? {
          ...item,
          campaignStatus: status.campaignStatus || item.campaignStatus,
          budget: status.budget ?? item.budget,
          budgetResourceName: status.budgetResourceName,
          optimizationScore: status.optimizationScore || item.optimizationScore,
          startDate: status.startDate,
          endDate: status.endDate,
        }
      : item;
  });
  const campaignIds = new Set(campaigns.map((item) => item.campaignId));
  for (const item of live.campaigns) {
    if (!campaignIds.has(String(item.campaignId))) campaigns.push(normalizeCampaign({ ...item, ...zero, impressionShare: 0, impressionShareLostBudget: 0, impressionShareLostRank: 0 }));
  }

  const liveGroups = new Map(live.adGroups.map((item) => [String(item.adGroupId), item]));
  const adGroups = snapshot.adGroups.map((item) => {
    const status = liveGroups.get(item.adGroupId);
    return status ? { ...item, adGroupStatus: status.adGroupStatus || item.adGroupStatus, adGroupType: status.adGroupType } : item;
  });
  const groupIds = new Set(adGroups.map((item) => item.adGroupId));
  for (const item of live.adGroups) {
    if (!groupIds.has(String(item.adGroupId))) adGroups.push(normalizeAdGroup({ ...item, ...zero }));
  }

  const liveAds = new Map(live.ads.map((item) => [`${item.adGroupId}~${item.adId}`, item]));
  const ads = snapshot.ads.map((item) => {
    const status = liveAds.get(`${item.adGroupId}~${item.adId}`);
    return status
      ? {
          ...item,
          status: status.status || item.status,
          primaryStatus: status.primaryStatus,
          primaryStatusReasons: status.primaryStatusReasons,
          approvalStatus: status.approvalStatus,
          reviewStatus: status.reviewStatus,
          policyTopics: status.policyTopics,
          strength: status.strength,
          headlines: item.headlines || status.headlines,
          descriptions: item.descriptions || status.descriptions,
          headlineAssets: status.headlineAssets,
          descriptionAssets: status.descriptionAssets,
          finalUrl: item.finalUrl || status.finalUrl,
          finalUrls: status.finalUrls,
          path1: status.path1 || item.path1,
          path2: status.path2 || item.path2,
        }
      : item;
  });

  const liveKeywords = new Map(live.keywords.map((item) => [`${item.adGroupId}~${item.criterionId}`, item]));
  const keywords = snapshot.keywords.map((item) => {
    const status = liveKeywords.get(`${item.adGroupId}~${item.criterionId}`);
    return status
      ? {
          ...item,
          status: status.status || item.status,
          qualityScore: status.qualityScore ?? item.qualityScore,
          creativeQuality: status.creativeQuality,
          landingPageQuality: status.landingPageQuality,
        }
      : item;
  });

  return { ...snapshot, campaigns, adGroups, ads, keywords, assets: live.assets?.length ? live.assets : snapshot.assets };
}

async function loadWorkspaceSnapshot(
  range: AdsRange,
  force: boolean,
): Promise<WorkspaceResult> {
  const rangeQuery = adsRangeQuery(range);
  const refresh = force ? "&refresh=1" : "";
  // Metrics: Airtable only. Live API: status / approvals overlay, best effort.
  const livePromise = withTimeout(
    getJson<WorkspaceSnapshot>(`/api/google-ads/workspace?${rangeQuery}${refresh}`),
    LIVE_STATUS_TIMEOUT_MS,
  );
  const inventoryPromise = getJson<{ campaigns?: Campaign[]; data?: Campaign[] }>(
    `/api/airtable/google-ads-campaigns`,
  ).catch(() => null);
  // Settle the optional requests now so a live-API failure is never an unhandled rejection.
  const optional = Promise.allSettled([livePromise, inventoryPromise]);
  const airtable = await getJson<WorkspaceSnapshot>(
    `/api/google-ads/airtable-workspace?${rangeQuery}${refresh}`,
  );

  const [live, inventory] = await optional;
  const campaignInventory = inventory.status === "fulfilled" ? inventory.value : null;
  let snapshot: WorkspaceSnapshot = {
    ...airtable,
    campaigns: mergeCampaignInventory(
      airtable.campaigns,
      campaignInventory?.campaigns || campaignInventory?.data || [],
    ),
    adGroups: airtable.adGroups.map(normalizeAdGroup),
    ads: airtable.ads.map(normalizeCreative),
    keywords: airtable.keywords.map(normalizeKeyword),
  };
  let statusError: string | null = null;
  if (live.status === "fulfilled") snapshot = overlayLiveStatus(snapshot, live.value);
  else statusError = live.reason instanceof Error ? live.reason.message : String(live.reason);
  // Inventory and live status can add zero-spend entities; count what is shown.
  snapshot.totals = {
    campaigns: snapshot.campaigns.length,
    adGroups: snapshot.adGroups.length,
    ads: snapshot.ads.length,
    keywords: snapshot.keywords.length,
    searchTerms: snapshot.searchTerms.length,
    assets: snapshot.assets.length,
  };

  return {
    snapshot: { ...snapshot, statusOverlayError: statusError },
    syncError: statusError,
  };
}

export async function fetchWorkspaceSnapshot(
  range: AdsRange,
  force = false,
  view?: "ads",
): Promise<WorkspaceResult> {
  const key = `${range.from}:${range.to}:${view || "full"}`;
  const cached = workspaceCache.get(key);
  if (!force && cached && cached.expiresAt > Date.now()) return cached;
  const pending = workspaceRequests.get(key);
  if (!force && pending) return pending;

  const request = loadWorkspaceSnapshot(range, force).then((result) => {
    workspaceCache.set(key, {
      ...result,
      expiresAt: Date.now() + WORKSPACE_CACHE_TTL_MS,
    });
    return result;
  });
  workspaceRequests.set(key, request);
  try {
    return await request;
  } finally {
    if (workspaceRequests.get(key) === request) workspaceRequests.delete(key);
  }
}

/** Where the numbers come from and how fresh they are. */
function SyncBadge({ snapshot, rangeTo }: { snapshot: WorkspaceSnapshot; rangeTo: string }) {
  const through = snapshot.sync?.dataThrough ?? null;
  const stale = !through || rangeTo > through;
  const label = through
    ? `Airtable · data through ${new Date(`${through}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
    : "Airtable · no Make sync recorded";
  return (
    <>
      <span
        className="flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold"
        style={{
          color: stale ? "var(--warning-text)" : "var(--success-text)",
          background: stale ? "var(--warning-bg)" : "var(--success-bg)",
        }}
        title={
          stale
            ? "The selected range goes past the last day Make imported. Run the Google Ads scenarios in Make for the missing days."
            : "Every number on this page comes from the Make to Airtable Google Ads tables."
        }
      >
        {stale ? <WifiOff size={11} /> : <Wifi size={11} />}
        {label}
      </span>
      {snapshot.statusOverlayError && (
        <span
          className="rounded-full px-2 py-1 text-[10px] font-bold"
          style={{ color: "var(--text-muted)", background: "var(--neutral-bg)" }}
          title={snapshot.statusOverlayError}
        >
          Live status unavailable
        </span>
      )}
    </>
  );
}

function AnalyticsInner({ routeTab }: { routeTab?: WorkspaceTab }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const requestedTab = searchParams.get("tab") as WorkspaceTab | null;
  const activeTab =
    routeTab ??
    (requestedTab && VALID_TABS.includes(requestedTab)
      ? requestedTab
      : "overview");
  const rangeKey = searchParams.toString();
  const range = useMemo(() => resolveAdsRange(new URLSearchParams(rangeKey)), [rangeKey]);
  const rangeSelection = useMemo(() => adsSelection(new URLSearchParams(rangeKey)), [rangeKey]);
  const days = range.days;
  const statusFilter = searchParams.get("status") || "";
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(null);

  const load = useCallback(
    async (quiet = false) => {
      if (quiet) setRefreshing(true);
      else setLoading(true);
      setFatalError(null);
      try {
        const result = await fetchWorkspaceSnapshot(range, quiet);
        setSnapshot(result.snapshot);
      } catch (error) {
        setFatalError(
          error instanceof Error
            ? error.message
            : "Google Ads data could not be loaded.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [range],
  );

  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    const refresh = () => void load(true);
    window.addEventListener(DASHBOARD_REFRESH_EVENT, refresh);
    return () => window.removeEventListener(DASHBOARD_REFRESH_EVENT, refresh);
  }, [load]);

  // `campaign` scopes child tabs to one campaign (like Google Ads); undefined keeps the current scope.
  const setTab = (tab: WorkspaceTab, status?: string, campaign?: string | null) => {
    const params = new URLSearchParams();
    for (const key of ["range", "days", "month", "from", "to"]) {
      const value = searchParams.get(key);
      if (value) params.set(key, value);
    }
    if (status) params.set("status", status);
    const scope = campaign === undefined ? searchParams.get("campaign") : campaign;
    if (scope) params.set("campaign", scope);
    router.push(`${TAB_ROUTES[tab]}?${params.toString()}`);
  };
  const setRange = (selection: DateRangeInput) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("days");
    for (const [key, value] of Object.entries(dateRangeParams("range", selection))) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
  const counts = useMemo(
    () =>
      snapshot
        ? `${snapshot.totals?.campaigns ?? snapshot.campaigns.length} campaigns · ${snapshot.totals?.adGroups ?? snapshot.adGroups.length} ad groups · ${snapshot.totals?.ads ?? snapshot.ads.length} ads`
        : "Connecting inventory",
    [snapshot],
  );

  return (
    <div className="space-y-5">
      <header
        className="flex flex-col gap-4 border-b pb-5 xl:flex-row xl:items-end xl:justify-between"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p
              className="text-[10px] font-bold uppercase tracking-[.18em]"
              style={{ color: "var(--brand-primary-strong)" }}
            >
              Harmony acquisition operations
            </p>
            {snapshot && <SyncBadge snapshot={snapshot} rangeTo={range.to} />}
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Google Ads workspace
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {counts}
          </p>
          {snapshot && (
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              {snapshot.accountName} · Last Make run{" "}
              {snapshot.sync?.lastRunAt ? new Date(snapshot.sync.lastRunAt).toLocaleString() : "unknown"} · {range.preset === "custom" || range.preset === "month" ? range.label : `${range.label} (${formatRangeLabel(range.from, range.to)})`}
            </p>
          )}
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto">
          <DateRangeFilter
            size="lg"
            value={rangeSelection}
            onChange={setRange}
            presets={ADS_DATE_PRESETS}
            maxDays={ADS_MAX_DAYS}
            label="Google Ads date range"
          />
          <button
            onClick={() => void load(true)}
            disabled={refreshing || loading}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold disabled:opacity-50 sm:flex-none"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--surface-1)",
            }}
          >
            {refreshing ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <RefreshCw size={15} />
            )}
            Refresh all
          </button>
        </div>
      </header>
      {fatalError && (
        <div
          className="flex gap-3 rounded-2xl border p-4"
          style={{
            color: "var(--danger-text)",
            background: "var(--danger-bg)",
            borderColor: "var(--danger-border)",
          }}
        >
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">Google Ads workspace could not load</p>
            <p className="mt-1 text-sm leading-6">{fatalError}</p>
            <button
              onClick={() => void load()}
              className="mt-3 rounded-lg border px-3 py-2 text-xs font-bold"
              style={{ borderColor: "var(--danger-border)" }}
            >
              Try again
            </button>
          </div>
        </div>
      )}
      {loading && !snapshot ? (
        <WorkspaceSkeleton />
      ) : (
        snapshot && (
          <GoogleAdsWorkspace
            snapshot={snapshot}
            activeTab={activeTab}
            setTab={setTab}
            statusFilter={statusFilter}
            campaignScope={searchParams.get("campaign") || ""}
            days={days}
          />
        )
      )}
    </div>
  );
}

export default function GoogleAdsAnalyticsClient({
  routeTab,
}: {
  routeTab?: WorkspaceTab;
}) {
  return (
    <Suspense
      fallback={
        <WorkspaceSkeleton />
      }
    >
      <AnalyticsInner routeTab={routeTab} />
    </Suspense>
  );
}
