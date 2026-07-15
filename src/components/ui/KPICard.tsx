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

export default function KPICard({
  title,
  value,
  target,
  progress,
  trend,
  suffix,
  prefix,
  subtitle,
  color = "gold",
}: KPICardProps) {
  const colorMap = {
    gold: {
      bar: "var(--brand-primary)",
      text: "var(--brand-primary)",
      border:
        "color-mix(in srgb, var(--brand-primary) 25%, var(--border-subtle))",
    },
    teal: {
      bar: "var(--healthy)",
      text: "var(--healthy)",
      border: "color-mix(in srgb, var(--healthy) 24%, var(--border-subtle))",
    },
    green: { bar: "#22C55E", text: "#22C55E", border: "rgba(34,197,94,0.2)" },
    amber: { bar: "#F59E0B", text: "#F59E0B", border: "rgba(245,158,11,0.2)" },
    red: { bar: "#F87171", text: "#F87171", border: "rgba(248,113,113,0.2)" },
  };
  const c = colorMap[color];

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{
        backgroundColor: "var(--surface-1)",
        border: `1px solid ${c.border}`,
      }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: "var(--text-muted)" }}
      >
        {title}
      </p>

      <div className="flex items-end justify-between">
        <div>
          <p
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {prefix}
            {value}
            {suffix && (
              <span
                className="ml-1 text-base font-normal"
                style={{ color: "var(--text-muted)" }}
              >
                {suffix}
              </span>
            )}
          </p>
          {subtitle && (
            <p
              className="mt-0.5 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {trend && (
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={
              trend.positive
                ? { backgroundColor: "rgba(34,197,94,0.12)", color: "#22C55E" }
                : {
                    backgroundColor: "rgba(248,113,113,0.12)",
                    color: "#F87171",
                  }
            }
          >
            {trend.positive ? "▲" : "▼"} {trend.value}%
          </span>
        )}
      </div>

      {target !== undefined && (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Target:{" "}
          <span
            className="font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            {prefix}
            {target}
            {suffix}
          </span>
        </p>
      )}

      {progress !== undefined && (
        <div className="space-y-1">
          <div
            className="h-1 rounded-full"
            style={{ backgroundColor: "var(--border-subtle)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: c.bar,
              }}
            />
          </div>
          <p className="text-xs" style={{ color: c.text }}>
            {Math.round(progress)}% of target
          </p>
        </div>
      )}
    </div>
  );
}
