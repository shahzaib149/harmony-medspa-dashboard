import { notFound } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CampaignDetailClient, { type CampaignDetailData } from "./CampaignDetailClient";
import { requirePageAuth } from "@/lib/auth/require-page-auth";
import { campaignDetail } from "@/lib/campaigns/data";
import { getCampaign } from "@/lib/campaigns/registry";

export default async function Page({
  params,
}: {
  params: Promise<{ campaignSlug: string }>;
}) {
  const { campaignSlug } = await params;
  await requirePageAuth({ next: "/campaigns/" + campaignSlug });
  if (!getCampaign(campaignSlug)) notFound();

  let initial: CampaignDetailData | null = null;
  let initialError = "";
  try {
    initial = await campaignDetail(campaignSlug);
  } catch {
    initialError = "Could not load campaign";
  }

  return (
    <DashboardLayout title="Campaign">
      <CampaignDetailClient
        slug={campaignSlug}
        initial={initial}
        initialError={initialError}
      />
    </DashboardLayout>
  );
}
