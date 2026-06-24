interface KPICardProps {
  title: string;
  value: string | number;
  target?: string | number;
  progress?: number;
  trend?: { value: number; positive: boolean };
  suffix?: string;
  prefix?: string;
  subtitle?: string;
  color?: "teal" | "green" | "amber" | "red";
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
  color = "teal",
}: KPICardProps) {
  const colorMap = {
    teal: { bar: "#1A6B6B", text: "#1A6B6B" },
    green: { bar: "#10B981", text: "#10B981" },
    amber: { bar: "#F59E0B", text: "#F59E0B" },
    red: { bar: "#EF4444", text: "#EF4444" },
  };

  const c = colorMap[color];

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5 flex flex-col gap-3">
      <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">
        {title}
      </p>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-[#1A1A2E]">
            {prefix}
            {value}
            {suffix && <span className="text-base font-medium text-[#6B7280] ml-1">{suffix}</span>}
          </p>
          {subtitle && (
            <p className="text-xs text-[#6B7280] mt-0.5">{subtitle}</p>
          )}
        </div>
        {trend && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              trend.positive
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {trend.positive ? "▲" : "▼"} {trend.value}%
          </span>
        )}
      </div>

      {target !== undefined && (
        <p className="text-xs text-[#6B7280]">
          Target:{" "}
          <span className="font-medium text-[#1A1A2E]">
            {prefix}
            {target}
            {suffix}
          </span>
        </p>
      )}

      {progress !== undefined && (
        <div className="space-y-1">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
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
