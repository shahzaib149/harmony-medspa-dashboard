import { revalidateTag } from "next/cache";
import { isAirtableConfigured } from "@/lib/airtable/config";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { cachedGiftCardWorkspace } from "@/lib/black-friday/server";

export const dynamic = "force-dynamic";

/** Gift Card Requests workspace: requests, statuses and confirmation messages. ?refresh=1 forces a fresh read. */
export async function GET(request: Request) {
  try {
    await requireRole(request, "viewer");
  } catch (error) {
    return authErrorResponse(error);
  }
  if (!isAirtableConfigured()) return Response.json({ error: "Airtable is not configured." }, { status: 503 });
  try {
    if (new URL(request.url).searchParams.get("refresh") === "1") revalidateTag("campaigns", { expire: 0 });
    return Response.json(await cachedGiftCardWorkspace(), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[campaigns] gift-cards workspace failed", error);
    return Response.json({ error: "Gift card data could not be loaded." }, { status: 503 });
  }
}
