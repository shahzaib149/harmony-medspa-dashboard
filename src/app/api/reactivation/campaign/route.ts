import { requireRole, authErrorResponse } from "@/lib/auth/requireRole";
import { cachedCampaignWorkspace, errorResponse } from "@/lib/reactivation/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireRole(request, "viewer");
  } catch (error) {
    return authErrorResponse(error);
  }
  const forceRefresh = new URL(request.url).searchParams.get("refresh") === "1";
  try {
    return Response.json(await cachedCampaignWorkspace(forceRefresh), {
      headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
