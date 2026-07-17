import DashboardLayout from "@/components/layout/DashboardLayout";
import GoogleBusinessClient from "./GoogleBusinessClient";
import { requirePageAuth } from "@/lib/auth/require-page-auth";

export default async function GoogleBusinessPage() {
  await requirePageAuth({ next: "/google-business" });
  return (
    <DashboardLayout
      title="Google Business Profile"
      subtitle="Reviews, insights, posts, and local search performance"
    >
      <GoogleBusinessClient />
    </DashboardLayout>
  );
}
