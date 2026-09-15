import {test} from "node:test";
import assert from "node:assert/strict";
import {validatePatient,csvPatient,patientContactKeys,emptyPatient} from "../src/lib/reactivation/patient-input";
test("manual patients require name and usable contact without inventing visits or consent",()=>{
 const p=validatePatient({name:"Example Patient",email:"PATIENT@example.test"});
 assert.deepEqual(p.errors,[]);assert.equal(p.patient?.email,"patient@example.test");
 assert.equal(p.patient?.lastVisit,"");assert.equal(p.patient?.smsConsent,false);
 assert.ok(validatePatient({name:"Patient"}).errors.length);
 assert.ok(validatePatient({email:"person@example.test"}).errors.length);
 assert.ok(validatePatient({name:"Patient",phone:"not a number"}).errors.length);
});
test("CSV headers and booleans normalize while unrecognized consent values are rejected",()=>{
 const valid=csvPatient({"Name":"Example","Phone Number":"(941) 555-0100","SMS Consent":"YES","Consent Source":"Signed form","Last Visit Date":"2025-01-02"});
 assert.equal(validatePatient(valid).patient?.smsConsent,true);
 assert.ok(validatePatient(csvPatient({"Name":"Example","Email":"person@example.test","SMS Consent":"maybe"})).errors.length);
 assert.equal(validatePatient(csvPatient({"Name":"Example","Email":"person@example.test","SMS Consent":""})).patient?.smsConsent,false);
});
test("CSV Source, First Name and Notes are kept; unknown sources are rejected",()=>{
 const row=validatePatient(csvPatient({"Name":"Example Patient","First Name":"Example","Email":"p@example.test","Status":"New","Source":"PatientNow Import","Notes":"No sales 60+ days"}));
 assert.deepEqual(row.errors,[]);assert.equal(row.patient?.source,"PatientNow Import");assert.equal(row.patient?.firstName,"Example");assert.equal(row.patient?.notes,"No sales 60+ days");
 assert.ok(validatePatient(csvPatient({"Name":"Example","Email":"p@example.test","Source":"Somewhere"})).errors.length);
});
test("consent cannot be granted without a recorded source",()=>{
 assert.ok(validatePatient({...emptyPatient,name:"Patient",email:"person@example.test",smsConsent:true}).errors.includes("Record the consent source when marking consent as granted"));
});
test("phone and email identity catches case and formatting differences",()=>{
 assert.deepEqual(patientContactKeys({phone:"(941) 555-0100",email:"Person@Example.test"}),patientContactKeys({phone:"+1 941 555 0100",email:"person@example.test"}));
 assert.deepEqual(patientContactKeys({phone:"",email:""}),[]);
});
test("invalid dates, unknown status and field overflows fail validation",()=>{
 const p={name:"Patient",phone:"9415550100"};
 for(const overrides of [{lastVisit:"2025-02-30"},{lastVisit:"2099-01-01"},{lastVisit:"01/02/2025"},{status:"Invented"},{name:"x".repeat(151)},{email:"not-email"},{smsConsent:"yes"}])assert.ok(validatePatient({...p,...overrides}).errors.length);
});
