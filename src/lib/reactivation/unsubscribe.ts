import "server-only";
import { signPatientToken, verifyPatientToken } from "./unsubscribe-token";

// Links are signed so a record ID alone cannot opt someone else out.
function secret() {
  const value = process.env.REACTIVATION_UNSUBSCRIBE_SECRET;
  return value && value.length >= 24 ? value : null;
}

export function isUnsubscribeConfigured() {
  return secret() !== null;
}

export function unsubscribeToken(patientId: string) {
  const key = secret();
  if (!key) throw new Error("Unsubscribe secret is not configured");
  return signPatientToken(key, patientId);
}

// Full link stored on the enrollment so the sender never has to compute the signature.
export function unsubscribeUrl(patientId: string) {
  // Patients land on the public Harmony website, which confirms through this CRM.
  const origin = (process.env.REACTIVATION_UNSUBSCRIBE_BASE_URL || "https://www.harmonymedspafl.com").replace(/\/$/, "");
  return `${origin}/unsubscribe?p=${patientId}&t=${unsubscribeToken(patientId)}`;
}

export function verifyUnsubscribe(patientId: unknown, token: unknown): patientId is string {
  const key = secret();
  return key !== null && verifyPatientToken(key, patientId, token);
}
