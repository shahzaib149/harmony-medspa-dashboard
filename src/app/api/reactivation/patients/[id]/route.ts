import { requireRole, authErrorResponse } from "@/lib/auth/requireRole";
import { patientDetail, errorResponse } from "@/lib/reactivation/server";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: {params:Promise<{id:string}>}) {
  try { await requireRole(request,"viewer"); } catch(error) { return authErrorResponse(error); }
  try { return Response.json(await patientDetail((await context.params).id),{headers:{"Cache-Control":"private, no-store"}}); }
  catch(error) { return errorResponse(error); }
}
