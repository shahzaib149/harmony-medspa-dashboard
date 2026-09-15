
import { LoadingRegion, SkeletonRows } from "@/components/ui/Skeleton";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LeadsClient from "./LeadsClient";
import { Suspense } from "react";
import { requirePageAuth } from "@/lib/auth/require-page-auth";

export default async function LeadsPage() {
  await requirePageAuth({ next: "/leads" });
  return (
    <DashboardLayout title="Leads" subtitle="Form submissions from Harmony MedSpa lead form">
      <Suspense fallback={<LoadingRegion label="Loading leads" className="overflow-hidden rounded-2xl border"><SkeletonRows rows={8} /></LoadingRegion>}><LeadsClient /></Suspense>
    </DashboardLayout>
  );
}
