import { linkedIds, textField, type AirtableRecord } from "@/lib/airtable/fields";
import type { MessageLog } from "@/types/message-log";

/** Fields every campaign view needs from Message Log; the body is added only where a conversation is shown. */
export const MESSAGE_LOG_FIELDS = ["Recipient Lead", "Channel", "Sequence", "Sequence Step", "Delivery Status", "Sent At", "Mandrill Message ID", "Error Reason"];
export const MESSAGE_LOG_FIELDS_WITH_BODY = [...MESSAGE_LOG_FIELDS, "Message Body"];

export function dateValue(value: string | null | undefined) {
  const time = Date.parse(value ?? "");
  return Number.isFinite(time) ? time : 0;
}

export function deliveryStatus(value: string): MessageLog["deliveryStatus"] {
  const v = value.toLowerCase();
  // Same buckets the campaign pages have always used (moved from campaigns/data.ts).
  if (["sent", "delivered", "success", "successful", "ok"].includes(v)) return "Sent";
  if (["failed", "rejected", "bounced", "undelivered", "error"].includes(v)) return "Failed";
  return "Pending";
}

type LeadLike = { name: string; email?: string | null; phone?: string | null; status?: string | null };

/** Airtable Message Log record → the dashboard's MessageLog shape (used by every campaign workspace). */
export function mapMessageLog(record: AirtableRecord, leads: Map<string, LeadLike>): MessageLog {
  const recipientLeadId = linkedIds(record.fields["Recipient Lead"])[0] ?? null;
  const lead = recipientLeadId ? leads.get(recipientLeadId) : undefined;
  const raw = textField(record.fields, "Delivery Status");
  return {
    id: record.id,
    recipientLeadId,
    recipientLeadName: lead?.name ?? "Deleted or unavailable lead",
    recipientLeadEmail: lead?.email ?? null,
    recipientLeadPhone: lead?.phone ?? null,
    recipientLeadStatus: lead?.status ?? null,
    isOrphaned: !lead,
    channel: (textField(record.fields, "Channel") || "Unknown") as MessageLog["channel"],
    sequence: textField(record.fields, "Sequence") || null,
    sequenceStep: textField(record.fields, "Sequence Step") || null,
    messageBody: textField(record.fields, "Message Body"),
    deliveryStatus: deliveryStatus(raw),
    rawDeliveryStatus: raw || null,
    sentAt: textField(record.fields, "Sent At") || record.createdTime,
    mandrillMessageId: textField(record.fields, "Mandrill Message ID") || null,
    errorReason: textField(record.fields, "Error Reason") || null,
    createdTime: record.createdTime,
  };
}

const quote = (value: string) => `'${value.replaceAll("'", "\\'")}'`;
/** Airtable formula: Message Log rows in any of these sequences. */
export function sequenceFormula(sequences: string[]) {
  const parts = sequences.map((s) => `{Sequence}=${quote(s)}`);
  // No sequences means no rows (an always-false formula), not every row.
  if (!parts.length) return "FALSE()";
  return parts.length === 1 ? parts[0] : `OR(${parts.join(",")})`;
}

/** Query for Message Log filtered by formula, limited to the given fields. */
export function messageLogQuery(formula: string, fields = MESSAGE_LOG_FIELDS) {
  const params = new URLSearchParams({ filterByFormula: formula });
  fields.forEach((field) => params.append("fields[]", field));
  return params;
}
