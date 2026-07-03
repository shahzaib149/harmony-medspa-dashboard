import { google } from "googleapis";
import { createAuthenticatedClient } from "./oauth";

function businessInfo(refreshToken: string) {
  return google.mybusinessbusinessinformation({ version: "v1", auth: createAuthenticatedClient(refreshToken) });
}

function accountMgmt(refreshToken: string) {
  return google.mybusinessaccountmanagement({ version: "v1", auth: createAuthenticatedClient(refreshToken) });
}

async function bearerToken(refreshToken: string): Promise<string> {
  const auth = createAuthenticatedClient(refreshToken);
  const result = await auth.getAccessToken();
  return result.token ?? "";
}

// ─── Accounts & Locations ─────────────────────────────────────────────────────

export async function fetchGBPAccounts(refreshToken: string) {
  const api = accountMgmt(refreshToken);
  const res = await api.accounts.list();
  return res.data.accounts ?? [];
}

export async function fetchGBPLocations(refreshToken: string, accountId: string) {
  const api = businessInfo(refreshToken);
  const res = await api.accounts.locations.list({
    parent: accountId,
    readMask: "name,title,phoneNumbers,websiteUri,regularHours,metadata,storefrontAddress",
  });
  return res.data.locations ?? [];
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export async function fetchReviews(refreshToken: string, accountId: string, locationId: string) {
  const token = await bearerToken(refreshToken);
  const res = await fetch(
    `https://mybusinessreviews.googleapis.com/v4/${accountId}/${locationId}/reviews?pageSize=50&orderBy=updateTime%20desc`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json() as { reviews?: unknown[] };
  return data.reviews ?? [];
}

export async function replyToReview(
  refreshToken: string,
  accountId: string,
  locationId: string,
  reviewId: string,
  comment: string
) {
  const token = await bearerToken(refreshToken);
  const res = await fetch(
    `https://mybusinessreviews.googleapis.com/v4/${accountId}/${locationId}/reviews/${reviewId}/reply`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ comment }),
    }
  );
  return res.json();
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export async function createGBPPost(
  refreshToken: string,
  accountId: string,
  locationId: string,
  post: { topicType: string; summary: string; callToAction?: { actionType: string; url: string } }
) {
  const token = await bearerToken(refreshToken);
  const res = await fetch(
    `https://mybusiness.googleapis.com/v4/${accountId}/${locationId}/localPosts`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(post),
    }
  );
  return res.json();
}

// ─── Insights ─────────────────────────────────────────────────────────────────

export async function fetchGBPInsights(
  refreshToken: string,
  _accountId: string,
  locationId: string,
  startTime: string,
  endTime: string
) {
  const token = await bearerToken(refreshToken);

  // Extract bare location ID (strip "locations/" prefix if present)
  const locId = locationId.replace(/^locations\//, "");

  const metrics = [
    "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
    "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
    "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
    "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
    "WEBSITE_CLICKS",
    "CALL_CLICKS",
    "BUSINESS_DIRECTION_REQUESTS",
  ];

  const start = new Date(startTime);
  const end   = new Date(endTime);
  const params = new URLSearchParams();
  metrics.forEach(m => params.append("dailyMetrics", m));
  params.set("dailyRange.start_date.year",  String(start.getFullYear()));
  params.set("dailyRange.start_date.month", String(start.getMonth() + 1));
  params.set("dailyRange.start_date.day",   String(start.getDate()));
  params.set("dailyRange.end_date.year",    String(end.getFullYear()));
  params.set("dailyRange.end_date.month",   String(end.getMonth() + 1));
  params.set("dailyRange.end_date.day",     String(end.getDate()));

  const res = await fetch(
    `https://businessprofileperformance.googleapis.com/v1/locations/${locId}:fetchMultiDailyMetricsTimeSeries?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.json();
}
