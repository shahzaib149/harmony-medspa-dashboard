"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  clinicToday,
  formatMonth,
  resolveDateRange,
  type DateRangeInput,
  type DatePresetKey,
} from "@/lib/date-range";

export type DateRangeFilterProps = {
  /** Current selection parsed from the URL (preset "all"/empty = no filter). */
  value: DateRangeInput;
  /** Called with the new selection once it is valid. */
  onChange: (selection: DateRangeInput) => void;
  /** Presets to offer, in display order. month/custom are always offered. */
  presets: readonly DatePresetKey[];
  allowAll?: boolean;
  maxDays?: number;
  /** "lg" matches the 44px header controls on Website Analytics. */
  size?: "md" | "lg";
  label?: string;
};

const PRESET_LABELS: Record<string, string> = {
  all: "All dates",
  today: "Today",
  "7": "Last 7 days",
  "14": "Last 14 days",
  "30": "Last 30 days",
  "90": "Last 90 days",
  "this-month": "This month",
  "last-month": "Last month",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PANEL_WIDTH = 520;
const MOBILE_QUERY = "(max-width: 639px)";

type Pane = "month" | "custom";

function triggerLabel(value: DateRangeInput, allowAll: boolean) {
  const preset = value.preset && value.preset !== "all" ? value.preset : allowAll ? "all" : "30";
  if (preset === "month" && value.month) return formatMonth(value.month);
  if (preset === "custom") {
    const result = resolveDateRange(value, { presets: ["custom"] });
    if (result?.ok) return result.range.label;
    return "Custom range";
  }
  return PRESET_LABELS[preset] ?? "All dates";
}

function MonthGrid({
  selected,
  onPick,
}: {
  selected: string | null;
  onPick: (month: string) => void;
}) {
  const today = clinicToday();
  const currentYear = Number(today.slice(0, 4));
  const currentMonth = today.slice(0, 7);
  const [year, setYear] = useState(() => Number((selected ?? currentMonth).slice(0, 4)));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setYear((y) => y - 1)}
          className="grid size-9 place-items-center rounded-lg border"
          style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
          aria-label="Previous year"
        >
          <ChevronLeft size={16} />
        </button>
        <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{year}</p>
        <button
          type="button"
          onClick={() => setYear((y) => y + 1)}
          disabled={year >= currentYear}
          className="grid size-9 place-items-center rounded-lg border disabled:opacity-30"
          style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
          aria-label="Next year"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2" role="grid" aria-label={`Months of ${year}`}>
        {MONTHS.map((name, index) => {
          const value = `${year}-${String(index + 1).padStart(2, "0")}`;
          const future = value > currentMonth;
          const active = value === selected;
          return (
            <button
              key={value}
              type="button"
              disabled={future}
              onClick={() => onPick(value)}
              aria-pressed={active}
              aria-label={formatMonth(value)}
              className="h-10 rounded-lg border text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-35"
              style={{
                borderColor: active ? "var(--brand-primary)" : "var(--border-subtle)",
                background: active ? "var(--brand-primary)" : "var(--surface-1)",
                color: active ? "var(--primary-foreground)" : "var(--text-primary)",
              }}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CustomRange({
  value,
  presets,
  maxDays,
  onApply,
}: {
  value: DateRangeInput;
  presets: readonly DatePresetKey[];
  maxDays?: number;
  onApply: (selection: DateRangeInput) => void;
}) {
  const today = clinicToday();
  const [from, setFrom] = useState(value.preset === "custom" ? value.from ?? "" : "");
  const [to, setTo] = useState(value.preset === "custom" ? value.to ?? "" : "");
  const [error, setError] = useState<string | null>(null);

  function apply() {
    const selection = { preset: "custom", from, to };
    const result = resolveDateRange(selection, { presets, maxDays });
    if (result && !result.ok) {
      setError(result.error);
      return;
    }
    onApply(selection);
  }

  const fieldClass = "h-11 w-full rounded-xl border px-3 text-sm font-semibold";
  const fieldStyle = { backgroundColor: "var(--surface-1)", borderColor: error ? "var(--danger-border)" : "var(--border-subtle)", color: "var(--text-primary)" };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="flex min-w-0 flex-col gap-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          From
          <input type="date" value={from} max={to || today} onChange={(event) => { setFrom(event.target.value); setError(null); }} className={fieldClass} style={fieldStyle} aria-label="From date" />
        </label>
        <label className="flex min-w-0 flex-col gap-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          To
          <input type="date" value={to} min={from || undefined} max={today} onChange={(event) => { setTo(event.target.value); setError(null); }} className={fieldClass} style={fieldStyle} aria-label="To date" />
        </label>
      </div>
      {error && (
        <p role="alert" className="rounded-lg px-3 py-2 text-xs font-semibold" style={{ color: "var(--danger-text)", background: "var(--danger-bg)" }}>
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={apply}
        disabled={!from || !to}
        className="h-11 rounded-xl text-sm font-bold disabled:opacity-50"
        style={{ backgroundColor: "var(--brand-primary)", color: "var(--primary-foreground)" }}
      >
        Apply range
      </button>
    </div>
  );
}

export default function DateRangeFilter({
  value,
  onChange,
  presets,
  allowAll = false,
  maxDays,
  size = "md",
  label = "Filter by date range",
}: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [pane, setPane] = useState<Pane>("month");
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const selected = value.preset && value.preset !== "all" ? value.preset : allowAll ? "all" : "30";
  const quick = [...(allowAll ? ["all"] : []), ...presets.filter((preset) => preset !== "month" && preset !== "custom")];
  const isFiltered = allowAll ? selected !== "all" : false;

  const place = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(PANEL_WIDTH, window.innerWidth - 16);
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
    const panelHeight = panelRef.current?.offsetHeight ?? 360;
    const below = rect.bottom + 8;
    const top = below + panelHeight > window.innerHeight - 8 && rect.top - panelHeight - 8 > 8
      ? rect.top - panelHeight - 8
      : below;
    setPosition({ top, left, width });
  }, []);

  function openPanel() {
    setPane(selected === "custom" ? "custom" : "month");
    setMobile(window.matchMedia(MOBILE_QUERY).matches);
    setOpen(true);
  }

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function pick(selection: DateRangeInput) {
    onChange(selection);
    close();
  }

  useLayoutEffect(() => {
    if (open && !mobile) place();
  }, [open, mobile, pane, place]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    // Capture so the Leads filter drawer doesn't also close on Escape.
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopImmediatePropagation();
      close();
    };
    const onLayout = () => (window.matchMedia(MOBILE_QUERY).matches ? setMobile(true) : (setMobile(false), place()));
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", onLayout);
    window.addEventListener("scroll", onLayout, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("resize", onLayout);
      window.removeEventListener("scroll", onLayout, true);
    };
  }, [open, place]); // eslint-disable-line react-hooks/exhaustive-deps

  const height = size === "lg" ? "min-h-11" : "h-10";

  const content = (
    <div className="flex flex-col sm:flex-row">
      <div className="flex flex-col gap-0.5 border-b p-2 sm:w-44 sm:shrink-0 sm:border-b-0 sm:border-r" style={{ borderColor: "var(--border-subtle)" }} role="listbox" aria-label="Quick ranges">
        <div className="grid grid-cols-2 gap-1 sm:flex sm:flex-col sm:gap-0.5">
          {quick.map((preset) => {
            const active = selected === preset;
            return (
              <button
                key={preset}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => pick({ preset })}
                className="flex min-h-10 items-center justify-between rounded-lg px-3 text-left text-xs font-semibold"
                style={{ background: active ? "var(--brand-primary-soft)" : "transparent", color: active ? "var(--brand-primary-strong)" : "var(--text-primary)" }}
              >
                {PRESET_LABELS[preset]}
                {active && <Check size={14} />}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex-1 p-4">
        <div className="mb-4 grid grid-cols-2 rounded-xl p-1" style={{ background: "var(--surface-2)" }} role="tablist">
          {(["month", "custom"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={pane === tab}
              onClick={() => setPane(tab)}
              className="h-9 rounded-lg text-xs font-bold"
              style={{ background: pane === tab ? "var(--surface-1)" : "transparent", color: pane === tab ? "var(--brand-primary-strong)" : "var(--text-muted)", boxShadow: pane === tab ? "var(--shadow-soft)" : "none" }}
            >
              {tab === "month" ? "Pick a month" : "Custom range"}
            </button>
          ))}
        </div>
        {pane === "month" ? (
          <MonthGrid selected={selected === "month" ? value.month ?? null : null} onPick={(month) => pick({ preset: "month", month })} />
        ) : (
          <CustomRange value={value} presets={presets} maxDays={maxDays} onApply={pick} />
        )}
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? close() : openPanel())}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={`${label}: ${triggerLabel(value, allowAll)}`}
        className={`relative flex ${height} min-w-[138px] flex-1 items-center gap-2 rounded-xl border px-3 pr-8 text-left text-xs font-semibold sm:flex-none`}
        style={{
          backgroundColor: isFiltered ? "var(--brand-primary-soft)" : "var(--surface-1)",
          borderColor: open || isFiltered ? "var(--brand-primary)" : "var(--border-subtle)",
          color: isFiltered ? "var(--brand-primary-strong)" : "var(--text-primary)",
        }}
      >
        <CalendarDays size={14} className="shrink-0" style={{ color: isFiltered ? "var(--brand-primary-strong)" : "var(--text-muted)" }} />
        <span className="truncate">{triggerLabel(value, allowAll)}</span>
        <ChevronDown size={14} className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: "var(--text-muted)" }} />
      </button>
      {open && typeof document !== "undefined" && createPortal(
        mobile ? (
          <div className="fixed inset-0 z-[100] flex items-end" role="presentation">
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
            <div
              ref={panelRef}
              id={panelId}
              role="dialog"
              aria-modal="true"
              aria-label={label}
              className="relative max-h-[88vh] w-full overflow-y-auto rounded-t-2xl border-t pb-[env(safe-area-inset-bottom)]"
              style={{ background: "var(--surface-1)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-modal)" }}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b px-4 py-3" style={{ background: "var(--surface-1)", borderColor: "var(--border-subtle)" }}>
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Date range</p>
                <button type="button" onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-lg" style={{ color: "var(--text-muted)" }} aria-label="Close date range">
                  <X size={18} />
                </button>
              </div>
              {content}
            </div>
          </div>
        ) : (
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-label={label}
            className="fixed z-[100] overflow-hidden rounded-2xl border"
            style={{
              top: position?.top ?? -9999,
              left: position?.left ?? -9999,
              width: position?.width ?? PANEL_WIDTH,
              background: "var(--surface-1)",
              borderColor: "var(--border-subtle)",
              boxShadow: "var(--shadow-modal)",
            }}
          >
            {content}
          </div>
        ),
        document.body,
      )}
    </>
  );
}
