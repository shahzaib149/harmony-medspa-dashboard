const API_VERSION = process.env.GOOGLE_ADS_API_VERSION ?? "v21";
const BASE_URL = `https://googleads.googleapis.com/${API_VERSION}`;

let accessTokenCache: { value: string; expiresAt: number } | null = null;
let accessTokenRequest: Promise<string> | null = null;

async function getAccessToken(): Promise<string> {
  if (accessTokenCache && accessTokenCache.expiresAt > Date.now()) {
    return accessTokenCache.value;
  }
  if (accessTokenRequest) return accessTokenRequest;
  accessTokenRequest = requestAccessToken();
  try {
    return await accessTokenRequest;
  } finally {
    accessTokenRequest = null;
  }
}

async function requestAccessToken(): Promise<string> {
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

  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !data.access_token) {
    throw new Error(
      `Token exchange failed: ${data.error} — ${data.error_description}`,
    );
  }
  accessTokenCache = {
    value: data.access_token,
    expiresAt:
      Date.now() + Math.max(60, (data.expires_in || 3600) - 60) * 1000,
  };
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

  let data: {
    results?: Record<string, unknown>[];
    error?: { message: string; details?: unknown[] };
  };
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `Google Ads API 404 — URL tried: ${url} — Response: ${text.slice(0, 150)}`,
    );
  }

  if (!res.ok) {
    throw new Error(
      data?.error?.message ?? `Google Ads API error ${res.status}`,
    );
  }

  return data.results ?? [];
}

function num(val: unknown): number {
  return Number(val ?? 0);
}

function micros(val: unknown): number {
  return Math.round((num(val) / 1_000_000) * 100) / 100;
}

function text(val: unknown): string {
  return val == null ? "" : String(val);
}

function arrayOfText(val: unknown): string[] {
  return Array.isArray(val) ? val.map(text).filter(Boolean) : [];
}

function assetTexts(
  val: unknown,
): Array<{ text: string; pinnedField?: string }> {
  if (!Array.isArray(val)) return [];
  return val
    .map((item) => {
      const asset = item as Record<string, unknown>;
      return {
        text: text(asset.text),
        pinnedField: text(asset.pinnedField) || undefined,
      };
    })
    .filter((item) => item.text);
}

/**
 * Fetches an identity-complete Google Ads inventory and joins range metrics by
 * resource name. Identity queries intentionally do not filter on segments.date;
 * that keeps newly-created, paused and zero-impression entities visible.
 */
