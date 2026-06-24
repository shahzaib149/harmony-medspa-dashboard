import { google } from "googleapis";
import { createAuthenticatedClient } from "./oauth";

function getMyBusinessInfo(refreshToken: string) {
  const auth = createAuthenticatedClient(refreshToken);
  return google.mybusinessbusinessinformation({ version: "v1", auth });
}

function getMyBusinessAccountMgmt(refreshToken: string) {
  const auth = createAuthenticatedClient(refreshToken);
  return google.mybusinessaccountmanagement({ version: "v1", auth });
}

function getMyBusinessReviews(refreshToken: string) {
  const auth = createAuthenticatedClient(refreshToken);
  // Reviews are under the older v4 API via mybusiness
  return google.mybusiness({ version: "v4" as never, auth });
}

// ─── Account + Location ───────────────────────────────────────────────────────

export async function fetchGBPAccounts(refreshToken: string) {
  const api = getMyBusinessAccountMgmt(refreshToken);
  const res = await api.accounts.list();
  return res.data.accounts ?? [];
}

export async function fetchGBPLocations(refreshToken: string, accountId: string) {
  const api = getMyBusinessInfo(refreshToken);
  const res = await api.accounts.locations.list({
    parent: accountId,
    readMask: "name,title,phoneNumbers,websiteUri,regularHours,metadata,storefrontAddress",
  });
  return res.data.locations ?? [];
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export async function fetchReviews(refreshToken: string, accountId: string, locationId: string) {
  const auth = createAuthenticatedClient(refreshToken);
  const res = await fetch(
    `https://mybusiness.googleapis.com/v4/${accountId}/${locationId}/reviews?pageSize=50`,
    {
      headers: {
        Authorization: `Bearer ${await auth.getAccessToken().then((t) => t.token)}`,
      },
    }
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
  const auth = createAuthenticatedClient(refreshToken);
  const token = await auth.getAccessToken().then((t) => t.token);
  const res = await fetch(
    `https://mybusiness.googleapis.com/v4/${accountId}/${locationId}/reviews/${reviewId}/reply`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ comment }),
    }
  );
  return res.json();
}

// ─── GBP Posts ────────────────────────────────────────────────────────────────

export async function createGBPPost(
  refreshToken: string,
  accountId: string,
  locationId: string,
  post: {
    topicType: "STANDARD" | "OFFER" | "EVENT";
    summary: string;
    callToAction?: { actionType: string; url: string };
    offerDetails?: { couponCode?: string; redeemOnlineUrl?: string; termsConditions?: string };
  }
) {
  const auth = createAuthenticatedClient(refreshToken);
  const token = await auth.getAccessToken().then((t) => t.token);
  const res = await fetch(
    `https://mybusiness.googleapis.com/v4/${accountId}/${locationId}/localPosts`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(post),
    }
  );
  return res.json();
}

// ─── GBP Insights ─────────────────────────────────────────────────────────────

export async function fetchGBPInsights(
  refreshToken: string,
  accountId: string,
  locationId: string,
  startTime: string,
  endTime: string
) {
  const auth = createAuthenticatedClient(refreshToken);
  const token = await auth.getAccessToken().then((t) => t.token);
  const res = await fetch(
    `https://mybusiness.googleapis.com/v4/${accountId}/${locationId}:reportInsights`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
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

// ─── Update Business Hours ────────────────────────────────────────────────────

export async function updateBusinessHours(
  refreshToken: string,
  locationName: string,
  regularHours: {
    periods: Array<{
      openDay: string;
      closeDay: string;
      openTime: { hours: number; minutes: number };
      closeTime: { hours: number; minutes: number };
    }>;
  }
) {
  const api = getMyBusinessInfo(refreshToken);
  await api.accounts.locations.patch({
    name: locationName,
    updateMask: "regularHours",
    requestBody: { regularHours },
  });
}
