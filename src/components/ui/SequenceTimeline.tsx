import { MessageSquare, Mail, Zap } from "lucide-react";

interface TimelineStep {
  day: number;
  label: string;
  description: string;
  type: "sms" | "email" | "both";
  leadsCount: number;
}

const steps: TimelineStep[] = [
  { day: 1, label: "SMS Reminder", description: "Booking link + intro", type: "sms", leadsCount: 0 },
  { day: 3, label: "Treatment Email", description: "FAQ + results", type: "email", leadsCount: 0 },
  { day: 5, label: "Promo SMS", description: "Current offer", type: "sms", leadsCount: 0 },
  { day: 8, label: "Social Proof Email", description: "Reviews + trust", type: "email", leadsCount: 0 },
  { day: 12, label: "Urgency SMS", description: "Promo deadline", type: "sms", leadsCount: 0 },
  { day: 14, label: "Long-term Nurture", description: "Monthly list", type: "email", leadsCount: 0 },
];

interface SequenceTimelineProps {
  stepCounts?: number[];
}

export default function SequenceTimeline({ stepCounts = [] }: SequenceTimelineProps) {
  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-2">
      {steps.map((step, i) => {
        const count = stepCounts[i] ?? step.leadsCount;
        const Icon = step.type === "sms" ? MessageSquare : step.type === "email" ? Mail : Zap;

        return (
          <div key={step.day} className="flex items-center">
            <div className="flex flex-col items-center min-w-[120px]">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
                style={{ backgroundColor: "var(--healthy)" }}
              >
                <Icon size={18} style={{ color: "#fff" }} />
              </div>
              <p className="text-xs font-semibold text-[#1A1A2E] text-center">
                Day {step.day}
              </p>
              <p className="text-xs text-[#6B7280] text-center leading-tight">
                {step.label}
              </p>
              <p className="text-xs text-[#6B7280] text-center leading-tight">
                {step.description}
              </p>
              {count > 0 && (
                <span className="mt-1 bg-teal-100 text-teal-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  {count} here
                </span>
              )}
            </div>
            {i < steps.length - 1 && (
              <div className="w-8 h-px bg-[#E5E7EB] mx-1 mt-[-20px] flex-shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}
