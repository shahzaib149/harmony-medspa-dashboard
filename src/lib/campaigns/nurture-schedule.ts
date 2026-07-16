import { DateTime, IANAZone } from "luxon";

export const NURTURE_TIMEZONE = "America/New_York";

export interface NurtureScheduleInput {
  scheduledLocalDate: string;
  scheduledLocalTime: string;
  scheduledTimezone: string;
}

export interface NurtureSchedulePayload extends NurtureScheduleInput {
  scheduledAtUtc: string;
}

export interface NurtureSchedule extends NurtureSchedulePayload {
  confirmationText: string;
}

export interface ScheduleOptions {
  now?: Date;
  requireFuture?: boolean;
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})$/;

export class NurtureScheduleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NurtureScheduleError";
  }
}

function parseWallClock(input: NurtureScheduleInput) {
  const dateMatch = DATE_PATTERN.exec(input.scheduledLocalDate);
  const timeMatch = TIME_PATTERN.exec(input.scheduledLocalTime);

  if (!dateMatch) {
    throw new NurtureScheduleError("Select a valid First Send Date.");
  }
  if (!timeMatch) {
    throw new NurtureScheduleError("Select a valid First Send Time.");
  }
  if (!IANAZone.isValidZone(input.scheduledTimezone)) {
    throw new NurtureScheduleError("The campaign timezone is invalid.");
  }

  const local = DateTime.fromObject(
    {
      year: Number(dateMatch[1]),
      month: Number(dateMatch[2]),
      day: Number(dateMatch[3]),
      hour: Number(timeMatch[1]),
      minute: Number(timeMatch[2]),
      second: 0,
      millisecond: 0,
    },
    { zone: input.scheduledTimezone },
  );

  if (!local.isValid) {
    throw new NurtureScheduleError("The selected campaign date and time are invalid.");
  }

  // Luxon advances nonexistent spring-forward times. Reject that normalization
  // instead of silently scheduling at a different wall-clock time.
  if (
    local.toFormat("yyyy-MM-dd") !== input.scheduledLocalDate ||
    local.toFormat("HH:mm") !== input.scheduledLocalTime
  ) {
    throw new NurtureScheduleError(
      "That time does not exist because daylight saving time begins. Select a different time.",
    );
  }

  // A fall-back wall-clock time maps to two instants. Requiring a different
  // time avoids choosing an offset the user never explicitly selected.
  if (local.getPossibleOffsets().length > 1) {
    throw new NurtureScheduleError(
      "That time occurs twice because daylight saving time ends. Select a different time.",
    );
  }

  return local;
}

function parseInstant(scheduledAtUtc: string) {
  const instant = DateTime.fromISO(scheduledAtUtc, { setZone: true });
  if (!instant.isValid) {
    throw new NurtureScheduleError("The scheduled UTC time is invalid.");
  }
  return instant;
}

export function formatScheduledInstant(
  scheduledAtUtc: string,
  scheduledTimezone: string,
) {
  if (!IANAZone.isValidZone(scheduledTimezone)) {
    throw new NurtureScheduleError("The campaign timezone is invalid.");
  }
  return parseInstant(scheduledAtUtc)
    .setZone(scheduledTimezone)
    .setLocale("en-US")
    .toFormat("LLL d, yyyy 'at' h:mm a ZZZZ");
}

export function formatViewerLocalInstant(
  scheduledAtUtc: string,
  viewerTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
) {
  if (!IANAZone.isValidZone(viewerTimezone)) {
    throw new NurtureScheduleError("The viewer timezone is invalid.");
  }
  return formatScheduledInstant(scheduledAtUtc, viewerTimezone);
}

export function createNurtureSchedule(
  input: NurtureScheduleInput,
  options: ScheduleOptions = {},
): NurtureSchedule {
  const local = parseWallClock(input);
  const scheduledAtUtc = local.toUTC().toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");

  if (options.requireFuture) {
    const now = options.now?.getTime() ?? Date.now();
    if (local.toMillis() <= now) {
      throw new NurtureScheduleError("First Send At must be in the future.");
    }
  }

  return {
    ...input,
    scheduledAtUtc,
    confirmationText: formatScheduledInstant(
      scheduledAtUtc,
      input.scheduledTimezone,
    ),
  };
}

export function toNurtureSchedulePayload(
  schedule: NurtureSchedule,
): NurtureSchedulePayload {
  return {
    scheduledAtUtc: schedule.scheduledAtUtc,
    scheduledTimezone: schedule.scheduledTimezone,
    scheduledLocalDate: schedule.scheduledLocalDate,
    scheduledLocalTime: schedule.scheduledLocalTime,
  };
}

export function validateNurtureSchedulePayload(
  payload: Partial<NurtureSchedulePayload>,
  options: ScheduleOptions = {},
) {
  if (
    typeof payload.scheduledAtUtc !== "string" ||
    typeof payload.scheduledTimezone !== "string" ||
    typeof payload.scheduledLocalDate !== "string" ||
    typeof payload.scheduledLocalTime !== "string"
  ) {
    throw new NurtureScheduleError("The enrollment schedule is incomplete.");
  }
  if (!payload.scheduledAtUtc.endsWith("Z")) {
    throw new NurtureScheduleError("The scheduled time must be submitted as UTC.");
  }

  const schedule = createNurtureSchedule(
    {
      scheduledLocalDate: payload.scheduledLocalDate,
      scheduledLocalTime: payload.scheduledLocalTime,
      scheduledTimezone: payload.scheduledTimezone,
    },
    options,
  );
  const submitted = parseInstant(payload.scheduledAtUtc);

  if (submitted.toMillis() !== parseInstant(schedule.scheduledAtUtc).toMillis()) {
    throw new NurtureScheduleError(
      "The submitted UTC time does not match the selected campaign time.",
    );
  }

  return schedule;
}

export function nurtureScheduleInputFromUtc(
  scheduledAtUtc: string,
  scheduledTimezone: string,
): NurtureScheduleInput {
  if (!IANAZone.isValidZone(scheduledTimezone)) {
    throw new NurtureScheduleError("The campaign timezone is invalid.");
  }
  const local = parseInstant(scheduledAtUtc).setZone(scheduledTimezone);
  return {
    scheduledLocalDate: local.toFormat("yyyy-MM-dd"),
    scheduledLocalTime: local.toFormat("HH:mm"),
    scheduledTimezone,
  };
}
