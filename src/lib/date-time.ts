export const CLINIC_TIME_ZONE = "America/New_York";

type DateValue = Date | string | number;

const clinicDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: CLINIC_TIME_ZONE,
  month: "short",
  day: "numeric",
  year: "numeric",
});

const clinicTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: CLINIC_TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});

const clinicDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: CLINIC_TIME_ZONE,
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});

const clinicDatePartsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: CLINIC_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const clinicOffsetFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: CLINIC_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

const relativeTimeFormatter = new Intl.RelativeTimeFormat("en-US", {
  numeric: "auto",
});

function toDate(value: DateValue) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function partsRecord(formatter: Intl.DateTimeFormat, value: Date) {
  return Object.fromEntries(
    formatter
      .formatToParts(value)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
}

export function formatClinicDate(value: DateValue) {
  const date = toDate(value);
  return date ? clinicDateFormatter.format(date) : "—";
}

export function formatClinicTime(value: DateValue) {
  const date = toDate(value);
  return date ? clinicTimeFormatter.format(date) : "—";
}

export function formatClinicDateTime(value: DateValue) {
  const date = toDate(value);
  return date ? clinicDateTimeFormatter.format(date) : "—";
}

export function formatClinicRelativeTime(
  value: DateValue,
  now: DateValue = Date.now(),
) {
  const date = toDate(value);
  const current = toDate(now);
  if (!date || !current) return "—";

  const seconds = (date.getTime() - current.getTime()) / 1_000;
  const absoluteSeconds = Math.abs(seconds);
  const [amount, unit]: [number, Intl.RelativeTimeFormatUnit] =
    absoluteSeconds < 60
      ? [seconds, "second"]
      : absoluteSeconds < 3_600
        ? [seconds / 60, "minute"]
        : absoluteSeconds < 86_400
          ? [seconds / 3_600, "hour"]
          : [seconds / 86_400, "day"];

  return relativeTimeFormatter.format(Math.round(amount), unit);
}

export function clinicDateValue(value: DateValue = Date.now()) {
  const date = toDate(value);
  if (!date) return "";
  const parts = partsRecord(clinicDatePartsFormatter, date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function parseCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

export function isClinicDateValue(value: string) {
  return Boolean(parseCalendarDate(value));
}

function timeZoneOffsetAt(value: Date) {
  const parts = partsRecord(clinicOffsetFormatter, value);
  const representedAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  const valueWithoutMilliseconds =
    Math.floor(value.getTime() / 1_000) * 1_000;
  return representedAsUtc - valueWithoutMilliseconds;
}

function clinicMidnightToUtc(year: number, month: number, day: number) {
  const intendedWallTime = Date.UTC(year, month - 1, day);
  let utcGuess = intendedWallTime;

  // Re-evaluate the offset at the resulting instant so DST is handled by the
  // timezone database rather than by a fixed EST/EDT offset.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const corrected =
      intendedWallTime - timeZoneOffsetAt(new Date(utcGuess));
    if (corrected === utcGuess) break;
    utcGuess = corrected;
  }

  return new Date(utcGuess);
}

export function clinicDateToUtcRange(value: string) {
  const date = parseCalendarDate(value);
  if (!date) return null;

  const nextCalendarDay = new Date(
    Date.UTC(date.year, date.month - 1, date.day + 1),
  );
  return {
    start: clinicMidnightToUtc(date.year, date.month, date.day),
    endExclusive: clinicMidnightToUtc(
      nextCalendarDay.getUTCFullYear(),
      nextCalendarDay.getUTCMonth() + 1,
      nextCalendarDay.getUTCDate(),
    ),
  };
}
