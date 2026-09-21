import DashboardLayout from "@/components/layout/DashboardLayout";
import { requirePageAuth } from "@/lib/auth/require-page-auth";
import { cachedCampaignWorkspace, ReactivationError } from "@/lib/reactivation/server";
import ReactivationCampaign from "@/components/reactivation/ReactivationCampaign";
import type { ReactivationCampaignData } from "@/lib/reactivation/campaign";

export default async function Page() {
  const { profile } = await requirePageAuth({ next: "/campaigns/patient-reactivation" });
  let data: ReactivationCampaignData | null = null;
  let error = "";
  try {
    data = await cachedCampaignWorkspace();
  } catch (caught) {
    error = caught instanceof ReactivationError ? caught.message : "Campaign data could not be loaded.";
  }
  return (
    <DashboardLayout title="Patient reactivation" subtitle="Enrollment, scheduled follow-up and delivery history.">
      <ReactivationCampaign
        initial={data}
        initialError={error}
        canManage={profile.role !== "viewer"}
        canDelete={profile.role === "admin"}
      />
    </DashboardLayout>
  );
}
