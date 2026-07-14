import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { airtableFetch, linkedIds, listRecords, mapLead } from "@/lib/airtable/leads-base";
export const dynamic="force-dynamic";
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 try{await requireRole(request,"editor")}catch(error){return authErrorResponse(error)}const{id}=await params;if(!/^rec[a-zA-Z0-9]+$/.test(id))return Response.json({error:"Invalid Lead ID"},{status:400});
 try{const [leadResponse,enrollments,messages]=await Promise.all([airtableFetch(`${encodeURIComponent("Leads")}/${id}`),listRecords("Nurture Enrollments"),listRecords("Message Log")]);if(!leadResponse.ok)return Response.json({error:"Lead not found"},{status:404});const lead=mapLead(await leadResponse.json());const relatedEnrollments=enrollments.filter(item=>linkedIds(item.fields.Lead).includes(id));const relatedMessages=messages.filter(item=>linkedIds(item.fields["Recipient Lead"]).includes(id));return Response.json({lead:{id:lead.id,name:lead.name},nurtureEnrollments:relatedEnrollments.length,messageLogs:relatedMessages.length,activeCampaign:relatedEnrollments.some(item=>item.fields.Status==="Active")?"14-Day Nurture · Active":"None"})}catch{return Response.json({error:"Could not calculate deletion impact"},{status:500})}
}
