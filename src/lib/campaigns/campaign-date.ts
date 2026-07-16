export const CAMPAIGN_TIME_ZONE = "America/New_York";

const campaignDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: CAMPAIGN_TIME_ZONE,
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});

const campaignDateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: CAMPAIGN_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

type DateInput = string | number | Date | null | undefined;

function parsedDate(value: DateInput) {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatCampaignDate(value: DateInput, fallback = "—") {
  const date = parsedDate(value);
  if (!date) return value ? String(value) : fallback;
  return campaignDateFormatter.format(date);
}

export function campaignDateKey(value: DateInput) {
  const date = parsedDate(value);
  if (!date) return null;

  const parts = campaignDateKeyFormatter.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;
  const year = part("year"),
    month = part("month"),
    day = part("day");

  return year && month && day ? `${year}-${month}-${day}` : null;
}

export function isCampaignDateToday(
  value: DateInput,
  now: DateInput = Date.now(),
) {
  const valueKey = campaignDateKey(value);
  return Boolean(valueKey && valueKey === campaignDateKey(now));
}
