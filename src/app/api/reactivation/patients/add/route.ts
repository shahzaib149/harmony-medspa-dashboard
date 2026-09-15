import { revalidatePath } from "next/cache";
import { requireRole, authErrorResponse } from "@/lib/auth/requireRole";
import { addPatients, parseAddPatients } from "@/lib/reactivation/patient-import";
import { errorResponse } from "@/lib/reactivation/server";
export const maxDuration=300;
export async function POST(request:Request){
  try{await requireRole(request,"editor");}catch(e){return authErrorResponse(e);}
  try{
    const text=await request.text();
    if(text.length>2_000_000)return Response.json({error:"Import is too large. Use at most 200 rows."},{status:413});
    let raw:unknown;try{raw=JSON.parse(text);}catch{return Response.json({error:"Invalid request body."},{status:400});}
    const result=await addPatients(parseAddPatients(raw));
    revalidatePath("/dashboard/dormant-patients");revalidatePath("/campaigns");
    return Response.json(result,{headers:{"Cache-Control":"private, no-store"}});
  }catch(e){return errorResponse(e);}
}
