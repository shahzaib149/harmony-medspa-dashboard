import { requireRole, authErrorResponse } from "@/lib/auth/requireRole";
import { workspace, errorResponse } from "@/lib/reactivation/server";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try { await requireRole(request,"viewer"); } catch(error) { return authErrorResponse(error); }
  try { return Response.json(await workspace(new URL(request.url).searchParams.get("scope") === "all"), {headers:{"Cache-Control":"private, no-store"}}); }
  catch(error) { return errorResponse(error); }
}