export async function fetchGoogleAdsWorkspace(
  from: string,
  to: string,
  options: { includeSearchTerms?: boolean; includeAssets?: boolean } = {},
) {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!.replace(/-/g, "");
  const [
    campaignInventory,
    campaignMetrics,
    adGroups,
    adGroupMetrics,
    ads,
    adMetrics,
    keywords,
    keywordMetrics,
    searchTerms,
    assets,
  ] = await Promise.all([
    adsQuery(`
        SELECT campaign.id, campaign.resource_name, campaign.name, campaign.status,
          campaign.advertising_channel_type, campaign.start_date, campaign.end_date,
          campaign.bidding_strategy_type, campaign_budget.amount_micros,
          campaign_budget.resource_name
        FROM campaign
        WHERE campaign.status != 'REMOVED'
        ORDER BY campaign.name
      `),
    adsQuery(`
        SELECT campaign.resource_name, metrics.cost_micros, metrics.impressions,
          metrics.clicks, metrics.ctr, metrics.average_cpc, metrics.conversions,
          metrics.cost_per_conversion, metrics.conversions_value
        FROM campaign
        WHERE segments.date BETWEEN '${from}' AND '${to}'
          AND campaign.status != 'REMOVED'
      `),
    adsQuery(`
        SELECT campaign.id, campaign.resource_name, campaign.name,
          ad_group.id, ad_group.resource_name, ad_group.name, ad_group.status,
          ad_group.type
        FROM ad_group
        WHERE ad_group.status != 'REMOVED'
        ORDER BY campaign.name, ad_group.name
      `),
    adsQuery(`
        SELECT ad_group.resource_name, metrics.cost_micros, metrics.impressions,
          metrics.clicks, metrics.ctr, metrics.average_cpc, metrics.conversions,
          metrics.cost_per_conversion, metrics.conversions_value
        FROM ad_group
        WHERE segments.date BETWEEN '${from}' AND '${to}'
          AND ad_group.status != 'REMOVED'
      `),
    adsQuery(`
        SELECT campaign.id, campaign.resource_name, campaign.name,
          ad_group.id, ad_group.resource_name, ad_group.name,
          ad_group_ad.resource_name, ad_group_ad.status,
          ad_group_ad.primary_status, ad_group_ad.primary_status_reasons,
          ad_group_ad.policy_summary.approval_status,
          ad_group_ad.policy_summary.review_status,
          ad_group_ad.policy_summary.policy_topic_entries,
          ad_group_ad.ad.id, ad_group_ad.ad.resource_name, ad_group_ad.ad.name,
          ad_group_ad.ad.type, ad_group_ad.ad.final_urls,
          ad_group_ad.ad.responsive_search_ad.headlines,
          ad_group_ad.ad.responsive_search_ad.descriptions,
          ad_group_ad.ad.responsive_search_ad.path1,
          ad_group_ad.ad.responsive_search_ad.path2,
          ad_group_ad.ad_strength
        FROM ad_group_ad
        WHERE ad_group_ad.status != 'REMOVED'
        ORDER BY campaign.name, ad_group.name
      `),
    adsQuery(`
        SELECT ad_group_ad.resource_name, metrics.cost_micros, metrics.impressions,
          metrics.clicks, metrics.ctr, metrics.average_cpc, metrics.conversions,
          metrics.cost_per_conversion, metrics.conversions_value
        FROM ad_group_ad
        WHERE segments.date BETWEEN '${from}' AND '${to}'
          AND ad_group_ad.status != 'REMOVED'
      `),
    adsQuery(`
        SELECT campaign.id, campaign.resource_name, campaign.name,
          ad_group.id, ad_group.resource_name, ad_group.name,
          ad_group_criterion.criterion_id, ad_group_criterion.resource_name,
          ad_group_criterion.status, ad_group_criterion.negative,
          ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type,
          ad_group_criterion.quality_info.quality_score,
          ad_group_criterion.quality_info.creative_quality_score,
          ad_group_criterion.quality_info.post_click_quality_score
        FROM keyword_view
        WHERE ad_group_criterion.status != 'REMOVED'
        ORDER BY campaign.name, ad_group.name
      `),
    adsQuery(`
        SELECT ad_group_criterion.resource_name, metrics.cost_micros,
          metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpc,
          metrics.conversions, metrics.cost_per_conversion,
          metrics.conversions_value
        FROM keyword_view
        WHERE segments.date BETWEEN '${from}' AND '${to}'
          AND ad_group_criterion.status != 'REMOVED'
      `),
    options.includeSearchTerms
      ? adsQuery(`
        SELECT search_term_view.resource_name, search_term_view.search_term,
          search_term_view.status, campaign.id, campaign.name,
          ad_group.id, ad_group.name, metrics.cost_micros, metrics.impressions,
          metrics.clicks, metrics.ctr, metrics.conversions
        FROM search_term_view
        WHERE segments.date BETWEEN '${from}' AND '${to}'
          AND metrics.impressions > 0
        ORDER BY metrics.cost_micros DESC
        LIMIT 250
      `)
      : Promise.resolve([] as Record<string, unknown>[]),
    options.includeAssets
      ? adsQuery(`
        SELECT asset.id, asset.resource_name, asset.name, asset.type,
          asset.source, asset.policy_summary.approval_status,
          asset.policy_summary.review_status
        FROM asset
        ORDER BY asset.id DESC
        LIMIT 250
      `)
      : Promise.resolve([] as Record<string, unknown>[]),
  ]);

  const campaignMetricMap = new Map(
    campaignMetrics.map((row) => {
      const campaign = row.campaign as Record<string, unknown>;
      return [
        text(campaign.resourceName),
        row.metrics as Record<string, unknown>,
      ];
    }),
  );
  const adGroupMetricMap = new Map(
    adGroupMetrics.map((row) => {
      const adGroup = row.adGroup as Record<string, unknown>;
      return [
        text(adGroup.resourceName),
        row.metrics as Record<string, unknown>,
      ];
    }),
  );
  const adMetricMap = new Map(
    adMetrics.map((row) => {
      const adGroupAd = row.adGroupAd as Record<string, unknown>;
      return [
        text(adGroupAd.resourceName),
        row.metrics as Record<string, unknown>,
      ];
    }),
  );
  const keywordMetricMap = new Map(
    keywordMetrics.map((row) => {
      const criterion = row.adGroupCriterion as Record<string, unknown>;
      return [
        text(criterion.resourceName),
        row.metrics as Record<string, unknown>,
      ];
    }),
  );
  const metricShape = (metrics: Record<string, unknown> = {}) => {
    const cost = micros(metrics.costMicros);
    const conversions = num(metrics.conversions);
    const conversionValue = num(metrics.conversionsValue);
    return {
      cost,
      impressions: num(metrics.impressions),
      clicks: num(metrics.clicks),
      ctrPct: num(metrics.ctr) * 100,
      avgCpc: micros(metrics.averageCpc),
      conversions,
      cpa: conversions > 0 ? cost / conversions : 0,
      conversionValue,
      conversionValueAvailable:
        metrics.conversionsValue !== undefined &&
        metrics.conversionsValue !== null,
      roas: cost > 0 ? conversionValue / cost : 0,
    };
  };

  const normalizedCampaigns = campaignInventory.map((row) => {
    const campaign = row.campaign as Record<string, unknown>;
    const budget = (row.campaignBudget ?? {}) as Record<string, unknown>;
    const resourceName = text(campaign.resourceName);
    return {
      id: resourceName || text(campaign.id),
      campaignId: text(campaign.id),
      resourceName,
      campaignName: text(campaign.name),
      campaignStatus: text(campaign.status),
      channelType: text(campaign.advertisingChannelType),
      budget: micros(budget.amountMicros),
      budgetResourceName: text(budget.resourceName),
      startDate: text(campaign.startDate),
      endDate: text(campaign.endDate),
      biddingStrategy: text(campaign.biddingStrategyType),
      accountName: `Google Ads ${customerId}`,
      pulledAt: new Date().toISOString(),
      ...metricShape(campaignMetricMap.get(resourceName)),
    };
  });

  const normalizedAdGroups = adGroups.map((row) => {
    const campaign = row.campaign as Record<string, unknown>;
    const adGroup = row.adGroup as Record<string, unknown>;
    const resourceName = text(adGroup.resourceName);
    return {
      id: resourceName || text(adGroup.id),
      campaignId: text(campaign.id),
      campaignResourceName: text(campaign.resourceName),
      campaignName: text(campaign.name),
      adGroupId: text(adGroup.id),
      resourceName,
      adGroupName: text(adGroup.name),
      adGroupStatus: text(adGroup.status),
      adGroupType: text(adGroup.type),
      pulledAt: new Date().toISOString(),
      ...metricShape(adGroupMetricMap.get(resourceName)),
    };
  });

  const normalizedAds = ads.map((row) => {
    const campaign = row.campaign as Record<string, unknown>;
    const adGroup = row.adGroup as Record<string, unknown>;
    const adGroupAd = row.adGroupAd as Record<string, unknown>;
    const ad = (adGroupAd.ad ?? {}) as Record<string, unknown>;
    const rsa = (ad.responsiveSearchAd ?? {}) as Record<string, unknown>;
    const policy = (adGroupAd.policySummary ?? {}) as Record<string, unknown>;
    const policyTopics = Array.isArray(policy.policyTopicEntries)
      ? policy.policyTopicEntries
          .map((entry) => {
            const topic = entry as Record<string, unknown>;
            return text(topic.topic);
          })
          .filter(Boolean)
      : [];
    const finalUrls = arrayOfText(ad.finalUrls);
    return {
      id: text(adGroupAd.resourceName) || text(ad.resourceName) || text(ad.id),
      adId: text(ad.id),
      resourceName: text(ad.resourceName),
      adGroupAdResourceName: text(adGroupAd.resourceName),
      adName:
        text(ad.name) ||
        assetTexts(rsa.headlines)[0]?.text ||
        `Ad ${text(ad.id)}`,
      adType: text(ad.type),
      campaignId: text(campaign.id),
      campaignResourceName: text(campaign.resourceName),
      campaignName: text(campaign.name),
      adGroupId: text(adGroup.id),
      adGroupResourceName: text(adGroup.resourceName),
      adGroupName: text(adGroup.name),
      status: text(adGroupAd.status),
      primaryStatus: text(adGroupAd.primaryStatus),
      primaryStatusReasons: arrayOfText(adGroupAd.primaryStatusReasons),
      approvalStatus: text(policy.approvalStatus),
      reviewStatus: text(policy.reviewStatus),
      policyTopics,
      strength: text(adGroupAd.adStrength),
      finalUrl: finalUrls[0] ?? "",
      finalUrls,
      displayUrl: finalUrls[0] ?? "",
      path1: text(rsa.path1),
      path2: text(rsa.path2),
      headlineAssets: assetTexts(rsa.headlines),
      descriptionAssets: assetTexts(rsa.descriptions),
      headlines: assetTexts(rsa.headlines)
        .map((item) => item.text)
        .join(" | "),
      descriptions: assetTexts(rsa.descriptions)
        .map((item) => item.text)
        .join(" | "),
      publishSource: "Google Ads API",
      lastSynced: new Date().toISOString(),
      ...metricShape(adMetricMap.get(text(adGroupAd.resourceName))),
    };
  });

  const normalizedKeywords = keywords.map((row) => {
    const campaign = row.campaign as Record<string, unknown>;
    const adGroup = row.adGroup as Record<string, unknown>;
    const criterion = row.adGroupCriterion as Record<string, unknown>;
    const keyword = (criterion.keyword ?? {}) as Record<string, unknown>;
    const quality = (criterion.qualityInfo ?? {}) as Record<string, unknown>;
    return {
      id: text(criterion.resourceName) || text(criterion.criterionId),
      criterionId: text(criterion.criterionId),
      resourceName: text(criterion.resourceName),
      keywordText: text(keyword.text),
      matchType: text(keyword.matchType),
      status: text(criterion.status),
      negative: Boolean(criterion.negative),
      campaignId: text(campaign.id),
      campaignResourceName: text(campaign.resourceName),
      campaignName: text(campaign.name),
      adGroupId: text(adGroup.id),
      adGroupResourceName: text(adGroup.resourceName),
      adGroupName: text(adGroup.name),
      qualityScore: num(quality.qualityScore),
      creativeQuality: text(quality.creativeQualityScore),
      landingPageQuality: text(quality.postClickQualityScore),
      ...metricShape(keywordMetricMap.get(text(criterion.resourceName))),
    };
  });

  const normalizedSearchTerms = searchTerms.map((row) => {
    const view = row.searchTermView as Record<string, unknown>;
    const campaign = row.campaign as Record<string, unknown>;
    const adGroup = row.adGroup as Record<string, unknown>;
    return {
      id: text(view.resourceName) || text(view.searchTerm),
      resourceName: text(view.resourceName),
      term: text(view.searchTerm),
      status: text(view.status),
      campaignId: text(campaign.id),
      campaignName: text(campaign.name),
      adGroupId: text(adGroup.id),
      adGroupName: text(adGroup.name),
      ...metricShape(row.metrics as Record<string, unknown>),
    };
  });

  const normalizedAssets = assets.map((row) => {
    const asset = row.asset as Record<string, unknown>;
    const policy = (asset.policySummary ?? {}) as Record<string, unknown>;
    return {
      id: text(asset.resourceName) || text(asset.id),
      assetId: text(asset.id),
      resourceName: text(asset.resourceName),
      name: text(asset.name) || `${text(asset.type)} asset`,
      type: text(asset.type),
      source: text(asset.source),
      approvalStatus: text(policy.approvalStatus),
      reviewStatus: text(policy.reviewStatus),
    };
  });

  return {
    source: "live",
    accountName: `Google Ads ${customerId}`,
    dateRange: { from, to },
    fetchedAt: new Date().toISOString(),
    campaigns: normalizedCampaigns,
    adGroups: normalizedAdGroups,
    ads: normalizedAds,
    keywords: normalizedKeywords,
    searchTerms: normalizedSearchTerms,
    assets: normalizedAssets,
  };
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

export async function addKeyword(
  adGroupId: string,
  text: string,
  matchType: "BROAD" | "PHRASE" | "EXACT",
) {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!.replace(/-/g, "");
  const token = await getAccessToken();

  const res = await fetch(
    `${BASE_URL}/customers/${customerId}/adGroupCriteria:mutate`,
    {
      method: "POST",
      headers: requestHeaders(token),
      body: JSON.stringify({
        operations: [
          {
            create: {
              adGroup: `customers/${customerId}/adGroups/${adGroupId}`,
              status: "ENABLED",
              keyword: { text, matchType },
            },
          },
        ],
      }),
    },
  );

  if (!res.ok) {
    const err = (await res.json()) as { error?: { message: string } };
    throw new Error(
      err?.error?.message ?? `Failed to add keyword (${res.status})`,
    );
  }
}

// ─── Add Negative Keyword ─────────────────────────────────────────────────────

export async function addNegativeKeyword(campaignId: string, text: string) {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!.replace(/-/g, "");
  const token = await getAccessToken();

  const res = await fetch(
    `${BASE_URL}/customers/${customerId}/campaignCriteria:mutate`,
    {
      method: "POST",
      headers: requestHeaders(token),
      body: JSON.stringify({
        operations: [
          {
            create: {
              campaign: `customers/${customerId}/campaigns/${campaignId}`,
              negative: true,
              keyword: { text, matchType: "BROAD" },
            },
          },
        ],
      }),
    },
  );

  if (!res.ok) {
    const err = (await res.json()) as { error?: { message: string } };
    throw new Error(
      err?.error?.message ?? `Failed to add negative keyword (${res.status})`,
    );
  }
}

// ─── Google Ads write helpers ────────────────────────────────────────────────

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
    primaryActionCount: actions.filter((action) => action.primaryForGoal)
      .length,
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
    const response = await fetch(
      `${BASE_URL}/customers/${customerId}/adGroupCriteria:mutate`,
      {
        method: "POST",
        headers: requestHeaders(token),
        body: JSON.stringify({
          operations,
          validateOnly,
          partialFailure: false,
        }),
      },
    );
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      throw new GoogleAdsWriteError(
        data?.error?.message ||
          `Google Ads rejected the keywords (${response.status}).`,
      );
    }
  };
  await mutate(true);
  await mutate(false);
}

