import {
  isClinicDay,
  resolveDateRange,
  type DatePresetKey,
  type DateRangeInput,
  type ResolvedDateRange,
} from "@/lib/date-range";
import { reportingDateRange } from "@/lib/google/ads-normalization";

export const ADS_DATE_PRESETS = [
  "7",
  "14",
  "30",
  "90",
  "this-month",
  "last-month",
  "month",
  "custom",
] as const satisfies readonly DatePresetKey[];

export const ADS_MAX_DAYS = 366;

/** Page URL → picker selection. `range` selects the preset; legacy `days=7` links still work. */
export function adsSelection(params: URLSearchParams): DateRangeInput {
  return {
    preset: params.get("range") || params.get("days") || "30",
    month: params.get("month"),
    from: params.get("from"),
    to: params.get("to"),
  };
}

/** Resolved Google Ads range; an invalid or unknown selection falls back to 30 days. */
export function resolveAdsRange(
  params: URLSearchParams,
  now?: Parameters<typeof resolveDateRange>[1]["now"],
): ResolvedDateRange {
  const options = { presets: ADS_DATE_PRESETS, maxDays: ADS_MAX_DAYS, now };
  const result = resolveDateRange(adsSelection(params), options);
  if (result?.ok) return result.range;
  const fallback = resolveDateRange({ preset: "30" }, options);
  return (fallback as { ok: true; range: ResolvedDateRange }).range;
}

/** Query params sent to the Google Ads / Airtable APIs. */
export function adsRangeQuery(range: { from: string; to: string; days: number }) {
  return `days=${range.days}&from=${range.from}&to=${range.to}`;
}

/** Server side: explicit from/to when valid, otherwise the legacy `days` window. */
export function adsReportingRange(params: URLSearchParams) {
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  if (isClinicDay(from) && isClinicDay(to) && from <= to) return { from, to };
  return reportingDateRange(Number(params.get("days") ?? 30));
}
