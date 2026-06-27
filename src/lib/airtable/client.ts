const BASE_ID = process.env.AIRTABLE_BASE_ID!;
const API_KEY = process.env.AIRTABLE_API_KEY!;

export interface RawRecord {
  id: string;
  fields: Record<string, unknown>;
}

export async function fetchAllRecords(tableName: string): Promise<RawRecord[]> {
  const records: RawRecord[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({ pageSize: "100" });
    if (offset) params.set("offset", offset);

    const res = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(tableName)}?${params}`,
      { headers: { Authorization: `Bearer ${API_KEY}` }, next: { revalidate: 180 } }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: { message: string; type: string } };
      throw new Error(err?.error?.message ?? `Airtable error ${res.status} on table "${tableName}"`);
    }

    const data = await res.json() as { records: RawRecord[]; offset?: string };
    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}

// Flexible field getter — tries multiple key variants in order
export function g(fields: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) {
    const v = fields[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

export function num(fields: Record<string, unknown>, ...keys: string[]): number {
  const v = g(fields, ...keys);
  return v === undefined ? 0 : Number(v);
}

export function str(fields: Record<string, unknown>, ...keys: string[]): string {
  const v = g(fields, ...keys);
  return v === undefined ? "" : String(v);
}
