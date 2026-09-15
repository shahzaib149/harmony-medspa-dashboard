import "server-only";
import { request, records, ReactivationError, withEnrollmentLock } from "./server";
import { linkedIds, textField, type AirtableRecord } from "@/lib/airtable/leads-base";
import { chunkAirtableRecords } from "@/lib/airtable/batch";

// Only the patient record is deleted. Historical enrollments and messages remain.
export async function deletePatient(id:string,confirmation:unknown) {
  if(!/^rec[a-zA-Z0-9]{14}$/.test(id))throw new ReactivationError("Invalid patient ID.",400);
  if(confirmation!=="DELETE")throw new ReactivationError("Type DELETE to confirm permanent deletion.",400);
  return withEnrollmentLock(async()=>{
    const patient=await (await request("Patients/"+id)).json() as AirtableRecord;
    if(patient.id!==id)throw new ReactivationError("Patient could not be verified.",409);
    const linked=(await records("Reactivation Enrollments")).filter(e=>linkedIds(e.fields.Patient).includes(id));
    // Clear every queued send, including inconsistent historical rows, before deleting.
    const pending=linked.filter(e=>["Active","Paused"].includes(textField(e.fields,"Status"))||textField(e.fields,"Next Send At"));
    for(const batch of chunkAirtableRecords(pending)) {
      await request(encodeURIComponent("Reactivation Enrollments"),{method:"PATCH",body:JSON.stringify({records:batch.map(e=>({id:e.id,fields:{Status:"Stopped","Stop Reason":"Manual","Next Send At":null}}))})});
    }
    const verified=(await records("Reactivation Enrollments")).filter(e=>linkedIds(e.fields.Patient).includes(id));
    if(verified.some(e=>["Active","Paused"].includes(textField(e.fields,"Status"))||textField(e.fields,"Next Send At")))throw new ReactivationError("An enrollment is still scheduled. Patient was not deleted. Refresh and retry.",409);
    await request("Patients/"+id,{method:"DELETE"});
    return {deleted:true,stopped:pending.length};
  });
}
