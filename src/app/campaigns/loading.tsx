import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function Loading() {
  return (
    <DashboardLayout title="Campaigns" subtitle="Manage automated lead follow-up, performance, and enrollment.">
      <LoadingRegion label="Loading campaigns" className="grid gap-5">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-24 rounded-xl" />)}</div>
        <Skeleton className="h-11 w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-72 rounded-2xl" />)}</div>
      </LoadingRegion>
    </DashboardLayout>
  );
}
