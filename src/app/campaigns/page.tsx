import { Suspense } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CampaignsClient, { CampaignsSkeleton } from "./CampaignsClient";
import { requirePageAuth } from "@/lib/auth/require-page-auth";
import { isAirtableConfigured } from "@/lib/airtable/config";
import { emptyCampaignsOverview, loadCampaignsOverview } from "@/lib/campaigns/overview";

/** Loads the summaries on the server (from the shared stale-while-revalidate cache) and streams them in. */
async function CampaignsData() {
  const overview = isAirtableConfigured() ? await loadCampaignsOverview() : emptyCampaignsOverview();
  return <CampaignsClient initial={overview} />;
}

export default async function CampaignsPage() {
  await requirePageAuth({ next: "/campaigns" });
  return (
    <DashboardLayout title="Campaigns" subtitle="Manage automated lead follow-up, performance, and enrollment.">
      <Suspense fallback={<CampaignsSkeleton />}>
        <CampaignsData />
      </Suspense>
    </DashboardLayout>
  );
}
