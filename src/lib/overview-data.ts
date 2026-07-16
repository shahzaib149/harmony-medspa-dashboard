import { DateTime } from "luxon";
import { fetchAllRecords, num, str } from "@/lib/airtable/client";
import {
  linkedIds,
  listRecords,
  textField,
  type AirtableRecord,
} from "@/lib/airtable/leads-base";
import { isAirtableConfigured } from "@/lib/airtable/config";
import { requireRole } from "@/lib/auth/requireRole";
import { createServiceClient } from "@/lib/supabase/server";
import type {
  AttentionItem,
  ActivityDay,
  CampaignHealth,
  ClinicMetric,
  DeliveryChannelHealth,
  DeliveryTrendPoint,
  GoogleAdsSummary,
  LeadFunnelStage,
  LeadSourcePerformance,
  LeadTrendPoint,
  NurtureJourneyStep,
  OverviewMetric,
  OverviewPeriodKey,
  OverviewResponse,
  RecentActivityItem,
} from "@/lib/overview-types";

const ZONE = "America/New_York";
const SUCCESS_STATUSES = new Set([
  "sent",
  "delivered",
  "success",
  "successful",
  "ok",
]);
const FAILED_STATUSES = new Set([
  "failed",
  "fail",
  "error",
  "rejected",
  "bounced",
  "undelivered",
  "invalid",
]);
const PENDING_STATUSES = new Set(["pending", "queued", "scheduled", "sending"]);

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  utmSource: string;
  replied: boolean;
  createdAt: string;
  lastContactedAt: string | null;
  emailSentStatus: string;
  smsSentStatus: string;
};

type Enrollment = {
  id: string;
  leadId: string;
  status: string;
  currentStep: string;
  nextSendAt: string | null;
  lastSentAt: string | null;
  createdAt: string;
};

type Message = {
  id: string;
  leadId: string | null;
  channel: "SMS" | "Email" | "Unknown";
  sequence: string | null;
  sequenceStep: string | null;
  status: "successful" | "failed" | "pending" | "unknown";
  sentAt: string;
};

type Period = {
  key: OverviewPeriodKey;
  label: string;
  from: DateTime;
  to: DateTime;
  previousFrom: DateTime;
  previousTo: DateTime;
  previousLabel: string;
};

function periodFor(key: OverviewPeriodKey): Period {
  const now = DateTime.now().setZone(ZONE);
  if (key !== "month") {
    const days = key === "7d" ? 7 : key === "90d" ? 90 : 30;
    const from = now.minus({ days: days - 1 }).startOf("day");
    const previousTo = from.minus({ milliseconds: 1 });
    return {
      key,
      label: `Last ${days} days`,
      from,
      to: now,
      previousFrom: previousTo.minus({ days: days - 1 }).startOf("day"),
      previousTo,
      previousLabel: `previous ${days} days`,
    };
  }
  const from = now.startOf("month");
  const previousFrom = from.minus({ months: 1 });
  return {
    key: "month",
    label: now.toFormat("LLLL yyyy"),
    from,
    to: now,
    previousFrom,
    previousTo: from.minus({ milliseconds: 1 }),
    previousLabel: previousFrom.toFormat("LLLL yyyy"),
  };
}

function validTime(value: string | null | undefined) {
  const time = Date.parse(value ?? "");
  return Number.isFinite(time) ? time : null;
}

function inWindow(value: string | null | undefined, from: DateTime, to: DateTime) {
  const time = validTime(value);
  return time !== null && time >= from.toMillis() && time <= to.toMillis();
}

function mapLead(record: AirtableRecord): Lead {
  const fields = record.fields;
  return {
    id: record.id,
    name: textField(fields, "Name", "Full Name", "Lead Name") || "Unnamed lead",
    email: textField(fields, "Email", "Email Address"),
    phone: textField(fields, "Phone", "Phone Number", "Mobile"),
    status: textField(fields, "Status", "Lead Status") || "New",
    source: textField(fields, "Source", "Lead Source"),
    utmSource: textField(fields, "UTM Source"),
    replied: fields.Replied === true,
    createdAt: textField(fields, "Lead Created At") || record.createdTime,
    lastContactedAt: textField(fields, "Last Contacted At") || null,
    emailSentStatus: textField(fields, "Email Sent Status"),
    smsSentStatus: textField(fields, "SMS Sent Status"),
  };
}

function mapEnrollment(record: AirtableRecord): Enrollment {
  return {
    id: record.id,
    leadId: linkedIds(record.fields.Lead)[0] ?? "",
    status: textField(record.fields, "Status") || "Active",
    currentStep: textField(record.fields, "Current Step"),
    nextSendAt: textField(record.fields, "Next Send At") || null,
    lastSentAt: textField(record.fields, "Last Sent At") || null,
    createdAt: textField(record.fields, "Created At") || record.createdTime,
  };
}

function normalizeChannel(value: string): Message["channel"] {
  const normalized = value.toLowerCase();
  return normalized === "sms" || normalized === "text"
    ? "SMS"
    : normalized === "email"
      ? "Email"
      : "Unknown";
}

