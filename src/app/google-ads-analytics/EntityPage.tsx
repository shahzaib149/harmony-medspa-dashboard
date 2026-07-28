import DashboardLayout from "@/components/layout/DashboardLayout";
import { requirePageAuth } from "@/lib/auth/require-page-auth";
import EntityDetailClient, { type EntityKind } from "./components/EntityDetailClient";

const LABELS: Record<EntityKind, string> = {
  campaign: "Campaign detail",
  "ad-group": "Ad group detail",
  ad: "Ad detail",
  keyword: "Keyword detail",
};

export default async function EntityPage({ kind, id }: { kind: EntityKind; id: string }) {
  const segment = kind === "campaign" ? "campaigns" : kind === "ad-group" ? "ad-groups" : kind === "ad" ? "ads" : "keywords";
  await requirePageAuth({ next: `/google-ads-analytics/${segment}/${encodeURIComponent(id)}` });
  return <DashboardLayout title={LABELS[kind]} subtitle="Canonical Google Ads entity, performance history, and relationships"><EntityDetailClient kind={kind} id={id} /></DashboardLayout>;
}
