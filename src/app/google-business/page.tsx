import DashboardLayout from "@/components/layout/DashboardLayout";
import GoogleBusinessClient from "./GoogleBusinessClient";

export default function GoogleBusinessPage() {
  return (
    <DashboardLayout
      title="Google Business Profile"
      subtitle="Reviews, insights, posts, and local search performance"
    >
      <GoogleBusinessClient />
    </DashboardLayout>
  );
}
