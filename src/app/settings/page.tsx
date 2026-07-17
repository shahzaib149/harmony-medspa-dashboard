import DashboardLayout from "@/components/layout/DashboardLayout";
import SettingsClient from "./SettingsClient";
import { requirePageAuth } from "@/lib/auth/require-page-auth";

export default async function SettingsPage() {
  await requirePageAuth({ next: "/settings" });
  return (
    <DashboardLayout
      title="Settings"
      subtitle="Manage staff accounts and dashboard access"
    >
      <SettingsClient />
    </DashboardLayout>
  );
}
