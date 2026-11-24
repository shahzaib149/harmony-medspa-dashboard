// Pure Airtable record helpers (no network, no server-only imports), safe to use in tests.

export type AirtableRecord = { id: string; createdTime: string; fields: Record<string, unknown> };

export function textField(fields: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = fields[key];
    if (value !== undefined && value !== null && value !== "") return String(value);
  }
  return "";
}

export function linkedIds(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : typeof value === "string" ? [value] : [];
}
