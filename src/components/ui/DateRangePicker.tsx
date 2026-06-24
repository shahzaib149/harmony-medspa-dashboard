"use client";

import type { DateRangeOption } from "@/lib/types";

interface DateRangePickerProps {
  value: DateRangeOption;
  onChange: (v: DateRangeOption) => void;
}

const options: { label: string; value: DateRangeOption }[] = [
  { label: "Last 7 days", value: "7" },
  { label: "Last 14 days", value: "14" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
];

export default function DateRangePicker({
  value,
  onChange,
}: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            value === o.value
              ? "bg-white text-[#1A1A2E] shadow-sm"
              : "text-[#6B7280] hover:text-[#1A1A2E]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
