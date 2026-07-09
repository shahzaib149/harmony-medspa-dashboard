import DashboardLayout from "@/components/layout/DashboardLayout";
import SettingsClient from "./SettingsClient";

export default function SettingsPage() {
  return (
    <DashboardLayout
      title="Staff"
      subtitle="Manage who has access to this dashboard"
    >
      <SettingsClient />
    </DashboardLayout>
  );
}
