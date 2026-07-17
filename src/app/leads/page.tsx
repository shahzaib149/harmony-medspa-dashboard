import DashboardLayout from "@/components/layout/DashboardLayout";
import LeadsClient from "./LeadsClient";
import { Suspense } from "react";
import { requirePageAuth } from "@/lib/auth/require-page-auth";

export default async function LeadsPage() {
  await requirePageAuth({ next: "/leads" });
  return (
    <DashboardLayout title="Leads" subtitle="Form submissions from Harmony MedSpa lead form">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-white/5" />}><LeadsClient /></Suspense>
    </DashboardLayout>
  );
}
