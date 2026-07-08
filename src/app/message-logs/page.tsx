import DashboardLayout from "@/components/layout/DashboardLayout";
import MessageLogsClient from "./MessageLogsClient";

export default function MessageLogsPage() {
  return (
    <DashboardLayout title="Message Logs" subtitle="Email and SMS activity from Harmony MedSpa automations">
      <MessageLogsClient />
    </DashboardLayout>
  );
}
