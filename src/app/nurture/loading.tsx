import DashboardLayout from "@/components/layout/DashboardLayout";

export default function NurtureLoading() {
  return <DashboardLayout title="No-Book Nurture" subtitle="System 2 · 14-day conversion sequence"><div className="space-y-5"> <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl border bg-white/[.035]" style={{ borderColor: "rgba(201,168,76,.12)" }} />)}</div><div className="h-[350px] animate-pulse rounded-2xl border bg-white/[.025]" style={{ borderColor: "rgba(201,168,76,.12)" }} /><div className="h-72 animate-pulse rounded-2xl border bg-white/[.025]" style={{ borderColor: "rgba(201,168,76,.12)" }} /></div></DashboardLayout>;
}
