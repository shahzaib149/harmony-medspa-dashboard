const SENSITIVE_KEY = /(?:^|_)(password|passcode|token|access_token|refresh_token|authorization|api_key|apikey|secret|cookie|message|notes|medical_notes|treatment|bearer)(?:$|_)/i;
const EMAIL_KEY = /email/i;
const PHONE_KEY = /phone|mobile|tel/i;
const MAX_DEPTH = 6;
const MAX_STRING_LENGTH = 500;
const MAX_ARRAY_LENGTH = 50;
const MAX_OBJECT_KEYS = 75;

export function maskEmail(value: string | null | undefined) {
  if (!value) return null;
  const [local, domain] = value.trim().split("@");
  if (!local || !domain) return "***";
  return `${local.slice(0, 1)}***@${domain}`;
}

export function maskPhone(value: string | null | undefined) {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 4 ? `***-***-${digits.slice(-4)}` : "***";
}

function sanitizeValue(value: unknown, key: string, depth: number): unknown {
  if (SENSITIVE_KEY.test(key)) return "[redacted]";
  if (value === null || value === undefined || typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "string") {
    if (EMAIL_KEY.test(key)) return maskEmail(value);
    if (PHONE_KEY.test(key)) return maskPhone(value);
    return value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}…` : value;
  }
  if (depth >= MAX_DEPTH) return "[truncated]";
  if (Array.isArray(value)) return value.slice(0, MAX_ARRAY_LENGTH).map((item) => sanitizeValue(item, key, depth + 1));
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .slice(0, MAX_OBJECT_KEYS)
        .map(([childKey, childValue]) => [childKey, sanitizeValue(childValue, childKey, depth + 1)]),
    );
  }
  return String(value);
}

export function sanitizeAuditData(value: unknown): Record<string, unknown> | null {
  if (value === undefined || value === null) return null;
  const sanitized = sanitizeValue(value, "", 0);
  if (sanitized && typeof sanitized === "object" && !Array.isArray(sanitized)) return sanitized as Record<string, unknown>;
  return { value: sanitized };
}
