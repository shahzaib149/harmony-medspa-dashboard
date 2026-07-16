import { memo } from "react";

const STEPS = [
  "Day 1 SMS",
  "Day 3 Email",
  "Day 5 SMS",
  "Day 8 Email",
  "Day 12 SMS",
] as const;

function CompactJourneyProgress({
  currentStep,
  status,
  sentSteps = [],
}: {
  currentStep: string;
  status: string;
  sentSteps?: string[];
}) {
  const current = STEPS.indexOf(currentStep as typeof STEPS[number]);
  const completed = status === "Completed";
  const stopped = status === "Stopped";
  const confirmedSent = new Set(sentSteps);

  return (
    <div
      className="min-w-[190px]"
      aria-label={
        completed
          ? "Nurture completed"
          : stopped
            ? `Nurture stopped at ${currentStep || "unknown step"}`
            : `Current nurture step: ${currentStep || "unknown"}`
      }
    >
      <div className="flex items-center">
        {STEPS.map((step, index) => {
          const sent = completed || (index !== current && confirmedSent.has(step));
          return <div key={step} className="flex flex-1 items-center last:flex-none">
            <span
              title={step}
              className="h-2.5 w-2.5 shrink-0 rounded-full border transition-colors motion-reduce:transition-none"
              style={{
                backgroundColor:
                  sent
                    ? "var(--healthy)"
                    : index === current
                      ? "var(--brand-primary)"
                      : "var(--surface-2)",
                borderColor: stopped && index >= current
                  ? "rgba(201, 85, 93, 0.55)"
                  : sent
                    ? "var(--healthy)"
                    : index === current
                      ? "var(--brand-primary)"
                      : "var(--border-subtle)",
                boxShadow:
                  index === current && !stopped
                    ? "0 0 0 3px var(--border-subtle)"
                    : "none",
              }}
            />
            {index < STEPS.length - 1 && (
              <span
                className="h-px flex-1"
                style={{
                  backgroundColor:
                    sent
                      ? "color-mix(in srgb, var(--healthy) 60%, transparent)"
                      : stopped && index >= current
                        ? "rgba(201,85,93,0.35)"
                        : "color-mix(in srgb, var(--border-subtle) 80%, transparent)",
                }}
              />
            )}
          </div>;
        })}
      </div>
      <p
        className="mt-2 text-[10px] font-bold"
        style={{
          color: stopped
            ? "var(--danger)"
            : completed
              ? "var(--healthy)"
              : "var(--text-secondary)",
        }}
      >
        {completed
          ? "Completed"
          : stopped
            ? `Stopped${currentStep ? ` · ${currentStep}` : ""}`
            : currentStep || "Step unavailable"}
      </p>
    </div>
  );
}

export default memo(CompactJourneyProgress);
