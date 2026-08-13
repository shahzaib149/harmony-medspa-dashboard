import "server-only";

import { DateTime } from "luxon";
import { analyticsdata_v1beta, google } from "googleapis";
import {
  normalizeDevices,
  normalizePages,
  normalizeSites,
  normalizeSources,
  normalizeSummary,
  normalizeTrend,
  reportMetricTotal,
} from "@/lib/google/analytics-normalization";
import type { WebsiteAnalyticsSnapshot } from "@/lib/google/analytics-types";

const ANALYTICS_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const REPORT_TIME_ZONE = "America/New_York";
const CACHE_TTL_MS = 2 * 60 * 1000;

type ReportRequest = analyticsdata_v1beta.Schema$RunReportRequest;
type FilterExpression = analyticsdata_v1beta.Schema$FilterExpression;

export class GoogleAnalyticsConfigurationError extends Error {
  missing: string[];

  constructor(missing: string[]) {
    super(`Google Analytics is not configured. Missing: ${missing.join(", ")}`);
    this.name = "GoogleAnalyticsConfigurationError";
    this.missing = missing;
  }
}

const cache = new Map<
  string,
  { expiresAt: number; data: WebsiteAnalyticsSnapshot }
>();
const requests = new Map<string, Promise<WebsiteAnalyticsSnapshot>>();

function analyticsConfiguration() {
  const propertyId = process.env.GA4_PROPERTY_ID?.trim() ?? "";
  const clientEmail = process.env.GA4_SERVICE_ACCOUNT_EMAIL?.trim() ?? "";
  const privateKey = (process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY ?? "")
    .trim()
    .replace(/\\n/g, "\n");

  const missing = [
    !propertyId && "GA4_PROPERTY_ID",
    !clientEmail && "GA4_SERVICE_ACCOUNT_EMAIL",
    !privateKey && "GA4_SERVICE_ACCOUNT_PRIVATE_KEY",
  ].filter((value): value is string => Boolean(value));
  if (missing.length) throw new GoogleAnalyticsConfigurationError(missing);
  if (!/^\d+$/.test(propertyId)) {
    throw new GoogleAnalyticsConfigurationError([
      "GA4_PROPERTY_ID (must be the numeric property ID)",
    ]);
  }
  if (!clientEmail.endsWith(".iam.gserviceaccount.com")) {
    throw new GoogleAnalyticsConfigurationError([
      "GA4_SERVICE_ACCOUNT_EMAIL (must be a service-account email)",
    ]);
  }
  if (!privateKey.includes("BEGIN PRIVATE KEY")) {
    throw new GoogleAnalyticsConfigurationError([
      "GA4_SERVICE_ACCOUNT_PRIVATE_KEY (invalid private key)",
    ]);
  }

  return { propertyId, clientEmail, privateKey };
}

function dateRanges(days: number) {
  const today = DateTime.now().setZone(REPORT_TIME_ZONE).startOf("day");
  const currentStart = today.minus({ days: days - 1 });
  const previousEnd = currentStart.minus({ days: 1 });
  const previousStart = previousEnd.minus({ days: days - 1 });
  return {
    current: {
      start: currentStart.toISODate()!,
      end: today.toISODate()!,
    },
    previous: {
      start: previousStart.toISODate()!,
      end: previousEnd.toISODate()!,
    },
  };
}

function exactDimensionFilter(
  fieldName: string,
  value: string,
): FilterExpression {
  return {
    filter: {
      fieldName,
      stringFilter: {
        matchType: "EXACT",
        value,
        caseSensitive: false,
      },
    },
  };
}

function reportFilter(hostname: string | null, eventName?: string) {
  const expressions: FilterExpression[] = [];
  if (hostname) expressions.push(exactDimensionFilter("hostName", hostname));
  if (eventName) expressions.push(exactDimensionFilter("eventName", eventName));
  if (expressions.length === 0) return undefined;
  if (expressions.length === 1) return expressions[0];
  return { andGroup: { expressions } } satisfies FilterExpression;
}

function range(start: string, end: string) {
  return [{ startDate: start, endDate: end }];
}

function summaryRequest(
  start: string,
  end: string,
  hostname: string | null,
): ReportRequest {
  return {
    dateRanges: range(start, end),
    metrics: [
      { name: "activeUsers" },
      { name: "totalUsers" },
      { name: "newUsers" },
      { name: "sessions" },
      { name: "engagedSessions" },
      { name: "screenPageViews" },
      { name: "engagementRate" },
      { name: "bounceRate" },
      { name: "userEngagementDuration" },
    ],
    dimensionFilter: reportFilter(hostname),
    keepEmptyRows: true,
  };
}

function leadRequest(
  start: string,
  end: string,
  hostname: string | null,
  byDate: boolean,
): ReportRequest {
  return {
    dateRanges: range(start, end),
    dimensions: byDate ? [{ name: "date" }] : [],
    metrics: [{ name: "eventCount" }],
    dimensionFilter: reportFilter(hostname, "generate_lead"),
    orderBys: byDate ? [{ dimension: { dimensionName: "date" } }] : [],
    keepEmptyRows: true,
  };
}

