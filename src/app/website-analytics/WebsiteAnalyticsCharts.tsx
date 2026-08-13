"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  WebsiteAnalyticsSource,
  WebsiteAnalyticsTrendPoint,
} from "@/lib/google/analytics-types";

const tooltipStyle = {
  background: "var(--chart-tooltip)",
  color: "var(--text-primary)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "12px",
  boxShadow: "var(--shadow-soft)",
  fontSize: "12px",
};
const axisTick = { fill: "var(--chart-axis)", fontSize: 11 };

export function WebsiteTrafficChart({
  data,
}: {
  data: WebsiteAnalyticsTrendPoint[];
}) {
  return (
    <figure
      className="min-w-0"
      aria-label="Daily website users, sessions, and lead events"
      tabIndex={0}
    >
      <div className="h-[290px] min-w-0 w-full sm:h-[330px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
          <LineChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 4 }}>
            <CartesianGrid
              stroke="var(--chart-grid)"
              strokeDasharray="3 5"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              minTickGap={30}
              tick={axisTick}
              interval="preserveStartEnd"
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              width={38}
              tick={axisTick}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ stroke: "var(--border-strong)", strokeDasharray: "3 4" }}
              labelStyle={{ color: "var(--text-primary)", fontWeight: 700 }}
            />
            <Line
              type="monotone"
              dataKey="activeUsers"
              name="Visitors"
              stroke="var(--chart-leads)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="sessions"
              name="Sessions"
              stroke="var(--chart-visits)"
              strokeWidth={2.25}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="leads"
              name="Leads"
              stroke="var(--chart-booked)"
              strokeWidth={2.25}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">
        {data
          .map(
            (point) =>
              `${point.label}: ${point.activeUsers} visitors, ${point.sessions} sessions, and ${point.leads} leads`,
          )
          .join(". ")}
      </figcaption>
    </figure>
  );
}

export function WebsiteSourceChart({
  sources,
}: {
  sources: WebsiteAnalyticsSource[];
}) {
  const data = sources.slice(0, 6).map((source) => ({
    ...source,
    label:
      source.sourceMedium.length > 20
        ? `${source.sourceMedium.slice(0, 19)}…`
        : source.sourceMedium,
  }));

  return (
    <figure
      className="min-w-0"
      aria-label="Website sessions by acquisition source"
      tabIndex={0}
    >
      <div className="h-[250px] min-w-0 w-full sm:h-[285px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 8, left: 2, bottom: 2 }}
          >
            <CartesianGrid
              stroke="var(--chart-grid)"
              strokeDasharray="3 5"
              horizontal={false}
            />
            <XAxis type="number" hide allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={axisTick}
              width={122}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: "var(--surface-hover)" }}
              labelStyle={{ color: "var(--text-primary)", fontWeight: 700 }}
            />
            <Bar
              dataKey="sessions"
              name="Sessions"
              fill="var(--chart-visits)"
              radius={[0, 6, 6, 0]}
              maxBarSize={24}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">
        {data
          .map((source) => `${source.sourceMedium}: ${source.sessions} sessions`)
          .join(". ")}
      </figcaption>
    </figure>
  );
}