function normalizeDelivery(value: string): Message["status"] {
  const normalized = value.trim().toLowerCase();
  if (SUCCESS_STATUSES.has(normalized)) return "successful";
  if (FAILED_STATUSES.has(normalized)) return "failed";
  if (PENDING_STATUSES.has(normalized)) return "pending";
  return "unknown";
}

function mapMessage(record: AirtableRecord): Message {
  const sentAt =
    textField(record.fields, "Sent At", "Sent Date", "Created At") ||
    record.createdTime;
  return {
    id: record.id,
    leadId: linkedIds(record.fields["Recipient Lead"])[0] ?? null,
    channel: normalizeChannel(
      textField(record.fields, "Channel", "Message Channel", "Type"),
    ),
    sequence:
      textField(record.fields, "Sequence", "Sequence Name", "Nurture Sequence") ||
      null,
    sequenceStep: textField(record.fields, "Sequence Step", "Step") || null,
    status: normalizeDelivery(
      textField(record.fields, "Delivery Status", "Status", "Mandrill Status"),
    ),
    sentAt,
  };
}

function contacted(lead: Lead) {
  const status = lead.status.toLowerCase();
  return Boolean(
    lead.lastContactedAt ||
      SUCCESS_STATUSES.has(lead.emailSentStatus.toLowerCase()) ||
      SUCCESS_STATUSES.has(lead.smsSentStatus.toLowerCase()) ||
      ["contacted", "booked", "not interested"].includes(status),
  );
}

function percentageChange(value: number, previous: number) {
  if (previous <= 0) return null;
  return Math.round(((value - previous) / previous) * 100);
}

function metric(value: number | null, previousValue?: number | null): OverviewMetric {
  return {
    value,
    ...(previousValue === undefined
      ? {}
      : {
          previousValue,
          changePercent:
            value === null || previousValue === null
              ? null
              : percentageChange(value, previousValue),
        }),
  };
}

