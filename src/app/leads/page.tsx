
import { LoadingRegion, SkeletonRows } from "@/components/ui/Skeleton";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LeadsClient from "./LeadsClient";
import { Suspense } from "react";
import { requirePageAuth } from "@/lib/auth/require-page-auth";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // Keep filters and ?call= deep links through sign-in.
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) query.append(key, item);
  }
  await requirePageAuth({ next: query.size ? `/leads?${query}` : "/leads" });
  return (
    <DashboardLayout title="Leads" subtitle="Website inquiries and inbound call leads">
      <Suspense fallback={<LoadingRegion label="Loading leads" className="overflow-hidden rounded-2xl border"><SkeletonRows rows={8} /></LoadingRegion>}><LeadsClient /></Suspense>
    </DashboardLayout>
  );
}
