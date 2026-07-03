async function getAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      // GBP needs its own refresh token (scoped to business.manage)
      // Run /api/google-business/auth to generate one
      refresh_token: process.env.GOOGLE_BUSINESS_REFRESH_TOKEN ?? process.env.GOOGLE_ADS_REFRESH_TOKEN!,
      grant_type:    "refresh_token",
    }),
  });
  const data = await res.json() as { access_token?: string; error?: string; error_description?: string };
  if (!data.access_token)
    throw new Error(`Token exchange failed: ${data.error} — ${data.error_description}`);
  return data.access_token;
}

// ── Resource name helpers ────────────────────────────────────────────────────
function rawAccountId() { return process.env.GOOGLE_BUSINESS_ACCOUNT_ID!.replace("accounts/", ""); }
function rawLocationId() { return process.env.GOOGLE_BUSINESS_LOCATION_ID!.replace("locations/", ""); }

/** accounts/{N}/locations/{N}  — used by Reviews API */
function locationName() {
  return `accounts/${rawAccountId()}/locations/${rawLocationId()}`;
}
/** locations/{N}  — used by Performance API */
function locationResource() {
  return `locations/${rawLocationId()}`;
}

// ── Types ────────────────────────────────────────────────────────────────────
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

export interface GBPInsights {
  queriesDirect:      number;
  queriesIndirect:    number;
  queriesChain:       number;
  viewsMaps:          number;
  viewsSearch:        number;
  actionsPhone:       number;
  actionsDirections:  number;
  actionsWebsite:     number;
  photosViewsMerchant: number;
}

// ── Reviews (mybusinessreviews.googleapis.com/v4) ────────────────────────────
export async function fetchReviews(): Promise<{ reviews: GBPReview[]; averageRating: number; totalReviewCount: number }> {
  const token = await getAccessToken();
  const name  = locationName();

  const res  = await fetch(
    `https://mybusinessreviews.googleapis.com/v4/${name}/reviews?pageSize=50&orderBy=updateTime%20desc`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const text = await res.text();
  let data: { reviews?: GBPReview[]; averageRating?: number; totalReviewCount?: number; error?: { message: string } };
  try { data = JSON.parse(text); } catch { throw new Error(`GBP Reviews parse error: ${text.slice(0, 200)}`); }
  if (!res.ok) throw new Error(data.error?.message ?? `GBP Reviews ${res.status}`);
  return {
    reviews:          data.reviews          ?? [],
    averageRating:    data.averageRating     ?? 0,
    totalReviewCount: data.totalReviewCount  ?? 0,
  };
}

export async function replyToReview(reviewId: string, comment: string) {
  const token = await getAccessToken();
  const name  = locationName();

  const res = await fetch(
    `https://mybusinessreviews.googleapis.com/v4/${name}/reviews/${reviewId}/reply`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ comment }),
    }
  );
  const data = await res.json() as { error?: { message: string } };
  if (!res.ok) throw new Error(data.error?.message ?? `Reply failed ${res.status}`);
  return data;
}

// ── Performance insights (businessprofileperformance.googleapis.com/v1) ──────
export async function fetchInsights(days = 30): Promise<GBPInsights> {
  const token = await getAccessToken();
  const loc   = locationResource();

  const end   = new Date();
  const start = new Date(Date.now() - days * 86_400_000);

  const metrics = [
    "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
    "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
    "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
    "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
    "WEBSITE_CLICKS",
    "CALL_CLICKS",
    "BUSINESS_DIRECTION_REQUESTS",
  ];

  const params = new URLSearchParams();
  metrics.forEach(m => params.append("dailyMetrics", m));
  params.set("dailyRange.start_date.year",  String(start.getFullYear()));
  params.set("dailyRange.start_date.month", String(start.getMonth() + 1));
  params.set("dailyRange.start_date.day",   String(start.getDate()));
  params.set("dailyRange.end_date.year",    String(end.getFullYear()));
  params.set("dailyRange.end_date.month",   String(end.getMonth() + 1));
  params.set("dailyRange.end_date.day",     String(end.getDate()));

  const res  = await fetch(
    `https://businessprofileperformance.googleapis.com/v1/${loc}:fetchMultiDailyMetricsTimeSeries?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const text = await res.text();

  type DatedValue = { date: { year: number; month: number; day: number }; value?: string };
  type MetricSeries = { dailyMetric: string; timeSeries: { datedValues: DatedValue[] } };
  let data: { multiDailyMetricTimeSeries?: MetricSeries[]; error?: { message: string } };
  try { data = JSON.parse(text); } catch { throw new Error(`GBP Insights parse error: ${text.slice(0, 200)}`); }
  if (!res.ok) throw new Error(data.error?.message ?? `GBP Insights ${res.status}`);

  /* Sum all daily values for each metric */
  const sum = (metric: string) => {
    const series = data.multiDailyMetricTimeSeries?.find(s => s.dailyMetric === metric);
    return (series?.timeSeries?.datedValues ?? []).reduce((acc, d) => acc + Number(d.value ?? 0), 0);
  };

  return {
    queriesDirect:       sum("BUSINESS_IMPRESSIONS_DESKTOP_SEARCH") + sum("BUSINESS_IMPRESSIONS_MOBILE_SEARCH"),
    queriesIndirect:     sum("BUSINESS_IMPRESSIONS_DESKTOP_MAPS")   + sum("BUSINESS_IMPRESSIONS_MOBILE_MAPS"),
    queriesChain:        0,
    viewsMaps:           sum("BUSINESS_IMPRESSIONS_DESKTOP_MAPS")   + sum("BUSINESS_IMPRESSIONS_MOBILE_MAPS"),
    viewsSearch:         sum("BUSINESS_IMPRESSIONS_DESKTOP_SEARCH") + sum("BUSINESS_IMPRESSIONS_MOBILE_SEARCH"),
    actionsPhone:        sum("CALL_CLICKS"),
    actionsDirections:   sum("BUSINESS_DIRECTION_REQUESTS"),
    actionsWebsite:      sum("WEBSITE_CLICKS"),
    photosViewsMerchant: 0,
  };
}

// ── Posts (mybusiness.googleapis.com/v4 — still active for localPosts) ───────
export async function createPost(post: { topicType: string; summary: string }) {
  const token = await getAccessToken();
  const name  = locationName();

  const res = await fetch(
    `https://mybusiness.googleapis.com/v4/${name}/localPosts`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(post),
    }
  );
  const data = await res.json() as { error?: { message: string } };
  if (!res.ok) throw new Error(data.error?.message ?? `Post creation failed ${res.status}`);
  return data;
}
