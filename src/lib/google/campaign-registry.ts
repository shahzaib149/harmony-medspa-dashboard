// Google Ads campaign registry: the one place the dashboard turns campaign IDs,
// utm_campaign codes and utm_adgroup IDs into readable names, and decides how calls
// are labelled. Budgets and live status still come from the synced GA – Campaigns
// table; the values here are the plan of record and the labels.
//
// Keep in step with:
// - Airtable Leads formulas "Ad Campaign" and "Ad Group" (same labels), and
// - the Make "Daily Call Import" scenario 6807651, module 2 (same Source / Line /
//   Call ID prefix per campaign ID; any other campaign → its name and prefix "gads").
//
// Structure as of 2026-11-17: CS6 "Local Med Spa & Facials" is the only active campaign
// ($200 total, Nov 18–30). CS2 "Harmony Main" and CS5 Brand are paused until Dec 1;
// CS3 and CS4 are paused (their ad groups kept for history as "(old CS3/CS4)");
// Website new ended Aug 31.

export const GOOGLE_ADS_ACCOUNT_ID = "7080113749";

export type AdGroupEntry = {
  id: string;
  /** Exact Google Ads ad group name. */
  name: string;
  /** Label shown in the dashboard; same as the Airtable "Ad Group" formula. */
  label: string;
  landingPage?: string;
};

export type CampaignLifecycle = "active" | "paused" | "ended";

export type CampaignEntry = {
  /** Short code staff use ("CS2"). Also the Calls table Source for this campaign. */
  code: string;
  id: string;
  /** Exact Google Ads campaign name. */
  name: string;
  /** Readable label, same as the Airtable "Ad Campaign" formula for the current code. */
  label: string;
  /** Every utm_campaign value that belongs to this campaign; the first is current. */
  utmCampaigns: string[];
  /** Planned daily budget in USD (null when the campaign has none). */
  dailyBudget: number | null;
  /** Campaign total budget in USD, for flight campaigns (null otherwise). */
  totalBudget?: number | null;
  /** Flight dates (inclusive, clinic time) when the campaign only runs for a set period. */
  flight?: { start: string; end: string };
  /**
   * false when the Make call import (6807651) has no explicit row for this campaign:
   * it then writes the campaign name as Source / Line and the "gads" prefix, so the
   * dashboard importer does the same. The Calls view still files these calls under the
   * campaign code by Campaign ID.
   */
  makeMapped?: boolean;
  /** "paused" and "ended" campaigns are left out of active pickers but keep their history. */
  lifecycle: CampaignLifecycle;
  /** Calls table Line and Call ID prefix written by the importers. */
  callLine: string;
  callPrefix: string;
  adGroups: AdGroupEntry[];
};

