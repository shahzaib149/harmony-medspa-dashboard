import { Suspense } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import GiftCardCampaign from "@/components/campaigns/GiftCardCampaign";
import { requirePageAuth } from "@/lib/auth/require-page-auth";
import { cachedGiftCardWorkspace, type GiftCardWorkspace } from "@/lib/black-friday/server";

export default async function Page() {
  await requirePageAuth({ next: "/campaigns/gift-cards" });
  let data: GiftCardWorkspace | null = null;
  let error = "";
  try {
    data = await cachedGiftCardWorkspace();
  } catch (caught) {
    console.error("[campaigns] gift-cards page load failed", caught);
    error = "Gift card data didn't load. Try again in a moment.";
  }
  return (
    <DashboardLayout title="Gift Card Requests" subtitle="Requests from the website gift card form, their status and confirmations.">
      <Suspense><GiftCardCampaign initial={data} initialError={error} /></Suspense>
    </DashboardLayout>
  );
}
