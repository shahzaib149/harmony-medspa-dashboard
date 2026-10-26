import {
  previousRange,
  resolveDateRange,
  type DatePresetKey,
  type DateRangeResult,
} from "@/lib/date-range";

export const ANALYTICS_DATE_PRESETS = [
  "7",
  "14",
  "30",
  "90",
  "this-month",
  "last-month",
  "month",
  "custom",
] as const satisfies readonly DatePresetKey[];

export const ANALYTICS_MAX_DAYS = 366;
export const ANALYTICS_DEFAULT_PRESET = "30";

/**
 * Website Analytics range from query params. `range` selects the preset;
 * the legacy `days=7` links keep working. Invalid input is an error rather
 * than a silent fallback so a bad shared link is visible.
 */
export function resolveAnalyticsRange(
  params: URLSearchParams,
  now?: Parameters<typeof resolveDateRange>[1]["now"],
): DateRangeResult {
  const preset =
    params.get("range") || params.get("days") || ANALYTICS_DEFAULT_PRESET;
  const result = resolveDateRange(
    {
      preset,
      month: params.get("month"),
      from: params.get("from"),
      to: params.get("to"),
    },
    { presets: ANALYTICS_DATE_PRESETS, maxDays: ANALYTICS_MAX_DAYS, now },
  );
  return result ?? defaultAnalyticsRange(now);
}

export function defaultAnalyticsRange(
  now?: Parameters<typeof resolveDateRange>[1]["now"],
): DateRangeResult {
  return resolveDateRange(
    { preset: ANALYTICS_DEFAULT_PRESET },
    { presets: ANALYTICS_DATE_PRESETS, now },
  )!;
}

/** Current range plus the equal-length window immediately before it. */
export function dateRanges(range: { from: string; to: string }) {
  const previous = previousRange(range);
  return {
    current: { start: range.from, end: range.to },
    previous: { start: previous.from, end: previous.to },
  };
}
