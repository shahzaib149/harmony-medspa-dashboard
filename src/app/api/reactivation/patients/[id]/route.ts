import { requireRole, authErrorResponse } from "@/lib/auth/requireRole";
import { patientDetail, errorResponse, invalidateReactivationCampaignCache } from "@/lib/reactivation/server";
import { deletePatient } from "@/lib/reactivation/delete-patient";
import { revalidatePath } from "next/cache";
export const maxDuration=300;
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: {params:Promise<{id:string}>}) {
  try { await requireRole(request,"viewer"); } catch(error) { return authErrorResponse(error); }
  try { return Response.json(await patientDetail((await context.params).id),{headers:{"Cache-Control":"private, no-store"}}); }
  catch(error) { return errorResponse(error); }
}
export async function DELETE(request:Request,context:{params:Promise<{id:string}>}){
  try{await requireRole(request,"admin");}catch(e){return authErrorResponse(e);}
  let body:unknown;
  try{body=await request.json();}catch{return Response.json({error:"Invalid confirmation."},{status:400});}
  const confirmation=body&&typeof body==="object"&&"confirmation" in body?body.confirmation:null;
  try{
    const result=await deletePatient((await context.params).id,confirmation);
    invalidateReactivationCampaignCache();
    revalidatePath("/dashboard/dormant-patients");revalidatePath("/campaigns");
    revalidatePath("/campaigns/patient-reactivation");
    return Response.json(result);
  }catch(e){return errorResponse(e);}
}
