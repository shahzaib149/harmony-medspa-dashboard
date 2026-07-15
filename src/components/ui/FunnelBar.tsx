interface FunnelStep {
  label: string;
  value: number;
  color?: string;
}

interface FunnelBarProps {
  steps: FunnelStep[];
}

export default function FunnelBar({ steps }: FunnelBarProps) {
  const max = steps[0]?.value ?? 1;

  return (
    <div className="space-y-3">
      {steps.map((step, i) => {
        const pct = Math.round((step.value / max) * 100);
        const color = step.color ?? (i === 0 ? "#0D2B45" : i === steps.length - 1 ? "#10B981" : "#1A6B6B");
        return (
          <div key={step.label} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#1A1A2E] font-medium">{step.label}</span>
              <span className="text-[#6B7280] font-medium tabular-nums">
                {step.value.toLocaleString()}
              </span>
            </div>
            <div className="h-6 bg-gray-100 rounded-lg overflow-hidden relative">
              <div
                className="h-full rounded-lg flex items-center px-2 transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: color }}
              >
                {pct >= 15 && (
                  <span className="text-xs font-medium" style={{ color: "#fff" }}>{pct}%</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
