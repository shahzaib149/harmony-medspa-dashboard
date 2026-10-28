import { DateTime } from "luxon";
import { CALL_FIELDS, callSourceId, type CallKind } from "./call-records";

// Active Florida area codes (23, including the 324/448/645/656/728 overlays).
export const FLORIDA_AREA_CODES = new Set([
  "239", "305", "321", "324", "352", "386", "407", "448", "561", "645", "656", "689",
  "727", "728", "754", "772", "786", "813", "850", "863", "904", "941", "954",
]);
const LOCAL_AREA_CODE = "941";

// Matched by campaign ID so a renamed campaign keeps its source and call ids.
export const KNOWN_CALL_CAMPAIGNS: Record<string, { source: string; line: string; prefix: string }> = {
  "24080482948": { source: "Website", line: "Website new", prefix: "web" },
  "24134330302": { source: "CS2", line: "CS2", prefix: "cs2" },
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
  const code = call.areaCode.trim();
  const domestic = !call.countryCode || call.countryCode.toUpperCase() === "US";
  const inFlorida = domestic && FLORIDA_AREA_CODES.has(code);
  const areaLabel = !code ? "Unknown" : code === LOCAL_AREA_CODE ? code : inFlorida ? `${code} · Florida` : domestic ? code : `${code} · ${call.countryCode.toUpperCase()}`;
  const seconds = call.durationSeconds;
  if (call.missed) return { kind: "hangup", assessment: "Missed call", areaLabel };
  if (code && !inFlorida) {
    return { kind: "out-of-state", assessment: seconds >= 60 ? "Out of state, but long" : "Out of state", areaLabel };
  }
  if (seconds < 15) return { kind: "hangup", assessment: "Hangup", areaLabel };
  if (seconds < 30) return { kind: "brief", assessment: "Brief", areaLabel };
  if (seconds < 45) return { kind: "conversation", assessment: "Short but real", areaLabel };
  if (seconds < 180) return { kind: "conversation", assessment: "Real conversation", areaLabel };
  return { kind: "conversation", assessment: "Long conversation", areaLabel };
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
