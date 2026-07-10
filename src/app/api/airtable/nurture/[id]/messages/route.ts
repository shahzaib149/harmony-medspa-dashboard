import { AIRTABLE_LEADS_BASE_ID, getAirtableApiKey, isAirtableConfigured } from "@/lib/airtable/config";
import type { NurtureMessage } from "@/lib/types/nurture";

const BASE_ID = AIRTABLE_LEADS_BASE_ID;

type AirtableRecord = { id: string; createdTime: string; fields: Record<string, unknown> };

function str(fields: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = fields[key];
    if (value !== undefined && value !== null && value !== "") return String(value);
  }
  return "";
}

function linkedId(value: unknown) {
  if (Array.isArray(value)) return value.find((item): item is string => typeof item === "string") ?? "";
  return typeof value === "string" ? value : "";
}

function escapeFormula(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function fetchRecords(table: string, params: URLSearchParams) {
  const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}?${params}`, {
    headers: { Authorization: `Bearer ${getAirtableApiKey()}` }, cache: "no-store",
  });
  if (!response.ok) throw new Error(`Airtable ${response.status}: ${(await response.text()).slice(0, 240)}`);
  return (await response.json() as { records: AirtableRecord[] }).records;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isAirtableConfigured()) return Response.json({ messages: [], count: 0, configured: false });
  try {
    const { id } = await context.params;
    const enrollmentResponse = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent("Nurture Enrollments")}/${id}`, {
      headers: { Authorization: `Bearer ${getAirtableApiKey()}` }, cache: "no-store",
    });
    if (!enrollmentResponse.ok) return Response.json({ error: "Nurture enrollment not found" }, { status: 404 });
    const enrollment = await enrollmentResponse.json() as AirtableRecord;
    const leadId = linkedId(enrollment.fields.Lead);
    if (!leadId) return Response.json({ messages: [] });

    const formula = `AND({Sequence}='14-Day Nurture',FIND('${escapeFormula(leadId)}',ARRAYJOIN({Recipient Lead})))`;
    const params = new URLSearchParams({
      filterByFormula: formula,
      "sort[0][field]": "Sent At",
      "sort[0][direction]": "asc",
      pageSize: "100",
    });
    const records = await fetchRecords("Message Log", params);
    const messages = records.map<NurtureMessage>((record) => ({
      id: record.id,
      channel: str(record.fields, "Channel", "Message Channel").toLowerCase() === "email" ? "Email" : "SMS",
      sequenceStep: str(record.fields, "Sequence Step"),
      messageBody: str(record.fields, "Message Body", "Body", "Message", "Content"),
      sentAt: str(record.fields, "Sent At", "Sent Date") || record.createdTime,
      deliveryStatus: str(record.fields, "Delivery Status", "Status", "Mandrill Status") || "Unknown",
    }));
    return Response.json({ messages, count: messages.length }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not load nurture messages" }, { status: 500 });
  }
}
