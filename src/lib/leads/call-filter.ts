import { DateTime } from "luxon";
import type { CallRecord } from "./call-records";

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
