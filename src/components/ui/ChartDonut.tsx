"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DonutSegment {
  name: string;
  value: number;
  color: string;
}

interface ChartDonutProps {
  data: DonutSegment[];
  height?: number;
}

export default function ChartDonut({ data, height = 240 }: ChartDonutProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [`${value}%`, ""]}
          contentStyle={{
            background: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
          formatter={(value) => (
            <span className="text-[#6B7280]">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
