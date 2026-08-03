"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
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

export type { AdGroup, Campaign, Creative, Keyword } from "./workspace-types";

type AdPreviewRecord = {
  id: string;
  adId: string;
  resourceName?: string;
  adGroupAdResourceName?: string;
  adGroupId?: string;
  adName?: string;
  adType?: string;
  status?: string;
  headlines?: string;
  descriptions?: string;
  finalUrl?: string;
  targetUrl?: string;
  lastSynced?: string;
};

const VALID_TABS: WorkspaceTab[] = [
  "overview",
  "campaigns",
  "ad-groups",
  "ads",
  "keywords",
  "workflow",
  "ai-suggestions",
];

const TAB_ROUTES: Record<WorkspaceTab, string> = {
  overview: "/google-ads-analytics",
  campaigns: "/google-ads-analytics/campaigns",
  "ad-groups": "/google-ads-analytics/ad-groups",
  ads: "/google-ads-analytics/ads",
  keywords: "/google-ads-analytics/keywords",
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

function canonicalAdKey(
  ad: Pick<
    Creative,
    "resourceName" | "adGroupAdResourceName" | "adId" | "adGroupId"
  >,
) {
  return (
    ad.adGroupAdResourceName ||
    ad.resourceName ||
    (ad.adId && ad.adGroupId ? `${ad.adGroupId}~${ad.adId}` : ad.adId)
  );
}

function mergeAdInventory(
  analytics: Creative[],
  previews: AdPreviewRecord[],
  adGroups: AdGroup[],
  campaigns: Campaign[],
) {
  const groupsById = new Map(adGroups.map((group) => [group.adGroupId, group]));
  const ads = new Map<string, Creative>();
  for (const raw of analytics) {
    const ad = normalizeCreative(raw);
    ads.set(canonicalAdKey(ad) || ad.id, ad);
  }
  for (const preview of previews) {
    const relation = (
      preview.adGroupAdResourceName ||
      preview.resourceName ||
      ""
    ).match(/\/adGroupAds\/(\d+)~(\d+)$/);
    const adGroupId = preview.adGroupId || relation?.[1] || "";
    const adId = preview.adId || relation?.[2] || "";
    const key =
      preview.adGroupAdResourceName ||
      preview.resourceName ||
      (adGroupId && adId ? `${adGroupId}~${adId}` : adId || preview.id);
    const current =
      ads.get(key) ||
      [...ads.values()].find(
        (ad) => ad.adId === adId && (!adGroupId || ad.adGroupId === adGroupId),
      );
    const group = groupsById.get(adGroupId);
    if (current) {
      const merged = normalizeCreative({
        ...current,
        resourceName:
          current.resourceName ||
          preview.resourceName ||
          preview.adGroupAdResourceName,
        adGroupAdResourceName:
          current.adGroupAdResourceName ||
          preview.adGroupAdResourceName ||
          preview.resourceName,
        adGroupId: current.adGroupId || adGroupId,
        adName: current.adName || preview.adName || `Ad ${adId}`,
        adType: current.adType || preview.adType || "UNKNOWN",
        status: current.status || preview.status,
        headlines: current.headlines || preview.headlines || "",
        descriptions: current.descriptions || preview.descriptions || "",
        finalUrl:
          current.finalUrl || preview.finalUrl || preview.targetUrl || "",
        displayUrl:
          current.displayUrl || preview.finalUrl || preview.targetUrl || "",
        lastSynced: current.lastSynced || preview.lastSynced,
      });
      ads.delete(canonicalAdKey(current) || current.id);
      ads.set(canonicalAdKey(merged) || merged.id, merged);
      continue;
    }
    const campaign = group
      ? campaigns.find((item) => item.campaignId === group.campaignId)
      : undefined;
    const resourceName =
      preview.adGroupAdResourceName || preview.resourceName || "";
    const inventoryAd = normalizeCreative({
      id: resourceName || preview.id,
      adId,
      resourceName,
      adGroupAdResourceName: resourceName,
      adName: preview.adName || `Ad ${adId}`,
      adType: preview.adType || "UNKNOWN",
      campaignId: campaign?.campaignId || group?.campaignId || "",
      campaignResourceName:
        campaign?.resourceName || group?.campaignResourceName,
      campaignName: campaign?.campaignName || group?.campaignName || "",
      adGroupId,
      adGroupResourceName: group?.resourceName,
      adGroupName:
        group?.adGroupName || (adGroupId ? `Ad group ${adGroupId}` : ""),
      status: preview.status || "UNKNOWN",
      cost: 0,
      clicks: 0,
      impressions: 0,
      ctrPct: 0,
      conversions: 0,
      conversionValue: 0,
      conversionValueAvailable: false,
      roas: 0,
      date: "",
      creativeTagSuggestions: "",
      headlines: preview.headlines || "",
      descriptions: preview.descriptions || "",
      finalUrl: preview.finalUrl || preview.targetUrl || "",
      displayUrl: preview.finalUrl || preview.targetUrl || "",
      path1: "",
      path2: "",
      lastSynced: preview.lastSynced,
      publishSource: "Google Ad Preview inventory",
    });
    ads.set(canonicalAdKey(inventoryAd) || inventoryAd.id, inventoryAd);
  }
  return [...ads.values()];
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

async function loadWorkspaceSnapshot(
  days: number,
  force: boolean,
  view?: "ads",
): Promise<WorkspaceResult> {
  const viewQuery = view ? `&view=${view}&page=0&pageSize=25&sort=spend` : "";
  const livePromise = getJson<WorkspaceSnapshot>(
    `/api/google-ads/workspace?days=${days}${viewQuery}${force ? "&refresh=1" : ""}`,
  );
  const airtableCampaignsPromise = getJson<{ campaigns?: Campaign[]; data?: Campaign[] }>(
    `/api/airtable/campaigns`,
  ).catch(() => null);
  const airtableAdGroupsPromise = getJson<{ adGroups?: AdGroup[]; data?: AdGroup[] }>(
    `/api/airtable/ad-groups`,
  ).catch(() => null);

  try {
    const [live, airtableCamps, airtableGroups] = await Promise.all([
      livePromise,
      airtableCampaignsPromise,
      airtableAdGroupsPromise,
    ]);

    const campaigns = (
      (live.campaigns && live.campaigns.length > 0 ? live.campaigns : null) ||
      airtableCamps?.campaigns ||
      airtableCamps?.data ||
      []
    ).map(normalizeCampaign);

    const adGroups = (
      (live.adGroups && live.adGroups.length > 0 ? live.adGroups : null) ||
      airtableGroups?.adGroups ||
      airtableGroups?.data ||
      []
    ).map(normalizeAdGroup);

    return {
      snapshot: {
        ...live,
        campaigns,
        adGroups,
        ads: mergeAdInventory(
          live.ads || [],
          [],
          adGroups,
          campaigns,
        ),
        keywords: (live.keywords || []).map(normalizeKeyword),
        searchTerms: live.searchTerms || [],
        assets: live.assets || [],
      },
      syncError: null,
    };
  } catch (liveError) {
    const [campaigns, adGroups, ads, keywords, previews] = await Promise.all([
      getJson<{ campaigns?: Campaign[]; data?: Campaign[] }>(
        `/api/airtable?table=campaigns&days=${days}`,
      ),
      getJson<{ adGroups?: AdGroup[]; data?: AdGroup[] }>(
        `/api/airtable?table=ad-groups&days=${days}`,
      ),
      getJson<{ data?: Creative[] }>(
        `/api/airtable?table=creatives&days=${days}`,
      ),
      getJson<{ data?: Keyword[] }>(
        `/api/airtable?table=keywords&days=${days}`,
      ),
      getJson<{ data?: AdPreviewRecord[] }>(
        `/api/airtable?table=ad-preview&days=${days}`,
      ),
    ]);
    const campaignRows = (
      campaigns.campaigns ||
      campaigns.data ||
      []
    ).map(normalizeCampaign);
    const adGroupRows = (
      adGroups.adGroups ||
      adGroups.data ||
      []
    ).map(normalizeAdGroup);
    return {
      snapshot: {
        source: "airtable",
        accountName: campaignRows[0]?.accountName || "Harmony MedSpa",
        fetchedAt: new Date().toISOString(),
        campaigns: campaignRows,
        adGroups: adGroupRows,
        ads: mergeAdInventory(
          ads.data || [],
          previews.data || [],
          adGroupRows,
          campaignRows,
        ),
        keywords: (keywords.data || []).map(normalizeKeyword),
        searchTerms: [],
        assets: [],
      },
      syncError:
        liveError instanceof Error ? liveError.message : String(liveError),
    };
  }
}

export async function fetchWorkspaceSnapshot(
  days: number,
  force = false,
  view?: "ads",
): Promise<WorkspaceResult> {
  const key = `${days}:${view || "full"}`;
  const cached = workspaceCache.get(key);
  if (!force && cached && cached.expiresAt > Date.now()) return cached;
  const pending = workspaceRequests.get(key);
  if (!force && pending) return pending;

  const request = loadWorkspaceSnapshot(days, force, view).then((result) => {
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
  const requestedDays = Number(searchParams.get("days") ?? 30);
  const days = [7, 14, 30, 90].includes(requestedDays) ? requestedDays : 30;
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
        const result = await fetchWorkspaceSnapshot(
          days,
          quiet,
          activeTab === "ads" ? activeTab : undefined,
        );
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
    [activeTab, days],
  );

  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    const refresh = () => void load(true);
    window.addEventListener(DASHBOARD_REFRESH_EVENT, refresh);
    return () => window.removeEventListener(DASHBOARD_REFRESH_EVENT, refresh);
  }, [load]);

  const setTab = (tab: WorkspaceTab, status?: string) => {
    const params = new URLSearchParams();
    params.set("days", String(days));
    if (status) params.set("status", status);
    router.push(`${TAB_ROUTES[tab]}?${params.toString()}`);
  };
  const setDays = (value: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("days", String(value));
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
            {snapshot && (
              <span
                className="flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold"
                style={{
                  color:
                    snapshot.source === "live"
                      ? "var(--success-text)"
                      : "var(--warning-text)",
                  background:
                    snapshot.source === "live"
                      ? "var(--success-bg)"
                      : "var(--warning-bg)",
                }}
              >
                {snapshot.source === "live" ? (
                  <Wifi size={11} />
                ) : (
                  <WifiOff size={11} />
                )}
                {snapshot.source === "live"
                  ? "Live Google Ads"
                  : "Airtable fallback"}
              </span>
            )}
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Google Ads workspace
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {counts}
          </p>
          {snapshot && (
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              {snapshot.accountName} · Last synchronized{" "}
              {new Date(snapshot.fetchedAt).toLocaleString()} · Selected range {days} days
            </p>
          )}
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto">
          <div
            className="flex max-w-full flex-1 items-center rounded-xl border p-1 sm:flex-none"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--surface-1)",
            }}
            role="group"
            aria-label="Google Ads date range"
          >
            <CalendarDays
              size={14}
              className="ml-2"
              style={{ color: "var(--text-muted)" }}
            />
            {[7, 14, 30, 90].map((value) => (
              <button
                key={value}
                onClick={() => setDays(value)}
                aria-pressed={days === value}
                className="min-h-11 min-w-11 flex-1 rounded-lg px-2 text-xs font-bold sm:flex-none"
                style={{
                  background:
                    days === value
                      ? "var(--brand-primary-soft)"
                      : "transparent",
                  color:
                    days === value
                      ? "var(--brand-primary-strong)"
                      : "var(--text-muted)",
                }}
              >
                {value}d
              </button>
            ))}
          </div>
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
