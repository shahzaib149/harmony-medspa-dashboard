import DashboardLayout from "@/components/layout/DashboardLayout";
import SettingsClient from "./SettingsClient";

export default function SettingsPage() {
  return (
    <DashboardLayout
      title="Settings"
      subtitle="Connections, access, clinic profile, and automation controls"
    >
      <SettingsClient />
    </DashboardLayout>
  );
}
