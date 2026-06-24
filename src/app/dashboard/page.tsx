import DashboardLayout from "@/components/layout/DashboardLayout";
import OverviewClient from "./OverviewClient";

export default function DashboardPage() {
  return (
    <DashboardLayout
      title="Growth Command Center"
      subtitle="Harmony MedSpa — June 2026"
    >
      <OverviewClient />
    </DashboardLayout>
  );
}