function normalizeSource(lead: Lead) {
  const raw = (lead.utmSource || lead.source || "Unknown").trim();
  const normalized = raw
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return "Unknown";
  if (/google/i.test(normalized)) return "Google Ads";
  if (/manual/i.test(normalized)) return "Manual campaign entry";
  if (/website|web form/i.test(normalized)) return "Website";
  if (/refer/i.test(normalized)) return "Referral";
  if (/organic/i.test(normalized)) return "Organic";
  if (/existing patient/i.test(normalized)) return "Existing patient";
  return normalized.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function funnelFor(leads: Lead[]): LeadFunnelStage[] {
  const counts = [
    leads.length,
    leads.filter(contacted).length,
    leads.filter((lead) => lead.replied).length,
    leads.filter((lead) => lead.status.toLowerCase() === "booked").length,
  ];
  const labels = ["New leads", "Contacted", "Replied", "Booked"];
  const keys = ["new", "contacted", "replied", "booked"] as const;
  return counts.map((count, index) => ({
    key: keys[index],
    label: labels[index],
    count,
    percentOfFirst: counts[0] ? Math.round((count / counts[0]) * 100) : 0,
    conversionFromPrevious:
      index === 0 || counts[index - 1] === 0
        ? null
        : Math.round((count / counts[index - 1]) * 100),
    dropOffFromPrevious:
      index === 0 ? null : Math.max(0, counts[index - 1] - count),
  }));
}

function trendFor(leads: Lead[], period: Period): LeadTrendPoint[] {
  const points = new Map<string, LeadTrendPoint>();
  let cursor = period.from.startOf("day");
  while (cursor <= period.to) {
    const date = cursor.toISODate()!;
    points.set(date, {
      date,
      label: cursor.toFormat("MMM d"),
      leads: 0,
      contacted: 0,
      replied: 0,
      booked: 0,
    });
    cursor = cursor.plus({ days: 1 });
  }
  leads.forEach((lead) => {
    const date = DateTime.fromISO(lead.createdAt, { zone: "utc" })
      .setZone(ZONE)
      .toISODate();
    const point = date ? points.get(date) : null;
    if (!point) return;
    point.leads += 1;
    if (contacted(lead)) point.contacted += 1;
    if (lead.replied) point.replied += 1;
    if (lead.status.toLowerCase() === "booked") point.booked += 1;
  });
  return [...points.values()];
}

function sourcePerformanceFor(leads: Lead[]): LeadSourcePerformance[] {
  const grouped = new Map<string, { leads: number; replied: number; booked: number }>();
  leads.forEach((lead) => {
    const source = normalizeSource(lead);
    const current = grouped.get(source) ?? { leads: 0, replied: 0, booked: 0 };
    current.leads += 1;
    if (lead.replied) current.replied += 1;
    if (lead.status.toLowerCase() === "booked") current.booked += 1;
    grouped.set(source, current);
  });
  return [...grouped.entries()]
    .map(([source, value]) => ({
      source,
      leads: value.leads,
      share: leads.length ? Math.round((value.leads / leads.length) * 100) : 0,
      replied: value.replied,
      booked: value.booked,
      conversionRate: value.leads
        ? Math.round((value.booked / value.leads) * 100)
        : 0,
    }))
    .sort((a, b) => b.leads - a.leads || a.source.localeCompare(b.source));
}

function deliveryChannel(messages: Message[], channel: "SMS" | "Email"): DeliveryChannelHealth {
  const relevant = messages.filter((message) => message.channel === channel);
  const successful = relevant.filter((message) => message.status === "successful").length;
  const failed = relevant.filter((message) => message.status === "failed").length;
  const pending = relevant.filter((message) => message.status === "pending").length;
  const unknown = relevant.filter((message) => message.status === "unknown").length;
  const knownFinal = successful + failed;
  return {
    channel,
    sent: relevant.length,
    successful,
    failed,
    pending,
    unknown,
    successRate: knownFinal ? Math.round((successful / knownFinal) * 100) : null,
  };
}

function bucketDate(value: string | null | undefined) {
  if (!value) return null;
  const date = DateTime.fromISO(value, { zone: "utc" }).setZone(ZONE);
  return date.isValid ? date.toISODate() : null;
}

function deliveryTrendFor(messages: Message[], period: Period): DeliveryTrendPoint[] {
  const points = new Map<string, DeliveryTrendPoint>();
  let cursor = period.from.startOf("day");
  while (cursor <= period.to) {
    const date = cursor.toISODate()!;
    points.set(date, {
      date,
      label: cursor.toFormat("MMM d"),
      smsSuccessful: 0,
      smsFailed: 0,
      emailSuccessful: 0,
      emailFailed: 0,
    });
    cursor = cursor.plus({ days: 1 });
  }
  messages.forEach((message) => {
    const point = points.get(bucketDate(message.sentAt) ?? "");
    if (!point || (message.status !== "successful" && message.status !== "failed")) return;
    if (message.channel === "SMS") {
      point[message.status === "successful" ? "smsSuccessful" : "smsFailed"] += 1;
    }
    if (message.channel === "Email") {
      point[message.status === "successful" ? "emailSuccessful" : "emailFailed"] += 1;
    }
  });
  return [...points.values()];
}

const NURTURE_STEPS = ["Day 1 SMS", "Day 3 Email", "Day 5 SMS", "Day 8 Email", "Day 12 SMS"];

function nurtureJourneyFor(enrollments: Enrollment[]): NurtureJourneyStep[] {
  const total = enrollments.length;
  const status = (enrollment: Enrollment) => enrollment.status.trim().toLowerCase();
  const currentIndex = (enrollment: Enrollment) =>
    NURTURE_STEPS.findIndex((step) => step.toLowerCase() === enrollment.currentStep.trim().toLowerCase());
  const journey = NURTURE_STEPS.map((step, index) => {
    const reached = enrollments.filter(
      (enrollment) => status(enrollment) === "completed" || currentIndex(enrollment) >= index,
    ).length;
    const active = enrollments.filter(
      (enrollment) => status(enrollment) === "active" && currentIndex(enrollment) === index,
    ).length;
    const stopped = enrollments.filter(
      (enrollment) => status(enrollment) === "stopped" && currentIndex(enrollment) === index,
    ).length;
    return {
      key: step.toLowerCase().replace(/\s+/g, "-"),
      step,
      reached,
      active,
      stopped,
      percentage: total ? Math.round((reached / total) * 100) : 0,
    };
  });
  const completed = enrollments.filter((item) => status(item) === "completed").length;
  const stopped = enrollments.filter((item) => status(item) === "stopped").length;
  return [
    ...journey,
    { key: "completed", step: "Completed", reached: completed, active: 0, stopped: 0, percentage: total ? Math.round((completed / total) * 100) : 0 },
    { key: "stopped", step: "Stopped", reached: stopped, active: 0, stopped, percentage: total ? Math.round((stopped / total) * 100) : 0 },
  ];
}

function activityByDayFor(values: Array<string | null | undefined>, period: Period): ActivityDay[] {
  const points = new Map<string, ActivityDay>();
  let cursor = period.from.startOf("day");
  while (cursor <= period.to) {
    const date = cursor.toISODate()!;
    points.set(date, { date, label: cursor.toFormat("ccc, MMM d"), count: 0 });
    cursor = cursor.plus({ days: 1 });
  }
  values.forEach((value) => {
    const point = points.get(bucketDate(value) ?? "");
    if (point) point.count += 1;
  });
  return [...points.values()];
}

function campaignHealthFor(
  leads: Lead[],
  enrollments: Enrollment[],
  messages: Message[],
): CampaignHealth[] {
  const leadMap = new Map(leads.map((lead) => [lead.id, lead]));
  const campaign = (
    slug: CampaignHealth["slug"],
    name: string,
    campaignMessages: Message[],
    activeLeads: number,
    leadsProcessed: number,
    replies: number,
    booked: number,
    nextDueAt: string | null,
    enrollmentActivity: string[],
  ): CampaignHealth => {
    const successful = campaignMessages.filter(
      (message) => message.status === "successful",
    ).length;
    const failed = campaignMessages.filter((message) => message.status === "failed").length;
    const final = successful + failed;
    const overdue = nextDueAt ? (validTime(nextDueAt) ?? Infinity) < Date.now() : false;
    const lastActivity = [...campaignMessages.map((message) => message.sentAt), ...enrollmentActivity]
      .map(validTime)
      .filter((value): value is number => value !== null)
      .sort((a, b) => b - a)[0];
    return {
      slug,
      name,
      status: failed > 0 || overdue ? "Needs attention" : campaignMessages.length ? "Healthy" : "Active",
      activeLeads,
      leadsProcessed,
      smsSent: campaignMessages.filter((message) => message.channel === "SMS").length,
      emailsSent: campaignMessages.filter((message) => message.channel === "Email").length,
      messagesSent: campaignMessages.length,
      deliverySuccessRate: final ? Math.round((successful / final) * 100) : null,
      failedMessages: failed,
      replies,
      booked,
      averageFirstContactSeconds:
        slug === "speed-to-lead" ? averageSpeedSeconds(leads, campaignMessages) : null,
      nextDueAt,
      lastActivityAt: lastActivity ? new Date(lastActivity).toISOString() : null,
    };
  };

  const speedMessages = messages.filter((message) => message.sequence === "Speed-to-Lead");
  const processedIds = new Set(speedMessages.map((message) => message.leadId).filter(Boolean));
  const speedLeads = leads.filter(
    (lead) =>
      processedIds.has(lead.id) ||
      SUCCESS_STATUSES.has(lead.emailSentStatus.toLowerCase()) ||
      SUCCESS_STATUSES.has(lead.smsSentStatus.toLowerCase()),
  );
  const nurtureMessages = messages.filter((message) => message.sequence === "14-Day Nurture");
  const activeEnrollments = enrollments.filter(
    (enrollment) => enrollment.status.toLowerCase() === "active",
  );
  const nextDueAt = activeEnrollments
    .map((enrollment) => enrollment.nextSendAt)
    .filter((value): value is string => validTime(value) !== null)
    .sort((a, b) => (validTime(a) ?? 0) - (validTime(b) ?? 0))[0] ?? null;
  const enrolledLeads = enrollments
    .map((enrollment) => leadMap.get(enrollment.leadId))
    .filter((lead): lead is Lead => Boolean(lead));

  return [
    campaign(
      "speed-to-lead",
      "Speed-to-Lead",
      speedMessages,
      0,
      speedLeads.length,
      speedLeads.filter((lead) => lead.replied).length,
      speedLeads.filter((lead) => lead.status.toLowerCase() === "booked").length,
      null,
      speedLeads.map((lead) => lead.lastContactedAt ?? ""),
    ),
    campaign(
      "14-day-nurture",
      "14-Day Nurture",
      nurtureMessages,
      activeEnrollments.length,
      enrollments.length,
      enrolledLeads.filter((lead) => lead.replied).length,
      enrolledLeads.filter((lead) => lead.status.toLowerCase() === "booked").length,
      nextDueAt,
      enrollments.flatMap((enrollment) => [enrollment.lastSentAt ?? "", enrollment.createdAt]),
    ),
  ];
}

function averageSpeedSeconds(leads: Lead[], messages: Message[]) {
  const leadMap = new Map(leads.map((lead) => [lead.id, validTime(lead.createdAt)]));
  const firstMessage = new Map<string, number>();
  messages.forEach((message) => {
    if (
      message.sequence !== "Speed-to-Lead" ||
      !message.leadId ||
      message.status !== "successful"
    )
      return;
    const created = leadMap.get(message.leadId);
    const sent = validTime(message.sentAt);
    if (created === null || created === undefined || sent === null || sent < created) return;
    const existing = firstMessage.get(message.leadId);
    if (existing === undefined || sent < existing) firstMessage.set(message.leadId, sent);
  });
  const values = [...firstMessage.entries()].flatMap(([leadId, sent]) => {
    const created = leadMap.get(leadId);
    return created === null || created === undefined ? [] : [sent - created];
  });
  return values.length
    ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length / 1000)
    : null;
}

