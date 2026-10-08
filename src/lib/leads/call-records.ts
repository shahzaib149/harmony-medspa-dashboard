export type CallRecord = {
  id: string;
  date: string;
  time: string;
  occurredAt: string;
  areaCode: string;
  duration: number;
  assessment: string;
  kind: "conversation" | "brief" | "out-of-state" | "hangup";
  missed?: boolean;
};

export type CallSourceId = "website" | "cs2";

export type CallSource = {
  id: CallSourceId;
  label: string;
  line: string;
  range: string;
  calls: CallRecord[];
};

const CS2_CALLS: CallRecord[] = [
  { id: "cs2-2026-08-31-1306", date: "Aug 31", time: "1:06 PM", occurredAt: "2026-08-31T13:06:00-04:00", areaCode: "941", duration: 49, assessment: "Real conversation", kind: "conversation" },
  { id: "cs2-2026-09-01-1512", date: "Sep 1", time: "3:12 PM", occurredAt: "2026-09-01T15:12:00-04:00", areaCode: "941", duration: 30, assessment: "Short but real", kind: "conversation" },
  { id: "cs2-2026-09-02-1113", date: "Sep 2", time: "11:13 AM", occurredAt: "2026-09-02T11:13:00-04:00", areaCode: "330 · Ohio", duration: 87, assessment: "Out of state, but long", kind: "out-of-state" },
  { id: "cs2-2026-09-07-0958", date: "Sep 7", time: "9:58 AM", occurredAt: "2026-09-07T09:58:00-04:00", areaCode: "941", duration: 70, assessment: "Real conversation", kind: "conversation" },
  { id: "cs2-2026-09-07-1344", date: "Sep 7", time: "1:44 PM", occurredAt: "2026-09-07T13:44:00-04:00", areaCode: "Unknown", duration: 10, assessment: "Hangup / wrong number", kind: "hangup" },
  { id: "cs2-2026-09-08-0930", date: "Sep 8", time: "9:30 AM", occurredAt: "2026-09-08T09:30:00-04:00", areaCode: "941", duration: 20, assessment: "Brief", kind: "brief" },
  { id: "cs2-2026-09-08-1146", date: "Sep 8", time: "11:46 AM", occurredAt: "2026-09-08T11:46:00-04:00", areaCode: "Unknown", duration: 12, assessment: "Hangup", kind: "hangup" },
  { id: "cs2-2026-09-09-0918", date: "Sep 9", time: "9:18 AM", occurredAt: "2026-09-09T09:18:00-04:00", areaCode: "707 · California", duration: 28, assessment: "Out of state", kind: "out-of-state" },
  { id: "cs2-2026-09-11-1559", date: "Sep 11", time: "3:59 PM", occurredAt: "2026-09-11T15:59:00-04:00", areaCode: "941", duration: 203, assessment: "Long conversation", kind: "conversation" },
  { id: "cs2-2026-09-14-1211", date: "Sep 14", time: "12:11 PM", occurredAt: "2026-09-14T12:11:00-04:00", areaCode: "Unknown", duration: 0, assessment: "Missed call", kind: "hangup", missed: true },
  { id: "cs2-2026-09-15-1401", date: "Sep 15", time: "2:01 PM", occurredAt: "2026-09-15T14:01:00-04:00", areaCode: "252 · North Carolina", duration: 61, assessment: "Out of state", kind: "out-of-state" },
  { id: "cs2-2026-09-18-0953", date: "Sep 18", time: "9:53 AM", occurredAt: "2026-09-18T09:53:00-04:00", areaCode: "941", duration: 38, assessment: "Short but real", kind: "conversation" },
  { id: "cs2-2026-09-21-1034", date: "Sep 21", time: "10:34 AM", occurredAt: "2026-09-21T10:34:00-04:00", areaCode: "732 · Central New Jersey", duration: 106, assessment: "Out of state, but long", kind: "out-of-state" },
  { id: "cs2-2026-09-21-1113", date: "Sep 21", time: "11:13 AM", occurredAt: "2026-09-21T11:13:00-04:00", areaCode: "404 · Atlanta", duration: 17, assessment: "Out of state", kind: "out-of-state" },
  { id: "cs2-2026-10-02-0921", date: "Oct 2", time: "9:21 AM", occurredAt: "2026-10-02T09:21:00-04:00", areaCode: "941", duration: 41, assessment: "Brief", kind: "brief" },
  { id: "cs2-2026-10-02-0933", date: "Oct 2", time: "9:33 AM", occurredAt: "2026-10-02T09:33:00-04:00", areaCode: "281 · Texas", duration: 31, assessment: "Out of state", kind: "out-of-state" },
  { id: "cs2-2026-10-05-0940", date: "Oct 5", time: "9:40 AM", occurredAt: "2026-10-05T09:40:00-04:00", areaCode: "Unknown", duration: 12, assessment: "Brief", kind: "brief" },
  { id: "cs2-2026-10-05-1243", date: "Oct 5", time: "12:43 PM", occurredAt: "2026-10-05T12:43:00-04:00", areaCode: "Unknown", duration: 0, assessment: "Missed call", kind: "hangup", missed: true },
  { id: "cs2-2026-10-06-1320", date: "Oct 6", time: "1:20 PM", occurredAt: "2026-10-06T13:20:00-04:00", areaCode: "630 · Illinois", duration: 18, assessment: "Out of state", kind: "out-of-state" },
  { id: "cs2-2026-10-06-1342", date: "Oct 6", time: "1:42 PM", occurredAt: "2026-10-06T13:42:00-04:00", areaCode: "727 · Florida", duration: 44, assessment: "Brief", kind: "brief" },
  { id: "cs2-2026-10-07-1130", date: "Oct 7", time: "11:30 AM", occurredAt: "2026-10-07T11:30:00-04:00", areaCode: "941", duration: 18, assessment: "Brief", kind: "brief" },
];