function reportRequestsFor(
  days: number,
  hostname: string | null,
): { first: ReportRequest[]; second: ReportRequest[]; ranges: ReturnType<typeof dateRanges> } {
  const ranges = dateRanges(days);
  const current = ranges.current;
  const previous = ranges.previous;

  return {
    ranges,
    first: [
      summaryRequest(current.start, current.end, hostname),
      summaryRequest(previous.start, previous.end, hostname),
      leadRequest(current.start, current.end, hostname, true),
      leadRequest(previous.start, previous.end, hostname, false),
      {
        dateRanges: range(current.start, current.end),
        dimensions: [
          { name: "hostName" },
          { name: "streamId" },
          { name: "streamName" },
        ],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
        ],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: "25",
      },
    ],
    second: [
      {
        dateRanges: range(current.start, current.end),
        dimensions: [{ name: "date" }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
        ],
        dimensionFilter: reportFilter(hostname),
        orderBys: [{ dimension: { dimensionName: "date" } }],
        keepEmptyRows: true,
      },
      {
        dateRanges: range(current.start, current.end),
        dimensions: [
          { name: "sessionSourceMedium" },
          { name: "sessionCampaignName" },
          { name: "sessionDefaultChannelGroup" },
        ],
        metrics: [
          { name: "sessions" },
          { name: "activeUsers" },
          { name: "engagedSessions" },
        ],
        dimensionFilter: reportFilter(hostname),
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: "25",
      },
      {
        dateRanges: range(current.start, current.end),
        dimensions: [
          { name: "sessionSourceMedium" },
          { name: "sessionCampaignName" },
          { name: "sessionDefaultChannelGroup" },
        ],
        metrics: [{ name: "eventCount" }],
        dimensionFilter: reportFilter(hostname, "generate_lead"),
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
        limit: "25",
      },
      {
        dateRanges: range(current.start, current.end),
        dimensions: [
          { name: "hostName" },
          { name: "pagePathPlusQueryString" },
          { name: "pageTitle" },
        ],
        metrics: [
          { name: "screenPageViews" },
          { name: "activeUsers" },
          { name: "userEngagementDuration" },
        ],
        dimensionFilter: reportFilter(hostname),
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: "25",
      },
      {
        dateRanges: range(current.start, current.end),
        dimensions: [{ name: "deviceCategory" }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }],
        dimensionFilter: reportFilter(hostname),
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: "10",
      },
    ],
  };
}

async function loadWebsiteAnalytics(
  days: number,
  hostname: string | null,
): Promise<WebsiteAnalyticsSnapshot> {
  const { propertyId, clientEmail, privateKey } = analyticsConfiguration();
  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: [ANALYTICS_SCOPE],
  });
  const analytics = google.analyticsdata({ version: "v1beta", auth });
  const { first, second, ranges } = reportRequestsFor(days, hostname);

  const [firstBatch, secondBatch] = await Promise.all([
    analytics.properties.batchRunReports({
      property: `properties/${propertyId}`,
      requestBody: { requests: first },
    }),
    analytics.properties.batchRunReports({
      property: `properties/${propertyId}`,
      requestBody: { requests: second },
    }),
  ]);

  const firstReports = firstBatch.data.reports ?? [];
  const secondReports = secondBatch.data.reports ?? [];
  const currentLeads = reportMetricTotal(firstReports[2]);
  const previousLeads = reportMetricTotal(firstReports[3]);

  return {
    source: "ga4",
    fetchedAt: new Date().toISOString(),
    propertyId,
    days,
    selectedHostname: hostname,
    dateRange: ranges,
    summary: normalizeSummary(firstReports[0], currentLeads),
    previousSummary: normalizeSummary(firstReports[1], previousLeads),
    trend: normalizeTrend(
      secondReports[0],
      firstReports[2],
      ranges.current.start,
      ranges.current.end,
    ),
    sources: normalizeSources(secondReports[1], secondReports[2]),
    pages: normalizePages(secondReports[3]),
    devices: normalizeDevices(secondReports[4]),
    sites: normalizeSites(firstReports[4]),
  };
}

export function isSafeAnalyticsHostname(value: string) {
  return (
    value.length <= 253 &&
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(
      value,
    )
  );
}

export async function fetchWebsiteAnalytics(
  days: number,
  hostname: string | null,
  force = false,
) {
  const key = `${days}:${hostname ?? "all"}`;
  if (force) cache.delete(key);
  const cached = cache.get(key);
  if (!force && cached && cached.expiresAt > Date.now()) return cached.data;
  const pending = requests.get(key);
  if (!force && pending) return pending;

  const request = loadWebsiteAnalytics(days, hostname).then((data) => {
    cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    return data;
  });
  requests.set(key, request);
  try {
    return await request;
  } finally {
    if (requests.get(key) === request) requests.delete(key);
  }
}

export function websiteAnalyticsErrorMessage(error: unknown) {
  const status = Number(
    (error as { response?: { status?: unknown }; code?: unknown } | null)?.response
      ?.status ?? (error as { code?: unknown } | null)?.code,
  );
  if (status === 403) {
    return "The GA4 service account cannot read this property. Add its email as a Viewer in GA4 Property access management and confirm the Google Analytics Data API is enabled.";
  }
  if (status === 404) {
    return "The configured GA4 property was not found. Confirm GA4_PROPERTY_ID contains the numeric property ID, not the G- measurement ID.";
  }
  if (status === 400) {
    return "Google Analytics rejected the report request. Confirm this is a GA4 property and the configured property ID is correct.";
  }
  return error instanceof Error
    ? error.message
    : "Google Analytics data could not be loaded.";
}
