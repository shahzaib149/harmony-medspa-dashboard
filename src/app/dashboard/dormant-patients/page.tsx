import DashboardLayout from "@/components/layout/DashboardLayout";
import { requirePageAuth } from "@/lib/auth/require-page-auth";
import { workspace, ReactivationError } from "@/lib/reactivation/server";
import DormantPatients from "@/components/reactivation/DormantPatients";
import type { Workspace } from "@/lib/reactivation/model";
export default async function DormantPatientsPage() {
  const { profile } = await requirePageAuth({ next:"/dashboard/dormant-patients" });
  let data: Workspace | null = null; let error = "";
  try { data = await workspace(true); } catch(e) { error = e instanceof ReactivationError ? e.message : "Patient data could not be loaded. Please retry."; }
  return <DashboardLayout title="Dormant patients" subtitle="Reconnect thoughtfully. Review, enroll, and follow each patient's return."><DormantPatients initial={data} initialError={error} canManage={profile.role !== "viewer"} /></DashboardLayout>;
}
