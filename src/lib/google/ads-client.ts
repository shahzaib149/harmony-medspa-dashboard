const API_VERSION = process.env.GOOGLE_ADS_API_VERSION ?? "v21";
const BASE_URL = `https://googleads.googleapis.com/${API_VERSION}`;

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

  if (!res.ok || !data.access_token) {
    throw new Error(`Token exchange failed: ${data.error} — ${data.error_description}`);
  }

  return data.access_token;
}

function requestHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    "Content-Type": "application/json",
    ...(process.env.GOOGLE_ADS_MCC_ID
      ? { "login-customer-id": process.env.GOOGLE_ADS_MCC_ID.replace(/-/g, "") }
      : {}),
  };
}

async function adsQuery(query: string): Promise<Record<string, unknown>[]> {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!.replace(/-/g, "");
  const token = await getAccessToken();

  const url = `${BASE_URL}/customers/${customerId}/googleAds:search`;
  const res = await fetch(url, {
    method: "POST",
    headers: requestHeaders(token),
    body: JSON.stringify({ query }),
  });

  const text = await res.text();

  let data: { results?: Record<string, unknown>[]; error?: { message: string; details?: unknown[] } };
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Google Ads API 404 — URL tried: ${url} — Response: ${text.slice(0, 150)}`);
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
    headers: requestHeaders(token),
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
    headers: requestHeaders(token),
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

export type GoogleAdTextAsset = {
  text: string;
  pinnedField?: "HEADLINE_1" | "HEADLINE_2" | "HEADLINE_3" | "DESCRIPTION_1" | "DESCRIPTION_2" | null;
};

export class GoogleAdsWriteError extends Error {
  requestId: string | null;

  constructor(message: string, requestId: string | null = null) {
    super(message);
    this.name = "GoogleAdsWriteError";
    this.requestId = requestId;
  }
}

export async function fetchConversionTrackingSummary() {
  const rows = await adsQuery(`
    SELECT conversion_action.id, conversion_action.name, conversion_action.status,
      conversion_action.type, conversion_action.category, conversion_action.primary_for_goal
    FROM conversion_action
    WHERE conversion_action.status = 'ENABLED'
    ORDER BY conversion_action.name
  `);
  const actions = rows.map((row) => {
    const action = row.conversionAction as Record<string, unknown>;
    return {
      id: String(action.id),
      name: String(action.name),
      type: String(action.type),
      category: String(action.category),
      primaryForGoal: Boolean(action.primaryForGoal),
    };
  });
  return {
    configured: actions.length > 0,
    enabledActionCount: actions.length,
    primaryActionCount: actions.filter((action) => action.primaryForGoal).length,
    actions,
    leadUrlVerified: false,
  };
}

export async function addKeywordsBatch(
  adGroupId: string,
  keywords: Array<{ text: string; matchType: "BROAD" | "PHRASE" | "EXACT" }>,
) {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!.replace(/-/g, "");
  const operations = keywords.map((keyword) => ({
    create: {
      adGroup: `customers/${customerId}/adGroups/${adGroupId}`,
      status: "ENABLED",
      keyword,
    },
  }));
  const mutate = async (validateOnly: boolean) => {
    const token = await getAccessToken();
    const response = await fetch(`${BASE_URL}/customers/${customerId}/adGroupCriteria:mutate`, {
      method: "POST",
      headers: requestHeaders(token),
      body: JSON.stringify({ operations, validateOnly, partialFailure: false }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null) as { error?: { message?: string } } | null;
      throw new GoogleAdsWriteError(data?.error?.message || `Google Ads rejected the keywords (${response.status}).`);
    }
  };
  await mutate(true);
  await mutate(false);
}

export async function addNegativeKeywordsBatch(campaignId: string, keywords: string[]) {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!.replace(/-/g, "");
  const operations = keywords.map((text) => ({
    create: {
      campaign: `customers/${customerId}/campaigns/${campaignId}`,
      negative: true,
      keyword: { text, matchType: "BROAD" },
    },
  }));
  const mutate = async (validateOnly: boolean) => {
    const token = await getAccessToken();
    const response = await fetch(`${BASE_URL}/customers/${customerId}/campaignCriteria:mutate`, {
      method: "POST",
      headers: requestHeaders(token),
      body: JSON.stringify({ operations, validateOnly, partialFailure: false }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null) as { error?: { message?: string } } | null;
      throw new GoogleAdsWriteError(data?.error?.message || `Google Ads rejected the negatives (${response.status}).`);
    }
  };
  await mutate(true);
  await mutate(false);
}

function escapeGaql(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

export async function resolveSearchAdTarget(campaignName: string, adGroupName: string) {
  const rows = await adsQuery(`
    SELECT campaign.id, campaign.name, ad_group.id, ad_group.name
    FROM ad_group
    WHERE campaign.name = '${escapeGaql(campaignName)}'
      AND ad_group.name = '${escapeGaql(adGroupName)}'
      AND campaign.status != 'REMOVED'
      AND ad_group.status != 'REMOVED'
    LIMIT 2
  `);
  if (rows.length === 0) throw new GoogleAdsWriteError("The selected campaign and ad group were not found in Google Ads.");
  if (rows.length > 1) throw new GoogleAdsWriteError("More than one matching ad group was found. Use a unique campaign and ad group.");
  const campaign = rows[0].campaign as Record<string, unknown>;
  const adGroup = rows[0].adGroup as Record<string, unknown>;
  return {
    campaignId: String(campaign.id),
    campaignName: String(campaign.name),
    adGroupId: String(adGroup.id),
    adGroupName: String(adGroup.name),
  };
}

type CreateRsaParams = {
  adGroupId: string;
  headlines: GoogleAdTextAsset[];
  descriptions: GoogleAdTextAsset[];
  finalUrl: string;
  path1?: string;
  path2?: string;
};

function rsaOperation(params: CreateRsaParams) {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!.replace(/-/g, "");
  const mapAsset = (asset: GoogleAdTextAsset) => ({
    text: asset.text,
    ...(asset.pinnedField ? { pinnedField: asset.pinnedField } : {}),
  });
  return {
    create: {
      adGroup: `customers/${customerId}/adGroups/${params.adGroupId}`,
      status: "PAUSED" as const,
      ad: {
        finalUrls: [params.finalUrl],
        responsiveSearchAd: {
          headlines: params.headlines.map(mapAsset),
          descriptions: params.descriptions.map(mapAsset),
          ...(params.path1 ? { path1: params.path1 } : {}),
          ...(params.path2 ? { path2: params.path2 } : {}),
        },
      },
    },
  };
}

async function mutateResponsiveSearchAd(params: CreateRsaParams, validateOnly: boolean) {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!.replace(/-/g, "");
  const token = await getAccessToken();
  const response = await fetch(`${BASE_URL}/customers/${customerId}/adGroupAds:mutate`, {
    method: "POST",
    headers: requestHeaders(token),
    body: JSON.stringify({
      operations: [rsaOperation(params)],
      validateOnly,
      partialFailure: false,
      responseContentType: "RESOURCE_NAME_ONLY",
    }),
  });
  const requestId = response.headers.get("request-id") || response.headers.get("x-request-id");
  const data = await response.json().catch(() => null) as {
    results?: Array<{ resourceName?: string }>;
    error?: { message?: string };
  } | null;
  if (!response.ok) {
    throw new GoogleAdsWriteError(
      data?.error?.message || `Google Ads rejected the ad request (${response.status}).`,
      requestId,
    );
  }
  return { resourceName: data?.results?.[0]?.resourceName ?? "", requestId };
}

export async function createResponsiveSearchAd(params: CreateRsaParams) {
  await mutateResponsiveSearchAd(params, true);
  const result = await mutateResponsiveSearchAd(params, false);
  if (!result.resourceName) {
    throw new GoogleAdsWriteError("Google Ads did not return the created ad resource name.", result.requestId);
  }
  return result;
}

export async function verifyPausedSearchAd(resourceName: string) {
  let rows: Record<string, unknown>[] = [];
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    rows = await adsQuery(`
      SELECT ad_group_ad.resource_name, ad_group_ad.status, ad_group_ad.ad.id,
        ad_group_ad.ad.final_urls, campaign.name, ad_group.name
      FROM ad_group_ad
      WHERE ad_group_ad.resource_name = '${escapeGaql(resourceName)}'
      LIMIT 1
    `);
    if (rows.length === 1) break;
    if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 500));
  }
  if (rows.length !== 1) throw new GoogleAdsWriteError("The created ad could not be verified in Google Ads.");
  const adGroupAd = rows[0].adGroupAd as Record<string, unknown>;
  const ad = adGroupAd.ad as Record<string, unknown>;
  if (String(adGroupAd.status) !== "PAUSED") {
    throw new GoogleAdsWriteError("Google Ads returned the created ad with an unexpected status.");
  }
  return {
    resourceName: String(adGroupAd.resourceName || resourceName),
    adId: String(ad.id || resourceName.split("~").pop() || ""),
    status: "PAUSED" as const,
    finalUrls: Array.isArray(ad.finalUrls) ? ad.finalUrls.map(String) : [],
  };
}

// ─── Campaign Status ──────────────────────────────────────────────────────────

export async function setCampaignStatus(campaignId: string, status: "ENABLED" | "PAUSED") {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!.replace(/-/g, "");
  const token = await getAccessToken();

  const res = await fetch(`${BASE_URL}/customers/${customerId}/campaigns:mutate`, {
    method: "POST",
    headers: requestHeaders(token),
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
