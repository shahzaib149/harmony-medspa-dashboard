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
    `https://mybusiness.googleapis.com/v4/${accountId}/${locationId}/reviews?pageSize=50`,
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
    `https://mybusiness.googleapis.com/v4/${accountId}/${locationId}/reviews/${reviewId}/reply`,
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
  accountId: string,
  locationId: string,
  startTime: string,
  endTime: string
) {
  const token = await bearerToken(refreshToken);
  const res = await fetch(
    `https://mybusiness.googleapis.com/v4/${accountId}/${locationId}:reportInsights`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        locationNames: [`${accountId}/${locationId}`],
        basicRequest: {
          metricRequests: [
            { metric: "QUERIES_DIRECT" },
            { metric: "QUERIES_INDIRECT" },
            { metric: "VIEWS_MAPS" },
            { metric: "VIEWS_SEARCH" },
            { metric: "ACTIONS_PHONE" },
            { metric: "ACTIONS_DRIVING_DIRECTIONS" },
            { metric: "ACTIONS_WEBSITE" },
            { metric: "PHOTOS_VIEWS_MERCHANT" },
          ],
          timeRange: { startTime, endTime },
        },
      }),
    }
  );
  return res.json();
}
