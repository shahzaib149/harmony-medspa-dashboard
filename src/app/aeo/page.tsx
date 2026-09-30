import DashboardLayout from "@/components/layout/DashboardLayout";
import { requirePageAuth } from "@/lib/auth/require-page-auth";
import { loadAeoReport } from "@/lib/aeo/data";
import AeoReport from "./AeoReport";

export const dynamic = "force-dynamic";

export default async function AeoPage() {
  await requirePageAuth({ next: "/aeo" });
  const data = await loadAeoReport();
  return (
    <DashboardLayout
      title="AI Search"
      subtitle="Harmony's presence in the next generation of search"
    >
      <AeoReport data={data} />
    </DashboardLayout>
  );
}
