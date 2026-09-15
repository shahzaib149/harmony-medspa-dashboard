import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildCampaign } from "../src/lib/reactivation/campaign";
import { DEFAULT_CAMPAIGN, type Enrollment, type Patient, type PatientMessage } from "../src/lib/reactivation/model";
const e:Enrollment={id:"rec00000000000001",patientIds:["rec00000000000002"],campaign:DEFAULT_CAMPAIGN,status:"Paused",currentStep:"Step 2 Email",nextSendAt:"",lastSentAt:"",stopReason:"",createdAt:"2026-09-01T12:00:00Z",messagesSent:0};
test("campaign includes paused history and resolves messages linked only to enrollment",()=>{
 const message:PatientMessage={id:"log1",enrollmentIds:[e.id],patientIds:[],body:"Fictional",channel:"Email",status:"sent",step:"Step 2 Email",sentAt:"2026-09-02T12:00:00Z"};
 const result=buildCampaign([], [e,{...e,id:"unrelated",campaign:"Other"}],[message,{...message,id:"other",enrollmentIds:["unrelated"]}]);
 assert.equal(result.paused,1);assert.equal(result.metrics.total,1);assert.equal(result.messages.length,1);
 assert.deepEqual(result.messages[0].patientIds,e.patientIds);assert.equal(result.metrics.email,1);
 assert.equal(result.lastActivity,message.sentAt);
});
test("empty campaign has truthful zero states",()=>{
 const result=buildCampaign([],[],[]);
 assert.equal(result.metrics.total,0);assert.equal(result.lastActivity,"");assert.deepEqual(result.messages,[]);
});
test("deleting patients requires admin and confirmation, stops sends first, then removes history and the patient",()=>{
 const route=fs.readFileSync("src/app/api/reactivation/patients/[id]/route.ts","utf8");
 const service=fs.readFileSync("src/lib/reactivation/delete-patient.ts","utf8");
 assert.match(route,/requireRole\(request,"admin"\)/);
 assert.match(service,/confirmation!=="DELETE"/);
 assert.match(service,/withEnrollmentLock/);
 assert.match(service,/"Next Send At":null/);
 assert.equal((service.match(/method:"DELETE"/g)||[]).length,2);
 const stopAt=service.indexOf("\"Next Send At\":null"),logsAt=service.indexOf("\"Message Log\",messages"),patientAt=service.indexOf("request(\"Patients/\"+id,{method:\"DELETE\"})");
 assert.ok(stopAt>0&&stopAt<logsAt&&logsAt<patientAt);
 assert.ok(service.includes('request("Patients/"+id,{method:"DELETE"})')); 
});
