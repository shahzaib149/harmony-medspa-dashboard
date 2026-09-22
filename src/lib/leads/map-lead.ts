import type { LeadCampaignSummary } from "@/lib/types/campaigns";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  treatment: string;
  message: string;
  source: string;
  status: string;
  utmSource: string;
  utmCampaign: string;
  utmMedium: string;
  utmAdGroup: string;
  pageUrl: string;
  createdAt: string;
  emailSentStatus: string;
  smsSentStatus: string;
  replied: boolean;
  notes: string;
  lastContactedAt: string;
  duplicate: boolean;
  campaigns: LeadCampaignSummary[];
  // AI / rule classification
  leadType: string;
  isRealLead: boolean;
  aiTags: string[];
  aiConfidence: number | null;
  aiReason: string;
  classificationMethod: string;
  classifiedAt: string;
  classificationOverriddenBy: string;
  // Paid-click attribution written by the Speed to Lead scenario
  gclid: string;
  gbraid: string;
  wbraid: string;
  utmTerm: string;
  utmContent: string;
  matchType: string;
  device: string;
  network: string;
  landingUrl: string;
  bestTime: string;
}

export function str(fields: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = fields[k];
    if (v !== undefined && v !== null && v !== "") return String(v);
  }
  return "";
}

export type AirtableRecord = { id: string; createdTime: string; fields: Record<string, unknown> };

function values(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : value ? [String(value)] : [];
}

function campaignSummaries(fields: Record<string, unknown>): LeadCampaignSummary[] {
  const campaigns: LeadCampaignSummary[] = [];
  const speedSent = [str(fields, "Email Sent Status"), str(fields, "SMS Sent Status")].some((value) => ["sent", "delivered"].includes(value.toLowerCase()));
  if (speedSent) campaigns.push({ campaign: "Speed-to-Lead", slug: "speed-to-lead", status: "Completed" });
  const enrollmentIds = values(fields["Nurture Enrollments"]);
  const statuses = values(fields["Nurture Status"]);
  const steps = values(fields["Nurture Current Step"]);
  const next = values(fields["Nurture Next Send At"]);
  const last = values(fields["Nurture Last Sent At"]);
  const reasons = values(fields["Nurture Stop Reason"]);
  const created = values(fields["Nurture Enrollment Created At"]);
  enrollmentIds.forEach((enrollmentId, index) => campaigns.push({ campaign: "14-Day Nurture", slug: "14-day-nurture", status: (statuses[index] || "Completed") as LeadCampaignSummary["status"], currentStep: steps[index] || null, nextSendAt: next[index] || null, lastSentAt: last[index] || null, stopReason: reasons[index] || null, enrolledAt: created[index] || null, enrollmentId }));
  return campaigns;
}

function confidence(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : null;
}

export function mapLead(r: AirtableRecord): Lead {
  return {
    id: r.id,
    name: str(r.fields, "Name"),
    phone: str(r.fields, "Phone"),
    email: str(r.fields, "Email"),
    treatment: str(r.fields, "Treatment Interest"),
    message: str(r.fields, "Message"),
    source: str(r.fields, "Source"),
    status: str(r.fields, "Status") || "New",
    utmSource: str(r.fields, "UTM Source"),
    utmCampaign: str(r.fields, "UTM Campaign"),
    utmMedium: str(r.fields, "UTM Medium"),
    utmAdGroup: str(r.fields, "UTM Ad Group", "utm_ad_group", "utm_adgroup"),
    pageUrl: str(r.fields, "Page URL"),
    createdAt: str(r.fields, "Lead Created At") || r.createdTime,
    emailSentStatus: str(r.fields, "Email Sent Status"),
    smsSentStatus: str(r.fields, "SMS Sent Status"),
    replied: r.fields.Replied === true,
    notes: str(r.fields, "Notes"),
    lastContactedAt: str(r.fields, "Last Contacted At"),
    duplicate: r.fields["Duplicate Flag"] === true || str(r.fields, "Status").toLowerCase() === "duplicate",
    campaigns: campaignSummaries(r.fields),
    leadType: str(r.fields, "Lead Type"),
    isRealLead: r.fields["Is Real Lead"] === true,
    aiTags: values(r.fields["AI Tags"]),
    aiConfidence: confidence(r.fields["AI Confidence"]),
    aiReason: str(r.fields, "AI Reason"),
    classificationMethod: str(r.fields, "Classification Method"),
    classifiedAt: str(r.fields, "Classified At"),
    classificationOverriddenBy: str(r.fields, "Classification Overridden By"),
    gclid: str(r.fields, "GCLID"),
    gbraid: str(r.fields, "GBRAID"),
    wbraid: str(r.fields, "WBRAID"),
    utmTerm: str(r.fields, "UTM Term"),
    utmContent: str(r.fields, "UTM Content"),
    matchType: str(r.fields, "Match Type"),
    device: str(r.fields, "Device"),
    network: str(r.fields, "Network"),
    landingUrl: str(r.fields, "Landing URL"),
    bestTime: str(r.fields, "Best Time to Reach"),
  };
}