function mapClinicMetric(record: AirtableRecord): ClinicMetric | null {
  const month = textField(record.fields, "Month");
  const totalVisits = Number(record.fields["Total Visits"]);
  const newPatients = Number(record.fields["New Patients"]);
  if (
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(month) ||
    !Number.isFinite(totalVisits) ||
    !Number.isFinite(newPatients)
  )
    return null;
  return {
    id: record.id,
    month,
    totalVisits,
    newPatients,
    updatedAt: textField(record.fields, "Updated At") || record.createdTime || null,
  };
}

function adsDate(fields: Record<string, unknown>, createdTime: string) {
  return (
    str(fields, "Date", "date", "Day", "day", "Segment Date", "Reporting Date") ||
    str(fields, "pulledAt", "Pulled At", "Last Updated", "Updated At", "Synced At") ||
    createdTime
  );
}

function googleAdsFor(
  campaignRecords: Awaited<ReturnType<typeof fetchAllRecords>>,
  creativeRecords: Awaited<ReturnType<typeof fetchAllRecords>>,
  period: Period,
  periodLeads: Lead[],
): GoogleAdsSummary {
  const campaigns = campaignRecords
    .map((record) => ({
      name: str(record.fields, "campaignName", "Campaign Name", "Campaign") || "Unnamed campaign",
      spend: num(record.fields, "cost", "Cost", "Spend"),
      impressions: num(record.fields, "impressions", "Impressions"),
      clicks: num(record.fields, "clicks", "Clicks"),
      conversions: num(record.fields, "conversions", "Conversions"),
      conversionValue: num(
        record.fields,
        "conversionValue",
        "Conversion Value",
        "Revenue",
        "All Conversion Value",
      ),
      syncedAt: adsDate(record.fields, record.createdTime),
    }))
    .filter((record) => inWindow(record.syncedAt, period.from, period.to));
  const creatives = creativeRecords
    .map((record) => ({
      name: str(record.fields, "adName", "Ad Name", "Ad", "Name") || "Unnamed creative",
      clicks: num(record.fields, "clicks", "Clicks"),
      conversions: num(record.fields, "conversions", "Conversions"),
      spend: num(record.fields, "cost", "Cost", "Spend"),
      date: adsDate(record.fields, record.createdTime),
    }))
    .filter((record) => inWindow(record.date, period.from, period.to));
  const groupedCampaigns = new Map<string, { spend: number; conversions: number; clicks: number }>();
  campaigns.forEach((campaign) => {
    const current = groupedCampaigns.get(campaign.name) ?? { spend: 0, conversions: 0, clicks: 0 };
    current.spend += campaign.spend;
    current.conversions += campaign.conversions;
    current.clicks += campaign.clicks;
    groupedCampaigns.set(campaign.name, current);
  });
  const groupedCreatives = new Map<string, { spend: number; conversions: number; clicks: number }>();
  creatives.forEach((creative) => {
    const current = groupedCreatives.get(creative.name) ?? { spend: 0, conversions: 0, clicks: 0 };
    current.spend += creative.spend;
    current.conversions += creative.conversions;
    current.clicks += creative.clicks;
    groupedCreatives.set(creative.name, current);
  });
  const spend = campaigns.reduce((sum, campaign) => sum + campaign.spend, 0);
  const impressions = campaigns.reduce((sum, campaign) => sum + campaign.impressions, 0);
  const clicks = campaigns.reduce((sum, campaign) => sum + campaign.clicks, 0);
  const conversions = campaigns.reduce((sum, campaign) => sum + campaign.conversions, 0);
  const conversionValue = campaigns.reduce(
    (sum, campaign) => sum + campaign.conversionValue,
    0,
  );
  const attributedLeads = periodLeads.filter(
    (lead) => normalizeSource(lead) === "Google Ads",
  ).length;
  const ranking = <T extends [string, { spend: number; conversions: number; clicks: number }]>(
    entries: T[],
  ) =>
    entries.sort(
      (a, b) =>
        b[1].conversions - a[1].conversions ||
        b[1].clicks - a[1].clicks ||
        b[1].spend - a[1].spend,
    )[0]?.[0] ?? null;
  const latestSync = campaigns
    .map((campaign) => campaign.syncedAt)
    .filter((value) => validTime(value) !== null)
    .sort((a, b) => (validTime(b) ?? 0) - (validTime(a) ?? 0))[0] ?? null;
  const daily = new Map<string, GoogleAdsSummary["daily"][number]>();
  let cursor = period.from.startOf("day");
  while (cursor <= period.to) {
    const date = cursor.toISODate()!;
    daily.set(date, {
      date,
      label: cursor.toFormat("MMM d"),
      spend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      leads: 0,
    });
    cursor = cursor.plus({ days: 1 });
  }
  campaigns.forEach((campaign) => {
    const point = daily.get(bucketDate(campaign.syncedAt) ?? "");
    if (!point) return;
    point.spend += campaign.spend;
    point.impressions += campaign.impressions;
    point.clicks += campaign.clicks;
    point.conversions += campaign.conversions;
  });
  periodLeads.forEach((lead) => {
    if (normalizeSource(lead) !== "Google Ads") return;
    const point = daily.get(bucketDate(lead.createdAt) ?? "");
    if (point) point.leads += 1;
  });
  return {
    spend,
    impressions,
    clicks,
    ctr: impressions ? (clicks / impressions) * 100 : null,
    averageCpc: clicks ? spend / clicks : null,
    conversions,
    costPerConversion: conversions ? spend / conversions : null,
    attributedLeads,
    costPerLead: attributedLeads ? spend / attributedLeads : null,
    roas: conversionValue > 0 && spend > 0 ? conversionValue / spend : null,
    topCampaign: ranking([...groupedCampaigns.entries()]),
    topCreative: ranking([...groupedCreatives.entries()]),
    attentionMessage:
      spend > 0 && conversions === 0
        ? `${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(spend)} spent with no recorded conversions`
        : null,
    latestSyncAt: latestSync,
    daily: [...daily.values()],
  };
}

