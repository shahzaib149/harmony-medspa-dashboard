import OverviewClient from "./OverviewClient";
import { overviewQueryFromParams } from "@/lib/overview-range";
import { requirePageAuth } from "@/lib/auth/require-page-auth";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePageAuth({ next: "/dashboard" });
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") params.set(key, value);
  }
  const initialRange = overviewQueryFromParams(params);
  return <OverviewClient initialRange={initialRange} />;
}
