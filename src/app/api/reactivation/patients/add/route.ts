import { revalidatePath } from "next/cache";
import { requireRole, authErrorResponse } from "@/lib/auth/requireRole";
import { addPatients, parseAddPatients } from "@/lib/reactivation/patient-import";
import { errorResponse, invalidateReactivationCampaignCache } from "@/lib/reactivation/server";
import { MAX_IMPORT_BYTES } from "@/lib/reactivation/patient-input";
export const maxDuration=300;
export async function POST(request:Request){
  try{await requireRole(request,"editor");}catch(e){return authErrorResponse(e);}
  try{
    const text=await request.text();
    if(text.length>MAX_IMPORT_BYTES)return Response.json({error:"Import is too large. Split the CSV into smaller files."},{status:413});
    let raw:unknown;try{raw=JSON.parse(text);}catch{return Response.json({error:"Invalid request body."},{status:400});}
    const result=await addPatients(parseAddPatients(raw));
    invalidateReactivationCampaignCache();
    revalidatePath("/dashboard/dormant-patients");revalidatePath("/campaigns");
    return Response.json(result,{headers:{"Cache-Control":"private, no-store"}});
  }catch(e){return errorResponse(e);}
}