export async function addNegativeKeywordsBatch(
  campaignId: string,
  keywords: string[],
) {
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
    const response = await fetch(
      `${BASE_URL}/customers/${customerId}/campaignCriteria:mutate`,
      {
        method: "POST",
        headers: requestHeaders(token),
        body: JSON.stringify({
          operations,
          validateOnly,
          partialFailure: false,
        }),
      },
    );
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      throw new GoogleAdsWriteError(
        data?.error?.message ||
          `Google Ads rejected the negatives (${response.status}).`,
      );
    }
  };
  await mutate(true);
  await mutate(false);
}

function escapeGaql(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

export async function resolveSearchAdTarget(
  campaignName: string,
  adGroupName: string,
) {
  const rows = await adsQuery(`
    SELECT campaign.id, campaign.name, ad_group.id, ad_group.name
    FROM ad_group
    WHERE campaign.name = '${escapeGaql(campaignName)}'
      AND ad_group.name = '${escapeGaql(adGroupName)}'
      AND campaign.status != 'REMOVED'
      AND ad_group.status != 'REMOVED'
    LIMIT 2
  `);
  if (rows.length === 0)
    throw new GoogleAdsWriteError(
      "The selected campaign and ad group were not found in Google Ads.",
    );
  if (rows.length > 1)
    throw new GoogleAdsWriteError(
      "More than one matching ad group was found. Use a unique campaign and ad group.",
    );
  const campaign = rows[0].campaign as Record<string, unknown>;
  const adGroup = rows[0].adGroup as Record<string, unknown>;
  return {
    campaignId: String(campaign.id),
    campaignName: String(campaign.name),
    adGroupId: String(adGroup.id),
    adGroupName: String(adGroup.name),
  };
}

// ─── Campaign Status ──────────────────────────────────────────────────────────

export async function setCampaignStatus(
  campaignId: string,
  status: "ENABLED" | "PAUSED",
) {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!.replace(/-/g, "");
  const token = await getAccessToken();

  const res = await fetch(
    `${BASE_URL}/customers/${customerId}/campaigns:mutate`,
    {
      method: "POST",
      headers: requestHeaders(token),
      body: JSON.stringify({
        operations: [
          {
            update: {
              resourceName: `customers/${customerId}/campaigns/${campaignId}`,
              status,
            },
            updateMask: "status",
          },
        ],
      }),
    },
  );

  if (!res.ok) {
    const err = (await res.json()) as { error?: { message: string } };
    throw new Error(
      err?.error?.message ?? `Failed to update campaign (${res.status})`,
    );
  }
}
