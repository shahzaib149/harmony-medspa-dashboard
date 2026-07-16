import OverviewClient from "./OverviewClient";
import type { OverviewPeriodKey } from "@/lib/overview-types";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const requested = (await searchParams).range;
  const supported = new Set<OverviewPeriodKey>(["7d", "30d", "90d", "month"]);
  const initialRange = supported.has(requested as OverviewPeriodKey)
    ? (requested as OverviewPeriodKey)
    : "30d";
  return <OverviewClient initialRange={initialRange} />;
}
