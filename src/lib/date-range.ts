import { DateTime } from "luxon";
import { CLINIC_TIME_ZONE } from "@/lib/date-time";

/**
 * Shared date-range selection for the Leads tab and Website Analytics.
 * All calendar days are clinic-local (America/New_York) YYYY-MM-DD strings and
 * both ends are inclusive.
 *
 * URL shape (the preset param name differs per page, the rest is shared):
 *   <preset>=today | 7 | 14 | 30 | 90 | this-month | last-month | month | custom
 *   month=YYYY-MM          (with preset=month)
 *   from=YYYY-MM-DD&to=YYYY-MM-DD   (with preset=custom)
 */

export type DatePresetKey =
  | "today"
  | "7"
  | "14"
  | "30"
  | "90"
  | "this-month"
  | "last-month"
  | "month"
  | "custom";

export type DateRangeInput = {
  preset?: string | null;
  month?: string | null;
  from?: string | null;
  to?: string | null;
};

export type ResolvedDateRange = {
  preset: DatePresetKey;
  /** Inclusive clinic-local start day. */
  from: string;
  /** Inclusive clinic-local end day (never later than today). */
  to: string;
  /** Number of calendar days covered. */
  days: number;
  label: string;
};

export type DateRangeResult =
  | { ok: true; range: ResolvedDateRange }
  | { ok: false; error: string };

export type DateRangeOptions = {
  /** Presets that may be used (month / custom handled separately). */
  presets: readonly DatePresetKey[];
  /** Longest span allowed, in days. */
  maxDays?: number;
  now?: DateTime;
};

export const MONTH_VALUE = /^\d{4}-(0[1-9]|1[0-2])$/;
const DAY_VALUE = /^\d{4}-\d{2}-\d{2}$/;

const PRESET_LABELS: Record<string, string> = {
  today: "Today",
  "7": "Last 7 days",
  "14": "Last 14 days",
  "30": "Last 30 days",
  "90": "Last 90 days",
  "this-month": "This month",
  "last-month": "Last month",
};

function clinicNow(now?: DateTime) {
  return (now ?? DateTime.now()).setZone(CLINIC_TIME_ZONE);
}

export function clinicToday(now?: DateTime) {
  return clinicNow(now).toISODate()!;
}

function parseDay(value: string | null | undefined) {
  if (!value || !DAY_VALUE.test(value)) return null;
  const parsed = DateTime.fromISO(value, { zone: CLINIC_TIME_ZONE });
  return parsed.isValid && parsed.toISODate() === value ? parsed : null;
}

export function dayCount(from: string, to: string) {
  const start = parseDay(from);
  const end = parseDay(to);
  if (!start || !end) return 0;
  return Math.round(end.diff(start, "days").days) + 1;
}

export function formatDay(value: string) {
  const parsed = parseDay(value);
  return parsed ? parsed.toFormat("MMM d, yyyy") : value;
}

export function formatMonth(value: string) {
  const parsed = DateTime.fromISO(`${value}-01`, { zone: CLINIC_TIME_ZONE });
  return parsed.isValid ? parsed.toFormat("MMMM yyyy") : value;
}

export function formatRangeLabel(from: string, to: string) {
  return from === to ? formatDay(from) : `${formatDay(from)} – ${formatDay(to)}`;
}

function build(
  preset: DatePresetKey,
  from: string,
  to: string,
  label: string,
  maxDays?: number,
): DateRangeResult {
  const days = dayCount(from, to);
  if (maxDays && days > maxDays) {
    return { ok: false, error: `Choose a range of ${maxDays} days or fewer.` };
  }
  return { ok: true, range: { preset, from, to, days, label } };
}

/**
 * Resolve a URL/UI selection into concrete clinic-local start/end days.
 * Returns `null` when no preset is selected (caller applies its own default,
 * e.g. "All dates" for leads or 30 days for analytics).
 */
export function resolveDateRange(
  input: DateRangeInput,
  options: DateRangeOptions,
): DateRangeResult | null {
  const preset = input.preset?.trim();
  if (!preset || preset === "all") return null;

  const now = clinicNow(options.now);
  const today = now.toISODate()!;

  if (preset === "today") {
    if (!options.presets.includes("today")) return null;
    return build("today", today, today, PRESET_LABELS.today, options.maxDays);
  }

  if (preset === "7" || preset === "14" || preset === "30" || preset === "90") {
    if (!options.presets.includes(preset)) return null;
    const from = now.minus({ days: Number(preset) - 1 }).toISODate()!;
    return build(preset, from, today, PRESET_LABELS[preset], options.maxDays);
  }

  if (preset === "this-month") {
    if (!options.presets.includes("this-month")) return null;
    return build(
      "this-month",
      now.startOf("month").toISODate()!,
      today,
      PRESET_LABELS["this-month"],
      options.maxDays,
    );
  }

  if (preset === "last-month") {
    if (!options.presets.includes("last-month")) return null;
    const lastMonth = now.minus({ months: 1 });
    return build(
      "last-month",
      lastMonth.startOf("month").toISODate()!,
      lastMonth.endOf("month").toISODate()!,
      PRESET_LABELS["last-month"],
      options.maxDays,
    );
  }

  if (preset === "month") {
    if (!options.presets.includes("month")) return null;
    const month = input.month?.trim() ?? "";
    if (!MONTH_VALUE.test(month)) return { ok: false, error: "Choose a month." };
    const start = DateTime.fromISO(`${month}-01`, { zone: CLINIC_TIME_ZONE });
    const from = start.toISODate()!;
    if (from > today) return { ok: false, error: "That month hasn't started yet." };
    // The current month is partial; stop at today.
    const to = start.endOf("month").toISODate()! > today ? today : start.endOf("month").toISODate()!;
    return build("month", from, to, formatMonth(month), options.maxDays);
  }

  if (preset === "custom") {
    if (!options.presets.includes("custom")) return null;
    const from = input.from?.trim() ?? "";
    const to = input.to?.trim() ?? "";
    if (!parseDay(from) || !parseDay(to)) {
      return { ok: false, error: "Enter both a start and end date." };
    }
    if (from > to) return { ok: false, error: "Start date must be on or before the end date." };
    if (to > today) return { ok: false, error: "End date can't be in the future." };
    return build("custom", from, to, formatRangeLabel(from, to), options.maxDays);
  }

  return null;
}

/** Query-string updates that represent a selection (null deletes the param). */
export function dateRangeParams(
  presetParam: string,
  selection: DateRangeInput,
): Record<string, string | null> {
  const preset = selection.preset && selection.preset !== "all" ? selection.preset : null;
  return {
    [presetParam]: preset,
    month: preset === "month" ? selection.month ?? null : null,
    from: preset === "custom" ? selection.from ?? null : null,
    to: preset === "custom" ? selection.to ?? null : null,
  };
}

/** The equal-length window immediately before `range` (for period-over-period deltas). */
export function previousRange(range: { from: string; to: string }) {
  const days = dayCount(range.from, range.to);
  const start = parseDay(range.from)!;
  const to = start.minus({ days: 1 });
  const from = to.minus({ days: days - 1 });
  return { from: from.toISODate()!, to: to.toISODate()! };
}

/**
 * Clinic-local day boundaries as UTC instants: [start, endExclusive).
 * Used for filtering timestamps (Airtable "Lead Created At") by clinic days.
 */
export function clinicRangeToUtc(from: string, to: string) {
  const start = parseDay(from);
  const end = parseDay(to);
  if (!start || !end) return null;
  return {
    start: start.startOf("day").toUTC(),
    endExclusive: end.plus({ days: 1 }).startOf("day").toUTC(),
  };
}
