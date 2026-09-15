import { requireRole, authErrorResponse } from "@/lib/auth/requireRole";
import { leadCandidates } from "@/lib/reactivation/patient-import";
import { errorResponse } from "@/lib/reactivation/server";
export const dynamic="force-dynamic";
export async function GET(request:Request){
  try{await requireRole(request,"editor");}catch(e){return authErrorResponse(e);}
  try{return Response.json({leads:await leadCandidates()},{headers:{"Cache-Control":"private, no-store"}});}catch(e){return errorResponse(e);}
}
