import { Suspense } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { requirePageAuth } from "@/lib/auth/require-page-auth";
import WebsiteAnalyticsClient from "./WebsiteAnalyticsClient";

export const dynamic = "force-dynamic";

export default async function WebsiteAnalyticsPage() {
  await requirePageAuth({ next: "/website-analytics" });
  return (
    <DashboardLayout
      title="Website Analytics"
      subtitle="GA4 traffic, engagement, acquisition, pages, devices, and lead activity"
    >
      <Suspense>
        <WebsiteAnalyticsClient />
      </Suspense>
    </DashboardLayout>
  );
}
