import { GoogleAdsApi, enums } from "google-ads-api";

let adsClient: GoogleAdsApi | null = null;

function getAdsClient(): GoogleAdsApi {
  if (!adsClient) {
    adsClient = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    });
  }
  return adsClient;
}

function getCustomer() {
  return getAdsClient().Customer({
    customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID!,
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
    login_customer_id: process.env.GOOGLE_ADS_MCC_ID,
  });
}

// ─── Campaign Performance ─────────────────────────────────────────────────────

export async function fetchCampaignPerformance(dateRange: { from: string; to: string }) {
  const customer = getCustomer();

  const campaigns = await customer.query(`
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.conversions,
      metrics.cost_per_conversion,
      metrics.average_cpc,
      segments.date
    FROM campaign
    WHERE segments.date BETWEEN '${dateRange.from}' AND '${dateRange.to}'
      AND campaign.status != 'REMOVED'
    ORDER BY metrics.cost_micros DESC
  `);

  return campaigns.map((row: Record<string, unknown>) => {
    const campaign = row.campaign as Record<string, unknown>;
    const metrics = row.metrics as Record<string, unknown>;
    const spend = Number(metrics.cost_micros as number) / 1_000_000;
    const conversions = Number(metrics.conversions);
    return {
      campaign_id: String(campaign.id),
      campaign_name: String(campaign.name),
      status: String(campaign.status),
      spend: Math.round(spend * 100) / 100,
      impressions: Number(metrics.impressions),
      clicks: Number(metrics.clicks),
      ctr: Math.round(Number(metrics.ctr) * 10000) / 100,
      conversions,
      cpl: conversions > 0 ? Math.round((spend / conversions) * 100) / 100 : 0,
      avg_cpc: Math.round(Number(metrics.average_cpc as number) / 1_000_000 * 100) / 100,
    };
  });
}

// ─── Search Terms Report ──────────────────────────────────────────────────────

export async function fetchSearchTerms(dateRange: { from: string; to: string }) {
  const customer = getCustomer();

  const terms = await customer.query(`
    SELECT
      search_term_view.search_term,
      metrics.clicks,
      metrics.impressions,
      metrics.conversions,
      metrics.cost_micros,
      metrics.ctr
    FROM search_term_view
    WHERE segments.date BETWEEN '${dateRange.from}' AND '${dateRange.to}'
      AND metrics.clicks > 0
    ORDER BY metrics.clicks DESC
    LIMIT 20
  `);

  return terms.map((row: Record<string, unknown>) => {
    const view = row.search_term_view as Record<string, unknown>;
    const metrics = row.metrics as Record<string, unknown>;
    return {
      term: String(view.search_term),
      clicks: Number(metrics.clicks),
      impressions: Number(metrics.impressions),
      conversions: Number(metrics.conversions),
      cost: Math.round(Number(metrics.cost_micros as number) / 1_000_000 * 100) / 100,
      ctr: Math.round(Number(metrics.ctr) * 10000) / 100,
    };
  });
}

// ─── Ad Copy Performance ──────────────────────────────────────────────────────

export async function fetchAdPerformance(dateRange: { from: string; to: string }) {
  const customer = getCustomer();

  const ads = await customer.query(`
    SELECT
      ad_group_ad.ad.responsive_search_ad.headlines,
      ad_group_ad.ad.responsive_search_ad.descriptions,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.conversions,
      ad_group_ad.status
    FROM ad_group_ad
    WHERE segments.date BETWEEN '${dateRange.from}' AND '${dateRange.to}'
      AND ad_group_ad.status != 'REMOVED'
      AND metrics.impressions > 0
    ORDER BY metrics.ctr DESC
    LIMIT 10
  `);

  return ads.map((row: Record<string, unknown>) => {
    const adGroupAd = row.ad_group_ad as Record<string, unknown>;
    const ad = adGroupAd.ad as Record<string, unknown>;
    const rsa = ad.responsive_search_ad as Record<string, { text: string }[]> | undefined;
    const metrics = row.metrics as Record<string, unknown>;
    const headlines = rsa?.headlines?.map((h) => h.text).filter(Boolean).join(" | ") ?? "—";
    const description = rsa?.descriptions?.[0]?.text ?? "—";
    return {
      headline: headlines,
      description,
      impressions: Number(metrics.impressions),
      clicks: Number(metrics.clicks),
      ctr: Math.round(Number(metrics.ctr) * 10000) / 100,
      conversions: Number(metrics.conversions),
    };
  });
}

// ─── Keyword Performance ──────────────────────────────────────────────────────

