import DashboardLayout from "@/components/layout/DashboardLayout";
import LeadsClient from "./LeadsClient";

export default function LeadsPage() {
  return (
    <DashboardLayout title="Leads" subtitle="Form submissions from Harmony MedSpa lead form">
      <LeadsClient />
    </DashboardLayout>
  );
}