export const CAMPAIGNS: readonly CampaignEntry[] = [
  {
    code: "CS6",
    id: "24474577625",
    name: "CS6 | Local Med Spa & Facials | Sarasota",
    label: "CS6 Local Med Spa & Facials",
    utmCampaigns: ["cs6_local"],
    dailyBudget: null,
    totalBudget: 200,
    flight: { start: "2026-11-18", end: "2026-11-30" },
    lifecycle: "active",
    callLine: "CS6 Local Med Spa & Facials",
    callPrefix: "cs6",
    adGroups: [
      { id: "205276469754", name: "Med Spa Sarasota", label: "Med Spa Sarasota (CS6)", landingPage: "/landing/november-specials" },
      { id: "202287702956", name: "Facials & Glo2Facial", label: "Facials & Glo2Facial (CS6)", landingPage: "/glo2facials" },
    ],
  },
  {
    code: "CS2",
    id: "24134330302",
    name: "CS2 | Harmony Main | Sarasota",
    label: "CS2 Harmony Main",
    utmCampaigns: ["cs2_main", "cs2_weight_loss"],
    dailyBudget: 45,
    lifecycle: "paused", // paused 2026-11-17 until Dec 1 while CS6 runs
    callLine: "CS2",
    callPrefix: "cs2",
    adGroups: [
      { id: "194482691170", name: "Medical Weight Loss | Sarasota", label: "Medical Weight Loss | Sarasota", landingPage: "/landing/medical-weight-loss" },
      { id: "203567439833", name: "Hormone Therapy", label: "Hormone Therapy", landingPage: "/landing/hormone-optimization" },
      { id: "203567451553", name: "Menopause & Symptoms", label: "Menopause & Symptoms", landingPage: "/landing/hormone-optimization?focus=menopause" },
      { id: "202693470432", name: "Membership & Filler", label: "Membership & Filler", landingPage: "/landing/memberships" },
      { id: "201362020079", name: "RF Microneedling + CO2", label: "RF Microneedling + CO2", landingPage: "/landing/laser-skin" },
      { id: "202693487912", name: "Med Spa Sarasota", label: "Med Spa Sarasota", landingPage: "/landing/november-specials" },
    ],
  },
  {
    code: "CS5",
    id: "24447046761",
    name: "CS5 | Brand | Sarasota",
    label: "CS5 Brand",
    utmCampaigns: ["cs5_brand"],
    dailyBudget: 5,
    lifecycle: "paused", // paused 2026-11-17 until Dec 1 while CS6 runs
    callLine: "CS5 Brand",
    callPrefix: "cs5",
    adGroups: [{ id: "205117916634", name: "Brand", label: "Brand", landingPage: "/" }],
  },
  {
    code: "CS3",
    id: "24452301491",
    name: "CS3 | Hormone Optimization | Sarasota",
    label: "CS3 Hormone Optimization",
    utmCampaigns: ["cs3_hormone"],
    dailyBudget: null,
    lifecycle: "paused", // paused 2026-11-12; ad groups moved into CS2
    callLine: "CS3 Hormone",
    callPrefix: "cs3",
    adGroups: [
      { id: "205771059487", name: "Hormone Therapy", label: "Hormone Therapy (old CS3)" },
      { id: "208834347024", name: "Menopause & Symptoms", label: "Menopause & Symptoms (old CS3)" },
    ],
  },
  {
    code: "CS4",
    id: "24452305673",
    name: "CS4 | Aesthetics & Memberships | Sarasota",
    label: "CS4 Aesthetics & Memberships",
    utmCampaigns: ["cs4_aesthetics"],
    dailyBudget: null,
    lifecycle: "paused", // paused 2026-11-12; ad groups moved into CS2
    callLine: "CS4 Aesthetics",
    callPrefix: "cs4",
    adGroups: [
      { id: "205117858714", name: "Membership & Filler", label: "Membership & Filler (old CS4)" },
      { id: "202132713276", name: "RF Microneedling + CO2", label: "RF Microneedling + CO2 (old CS4)" },
      { id: "204939880071", name: "Med Spa Sarasota", label: "Med Spa Sarasota (old CS4)" },
    ],
  },
  {
    code: "Website",
    id: "24080482948",
    name: "Website new",
    label: "Website new",
    utmCampaigns: [],
    dailyBudget: null,
    lifecycle: "ended", // custom period ended Aug 31, 2026
    callLine: "Website new",
    callPrefix: "web",
    adGroups: [],
  },
];

export const ACTIVE_CAMPAIGNS = CAMPAIGNS.filter((campaign) => campaign.lifecycle === "active");
/** Campaigns that ever sent tracked leads (active first, then paused), for filters over history. */
export const LEAD_CAMPAIGNS = [...ACTIVE_CAMPAIGNS, ...CAMPAIGNS.filter((c) => c.lifecycle === "paused")].filter((c) => c.utmCampaigns.length);
/** Every utm_campaign code the registry knows, current and legacy. */
export const ALL_UTM_CAMPAIGNS = CAMPAIGNS.flatMap((campaign) => campaign.utmCampaigns);

/** Calls whose Google Ads campaign isn't in the registry land here, so none is ever hidden. */
export const OTHER_GOOGLE_ADS = "Other Google Ads";
export const UNKNOWN_CALL_PREFIX = "gads";

