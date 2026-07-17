import DashboardLayout from "@/components/layout/DashboardLayout";
import GoogleAdsAnalyticsClient from "./GoogleAdsAnalyticsClient";
import { requirePageAuth } from "@/lib/auth/require-page-auth";

export default async function GoogleAdsAnalyticsPage() {
  await requirePageAuth({ next: "/google-ads-analytics" });
  return (
    <DashboardLayout
      title="Google Ads Analytics"
      subtitle="Campaign performance, creative insights, and keyword analysis"
    >
      <GoogleAdsAnalyticsClient />
    </DashboardLayout>
  );
}
