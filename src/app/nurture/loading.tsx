import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function NurtureLoading() {
  return (
    <DashboardLayout title="No-Book Nurture" subtitle="System 2 · 14-day conversion sequence">
      <LoadingRegion label="Loading nurture sequence" className="space-y-5">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-2xl" />)}</div>
        <Skeleton className="h-[350px] rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </LoadingRegion>
    </DashboardLayout>
  );
}
