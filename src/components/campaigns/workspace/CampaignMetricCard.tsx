"use client";

import type { ReactNode } from "react";
import { Activity, CalendarClock, CheckCircle2, CircleAlert, Users } from "lucide-react";

/** Campaign KPI card: thin accent bar, large figure, icon tile (given, or picked from the label). */
export function CampaignMetricCard({ label, value, accent, icon, hint }: {
  label: string; value: string | number; accent: string;
  /** Overrides the label-based icon. */
  icon?: ReactNode;
  /** Small muted line under the label. */
  hint?: ReactNode;
}) {
  const Icon = /failed|attention/i.test(label)
    ? CircleAlert
    : /active|due|activity/i.test(label)
      ? Activity
      : /complete|booked|sent/i.test(label)
        ? CheckCircle2
        : /lead|enrolled|processed/i.test(label)
          ? Users
          : CalendarClock;
  return (
    <article className="group relative overflow-hidden rounded-2xl border p-4 sm:p-5" style={{ background: "var(--surface-1)", borderColor: "var(--border-subtle)" }}>
      <span className="absolute inset-x-0 top-0 h-0.5 opacity-70" style={{ background: accent }} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-2xl font-extrabold tabular-nums tracking-tight text-[var(--text-primary)]">{String(value ?? 0)}</p>
          <p className="mt-1 text-xs font-medium text-[var(--text-muted)]">{label}</p>
          {hint ? <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{hint}</p> : null}
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-xl" style={{ color: accent, background: "var(--surface-2)" }}>{icon ?? <Icon size={16} />}</span>
      </div>
    </article>
  );
}
