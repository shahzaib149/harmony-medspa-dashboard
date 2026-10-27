export type Campaign = {
  id: string;
  accountName: string;
  campaignId: string;
  resourceName?: string;
  campaignName: string;
  campaignStatus: string;
  channelType: string;
  budget?: number;
  budgetResourceName?: string;
  cost: number;
  clicks: number;
  impressions: number;
  ctrPct: number;
  avgCpc?: number;
  conversions: number;
  cpa?: number;
  conversionValue: number;
  conversionValueAvailable?: boolean;
  roas: number;
  optimizationScore: number;
  impressionShare: number;
  impressionShareLostBudget: number;
  impressionShareLostRank: number;
  startDate?: string;
  endDate?: string;
  biddingStrategy?: string;
  pulledAt: string;
};

export type AdGroup = {
  id: string;
  accountName?: string;
  campaignId: string;
  campaignResourceName?: string;
  campaignName: string;
  adGroupId: string;
  resourceName?: string;
  adGroupName: string;
  adGroupStatus: string;
  adGroupType?: string;
  cost: number;
  clicks: number;
  impressions: number;
  ctrPct: number;
  avgCpc?: number;
  conversions: number;
  cpa?: number;
  conversionValue: number;
  conversionValueAvailable?: boolean;
  roas: number;
  pulledAt?: string;
};

export type Creative = {
  id: string;
  adId: string;
  resourceName?: string;
  adGroupAdResourceName?: string;
  adName: string;
  adType: string;
  campaignId: string;
  campaignResourceName?: string;
  campaignName: string;
  adGroupId?: string;
  adGroupResourceName?: string;
  adGroupName: string;
  status?: string;
  primaryStatus?: string;
  primaryStatusReasons?: string[];
  approvalStatus?: string;
  reviewStatus?: string;
  policyTopics?: string[];
  strength?: string;
  cost: number;
  clicks: number;
  impressions: number;
  ctrPct: number;
  avgCpc?: number;
  conversions: number;
  cpa?: number;
  conversionValue: number;
  conversionValueAvailable?: boolean;
  roas: number;
  date: string;
  createdAt?: string;
  lastSynced?: string;
  publishSource?: string;
  creativeTagSuggestions: string;
  headlines: string;
  descriptions: string;
  headlineAssets?: Array<{ text: string; pinnedField?: string }>;
  descriptionAssets?: Array<{ text: string; pinnedField?: string }>;
  finalUrl: string;
  finalUrls?: string[];
  displayUrl: string;
  path1: string;
  path2: string;
};

export type Keyword = {
  id: string;
  criterionId?: string;
  resourceName?: string;
  keywordText: string;
  matchType: string;
  status?: string;
  negative?: boolean;
  campaignId: string;
  campaignResourceName?: string;
  campaignName: string;
  adGroupId?: string;
  adGroupResourceName?: string;
  adGroupName: string;
  cost: number;
  clicks: number;
  impressions: number;
  ctrPct: number;
  avgCpc?: number;
  conversions: number;
  cpa?: number;
  conversionValue: number;
  conversionValueAvailable?: boolean;
  roas: number;
  qualityScore?: number;
  creativeQuality?: string;
  landingPageQuality?: string;
  searchImpressionShare?: number;
  pulledAt?: string;
};

export type SearchTerm = {
  id: string;
  resourceName?: string;
  term: string;
  status?: string;
  matchedKeyword?: string;
  matchType?: string;
  campaignId: string;
  campaignName: string;
  adGroupId: string;
  adGroupName: string;
  cost: number;
  clicks: number;
  impressions: number;
  ctrPct: number;
  avgCpc?: number;
  conversions: number;
  conversionValue?: number;
  cpa?: number;
};

export type ConversionActionRow = {
  id: string;
  actionId: string;
  actionName: string;
  category: string;
  campaignId: string;
  campaignName: string;
  conversions: number;
  conversionValue: number;
  allConversions: number;
  allConversionValue: number;
};

/** Summed metrics plus ratios derived from the sums. */
export type WorkspaceTotals = {
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  conversionValue: number;
  allConversions: number;
  ctrPct: number;
  avgCpc: number;
  cpa: number;
  conversionRatePct: number;
  roas: number;
};

export type DailyPoint = WorkspaceTotals & { date: string };

export type SyncReport = {
  report: string;
  dateFrom: string;
  dateTo: string;
  rows: number;
  ranAt: string;
};

export type WorkspaceSync = {
  /** Most recent Make run of any report. */
  lastRunAt: string | null;
  /** Latest reporting day covered by the campaign report (the dashboard's "data through"). */
  dataThrough: string | null;
  reports: SyncReport[];
};

export type GoogleAsset = {
  id: string;
  assetId: string;
  resourceName?: string;
  name: string;
  type: string;
  source?: string;
  approvalStatus?: string;
  reviewStatus?: string;
};

export type WorkspaceSnapshot = {
  source: "live" | "airtable";
  accountName: string;
  fetchedAt: string;
  dateRange?: { from: string; to: string };
  campaigns: Campaign[];
  adGroups: AdGroup[];
  ads: Creative[];
  keywords: Keyword[];
  searchTerms: SearchTerm[];
  assets: GoogleAsset[];
  totals?: {
    campaigns: number;
    adGroups: number;
    ads: number;
    keywords: number;
    searchTerms: number;
    assets: number;
  };
  pagination?: {
    entity: "ads";
    page: number;
    pageSize: 25 | 50 | 100;
    total: number;
  };
  /** Airtable snapshot extras: account totals, previous-period totals, daily trend. */
  summary?: { current: WorkspaceTotals; previous: WorkspaceTotals; previousRange: { from: string; to: string } };
  daily?: DailyPoint[];
  conversionActions?: ConversionActionRow[];
  sync?: WorkspaceSync;
};

export type SelectedEntity =
  | { kind: "campaign"; value: Campaign }
  | { kind: "ad-group"; value: AdGroup }
  | { kind: "ad"; value: Creative }
  | { kind: "keyword"; value: Keyword };
