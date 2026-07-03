const BASE_ID = process.env.AIRTABLE_BASE_ID!;
const API_KEY = process.env.AIRTABLE_API_KEY!;

export interface RawRecord {
  id: string;
  createdTime: string;
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
      const raw = await res.text().catch(() => "");
      let detail = "";
      try {
        const parsed = JSON.parse(raw) as { error?: { message?: string; type?: string } };
        detail = parsed?.error?.message ?? parsed?.error?.type ?? "";
      } catch { detail = raw.slice(0, 300); }
      throw new Error(`Airtable ${res.status} on table "${tableName}"${detail ? `: ${detail}` : ""}`);
    }

    const data = await res.json() as { records: Array<{ id: string; createdTime: string; fields: Record<string, unknown> }>; offset?: string };
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
