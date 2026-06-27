interface KPICardProps {
  title: string;
  value: string | number;
  target?: string | number;
  progress?: number;
  trend?: { value: number; positive: boolean };
  suffix?: string;
  prefix?: string;
  subtitle?: string;
  color?: "teal" | "green" | "amber" | "red" | "gold";
}

export default function KPICard({ title, value, target, progress, trend, suffix, prefix, subtitle, color = "gold" }: KPICardProps) {
  const colorMap = {
    gold:  { bar: "#C9A84C", text: "#C9A84C", border: "rgba(201,168,76,0.25)" },
    teal:  { bar: "#2DD4BF", text: "#2DD4BF", border: "rgba(45,212,191,0.2)" },
    green: { bar: "#22C55E", text: "#22C55E", border: "rgba(34,197,94,0.2)" },
    amber: { bar: "#F59E0B", text: "#F59E0B", border: "rgba(245,158,11,0.2)" },
    red:   { bar: "#F87171", text: "#F87171", border: "rgba(248,113,113,0.2)" },
  };
  const c = colorMap[color];

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{
        backgroundColor: "#111117",
        border: `1px solid ${c.border}`,
        boxShadow: `0 0 20px rgba(0,0,0,0.3)`,
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#5A5A6A" }}>
        {title}
      </p>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold" style={{ color: "#F0ECE4" }}>
            {prefix}{value}
            {suffix && <span className="text-base font-normal ml-1" style={{ color: "#7A7A8A" }}>{suffix}</span>}
          </p>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: "#5A5A6A" }}>{subtitle}</p>}
        </div>
        {trend && (
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={
              trend.positive
                ? { backgroundColor: "rgba(34,197,94,0.12)", color: "#22C55E" }
                : { backgroundColor: "rgba(248,113,113,0.12)", color: "#F87171" }
            }
          >
            {trend.positive ? "▲" : "▼"} {trend.value}%
          </span>
        )}
      </div>

      {target !== undefined && (
        <p className="text-xs" style={{ color: "#5A5A6A" }}>
          Target: <span className="font-medium" style={{ color: "#F0ECE4" }}>{prefix}{target}{suffix}</span>
        </p>
      )}

      {progress !== undefined && (
        <div className="space-y-1">
          <div className="h-1 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: c.bar }}
            />
          </div>
          <p className="text-xs" style={{ color: c.text }}>{Math.round(progress)}% of target</p>
        </div>
      )}
    </div>
  );
}
