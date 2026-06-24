import { GoogleAdsApi, enums } from "google-ads-api";

let _client: GoogleAdsApi | null = null;

function getClient(): GoogleAdsApi {
  if (!_client) {
    _client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    });
  }
  return _client;
}

function customer() {
  return getClient().Customer({
    customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID!,
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
    login_customer_id: process.env.GOOGLE_ADS_MCC_ID,
  });
}

// Cast a query row to a plain object for safe property access
function row(r: unknown): Record<string, Record<string, unknown>> {
  return r as Record<string, Record<string, unknown>>;
}

function microsToDollars(micros: unknown): number {
  return Math.round(Number(micros) / 1_000_000 * 100) / 100;
}

// ─── Campaign Performance ─────────────────────────────────────────────────────

export async function fetchCampaignPerformance(from: string, to: string) {
  const rows = await customer().query(`
    SELECT
      campaign.id, campaign.name, campaign.status,
      metrics.cost_micros, metrics.impressions, metrics.clicks,
      metrics.ctr, metrics.conversions, metrics.cost_per_conversion
    FROM campaign
    WHERE segments.date BETWEEN '${from}' AND '${to}'
      AND campaign.status != 'REMOVED'
    ORDER BY metrics.cost_micros DESC
  `);

  return rows.map((r) => {
    const { campaign: c, metrics: m } = row(r);
    const spend = microsToDollars(m.cost_micros);
    const conv = Number(m.conversions);
    return {
      campaign_id: String(c.id),
      campaign_name: String(c.name),
      status: String(c.status),
      spend,
      impressions: Number(m.impressions),
      clicks: Number(m.clicks),
      ctr: Math.round(Number(m.ctr) * 10000) / 100,
      conversions: conv,
      cpl: conv > 0 ? Math.round((spend / conv) * 100) / 100 : 0,
    };
  });
}

// ─── Search Terms ─────────────────────────────────────────────────────────────

export async function fetchSearchTerms(from: string, to: string) {
  const rows = await customer().query(`
    SELECT
      search_term_view.search_term,
      metrics.clicks, metrics.impressions, metrics.conversions,
      metrics.cost_micros, metrics.ctr
    FROM search_term_view
    WHERE segments.date BETWEEN '${from}' AND '${to}'
      AND metrics.clicks > 0
    ORDER BY metrics.clicks DESC
    LIMIT 20
  `);

  return rows.map((r) => {
    const { search_term_view: v, metrics: m } = row(r);
    return {
      term: String(v.search_term),
      clicks: Number(m.clicks),
      impressions: Number(m.impressions),
      conversions: Number(m.conversions),
      cost: microsToDollars(m.cost_micros),
      ctr: Math.round(Number(m.ctr) * 10000) / 100,
    };
  });
}

// ─── Ad Copy Performance ──────────────────────────────────────────────────────

export async function fetchAdPerformance(from: string, to: string) {
  const rows = await customer().query(`
    SELECT
      ad_group_ad.ad.responsive_search_ad.headlines,
      ad_group_ad.ad.responsive_search_ad.descriptions,
      metrics.impressions, metrics.clicks, metrics.ctr, metrics.conversions
    FROM ad_group_ad
    WHERE segments.date BETWEEN '${from}' AND '${to}'
      AND ad_group_ad.status != 'REMOVED'
      AND metrics.impressions > 0
    ORDER BY metrics.ctr DESC
    LIMIT 10
  `);

  return rows.map((r) => {
    const { ad_group_ad: aga, metrics: m } = row(r);
    const ad = aga.ad as Record<string, unknown> | undefined;
    const rsa = ad?.responsive_search_ad as Record<string, { text: string }[]> | undefined;
    return {
      headline: rsa?.headlines?.map((h) => h.text).filter(Boolean).join(" | ") ?? "—",
      description: rsa?.descriptions?.[0]?.text ?? "—",
      impressions: Number(m.impressions),
      clicks: Number(m.clicks),
      ctr: Math.round(Number(m.ctr) * 10000) / 100,
      conversions: Number(m.conversions),
    };
  });
}

// ─── Keywords ─────────────────────────────────────────────────────────────────

export async function fetchKeywords(from: string, to: string) {
  const rows = await customer().query(`
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
    const { ad_group_criterion: agc, campaign: c, metrics: m } = row(r);
    const kw = agc.keyword as Record<string, unknown> | undefined;
    return {
      text: String(kw?.text ?? ""),
      match_type: String(kw?.match_type ?? ""),
      status: String(agc.status),
      campaign: String(c.name),
      clicks: Number(m.clicks),
      impressions: Number(m.impressions),
      ctr: Math.round(Number(m.ctr) * 10000) / 100,
      avg_cpc: microsToDollars(m.average_cpc),
      conversions: Number(m.conversions),
    };
  });
}

// ─── Hourly Performance ───────────────────────────────────────────────────────

export async function fetchHourlyPerformance(from: string, to: string) {
  const rows = await customer().query(`
    SELECT
      segments.hour, segments.day_of_week,
      metrics.impressions, metrics.clicks,
      metrics.conversions, metrics.cost_micros
    FROM campaign
    WHERE segments.date BETWEEN '${from}' AND '${to}'
    ORDER BY segments.day_of_week, segments.hour
  `);

  return rows.map((r) => {
    const { segments: s, metrics: m } = row(r);
    return {
      hour: Number(s.hour),
      day: String(s.day_of_week),
      impressions: Number(m.impressions),
      clicks: Number(m.clicks),
      conversions: Number(m.conversions),
      spend: microsToDollars(m.cost_micros),
    };
  });
}

// ─── Keyword Actions ──────────────────────────────────────────────────────────

export async function addKeyword(
  adGroupId: string,
  text: string,
  matchType: "BROAD" | "PHRASE" | "EXACT"
) {
  await customer().adGroupCriteria.create([{
    ad_group: `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/adGroups/${adGroupId}`,
    keyword: { text, match_type: enums.KeywordMatchType[matchType] },
    status: enums.AdGroupCriterionStatus.ENABLED,
  }]);
}

export async function addNegativeKeyword(campaignId: string, text: string) {
  await customer().campaignCriteria.create([{
    campaign: `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/campaigns/${campaignId}`,
    keyword: { text, match_type: enums.KeywordMatchType.BROAD },
    negative: true,
  }]);
}

// ─── Ad Creation ──────────────────────────────────────────────────────────────

export async function createResponsiveSearchAd(params: {
  adGroupId: string;
  headlines: string[];
  descriptions: string[];
  finalUrl: string;
}) {
  await customer().adGroupAds.create([{
    ad_group: `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/adGroups/${params.adGroupId}`,
    status: enums.AdGroupAdStatus.PAUSED,
    ad: {
      final_urls: [params.finalUrl],
      responsive_search_ad: {
        headlines: params.headlines.map((text) => ({ text })),
        descriptions: params.descriptions.map((text) => ({ text })),
      },
    },
  }]);
}

// ─── Campaign Control ─────────────────────────────────────────────────────────

export async function setCampaignStatus(
  campaignId: string,
  status: "ENABLED" | "PAUSED"
) {
  await customer().campaigns.update([{
    resource_name: `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/campaigns/${campaignId}`,
    status: enums.CampaignStatus[status],
  }]);
}