// Website tracking line. Calls from other Florida area codes count as in-state.
const WEBSITE_CALLS: CallRecord[] = [
  { id: "web-2026-08-03-0925", date: "Aug 3", time: "9:25 AM", occurredAt: "2026-08-03T09:25:00-04:00", areaCode: "Unknown", duration: 0, assessment: "Missed call", kind: "hangup", missed: true },
  { id: "web-2026-08-03-0940", date: "Aug 3", time: "9:40 AM", occurredAt: "2026-08-03T09:40:00-04:00", areaCode: "941", duration: 52, assessment: "Real conversation", kind: "conversation" },
  { id: "web-2026-08-04-1211", date: "Aug 4", time: "12:11 PM", occurredAt: "2026-08-04T12:11:00-04:00", areaCode: "941", duration: 303, assessment: "Long conversation", kind: "conversation" },
  { id: "web-2026-08-04-1405", date: "Aug 4", time: "2:05 PM", occurredAt: "2026-08-04T14:05:00-04:00", areaCode: "813 · Tampa", duration: 101, assessment: "Real conversation", kind: "conversation" },
  { id: "web-2026-08-05-1425", date: "Aug 5", time: "2:25 PM", occurredAt: "2026-08-05T14:25:00-04:00", areaCode: "941", duration: 76, assessment: "Real conversation", kind: "conversation" },
  { id: "web-2026-08-06-1728", date: "Aug 6", time: "5:28 PM", occurredAt: "2026-08-06T17:28:00-04:00", areaCode: "203 · Connecticut", duration: 77, assessment: "Out of state, but long", kind: "out-of-state" },
  { id: "web-2026-08-07-1243", date: "Aug 7", time: "12:43 PM", occurredAt: "2026-08-07T12:43:00-04:00", areaCode: "207 · Maine", duration: 54, assessment: "Out of state", kind: "out-of-state" },
  { id: "web-2026-08-07-1522", date: "Aug 7", time: "3:22 PM", occurredAt: "2026-08-07T15:22:00-04:00", areaCode: "941", duration: 99, assessment: "Real conversation", kind: "conversation" },
  { id: "web-2026-08-10-1358", date: "Aug 10", time: "1:58 PM", occurredAt: "2026-08-10T13:58:00-04:00", areaCode: "941", duration: 35, assessment: "Short but real", kind: "conversation" },
  { id: "web-2026-08-10-1401", date: "Aug 10", time: "2:01 PM", occurredAt: "2026-08-10T14:01:00-04:00", areaCode: "941", duration: 40, assessment: "Real conversation", kind: "conversation" },
  { id: "web-2026-08-13-1448", date: "Aug 13", time: "2:48 PM", occurredAt: "2026-08-13T14:48:00-04:00", areaCode: "610 · Pennsylvania", duration: 66, assessment: "Out of state, but long", kind: "out-of-state" },
  { id: "web-2026-08-14-1342", date: "Aug 14", time: "1:42 PM", occurredAt: "2026-08-14T13:42:00-04:00", areaCode: "941", duration: 70, assessment: "Real conversation", kind: "conversation" },
  { id: "web-2026-08-17-0912", date: "Aug 17", time: "9:12 AM", occurredAt: "2026-08-17T09:12:00-04:00", areaCode: "610 · Pennsylvania", duration: 24, assessment: "Out of state", kind: "out-of-state" },
  { id: "web-2026-08-17-0918", date: "Aug 17", time: "9:18 AM", occurredAt: "2026-08-17T09:18:00-04:00", areaCode: "941", duration: 19, assessment: "Brief", kind: "brief" },
  { id: "web-2026-08-18-0921", date: "Aug 18", time: "9:21 AM", occurredAt: "2026-08-18T09:21:00-04:00", areaCode: "850 · Florida", duration: 77, assessment: "Real conversation", kind: "conversation" },
  { id: "web-2026-08-19-1232", date: "Aug 19", time: "12:32 PM", occurredAt: "2026-08-19T12:32:00-04:00", areaCode: "941", duration: 1166, assessment: "Long conversation", kind: "conversation" },
  { id: "web-2026-08-20-0806", date: "Aug 20", time: "8:06 AM", occurredAt: "2026-08-20T08:06:00-04:00", areaCode: "Unknown", duration: 0, assessment: "Hangup", kind: "hangup" },
  { id: "web-2026-08-20-0806-2", date: "Aug 20", time: "8:06 AM", occurredAt: "2026-08-20T08:06:00-04:00", areaCode: "267 · Pennsylvania", duration: 16, assessment: "Out of state", kind: "out-of-state" },
  { id: "web-2026-08-21-0909", date: "Aug 21", time: "9:09 AM", occurredAt: "2026-08-21T09:09:00-04:00", areaCode: "941", duration: 42, assessment: "Real conversation", kind: "conversation" },
  { id: "web-2026-08-25-1303", date: "Aug 25", time: "1:03 PM", occurredAt: "2026-08-25T13:03:00-04:00", areaCode: "941", duration: 52, assessment: "Real conversation", kind: "conversation" },
  { id: "web-2026-08-31-0946", date: "Aug 31", time: "9:46 AM", occurredAt: "2026-08-31T09:46:00-04:00", areaCode: "561 · Florida", duration: 33, assessment: "Short but real", kind: "conversation" },
  { id: "web-2026-08-31-1529", date: "Aug 31", time: "3:29 PM", occurredAt: "2026-08-31T15:29:00-04:00", areaCode: "732 · New Jersey", duration: 92, assessment: "Out of state, but long", kind: "out-of-state" },
  { id: "web-2026-09-01-1633", date: "Sep 1", time: "4:33 PM", occurredAt: "2026-09-01T16:33:00-04:00", areaCode: "941", duration: 37, assessment: "Short but real", kind: "conversation" },
  { id: "web-2026-09-08-1201", date: "Sep 8", time: "12:01 PM", occurredAt: "2026-09-08T12:01:00-04:00", areaCode: "Unknown", duration: 11, assessment: "Hangup", kind: "hangup" },
];

export const CALL_SOURCES: CallSource[] = [
  { id: "website", label: "Website", line: "Website new", range: "Aug 3–Sep 8, 2026", calls: WEBSITE_CALLS },
  { id: "cs2", label: "CS2", line: "CS2", range: "Aug 31–Oct 7, 2026", calls: CS2_CALLS },
];

export const ALL_CALLS = CALL_SOURCES.flatMap((source) => source.calls);

export function callMarker(id: string) {
  return "[Call lead: " + id + "]";
}
