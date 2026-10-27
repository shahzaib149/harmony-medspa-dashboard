import {
  MONTH_VALUE,
  resolveDateRange,
  type DatePresetKey,
  type DateRangeInput,
  type ResolvedDateRange,
} from "@/lib/date-range";

export const OVERVIEW_DATE_PRESETS = [
  "7",
  "30",
  "90",
  "this-month",
  "last-month",
  "month",
  "custom",
] as const satisfies readonly DatePresetKey[];

export const OVERVIEW_MAX_DAYS = 366;

const LEGACY_DAYS: Record<string, string> = { "7d": "7", "30d": "30", "90d": "90" };

/**
 * Overview URL → picker selection. Keeps the original `range=7d|30d|90d|month`
 * links working (`range=month` without a month param means this month).
 */
export function overviewSelection(params: URLSearchParams): DateRangeInput {
  const range = params.get("range") || params.get("period") || "30d";
  const month = params.get("month");
  if (LEGACY_DAYS[range]) return { preset: LEGACY_DAYS[range] };
  if (range === "month" && !MONTH_VALUE.test(month ?? "")) return { preset: "this-month" };
  return { preset: range, month, from: params.get("from"), to: params.get("to") };
}

export function resolveOverviewRange(
  params: URLSearchParams,
  now?: Parameters<typeof resolveDateRange>[1]["now"],
): ResolvedDateRange {
  const options = { presets: OVERVIEW_DATE_PRESETS, maxDays: OVERVIEW_MAX_DAYS, now };
  const result = resolveDateRange(overviewSelection(params), options);
  if (result?.ok) return result.range;
  return (resolveDateRange({ preset: "30" }, options) as { ok: true; range: ResolvedDateRange }).range;
}

/** Canonical query string for a selection; also the cache key. */
export function overviewQuery(selection: DateRangeInput) {
  const preset = selection.preset ?? "30";
  if (preset === "7" || preset === "30" || preset === "90") return `range=${preset}d`;
  if (preset === "month") return `range=month&month=${selection.month ?? ""}`;
  if (preset === "custom") return `range=custom&from=${selection.from ?? ""}&to=${selection.to ?? ""}`;
  return `range=${preset}`;
}

/** Canonical query for whatever the URL asks for (invalid selections become 30 days). */
export function overviewQueryFromParams(params: URLSearchParams) {
  const range = resolveOverviewRange(params);
  return overviewQuery({ preset: range.preset, month: range.from.slice(0, 7), from: range.from, to: range.to });
}
