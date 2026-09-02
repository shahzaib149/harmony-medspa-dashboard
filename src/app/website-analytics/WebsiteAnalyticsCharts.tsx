"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  WebsiteAnalyticsRealtimeBreakdown,
  WebsiteAnalyticsRealtimeTrendPoint,
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
const liveColors = ["#b7831f", "#2a867a", "#5879a7", "#a45f69"];

export function WebsiteLiveActivityChart({
  data,
}: {
  data: WebsiteAnalyticsRealtimeTrendPoint[];
}) {
  return (
    <figure className="min-w-0" aria-label="Live website activity during the last 30 minutes" tabIndex={0}>
      <div className="h-[240px] min-w-0 w-full sm:h-[285px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="liveViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity={0.32} />
                <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 5" vertical={false} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={26} tick={axisTick} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={38} tick={axisTick} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "var(--text-primary)", fontWeight: 700 }} />
            <Area type="monotone" dataKey="pageViews" name="Page views" stroke="var(--brand-primary)" strokeWidth={2.5} fill="url(#liveViews)" isAnimationActive={false} />
            <Line type="monotone" dataKey="activeUsers" name="Active visitors" stroke="var(--success-text)" strokeWidth={2} dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

export function WebsiteRealtimeDeviceChart({
  data,
}: {
  data: WebsiteAnalyticsRealtimeBreakdown[];
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <figure className="relative min-w-0" aria-label="Live visitors by device" tabIndex={0}>
      <div className="h-[210px] min-w-0 w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={3} stroke="none" isAnimationActive={false}>
              {data.map((item, index) => <Cell key={item.name} fill={liveColors[index % liveColors.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-[78px] text-center">
        <strong className="block text-2xl tabular-nums" style={{ color: "var(--text-primary)" }}>{total}</strong>
        <span className="text-[10px] font-bold uppercase tracking-[.14em]" style={{ color: "var(--text-muted)" }}>Visitors</span>
      </div>
    </figure>
  );
}

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
