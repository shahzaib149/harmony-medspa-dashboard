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

export function verifyUnsubscribe(patientId: unknown, token: unknown): patientId is string {
  const key = secret();
  return key !== null && verifyPatientToken(key, patientId, token);
}
