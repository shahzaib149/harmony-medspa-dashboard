import { countsAsRealLead, needsReview } from "@/lib/leads/classification";
import { LEAD_VIEWS, leadBelongsToView, type LeadView } from "@/lib/leads/view";

export type LeadSummaryRecord = {
  id: string;
  name: string;
  source: string;
  status: string;
  replied: boolean;
  createdAt: string;
  email: string;
  phone: string;
  duplicate: boolean;
  leadType: string;
  isRealLead: boolean;
  aiTags: string[];
};

export type LeadSummaryMetrics = {
  total: number;
  newToday: number;
  contacted: number;
  replied: number;
  booked: number;
  duplicates: number;
  notBooked: number;
  notReplied: number;
  topSource: string | null;
  topSourceCount: number;
  /** Submissions classified as not a lead, across the same filters (ignores the view). */
  notALead: number;
  needsReview: number;
  /** Not-a-lead records grouped by Lead Type. */
  byLeadType: Record<string, number>;
};

export type LeadViewCounts = Record<LeadView, number>;

const DASHBOARD_TIME_ZONE = "America/New_York";

function dateKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DASHBOARD_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function duplicateIds(records: LeadSummaryRecord[]) {
  const emailIds = new Map<string, string[]>();
  const phoneIds = new Map<string, string[]>();

  for (const record of records) {
    const email = normalizeEmail(record.email);
    const phone = normalizePhone(record.phone);
    if (email) emailIds.set(email, [...(emailIds.get(email) ?? []), record.id]);
    if (phone) phoneIds.set(phone, [...(phoneIds.get(phone) ?? []), record.id]);
  }

  const ids = new Set(
    records
      .filter(
        (record) =>
          record.duplicate || record.status.trim().toLowerCase() === "duplicate",
      )
      .map((record) => record.id),
  );
  for (const matches of [...emailIds.values(), ...phoneIds.values()]) {
    if (matches.length > 1) matches.forEach((id) => ids.add(id));
  }
  return ids;
}

export function aggregateLeadSummary(
  records: LeadSummaryRecord[],
  view: LeadView,
  now = new Date(),
) {
  const viewCounts = Object.fromEntries(
    LEAD_VIEWS.map((candidate) => [candidate, records.filter((record) => leadBelongsToView(record, candidate)).length]),
  ) as LeadViewCounts;
  const notALeadRecords = records.filter((record) => !countsAsRealLead(record));
  const byLeadType: Record<string, number> = {};
  notALeadRecords.forEach((record) => {
    byLeadType[record.leadType] = (byLeadType[record.leadType] ?? 0) + 1;
  });

  const matching = records.filter((record) => leadBelongsToView(record, view));
  const duplicates = duplicateIds(matching);
  const today = dateKey(now);
  const sourceCounts = new Map<string, number>();
  matching.forEach((record) => {
    const source = record.source.trim() || "Unknown";
    sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1);
  });
  const topSourceEntry = [...sourceCounts.entries()].sort(
    ([sourceA, countA], [sourceB, countB]) =>
      countB - countA || sourceA.localeCompare(sourceB),
  )[0];
  const topSource = topSourceEntry?.[0] ?? null;
  const topSourceCount = topSourceEntry?.[1] ?? 0;
  const replied = matching.filter((record) => record.replied).length;
  const booked = matching.filter(
    (record) => record.status.trim().toLowerCase() === "booked",
  ).length;

  const summary: LeadSummaryMetrics = {
    total: matching.length,
    newToday: matching.filter((record) => dateKey(record.createdAt) === today).length,
    contacted: matching.filter(
      (record) => record.status.trim().toLowerCase() === "contacted",
    ).length,
    replied,
    booked,
    duplicates: duplicates.size,
    notBooked: matching.length - booked,
    notReplied: matching.length - replied,
    topSource,
    topSourceCount,
    notALead: notALeadRecords.length,
    needsReview: records.filter(needsReview).length,
    byLeadType,
  };

  return { summary, viewCounts };
}
