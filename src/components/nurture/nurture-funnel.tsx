"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { NurtureFunnelStep } from "@/lib/types/nurture";

export default function NurtureFunnel({ data }: { data: NurtureFunnelStep[] }) {
  return (
    <section className="rounded-2xl border p-4 md:p-5" style={{ backgroundColor: "var(--background-subtle)", borderColor: "var(--border-subtle)" }}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div><p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#C9A84C]">Sequence analytics</p><h2 className="mt-1 text-base font-extrabold text-[var(--text-primary)]">14-Day Nurture Funnel</h2></div>
        <p className="text-xs text-[var(--text-muted)]">Reach, conversion, and drop-off by step</p>
      </div>
      <div className="h-[310px] w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
            <CartesianGrid stroke="var(--border-subtle)" horizontal={false} />
            <XAxis type="number" allowDecimals={false} stroke="var(--text-muted)" fontSize={11} />
            <YAxis type="category" dataKey="step" width={88} stroke="var(--text-muted)" fontSize={11} />
            <Tooltip contentStyle={{ background: "var(--background)", border: "1px solid rgba(201,168,76,.18)", borderRadius: 12, color: "var(--text-primary)" }} cursor={{ fill: "rgba(201,168,76,.035)" }} />
            <Legend wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }} />
            <Bar dataKey="entered" name="Reached" fill="#C9A84C" radius={[0, 4, 4, 0]} />
            <Bar dataKey="booked" name="Booked" fill="#2DD4BF" radius={[0, 4, 4, 0]} />
            <Bar dataKey="stopped" name="Dropped off" fill="#F87171" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
