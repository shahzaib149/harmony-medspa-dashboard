import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { fetchGoogleAdsWorkspace } from "@/lib/google/ads-client";

const WORKSPACE_TTL_MS = 2 * 60 * 1000;
type WorkspacePayload = Awaited<ReturnType<typeof fetchGoogleAdsWorkspace>>;
const workspaceCache = new Map<
  string,
  { expiresAt: number; data: WorkspacePayload }
>();
const workspaceRequests = new Map<string, Promise<WorkspacePayload>>();

async function cachedWorkspace(
  from: string,
  to: string,
  refresh: boolean,
  view: string,
) {
  const includeSearchTerms = view === "search-terms";
  const includeAssets = view === "assets";
  const scope = includeSearchTerms
    ? includeAssets
      ? "secondary"
      : "search-terms"
    : includeAssets
      ? "assets"
      : "core";
  const key = `${from}:${to}:${scope}`;
  if (refresh) workspaceCache.delete(key);
  const cached = workspaceCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.data;
  const active = workspaceRequests.get(key);
  if (active && !refresh) return active;

  const request = fetchGoogleAdsWorkspace(from, to, {
    includeSearchTerms,
    includeAssets,
  }).then((data) => {
    workspaceCache.set(key, {
      data,
      expiresAt: Date.now() + WORKSPACE_TTL_MS,
    });
    return data;
  });
  workspaceRequests.set(key, request);
  try {
    return await request;
  } finally {
    if (workspaceRequests.get(key) === request) workspaceRequests.delete(key);
  }
}

function paginatedAds(
  data: WorkspacePayload,
  searchParams: URLSearchParams,
): WorkspacePayload & {
  pagination: { entity: "ads"; page: number; pageSize: 25 | 50 | 100; total: number };
  totals: Record<"campaigns" | "adGroups" | "ads" | "keywords" | "searchTerms" | "assets", number>;
} {
  const requestedSize = Number(searchParams.get("pageSize") || 25);
  const pageSize: 25 | 50 | 100 = [25, 50, 100].includes(requestedSize)
    ? (requestedSize as 25 | 50 | 100)
    : 25;
  const page = Math.max(0, Number(searchParams.get("page") || 0) || 0);
  const search = (searchParams.get("search") || "").trim().toLowerCase();
  const status = (searchParams.get("status") || "").trim().toUpperCase();
  const campaign = searchParams.get("campaign") || "";
  const sort = searchParams.get("sort") || "spend";
  const filtered = data.ads.filter((item) => {
    const haystack = `${item.adName} ${item.adId} ${item.resourceName} ${item.campaignName} ${item.adGroupName} ${item.finalUrl}`.toLowerCase();
    const state = `${item.status} ${item.primaryStatus} ${item.approvalStatus} ${item.reviewStatus}`.toUpperCase();
    return (
      (!search || haystack.includes(search)) &&
      (!status || status.split(/\s+/).every((token) => state.includes(token))) &&
      (!campaign || item.campaignName === campaign)
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
    totals: {
      campaigns: data.campaigns.length,
      adGroups: data.adGroups.length,
      ads: data.ads.length,
      keywords: data.keywords.length,
      searchTerms: data.searchTerms.length,
      assets: data.assets.length,
    },
    pagination: {
      entity: "ads",
      page: safePage,
      pageSize,
      total: filtered.length,
    },
  };
}

function dateRange(days: number) {
  const safeDays = [7, 14, 30, 90].includes(days) ? days : 30;
  const to = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - safeDays * 86_400_000)
    .toISOString()
    .slice(0, 10);
  return { from, to };
}

export async function GET(request: Request) {
  try {
    await requireRole(request, "viewer");
  } catch (error) {
    return authErrorResponse(error);
  }

  const missing = [
    !process.env.GOOGLE_ADS_CLIENT_ID && "GOOGLE_ADS_CLIENT_ID",
    !process.env.GOOGLE_ADS_CLIENT_SECRET && "GOOGLE_ADS_CLIENT_SECRET",
    !process.env.GOOGLE_ADS_DEVELOPER_TOKEN && "GOOGLE_ADS_DEVELOPER_TOKEN",
    !process.env.GOOGLE_ADS_REFRESH_TOKEN && "GOOGLE_ADS_REFRESH_TOKEN",
    !process.env.GOOGLE_ADS_CUSTOMER_ID && "GOOGLE_ADS_CUSTOMER_ID",
  ].filter(Boolean);
  if (missing.length) {
    return Response.json(
      { error: `Live inventory unavailable. Missing: ${missing.join(", ")}` },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") || "core";
  const { from, to } = dateRange(Number(searchParams.get("days") ?? 30));
  try {
    const workspace = await cachedWorkspace(
      from,
      to,
      searchParams.get("refresh") === "1",
      view,
    );
    return Response.json(
      view === "ads"
        ? paginatedAds(workspace, searchParams)
        : workspace,
      {
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    console.error("/api/google-ads/workspace error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Google Ads inventory failed" },
      { status: 502 },
    );
  }
}
