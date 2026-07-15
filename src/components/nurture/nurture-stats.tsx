import { Activity, CheckCircle2, Clock3, Percent, XCircle } from "lucide-react";
import type { NurtureStats as Stats } from "@/lib/types/nurture";

const cards = [
  { key: "active", label: "Active Sequences", icon: Activity, color: "#2DD4BF" },
  { key: "completed", label: "Completed", icon: CheckCircle2, color: "#60A5FA" },
  { key: "stopped", label: "Stopped", icon: XCircle, color: "#F87171" },
  { key: "conversionRate", label: "Conversion Rate", icon: Percent, color: "#C9A84C" },
  { key: "avgDaysToBook", label: "Avg Days to Book", icon: Clock3, color: "#A78BFA" },
] as const;

export default function NurtureStats({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
      {cards.map(({ key, label, icon: Icon, color }) => {
        const raw = stats[key];
        const value = key === "conversionRate" ? `${raw}%` : key === "avgDaysToBook" ? (raw === null ? "—" : `${raw}d`) : raw;
        return (
          <div key={key} className="rounded-2xl border px-4 py-4" style={{ background: "linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.01)),var(--surface-1)", borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[.08em] text-[var(--text-muted)]">{label}</p>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ color, backgroundColor: `${color}14` }}><Icon size={15} /></span>
            </div>
            <p className="mt-2 text-[29px] font-extrabold leading-none text-[var(--text-primary)]">{value}</p>
          </div>
        );
      })}
    </div>
  );
}
