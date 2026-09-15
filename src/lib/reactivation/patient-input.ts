import { DateTime } from "luxon";
import { CLINIC_ZONE } from "./model";
export const PATIENT_STATUSES = ["New","Contacted","Replied","Booked","Not Interested","Do Not Contact"] as const;
export const PATIENT_SOURCES = ["PatientNow Import","Manual","Converted Lead"] as const;
export const MAX_IMPORT_ROWS = 2000;
export const MAX_IMPORT_BYTES = 5_000_000;
export type PatientInput = { name:string; firstName:string; source:string; notes:string; phone:string; email:string; lastVisit:string; lastTreatment:string; status:string; smsConsent:boolean; emailConsent:boolean; consentSource:string; optedOut:boolean; doNotContact:boolean; futureBooking:boolean };
export type PatientImportResult = { created:number; skipped:{row:number;name:string;reason:string}[]; failed:{row:number;name:string;reason:string}[] };
export type LeadCandidate = {id:string;name:string;phone:string;email:string;status:string;alreadyPatient:boolean};
export const emptyPatient:PatientInput={name:"",firstName:"",source:"",notes:"",phone:"",email:"",lastVisit:"",lastTreatment:"",status:"New",smsConsent:false,emailConsent:false,consentSource:"",optedOut:false,doNotContact:false,futureBooking:false};
export function phoneKey(value:string) {
  const digits=value.replace(/\D/g,"");return digits.length===10?"1"+digits:digits;
}
export function patientContactKeys(value:{email:string;phone:string}) {
  return [value.email.trim()?"email:"+value.email.trim().toLowerCase():"",value.phone.trim()?"phone:"+phoneKey(value.phone):""].filter(Boolean);
}
export function validatePatient(value:unknown):{patient:PatientInput|null;errors:string[]} {
  if(!value||typeof value!=="object"||Array.isArray(value))return {patient:null,errors:["Invalid patient row"]};
  const raw=value as Record<string,unknown>;const errors:string[]=[];
  const text=(key:string,max:number)=>{const v=raw[key];if(v!==undefined&&typeof v!=="string"){errors.push(key+" must be text");return "";}const s=String(v??"").trim();if(s.length>max)errors.push(key+" is too long");return s;};
  const bool=(key:string)=>{if(raw[key]!==undefined&&typeof raw[key]!=="boolean")errors.push(key+" must be true or false");return raw[key]===true;};
  const p:PatientInput={name:text("name",150),firstName:text("firstName",100),source:text("source",40),notes:text("notes",2000),phone:text("phone",40),email:text("email",254).toLowerCase(),lastVisit:text("lastVisit",10),lastTreatment:text("lastTreatment",200),status:text("status",40)||"New",smsConsent:bool("smsConsent"),emailConsent:bool("emailConsent"),consentSource:text("consentSource",200),optedOut:bool("optedOut"),doNotContact:bool("doNotContact"),futureBooking:bool("futureBooking")};
  if(!p.name)errors.push("Name is required");
  if(!p.phone&&!p.email)errors.push("Phone or email is required");
  if(p.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email))errors.push("Enter a valid email");
  if(p.phone&&(!/^[+\d\s().-]+$/.test(p.phone)||!/^\d{7,15}$/.test(phoneKey(p.phone))))errors.push("Enter a valid phone number");
  if(!PATIENT_STATUSES.some(s=>s===p.status))errors.push("Unknown patient status");
  if(p.source&&!PATIENT_SOURCES.some(s=>s===p.source))errors.push("Source must be PatientNow Import, Manual, or Converted Lead");
  if(p.lastVisit){const d=DateTime.fromISO(p.lastVisit,{zone:CLINIC_ZONE});if(!/^\d{4}-\d{2}-\d{2}$/.test(p.lastVisit)||!d.isValid||d.toISODate()!==p.lastVisit||d> DateTime.now().setZone(CLINIC_ZONE).endOf("day"))errors.push("Last visit must be a real date in YYYY-MM-DD format, not in the future");}
  return {patient:errors.length?null:p,errors};
}
export function csvPatient(row:Record<string,string>):Record<string,unknown> {
  const aliases:Record<string,string>={name:"name",patientname:"name",fullname:"name",firstname:"firstName",source:"source",notes:"notes",phone:"phone",phonenumber:"phone",email:"email",emailaddress:"email",lastvisit:"lastVisit",lastvisitdate:"lastVisit",lasttreatment:"lastTreatment",status:"status",smsconsent:"smsConsent",emailconsent:"emailConsent",consentsource:"consentSource",optedout:"optedOut",donotcontact:"doNotContact",futurebooking:"futureBooking"};
  const booleans=new Set(["smsConsent","emailConsent","optedOut","doNotContact","futureBooking"]);
  const result:Record<string,unknown>={};
  for(const [header,value]of Object.entries(row)){const key=aliases[header.toLowerCase().replace(/[^a-z]/g,"")];if(!key)continue;const v=value.trim();result[key]=booleans.has(key)?(["true","yes","1"].includes(v.toLowerCase())?true:["false","no","0",""].includes(v.toLowerCase())?false:v):v;}
  return result;
}
