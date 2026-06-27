import DashboardLayout from "@/components/layout/DashboardLayout";
import GoogleAdsAnalyticsClient from "./GoogleAdsAnalyticsClient";

export default function GoogleAdsAnalyticsPage() {
  return (
    <DashboardLayout
      title="Google Ads Analytics"
      subtitle="Campaign performance, creative insights, and keyword analysis"
    >
      <GoogleAdsAnalyticsClient />
    </DashboardLayout>
  );
}
