import DashboardLayout from "@/components/layout/DashboardLayout";
import GoogleAdsClient from "./GoogleAdsClient";

export default function GoogleAdsPage() {
  return (
    <DashboardLayout
      title="Google Ads Command"
      subtitle="Campaign performance, search terms, and AI recommendations"
    >
      <GoogleAdsClient />
    </DashboardLayout>
  );
}
