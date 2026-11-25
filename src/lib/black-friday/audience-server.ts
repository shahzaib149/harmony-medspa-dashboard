import "server-only";
import { revalidateTag } from "next/cache";
import { airtableFetch, invalidateLeadsBaseCache, listRecords, safeAirtableError, textField } from "@/lib/airtable/leads-base";
import { BF_AUDIENCE_TABLE } from "./campaign";
import { matchContacts, optOutFields, type OptOut } from "./audience";

const RECORD_ID = /^rec[a-zA-Z0-9]{14}$/;

export class AudienceError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

function refreshCampaigns() {
  invalidateLeadsBaseCache();
  try { revalidateTag("campaigns", { expire: 0 }); } catch { /* outside a request */ }
}

/** The BF Audience row, or null when the id belongs to another table (or no longer exists). */
export async function getAudienceRecord(id: string) {
  if (!RECORD_ID.test(id)) return null;
  const response = await airtableFetch(`${BF_AUDIENCE_TABLE}/${id}`, { cache: "no-store" });
  if (response.status === 404) return null;
  if (!response.ok) throw new AudienceError(safeAirtableError(response.status), 503);
  return (await response.json()) as { id: string; fields: Record<string, unknown> };
}

/** Stop emails, texts or everything for one contact. Returns null if the id is not on the list. */
export async function optOutContact(id: string, kind: OptOut, by: string) {
  const record = await getAudienceRecord(id);
  if (!record) return null;
  const fields = optOutFields(kind, textField(record.fields, "Notes"), by);
  const response = await airtableFetch(`${BF_AUDIENCE_TABLE}/${id}`, { method: "PATCH", body: JSON.stringify({ fields }) });
  if (!response.ok) throw new AudienceError(safeAirtableError(response.status), 503);
  refreshCampaigns();
  return { id, name: textField(record.fields, "Name"), fields };
}

async function audienceForMatching() {
  const params = new URLSearchParams();
  ["Name", "Email", "Phone", "Unsubscribed", "Notes"].forEach((field) => params.append("fields[]", field));
  return listRecords(BF_AUDIENCE_TABLE, params, { forceRefresh: true });
}

/** Match a pasted list of emails / phones. With `apply`, unsubscribes every match from everything. */
export async function unsubscribeList(text: string, by: string, apply: boolean) {
  const records = await audienceForMatching();
  const result = matchContacts(text, records.map((r) => ({
    id: r.id, name: textField(r.fields, "Name"), email: textField(r.fields, "Email"), phone: textField(r.fields, "Phone"), unsubscribed: r.fields.Unsubscribed === true,
  })));
  if (!apply) return { ...result, applied: 0 };
  const notes = new Map(records.map((r) => [r.id, textField(r.fields, "Notes")]));
  const todo = result.matched.filter((m) => !m.already);
  for (let i = 0; i < todo.length; i += 10) {
    const batch = todo.slice(i, i + 10).map((m) => ({ id: m.id, fields: optOutFields("all", notes.get(m.id) ?? "", by) }));
    const response = await airtableFetch(BF_AUDIENCE_TABLE, { method: "PATCH", body: JSON.stringify({ records: batch }) });
    if (!response.ok) throw new AudienceError(`${safeAirtableError(response.status)} after ${i} of ${todo.length} contacts`, 503);
  }
  refreshCampaigns();
  return { ...result, applied: todo.length };
}