function attentionFor(
  leads: Lead[],
  enrollments: Enrollment[],
  messages: Message[],
): AttentionItem[] {
  const items: AttentionItem[] = [];
  const failedSms = messages.filter(
    (message) => message.channel === "SMS" && message.status === "failed",
  ).length;
  const failedEmail = messages.filter(
    (message) => message.channel === "Email" && message.status === "failed",
  ).length;
  const disconnected = enrollments.filter((enrollment) => !enrollment.leadId).length;
  const overdueEnrollments = enrollments.filter(
    (enrollment) =>
      enrollment.status.toLowerCase() === "active" &&
      enrollment.nextSendAt &&
      (validTime(enrollment.nextSendAt) ?? Infinity) < Date.now(),
  ).length;
  const overdueLeads = leads.filter(
    (lead) =>
      lead.status.toLowerCase() === "new" &&
      !contacted(lead) &&
      (validTime(lead.createdAt) ?? Date.now()) < Date.now() - 15 * 60 * 1000,
  ).length;
  const withoutPhone = leads.filter((lead) => !lead.phone).length;
  const withoutEmail = leads.filter((lead) => !lead.email).length;
  const duplicates = leads.filter((lead) => lead.status.toLowerCase() === "duplicate").length;
  const add = (
    id: string,
    count: number,
    severity: AttentionItem["severity"],
    title: string,
    detail: string,
    actionLabel: string,
    href: string,
  ) => {
    if (count > 0) items.push({ id, count, severity, title, detail, actionLabel, href });
  };
  add("failed-sms", failedSms, "critical", `${failedSms} SMS ${failedSms === 1 ? "message" : "messages"} failed`, "Provider delivery status is marked failed.", "Review Message Log", "/message-logs?channel=SMS&status=Failed");
  add("failed-email", failedEmail, "critical", `${failedEmail} email ${failedEmail === 1 ? "message" : "messages"} failed`, "Provider delivery status is marked failed.", "Review Message Log", "/message-logs?channel=Email&status=Failed");
  add("disconnected", disconnected, "critical", `${disconnected} ${disconnected === 1 ? "enrollment is" : "enrollments are"} disconnected`, "The enrollment no longer resolves to a lead.", "Review campaign", "/campaigns/14-day-nurture");
  add("overdue-enrollment", overdueEnrollments, "warning", `${overdueEnrollments} campaign ${overdueEnrollments === 1 ? "step is" : "steps are"} overdue`, "The scheduled send time has passed for an active enrollment.", "Review nurture", "/campaigns/14-day-nurture");
  add("overdue-lead", overdueLeads, "warning", `${overdueLeads} new ${overdueLeads === 1 ? "lead needs" : "leads need"} contact`, "No contact signal was recorded within 15 minutes.", "Review leads", "/leads?status=New");
  add("missing-phone", withoutPhone, "warning", `${withoutPhone} ${withoutPhone === 1 ? "lead has" : "leads have"} no phone`, "SMS follow-up is unavailable for these leads.", "Review leads", "/leads");
  add("missing-email", withoutEmail, "warning", `${withoutEmail} ${withoutEmail === 1 ? "lead has" : "leads have"} no email`, "Email follow-up is unavailable for these leads.", "Review leads", "/leads");
  add("duplicates", duplicates, "warning", `${duplicates} duplicate ${duplicates === 1 ? "lead needs" : "leads need"} review`, "These records are marked Duplicate.", "Review duplicates", "/leads?status=Duplicate");
  return items.sort((a, b) => (a.severity === b.severity ? b.count - a.count : a.severity === "critical" ? -1 : 1));
}

