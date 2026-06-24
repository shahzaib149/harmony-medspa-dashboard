"use client";

import Link from "next/link";
import type { AIInsight } from "@/lib/types";
import StatusBadge from "./StatusBadge";

interface InsightCardProps {
  insight: AIInsight;
  onDismiss?: (id: string) => void;
}

const categoryColors: Record<string, string> = {
  "Google Ads": "bg-blue-50 text-blue-700",
  "Lead Pipeline": "bg-purple-50 text-purple-700",
  Nurture: "bg-indigo-50 text-indigo-700",
  Reactivation: "bg-teal-50 text-teal-700",
  Rebooking: "bg-green-50 text-green-700",
};

export default function InsightCard({ insight, onDismiss }: InsightCardProps) {
  const priorityVariant = insight.priority.toLowerCase() as
    | "urgent"
    | "high"
    | "medium"
    | "low";

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge variant={priorityVariant} />
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              categoryColors[insight.category] ?? "bg-gray-100 text-gray-600"
            }`}
          >
            {insight.category}
          </span>
        </div>
        {onDismiss && (
          <button
            onClick={() => onDismiss(insight.id)}
            className="text-[#6B7280] hover:text-[#1A1A2E] text-sm leading-none p-1"
            aria-label="Dismiss"
          >
            ✕
          </button>
        )}
      </div>

      <h3 className="text-sm font-semibold text-[#1A1A2E] leading-snug">
        {insight.title}
      </h3>

      <p className="text-sm text-[#6B7280] leading-relaxed">{insight.body}</p>

      <Link
        href={insight.cta_route}
        className="mt-auto inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
        style={{ backgroundColor: "#1A6B6B" }}
      >
        {insight.cta_label}
      </Link>
    </div>
  );
}
