import assert from "node:assert/strict";
import test from "node:test";
import {
  clinicDateToUtcRange,
  clinicDateValue,
  formatClinicDate,
  formatClinicDateTime,
  formatClinicRelativeTime,
  formatClinicTime,
} from "../src/lib/date-time";

test("clinic timestamps are independent of the browser/device timezone", () => {
  const originalTimeZone = process.env.TZ;
  const values = [
    "Asia/Karachi",
    "America/New_York",
    "UTC",
    "America/Los_Angeles",
  ].map((timeZone) => {
    process.env.TZ = timeZone;
    return {
      date: formatClinicDate("2026-07-17T07:27:00.000Z"),
      time: formatClinicTime("2026-07-17T07:27:00.000Z"),
      dateTime: formatClinicDateTime("2026-07-17T07:27:00.000Z"),
    };
  });
  process.env.TZ = originalTimeZone;

  assert.deepEqual(values.slice(1), [values[0], values[0], values[0]]);
  assert.equal(values[0].date, "Jul 17, 2026");
  assert.match(values[0].time, /3:27 AM EDT/);
});

test("clinic formatting derives EST and EDT from Intl", () => {
  assert.match(
    formatClinicDateTime("2026-01-17T08:27:00.000Z"),
    /Jan 17, 2026.*3:27 AM EST/,
  );
  assert.match(
    formatClinicDateTime("2026-07-17T07:27:00.000Z"),
    /Jul 17, 2026.*3:27 AM EDT/,
  );
});

test("clinic date boundaries convert to UTC without changing the stored instant", () => {
  const winter = clinicDateToUtcRange("2026-01-17");
  const summer = clinicDateToUtcRange("2026-07-17");

  assert.equal(winter?.start.toISOString(), "2026-01-17T05:00:00.000Z");
  assert.equal(
    winter?.endExclusive.toISOString(),
    "2026-01-18T05:00:00.000Z",
  );
  assert.equal(summer?.start.toISOString(), "2026-07-17T04:00:00.000Z");
  assert.equal(
    summer?.endExclusive.toISOString(),
    "2026-07-18T04:00:00.000Z",
  );
});

test("clinic date boundaries follow daylight-saving transitions", () => {
  const springForward = clinicDateToUtcRange("2026-03-08");
  const fallBack = clinicDateToUtcRange("2026-11-01");

  assert.equal(
    springForward?.start.toISOString(),
    "2026-03-08T05:00:00.000Z",
  );
  assert.equal(
    springForward?.endExclusive.toISOString(),
    "2026-03-09T04:00:00.000Z",
  );
  assert.equal(
    Number(springForward?.endExclusive) - Number(springForward?.start),
    23 * 60 * 60 * 1_000,
  );

  assert.equal(fallBack?.start.toISOString(), "2026-11-01T04:00:00.000Z");
  assert.equal(
    fallBack?.endExclusive.toISOString(),
    "2026-11-02T05:00:00.000Z",
  );
  assert.equal(
    Number(fallBack?.endExclusive) - Number(fallBack?.start),
    25 * 60 * 60 * 1_000,
  );
});

test("relative time compares UTC instants and clinic date values use New York", () => {
  assert.equal(
    formatClinicRelativeTime(
      "2026-07-17T05:00:00.000Z",
      "2026-07-17T07:00:00.000Z",
    ),
    "2 hours ago",
  );
  assert.equal(clinicDateValue("2026-07-17T02:30:00.000Z"), "2026-07-16");
});
