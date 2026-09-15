import "server-only";
import { request, records, withEnrollmentLock, ReactivationError } from "./server";
import { textField, type AirtableRecord } from "@/lib/airtable/leads-base";
import { chunkAirtableRecords } from "@/lib/airtable/batch";
import { patientContactKeys, validatePatient, type PatientInput, type PatientImportResult, type LeadCandidate } from "./patient-input";
function identity(record:AirtableRecord){return {phone:textField(record.fields,"Phone"),email:textField(record.fields,"Email")};}
export async function leadCandidates():Promise<LeadCandidate[]> {
  const patients=await records("Patients");const keys=new Set(patients.flatMap(p=>patientContactKeys(identity(p))));
  const leads=await records("Leads");
  return leads.map(l=>({id:l.id,name:textField(l.fields,"Name")||"Unnamed lead",...identity(l),status:textField(l.fields,"Status"),alreadyPatient:patientContactKeys(identity(l)).some(k=>keys.has(k))||patients.some(p=>textField(p.fields,"Notes").includes("CRM lead: "+l.id))}));
}
export type AddPatientsRequest={mode:"manual"|"csv";patients:unknown[]}|{mode:"leads";leadIds:string[]};
export function parseAddPatients(value:unknown):AddPatientsRequest {
  if(!value||typeof value!=="object")throw new ReactivationError("Invalid request.",400);
  const v=value as Record<string,unknown>;
  if(v.mode==="leads"){
    if(!Array.isArray(v.leadIds)||!v.leadIds.length||v.leadIds.length>200||!v.leadIds.every(id=>typeof id==="string"&&/^rec\w{14}$/.test(id)))throw new ReactivationError("Select 1–200 valid leads.",400);
    return {mode:"leads",leadIds:[...new Set(v.leadIds)] as string[]};
  }
  if((v.mode!=="manual"&&v.mode!=="csv")||!Array.isArray(v.patients)||!v.patients.length||v.patients.length>(v.mode==="manual"?1:200))throw new ReactivationError("Provide up to 200 CSV rows, or one manual patient.",400);
  return {mode:v.mode,patients:v.patients};
}
export async function addPatients(input:AddPatientsRequest):Promise<PatientImportResult> {
  return withEnrollmentLock(async()=>{
    const result:PatientImportResult={created:0,skipped:[],failed:[]};
    const existing=await records("Patients");const keys=new Set(existing.flatMap(p=>patientContactKeys(identity(p))));
    let rows:{raw:unknown;leadId?:string}[];
    if(input.mode==="leads"){
      const leads=await records("Leads",new URLSearchParams({filterByFormula:`OR(${input.leadIds.map(id=>`RECORD_ID()='${id}'`).join(",")})`}));
      rows=input.leadIds.map(id=>{const l=leads.find(l=>l.id===id);if(!l)return {raw:null,leadId:id};const f=l.fields;return {leadId:id,raw:{name:textField(f,"Name"),...identity(l),status:["New","Contacted","Booked","Not Interested","Do Not Contact"].includes(textField(f,"Status"))?textField(f,"Status"):"New",smsConsent:f["SMS Consent"]===true,emailConsent:f["Email Consent"]===true,consentSource:textField(f,"Consent Source"),optedOut:f["Opted Out"]===true,doNotContact:f["Do Not Contact"]===true||textField(f,"Status")==="Do Not Contact",futureBooking:f["Future Booking"]===true}};});
    }else rows=input.patients.map(raw=>({raw}));
    const ready:{row:number;patient:PatientInput;leadId?:string}[]=[];
    rows.forEach(({raw,leadId},index)=>{
      const row=index+1;
      const rawName=raw&&typeof raw==="object"&&"name" in raw&&typeof raw.name==="string"?raw.name:"Row "+row;
      if(leadId&&existing.some(p=>textField(p.fields,"Notes").includes("CRM lead: "+leadId))){result.skipped.push({row,name:rawName,reason:"This lead is already in Patients"});return;}
      const {patient,errors}=validatePatient(raw);
      if(!patient){result.skipped.push({row,name:rawName,reason:raw===null?"Lead no longer available":errors.join("; ")});return;}
      const contact=patientContactKeys(patient);
      if(contact.some(k=>keys.has(k))){result.skipped.push({row,name:patient.name,reason:"A patient with this email or phone already exists (or appears earlier in this import)"});return;}
      contact.forEach(k=>keys.add(k));ready.push({row,patient,leadId});
    });
    const batches=chunkAirtableRecords(ready);const started=Date.now();
    for(let b=0;b<batches.length;b++){
      const batch=batches[b];
      try{
        if(Date.now()-started>180_000)throw new Error("Import time limit");
        const response=await request("Patients",{method:"POST",body:JSON.stringify({records:batch.map(({patient:p,leadId})=>({fields:{
          Name:p.name,Phone:p.phone,Email:p.email,"Last Visit Date":p.lastVisit||null,"Last Treatment":p.lastTreatment,Status:p.status,"SMS Consent":p.smsConsent,"Email Consent":p.emailConsent,"Consent Source":p.consentSource,"Opted Out":p.optedOut,"Do Not Contact":p.doNotContact,"Future Booking":p.futureBooking,Source:leadId?"Converted Lead":"Manual",Notes:leadId?"CRM lead: "+leadId:input.mode==="csv"?"Added via CRM CSV import.":"Added manually in CRM."
        }}))})});
        const created=await response.json() as {records:AirtableRecord[]};result.created+=created.records.length;
      }catch{
        let fresh:AirtableRecord[]|null=null;try{fresh=await records("Patients");}catch{/* Never retry an uncertain POST blindly. */}
        const freshKeys=new Set(fresh?.flatMap(p=>patientContactKeys(identity(p)))??[]);
        for(const entry of batch){if(patientContactKeys(entry.patient).some(k=>freshKeys.has(k)))result.created++;else result.failed.push({row:entry.row,name:entry.patient.name,reason:fresh?"Could not add this patient. Retry this row.":"Save outcome is unconfirmed. Refresh Patients before retrying."});}
        for(const entry of batches.slice(b+1).flat())result.failed.push({row:entry.row,name:entry.patient.name,reason:"Not processed after a service error; retry this row."});
        break;
      }
    }
    return result;
  });
}