function systemActivity(
  leads: Lead[],
  enrollments: Enrollment[],
  messages: Message[],
  metrics: ClinicMetric[],
): RecentActivityItem[] {
  const leadMap = new Map(leads.map((lead) => [lead.id, lead]));
  const leadItems: RecentActivityItem[] = leads.slice(0, 8).map((lead) => ({
    id: `lead-${lead.id}`,
    category: "lead",
    title: `${lead.name} entered the lead pipeline`,
    actor: "System",
    resource: lead.status,
    occurredAt: lead.createdAt,
    href: "/leads",
  }));
  const enrollmentItems: RecentActivityItem[] = enrollments.slice(0, 8).map((enrollment) => ({
    id: `enrollment-${enrollment.id}`,
    category: "campaign",
    title: `${leadMap.get(enrollment.leadId)?.name ?? "A lead"} was added to 14-Day Nurture`,
    actor: "Campaign automation",
    resource: enrollment.currentStep || "14-Day Nurture",
    occurredAt: enrollment.createdAt,
    href: "/campaigns/14-day-nurture",
  }));
  const messageItems: RecentActivityItem[] = messages.slice(0, 8).map((message) => ({
    id: `message-${message.id}`,
    category: "message",
    title: `${message.sequenceStep || message.channel} ${message.status === "failed" ? "failed for" : "sent to"} ${message.leadId ? leadMap.get(message.leadId)?.name ?? "a lead" : "a disconnected lead"}`,
    actor: message.sequence || "Messaging automation",
    resource: message.channel,
    occurredAt: message.sentAt,
    href: "/message-logs",
  }));
  const metricItems: RecentActivityItem[] = metrics.slice(-4).map((item) => ({
    id: `clinic-${item.id}`,
    category: "clinic",
    title: `Clinic metrics updated for ${DateTime.fromFormat(item.month, "yyyy-MM").toFormat("LLLL")}`,
    actor: "Clinic team",
    resource: `${item.totalVisits} visits · ${item.newPatients} new patients`,
    occurredAt: item.updatedAt ?? `${item.month}-01T00:00:00.000Z`,
    href: "/leads",
  }));
  return [...leadItems, ...enrollmentItems, ...messageItems, ...metricItems]
    .filter((item) => validTime(item.occurredAt) !== null)
    .sort((a, b) => (validTime(b.occurredAt) ?? 0) - (validTime(a.occurredAt) ?? 0));
}

