import { test } from "node:test";
import assert from "node:assert/strict";
import { DateTime } from "luxon";
import { activeEnrollment, exclusionReasons, nextClinicSend, clinicSendISO, enrollSchema, summarizeReactivation, DEFAULT_CAMPAIGN, type Patient, type Enrollment, type PatientMessage } from "../src/lib/reactivation/model";
const enrollment:Enrollment={id:"rec00000000000001",patientIds:["rec00000000000002"],campaign:DEFAULT_CAMPAIGN,status:"Active",currentStep:"Step 1 Email",nextSendAt:"",lastSentAt:"",stopReason:"",createdAt:"2026-09-01T10:00:00Z",messagesSent:0};
const patient:Patient={id:"rec00000000000002",name:"Test Patient",phone:"",email:"patient@example.test",lastVisit:"2026-01-01",days:100,lastTreatment:"",status:"New",smsConsent:false,emailConsent:false,optedOut:false,doNotContact:false,futureBooking:false,replied:false,enrollments:[]};
test("every exclusion is explicit and active enrollment is campaign-specific",()=>{
  assert.deepEqual(exclusionReasons(patient,DEFAULT_CAMPAIGN),[]);
  const blocked={...patient,email:"",optedOut:true,doNotContact:true,futureBooking:true,enrollments:[enrollment]};
  assert.equal(exclusionReasons(blocked,DEFAULT_CAMPAIGN).length,5);
  assert.equal(exclusionReasons({...patient,enrollments:[enrollment]},"Other").length,0);
  assert.equal(exclusionReasons({...patient,status:"Do Not Contact"},DEFAULT_CAMPAIGN).length,1);
});
test("most recent ACTIVE history wins even when a newer enrollment was stopped",()=>{
  const newer={...enrollment,id:"rec00000000000003",createdAt:"2026-09-04T10:00:00Z"};
  assert.equal(activeEnrollment({...patient,enrollments:[enrollment,newer,{...newer,status:"Stopped",createdAt:"2026-09-05T10:00:00Z"}]})?.id,newer.id);
});
test("first send stays at 10am New York across DST transitions",()=>{
  const spring=nextClinicSend(DateTime.fromISO("2026-03-07T23:00:00",{zone:"America/New_York"}));
  assert.equal(spring,"2026-03-08T10:00");
  assert.equal(clinicSendISO(spring),"2026-03-08T14:00:00.000Z");
  const fall=nextClinicSend(DateTime.fromISO("2026-10-31T23:00:00",{zone:"America/New_York"}));
  assert.equal(clinicSendISO(fall),"2026-11-01T15:00:00.000Z");
  assert.equal(clinicSendISO("2026-03-08T02:30"),null);
  assert.equal(clinicSendISO("2026-11-01T01:30"),null);
});
test("request schema rejects malformed IDs, missing timezone, past time and oversized batches",()=>{
  const valid={patientIds:[patient.id,patient.id],campaign:DEFAULT_CAMPAIGN,firstSendAt:"2099-09-15T14:00:00Z"};
  assert.equal(enrollSchema.parse(valid).patientIds.length,1);
  for(const change of [{patientIds:["bad"]},{patientIds:[]},{patientIds:Array.from({length:1501},(_,i)=>"rec"+String(i).padStart(14,"0"))},{campaign:""},{firstSendAt:"2099-09-15T14:00:00"},{firstSendAt:"2020-01-01T00:00:00Z"},{firstSendAt:"invalid"}]) assert.throws(()=>enrollSchema.parse({...valid,...change}));
});
test("campaign metrics exclude unrelated messages and count distinct patients",()=>{
  const msg:PatientMessage={id:"msg",patientIds:[patient.id],enrollmentIds:[enrollment.id],channel:"SMS",step:"Step 1 Email",sentAt:"",status:"sent",body:""};
  const stopped={...enrollment,id:"rec00000000000004",status:"Stopped",stopReason:"Manual"};
  const metrics=summarizeReactivation([{...patient,replied:true,status:"Booked"}],[enrollment,stopped],[msg,{...msg,id:"other",enrollmentIds:["unrelated"]},{...msg,id:"failure",status:"Pending"},{...msg,id:"email",channel:"Email",status:"delivered"}],DEFAULT_CAMPAIGN);
  assert.deepEqual(metrics,{total:2,active:1,completed:0,stopped:1,sms:1,email:1,failures:1,replies:1,bookings:1,stopReasons:{Manual:1}});
});
