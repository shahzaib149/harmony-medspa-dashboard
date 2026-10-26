"use client";

import { useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import {
  clinicToday,
  resolveDateRange,
  type DateRangeInput,
  type DatePresetKey,
} from "@/lib/date-range";

type Variant = "select" | "segmented";

export type DateRangeFilterProps = {
  /** Current selection parsed from the URL (preset "all"/empty = no filter). */
  value: DateRangeInput;
  /** Called with the new selection once it is valid. */
  onChange: (selection: DateRangeInput) => void;
  /** Presets to offer, in display order. month/custom are always offered. */
  presets: readonly DatePresetKey[];
  allowAll?: boolean;
  maxDays?: number;
  variant?: Variant;
  label?: string;
};

const PRESET_LABELS: Record<string, string> = {
  today: "Today",
  "7": "Last 7 days",
  "14": "Last 14 days",
  "30": "Last 30 days",
  "90": "Last 90 days",
  "this-month": "This month",
  "last-month": "Last month",
};

const SHORT_LABELS: Record<string, string> = {
  "7": "7d",
  "14": "14d",
  "30": "30d",
  "90": "90d",
  "this-month": "This month",
  "last-month": "Last month",
};

const MONTH_OPTION = "month";
const CUSTOM_OPTION = "custom";

const inputStyle = {
  backgroundColor: "var(--surface-1)",
  borderColor: "var(--border-subtle)",
  color: "var(--text-primary)",
} as const;

function RangeDetail({
  mode,
  value,
  onChange,
  presets,
  maxDays,
}: {
  mode: "month" | "custom";
  value: DateRangeInput;
  onChange: (selection: DateRangeInput) => void;
  presets: readonly DatePresetKey[];
  maxDays?: number;
}) {
  const today = clinicToday();
  const [month, setMonth] = useState(value.month ?? today.slice(0, 7));
  const [from, setFrom] = useState(value.from ?? "");
  const [to, setTo] = useState(value.to ?? "");
  const [error, setError] = useState<string | null>(null);
  const options = { presets, maxDays };

  function apply(selection: DateRangeInput) {
    const result = resolveDateRange(selection, options);
    if (result && !result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    onChange(selection);
  }

  return (
    <div className="col-span-full flex w-full basis-full flex-wrap items-end gap-2" role="group" aria-label={mode === "month" ? "Choose month" : "Custom date range"}>
      {mode === "month" ? (
        <label className="flex flex-col gap-1 text-[11px] font-bold" style={{ color: "var(--text-muted)" }}>
          Month
          <input
            type="month"
            value={month}
            max={today.slice(0, 7)}
            onChange={(event) => {
              setMonth(event.target.value);
              if (event.target.value) apply({ preset: "month", month: event.target.value });
            }}
            className="h-10 rounded-xl border px-3 text-xs font-semibold"
            style={inputStyle}
            aria-label="Month"
          />
        </label>
      ) : (
        <>
          <label className="flex flex-col gap-1 text-[11px] font-bold" style={{ color: "var(--text-muted)" }}>
            From
            <input
              type="date"
              value={from}
              max={to || today}
              onChange={(event) => setFrom(event.target.value)}
              className="h-10 rounded-xl border px-3 text-xs font-semibold"
              style={inputStyle}
              aria-label="From date"
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-bold" style={{ color: "var(--text-muted)" }}>
            To
            <input
              type="date"
              value={to}
              min={from || undefined}
              max={today}
              onChange={(event) => setTo(event.target.value)}
              className="h-10 rounded-xl border px-3 text-xs font-semibold"
              style={inputStyle}
              aria-label="To date"
            />
          </label>
          <button
            type="button"
            onClick={() => apply({ preset: "custom", from, to })}
            className="h-10 rounded-xl px-4 text-xs font-bold"
            style={{ backgroundColor: "var(--brand-primary)", color: "var(--on-brand, #fff)" }}
          >
            Apply
          </button>
        </>
      )}
      {error && (
        <p role="alert" className="w-full text-[11px] font-semibold" style={{ color: "var(--danger-text, #b42318)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default function DateRangeFilter({
  value,
  onChange,
  presets,
  allowAll = false,
  maxDays,
  variant = "select",
  label = "Filter by date range",
}: DateRangeFilterProps) {
  const selected = value.preset && value.preset !== "all" ? value.preset : allowAll ? "all" : "";
  // month/custom picked from the menu but not yet applied.
  const [draftMode, setDraftMode] = useState<"month" | "custom" | null>(null);
  const mode =
    draftMode ?? (selected === MONTH_OPTION || selected === CUSTOM_OPTION ? selected : null);
  const quick = presets.filter((preset) => preset !== MONTH_OPTION && preset !== CUSTOM_OPTION);

  function choose(next: string) {
    if (next === MONTH_OPTION || next === CUSTOM_OPTION) {
      setDraftMode(next);
      return;
    }
    setDraftMode(null);
    onChange({ preset: next });
  }

  function applied(selection: DateRangeInput) {
    setDraftMode(null);
    onChange(selection);
  }

  const detail = mode ? (
    <RangeDetail
      key={`${mode}:${value.month ?? ""}:${value.from ?? ""}:${value.to ?? ""}`}
      mode={mode}
      value={value}
      onChange={applied}
      presets={presets}
      maxDays={maxDays}
    />
  ) : null;

  if (variant === "segmented") {
    const active = mode ?? selected;
    return (
      <>
        <div className="flex min-h-11 flex-1 flex-wrap items-center rounded-xl border p-1 sm:flex-none" style={{ borderColor: "var(--border-subtle)", background: "var(--surface-2)" }} role="group" aria-label={label}>
          <CalendarDays size={13} className="ml-2" style={{ color: "var(--text-muted)" }} />
          {[...quick, MONTH_OPTION, CUSTOM_OPTION].map((preset) => {
            const on = active === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => choose(preset)}
                aria-pressed={on}
                className="min-h-9 min-w-10 flex-1 whitespace-nowrap rounded-lg px-2 text-[11px] font-bold sm:flex-none"
                style={{ background: on ? "var(--surface-1)" : "transparent", color: on ? "var(--brand-primary-strong)" : "var(--text-muted)", boxShadow: on ? "var(--shadow-soft)" : "none" }}
              >
                {preset === MONTH_OPTION ? "Month" : preset === CUSTOM_OPTION ? "Custom" : SHORT_LABELS[preset] ?? PRESET_LABELS[preset]}
              </button>
            );
          })}
        </div>
        {detail}
      </>
    );
  }

  const selectValue = mode ?? selected;
  return (
    <>
      <label className="relative min-w-[138px] flex-1 sm:flex-none">
        <span className="sr-only">{label}</span>
        <select
          value={selectValue}
          onChange={(event) => choose(event.target.value)}
          className="h-10 w-full appearance-none rounded-xl border px-3 pr-8 text-xs font-semibold"
          style={inputStyle}
          aria-label={label}
        >
          {allowAll && <option value="all">All dates</option>}
          {quick.map((preset) => (
            <option key={preset} value={preset}>{PRESET_LABELS[preset]}</option>
          ))}
          <option value={MONTH_OPTION}>Pick a month…</option>
          <option value={CUSTOM_OPTION}>Custom range…</option>
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--text-muted)" }}
        />
      </label>
      {detail}
    </>
  );
}