async function auditActivity(request: Request, period: Period) {
  try {
    const { profile } = await requireRole(request, "viewer");
    if (profile.role !== "admin") return { items: [] as RecentActivityItem[], timestamps: [] as string[], canView: false };
    const service = createServiceClient();
    const [recent, ranged] = await Promise.all([
      service
        .from("audit_logs")
        .select("id,created_at,actor_name,actor_email_masked,summary,resource_label,category")
        .order("created_at", { ascending: false })
        .limit(8),
      service
        .from("audit_logs")
        .select("created_at")
        .gte("created_at", period.from.toUTC().toISO()!)
        .lte("created_at", period.to.toUTC().toISO()!)
        .limit(1000),
    ]);
    if (recent.error || ranged.error) throw recent.error || ranged.error;
    return {
      canView: true,
      timestamps: (ranged.data ?? []).map((item) => item.created_at),
      items: (recent.data ?? []).map((item) => ({
        id: `audit-${item.id}`,
        category: "audit" as const,
        title: item.summary,
        actor: item.actor_name || item.actor_email_masked || "System",
        resource: item.resource_label,
        occurredAt: item.created_at,
        href: "/audit-log",
      })),
    };
  } catch {
    return { items: [] as RecentActivityItem[], timestamps: [] as string[], canView: false };
  }
}

function safeError(section: string) {
  return `${section} data is temporarily unavailable.`;
}

