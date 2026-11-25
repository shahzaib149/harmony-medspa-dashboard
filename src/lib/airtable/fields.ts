// Pure Airtable record helpers (no network, no server-only imports), safe to use in tests.

export type AirtableRecord = { id: string; createdTime: string; fields: Record<string, unknown> };

export function textField(fields: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = fields[key];
    if (value !== undefined && value !== null && value !== "") return String(value);
  }
  return "";
}

/** US phone to E.164 (+1XXXXXXXXXX), or null unless it has 10 digits (11 with a leading 1). */
export function normalizeUsPhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return national.length === 10 ? `+1${national}` : null;
}

export function linkedIds(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : typeof value === "string" ? [value] : [];
}
