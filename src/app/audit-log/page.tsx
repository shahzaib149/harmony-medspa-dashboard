import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { createClient } from "@/lib/supabase/server";
import AuditLogClient from "./AuditLogClient";

export default async function AuditLogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role,is_active").eq("id", user.id).maybeSingle<{ role: string; is_active: boolean }>();
  if (!profile?.is_active || profile.role !== "admin") redirect("/dashboard?error=access-denied");

  return (
    <DashboardLayout title="Audit Log" subtitle="Review account access and important changes made across the Harmony Dashboard.">
      <AuditLogClient />
    </DashboardLayout>
  );
}
