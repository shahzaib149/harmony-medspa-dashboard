import { callMarker, inNeedsDetailsWindow, type CallRecord } from "./call-records";

type Record = { id: string; createdTime: string; fields: { [key: string]: unknown } };

/**
 * Calls since NEEDS_DETAILS_FROM that nobody has used "Add details" on yet (no
 * saved lead carries their marker, whatever that lead's Lead Type is now).
 */
export function callsNeedingDetails(records: Record[], calls: CallRecord[]) {
  const context = records
    .filter((record) => record.fields.Source === "Call Leads")
    .map((record) => `${record.fields.Message ?? ""}\n${record.fields.Notes ?? ""}`)
    .join("\n");
  return calls.filter((call) => inNeedsDetailsWindow(call) && !context.includes(callMarker(call.id)));
}

// Calls without contact details are still inbound opportunities. Keep them in
// reporting, without writing placeholder patients or triggering automations.
export function withCallOpportunities(records: Record[], calls: CallRecord[]): Record[] {
  const saved = new Set<string>();
  const linked = records.map((record) => {
    if (record.fields.Source !== "Call Leads") return record;
    const context = `${record.fields.Message ?? ""}\n${record.fields.Notes ?? ""}`;
    const call = calls.find((item) => context.includes(callMarker(item.id)));
    if (!call) return record;
    saved.add(call.id);
    return { ...record, fields: { ...record.fields, "Lead Created At": call.occurredAt } };
  });
  return [...linked, ...calls.filter((call) => !saved.has(call.id)).map((call) => ({
    id: call.id,
    createdTime: call.occurredAt,
    fields: {
      Name: "Caller details pending",
      Source: "Call Leads",
      Status: "New",
      "Lead Created At": call.occurredAt,
      "Lead Type": "Unclear",
    },
  }))];
}
