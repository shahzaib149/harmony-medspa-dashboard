import "server-only";
import { randomUUID } from "node:crypto";
import { DateTime } from "luxon";
import { airtableFetch, linkedIds, textField, type AirtableRecord } from "@/lib/airtable/leads-base";
import { createServiceClient } from "@/lib/supabase/server";
import { chunkAirtableRecords } from "@/lib/airtable/batch";
import { CLINIC_ZONE, DEFAULT_CAMPAIGN, exclusionReasons, summarizeReactivation, type Enrollment, type Patient, type PatientMessage, type EnrollmentResult, type Workspace } from "./model";

export class ReactivationError extends Error { constructor(message: string, public status = 503) { super(message); } }
const VIEW = "Dormant — Eligible to Enroll";
function tables() {
  // Airtable accepts table names directly; use the CRM's existing base and token.
  return { patients: "Patients", enrollments: "Reactivation Enrollments" };
}
// Share the CRM's authenticated Airtable transport. Space all reactivation requests;
// no parallel batch writes and no blind retry of a potentially committed create.
let queue: Promise<unknown> = Promise.resolve();
let lastRequest = 0;
async function request(path: string, init?: RequestInit, api: "data" | "schema" = "data"): Promise<Response> {
  const run = queue.then(async () => {
    await new Promise(resolve => setTimeout(resolve, Math.max(0, 250 - (Date.now() - lastRequest))));
    lastRequest = Date.now();
    let response = await airtableFetch(path, { ...init, cache: "no-store" }, api);
    if (response.status === 429) {
      await new Promise(resolve => setTimeout(resolve, 30_000));
      response = await airtableFetch(path, { ...init, cache: "no-store" }, api);
    }
    if (!response.ok) throw new ReactivationError(response.status === 403 ? "Airtable access is missing. Check record and schema read permissions." : `Patient data request failed (${response.status}). Please retry.`, response.status === 404 ? 404 : 503);
    return response;
  });
  queue = run.catch(() => undefined);
  return run;
}
async function records(table: string, query = new URLSearchParams()) {
  const result: AirtableRecord[] = [];
  let offset: string | undefined;
  do {
    const params = new URLSearchParams(query); params.set("pageSize", "100");
    if (offset) params.set("offset", offset);
    const body = await (await request(`${encodeURIComponent(table)}?${params}`)).json() as { records: AirtableRecord[]; offset?: string };
    result.push(...body.records); offset = body.offset;
  } while (offset);
  return result;
}
type TableSchema = { id: string; name: string; fields: { name: string; type: string; options?: { choices?: { name: string }[] } }[]; views: { name: string }[] };
async function schema() {
  const ids = tables();
  const body = await (await request("tables", undefined, "schema")).json() as { tables: TableSchema[] };
  const patients = body.tables.find(t => t.name === ids.patients);
  const enrollment = body.tables.find(t => t.name === ids.enrollments);
  if (!patients || !enrollment) throw new ReactivationError("Patients and Reactivation Enrollments must exist in the connected CRM base.");
  const campaigns = enrollment.fields.find(f => f.name === "Campaign" && f.type === "singleSelect")?.options?.choices?.map(c => c.name) ?? [];
  if (!campaigns.length) throw new ReactivationError("Add campaign choices to Reactivation Enrollments → Campaign.");
  return { campaigns, hasView: patients.views.some(v => v.name === VIEW) };
}
function mapEnrollment(record: AirtableRecord): Enrollment {
  const f = record.fields;
  return { id: record.id, patientIds: linkedIds(f.Patient), campaign: textField(f,"Campaign"), status: textField(f,"Status"), currentStep: textField(f,"Current Step"), nextSendAt: textField(f,"Next Send At"), lastSentAt: textField(f,"Last Sent At"), stopReason: textField(f,"Stop Reason"), createdAt: textField(f,"Enrolled At") || record.createdTime, messagesSent: Number(f["Messages Sent"] || 0) };
}
function mapPatient(record: AirtableRecord, enrollments: Enrollment[]): Patient {
  const f = record.fields;
  const lastVisit = textField(f,"Last Visit Date");
  const date = DateTime.fromISO(lastVisit, { zone: CLINIC_ZONE });
  const days = date.isValid ? Math.floor(DateTime.now().setZone(CLINIC_ZONE).startOf("day").diff(date.startOf("day"), "days").days) : null;
  return { id: record.id, name: textField(f,"Name") || "Unnamed patient", phone: textField(f,"Phone"), email: textField(f,"Email"), lastVisit, days, lastTreatment: textField(f,"Last Treatment"), status: textField(f,"Status") || "Not set", smsConsent: f["SMS Consent"] === true, optedOut: f["Opted Out"] === true, doNotContact: f["Do Not Contact"] === true, futureBooking: f["Future Booking"] === true, replied: f.Replied === true, enrollments: enrollments.filter(e => e.patientIds.includes(record.id)).sort((a,b) => Date.parse(b.createdAt)-Date.parse(a.createdAt)) };
}
function mapMessage(record: AirtableRecord): PatientMessage {
  const f = record.fields;
  return { id: record.id, patientIds: linkedIds(f.Patients), enrollmentIds: linkedIds(f["Reactivation Enrollment"]), channel: textField(f,"Channel"), step: textField(f,"Sequence Step"), sentAt: textField(f,"Sent At") || record.createdTime, status: textField(f,"Delivery Status") || "Not recorded", body: textField(f,"Message Body") };
}
export async function workspace(all = false): Promise<Workspace> {
  const ids = tables(); const meta = await schema();
  const query = all ? new URLSearchParams() : meta.hasView ? new URLSearchParams({ view: VIEW }) : new URLSearchParams({ filterByFormula: "AND({Days Since Last Visit}>=90,{SMS Consent}=1,NOT({Opted Out}),NOT({Do Not Contact}),NOT({Future Booking}),{Status}!='Do Not Contact')" });
  const patients = await records(ids.patients, query);
  const enrollments = (await records(ids.enrollments)).map(mapEnrollment);
  return { patients: patients.map(p => mapPatient(p,enrollments)), campaigns: meta.campaigns, source: !all && meta.hasView ? VIEW : all ? "Patients table · custom filters" : "Eligible patients · 90+ days away" };
}
export async function patientDetail(id: string) {
  if (!/^rec\w{14}$/.test(id)) throw new ReactivationError("Invalid patient ID.",400);
  const ids = tables();
  const record = await (await request(`${ids.patients}/${id}`)).json() as AirtableRecord;
  const enrollments = (await records(ids.enrollments)).map(mapEnrollment).filter(e => e.patientIds.includes(id));
  const enrollmentIds = new Set(enrollments.map(e => e.id));
  const messages = (await records("Message Log")).map(mapMessage).filter(m => m.patientIds.includes(id) || m.enrollmentIds.some(e => enrollmentIds.has(e))).sort((a,b) => Date.parse(b.sentAt)-Date.parse(a.sentAt));
  return { patient: mapPatient(record,enrollments), messages };
}
export async function campaignMetrics() {
  const data = await workspace(true);
  const enrollments = [...new Map(data.patients.flatMap(p => p.enrollments).map(e => [e.id,e])).values()];
  // Include enrollments whose patient was subsequently removed.
  const all = (await records(tables().enrollments)).map(mapEnrollment);
  const messages = (await records("Message Log")).map(mapMessage);
  return summarizeReactivation(data.patients, all.length ? all : enrollments, messages, DEFAULT_CAMPAIGN);
}
// Reuse the CRM's server-only claim table for a cross-instance enrollment lock.
// A fixed key prevents two staff requests from passing the same active check.
async function withEnrollmentLock<T>(operation: () => Promise<T>): Promise<T> {
  const service = createServiceClient(); const requestId = randomUUID(); const key = "reactivation-enrollment-lock";
  const { error: cleanup } = await service.from("campaign_enrollment_claims").delete().eq("idempotency_key", key).lt("expires_at",new Date().toISOString());
  if (cleanup) throw new ReactivationError("Enrollment coordination is unavailable. Please retry.");
  const { error } = await service.from("campaign_enrollment_claims").insert({ idempotency_key: key, campaign_slug: "dormant-patient-reactivation", identity_hash: key, scheduled_at: new Date().toISOString(), request_id: requestId, expires_at: new Date(Date.now()+15*60_000).toISOString() });
  if (error) throw new ReactivationError(error.code === "23505" ? "Another enrollment update is in progress. Wait a moment and retry." : "Enrollment coordination is unavailable.",409);
  try { return await operation(); }
  finally { await service.from("campaign_enrollment_claims").delete().eq("idempotency_key",key).eq("request_id",requestId); }
}
export async function enrollPatients(input: { patientIds: string[]; campaign: string; firstSendAt: string }): Promise<EnrollmentResult> {
  return withEnrollmentLock(async () => {
    const ids = tables(); const meta = await schema();
    if (!meta.campaigns.includes(input.campaign)) throw new ReactivationError("Campaign is no longer available. Refresh and select again.",400);
    const result: EnrollmentResult = { created: 0, skipped: [] };
    const requested = await records(ids.patients, new URLSearchParams({ filterByFormula: `OR(${input.patientIds.map(id => `RECORD_ID()='${id}'`).join(",")})` }));
    const names = new Map(requested.map(p => [p.id, textField(p.fields, "Name") || "Unnamed patient"]));
    const started = Date.now();
    const accounted = new Set<string>();
    try {
    for (const batch of chunkAirtableRecords(input.patientIds)) {
      if (Date.now() - started > 180_000) throw new ReactivationError("The batch time limit was reached.");
      if (Date.parse(input.firstSendAt) <= Date.now()) throw new ReactivationError("The scheduled time has passed.");
      const query = new URLSearchParams({ filterByFormula: `OR(${batch.map(id => `RECORD_ID()='${id}'`).join(",")})` });
      const patients = await records(ids.patients,query);
      const enrollments = (await records(ids.enrollments)).map(mapEnrollment);
      const eligible: Patient[] = [];
      for (const id of batch) {
        const record = patients.find(p => p.id === id);
        if (!record) { result.skipped.push({ id, name: names.get(id) || "Unavailable patient", reason: "Patient no longer exists or is inaccessible" }); accounted.add(id); continue; }
        const patient = mapPatient(record,enrollments); const reasons = exclusionReasons(patient,input.campaign);
        if (reasons.length) { result.skipped.push({ id, name: patient.name, reason: reasons.join("; ") }); accounted.add(id); } else eligible.push(patient);
      }
      if (!eligible.length) continue;
      try {
        const response = await request(ids.enrollments,{ method: "POST", body: JSON.stringify({ records: eligible.map(p => ({ fields: { Patient: [p.id], Campaign: input.campaign, Status: "Active", "Current Step": "Step 1 SMS", "Next Send At": input.firstSendAt, "Messages Sent": 0 } })) }) });
        const body = await response.json() as { records: AirtableRecord[] };
        result.created += body.records.length;
        eligible.forEach(p => accounted.add(p.id));
      } catch {
        // A timeout may happen after Airtable commits: reconcile without retrying POST.
        let verified: Enrollment[] | null = null;
        try { verified = (await records(ids.enrollments)).map(mapEnrollment); } catch { /* show uncertain outcomes explicitly */ }
        for (const p of eligible) {
          if (verified?.some(e => e.patientIds.includes(p.id) && e.campaign === input.campaign && e.status === "Active")) result.created++;
          else result.skipped.push({ id: p.id, name: p.name, reason: verified ? "Could not create enrollment; retry this patient" : "Outcome could not be confirmed. Refresh enrollment history before retrying" });
        }
        eligible.forEach(p => accounted.add(p.id));
        throw new ReactivationError("Enrollment processing was interrupted.");
      }
    }
    } catch {
      for (const id of input.patientIds.filter(id => !accounted.has(id))) result.skipped.push({ id, name: names.get(id) || "Unavailable patient", reason: "Not processed after a service or scheduling error. Refresh, check the send time, and retry." });
    }
    return result;
  });
}
export async function stopEnrollment(id: string) {
  if (!/^rec\w{14}$/.test(id)) throw new ReactivationError("Invalid enrollment ID.",400);
  return withEnrollmentLock(async () => {
    const path = `${tables().enrollments}/${id}`;
    const enrollment = await (await request(path)).json() as AirtableRecord;
    if (enrollment.fields.Status !== "Active") throw new ReactivationError("This enrollment is no longer active. Refresh its history.",409);
    await request(path,{ method: "PATCH", body: JSON.stringify({ fields: { Status: "Stopped", "Stop Reason": "Manual", "Next Send At": null } }) });
  });
}
export function errorResponse(error: unknown) {
  return Response.json({ error: error instanceof ReactivationError ? error.message : "Patient reactivation is temporarily unavailable. Please retry." }, { status: error instanceof ReactivationError ? error.status : 503, headers: { "Cache-Control": "private, no-store" } });
}
