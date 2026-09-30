"use client";

import {
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
import { ENGINES, type MentionRatePoint } from "@/lib/aeo/visibility";
import { ENGINE_COLORS } from "./engine-colors";

const tooltipStyle = {
  background: "var(--surface-raised)",
  color: "var(--text-primary)",
  border: "1px solid var(--border-subtle)",
  borderRadius: 10,
  boxShadow: "var(--shadow-soft)",
  fontSize: 11,
};
const axisTick = { fill: "var(--text-muted)", fontSize: 10 };
function shortDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      });
}
function monthLabel(value: string) {
  const date = new Date(`${value}-01T00:00:00Z`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
        timeZone: "UTC",
      });
}
export function MentionRateChart({ data }: { data: MentionRatePoint[] }) {
  const engines = ENGINES.filter((engine) =>
    data.some((point) => point[engine] !== undefined),
  );
  return (
    <div
      style={{ width: "100%", height: 245 }}
      aria-label="Share of checked questions mentioning Harmony by engine and date"
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        initialDimension={{ width: 500, height: 245 }}
      >
        <LineChart
          data={data}
          margin={{ top: 12, right: 14, bottom: 0, left: 0 }}
          accessibilityLayer
        >
          <CartesianGrid
            vertical={false}
            stroke="var(--border-subtle)"
            strokeDasharray="3 5"
            strokeOpacity={0.6}
          />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            minTickGap={32}
            dy={8}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(v: number) => `${v}%`}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={39}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: "var(--text-primary)", marginBottom: 6 }}
            labelFormatter={(label) => shortDate(String(label))}
            formatter={(value, name) => [`${value}%`, String(name)]}
          />
          {engines.map((engine) => (
            <Line
              key={engine}
              type="linear"
              dataKey={engine}
              stroke={ENGINE_COLORS[engine]}
              strokeWidth={2.25}
              dot={{ r: 3, strokeWidth: 2, fill: "var(--surface-1)" }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--surface-1)" }}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
export function AiLeadsChart({
  data,
}: {
  data: Array<{ month: string; leads: number }>;
}) {
  return (
    <div
      style={{ width: "100%", height: 186 }}
      aria-label="AI-referred enquiries by month"
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        initialDimension={{ width: 400, height: 186 }}
      >
        <BarChart
          data={data}
          margin={{ top: 10, right: 8, bottom: 0, left: 0 }}
          accessibilityLayer
        >
          <CartesianGrid
            vertical={false}
            stroke="var(--border-subtle)"
            strokeDasharray="3 5"
            strokeOpacity={0.6}
          />
          <XAxis
            dataKey="month"
            tickFormatter={monthLabel}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            dy={5}
          />
          <YAxis
            allowDecimals={false}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(label) => monthLabel(String(label))}
            formatter={(value) => [String(value), "AI-referred enquiries"]}
            cursor={{ fill: "var(--surface-2)" }}
          />
          <Bar
            dataKey="leads"
            fill="var(--success)"
            radius={[5, 5, 0, 0]}
            maxBarSize={28}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
export function SourceDonut({
  data,
  total,
}: {
  data: Array<{ name: string; value: number; color: string }>;
  total: number;
}) {
  const chartData = total
    ? data.filter((d) => d.value > 0)
    : [
        {
          name: "No recorded sources",
          value: 1,
          color: "var(--border-subtle)",
        },
      ];
  return (
    <div
      style={{ width: 154, height: 174, position: "relative", flexShrink: 0 }}
      aria-label={
        total
          ? `${total} enquiries with a recorded source`
          : "No lead sources recorded"
      }
    >
      {total === 0 ? (
        <div
          style={{
            position: "absolute",
            width: 140,
            height: 140,
            border: "15px solid var(--border-subtle)",
            borderRadius: "50%",
            top: 17,
            left: 7,
          }}
        />
      ) : (
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          initialDimension={{ width: 154, height: 174 }}
        >
          <PieChart accessibilityLayer>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={70}
              startAngle={90}
              endAngle={-270}
              paddingAngle={total ? 3 : 0}
              stroke="none"
              isAnimationActive={false}
            >
              {chartData.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            {total > 0 && (
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name) => [
                  `${value} enquiries`,
                  String(name),
                ]}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <strong style={{ fontSize: 30, fontWeight: 550, letterSpacing: -1 }}>
          {total}
        </strong>
        <span style={{ fontSize: 9, color: "var(--text-muted)" }}>
          recorded sources
        </span>
      </div>
    </div>
  );
}
