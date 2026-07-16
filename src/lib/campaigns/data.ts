import { listRecords, linkedIds, mapLead, textField } from "@/lib/airtable/leads-base";
import { CAMPAIGNS, getCampaign } from "@/lib/campaigns/registry";
import { isCampaignDateToday } from "@/lib/campaigns/campaign-date";
import type { CampaignSummary, NurtureEnrollment } from "@/lib/types/campaigns";
import type { MessageLog } from "@/types/message-log";

function dateValue(value: string | null | undefined) { const time = Date.parse(value ?? ""); return Number.isFinite(time) ? time : 0; }
function delivery(value: string) { return ["sent", "delivered", "success", "successful", "ok"].includes(value.toLowerCase()) ? "Sent" : ["failed", "rejected", "bounced", "undelivered", "error"].includes(value.toLowerCase()) ? "Failed" : "Pending"; }

export async function campaignData() {
  const [leadRecords, enrollmentRecords, messageRecords] = await Promise.all([
    listRecords("Leads"), listRecords("Nurture Enrollments"), listRecords("Message Log", new URLSearchParams({ "sort[0][field]": "Sent At", "sort[0][direction]": "desc" })),
  ]);
  const leads = leadRecords.map(mapLead);
  const leadMap = new Map(leads.map((lead) => [lead.id, lead]));
  const enrollments: NurtureEnrollment[] = enrollmentRecords.map((record) => {
    const linkedLeadId = linkedIds(record.fields.Lead)[0] ?? "";
    const lead = leadMap.get(linkedLeadId) ?? null;
    return { airtableRecordId: record.id, linkedLeadId, lead, status: (textField(record.fields, "Status") || "Active") as NurtureEnrollment["status"], currentStep: textField(record.fields, "Current Step"), nextSendAt: textField(record.fields, "Next Send At") || null, lastSentAt: textField(record.fields, "Last Sent At") || null, stopReason: textField(record.fields, "Stop Reason") || null, stoppedAtStep: textField(record.fields, "Stopped At Step") || null, createdAt: textField(record.fields, "Created At") || record.createdTime, notes: textField(record.fields, "Notes") || null };
  });
  const messages: MessageLog[] = messageRecords.map((record) => {
    const recipientLeadId = linkedIds(record.fields["Recipient Lead"])[0] ?? null;
    const lead = recipientLeadId ? leadMap.get(recipientLeadId) : null;
    const sentAt = textField(record.fields, "Sent At") || record.createdTime;
    const raw = textField(record.fields, "Delivery Status");
    return { id: record.id, recipientLeadId, recipientLeadName: lead?.name ?? "Deleted or unavailable lead", recipientLeadEmail: lead?.email ?? null, recipientLeadPhone: lead?.phone ?? null, recipientLeadStatus: lead?.status ?? null, isOrphaned: !lead, channel: (textField(record.fields, "Channel") || "Unknown") as MessageLog["channel"], sequence: textField(record.fields, "Sequence") || null, sequenceStep: textField(record.fields, "Sequence Step") || null, messageBody: textField(record.fields, "Message Body"), deliveryStatus: delivery(raw) as MessageLog["deliveryStatus"], rawDeliveryStatus: raw || null, sentAt, mandrillMessageId: textField(record.fields, "Mandrill Message ID") || null, errorReason: textField(record.fields, "Error Reason") || null, createdTime: record.createdTime };
  }).sort((a, b) => dateValue(b.sentAt) - dateValue(a.sentAt));
  return { leads, enrollments, messages };
}

export function summarizeCampaigns(data: Awaited<ReturnType<typeof campaignData>>): CampaignSummary[] {
  return CAMPAIGNS.map((definition): CampaignSummary => {
    const messages = data.messages.filter((message) => message.sequence === definition.sequence);
    if (definition.slug === "14-day-nurture") {
      const active = data.enrollments.filter((item) => item.status === "Active").length;
      const completed = data.enrollments.filter((item) => item.status === "Completed").length;
      const booked = data.enrollments.filter((item) => item.lead?.status === "Booked").length;
      const replied = data.enrollments.filter((item) => item.lead?.replied).length;
      const due = data.enrollments.filter((item) => item.status === "Active" && isCampaignDateToday(item.nextSendAt)).length;
      const last = Math.max(...data.enrollments.map((item) => Math.max(dateValue(item.lastSentAt), dateValue(item.createdAt))), ...messages.map((item) => dateValue(item.sentAt)), 0);
      return { ...definition, totalLeads: data.enrollments.length, activeLeads: active, completedLeads: completed, messagesSent: messages.filter((item) => item.deliveryStatus === "Sent").length, lastActivity: last ? new Date(last).toISOString() : null, metrics: { stopped: data.enrollments.filter((item) => item.status === "Stopped").length, dueToday: due, replyRate: data.enrollments.length ? Math.round(replied / data.enrollments.length * 100) : 0, bookingRate: data.enrollments.length ? Math.round(booked / data.enrollments.length * 100) : 0 } };
    }
    const processed = data.leads.filter((lead) => lead.emailSentStatus || lead.smsSentStatus || messages.some((message) => message.recipientLeadId === lead.id));
    const sent = messages.filter((item) => item.deliveryStatus === "Sent");
    const last = Math.max(...messages.map((item) => dateValue(item.sentAt)), ...processed.map((item) => dateValue(item.lastContactedAt)), 0);
    const responseTimes = processed.map((lead) => dateValue(lead.lastContactedAt) - dateValue(lead.createdAt)).filter((value) => value >= 0);
    return { ...definition, totalLeads: processed.length, activeLeads: 0, completedLeads: processed.length, messagesSent: sent.length, lastActivity: last ? new Date(last).toISOString() : null, metrics: { emailSent: sent.filter((item) => item.channel === "Email").length, smsSent: sent.filter((item) => item.channel === "SMS").length, failedDeliveries: messages.filter((item) => item.deliveryStatus === "Failed").length, bookedLeads: processed.filter((lead) => lead.status === "Booked").length, averageResponseSeconds: responseTimes.length ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / 1000) : 0 } };
  });
}

export async function campaignDetail(slug: string) {
  const definition = getCampaign(slug);
  if (!definition) return null;
  const data = await campaignData();
  const summary = summarizeCampaigns(data).find((item) => item.slug === slug)!;
  if (slug === "14-day-nurture") return { campaign: summary, leads: data.enrollments, messages: data.messages.filter((message) => message.sequence === definition.sequence) };
  const ids = new Set(data.messages.filter((message) => message.sequence === definition.sequence).map((message) => message.recipientLeadId));
  return { campaign: summary, leads: data.leads.filter((lead) => lead.emailSentStatus || lead.smsSentStatus || ids.has(lead.id)), messages: data.messages.filter((message) => message.sequence === definition.sequence) };
}
