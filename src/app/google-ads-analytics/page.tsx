import DashboardLayout from "@/components/layout/DashboardLayout";
import GoogleAdsAnalyticsClient from "./GoogleAdsAnalyticsClient";
import { requirePageAuth } from "@/lib/auth/require-page-auth";

export default async function GoogleAdsAnalyticsPage() {
  await requirePageAuth({ next: "/google-ads-analytics" });
  return (
    <DashboardLayout
      title="Google Ads Workspace"
      subtitle="Relational performance, policy, publishing, and sync operations"
    >
      <GoogleAdsAnalyticsClient />
    </DashboardLayout>
  );
}
