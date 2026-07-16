import { randomUUID } from "node:crypto";
import { getOverviewData } from "@/lib/overview-data";
import type { OverviewPeriodKey } from "@/lib/overview-types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const requestId = request.headers.get("x-request-id")?.slice(0, 128) || randomUUID();
  const params = new URL(request.url).searchParams;
  const requestedPeriod = params.get("range") ?? params.get("period");
  const supported = new Set<OverviewPeriodKey>(["7d", "30d", "90d", "month"]);
  const period: OverviewPeriodKey = supported.has(requestedPeriod as OverviewPeriodKey)
    ? (requestedPeriod as OverviewPeriodKey)
    : "30d";

  try {
    const data = await getOverviewData(request, period);
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
