import assert from "node:assert/strict";
import test from "node:test";
import {
  createNurtureSchedule,
  formatViewerLocalInstant,
  NURTURE_TIMEZONE,
  nurtureScheduleInputFromUtc,
  toNurtureSchedulePayload,
  validateNurtureSchedulePayload,
} from "../src/lib/campaigns/nurture-schedule";

const newYorkInput = {
  scheduledLocalDate: "2026-07-15",
  scheduledLocalTime: "16:00",
  scheduledTimezone: NURTURE_TIMEZONE,
};

test("New York wall-clock input produces the expected confirmation and UTC instant", () => {
  const schedule = createNurtureSchedule(newYorkInput);

  assert.equal(schedule.confirmationText, "Jul 15, 2026 at 4:00 PM EDT");
  assert.equal(schedule.scheduledAtUtc, "2026-07-15T20:00:00.000Z");
  assert.equal(
    formatViewerLocalInstant(schedule.scheduledAtUtc, "Asia/Karachi"),
    "Jul 16, 2026 at 1:00 AM GMT+5",
  );
});

test("browser timezone never changes the campaign schedule", () => {
  const originalTimezone = process.env.TZ;
  try {
    for (const timezone of ["Asia/Karachi", "America/New_York", "UTC"]) {
      process.env.TZ = timezone;
      const schedule = createNurtureSchedule(newYorkInput);
      assert.equal(schedule.confirmationText, "Jul 15, 2026 at 4:00 PM EDT");
      assert.equal(schedule.scheduledAtUtc, "2026-07-15T20:00:00.000Z");
    }
  } finally {
    process.env.TZ = originalTimezone;
  }
});

test("a wall-clock time near midnight crosses the UTC date only once", () => {
  const schedule = createNurtureSchedule({
    scheduledLocalDate: "2026-12-31",
    scheduledLocalTime: "23:30",
    scheduledTimezone: NURTURE_TIMEZONE,
  });

  assert.equal(schedule.confirmationText, "Dec 31, 2026 at 11:30 PM EST");
  assert.equal(schedule.scheduledAtUtc, "2027-01-01T04:30:00.000Z");
});

test("nonexistent and ambiguous daylight-saving wall-clock times are rejected", () => {
  assert.throws(
    () =>
      createNurtureSchedule({
        scheduledLocalDate: "2026-03-08",
        scheduledLocalTime: "02:30",
        scheduledTimezone: NURTURE_TIMEZONE,
      }),
    /does not exist because daylight saving time begins/,
  );
  assert.throws(
    () =>
      createNurtureSchedule({
        scheduledLocalDate: "2026-11-01",
        scheduledLocalTime: "01:30",
        scheduledTimezone: NURTURE_TIMEZONE,
      }),
    /occurs twice because daylight saving time ends/,
  );
});

test("invalid calendar values, timezones, and past schedules are rejected", () => {
  assert.throws(
    () =>
      createNurtureSchedule({
        scheduledLocalDate: "2026-02-30",
        scheduledLocalTime: "16:00",
        scheduledTimezone: NURTURE_TIMEZONE,
      }),
    /invalid/,
  );
  assert.throws(
    () =>
      createNurtureSchedule({
        ...newYorkInput,
        scheduledTimezone: "America/Not_A_Zone",
      }),
    /timezone is invalid/,
  );
  assert.throws(
    () =>
      createNurtureSchedule(newYorkInput, {
        now: new Date("2026-07-15T20:00:00.001Z"),
        requireFuture: true,
      }),
    /must be in the future/,
  );
});

test("the API payload and Airtable instant come from the confirmation schedule", () => {
  const schedule = createNurtureSchedule(newYorkInput);
  const payload = toNurtureSchedulePayload(schedule);

  assert.deepEqual(payload, {
    scheduledAtUtc: "2026-07-15T20:00:00.000Z",
    scheduledTimezone: "America/New_York",
    scheduledLocalDate: "2026-07-15",
    scheduledLocalTime: "16:00",
  });
  assert.equal(validateNurtureSchedulePayload(payload).scheduledAtUtc, payload.scheduledAtUtc);
  assert.throws(
    () =>
      validateNurtureSchedulePayload({
        ...payload,
        scheduledAtUtc: "2026-07-15T21:00:00.000Z",
      }),
    /does not match the selected campaign time/,
  );
});

test("reopening a stored UTC schedule restores New York date and time inputs", () => {
  assert.deepEqual(
    nurtureScheduleInputFromUtc("2026-07-15T20:00:00.000Z", NURTURE_TIMEZONE),
    newYorkInput,
  );
});
