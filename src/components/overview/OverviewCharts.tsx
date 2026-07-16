"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  ClinicMetric,
  DeliveryTrendPoint,
  GoogleAdsDailyPoint,
  LeadSourcePerformance,
  LeadTrendPoint,
} from "@/lib/overview-types";

const tooltipStyle = {
  background: "var(--chart-tooltip)",
  color: "var(--text-primary)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "12px",
  boxShadow: "var(--shadow-soft)",
  fontSize: "12px",
};

const axisTick = { fill: "var(--chart-axis)", fontSize: 11 };
const legendStyle = {
  color: "var(--chart-axis)",
  fontSize: 11,
  paddingTop: 12,
};

export function GrowthTrendChart({ data }: { data: LeadTrendPoint[] }) {
  return (
    <figure
      className="min-w-0"
      aria-label="Daily lead trend for new leads, replied leads, and booked leads"
      tabIndex={0}
    >
      <div className="h-[300px] min-w-0 w-full sm:h-[320px]">
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
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={7}
              wrapperStyle={legendStyle}
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

// Keep the previous public name available for any other dashboard consumers.
export const LeadTrendChart = GrowthTrendChart;

export function LeadSourceChart({ sources }: { sources: LeadSourcePerformance[] }) {
  const chartData = sources.slice(0, 6).map((source) => ({
    ...source,
    shortSource: source.source.length > 14 ? `${source.source.slice(0, 13)}…` : source.source,
    notBooked: Math.max(0, source.leads - source.booked),
  }));

  return (
    <figure className="min-w-0" aria-label="Lead volume and bookings by acquisition source" tabIndex={0}>
      <div className="h-[190px] min-w-0 w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 2, right: 8, left: 0, bottom: 2 }}
          >
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 5" horizontal={false} />
            <XAxis type="number" hide allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="shortSource"
              axisLine={false}
              tickLine={false}
              tick={axisTick}
              width={92}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: "var(--surface-hover)" }}
              labelStyle={{ color: "var(--text-primary)", fontWeight: 700 }}
            />
            <Bar
              dataKey="booked"
              name="Booked"
              stackId="leads"
              fill="var(--chart-booked)"
              isAnimationActive={false}
            />
            <Bar
              dataKey="notBooked"
              name="Not booked"
              stackId="leads"
              fill="var(--chart-leads)"
              radius={[0, 5, 5, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">
        {chartData
          .map((source) => `${source.source}: ${source.leads} leads and ${source.booked} booked`)
          .join(". ")}
      </figcaption>
    </figure>
  );
}

export function DeliveryChart({ data }: { data: DeliveryTrendPoint[] }) {
  const chartData = data.map((point) => ({
    ...point,
    failed: point.smsFailed + point.emailFailed,
  }));

  return (
    <figure className="min-w-0" aria-label="Successful and failed message delivery by day" tabIndex={0}>
      <div className="h-[210px] min-w-0 w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 5" vertical={false} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              minTickGap={24}
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
              cursor={{ fill: "var(--surface-hover)" }}
              labelStyle={{ color: "var(--text-primary)", fontWeight: 700 }}
            />
            <Bar
              dataKey="smsSuccessful"
              name="SMS successful"
              stackId="messages"
              fill="var(--chart-sms)"
              isAnimationActive={false}
            />
            <Bar
              dataKey="emailSuccessful"
              name="Email successful"
              stackId="messages"
              fill="var(--chart-email)"
              isAnimationActive={false}
            />
            <Bar
              dataKey="failed"
              name="Failed"
              stackId="messages"
              fill="var(--chart-warning)"
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">
        {chartData
          .map(
            (point) =>
              `${point.label}: ${point.smsSuccessful} SMS successful, ${point.emailSuccessful} email successful, and ${point.failed} failed`,
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
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 5" vertical={false} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={axisTick} />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              width={38}
              tick={axisTick}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={7}
              wrapperStyle={legendStyle}
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

export function GoogleAdsChart({ daily }: { daily: GoogleAdsDailyPoint[] }) {
  return (
    <figure className="min-w-0" aria-label="Daily Google Ads spend and conversions" tabIndex={0}>
      <div className="h-[200px] min-w-0 w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
          <ComposedChart data={daily} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 5" vertical={false} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              minTickGap={24}
              tick={axisTick}
              interval="preserveStartEnd"
            />
            <YAxis yAxisId="spend" hide domain={[0, "auto"]} />
            <YAxis yAxisId="conversions" hide domain={[0, "auto"]} />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: "var(--surface-hover)" }}
              labelStyle={{ color: "var(--text-primary)", fontWeight: 700 }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={7}
              wrapperStyle={legendStyle}
            />
            <Bar
              yAxisId="spend"
              dataKey="spend"
              name="Spend ($)"
              fill="var(--chart-leads)"
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
              isAnimationActive={false}
            />
            <Line
              yAxisId="conversions"
              type="monotone"
              dataKey="conversions"
              name="Conversions"
              stroke="var(--chart-booked)"
              strokeWidth={2.25}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">
        {daily
          .map((point) => `${point.label}: $${point.spend} spent and ${point.conversions} conversions`)
          .join(". ")}
      </figcaption>
    </figure>
  );
}
