import { revalidateTag } from "next/cache";
import { isAirtableConfigured } from "@/lib/airtable/config";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { emptyCampaignsOverview, loadCampaignsOverview } from "@/lib/campaigns/overview";
import { bustCachePrefix } from "@/lib/server-cache";

export const dynamic = "force-dynamic";

/**
 * Every campaign card's summary. Each section loads on its own: one slow or failing
 * Airtable read shows as "Couldn't load" on that card instead of failing the page.
 * ?refresh=1 (the Refresh button) expires the cached summaries so this read is fresh.
 */
export async function GET(request: Request) {
  try {
    await requireRole(request, "viewer");
  } catch (error) {
    return authErrorResponse(error);
  }
  if (!isAirtableConfigured()) return Response.json({ ...emptyCampaignsOverview(), configured: false });
  if (new URL(request.url).searchParams.get("refresh") === "1") {
    bustCachePrefix("campaigns:");
    revalidateTag("campaigns", { expire: 0 });
  }
  return Response.json(await loadCampaignsOverview(), { headers: { "Cache-Control": "private, no-store" } });
}