export async function getOverviewData(
  request: Request,
  key: OverviewPeriodKey,
): Promise<OverviewResponse> {
  const period = periodFor(key);
  const unavailable = () => Promise.reject(new Error("Airtable is not configured"));
  const airtable = isAirtableConfigured();
  const auditPromise = auditActivity(request, period);
  const [leadResult, enrollmentResult, messageResult, clinicResult, adsResult, creativeResult] =
    await Promise.allSettled([
      airtable ? listRecords("Leads") : unavailable(),
      airtable ? listRecords("Nurture Enrollments") : unavailable(),
      airtable ? listRecords("Message Log") : unavailable(),
      airtable ? listRecords(process.env.AIRTABLE_CLINIC_METRICS_TABLE_ID?.trim() || "Clinic Metrics") : unavailable(),
      airtable && process.env.AIRTABLE_BASE_ID
        ? fetchAllRecords("Google Ads Campaign Analytics")
        : unavailable(),
      airtable && process.env.AIRTABLE_BASE_ID
        ? fetchAllRecords("Google Ads Ad Creative Analytics")
        : unavailable(),
    ]);

  const errors: OverviewResponse["errors"] = {};
  if (leadResult.status === "rejected") errors.leads = safeError("Lead");
  if (enrollmentResult.status === "rejected") errors.campaigns = safeError("Campaign");
  if (messageResult.status === "rejected") errors.delivery = safeError("Message delivery");
  if (clinicResult.status === "rejected") errors.clinic = safeError("Clinic metrics");
  if (adsResult.status === "rejected" || creativeResult.status === "rejected")
    errors.googleAds = safeError("Google Ads");

  const leads = leadResult.status === "fulfilled" ? leadResult.value.map(mapLead) : [];
  const enrollments =
    enrollmentResult.status === "fulfilled"
      ? enrollmentResult.value.map(mapEnrollment)
      : [];
  const messages =
    messageResult.status === "fulfilled" ? messageResult.value.map(mapMessage) : [];
  const clinicMetrics =
    clinicResult.status === "fulfilled"
      ? clinicResult.value
          .map(mapClinicMetric)
          .filter((item): item is ClinicMetric => Boolean(item))
          .sort((a, b) => a.month.localeCompare(b.month))
      : [];
  const periodLeads = leads.filter((lead) => inWindow(lead.createdAt, period.from, period.to));
  const previousLeads = leads.filter((lead) =>
    inWindow(lead.createdAt, period.previousFrom, period.previousTo),
  );
  const periodMessages = messages.filter((message) =>
    inWindow(message.sentAt, period.from, period.to),
  );
  const periodEnrollments = enrollments.filter((enrollment) =>
    inWindow(enrollment.createdAt, period.from, period.to),
  );
  const previousMessages = messages.filter((message) =>
    inWindow(message.sentAt, period.previousFrom, period.previousTo),
  );
  const total = periodLeads.length;
  const previousTotal = previousLeads.length;
  const contactedCount = periodLeads.filter(contacted).length;
  const previousContacted = previousLeads.filter(contacted).length;
  const replied = periodLeads.filter((lead) => lead.replied).length;
  const previousReplied = previousLeads.filter((lead) => lead.replied).length;
  const booked = periodLeads.filter((lead) => lead.status.toLowerCase() === "booked").length;
  const previousBooked = previousLeads.filter(
    (lead) => lead.status.toLowerCase() === "booked",
  ).length;
  const bookingRate = total ? Math.round((booked / total) * 100) : null;
  const previousBookingRate = previousTotal
    ? Math.round((previousBooked / previousTotal) * 100)
    : null;
  const speed = averageSpeedSeconds(periodLeads, periodMessages);
  const previousSpeed = averageSpeedSeconds(previousLeads, previousMessages);
  const channels = [
    deliveryChannel(periodMessages, "SMS"),
    deliveryChannel(periodMessages, "Email"),
  ];
  const successful = channels.reduce((sum, channel) => sum + channel.successful, 0);
  const failed = channels.reduce((sum, channel) => sum + channel.failed, 0);
  const pending = channels.reduce((sum, channel) => sum + channel.pending, 0);
  const unknown = channels.reduce((sum, channel) => sum + channel.unknown, 0);
  const knownFinal = successful + failed;
  const googleAdsSummary =
    adsResult.status === "fulfilled" && creativeResult.status === "fulfilled"
      ? googleAdsFor(adsResult.value, creativeResult.value, period, periodLeads)
      : null;
  const audit = await auditPromise;
  const recentActivity = [
    ...audit.items,
    ...systemActivity(leads, enrollments, messages, clinicMetrics),
  ]
    .sort((a, b) => (validTime(b.occurredAt) ?? 0) - (validTime(a.occurredAt) ?? 0))
    .slice(0, 6);
  const activityByDay = activityByDayFor(
    [
      ...periodLeads.map((lead) => lead.createdAt),
      ...periodEnrollments.map((enrollment) => enrollment.createdAt),
      ...periodMessages.map((message) => message.sentAt),
      ...audit.timestamps,
    ],
    period,
  );
  const updatedCandidates = [
    ...leads.map((lead) => lead.createdAt),
    ...enrollments.flatMap((enrollment) => [enrollment.lastSentAt, enrollment.createdAt]),
    ...messages.map((message) => message.sentAt),
    ...clinicMetrics.map((item) => item.updatedAt),
    googleAdsSummary?.latestSyncAt,
  ]
    .map(validTime)
    .filter((value): value is number => value !== null);
  const latest = updatedCandidates.sort((a, b) => b - a)[0];

  return {
    period: {
      key: period.key,
      label: period.label,
      from: period.from.toUTC().toISO()!,
      to: period.to.toUTC().toISO()!,
      previousLabel: period.previousLabel,
      timezone: ZONE,
    },
    updatedAt: latest ? new Date(latest).toISOString() : null,
    errors,
    availability: {
      leads: leadResult.status === "fulfilled",
      campaigns: enrollmentResult.status === "fulfilled",
      delivery: messageResult.status === "fulfilled",
      clinic: clinicResult.status === "fulfilled",
      googleAds: adsResult.status === "fulfilled" && creativeResult.status === "fulfilled",
      activity: true,
    },
    leadSummary: {
      total: metric(total, previousTotal),
      contacted: metric(contactedCount, previousContacted),
      replied: metric(replied, previousReplied),
      booked: metric(booked, previousBooked),
      bookingRate: metric(bookingRate, previousBookingRate),
      averageSpeedSeconds: metric(speed, previousSpeed),
    },
    leadFunnel: funnelFor(periodLeads),
    leadTrend: trendFor(periodLeads, period),
    sourcePerformance: sourcePerformanceFor(periodLeads),
    campaignHealth: campaignHealthFor(periodLeads, periodEnrollments, periodMessages),
    nurtureJourney: nurtureJourneyFor(periodEnrollments),
    deliveryHealth: {
      channels,
      totalMessages: periodMessages.length,
      successful,
      failed,
      pending,
      unknown,
      successRate: knownFinal ? Math.round((successful / knownFinal) * 100) : null,
      trend: deliveryTrendFor(periodMessages, period),
    },
    clinicMetrics,
    googleAdsSummary,
    activityByDay,
    attentionItems: attentionFor(periodLeads, enrollments, periodMessages),
    recentActivity,
    canViewAuditLog: audit.canView,
  };
}
