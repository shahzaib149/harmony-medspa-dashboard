import { DateTime } from "luxon";
import type { Lead } from "./map-lead";
import { CALL_SOURCES, callMarker } from "./call-records";
import { csvCell } from "./export";

export const EXPORT_CATEGORIES = ["Leads", "Marketing Leads", "Call Leads"] as const;
export const EXPORT_HEADERS = ["Category", "Source", "Record ID", "Lead ID", "Call ID", "Name", "Phone", "Email", "Created At (ET)", "Created At (UTC)", "Status", "Replied", "Lead Type", "Is Real Lead", "Treatment Interest", "Call Campaign", "Caller Region", "Duration (seconds)", "Call Result", "Call Assessment", "Details Status", "Last Contacted At", "Message", "Notes", "AI Tags", "Classification Method", "Email Sent Status", "SMS Sent Status", "Campaigns", "UTM Source", "UTM Campaign", "UTM Medium", "UTM Ad Group", "UTM Term", "UTM Content", "GCLID", "GBRAID", "WBRAID", "Landing URL", "Page URL", "Duplicate Flag", "AI Reason", "AI Confidence", "Classified At", "Classification Overridden By", "Match Type", "Device", "Network", "Best Time"];
export type ExportRow = (string | number)[];

function leadRow(lead: Lead): ExportRow {
  return [lead.source === "Call Leads" ? "Call Leads" : lead.source === "Manual Campaign Entry" ? "Marketing Leads" : "Leads", lead.source, lead.id, lead.id, "", lead.name, lead.phone, lead.email, DateTime.fromISO(lead.createdAt).setZone("America/New_York").toFormat("yyyy-MM-dd HH:mm:ss"), lead.createdAt, lead.status, lead.replied ? "Yes" : "No", lead.leadType, lead.isRealLead ? "Yes" : "No", lead.treatment, "", "", "", "", "", "Saved lead", lead.lastContactedAt, lead.message, lead.notes, lead.aiTags.join("; "), lead.classificationMethod, lead.emailSentStatus, lead.smsSentStatus, lead.campaigns.map((campaign) => `${campaign.campaign}: ${campaign.status}`).join("; "), lead.utmSource, lead.utmCampaign, lead.utmMedium, lead.utmAdGroup, lead.utmTerm, lead.utmContent, lead.gclid, lead.gbraid, lead.wbraid, lead.landingUrl, lead.pageUrl, lead.duplicate ? "Yes" : "No", lead.aiReason, lead.aiConfidence ?? "", lead.classifiedAt, lead.classificationOverriddenBy, lead.matchType, lead.device, lead.network, lead.bestTime];
}

// Export events/records, not unique patients. Keep manual marketing imports explicit.
export function organizedLeadRows(leads: Lead[], today = DateTime.now().setZone("America/New_York").toISODate()!): ExportRow[] {
  const rows = leads.filter((lead) => {
    const date = DateTime.fromISO(lead.createdAt).setZone("America/New_York");
    return !date.isValid || date.toISODate()! <= today;
  }).map(leadRow);
  for (const source of CALL_SOURCES) {
    for (const call of source.calls) {
      if (call.occurredAt.slice(0, 10) > today) continue;
      const linked = leads.filter((lead) => lead.source === "Call Leads" && `${lead.message}\n${lead.notes}`.includes(callMarker(call.id)));
      const linkedRows = rows.filter((row) => linked.some((lead) => lead.id === row[3]));
      // Preserve every saved contact if multiple records link to the same event.
      const targets = linkedRows.length ? linkedRows : [Array<string | number>(EXPORT_HEADERS.length).fill("")];
      if (!linkedRows.length) rows.push(targets[0]);
      for (const row of targets) {
        row[0] = "Call Leads";
        if (!linkedRows.length) { row[1] = "Call Leads"; row[2] = call.id; }
        row[4] = call.id;
        row[8] = DateTime.fromISO(call.occurredAt).setZone("America/New_York").toFormat("yyyy-MM-dd HH:mm:ss");
        row[9] = DateTime.fromISO(call.occurredAt).toUTC().toISO()!;
        row[15] = source.line;
        row[16] = call.areaCode;
        row[17] = call.duration;
        row[18] = call.missed ? "Missed" : "Answered";
        row[19] = call.assessment;
        row[20] = linkedRows.length ? "Saved lead" : "Caller details pending";
      }
    }
  }
  return rows.sort((a, b) => String(a[0]).localeCompare(String(b[0])) || String(a[1]).localeCompare(String(b[1])) || String(a[9]).localeCompare(String(b[9])) || String(a[2]).localeCompare(String(b[2])));
}

export function organizedLeadCsv(rows: ExportRow[]) {
  return "\uFEFF" + [EXPORT_HEADERS, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}
