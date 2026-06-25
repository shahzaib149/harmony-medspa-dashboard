import { createAuthenticatedClient } from "./oauth";

const API_VERSION = "v19";
const BASE_URL = `https://googleads.googleapis.com/${API_VERSION}`;

async function getAccessToken(): Promise<string> {
  const auth = createAuthenticatedClient(process.env.GOOGLE_ADS_REFRESH_TOKEN!);
  const { token } = await auth.getAccessToken();
  if (!token) throw new Error("Failed to get Google access token");
  return token;
}

async function adsQuery(query: string): Promise<Record<string, unknown>[]> {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!.replace(/-/g, "");
  const token = await getAccessToken();

  const res = await fetch(`${BASE_URL}/customers/${customerId}/googleAds:search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
      "Content-Type": "application/json",
      ...(process.env.GOOGLE_ADS_MCC_ID
        ? { "login-customer-id": process.env.GOOGLE_ADS_MCC_ID }
        : {}),
    },
    body: JSON.stringify({ query }),
  });

  const text = await res.text();

  let data: { results?: Record<string, unknown>[]; error?: { message: string; details?: unknown[] } };
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Google Ads API returned non-JSON (status ${res.status}): ${text.slice(0, 200)}`);
  }

  if (!res.ok) {
    throw new Error(data?.error?.message ?? `Google Ads API error ${res.status}`);
  }

  return data.results ?? [];
}

function num(val: unknown): number {
  return Number(val ?? 0);
}

function micros(val: unknown): number {
  return Math.round(num(val) / 1_000_000 * 100) / 100;
}

// ─── Campaign Performance ─────────────────────────────────────────────────────

export async function fetchCampaignPerformance(from: string, to: string) {
  const rows = await adsQuery(`
    SELECT
      campaign.id, campaign.name, campaign.status,
      metrics.cost_micros, metrics.impressions, metrics.clicks,
      metrics.ctr, metrics.conversions, metrics.cost_per_conversion,
      metrics.average_cpc
    FROM campaign
    WHERE segments.date BETWEEN '${from}' AND '${to}'
      AND campaign.status != 'REMOVED'
    ORDER BY metrics.cost_micros DESC
  `);

  return rows.map((r) => {
    const c = r.campaign as Record<string, unknown>;
    const m = r.metrics as Record<string, unknown>;
    const spend = micros(m.costMicros);
    const conv = num(m.conversions);
    return {
      campaign_id: String(c.id),
      campaign_name: String(c.name),
      status: String(c.status),
      spend,
      impressions: num(m.impressions),
      clicks: num(m.clicks),
      ctr: Math.round(num(m.ctr) * 10000) / 100,
      conversions: conv,
      cpl: conv > 0 ? Math.round((spend / conv) * 100) / 100 : 0,
      avg_cpc: micros(m.averageCpc),
    };
  });
}

// ─── Search Terms ─────────────────────────────────────────────────────────────

export async function fetchSearchTerms(from: string, to: string) {
  const rows = await adsQuery(`
    SELECT
      search_term_view.search_term,
      metrics.clicks, metrics.impressions,
      metrics.conversions, metrics.cost_micros, metrics.ctr
    FROM search_term_view
    WHERE segments.date BETWEEN '${from}' AND '${to}'
      AND metrics.clicks > 0
    ORDER BY metrics.clicks DESC
    LIMIT 20
  `);

  return rows.map((r) => {
    const v = r.searchTermView as Record<string, unknown>;
    const m = r.metrics as Record<string, unknown>;
    return {
      term: String(v.searchTerm),
      clicks: num(m.clicks),
      impressions: num(m.impressions),
      conversions: num(m.conversions),
      cost: micros(m.costMicros),
      ctr: Math.round(num(m.ctr) * 10000) / 100,
    };
  });
}

// ─── Ad Copy Performance ──────────────────────────────────────────────────────

export async function fetchAdPerformance(from: string, to: string) {
  const rows = await adsQuery(`
    SELECT
      ad_group_ad.ad.id,
      ad_group_ad.ad.name,
      ad_group_ad.ad.type,
      ad_group_ad.ad.final_urls,
      campaign.name,
      ad_group.name,
      metrics.impressions, metrics.clicks, metrics.ctr, metrics.conversions
    FROM ad_group_ad
    WHERE segments.date BETWEEN '${from}' AND '${to}'
      AND ad_group_ad.status != 'REMOVED'
      AND metrics.impressions > 0
    ORDER BY metrics.ctr DESC
    LIMIT 10
  `);

  return rows.map((r) => {
    const aga = r.adGroupAd as Record<string, unknown>;
    const ad = aga?.ad as Record<string, unknown> | undefined;
    const adGroup = r.adGroup as Record<string, unknown>;
    const campaign = r.campaign as Record<string, unknown>;
    const m = r.metrics as Record<string, unknown>;
    const urls = ad?.finalUrls as string[] | undefined;
    return {
      headline: String(ad?.name ?? adGroup?.name ?? campaign?.name ?? "Ad"),
      description: urls?.[0] ?? String(ad?.type ?? "—"),
      impressions: num(m.impressions),
      clicks: num(m.clicks),
      ctr: Math.round(num(m.ctr) * 10000) / 100,
      conversions: num(m.conversions),
    };
  });
}

