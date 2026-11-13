import { DateTime } from "luxon";
import { CALL_SOURCE_ORDER, OTHER_GOOGLE_ADS, callBucket, campaignByCode } from "@/lib/google/campaign-registry";

// Inbound call opportunities live in the Airtable "Calls" table (leads base).
// Google Ads call details are imported by src/lib/leads/call-sync.ts; staff can
// correct Assessment, Kind and Area Code in Airtable without a deploy.

export type CallKind = "conversation" | "brief" | "out-of-state" | "hangup";

/** Where the caller's area code places them. Only the area code decides; a country code alone never does. */
export type CallRegion = "local" | "florida" | "out-of-state" | "unknown";

// Active Florida area codes (23, including the 324/448/645/656/728 overlays).
export const FLORIDA_AREA_CODES = new Set([
  "239", "305", "321", "324", "352", "386", "407", "448", "561", "645", "656", "689",
  "727", "728", "754", "772", "786", "813", "850", "863", "904", "941", "954",
]);
export const LOCAL_AREA_CODE = "941";

/**
 * Calls from this clinic-local date (ET) onward are flagged "Needs details" until
 * someone uses Add details. Older calls keep the Add details button but are left
 * out of the Needs details chip, counts, Attention Required and the reminder.
 */
export const NEEDS_DETAILS_FROM = "2026-11-01";

export function inNeedsDetailsWindow(call: { occurredAt: string }) {
  return call.occurredAt.slice(0, 10) >= NEEDS_DETAILS_FROM;
}

/** First three digits of a stored Area Code label ("813 · Tampa", "941", "Unknown"), or "". */
export function areaCodeOf(label: string | null | undefined) {
  return /^\s*(\d{3})(?!\d)/.exec(String(label ?? ""))?.[1] ?? "";
}

export function callRegion(areaLabel: string | null | undefined): CallRegion {
  const code = areaCodeOf(areaLabel);
  if (!code) return "unknown";
  if (code === LOCAL_AREA_CODE) return "local";
  return FLORIDA_AREA_CODES.has(code) ? "florida" : "out-of-state";
}

/** Duration-only chip, used when the region can't be what decides the call. */
export function durationAssessment(seconds: number, missed: boolean): { kind: CallKind; assessment: string } {
  if (missed) return { kind: "hangup", assessment: "Missed call" };
  if (seconds < 15) return { kind: "hangup", assessment: "Hangup" };
  if (seconds < 30) return { kind: "brief", assessment: "Brief" };
  if (seconds < 45) return { kind: "conversation", assessment: "Short but real" };
  if (seconds < 180) return { kind: "conversation", assessment: "Real conversation" };
  return { kind: "conversation", assessment: "Long conversation" };
}

/**
 * Stored Kind/Assessment are kept (staff may correct them in Airtable), except
 * an "Out of state" verdict on a call with no area code or a Florida one. The
 * import used to write that when Google sent a country code but no area code,
 * so it is re-derived from the duration instead.
 */
export function reconcileCallAssessment(input: {
  areaCode: string;
  kind: CallKind;
  assessment: string;
  duration: number;
  missed: boolean;
}): { kind: CallKind; assessment: string } {
  const claimsOutOfState = input.kind === "out-of-state" || /^out of state/i.test(input.assessment);
  if (claimsOutOfState && callRegion(input.areaCode) !== "out-of-state") {
    return durationAssessment(input.duration, input.missed);
  }
  return { kind: input.kind, assessment: input.assessment };
}

export type CallRecord = {
  id: string;
  date: string;
  time: string;
  occurredAt: string;
  areaCode: string;
  /** Derived from areaCode on read; never stored. */
  region: CallRegion;
  duration: number;
  assessment: string;
  kind: CallKind;
  missed?: boolean;
  /** Calls bucket: the campaign code ("CS2", "CS5", "Website"), "Other Google Ads", or a hand-entered Source. */
  source: string;
  line: string;
  /** Google Ads campaign ID when the import recorded one. */
  campaignId?: string;
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
// Bucket ids are slugs of the campaign code ("cs2", "website"), which existing lead markers
// and ?callSource= links rely on. Order: active campaigns, paused, ended, Other Google Ads.
const SOURCE_ORDER = [...CALL_SOURCE_ORDER, OTHER_GOOGLE_ADS].map((code) => callSourceId(code));

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
  const storedKind = String(f[CALL_FIELDS.kind] ?? "");
  // Campaign ID first (registry), then Source; unknown Google Ads campaigns → "Other Google Ads".
  const campaignId = String(f[CALL_FIELDS.campaignId] ?? "").trim();
  const bucket = callBucket({
    campaignId,
    source: String(f[CALL_FIELDS.source] ?? ""),
    googleAds: String(f[CALL_FIELDS.origin] ?? "") === "Google Ads sync" || Boolean(String(f[CALL_FIELDS.googleCall] ?? "").trim()),
  });
  const source = bucket.code;
  const areaCode = String(f[CALL_FIELDS.areaCode] ?? "").trim() || "Unknown";
  const duration = Math.max(0, Math.round(Number(f[CALL_FIELDS.duration] ?? 0)) || 0);
  const missed = f[CALL_FIELDS.missed] === true;
  const { kind, assessment } = reconcileCallAssessment({
    areaCode,
    duration,
    missed,
    kind: CALL_KINDS.includes(storedKind as CallKind) ? (storedKind as CallKind) : "brief",
    assessment: String(f[CALL_FIELDS.assessment] ?? "").trim() || "Unreviewed",
  });
  return {
    id,
    date: when.toFormat("LLL d"),
    time: when.toFormat("h:mm a"),
    occurredAt: when.toISO({ suppressMilliseconds: true })!,
    areaCode,
    region: callRegion(areaCode),
    duration,
    assessment,
    kind,
    ...(missed ? { missed: true } : {}),
    source,
    // Registry campaigns use the registry line; anything else keeps its stored Line.
    line: campaignByCode(source) ? bucket.line : String(f[CALL_FIELDS.line] ?? "").trim() || bucket.line,
    ...(campaignId ? { campaignId } : {}),
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

/**
 * Calls grouped by bucket. With `includeCampaigns`, every registry campaign gets a group even
 * with no calls yet (used for the Call Leads source filter, so CS5 is pickable before its
 * first call); other callers only see groups that have calls.
 */
export function groupCallSources(calls: CallRecord[], options: { includeCampaigns?: boolean } = {}): CallSource[] {
  const groups = new Map<CallSourceId, CallSource>();
  if (options.includeCampaigns) {
    for (const code of CALL_SOURCE_ORDER) {
      const campaign = campaignByCode(code)!;
      groups.set(callSourceId(code), { id: callSourceId(code), label: code, line: campaign.callLine, range: "", calls: [] });
    }
  }
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
