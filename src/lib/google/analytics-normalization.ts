import type { analyticsdata_v1beta } from "googleapis";
import type {
  WebsiteAnalyticsDevice,
  WebsiteAnalyticsPage,
  WebsiteAnalyticsSite,
  WebsiteAnalyticsSource,
  WebsiteAnalyticsSummary,
  WebsiteAnalyticsTrendPoint,
} from "@/lib/google/analytics-types";

type Report = analyticsdata_v1beta.Schema$RunReportResponse;
type Row = analyticsdata_v1beta.Schema$Row;

function finiteNumber(value: string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dimension(row: Row | undefined, index: number) {
  return row?.dimensionValues?.[index]?.value?.trim() || "";
}

function metric(row: Row | undefined, index: number) {
  return finiteNumber(row?.metricValues?.[index]?.value);
}

export function safeRate(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : 0;
}

export function normalizeGaDate(value: string) {
  if (!/^\d{8}$/.test(value)) return value;
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

export function formatGaDateLabel(value: string) {
  const normalized = normalizeGaDate(value);
  const date = new Date(`${normalized}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return normalized;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function normalizeSummary(
  report: Report | undefined,
  leads: number,
): WebsiteAnalyticsSummary {
  const row = report?.rows?.[0];
  const activeUsers = metric(row, 0);
  const totalUsers = metric(row, 1);
  const newUsers = metric(row, 2);
  const sessions = metric(row, 3);
  const engagedSessions = metric(row, 4);
  const pageViews = metric(row, 5);
  const engagementRate = metric(row, 6);
  const bounceRate = metric(row, 7);
  const engagementSeconds = metric(row, 8);

  return {
    activeUsers,
    totalUsers,
    newUsers,
    sessions,
    engagedSessions,
    pageViews,
    engagementRate,
    bounceRate,
    averageEngagementSeconds: safeRate(engagementSeconds, activeUsers),
    viewsPerSession: safeRate(pageViews, sessions),
    leads,
    leadRate: safeRate(leads, sessions),
  };
}

function isoDatesBetween(start: string, end: string) {
  const dates: string[] = [];
  const cursor = new Date(`${start}T00:00:00.000Z`);
  const last = new Date(`${end}T00:00:00.000Z`);
  if (Number.isNaN(cursor.getTime()) || Number.isNaN(last.getTime())) return dates;
  while (cursor <= last) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export function normalizeTrend(
  trafficReport: Report | undefined,
  leadReport: Report | undefined,
  start: string,
  end: string,
): WebsiteAnalyticsTrendPoint[] {
  const byDate = new Map<string, WebsiteAnalyticsTrendPoint>();
  for (const date of isoDatesBetween(start, end)) {
    byDate.set(date, {
      date,
      label: formatGaDateLabel(date.replaceAll("-", "")),
      activeUsers: 0,
      sessions: 0,
      pageViews: 0,
      leads: 0,
    });
  }

  for (const row of trafficReport?.rows ?? []) {
    const date = normalizeGaDate(dimension(row, 0));
    const current = byDate.get(date) ?? {
      date,
      label: formatGaDateLabel(date.replaceAll("-", "")),
      activeUsers: 0,
      sessions: 0,
      pageViews: 0,
      leads: 0,
    };
    current.activeUsers = metric(row, 0);
    current.sessions = metric(row, 1);
    current.pageViews = metric(row, 2);
    byDate.set(date, current);
  }

  for (const row of leadReport?.rows ?? []) {
    const date = normalizeGaDate(dimension(row, 0));
    const current = byDate.get(date) ?? {
      date,
      label: formatGaDateLabel(date.replaceAll("-", "")),
      activeUsers: 0,
      sessions: 0,
      pageViews: 0,
      leads: 0,
    };
    current.leads = metric(row, 0);
    byDate.set(date, current);
  }

  return [...byDate.values()].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
}

function sourceKey(sourceMedium: string, campaign: string, channel: string) {
  return `${sourceMedium}\u0000${campaign}\u0000${channel}`;
}

export function normalizeSources(
  trafficReport: Report | undefined,
  leadReport: Report | undefined,
): WebsiteAnalyticsSource[] {
  const sources = new Map<string, WebsiteAnalyticsSource>();

  for (const row of trafficReport?.rows ?? []) {
    const sourceMedium = dimension(row, 0) || "(direct) / (none)";
    const campaign = dimension(row, 1) || "(not set)";
    const channel = dimension(row, 2) || "Unassigned";
    const sessions = metric(row, 0);
    const activeUsers = metric(row, 1);
    const engagedSessions = metric(row, 2);
    sources.set(sourceKey(sourceMedium, campaign, channel), {
      sourceMedium,
      campaign,
      channel,
      sessions,
      activeUsers,
      engagedSessions,
      engagementRate: safeRate(engagedSessions, sessions),
      leads: 0,
      leadRate: 0,
    });
  }

  for (const row of leadReport?.rows ?? []) {
    const sourceMedium = dimension(row, 0) || "(direct) / (none)";
    const campaign = dimension(row, 1) || "(not set)";
    const channel = dimension(row, 2) || "Unassigned";
    const key = sourceKey(sourceMedium, campaign, channel);
    const current = sources.get(key) ?? {
      sourceMedium,
      campaign,
      channel,
      sessions: 0,
      activeUsers: 0,
      engagedSessions: 0,
      engagementRate: 0,
      leads: 0,
      leadRate: 0,
    };
    current.leads = metric(row, 0);
    current.leadRate = safeRate(current.leads, current.sessions);
    sources.set(key, current);
  }

  return [...sources.values()].sort(
    (left, right) => right.sessions - left.sessions || right.leads - left.leads,
  );
}

export function normalizePages(
  report: Report | undefined,
): WebsiteAnalyticsPage[] {
  return (report?.rows ?? []).map((row) => {
    const pageViews = metric(row, 0);
    const activeUsers = metric(row, 1);
    const engagementSeconds = metric(row, 2);
    return {
      hostName: dimension(row, 0) || "Unknown hostname",
      path: dimension(row, 1) || "/",
      title: dimension(row, 2) || "Untitled page",
      pageViews,
      activeUsers,
      averageEngagementSeconds: safeRate(engagementSeconds, activeUsers),
    };
  });
}

export function normalizeDevices(
  report: Report | undefined,
): WebsiteAnalyticsDevice[] {
  const rows = report?.rows ?? [];
  const totalSessions = rows.reduce((total, row) => total + metric(row, 1), 0);
  return rows.map((row) => {
    const sessions = metric(row, 1);
    return {
      device: dimension(row, 0) || "unknown",
      activeUsers: metric(row, 0),
      sessions,
      share: safeRate(sessions, totalSessions),
    };
  });
}

export function normalizeSites(
  report: Report | undefined,
): WebsiteAnalyticsSite[] {
  const rows = report?.rows ?? [];
  const totalSessions = rows.reduce((total, row) => total + metric(row, 1), 0);
  return rows.map((row) => {
    const sessions = metric(row, 1);
    return {
      hostName: dimension(row, 0) || "Unknown hostname",
      streamId: dimension(row, 1),
      streamName: dimension(row, 2) || "Unnamed web stream",
      activeUsers: metric(row, 0),
      sessions,
      pageViews: metric(row, 2),
      share: safeRate(sessions, totalSessions),
    };
  });
}

export function reportMetricTotal(report: Report | undefined, index = 0) {
  return (report?.rows ?? []).reduce(
    (total, row) => total + metric(row, index),
    0,
  );
}