export function campaignById(id: string | null | undefined) {
  const key = String(id ?? "").trim();
  return key ? CAMPAIGNS.find((campaign) => campaign.id === key) ?? null : null;
}

export function campaignByCode(code: string | null | undefined) {
  const key = String(code ?? "").trim().toLowerCase();
  return key ? CAMPAIGNS.find((campaign) => campaign.code.toLowerCase() === key) ?? null : null;
}

export function campaignByUtm(utmCampaign: string | null | undefined) {
  const key = String(utmCampaign ?? "").trim().toLowerCase();
  return key ? CAMPAIGNS.find((campaign) => campaign.utmCampaigns.includes(key)) ?? null : null;
}

/** Readable campaign for a lead's UTM Campaign (cs2_main and cs2_weight_loss are both CS2). */
export function adCampaignLabel(utmCampaign: string | null | undefined) {
  return campaignByUtm(utmCampaign)?.label ?? String(utmCampaign ?? "").trim();
}

/** utm_campaign codes behind a filter value: a campaign code ("CS2") or a raw utm code. */
export function utmCampaignsFor(value: string) {
  const campaign = campaignByCode(value) ?? campaignByUtm(value);
  return campaign ? campaign.utmCampaigns : [value.trim().toLowerCase()];
}

/** Readable ad group for a lead's UTM Ad Group ID; unknown values come back unchanged. */
export function adGroupLabel(utmAdGroup: string | null | undefined) {
  const key = String(utmAdGroup ?? "").trim();
  for (const campaign of CAMPAIGNS) {
    const group = campaign.adGroups.find((candidate) => candidate.id === key);
    if (group) return group.label;
  }
  return key;
}

/** Calls importer mapping (dashboard /api/calls/sync), identical to the Make scenario. */
export function callLabelsForCampaign(campaignId: string, campaignName: string) {
  const campaign = campaignById(campaignId);
  if (campaign && campaign.makeMapped !== false) return { source: campaign.code, line: campaign.callLine, prefix: campaign.callPrefix };
  const name = campaignName.trim() || campaign?.name || `Campaign ${campaignId}`;
  return { source: name, line: name, prefix: UNKNOWN_CALL_PREFIX };
}

/**
 * Which Calls bucket a row belongs to. Campaign ID wins; rows without one (older imports
 * and hand-entered calls) fall back to Source, accepting either the code ("CS2") or the
 * full campaign name. Any other Google Ads call goes to "Other Google Ads"; a hand-entered
 * call with its own Source keeps that Source as its group.
 */
export function callBucket(input: { campaignId?: string | null; source?: string | null; googleAds?: boolean }) {
  const byId = campaignById(input.campaignId);
  if (byId) return { code: byId.code, line: byId.callLine };
  const source = String(input.source ?? "").trim();
  const bySource = CAMPAIGNS.find((c) => c.code.toLowerCase() === source.toLowerCase() || c.name.toLowerCase() === source.toLowerCase());
  if (bySource) return { code: bySource.code, line: bySource.callLine };
  if (String(input.campaignId ?? "").trim() || input.googleAds) return { code: OTHER_GOOGLE_ADS, line: source || OTHER_GOOGLE_ADS };
  return { code: source || "Other", line: source || "Other" };
}

/** Kept for callers that only have a Source string. */
export function canonicalCallSource(source: string) {
  return callBucket({ source }).code;
}

/** Calls filter label: "CS2 Harmony Main", "CS5 Brand", "CS3 Hormone (paused)", "Website new (ended)". */
export function callSourceLabel(code: string) {
  const campaign = campaignByCode(code);
  if (!campaign) return code;
  const base = campaign.code === "CS2" ? campaign.label : campaign.callLine;
  return campaign.lifecycle === "active" ? base : `${base} (${campaign.lifecycle})`;
}

/** Calls view order: active campaigns, paused, ended, then anything else. */
export const CALL_SOURCE_ORDER = [...ACTIVE_CAMPAIGNS, ...CAMPAIGNS.filter((c) => c.lifecycle === "paused"), ...CAMPAIGNS.filter((c) => c.lifecycle === "ended")].map((c) => c.code);
