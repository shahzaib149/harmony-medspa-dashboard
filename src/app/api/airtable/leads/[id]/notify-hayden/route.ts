import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { AIRTABLE_LEADS_BASE_ID, getAirtableApiKey, isAirtableConfigured } from "@/lib/airtable/config";
import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { resilientFetch } from "@/lib/network/resilient-fetch";

const TABLE_NAME = "Leads";
type AirtableRecord = { id: string; createdTime: string; fields: Record<string, unknown> };

function text(fields: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = fields[key];
    if (value !== undefined && value !== null && value !== "") return String(value);
  }
  return "";
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  let actor;
  try { ({ profile: actor } = await requireRole(request, "editor")); }
  catch (error) { return authErrorResponse(error); }

  const { id } = await context.params;
  if (!id || !/^[a-zA-Z0-9_-]{1,100}$/.test(id)) return Response.json({ error: "Invalid lead ID." }, { status: 400 });
  if (!isAirtableConfigured()) return Response.json({ error: "Airtable is not configured." }, { status: 500 });
  const webhookUrl = process.env.MAKE_NOTIFY_HAYDEN_WEBHOOK_URL?.trim();
  if (!webhookUrl) return Response.json({ error: "The Hayden notification automation is not configured." }, { status: 503 });

  const input = await request.json().catch(() => ({})) as { notificationId?: unknown };
  const notificationId = typeof input.notificationId === "string" && input.notificationId.trim() ? input.notificationId.trim().slice(0, 120) : crypto.randomUUID();
  const airtableResponse = await resilientFetch(
    `https://api.airtable.com/v0/${AIRTABLE_LEADS_BASE_ID}/${encodeURIComponent(TABLE_NAME)}/${encodeURIComponent(id)}`,
    { headers: { Authorization: `Bearer ${getAirtableApiKey()}` }, cache: "no-store" },
  );
  if (!airtableResponse.ok) return Response.json({ error: "The lead could not be loaded." }, { status: 404 });

  const lead = await airtableResponse.json() as AirtableRecord;
  const name = text(lead.fields, "Name") || "Unnamed lead";
  const email = text(lead.fields, "Email");
  const notifiedAt = new Date().toISOString();
  const searchValue = email || text(lead.fields, "Phone") || name;
  const payload = {
    notification_id: notificationId,
    lead_id: lead.id,
    lead_name: name,
    lead_phone: text(lead.fields, "Phone") || "Not captured",
    lead_email: email || "Not captured",
    lead_status: text(lead.fields, "Status") || "New",
    lead_source: text(lead.fields, "Source") || "Not captured",
    lead_created_at: text(lead.fields, "Lead Created At") || lead.createdTime,
    lead_message: text(lead.fields, "Message") || "No message captured.",
    lead_profile_url: `https://crm.harmonymedspafl.com/leads?view=all&lead=${lead.id}`,
    notified_by: actor.full_name || actor.email || "Harmony dashboard user",
    notified_at: notifiedAt,
  };

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json, text/plain, */*" };
    if (process.env.MAKE_WEBHOOK_SECRET?.trim()) headers["x-harmony-webhook-secret"] = process.env.MAKE_WEBHOOK_SECRET.trim();
    const response = await resilientFetch(webhookUrl, { method: "POST", headers, body: JSON.stringify(payload), cache: "no-store" });
    if (!response.ok) throw new Error(`Make returned HTTP ${response.status}`);
    const audit = await logAuditEvent({
      actor,
      action: "lead_shared_with_hayden",
      category: "communications",
      resource: { type: "lead", id: lead.id, label: name },
      summary: `Notified Hayden about ${name}`,
      metadata: { notification_id: notificationId, notified_at: notifiedAt },
      request,
    });
    return Response.json({ success: true, notificationId, notifiedAt, requestId: audit.requestId });
  } catch (error) {
    console.error("[notify-hayden] webhook failed", error);
    const audit = await logAuditEvent({
      actor,
      action: "lead_hayden_notification_failed",
      category: "communications",
      resource: { type: "lead", id: lead.id, label: name },
      summary: `Could not notify Hayden about ${name}`,
      metadata: { notification_id: notificationId, notified_at: notifiedAt },
      result: "failed",
      request,
    });
    return Response.json({ error: "Couldn’t notify Hayden. Try again.", notificationId, requestId: audit.requestId }, { status: 502 });
  }
}