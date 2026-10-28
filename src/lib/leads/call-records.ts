import { DateTime } from "luxon";

// Inbound call opportunities live in the Airtable "Calls" table (leads base).
// Google Ads call details are imported by src/lib/leads/call-sync.ts; staff can
// correct Assessment, Kind and Area Code in Airtable without a deploy.

export type CallKind = "conversation" | "brief" | "out-of-state" | "hangup";

export type CallRecord = {
  id: string;
  date: string;
  time: string;
  occurredAt: string;
  areaCode: string;
  duration: number;
  assessment: string;
  kind: CallKind;
  missed?: boolean;
  source: string;
  line: string;
};

export type CallSourceId = string;

export type CallSource = {
  id: CallSourceId;
  label: string;
  line: string;
  range: string;
  calls: CallRecord[];
};

export const CALL_FIELDS = {
  id: "Call ID",
  occurredAt: "Occurred At",
  source: "Source",
  line: "Line",
  campaignId: "Campaign ID",
  areaCode: "Area Code",
  duration: "Duration",
  missed: "Missed",
  kind: "Kind",
  assessment: "Assessment",
  googleCall: "Google Call",
  origin: "Origin",
  importedAt: "Imported At",
} as const;

export const CALL_KINDS: CallKind[] = ["conversation", "brief", "out-of-state", "hangup"];
const CLINIC_ZONE = "America/New_York";
// Established sources keep their original order and ids, which existing lead markers rely on.
const SOURCE_ORDER = ["website", "cs2"];

export function callMarker(id: string) {
  return "[Call lead: " + id + "]";
}

export function callSourceId(label: string): CallSourceId {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "other";
}

function clinicTime(iso: string) {
  return DateTime.fromISO(iso, { setZone: true }).setZone(CLINIC_ZONE);
}

/** Maps an Airtable Calls row; returns null for rows missing an id or a valid time. */
export function mapCallRecord(record: { fields: Record<string, unknown> }): CallRecord | null {
  const f = record.fields;
  const id = String(f[CALL_FIELDS.id] ?? "").trim();
  const when = clinicTime(String(f[CALL_FIELDS.occurredAt] ?? ""));
  if (!id || !when.isValid) return null;
  const kind = String(f[CALL_FIELDS.kind] ?? "");
  const source = String(f[CALL_FIELDS.source] ?? "").trim() || "Other";
  return {
    id,
    date: when.toFormat("LLL d"),
    time: when.toFormat("h:mm a"),
    occurredAt: when.toISO({ suppressMilliseconds: true })!,
    areaCode: String(f[CALL_FIELDS.areaCode] ?? "").trim() || "Unknown",
    duration: Math.max(0, Math.round(Number(f[CALL_FIELDS.duration] ?? 0)) || 0),
    assessment: String(f[CALL_FIELDS.assessment] ?? "").trim() || "Unreviewed",
    kind: CALL_KINDS.includes(kind as CallKind) ? (kind as CallKind) : "brief",
    ...(f[CALL_FIELDS.missed] === true ? { missed: true } : {}),
    source,
    line: String(f[CALL_FIELDS.line] ?? "").trim() || source,
  };
}

/** "Aug 3–Sep 8, 2026" across the calls' clinic-local dates. */
export function formatCallRange(calls: CallRecord[]) {
  if (!calls.length) return "No calls yet";
  const times = calls.map((call) => clinicTime(call.occurredAt)).sort((a, b) => a.toMillis() - b.toMillis());
  const first = times[0];
  const last = times[times.length - 1];
  if (first.hasSame(last, "day")) return last.toFormat("LLL d, yyyy");
  if (first.hasSame(last, "year")) return `${first.toFormat("LLL d")}–${last.toFormat("LLL d, yyyy")}`;
  return `${first.toFormat("LLL d, yyyy")}–${last.toFormat("LLL d, yyyy")}`;
}

export function groupCallSources(calls: CallRecord[]): CallSource[] {
  const groups = new Map<CallSourceId, CallSource>();
  for (const call of calls) {
    const id = callSourceId(call.source);
    const group = groups.get(id) ?? { id, label: call.source, line: call.line, range: "", calls: [] };
    group.calls.push(call);
    groups.set(id, group);
  }
  const rank = (id: string) => (SOURCE_ORDER.includes(id) ? SOURCE_ORDER.indexOf(id) : SOURCE_ORDER.length);
  return [...groups.values()]
    .map((group) => ({ ...group, range: formatCallRange(group.calls) }))
    .sort((a, b) => rank(a.id) - rank(b.id) || a.label.localeCompare(b.label));
}

/** 1-based page holding the call when listed newest first, or null if it isn't listed. */
export function pageOfCall(calls: CallRecord[], id: string, pageSize: number) {
  const index = [...calls]
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
    .findIndex((call) => call.id === id);
  return index < 0 ? null : Math.floor(index / pageSize) + 1;
}

/** "Website and CS2", "Website, CS2 and Weight Loss". */
export function describeCallLines(sources: CallSource[]) {
  const labels = sources.map((source) => source.label);
  if (labels.length <= 1) return labels[0] ?? "No call sources";
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
}
