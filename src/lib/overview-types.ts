export type OverviewPeriodKey = "7d" | "30d" | "90d" | "month";

export type OverviewMetric = {
  value: number | null;
  previousValue?: number | null;
  changePercent?: number | null;
};

export type OverviewSectionKey =
  | "leads"
  | "campaigns"
  | "delivery"
  | "clinic"
  | "googleAds"
  | "activity";

export type LeadFunnelStage = {
  key: "new" | "contacted" | "replied" | "booked";
  label: string;
  count: number;
  percentOfFirst: number;
  conversionFromPrevious: number | null;
  dropOffFromPrevious: number | null;
};

export type LeadTrendPoint = {
  date: string;
  label: string;
  leads: number;
  contacted: number;
  replied: number;
  booked: number;
};

export type LeadSourcePerformance = {
  source: string;
  leads: number;
  share: number;
  replied: number;
  booked: number;
  conversionRate: number;
};

export type CampaignHealth = {
  slug: "speed-to-lead" | "14-day-nurture";
  name: string;
  status: "Active" | "Healthy" | "Needs attention" | "Paused" | "Stopped";
  activeLeads: number;
  leadsProcessed: number;
  smsSent: number;
  emailsSent: number;
  messagesSent: number;
  deliverySuccessRate: number | null;
  failedMessages: number;
  replies: number;
  booked: number;
  averageFirstContactSeconds: number | null;
  nextDueAt: string | null;
  lastActivityAt: string | null;
};

export type NurtureJourneyStep = {
  key: string;
  step: string;
  reached: number;
  active: number;
  stopped: number;
  percentage: number;
};

export type DeliveryChannelHealth = {
  channel: "SMS" | "Email";
  sent: number;
  successful: number;
  failed: number;
  pending: number;
  unknown: number;
  successRate: number | null;
};

export type DeliveryTrendPoint = {
  date: string;
  label: string;
  smsSuccessful: number;
  smsFailed: number;
  emailSuccessful: number;
  emailFailed: number;
};

export type ClinicMetric = {
  id: string;
  month: string;
  totalVisits: number;
  newPatients: number;
  updatedAt: string | null;
};

export type GoogleAdsDailyPoint = {
  date: string;
  label: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  leads: number;
};

export type GoogleAdsSummary = {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number | null;
  averageCpc: number | null;
  conversions: number;
  costPerConversion: number | null;
  attributedLeads: number;
  costPerLead: number | null;
  roas: number | null;
  topCampaign: string | null;
  topCreative: string | null;
  attentionMessage: string | null;
  latestSyncAt: string | null;
  daily: GoogleAdsDailyPoint[];
};

export type ActivityDay = {
  date: string;
  label: string;
  count: number;
};

export type AttentionItem = {
  id: string;
  severity: "warning" | "critical";
  title: string;
  detail: string;
  count: number;
  actionLabel: string;
  href: string;
};

export type RecentActivityItem = {
  id: string;
  category: "lead" | "campaign" | "message" | "clinic" | "audit";
  title: string;
  actor: string;
  resource: string | null;
  occurredAt: string;
  href: string | null;
};

export type OverviewResponse = {
  period: {
    key: OverviewPeriodKey;
    label: string;
    from: string;
    to: string;
    previousLabel: string;
    timezone: "America/New_York";
  };
  updatedAt: string | null;
  errors: Partial<Record<OverviewSectionKey, string>>;
  availability: Record<OverviewSectionKey, boolean>;
  leadSummary: {
    total: OverviewMetric;
    contacted: OverviewMetric;
    replied: OverviewMetric;
    booked: OverviewMetric;
    bookingRate: OverviewMetric;
    averageSpeedSeconds: OverviewMetric;
  };
  leadFunnel: LeadFunnelStage[];
  leadTrend: LeadTrendPoint[];
  sourcePerformance: LeadSourcePerformance[];
  campaignHealth: CampaignHealth[];
  nurtureJourney: NurtureJourneyStep[];
  deliveryHealth: {
    channels: DeliveryChannelHealth[];
    totalMessages: number;
    successful: number;
    failed: number;
    pending: number;
    unknown: number;
    successRate: number | null;
    trend: DeliveryTrendPoint[];
  };
  clinicMetrics: ClinicMetric[];
  googleAdsSummary: GoogleAdsSummary | null;
  activityByDay: ActivityDay[];
  attentionItems: AttentionItem[];
  recentActivity: RecentActivityItem[];
  canViewAuditLog: boolean;
};
