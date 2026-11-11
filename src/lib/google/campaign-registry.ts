// Google Ads campaign registry: the one place the dashboard turns campaign IDs,
// utm_campaign codes and utm_adgroup IDs into readable names. Budgets and live
// status still come from the synced GA – Campaigns table; the values here are
// labels plus the plan of record, used where no synced value exists.
//
// The Airtable Leads formulas "Ad Campaign" and "Ad Group" use the same mapping;
// change both together.

export const GOOGLE_ADS_ACCOUNT_ID = "7080113749";

export type AdGroupEntry = { id: string; name: string };

export type CampaignEntry = {
  /** Short code staff use: "CS3". Also the Calls table Source for this campaign. */
  code: string;
  id: string;
  /** Exact Google Ads campaign name. */
  name: string;
  /** Readable label shown in the Leads view, same as the Airtable "Ad Campaign" formula. */
  label: string;
  /** utm_campaign value set by the campaign's final URL suffix, if any. */
  utmCampaign: string | null;
  /** Planned daily budget in USD (null when Google Ads has none). */
  dailyBudget: number | null;
  /** "ended" campaigns stay in history but are left out of active pickers and filters. */
  lifecycle: "active" | "ended";
  landingPages: string[];
  adGroups: AdGroupEntry[];
};

export const CAMPAIGNS: readonly CampaignEntry[] = [
  {
    code: "CS2",
    id: "24134330302",
    name: "CS2 | Medical Weight Loss | Sarasota",
    label: "CS2 Weight Loss",
    utmCampaign: "cs2_weight_loss",
    dailyBudget: 5,
    lifecycle: "active",
    landingPages: ["/landing/medical-weight-loss"],
    adGroups: [{ id: "194482691170", name: "Medical Weight Loss | Sarasota" }],
  },
  {
    code: "CS3",
    id: "24452301491",
    name: "CS3 | Hormone Optimization | Sarasota",
    label: "CS3 Hormone Optimization",
    utmCampaign: "cs3_hormone",
    dailyBudget: 13,
    lifecycle: "active",
    landingPages: ["/landing/hormone-optimization", "/landing/hormone-optimization?focus=menopause"],
    adGroups: [
      { id: "205771059487", name: "Hormone Therapy" },
      { id: "208834347024", name: "Menopause & Symptoms" },
    ],
  },
  {
    code: "CS4",
    id: "24452305673",
    name: "CS4 | Aesthetics & Memberships | Sarasota",
    label: "CS4 Aesthetics & Memberships",
    utmCampaign: "cs4_aesthetics",
    dailyBudget: 11,
    lifecycle: "active",
    landingPages: ["/landing/memberships", "/landing/advanced-skin-and-wellness-treatments"],
    adGroups: [
      { id: "205117858714", name: "Membership & Filler" },
      { id: "202132713276", name: "RF Microneedling + CO2" },
      { id: "204939880071", name: "Med Spa Sarasota" },
    ],
  },
  {
    code: "CS5",
    id: "24447046761",
    name: "CS5 | Brand | Sarasota",
    label: "CS5 Brand",
    utmCampaign: "cs5_brand",
    dailyBudget: 3,
    lifecycle: "active",
    landingPages: ["/"],
    adGroups: [{ id: "205117916634", name: "Brand" }],
  },
  {
    code: "Website",
    id: "24080482948",
    name: "Website new",
    label: "Website new",
    utmCampaign: null,
    dailyBudget: null,
    lifecycle: "ended", // custom period ended Aug 31, 2026
    landingPages: [],
    adGroups: [],
  },
];

export const ACTIVE_CAMPAIGNS = CAMPAIGNS.filter((campaign) => campaign.lifecycle === "active");

export function campaignById(id: string | null | undefined) {
  const key = String(id ?? "").trim();
  return CAMPAIGNS.find((campaign) => campaign.id === key) ?? null;
}

export function campaignByUtm(utmCampaign: string | null | undefined) {
  const key = String(utmCampaign ?? "").trim().toLowerCase();
  return key ? CAMPAIGNS.find((campaign) => campaign.utmCampaign === key) ?? null : null;
}

/** Readable campaign for a lead's UTM Campaign; unknown values come back unchanged. */
export function adCampaignLabel(utmCampaign: string | null | undefined) {
  return campaignByUtm(utmCampaign)?.label ?? String(utmCampaign ?? "").trim();
}

/** Readable ad group for a lead's UTM Ad Group ID; unknown values come back unchanged. */
export function adGroupLabel(utmAdGroup: string | null | undefined) {
  const key = String(utmAdGroup ?? "").trim();
  for (const campaign of CAMPAIGNS) {
    const group = campaign.adGroups.find((candidate) => candidate.id === key);
    if (group) return group.name;
  }
  return key;
}

/**
 * Calls rows carry the short code ("CS2") when the import knew the campaign and the
 * full Google Ads name ("CS3 | Hormone Optimization | Sarasota") otherwise. Both
 * collapse to the code so one campaign is one group in the Calls view.
 */
export function canonicalCallSource(source: string) {
  const value = source.trim();
  const match = CAMPAIGNS.find(
    (campaign) => campaign.code.toLowerCase() === value.toLowerCase() || campaign.name.toLowerCase() === value.toLowerCase(),
  );
  return match ? match.code : value;
}
