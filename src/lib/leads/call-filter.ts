import { DateTime } from "luxon";
import { callSourceId, inNeedsDetailsWindow, type CallRecord } from "./call-records";

export function callDateWindow(range: string, now = DateTime.now()) {
  const today = now.setZone("America/New_York").startOf("day");
  const days = range === "7" ? 7 : range === "30" ? 30 : 1;
  return {
    fromDate: range === "all" ? undefined : today.minus({ days: days - 1 }).toISODate()!,
    toDate: today.toISODate()!,
  };
}

export function filterCalls(calls: CallRecord[], fromDate?: string, toDate?: string) {
  return calls.filter((call) => {
    const date = call.occurredAt.slice(0, 10);
    return (!fromDate || date >= fromDate) && (!toDate || date <= toDate);
  });
}

/** Call-lead window for a resolved date range; no range means all dates up to today. */
export function callWindowForRange(
  range: { from: string; to: string } | null,
  now = DateTime.now(),
) {
  return {
    fromDate: range?.from,
    toDate: range?.to ?? now.setZone("America/New_York").toISODate()!,
  };
}

export type CallStatusFilter = "all" | "answered" | "missed";

export type CallLeadFilters = {
  fromDate?: string;
  toDate?: string;
  /** callSourceId of the source, or "all". */
  source?: string;
  status?: CallStatusFilter;
  needsDetails?: boolean;
};

/**
 * A call needs details until someone has used "Add details" to create its lead.
 * Only calls since NEEDS_DETAILS_FROM count; addedIds also holds calls whose lead
 * was later marked "Not a lead", so those never come back here.
 */
export function callNeedsDetails(call: CallRecord, addedIds: Set<string>) {
  return !addedIds.has(call.id) && inNeedsDetailsWindow(call);
}

export function filterCallLeads(calls: CallRecord[], filters: CallLeadFilters, addedIds: Set<string>) {
  return filterCalls(calls, filters.fromDate, filters.toDate).filter((call) =>
    (!filters.source || filters.source === "all" || callSourceId(call.source) === filters.source) &&
    (!filters.status || filters.status === "all" || (filters.status === "missed") === Boolean(call.missed)) &&
    (!filters.needsDetails || callNeedsDetails(call, addedIds)));
}

export function callMetrics(calls: CallRecord[], addedIds: Set<string>) {
  const answered = calls.filter((call) => !call.missed);
  return {
    total: calls.length,
    answered: answered.length,
    missed: calls.length - answered.length,
    needsDetails: calls.filter((call) => callNeedsDetails(call, addedIds)).length,
    conversations: calls.filter((call) => call.kind === "conversation").length,
    // Only a known, non-Florida area code counts; "Unknown" never does.
    outOfState: calls.filter((call) => call.region === "out-of-state").length,
    averageDuration: answered.length ? Math.round(answered.reduce((sum, call) => sum + call.duration, 0) / answered.length) : 0,
  };
}
