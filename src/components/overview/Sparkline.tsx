"use client";

import { useId, useMemo } from "react";

/* KPI micro-sparkline — dependency-free inline SVG so it stays out of the
   Recharts chunk and can render in the initial KPI strip. */
export default function Sparkline({
  values,
  color = "var(--chart-leads)",
}: {
  values: number[];
  color?: string;
}) {
  const rawId = useId();
  const id = `spark-${rawId.replace(/[:]/g, "")}`;
  const width = 100;
  const height = 28;
  const path = useMemo(() => {
    if (values.length < 2 || values.every((v) => v === 0)) return null;
    const max = Math.max(...values, 1);
    const step = width / (values.length - 1);
    const line = values
      .map(
        (v, i) =>
          `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(
            height -
            (v / max) * (height - 4) -
            2
          ).toFixed(1)}`,
      )
      .join(" ");
    return { line, area: `${line} L${width},${height} L0,${height} Z` };
  }, [values]);

  if (!path) return null;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="h-7 w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={path.area} fill={`url(#${id})`} />
      <path
        d={path.line}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}