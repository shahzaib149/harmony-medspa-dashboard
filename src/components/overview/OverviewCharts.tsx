"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ClinicMetric, LeadTrendPoint } from "@/lib/overview-types";

const tooltipStyle = {
  background: "var(--chart-tooltip)",
  color: "var(--text-primary)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "12px",
  boxShadow: "var(--shadow-soft)",
  fontSize: "12px",
};

export function LeadTrendChart({ data }: { data: LeadTrendPoint[] }) {
  return (
    <figure
      className="min-w-0"
      aria-label="Daily lead trend for new leads, replied leads, and booked leads"
      tabIndex={0}
    >
      <div className="h-[250px] min-w-0 w-full sm:h-[280px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
          <LineChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 4 }}>
            <CartesianGrid
              stroke="var(--chart-grid)"
              strokeDasharray="3 5"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              minTickGap={28}
              tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              width={38}
              tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ stroke: "var(--border-strong)", strokeDasharray: "3 4" }}
              labelStyle={{ color: "var(--text-primary)", fontWeight: 700 }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={7}
              wrapperStyle={{ color: "var(--chart-axis)", fontSize: 11, paddingTop: 12 }}
            />
            <Line
              type="monotone"
              dataKey="leads"
              name="New leads"
              stroke="var(--chart-leads)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="replied"
              name="Replied"
              stroke="var(--chart-replied)"
              strokeWidth={2.25}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="booked"
              name="Booked"
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
              `${point.label}: ${point.leads} new, ${point.replied} replied, ${point.booked} booked`,
          )
          .join(". ")}
      </figcaption>
    </figure>
  );
}

export function ClinicMetricsChart({ data }: { data: ClinicMetric[] }) {
  const chartData = data.slice(-8).map((item) => ({
    ...item,
    label: new Intl.DateTimeFormat("en-US", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    }).format(new Date(`${item.month}-01T00:00:00.000Z`)),
  }));
  return (
    <figure
      className="min-w-0"
      aria-label="Monthly clinic visits compared with new patients"
      tabIndex={0}
    >
      <div className="h-[250px] min-w-0 w-full sm:h-[270px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 4 }}>
            <CartesianGrid
              stroke="var(--chart-grid)"
              strokeDasharray="3 5"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              width={38}
              tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={7}
              wrapperStyle={{ color: "var(--chart-axis)", fontSize: 11, paddingTop: 12 }}
            />
            <Bar
              dataKey="totalVisits"
              name="Total visits"
              fill="var(--chart-visits)"
              radius={[5, 5, 0, 0]}
              maxBarSize={34}
              isAnimationActive={false}
            />
            <Bar
              dataKey="newPatients"
              name="New patients"
              fill="var(--chart-new-patients)"
              radius={[5, 5, 0, 0]}
              maxBarSize={34}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">
        {chartData
          .map(
            (point) =>
              `${point.label}: ${point.totalVisits} total visits and ${point.newPatients} new patients`,
          )
          .join(". ")}
      </figcaption>
    </figure>
  );
}
