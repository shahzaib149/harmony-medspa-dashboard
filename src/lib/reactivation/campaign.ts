import { DEFAULT_CAMPAIGN, summarizeReactivation, type Enrollment, type Patient, type PatientMessage } from "./model";

export const REACTIVATION_PATH = "/campaigns/patient-reactivation";
export type ReactivationCampaignData = ReturnType<typeof buildCampaign>;
export function buildCampaign(patients:Patient[], all:Enrollment[], messages:PatientMessage[]) {
  const enrollments=all.filter(e=>e.campaign===DEFAULT_CAMPAIGN);
  const ids=new Set(enrollments.map(e=>e.id));
  const logs=messages.filter(m=>m.enrollmentIds.some(id=>ids.has(id))).map(m=>({...m,patientIds:m.patientIds.length?m.patientIds:[...new Set(enrollments.filter(e=>m.enrollmentIds.includes(e.id)).flatMap(e=>e.patientIds))]})).sort((a,b)=>Date.parse(b.sentAt)-Date.parse(a.sentAt));
  const patientIds=new Set(enrollments.flatMap(e=>e.patientIds));
  const timestamps=[...logs.map(m=>m.sentAt),...enrollments.flatMap(e=>[e.createdAt,e.lastSentAt])].filter(v=>Number.isFinite(Date.parse(v)));
  return {campaign:DEFAULT_CAMPAIGN,patients:patients.filter(p=>patientIds.has(p.id)),enrollments:enrollments.sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)),messages:logs,
    metrics:summarizeReactivation(patients,enrollments,logs,DEFAULT_CAMPAIGN),
    paused:enrollments.filter(e=>e.status==="Paused").length,
    lastActivity:timestamps.sort((a,b)=>Date.parse(b)-Date.parse(a))[0]||"",
    generatedAt:new Date().toISOString()};
}
