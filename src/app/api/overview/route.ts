import { randomUUID } from "node:crypto";
import { getOverviewData } from "@/lib/overview-data";
import { overviewQueryFromParams, resolveOverviewRange } from "@/lib/overview-range";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { withCache, bustCache } from "@/lib/server-cache";
import { invalidateLeadsBaseCache } from "@/lib/airtable/leads-base";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Cache overview data for 60 s per period key.
// The manual Refresh button sends x-force-refresh: 1 to bypass.
const OVERVIEW_TTL = 60;

export async function GET(request: Request) {
  try { await requireRole(request, "viewer"); } catch (error) { return authErrorResponse(error); }
  const requestId = request.headers.get("x-request-id")?.slice(0, 128) || randomUUID();
  const params = new URL(request.url).searchParams;
  // Resolve once so the cache key and the data agree (e.g. "range=last-month").
  const range = resolveOverviewRange(params);
  const period = overviewQueryFromParams(params);

  // Allow the Refresh button to force a fresh fetch
  const forceRefresh = request.headers.get("x-force-refresh") === "1";
  const cacheKey = `overview:${period}`;
  if (forceRefresh) {
    bustCache(cacheKey);
    invalidateLeadsBaseCache();
  }

  try {
    const data = await withCache(cacheKey, OVERVIEW_TTL, () =>
      getOverviewData(request, period, range),
    );
    return Response.json(data, {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "X-Request-Id": requestId,
      },
    });
  } catch {
    return Response.json(
      {
        success: false,
        code: "OVERVIEW_UNAVAILABLE",
        message: "Overview data could not be loaded.",
        retryable: true,
        requestId,
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
          "X-Request-Id": requestId,
        },
      },
    );
  }
}
