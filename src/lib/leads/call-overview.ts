import { ALL_CALLS, callMarker } from "./call-records";

type Record = { id: string; createdTime: string; fields: { [key: string]: unknown } };

// Calls without contact details are still inbound opportunities. Keep them in
// reporting, without writing placeholder patients or triggering automations.
export function withCallOpportunities(records: Record[]): Record[] {
  const saved = new Set<string>();
  const linked = records.map((record) => {
    if (record.fields.Source !== "Call Leads") return record;
    const context = `${record.fields.Message ?? ""}\n${record.fields.Notes ?? ""}`;
    const call = ALL_CALLS.find((item) => context.includes(callMarker(item.id)));
    if (!call) return record;
    saved.add(call.id);
    return { ...record, fields: { ...record.fields, "Lead Created At": call.occurredAt } };
  });
  return [...linked, ...ALL_CALLS.filter((call) => !saved.has(call.id)).map((call) => ({
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
