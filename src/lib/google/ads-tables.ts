/**
 * Airtable tables filled by the Make "Google Ads …" report scenarios
 * (base appGumYdPTtL5GW6M). Each daily table has one row per entity per day,
 * upserted on "Unique Key", so re-running a date range never duplicates rows.
 * Env overrides let a table be renamed or swapped without a code change.
 */
export const ADS_TABLES = {
  campaign: process.env.AIRTABLE_GA_CAMPAIGN_TABLE || "tblplHxmCuThe6mkI",
  adGroup: process.env.AIRTABLE_GA_AD_GROUP_TABLE || "tblZJ0KHMynlf6mo7",
  ad: process.env.AIRTABLE_GA_AD_TABLE || "tblIQMUqqPpQA9d0S",
  keyword: process.env.AIRTABLE_GA_KEYWORD_TABLE || "tblnuBJA6cnZeDZ8g",
  searchTerm: process.env.AIRTABLE_GA_SEARCH_TERM_TABLE || "tblsFyKdKeL3m3Qzy",
  conversionAction:
    process.env.AIRTABLE_GA_CONVERSION_ACTION_TABLE || "tblMOrrofG25pih2u",
  syncLog: process.env.AIRTABLE_GA_SYNC_LOG_TABLE || "tblcBsY5RxEVdbT6I",
  // Structure tables: current state of every entity (no metrics), from Make "Google Ads Structure Sync".
  campaignStructure: process.env.AIRTABLE_GA_CAMPAIGNS_TABLE || "tblz9Zkj8A9HA3XXJ",
  adGroupStructure: process.env.AIRTABLE_GA_AD_GROUPS_TABLE || "tblICgPCH81Qj87zg",
  adStructure: process.env.AIRTABLE_GA_ADS_TABLE || "tblwsylvVlCV9XVIS",
  keywordStructure: process.env.AIRTABLE_GA_KEYWORDS_TABLE || "tbln5U3ZlUi6vL6EL",
  /** "Google Ad Preview": ad copy lookup (headlines/descriptions), not time-series. */
  adPreview: "tblsokwqKQuj3rFSB",
} as const;

export type AdsStructureTable = "campaignStructure" | "adGroupStructure" | "adStructure" | "keywordStructure";
export type AdsDailyTable = Exclude<keyof typeof ADS_TABLES, "syncLog" | "adPreview" | AdsStructureTable>;
