import { requireRole, authErrorResponse } from "@/lib/auth/requireRole";
import { campaignMetrics, errorResponse } from "@/lib/reactivation/server";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try { await requireRole(request,"viewer"); } catch(error) { return authErrorResponse(error); }
  try { return Response.json(await campaignMetrics(),{headers:{"Cache-Control":"private, no-store"}}); }
  catch(error) { return errorResponse(error); }
}
