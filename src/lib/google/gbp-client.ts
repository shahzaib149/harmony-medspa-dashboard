async function getAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json() as { access_token?: string; error?: string; error_description?: string };
  if (!data.access_token) throw new Error(`Token exchange failed: ${data.error} — ${data.error_description}`);
  return data.access_token;
}

function accountId() { return process.env.GOOGLE_BUSINESS_ACCOUNT_ID!; }
function locationId() { return process.env.GOOGLE_BUSINESS_LOCATION_ID!; }

// Full location resource name: accounts/{N}/locations/{N}
function locationName() {
  const acc = accountId().replace("accounts/", "");
  const loc = locationId().replace("locations/", "");
  return `accounts/${acc}/locations/${loc}`;
}

export interface GBPReview {
  name: string;
  reviewId: string;
  reviewer: { displayName: string; profilePhotoUrl?: string; isAnonymous?: boolean };
  starRating: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";
  comment: string;
  createTime: string;
  updateTime: string;
  reviewReply?: { comment: string; updateTime: string };
}

export async function fetchReviews(): Promise<{ reviews: GBPReview[]; averageRating: number; totalReviewCount: number }> {
  const token = await getAccessToken();
  const name = locationName();
  const res = await fetch(
    `https://mybusiness.googleapis.com/v4/${name}/reviews?pageSize=50&orderBy=updateTime%20desc`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const text = await res.text();
  let data: { reviews?: GBPReview[]; averageRating?: number; totalReviewCount?: number; error?: { message: string } };
  try { data = JSON.parse(text); } catch { throw new Error(`GBP Reviews parse error: ${text.slice(0, 200)}`); }
  if (!res.ok) throw new Error(data.error?.message ?? `GBP Reviews error ${res.status}`);
  return {
    reviews: data.reviews ?? [],
    averageRating: data.averageRating ?? 0,
    totalReviewCount: data.totalReviewCount ?? 0,
  };
}

export async function replyToReview(reviewId: string, comment: string) {
  const token = await getAccessToken();
  const name = locationName();
  const res = await fetch(`https://mybusiness.googleapis.com/v4/${name}/reviews/${reviewId}/reply`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ comment }),
  });
  const data = await res.json() as { error?: { message: string } };
  if (!res.ok) throw new Error(data.error?.message ?? `Reply failed ${res.status}`);
  return data;
}

export interface GBPInsights {
  queriesDirect: number;
  queriesIndirect: number;
  queriesChain: number;
  viewsMaps: number;
  viewsSearch: number;
  actionsPhone: number;
  actionsDirections: number;
  actionsWebsite: number;
  photosViewsMerchant: number;
}

export async function fetchInsights(days = 30): Promise<GBPInsights> {
  const token = await getAccessToken();
  const name = locationName();

  const endDate = new Date();
  const startDate = new Date(Date.now() - days * 86_400_000);

  const fmt = (d: Date) => d.toISOString();

  const res = await fetch(
    `https://mybusiness.googleapis.com/v4/${name}:reportInsights`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        locationNames: [name],
        basicRequest: {
          metricRequests: [
            { metric: "QUERIES_DIRECT" },
            { metric: "QUERIES_INDIRECT" },
            { metric: "QUERIES_CHAIN" },
            { metric: "VIEWS_MAPS" },
            { metric: "VIEWS_SEARCH" },
            { metric: "ACTIONS_PHONE" },
            { metric: "ACTIONS_DRIVING_DIRECTIONS" },
            { metric: "ACTIONS_WEBSITE" },
            { metric: "PHOTOS_VIEWS_MERCHANT" },
          ],
          timeRange: { startTime: fmt(startDate), endTime: fmt(endDate) },
        },
      }),
    }
  );

  const text = await res.text();
  let data: { locationMetrics?: Array<{ metricValues?: Array<{ metric: string; totalValue?: { value?: string } }> }>; error?: { message: string } };
  try { data = JSON.parse(text); } catch { throw new Error(`GBP Insights parse error: ${text.slice(0, 200)}`); }
  if (!res.ok) throw new Error(data.error?.message ?? `GBP Insights error ${res.status}`);

  const metrics = data.locationMetrics?.[0]?.metricValues ?? [];
  const get = (key: string) => {
    const m = metrics.find(mv => mv.metric === key);
    return Number(m?.totalValue?.value ?? 0);
  };

  return {
    queriesDirect: get("QUERIES_DIRECT"),
    queriesIndirect: get("QUERIES_INDIRECT"),
    queriesChain: get("QUERIES_CHAIN"),
    viewsMaps: get("VIEWS_MAPS"),
    viewsSearch: get("VIEWS_SEARCH"),
    actionsPhone: get("ACTIONS_PHONE"),
    actionsDirections: get("ACTIONS_DRIVING_DIRECTIONS"),
    actionsWebsite: get("ACTIONS_WEBSITE"),
    photosViewsMerchant: get("PHOTOS_VIEWS_MERCHANT"),
  };
}

export async function createPost(post: { topicType: string; summary: string }) {
  const token = await getAccessToken();
  const name = locationName();
  const res = await fetch(`https://mybusiness.googleapis.com/v4/${name}/localPosts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(post),
  });
  const data = await res.json() as { error?: { message: string } };
  if (!res.ok) throw new Error(data.error?.message ?? `Post creation failed ${res.status}`);
  return data;
}
