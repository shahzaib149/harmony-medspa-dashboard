import { requireRole, authErrorResponse } from "@/lib/auth/requireRole";
import { campaignWorkspace, errorResponse } from "@/lib/reactivation/server";
export const dynamic="force-dynamic";
export async function GET(request:Request){
  try{await requireRole(request,"viewer");}catch(e){return authErrorResponse(e);}
  try{return Response.json(await campaignWorkspace(),{headers:{"Cache-Control":"private, no-store"}});}catch(e){return errorResponse(e);}
}
