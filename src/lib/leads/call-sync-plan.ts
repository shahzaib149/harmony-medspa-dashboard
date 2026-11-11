import { DateTime } from "luxon";
import {
  CALL_FIELDS,
  FLORIDA_AREA_CODES,
  LOCAL_AREA_CODE,
  callSourceId,
  durationAssessment,
  type CallKind,
} from "./call-records";

export { FLORIDA_AREA_CODES };

// Matched by campaign ID so a renamed campaign keeps its source and call ids.
export const KNOWN_CALL_CAMPAIGNS: Record<string, { source: string; line: string; prefix: string }> = {
  "24080482948": { source: "Website", line: "Website new", prefix: "web" },
  "24134330302": { source: "CS2", line: "CS2", prefix: "cs2" },
  // Launched 2026-11-10; see src/lib/google/campaign-registry.ts.
  "24452301491": { source: "CS3", line: "CS3", prefix: "cs3" },
  "24452305673": { source: "CS4", line: "CS4", prefix: "cs4" },
  "24447046761": { source: "CS5", line: "CS5", prefix: "cs5" },
};

export type IncomingCall = {
  googleCall: string;
  occurredAt: string;
  durationSeconds: number;
  missed: boolean;
  areaCode: string;
  countryCode: string;
  campaignId: string;
  campaignName: string;
};

export type ExistingCall = {
  recordId: string;
  id: string;
  occurredAt: string;
  duration: number;
  googleCall: string;
};

export type CallSyncPlan = {
  create: Record<string, unknown>[];
  link: { recordId: string; id: string; googleCall: string }[];
  unchanged: number;
};

// The Make "Daily Call Import" scenario repeats these rules in its Classification
// module (automation/make/README-daily-call-import.md); change both together.
export function classifyCall(call: Pick<IncomingCall, "durationSeconds" | "missed" | "areaCode" | "countryCode">): {
  kind: CallKind;
  assessment: string;
  areaLabel: string;
} {
  // Only the area code decides the region. Google sends caller_country_code "1"
  // (or "US") for domestic calls, often with no area code at all; a country code
  // alone must never make a call "Out of state".
  const code = /^\d{3}$/.test(call.areaCode.trim()) ? call.areaCode.trim() : "";
  const country = call.countryCode.trim().toUpperCase();
  const foreign = Boolean(country) && !["1", "+1", "US"].includes(country);
  const inFlorida = FLORIDA_AREA_CODES.has(code);
  const areaLabel = !code ? "Unknown" : code === LOCAL_AREA_CODE ? code : inFlorida ? `${code} · Florida` : foreign ? `${code} · ${country}` : code;
  const seconds = call.durationSeconds;
  if (call.missed) return { ...durationAssessment(seconds, true), areaLabel };
  if (code && !inFlorida) {
    return { kind: "out-of-state", assessment: seconds >= 60 ? "Out of state, but long" : "Out of state", areaLabel };
  }
  return { ...durationAssessment(seconds, false), areaLabel };
}

/** Google Ads reports call times as "yyyy-MM-dd HH:mm:ss" in the account's time zone. */
export function googleCallTime(value: string, accountTimeZone: string) {
  const time = DateTime.fromFormat(value, "yyyy-MM-dd HH:mm:ss", { zone: accountTimeZone || "America/New_York" });
  return time.isValid ? time.setZone("America/New_York").toISO({ suppressMilliseconds: true }) : null;
}

function sourceFor(call: IncomingCall) {
  const known = KNOWN_CALL_CAMPAIGNS[call.campaignId];
  if (known) return known;
  const name = call.campaignName.trim() || `Campaign ${call.campaignId}`;
  return { source: name, line: name, prefix: callSourceId(name) };
}

/**
 * Decides what an import writes. Calls already carrying their Google id are left
 * alone, so staff edits to Assessment, Kind or Area Code are never overwritten.
 * Calls entered by hand before the import are claimed by start time (±60s) and
 * duration (±2s) rather than duplicated, keeping their ids and lead markers.
 */
export function planCallSync(existing: ExistingCall[], incoming: IncomingCall[], importedAt: string): CallSyncPlan {
  const known = new Set(existing.map((call) => call.googleCall).filter(Boolean));
  const unclaimed = existing.filter((call) => !call.googleCall);
  const ids = new Set(existing.map((call) => call.id));
  const plan: CallSyncPlan = { create: [], link: [], unchanged: 0 };

  for (const call of [...incoming].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))) {
    if (known.has(call.googleCall)) { plan.unchanged += 1; continue; }
    known.add(call.googleCall);
    const start = Date.parse(call.occurredAt);
    const match = unclaimed.find((item) =>
      Math.abs(Date.parse(item.occurredAt) - start) <= 60_000 && Math.abs(item.duration - call.durationSeconds) <= 2);
    if (match) {
      unclaimed.splice(unclaimed.indexOf(match), 1);
      plan.link.push({ recordId: match.recordId, id: match.id, googleCall: call.googleCall });
      continue;
    }

    const source = sourceFor(call);
    const stamp = DateTime.fromISO(call.occurredAt, { setZone: true }).setZone("America/New_York").toFormat("yyyy-MM-dd-HHmm");
    let id = `${source.prefix}-${stamp}`;
    for (let n = 2; ids.has(id); n += 1) id = `${source.prefix}-${stamp}-${n}`;
    ids.add(id);
    const { kind, assessment, areaLabel } = classifyCall(call);
    plan.create.push({
      [CALL_FIELDS.id]: id,
      [CALL_FIELDS.occurredAt]: call.occurredAt,
      [CALL_FIELDS.source]: source.source,
      [CALL_FIELDS.line]: source.line,
      [CALL_FIELDS.campaignId]: call.campaignId,
      [CALL_FIELDS.areaCode]: areaLabel,
      [CALL_FIELDS.duration]: call.durationSeconds,
      [CALL_FIELDS.missed]: call.missed,
      [CALL_FIELDS.kind]: kind,
      [CALL_FIELDS.assessment]: assessment,
      [CALL_FIELDS.googleCall]: call.googleCall,
      [CALL_FIELDS.origin]: "Google Ads sync",
      [CALL_FIELDS.importedAt]: importedAt,
    });
  }
  return plan;
}
