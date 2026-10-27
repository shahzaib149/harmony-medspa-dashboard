import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { buildAirtableWorkspace } from "@/lib/google/ads-airtable";
import { adsReportingRange } from "@/lib/google/ads-range";
import type { WorkspaceSnapshot } from "@/app/google-ads-analytics/workspace-types";

/**
 * Google Ads workspace built only from the Make → Airtable daily tables.
 * This is the single source of performance numbers for every Google Ads view.
 */
const TTL_MS = 2 * 60 * 1000;
const cache = new Map<string, { expiresAt: number; data: WorkspaceSnapshot }>();
const pending = new Map<string, Promise<WorkspaceSnapshot>>();

async function cachedWorkspace(from: string, to: string, refresh: boolean, includeSearchTerms: boolean) {
  const key = `${from}:${to}:${includeSearchTerms ? "terms" : "core"}`;
  if (refresh) cache.delete(key);
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.data;
  const active = pending.get(key);
  if (active && !refresh) return active;
  const request = buildAirtableWorkspace({ from, to }, { forceRefresh: refresh, includeSearchTerms }).then((data) => {
    cache.set(key, { data, expiresAt: Date.now() + TTL_MS });
    return data;
  });
  pending.set(key, request);
  try {
    return await request;
  } finally {
    if (pending.get(key) === request) pending.delete(key);
  }
}

/** Same contract as /api/google-ads/workspace?view=ads so the Ads table can page server-side. */
function paginatedAds(data: WorkspaceSnapshot, searchParams: URLSearchParams): WorkspaceSnapshot {
  const requestedSize = Number(searchParams.get("pageSize") || 25);
  const pageSize: 25 | 50 | 100 = [25, 50, 100].includes(requestedSize)
    ? (requestedSize as 25 | 50 | 100)
    : 25;
  const page = Math.max(0, Number(searchParams.get("page") || 0) || 0);
  const search = (searchParams.get("search") || "").trim().toLowerCase();
  const status = (searchParams.get("status") || "").trim().toUpperCase();
  const campaign = searchParams.get("campaign") || "";
  const adGroup = searchParams.get("adGroup") || "";
  const sort = searchParams.get("sort") || "spend";
  const filtered = data.ads.filter((item) => {
    const haystack = `${item.adName} ${item.adId} ${item.campaignName} ${item.adGroupName} ${item.headlines} ${item.finalUrl}`.toLowerCase();
    const state = `${item.status} ${item.primaryStatus ?? ""} ${item.approvalStatus ?? ""} ${item.reviewStatus ?? ""}`.toUpperCase();
    return (
      (!search || haystack.includes(search)) &&
      (!status || status.split(/\s+/).every((token) => state.includes(token))) &&
      (!campaign || item.campaignName === campaign || item.campaignId === campaign) &&
      (!adGroup || item.adGroupId === adGroup)
    );
  });
  filtered.sort((left, right) => {
    const difference =
      sort === "name"
        ? left.adName.localeCompare(right.adName)
        : sort === "clicks"
          ? right.clicks - left.clicks
          : sort === "conversions"
            ? right.conversions - left.conversions
            : right.cost - left.cost;
    return difference || left.adId.localeCompare(right.adId);
  });
  const safePage = Math.min(page, Math.max(0, Math.ceil(filtered.length / pageSize) - 1));
  return {
    ...data,
    ads: filtered.slice(safePage * pageSize, (safePage + 1) * pageSize),
    pagination: { entity: "ads", page: safePage, pageSize, total: filtered.length },
  };
}

export async function GET(request: Request) {
  try {
    await requireRole(request, "viewer");
  } catch (error) {
    return authErrorResponse(error);
  }
  const { searchParams } = new URL(request.url);
  const { from, to } = adsReportingRange(searchParams);
  try {
    const view = searchParams.get("view");
    const workspace = await cachedWorkspace(from, to, searchParams.get("refresh") === "1", view === "search-terms");
    if (view === "search-terms") {
      return Response.json(
        { searchTerms: workspace.searchTerms, dateRange: workspace.dateRange },
        { headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=120" } },
      );
    }
    return Response.json(
      searchParams.get("view") === "ads" ? paginatedAds(workspace, searchParams) : workspace,
      { headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=120" } },
    );
  } catch (error) {
    console.error("/api/google-ads/airtable-workspace error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Google Ads data could not be loaded from Airtable." },
      { status: 502 },
    );
  }
}
