import DashboardLayout from "@/components/layout/DashboardLayout";
import { requirePageAuth } from "@/lib/auth/require-page-auth";
import GoogleAdsAnalyticsClient from "./GoogleAdsAnalyticsClient";
import type { WorkspaceTab } from "./components/GoogleAdsWorkspace";

const META: Record<WorkspaceTab, { title: string; subtitle: string }> = {
  overview: {
    title: "Google Ads Workspace",
    subtitle: "Relational performance, policy, publishing, and sync operations",
  },
  campaigns: {
    title: "Google Ads Campaigns",
    subtitle:
      "Unique campaign inventory with range performance and child relationships",
  },
  "ad-groups": {
    title: "Google Ads Ad Groups",
    subtitle: "Unique ad groups joined to campaigns, ads, and keyword criteria",
  },
  ads: {
    title: "Google Ads & Creatives",
    subtitle:
      "One row per canonical ad resource with creative and policy status",
  },
  keywords: {
    title: "Google Ads Keywords",
    subtitle: "Unique keyword criteria grouped by campaign and ad group",
  },
  workflow: {
    title: "Google Ads Publishing",
    subtitle:
      "Review, publish, verification, failure, and duplicate operations",
  },
  "ai-suggestions": {
    title: "Google Ads AI Suggestions",
    subtitle: "Data-backed optimization ideas for campaigns, ads, and keywords",
  },
};

export default async function WorkspacePage({ tab }: { tab: WorkspaceTab }) {
  await requirePageAuth({ next: TAB_PATHS[tab] });
  return (
    <DashboardLayout title={META[tab].title} subtitle={META[tab].subtitle}>
      <GoogleAdsAnalyticsClient routeTab={tab} />
    </DashboardLayout>
  );
}

const TAB_PATHS: Record<WorkspaceTab, string> = {
  overview: "/google-ads-analytics",
  campaigns: "/google-ads-analytics/campaigns",
  "ad-groups": "/google-ads-analytics/ad-groups",
  ads: "/google-ads-analytics/ads",
  keywords: "/google-ads-analytics/keywords",
  workflow: "/google-ads-analytics/publishing",
  "ai-suggestions": "/google-ads-analytics/ai-suggestions",
};
