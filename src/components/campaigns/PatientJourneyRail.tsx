import { Check, Mail, MessageSquare } from "lucide-react";
import type { NurtureEnrollment } from "@/lib/types/campaigns";

const STEPS = [
  "Day 1 SMS",
  "Day 3 Email",
  "Day 5 SMS",
  "Day 8 Email",
  "Day 12 SMS",
  "Completed",
];

export default function PatientJourneyRail({
  enrollments,
}: {
  enrollments: NurtureEnrollment[];
}) {
  const steps = STEPS.map((step) => ({
    step,
    count: enrollments.filter((item) =>
      step === "Completed"
        ? item.status === "Completed"
        : item.status === "Active" && item.currentStep === step,
    ).length,
    Icon:
      step === "Completed"
        ? Check
        : step.includes("SMS")
          ? MessageSquare
          : Mail,
  }));

  return (
    <section
      aria-labelledby="journey-title"
      className="rounded-2xl border border-[#C9A84C]/15 bg-[#111117] p-4 sm:p-5"
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#C9A84C]">
            Patient journey
          </p>
          <h2
            id="journey-title"
            className="mt-1 font-serif text-xl text-[#F0ECE4]"
          >
            14-day communication rail
          </h2>
        </div>
        <p className="hidden text-xs text-[#7F8997] sm:block">
          Current enrollment position
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:hidden">
        {steps.map(({ step, count, Icon }, index) => (
          <div
            key={step}
            className={`flex min-w-0 items-center gap-3 rounded-xl border border-white/[.06] bg-black/15 p-3 ${index === steps.length - 1 ? "col-span-2" : ""}`}
          >
            <div
              className="grid size-10 shrink-0 place-items-center rounded-full border"
              style={{
                borderColor: count
                  ? "rgba(78,205,196,.65)"
                  : "rgba(201,168,76,.22)",
                color: count ? "#4ECDC4" : "#8B8B98",
              }}
            >
              <Icon size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-[#F0ECE4]">{count}</p>
              <p className="text-[9px] font-bold uppercase leading-4 tracking-[.05em] text-[#9292A0]">
                {step}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 hidden overflow-x-auto pb-2 sm:block">
        <div className="relative flex min-w-[760px] items-start justify-between">
          <div className="absolute left-[7%] right-[7%] top-6 h-px bg-gradient-to-r from-[#C9A84C]/25 via-[#4ECDC4]/45 to-[#4ECDC4]/20" />
          {steps.map(({ step, count, Icon }, index) => (
            <div
              key={step}
              className="relative z-10 flex w-28 flex-col items-center text-center"
            >
              <div
                className="flex size-12 items-center justify-center rounded-full border bg-[#0A0A0D]"
                style={{
                  borderColor: count
                    ? "rgba(78,205,196,.65)"
                    : "rgba(201,168,76,.22)",
                  color: count ? "#4ECDC4" : "#8B8B98",
                  boxShadow: count
                    ? "0 0 0 5px var(--surface-1),0 0 20px rgba(78,205,196,.12)"
                    : "0 0 0 5px var(--surface-1)",
                }}
              >
                <Icon size={16} />
              </div>
              <p className="mt-3 text-2xl font-bold text-[#F0ECE4]">{count}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[.08em] text-[#9292A0]">
                {step}
              </p>
              {index < steps.length - 1 && count > 0 ? (
                <span className="mt-2 size-1 rounded-full bg-[#4ECDC4] motion-safe:animate-pulse" />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
