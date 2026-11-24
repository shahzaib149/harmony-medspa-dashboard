import { listRecords, linkedIds, mapLead, textField } from "@/lib/airtable/leads-base";
import { CAMPAIGNS, getCampaign } from "@/lib/campaigns/registry";
import { isCampaignDateToday } from "@/lib/campaigns/campaign-date";
import {
  MESSAGE_LOG_FIELDS, MESSAGE_LOG_FIELDS_WITH_BODY, dateValue, mapMessageLog, messageLogQuery, sequenceFormula,
} from "@/lib/campaigns/message-log";
import { bustCache, withCache } from "@/lib/server-cache";
import type { CampaignSummary, NurtureEnrollment } from "@/lib/types/campaigns";
import type { MessageLog } from "@/types/message-log";

/** Cache key prefix cleared by invalidateLeadsBaseCache (every lead / nurture write). */
export const CAMPAIGN_CACHE_PREFIX = "campaigns:";

/**
 * Leads, Nurture Enrollments and the Message Log rows of the given sequences only.
 * The summary skips Message Body; a campaign's conversation view asks for it.
 */
export async function campaignData(options: { sequences?: string[]; withBody?: boolean } = {}) {
  const sequences = options.sequences ?? CAMPAIGNS.map((campaign) => campaign.sequence).filter((s): s is string => Boolean(s));
  const [leadRecords, enrollmentRecords, messageRecords] = await Promise.all([
    listRecords("Leads"),
    listRecords("Nurture Enrollments"),
    listRecords("Message Log", messageLogQuery(sequenceFormula(sequences), options.withBody ? MESSAGE_LOG_FIELDS_WITH_BODY : MESSAGE_LOG_FIELDS)),
  ]);
  const leads = leadRecords.map(mapLead);
  const leadMap = new Map(leads.map((lead) => [lead.id, lead]));
  const enrollments: NurtureEnrollment[] = enrollmentRecords.map((record) => {
    const linkedLeadId = linkedIds(record.fields.Lead)[0] ?? "";
    const lead = leadMap.get(linkedLeadId) ?? null;
    return { airtableRecordId: record.id, linkedLeadId, lead, status: (textField(record.fields, "Status") || "Active") as NurtureEnrollment["status"], currentStep: textField(record.fields, "Current Step"), nextSendAt: textField(record.fields, "Next Send At") || null, lastSentAt: textField(record.fields, "Last Sent At") || null, stopReason: textField(record.fields, "Stop Reason") || null, stoppedAtStep: textField(record.fields, "Stopped At Step") || null, createdAt: textField(record.fields, "Created At") || record.createdTime, notes: textField(record.fields, "Notes") || null };
  });
  const messages: MessageLog[] = messageRecords.map((record) => mapMessageLog(record, leadMap)).sort((a, b) => dateValue(b.sentAt) - dateValue(a.sentAt));
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

/** All registry campaign summaries (stale-while-revalidate, cleared on lead/nurture writes). */
export function cachedCampaignSummaries() {
  return withCache(`${CAMPAIGN_CACHE_PREFIX}summary`, 300, async () => summarizeCampaigns(await campaignData()));
}

async function loadCampaignDetail(slug: string) {
  const definition = getCampaign(slug);
  if (!definition) return null;
  const all = await campaignData();
  const own = await campaignData({ sequences: definition.sequence ? [definition.sequence] : [], withBody: true });
  const summary = summarizeCampaigns(all).find((item) => item.slug === slug)!;
  if (slug === "14-day-nurture") return { campaign: summary, leads: own.enrollments, messages: own.messages };
  const ids = new Set(own.messages.map((message) => message.recipientLeadId));
  return { campaign: summary, leads: own.leads.filter((lead) => lead.emailSentStatus || lead.smsSentStatus || ids.has(lead.id)), messages: own.messages };
}

/** One campaign's workspace data, including message bodies for its Conversations tab. */
export function campaignDetail(slug: string, forceRefresh = false) {
  const key = `${CAMPAIGN_CACHE_PREFIX}detail:${slug}`;
  if (forceRefresh) bustCache(key);
  return withCache(key, 120, () => loadCampaignDetail(slug));
}
