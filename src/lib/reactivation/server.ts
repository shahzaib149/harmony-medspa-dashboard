import "server-only";
import { buildCampaign } from "./campaign";
import { randomUUID } from "node:crypto";
import { DateTime } from "luxon";
import { airtableFetch, linkedIds, textField, type AirtableRecord } from "@/lib/airtable/leads-base";
import { createServiceClient } from "@/lib/supabase/server";
import { chunkAirtableRecords } from "@/lib/airtable/batch";
import { patientContactKeys } from "./patient-input";
import { isUnsubscribeConfigured } from "./unsubscribe";
import { CLINIC_ZONE, DEFAULT_CAMPAIGN, FIRST_STEP, exclusionReasons, staggeredSendAt, summarizeReactivation, type Enrollment, type Patient, type PatientMessage, type EnrollmentResult, type Workspace } from "./model";

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
export async function request(path: string, init?: RequestInit, api: "data" | "schema" = "data"): Promise<Response> {
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
export async function records(table: string, query = new URLSearchParams()) {
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
// Contact keys (email/phone) of leads currently in the 14-Day Nurture sequence.
async function activeNurtureContacts() {
  const [leads, nurture] = await Promise.all([records("Leads"), records("Nurture Enrollments")]);
  const active = new Set(nurture.filter(e => ["Active", "Paused"].includes(textField(e.fields, "Status") || "Active")).flatMap(e => linkedIds(e.fields.Lead)));
  return new Set(leads.filter(l => active.has(l.id)).flatMap(l => patientContactKeys({ email: textField(l.fields, "Email"), phone: textField(l.fields, "Phone") })));
}
function mapPatient(record: AirtableRecord, enrollments: Enrollment[], nurture?: Set<string>): Patient {
  const f = record.fields;
  const lastVisit = textField(f,"Last Visit Date");
  const date = DateTime.fromISO(lastVisit, { zone: CLINIC_ZONE });
  const days = date.isValid ? Math.floor(DateTime.now().setZone(CLINIC_ZONE).startOf("day").diff(date.startOf("day"), "days").days) : null;
  return { id: record.id, name: textField(f,"Name") || "Unnamed patient", phone: textField(f,"Phone"), email: textField(f,"Email"), lastVisit, days, lastTreatment: textField(f,"Last Treatment"), status: textField(f,"Status") || "Not set", smsConsent: f["SMS Consent"] === true, emailConsent: f["Email Consent"] === true, optedOut: f["Opted Out"] === true, doNotContact: f["Do Not Contact"] === true, futureBooking: f["Future Booking"] === true, replied: f.Replied === true, activeNurture: nurture ? patientContactKeys({ email: textField(f,"Email"), phone: textField(f,"Phone") }).some(k => nurture.has(k)) : false, enrollments: enrollments.filter(e => e.patientIds.includes(record.id)).sort((a,b) => Date.parse(b.createdAt)-Date.parse(a.createdAt)) };
}
function mapMessage(record: AirtableRecord): PatientMessage {
  const f = record.fields;
  return { id: record.id, patientIds: linkedIds(f.Patients), enrollmentIds: linkedIds(f["Reactivation Enrollment"]), channel: textField(f,"Channel"), step: textField(f,"Sequence Step"), sentAt: textField(f,"Sent At") || record.createdTime, status: textField(f,"Delivery Status") || "Not recorded", body: textField(f,"Message Body") };
}
export async function workspace(all = false): Promise<Workspace> {
  const ids = tables(); const meta = await schema();
  const query = all ? new URLSearchParams() : meta.hasView ? new URLSearchParams({ view: VIEW }) : new URLSearchParams({ filterByFormula: "AND(OR({Last Visit Date}=BLANK(),{Days Since Last Visit}>=90),{Email}!='',NOT({Opted Out}),NOT({Do Not Contact}),NOT({Future Booking}),{Status}!='Do Not Contact')" });
  const patients = await records(ids.patients, query);
  const enrollments = (await records(ids.enrollments)).map(mapEnrollment);
  const nurture = await activeNurtureContacts();
  return { patients: patients.map(p => mapPatient(p,enrollments,nurture)), campaigns: meta.campaigns, unsubscribeReady: isUnsubscribeConfigured(), source: !all && meta.hasView ? VIEW : all ? "Patients table · custom filters" : "Eligible patients · 90+ days away" };
}
export async function patientDetail(id: string) {
  if (!/^rec\w{14}$/.test(id)) throw new ReactivationError("Invalid patient ID.",400);
  const ids = tables();
  const record = await (await request(`${ids.patients}/${id}`)).json() as AirtableRecord;
  const enrollments = (await records(ids.enrollments)).map(mapEnrollment).filter(e => e.patientIds.includes(id));
  const enrollmentIds = new Set(enrollments.map(e => e.id));
  const messages = (await records("Message Log")).map(mapMessage).filter(m => m.patientIds.includes(id) || m.enrollmentIds.some(e => enrollmentIds.has(e))).sort((a,b) => Date.parse(b.sentAt)-Date.parse(a.sentAt));
  // The same person as a CRM lead: converted from it, or sharing an email or phone.
  const keys = new Set(patientContactKeys({ email: textField(record.fields,"Email"), phone: textField(record.fields,"Phone") }));
  const converted = /CRM lead: (rec[a-zA-Z0-9]{14})/.exec(textField(record.fields,"Notes"))?.[1];
  const leads = await records("Leads");
  const lead = leads.find(l => l.id === converted) ?? leads.find(l => patientContactKeys({ email: textField(l.fields,"Email"), phone: textField(l.fields,"Phone") }).some(k => keys.has(k)));
  return { patient: mapPatient(record,enrollments), messages, leadId: lead?.id ?? null };
}
export async function campaignMetrics() {
  const data = await workspace(true);
  const enrollments = [...new Map(data.patients.flatMap(p => p.enrollments).map(e => [e.id,e])).values()];
  // Include enrollments whose patient was subsequently removed.
  const all = (await records(tables().enrollments)).map(mapEnrollment);
  const messages = (await records("Message Log")).map(mapMessage);
  return summarizeReactivation(data.patients, all.length ? all : enrollments, messages, DEFAULT_CAMPAIGN);
}
export async function campaignWorkspace() {
  const enrollments=(await records(tables().enrollments)).map(mapEnrollment);
  const patients=(await records(tables().patients)).map(p=>mapPatient(p,enrollments));
  const messages=(await records("Message Log")).map(mapMessage);
  return buildCampaign(patients,enrollments,messages);
}
// Serializes reactivation writes inside this server instance. Used alone when the
// Supabase claim table has not been migrated yet (supabase/migrations/003).
let localLock: Promise<unknown> = Promise.resolve();
function withLocalLock<T>(operation: () => Promise<T>): Promise<T> {
  const run = localLock.then(operation);
  localLock = run.catch(() => undefined);
  return run;
}
let warnedMissingClaims = false;
// Reuse the CRM's server-only claim table for a cross-instance enrollment lock.
// A fixed key prevents two staff requests from passing the same active check.
export async function withEnrollmentLock<T>(operation: () => Promise<T>): Promise<T> {
  const service = createServiceClient(); const requestId = randomUUID(); const key = "reactivation-enrollment-lock";
  const { error: cleanup } = await service.from("campaign_enrollment_claims").delete().eq("idempotency_key", key).lt("expires_at",new Date().toISOString());
  if (cleanup && (cleanup.code === "PGRST205" || cleanup.code === "42P01")) {
    if (!warnedMissingClaims) { warnedMissingClaims = true; console.warn("[reactivation] campaign_enrollment_claims is missing; apply supabase/migrations/003. Using an in-process lock."); }
    return withLocalLock(operation);
  }
  if (cleanup) throw new ReactivationError("Patient updates are temporarily unavailable. Please retry in a moment.");
  const { error } = await service.from("campaign_enrollment_claims").insert({ idempotency_key: key, campaign_slug: "dormant-patient-reactivation", identity_hash: key, scheduled_at: new Date().toISOString(), request_id: requestId, expires_at: new Date(Date.now()+15*60_000).toISOString() });
  if (error) throw new ReactivationError(error.code === "23505" ? "Another patient update is in progress. Wait a moment and retry." : "Patient updates are temporarily unavailable. Please retry in a moment.",409);
  try { return await operation(); }
  finally { await service.from("campaign_enrollment_claims").delete().eq("idempotency_key",key).eq("request_id",requestId); }
}
export async function enrollPatients(input: { patientIds: string[]; campaign: string; firstSendAt: string; perDay?: number | null }): Promise<EnrollmentResult> {
  return withEnrollmentLock(async () => {
    const ids = tables(); const meta = await schema();
    if (!meta.campaigns.includes(input.campaign)) throw new ReactivationError("Campaign is no longer available. Refresh and select again.",400);
    if (!isUnsubscribeConfigured()) throw new ReactivationError("Unsubscribe links are not configured on the server. Add REACTIVATION_UNSUBSCRIBE_SECRET before enrolling patients.",409);
    const result: EnrollmentResult = { created: 0, skipped: [] };
    // One fresh read under the lock re-checks every patient without a per-batch table scan.
    const enrollments = (await records(ids.enrollments)).map(mapEnrollment);
    const requested = new Set(input.patientIds);
    const nurture = await activeNurtureContacts();
    const patients = new Map((await records(ids.patients)).filter(p => requested.has(p.id)).map(p => [p.id, mapPatient(p, enrollments, nurture)]));
    const eligible: Patient[] = [];
    for (const id of input.patientIds) {
      const patient = patients.get(id);
      if (!patient) { result.skipped.push({ id, name: "Unavailable patient", reason: "Patient no longer exists or is inaccessible" }); continue; }
      const reasons = exclusionReasons(patient, input.campaign);
      if (reasons.length) result.skipped.push({ id, name: patient.name, reason: reasons.join("; ") }); else eligible.push(patient);
    }
    const sendAt = new Map(eligible.map((p, index) => [p.id, staggeredSendAt(input.firstSendAt, index, input.perDay ?? null)]));
    const batches = chunkAirtableRecords(eligible); const started = Date.now();
    for (let b = 0; b < batches.length; b++) {
      const batch = batches[b];
      let preflight = "";
      if (Date.now() - started > 240_000) preflight = "The batch time limit was reached. Retry the remaining patients.";
      else if (Date.parse(input.firstSendAt) <= Date.now()) preflight = "The scheduled send time has passed. Choose a new time and retry.";
      if (preflight) {
        for (const p of batches.slice(b).flat()) result.skipped.push({ id: p.id, name: p.name, reason: preflight });
        break;
      }
      try {
        // typecast lets Airtable add the email step choice if the base still lists SMS steps.
        const response = await request(encodeURIComponent(ids.enrollments),{ method: "POST", body: JSON.stringify({ typecast: true, records: batch.map(p => ({ fields: { Patient: [p.id], Campaign: input.campaign, Status: "Active", "Current Step": FIRST_STEP, "Next Send At": sendAt.get(p.id), "Messages Sent": 0 } })) }) });
        const body = await response.json() as { records: AirtableRecord[] };
        result.created += body.records.length;
      } catch {
        // A timeout may happen after Airtable commits: reconcile without retrying POST.
        let verified: Enrollment[] | null = null;
        try { verified = (await records(ids.enrollments)).map(mapEnrollment); } catch { /* show uncertain outcomes explicitly */ }
        for (const p of batch) {
          if (verified?.some(e => e.patientIds.includes(p.id) && e.campaign === input.campaign && e.status === "Active")) result.created++;
          else result.skipped.push({ id: p.id, name: p.name, reason: verified ? "Could not create enrollment; retry this patient" : "Outcome could not be confirmed. Refresh enrollment history before retrying" });
        }
        for (const p of batches.slice(b + 1).flat()) result.skipped.push({ id: p.id, name: p.name, reason: "Not processed after a service error. Refresh and retry." });
        break;
      }
    }
    return result;
  });
}
export async function stopEnrollment(id: string) {
  if (!/^rec\w{14}$/.test(id)) throw new ReactivationError("Invalid enrollment ID.",400);
  return withEnrollmentLock(async () => {
    const path = `${tables().enrollments}/${id}`;
    const enrollment = await (await request(path)).json() as AirtableRecord;
    if (!["Active","Paused"].includes(String(enrollment.fields.Status))) throw new ReactivationError("This enrollment is no longer active or paused. Refresh its history.",409);
    await request(path,{ method: "PATCH", body: JSON.stringify({ fields: { Status: "Stopped", "Stop Reason": "Manual", "Next Send At": null } }) });
  });
}
export type PatientAction = "replied" | "booked" | "opted-out";
const ACTIONS: Record<PatientAction, { fields: Record<string, unknown>; reason: string }> = {
  replied: { fields: { Replied: true, Status: "Replied" }, reason: "Replied" },
  booked: { fields: { Status: "Booked" }, reason: "Booked" },
  "opted-out": { fields: { "Opted Out": true }, reason: "Opted Out" },
};
// Updates the patient and stops every Active or Paused reactivation enrollment in one locked step.
export async function applyPatientAction(id: string, action: PatientAction) {
  if (!/^rec[a-zA-Z0-9]{14}$/.test(id)) throw new ReactivationError("Invalid patient ID.", 400);
  const config = ACTIONS[action];
  if (!config) throw new ReactivationError("Unknown patient action.", 400);
  return withEnrollmentLock(async () => {
    const ids = tables();
    await request(`${encodeURIComponent(ids.patients)}/${id}`, { method: "PATCH", body: JSON.stringify({ typecast: true, fields: config.fields }) });
    const pending = (await records(ids.enrollments)).filter(e => linkedIds(e.fields.Patient).includes(id) && ["Active", "Paused"].includes(textField(e.fields, "Status")));
    for (const batch of chunkAirtableRecords(pending)) {
      await request(encodeURIComponent(ids.enrollments), { method: "PATCH", body: JSON.stringify({ typecast: true, records: batch.map(e => ({ id: e.id, fields: { Status: "Stopped", "Stop Reason": config.reason, "Next Send At": null } })) }) });
    }
    return { stopped: pending.length };
  });
}
export function errorResponse(error: unknown) {
  return Response.json({ error: error instanceof ReactivationError ? error.message : "Patient reactivation is temporarily unavailable. Please retry." }, { status: error instanceof ReactivationError ? error.status : 503, headers: { "Cache-Control": "private, no-store" } });
}
