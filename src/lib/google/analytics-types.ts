export type WebsiteAnalyticsSummary = {
  activeUsers: number;
  totalUsers: number;
  newUsers: number;
  sessions: number;
  engagedSessions: number;
  pageViews: number;
  engagementRate: number;
  bounceRate: number;
  averageEngagementSeconds: number;
  viewsPerSession: number;
  leads: number;
  leadRate: number;
};

export type WebsiteAnalyticsTrendPoint = {
  date: string;
  label: string;
  activeUsers: number;
  sessions: number;
  pageViews: number;
  leads: number;
};

export type WebsiteAnalyticsSource = {
  sourceMedium: string;
  campaign: string;
  channel: string;
  sessions: number;
  activeUsers: number;
  engagedSessions: number;
  engagementRate: number;
  leads: number;
  leadRate: number;
};

export type WebsiteAnalyticsPage = {
  hostName: string;
  path: string;
  title: string;
  pageViews: number;
  activeUsers: number;
  averageEngagementSeconds: number;
};

export type WebsiteAnalyticsDevice = {
  device: string;
  activeUsers: number;
  sessions: number;
  share: number;
};

export type WebsiteAnalyticsSite = {
  hostName: string;
  streamId: string;
  streamName: string;
  activeUsers: number;
  sessions: number;
  pageViews: number;
  share: number;
};

export type WebsiteAnalyticsSnapshot = {
  source: "ga4";
  fetchedAt: string;
  propertyId: string;
  days: number;
  selectedHostname: string | null;
  dateRange: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
  summary: WebsiteAnalyticsSummary;
  previousSummary: WebsiteAnalyticsSummary;
  trend: WebsiteAnalyticsTrendPoint[];
  sources: WebsiteAnalyticsSource[];
  pages: WebsiteAnalyticsPage[];
  devices: WebsiteAnalyticsDevice[];
  sites: WebsiteAnalyticsSite[];
};