export async function fetchKeywords(dateRange: { from: string; to: string }) {
  const customer = getCustomer();

  const keywords = await customer.query(`
    SELECT
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      ad_group_criterion.status,
      ad_group.name,
      campaign.name,
      metrics.clicks,
      metrics.impressions,
      metrics.ctr,
      metrics.average_cpc,
      metrics.conversions,
      metrics.quality_score
    FROM keyword_view
    WHERE segments.date BETWEEN '${dateRange.from}' AND '${dateRange.to}'
      AND ad_group_criterion.status != 'REMOVED'
      AND campaign.status = 'ENABLED'
    ORDER BY metrics.clicks DESC
    LIMIT 50
  `);

  return keywords.map((row: Record<string, unknown>) => {
    const criterion = row.ad_group_criterion as Record<string, unknown>;
    const keyword = criterion.keyword as Record<string, unknown>;
    const metrics = row.metrics as Record<string, unknown>;
    const campaign = row.campaign as Record<string, unknown>;
    return {
      text: String(keyword.text),
      match_type: String(keyword.match_type),
      status: String(criterion.status),
      campaign: String(campaign.name),
      clicks: Number(metrics.clicks),
      impressions: Number(metrics.impressions),
      ctr: Math.round(Number(metrics.ctr) * 10000) / 100,
      avg_cpc: Math.round(Number(metrics.average_cpc as number) / 1_000_000 * 100) / 100,
      conversions: Number(metrics.conversions),
      quality_score: Number(metrics.quality_score) || null,
    };
  });
}

// ─── Add Keyword ──────────────────────────────────────────────────────────────

export async function addKeyword(adGroupId: string, keywordText: string, matchType: "BROAD" | "PHRASE" | "EXACT") {
  const customer = getCustomer();
  await customer.adGroupCriteria.create([
    {
      ad_group: `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/adGroups/${adGroupId}`,
      keyword: { text: keywordText, match_type: enums.KeywordMatchType[matchType] },
      status: enums.AdGroupCriterionStatus.ENABLED,
    },
  ]);
}

// ─── Add Negative Keyword ─────────────────────────────────────────────────────

export async function addNegativeKeyword(campaignId: string, keywordText: string) {
  const customer = getCustomer();
  await customer.campaignCriteria.create([
    {
      campaign: `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/campaigns/${campaignId}`,
      keyword: { text: keywordText, match_type: enums.KeywordMatchType.BROAD },
      negative: true,
    },
  ]);
}

// ─── Create Responsive Search Ad ─────────────────────────────────────────────

export async function createResponsiveSearchAd(params: {
  adGroupId: string;
  headlines: string[];
  descriptions: string[];
  finalUrl: string;
}) {
  const customer = getCustomer();
  await customer.adGroupAds.create([
    {
      ad_group: `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/adGroups/${params.adGroupId}`,
      status: enums.AdGroupAdStatus.PAUSED,
      ad: {
        final_urls: [params.finalUrl],
        responsive_search_ad: {
          headlines: params.headlines.map((text) => ({ text })),
          descriptions: params.descriptions.map((text) => ({ text })),
        },
      },
    },
  ]);
}

// ─── Pause / Enable Campaign ──────────────────────────────────────────────────

export async function setCampaignStatus(campaignId: string, status: "ENABLED" | "PAUSED") {
  const customer = getCustomer();
  await customer.campaigns.update([
    {
      resource_name: `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/campaigns/${campaignId}`,
      status: enums.CampaignStatus[status],
    },
  ]);
}

// ─── Hourly + Day-of-Week Performance ────────────────────────────────────────

export async function fetchHourlyPerformance(dateRange: { from: string; to: string }) {
  const customer = getCustomer();

  const rows = await customer.query(`
    SELECT
      segments.hour,
      segments.day_of_week,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      metrics.cost_micros
    FROM campaign
    WHERE segments.date BETWEEN '${dateRange.from}' AND '${dateRange.to}'
    ORDER BY segments.day_of_week, segments.hour
  `);

  return rows.map((row: Record<string, unknown>) => {
    const segments = row.segments as Record<string, unknown>;
    const metrics = row.metrics as Record<string, unknown>;
    return {
      hour: Number(segments.hour),
      day: String(segments.day_of_week),
      impressions: Number(metrics.impressions),
      clicks: Number(metrics.clicks),
      conversions: Number(metrics.conversions),
      spend: Math.round(Number(metrics.cost_micros as number) / 1_000_000 * 100) / 100,
    };
  });
}
