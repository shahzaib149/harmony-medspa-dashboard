import DashboardLayout from "@/components/layout/DashboardLayout";
import OverviewClient from "./OverviewClient";

export default function DashboardPage() {
  return (
    <DashboardLayout
      title="Growth Command Center"
      subtitle="Live patient-growth and clinic operations"
    >
      <OverviewClient />
    </DashboardLayout>
  );
}
