"use client";

import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ENGINES, type MentionRatePoint } from "@/lib/aeo/visibility";
import { ENGINE_COLORS } from "./engine-colors";

const tooltipStyle = {
  background: "var(--chart-tooltip)",
  color: "var(--text-primary)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "12px",
  boxShadow: "var(--shadow-soft)",
  fontSize: "12px",
};
const axisTick = { fill: "var(--chart-axis)", fontSize: 11 };

function shortDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function monthLabel(value: string) {
  const date = new Date(`${value}-01T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
}

export function MentionRateChart({ data }: { data: MentionRatePoint[] }) {
  const engines = ENGINES.filter((engine) => data.some((point) => point[engine] !== undefined));
  return (
    <div style={{ width: "100%", height: 300 }} role="img" aria-label="Share of tracked prompts where Harmony was mentioned, by engine and check date">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 5" vertical={false} />
          <XAxis dataKey="date" tickFormatter={shortDate} tick={axisTick} tickLine={false} axisLine={false} minTickGap={16} />
          <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v: number) => `${v}%`} tick={axisTick} tickLine={false} axisLine={false} width={48} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(label) => shortDate(String(label))}
            formatter={(value, name) => [`${value}%`, String(name)]}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)", paddingTop: 8 }} />
          {engines.map((engine) => (
            <Line
              key={engine}
              type="monotone"
              dataKey={engine}
              stroke={ENGINE_COLORS[engine]}
              strokeWidth={2.25}
              dot={{ r: 3, strokeWidth: 0, fill: ENGINE_COLORS[engine] }}
              activeDot={{ r: 5 }}
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
    <div style={{ width: "100%", height: 220 }} role="img" aria-label="Leads referred by AI tools per month">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 5" vertical={false} />
          <XAxis dataKey="month" tickFormatter={monthLabel} tick={axisTick} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} width={40} />
          <Tooltip contentStyle={tooltipStyle} labelFormatter={(label) => monthLabel(String(label))} formatter={(value) => [String(value), "AI-referred leads"]} cursor={{ fill: "var(--surface-hover)" }} />
          <Bar dataKey="leads" fill="var(--aeo-brass)" radius={[6, 6, 0, 0]} maxBarSize={42} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
