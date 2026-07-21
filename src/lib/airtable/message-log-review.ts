import "server-only";

import { airtableFetch, safeAirtableError, textField, type AirtableRecord } from "@/lib/airtable/leads-base";

const MESSAGE_LOG_TABLE = "Message Log";

const FAILED_STATUSES = new Set([
  "failed",
  "fail",
  "error",
  "rejected",
  "bounced",
  "undelivered",
  "invalid",
]);

export type MessageLogReviewRecord = {
  id: string;
  channel: "SMS" | "Email" | "Unknown";
  isFailed: boolean;
  rawStatus: string;
  attentionStatus: string;
  isReviewed: boolean;
  sequence: string | null;
  sequenceStep: string | null;
  sentAt: string | null;
  errorReason: string | null;
};

function normalizeChannel(value: string): MessageLogReviewRecord["channel"] {
  const normalized = value.trim().toLowerCase();
  if (normalized === "sms" || normalized === "text") return "SMS";
  if (normalized === "email") return "Email";
  return "Unknown";
}

function mapRecord(record: AirtableRecord): MessageLogReviewRecord {
  const rawStatus = textField(record.fields, "Delivery Status", "Status", "Mandrill Status");
  // Missing/empty Attention Status is treated as still needing review.
  const attentionStatus = textField(record.fields, "Attention Status") || "Needs Review";
  return {
    id: record.id,
    channel: normalizeChannel(textField(record.fields, "Channel", "Message Channel", "Type")),
    isFailed: FAILED_STATUSES.has(rawStatus.trim().toLowerCase()),
    rawStatus,
    attentionStatus,
    isReviewed: attentionStatus.trim().toLowerCase() === "reviewed",
    sequence: textField(record.fields, "Sequence", "Sequence Name", "Nurture Sequence") || null,
    sequenceStep: textField(record.fields, "Sequence Step", "Step") || null,
    sentAt: textField(record.fields, "Sent At", "Sent Date", "Created At") || null,
    errorReason: textField(record.fields, "Error Reason", "Error", "Failure Reason") || null,
  };
}

export async function getMessageLogReviewRecord(id: string): Promise<MessageLogReviewRecord> {
  const response = await airtableFetch(`${encodeURIComponent(MESSAGE_LOG_TABLE)}/${encodeURIComponent(id)}`);
  if (!response.ok) throw new Error(safeAirtableError(response.status));
  return mapRecord((await response.json()) as AirtableRecord);
}

// Marks the delivery failure reviewed. The original Delivery Status is never
// touched — only the review metadata fields are written.
export async function markMessageLogReviewed(
  id: string,
  reviewedBy: string,
): Promise<MessageLogReviewRecord> {
  const response = await airtableFetch(
    `${encodeURIComponent(MESSAGE_LOG_TABLE)}/${encodeURIComponent(id)}?typecast=true`,
    {
      method: "PATCH",
      body: JSON.stringify({
        fields: {
          "Attention Status": "Reviewed",
          "Reviewed At": new Date().toISOString(),
          "Reviewed By": reviewedBy.slice(0, 255),
        },
      }),
    },
  );
  if (!response.ok) {
    const raw = await response.text().catch(() => "");
    let detail = "";
    try {
      const parsed = JSON.parse(raw) as { error?: { message?: string; type?: string } };
      detail = parsed?.error?.message ?? parsed?.error?.type ?? "";
    } catch {
      detail = "";
    }
    throw new Error(detail || safeAirtableError(response.status));
  }
  return mapRecord((await response.json()) as AirtableRecord);
}
