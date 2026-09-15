import { DateTime } from "luxon";

export const DEFAULT_CAMPAIGN = "September Reactivation 2026";
export const CLINIC_ZONE = "America/New_York";
// Reactivation is email-only. Older enrollments may still carry SMS step names.
export const EMAIL_STEPS = ["Step 1 Email", "Step 2 Email", "Step 3 Email"] as const;
export const FIRST_STEP = EMAIL_STEPS[0];
export const MAX_ENROLL = 1500;
export function stepNumber(step: string) { return Number(/^Step (\d)/.exec(step)?.[1] ?? 0); }
// Mandrill returns sent/queued/scheduled/rejected/invalid; webhooks add bounce and engagement events.
const SENT_STATUSES = new Set(["sent", "delivered", "opened", "open", "clicked", "click", "unsubscribed", "unsub"]);
const FAILED_STATUSES = new Set(["rejected", "invalid", "failed", "error", "bounced", "hard_bounce", "soft_bounce", "spam", "undelivered"]);
export function deliveryState(status: string): "sent" | "failed" | "pending" {
  const value = status.trim().toLowerCase();
  return SENT_STATUSES.has(value) ? "sent" : FAILED_STATUSES.has(value) ? "failed" : "pending";
}
export const MAX_PER_DAY = 1500;
export function hasValidEmail(email: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()); }
export type Enrollment = { id: string; patientIds: string[]; campaign: string; status: string; currentStep: string; nextSendAt: string; lastSentAt: string; stopReason: string; createdAt: string; messagesSent: number };
export type Patient = { id: string; name: string; phone: string; email: string; lastVisit: string; days: number | null; lastTreatment: string; status: string; smsConsent: boolean; emailConsent: boolean; optedOut: boolean; doNotContact: boolean; futureBooking: boolean; replied: boolean; activeNurture?: boolean; enrollments: Enrollment[] };
export type PatientMessage = { id: string; channel: string; step: string; sentAt: string; status: string; body: string; patientIds: string[]; enrollmentIds: string[] };
export type Workspace = { patients: Patient[]; campaigns: string[]; source: string; unsubscribeReady?: boolean };
export type SkippedPatient = { id: string; name: string; reason: string };
export type EnrollmentResult = { created: number; skipped: SkippedPatient[] };
export type ReactivationMetrics = { paused?: number; total: number; active: number; completed: number; stopped: number; sms: number; email: number; failures: number; pending: number; replies: number; bookings: number; stopReasons: Record<string, number> };

export function activeEnrollment(patient: Patient) {
  return patient.enrollments.filter(e => e.status === "Active").sort((a,b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
}
// Paused enrollments still reserve a place in the campaign.
export function currentEnrollment(patient: Patient) {
  return patient.enrollments.filter(e => ["Active", "Paused"].includes(e.status)).sort((a,b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
}
export function exclusionReasons(patient: Patient, campaign: string): string[] {
  return [!hasValidEmail(patient.email) && "No valid email address", patient.optedOut && "Opted out", (patient.doNotContact || patient.status === "Do Not Contact") && "Do not contact", patient.futureBooking && "Future booking", patient.activeNurture && "Active in 14-Day Nurture", patient.enrollments.some(e => e.status === "Active" && e.campaign === campaign) && "Already active in this campaign", patient.enrollments.some(e => e.status === "Paused" && e.campaign === campaign) && "Already paused in this campaign"].filter((v): v is string => Boolean(v));
}
export function nextClinicSend(now = DateTime.now()) {
  return now.setZone(CLINIC_ZONE).plus({ days: 1 }).startOf("day").set({ hour: 10 }).toFormat("yyyy-MM-dd'T'HH:mm");
}
export function clinicSendISO(value: string) {
  const parsed = DateTime.fromISO(value, { zone: CLINIC_ZONE });
  return parsed.isValid && parsed.getPossibleOffsets().length === 1 && parsed.toFormat("yyyy-MM-dd'T'HH:mm") === value ? parsed.toUTC().toISO() : null;
}
// Runtime request schema without adding a validation dependency.
export const enrollSchema = {
  parse(value: unknown): { patientIds: string[]; campaign: string; firstSendAt: string; perDay: number | null } {
    if (!value || typeof value !== "object") throw new Error("Invalid enrollment request.");
    const { patientIds, campaign, firstSendAt, perDay } = value as Record<string, unknown>;
    if (!Array.isArray(patientIds) || patientIds.length < 1 || patientIds.length > MAX_ENROLL || !patientIds.every(id => typeof id === "string" && /^rec[a-zA-Z0-9]{14}$/.test(id))) throw new Error(`Select between 1 and ${MAX_ENROLL} valid patients.`);
    if (typeof campaign !== "string" || !campaign.trim() || campaign.length > 200) throw new Error("Choose a valid campaign.");
    if (typeof firstSendAt !== "string" || !/(Z|[+-]\d{2}:\d{2})$/.test(firstSendAt) || !DateTime.fromISO(firstSendAt).isValid || Date.parse(firstSendAt) <= Date.now()) throw new Error("First send must be a future date with a timezone.");
    if (perDay !== undefined && perDay !== null && (!Number.isInteger(perDay) || (perDay as number) < 1 || (perDay as number) > MAX_PER_DAY)) throw new Error(`Patients per day must be a whole number from 1 to ${MAX_PER_DAY}.`);
    return { patientIds: [...new Set(patientIds)], campaign, firstSendAt, perDay: typeof perDay === "number" ? perDay : null };
  },
};
export function summarizeReactivation(patients: Patient[], enrollments: Enrollment[], messages: PatientMessage[], campaign: string): ReactivationMetrics {
  const selected = enrollments.filter(e => e.campaign === campaign);
  const enrollmentIds = new Set(selected.map(e => e.id));
  const patientIds = new Set(selected.flatMap(e => e.patientIds));
  const logs = messages.filter(m => m.enrollmentIds.some(id => enrollmentIds.has(id)));
  const sent = logs.filter(m => deliveryState(m.status) === "sent");
  const stopReasons: Record<string, number> = {};
  selected.filter(e => e.status === "Stopped").forEach(e => { const key = e.stopReason || "Not recorded"; stopReasons[key] = (stopReasons[key] || 0) + 1; });
  return { total: selected.length, active: selected.filter(e => e.status === "Active").length, completed: selected.filter(e => e.status === "Completed").length, stopped: selected.filter(e => e.status === "Stopped").length, sms: sent.filter(m => m.channel.toLowerCase() === "sms").length, email: sent.filter(m => m.channel.toLowerCase() === "email").length, failures: logs.filter(m => deliveryState(m.status) === "failed").length, pending: logs.filter(m => deliveryState(m.status) === "pending").length, replies: patients.filter(p => patientIds.has(p.id) && p.replied).length, bookings: patients.filter(p => patientIds.has(p.id) && p.status === "Booked").length, stopReasons };
}
// Send time for the Nth eligible patient when enrollment is spread across days.
export function staggeredSendAt(firstSendAt: string, index: number, perDay: number | null) {
  if (!perDay) return firstSendAt;
  return DateTime.fromISO(firstSendAt, { zone: CLINIC_ZONE }).plus({ days: Math.floor(index / perDay) }).toUTC().toISO() ?? firstSendAt;
}
