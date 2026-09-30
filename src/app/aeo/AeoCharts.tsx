"use client";

import { Bar, BarChart, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ENGINES, type MentionRatePoint } from "@/lib/aeo/visibility";
import { ENGINE_COLORS } from "./engine-colors";

// Same body size as the page (one type scale); quiet axes, no gridlines.
const tooltipStyle = {
  background: "var(--surface-raised)",
  color: "var(--text-primary)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "10px",
  boxShadow: "none",
  fontSize: "0.875rem",
};
const axisTick = { fill: "var(--text-muted)", fontSize: 14 };
const axisLine = { stroke: "var(--border-subtle)" };

function shortDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function monthLabel(value: string) {
  const date = new Date(`${value}-01T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

export function MentionRateChart({ data }: { data: MentionRatePoint[] }) {
  const engines = ENGINES.filter((engine) => data.some((point) => point[engine] !== undefined));
  return (
    <div style={{ width: "100%", height: 280 }} role="img" aria-label="Share of tracked questions where Harmony was mentioned, by engine and check date">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <XAxis dataKey="date" tickFormatter={shortDate} tick={axisTick} tickLine={false} axisLine={axisLine} minTickGap={24} />
          <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tickFormatter={(v: number) => `${v}%`} tick={axisTick} tickLine={false} axisLine={false} width={52} />
          <Tooltip contentStyle={tooltipStyle} labelFormatter={(label) => shortDate(String(label))} formatter={(value, name) => [`${value}%`, String(name)]} />
          <Legend iconType="plainline" iconSize={14} wrapperStyle={{ fontSize: "0.875rem", color: "var(--text-muted)", paddingTop: 12 }} />
          {engines.map((engine) => (
            <Line
              key={engine}
              type="linear"
              dataKey={engine}
              stroke={ENGINE_COLORS[engine]}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AiLeadsChart({ data }: { data: Array<{ month: string; leads: number }> }) {
  return (
    <div style={{ width: "100%", height: 200 }} role="img" aria-label="Leads referred by AI tools per month">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
          <XAxis dataKey="month" tickFormatter={monthLabel} tick={axisTick} tickLine={false} axisLine={axisLine} />
          <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} width={32} />
          <Tooltip contentStyle={tooltipStyle} labelFormatter={(label) => monthLabel(String(label))} formatter={(value) => [String(value), "AI-referred leads"]} cursor={{ fill: "var(--surface-2)" }} />
          <Bar dataKey="leads" fill="var(--aeo-muted-bar)" radius={[2, 2, 0, 0]} maxBarSize={14} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
