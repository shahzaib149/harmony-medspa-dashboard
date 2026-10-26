import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import {
  fetchWebsiteAnalytics,
  GoogleAnalyticsConfigurationError,
  isSafeAnalyticsHostname,
  websiteAnalyticsErrorMessage,
} from "@/lib/google/analytics-client";
import { resolveAnalyticsRange } from "@/lib/google/analytics-range";

export async function GET(request: Request) {
  try {
    await requireRole(request, "viewer");
  } catch (error) {
    return authErrorResponse(error);
  }

  const { searchParams } = new URL(request.url);
  const rangeResult = resolveAnalyticsRange(searchParams);
  if (!rangeResult.ok) {
    return Response.json({ error: rangeResult.error }, { status: 400 });
  }
  const { from, to } = rangeResult.range;
  const requestedHostname = searchParams.get("hostname")?.trim().toLowerCase();
  const hostname =
    !requestedHostname || requestedHostname === "all" ? null : requestedHostname;
  if (hostname && !isSafeAnalyticsHostname(hostname)) {
    return Response.json(
      { error: "Invalid website hostname." },
      { status: 400 },
    );
  }

  try {
    const snapshot = await fetchWebsiteAnalytics(
      { from, to },
      hostname,
      searchParams.get("refresh") === "1",
    );
    return Response.json(snapshot, {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    if (error instanceof GoogleAnalyticsConfigurationError) {
      return Response.json(
        {
          error: "Website Analytics is ready for connection.",
          code: "GA4_NOT_CONFIGURED",
          missing: error.missing,
        },
        { status: 503 },
      );
    }
    console.error("/api/google-analytics/overview error:", error);
    return Response.json(
      {
        error: websiteAnalyticsErrorMessage(error),
        code: "GA4_UNAVAILABLE",
      },
      { status: 502 },
    );
  }
}
