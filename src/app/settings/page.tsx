import DashboardLayout from "@/components/layout/DashboardLayout";
import SettingsClient from "./SettingsClient";

export default function SettingsPage() {
  return (
    <DashboardLayout
      title="Settings"
      subtitle="Manage staff accounts and dashboard access"
    >
      <SettingsClient />
    </DashboardLayout>
  );
}
