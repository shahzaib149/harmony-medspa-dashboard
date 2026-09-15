import { createHmac, timingSafeEqual } from "node:crypto";

// HMAC-SHA256 of the patient record ID, hex encoded. Make produces the same value
// with {{sha256(<patient id>; "hex"; "<secret>")}}.
export function signPatientToken(secret: string, patientId: string) {
  return createHmac("sha256", secret).update(patientId).digest("hex");
}

export function verifyPatientToken(secret: string, patientId: unknown, token: unknown): patientId is string {
  if (typeof patientId !== "string" || typeof token !== "string") return false;
  if (!/^rec[a-zA-Z0-9]{14}$/.test(patientId) || !/^[a-f0-9]{64}$/i.test(token)) return false;
  const expected = Buffer.from(signPatientToken(secret, patientId), "hex");
  const received = Buffer.from(token.toLowerCase(), "hex");
  return expected.length === received.length && timingSafeEqual(expected, received);
}