// ─── Keywords ─────────────────────────────────────────────────────────────────

export async function fetchKeywords(from: string, to: string) {
  const rows = await adsQuery(`
    SELECT
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      ad_group_criterion.status,
      campaign.name,
      metrics.clicks, metrics.impressions, metrics.ctr,
      metrics.average_cpc, metrics.conversions
    FROM keyword_view
    WHERE segments.date BETWEEN '${from}' AND '${to}'
      AND ad_group_criterion.status != 'REMOVED'
      AND campaign.status = 'ENABLED'
    ORDER BY metrics.clicks DESC
    LIMIT 50
  `);

  return rows.map((r) => {
    const agc = r.adGroupCriterion as Record<string, unknown>;
    const kw = agc?.keyword as Record<string, unknown> | undefined;
    const c = r.campaign as Record<string, unknown>;
    const m = r.metrics as Record<string, unknown>;
    return {
      text: String(kw?.text ?? ""),
      match_type: String(kw?.matchType ?? ""),
      status: String(agc?.status ?? ""),
      campaign: String(c?.name ?? ""),
      clicks: num(m.clicks),
      impressions: num(m.impressions),
      ctr: Math.round(num(m.ctr) * 10000) / 100,
      avg_cpc: micros(m.averageCpc),
      conversions: num(m.conversions),
    };
  });
}

// ─── Hourly Performance ───────────────────────────────────────────────────────

export async function fetchHourlyPerformance(from: string, to: string) {
  const rows = await adsQuery(`
    SELECT
      segments.hour, segments.day_of_week,
      metrics.impressions, metrics.clicks,
      metrics.conversions, metrics.cost_micros
    FROM campaign
    WHERE segments.date BETWEEN '${from}' AND '${to}'
    ORDER BY segments.day_of_week, segments.hour
  `);

  return rows.map((r) => {
    const s = r.segments as Record<string, unknown>;
    const m = r.metrics as Record<string, unknown>;
    return {
      hour: num(s.hour),
      day: String(s.dayOfWeek),
      impressions: num(m.impressions),
      clicks: num(m.clicks),
      conversions: num(m.conversions),
      spend: micros(m.costMicros),
    };
  });
}

// ─── Add Keyword ──────────────────────────────────────────────────────────────

export async function addKeyword(adGroupId: string, text: string, matchType: "BROAD" | "PHRASE" | "EXACT") {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!.replace(/-/g, "");
  const token = await getAccessToken();

  const res = await fetch(`${BASE_URL}/customers/${customerId}/adGroupCriteria:mutate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      operations: [{
        create: {
          adGroup: `customers/${customerId}/adGroups/${adGroupId}`,
          status: "ENABLED",
          keyword: { text, matchType },
        },
      }],
    }),
  });

  if (!res.ok) {
    const err = await res.json() as { error?: { message: string } };
    throw new Error(err?.error?.message ?? `Failed to add keyword (${res.status})`);
  }
}

// ─── Add Negative Keyword ─────────────────────────────────────────────────────

export async function addNegativeKeyword(campaignId: string, text: string) {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!.replace(/-/g, "");
  const token = await getAccessToken();

  const res = await fetch(`${BASE_URL}/customers/${customerId}/campaignCriteria:mutate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      operations: [{
        create: {
          campaign: `customers/${customerId}/campaigns/${campaignId}`,
          negative: true,
          keyword: { text, matchType: "BROAD" },
        },
      }],
    }),
  });

  if (!res.ok) {
    const err = await res.json() as { error?: { message: string } };
    throw new Error(err?.error?.message ?? `Failed to add negative keyword (${res.status})`);
  }
}

// ─── Create Responsive Search Ad ─────────────────────────────────────────────

export async function createResponsiveSearchAd(params: {
  adGroupId: string;
  headlines: string[];
  descriptions: string[];
  finalUrl: string;
}) {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!.replace(/-/g, "");
  const token = await getAccessToken();

  const res = await fetch(`${BASE_URL}/customers/${customerId}/adGroupAds:mutate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      operations: [{
        create: {
          adGroup: `customers/${customerId}/adGroups/${params.adGroupId}`,
          status: "PAUSED",
          ad: {
            finalUrls: [params.finalUrl],
            responsiveSearchAd: {
              headlines: params.headlines.map((text) => ({ text })),
              descriptions: params.descriptions.map((text) => ({ text })),
            },
          },
        },
      }],
    }),
  });

  if (!res.ok) {
    const err = await res.json() as { error?: { message: string } };
    throw new Error(err?.error?.message ?? `Failed to create ad (${res.status})`);
  }
}

// ─── Campaign Status ──────────────────────────────────────────────────────────

export async function setCampaignStatus(campaignId: string, status: "ENABLED" | "PAUSED") {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!.replace(/-/g, "");
  const token = await getAccessToken();

  const res = await fetch(`${BASE_URL}/customers/${customerId}/campaigns:mutate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      operations: [{
        update: {
          resourceName: `customers/${customerId}/campaigns/${campaignId}`,
          status,
        },
        updateMask: "status",
      }],
    }),
  });

  if (!res.ok) {
    const err = await res.json() as { error?: { message: string } };
    throw new Error(err?.error?.message ?? `Failed to update campaign (${res.status})`);
  }
}
