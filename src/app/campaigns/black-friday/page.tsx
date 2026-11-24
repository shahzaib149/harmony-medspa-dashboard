import { Suspense } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import BlackFridayCampaign from "@/components/campaigns/BlackFridayCampaign";
import { requirePageAuth } from "@/lib/auth/require-page-auth";
import { cachedBlackFridayWorkspace, type BlackFridayWorkspace } from "@/lib/black-friday/server";

export default async function Page() {
  await requirePageAuth({ next: "/campaigns/black-friday" });
  let data: BlackFridayWorkspace | null = null;
  let error = "";
  try {
    data = await cachedBlackFridayWorkspace();
  } catch (caught) {
    console.error("[campaigns] black-friday page load failed", caught);
    error = "Black Friday data didn't load. Try again in a moment.";
  }
  return (
    <DashboardLayout title="Black Friday 2026" subtitle="Hayden's list, the three sends, and website Black Friday leads.">
      <Suspense><BlackFridayCampaign initial={data} initialError={error} /></Suspense>
    </DashboardLayout>
  );
}
