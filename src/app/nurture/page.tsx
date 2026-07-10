import DashboardLayout from "@/components/layout/DashboardLayout";
import NurtureTable from "@/components/nurture/nurture-table";

export default function NurturePage() {
  return <DashboardLayout title="No-Book Nurture" subtitle="System 2 · 14-day conversion sequence"><NurtureTable /></DashboardLayout>;
}
