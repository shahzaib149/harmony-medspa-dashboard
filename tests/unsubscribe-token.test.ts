import { test } from "node:test";
import assert from "node:assert/strict";
import { signPatientToken, verifyPatientToken } from "../src/lib/reactivation/unsubscribe-token";
const secret="test-secret-that-is-long-enough-123";const id="recABCDEFGHIJKLMN";
test("unsubscribe tokens verify only for the signed patient and secret",()=>{
 const token=signPatientToken(secret,id);
 assert.equal(token.length,64);
 assert.equal(verifyPatientToken(secret,id,token),true);
 assert.equal(verifyPatientToken(secret,id,token.toUpperCase()),true);
 assert.equal(verifyPatientToken(secret,"recZZZZZZZZZZZZZZ",token),false);
 assert.equal(verifyPatientToken("another-secret-that-is-long-enough",id,token),false);
 for(const bad of [undefined,"",token.slice(1),"x".repeat(64)])assert.equal(verifyPatientToken(secret,id,bad),false);
 assert.equal(verifyPatientToken(secret,"not-a-record",token),false);
});
