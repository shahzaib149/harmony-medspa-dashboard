"use client";

import type { Lead } from "@/lib/types";

interface LeadCardProps {
  lead: Lead;
  onClick: (lead: Lead) => void;
}

const sourceLabels: Record<string, string> = {
  google_ads: "Google Ad",
  website_form: "Website Form",
  referral: "Referral",
  returning: "Returning",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function LeadCard({ lead, onClick }: LeadCardProps) {
  const stlSecs = lead.speed_to_lead_seconds ?? null;
  const stlGood = stlSecs !== null && stlSecs <= 60;
  const stlBad = stlSecs !== null && stlSecs > 300;

  return (
    <div
      className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-4 cursor-pointer hover:shadow-md hover:border-[#1A6B6B]/30 transition-all duration-150"
      onClick={() => onClick(lead)}
    >
      <div className="flex items-start justify-between mb-2">
        <p className="font-semibold text-sm text-[#1A1A2E]">{lead.name}</p>
        {stlSecs !== null && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              stlGood
                ? "bg-green-50 text-green-700"
                : stlBad
                ? "bg-red-50 text-red-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {stlSecs < 60 ? `${stlSecs}s` : `${Math.round(stlSecs / 60)}m`}
          </span>
        )}
      </div>

      <p className="text-xs text-[#6B7280] mb-1">
        {sourceLabels[lead.source] ?? lead.source}
      </p>

      <p className="text-xs font-medium text-[#1A1A2E] mb-3">
        {lead.treatment_interest}
      </p>

      <div className="flex items-center justify-between text-xs text-[#6B7280]">
        <span>{timeAgo(lead.created_at)}</span>
        {lead.last_touch_at && (
          <span>Last touch {timeAgo(lead.last_touch_at)}</span>
        )}
      </div>
    </div>
  );
}
