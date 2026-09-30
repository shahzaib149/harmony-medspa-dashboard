// Lead classification vocabulary shared by the API, the Leads UI and the
// Speed to Lead Make scenario. Names must match the Airtable select options
// character-for-character (the scenario writes with typecast disabled).

export const LEAD_TYPES = [
  "Real Lead",
  "Existing Patient",
  "Appointment Change",
  "Solicitor",
  "Job Seeker",
  "Spam",
  "Unclear",
] as const;
export type LeadType = (typeof LEAD_TYPES)[number];

/** Types that count as a prospective patient: notify + nurture + KPIs. */
export const REAL_LEAD_TYPES: readonly LeadType[] = ["Real Lead", "Unclear"];

/** Types staff can pick when marking a submission as not a lead. */
export const NOT_A_LEAD_TYPES: readonly LeadType[] = [
  "Existing Patient",
  "Appointment Change",
  "Solicitor",
  "Job Seeker",
  "Spam",
];

export const AI_TAGS = [
  "Paid Ad",
  "Weight Loss",
  "Injectables",
  "Skin",
  "Wellness",
  "Pricing Question",
  "Existing Patient",
  "Appointment Change",
  "Solicitor",
  "Vendor",
  "SEO/Marketing Pitch",
  "Job Seeker",
  "Spam",
  "Needs Review",
] as const;
export type AiTag = (typeof AI_TAGS)[number];

export const CLASSIFICATION_METHODS = ["Rule", "AI", "Fallback", "Manual"] as const;
export type ClassificationMethod = (typeof CLASSIFICATION_METHODS)[number];

export const NEEDS_REVIEW_TAG: AiTag = "Needs Review";
export const NOT_A_LEAD_STATUS = "Not a Lead";

export function isLeadType(value: unknown): value is LeadType {
  return typeof value === "string" && (LEAD_TYPES as readonly string[]).includes(value);
}

export function isAiTag(value: unknown): value is AiTag {
  return typeof value === "string" && (AI_TAGS as readonly string[]).includes(value);
}

/**
 * Types that get no instant speed-to-lead email/SMS at all. Everyone else,
 * including existing patients and appointment changes, still gets the reply.
 * Kept in sync with the `reply` variable in the Make scenario.
 */
export const NO_AUTO_REPLY_TYPES: readonly LeadType[] = ["Solicitor", "Spam", "Job Seeker"];

export function sendsAutoReply(leadType: string) {
  return !NO_AUTO_REPLY_TYPES.includes(leadType as LeadType);
}

type ClassifiedFields = { leadType: string; isRealLead?: boolean };

/**
 * Derived from Lead Type, not the Is Real Lead checkbox: Make drops checkbox
 * mappings on blueprint import, so the checkbox can be missing on records the
 * scenario classified. Records created before AI classification have no Lead
 * Type at all and were all treated as leads, so they still count as real.
 */
export function countsAsRealLead(lead: ClassifiedFields) {
  if (!lead.leadType) return true;
  return REAL_LEAD_TYPES.includes(lead.leadType as LeadType);
}

export function isNotALead(lead: ClassifiedFields) {
  return !countsAsRealLead(lead);
}

export function needsReview(lead: { aiTags: string[] }) {
  return lead.aiTags.includes(NEEDS_REVIEW_TAG);
}

// Airtable formula fragments that mirror the helpers above.
export const REAL_LEAD_FORMULA = 'OR(LEN({Lead Type}&"")=0,{Lead Type}="Real Lead",{Lead Type}="Unclear")';
export const NOT_A_LEAD_FORMULA = 'AND(LEN({Lead Type}&"")>0,{Lead Type}!="Real Lead",{Lead Type}!="Unclear")';
export const NEEDS_REVIEW_FORMULA = 'FIND("Needs Review",{AI Tags}&"")>0';

/** `?leadType=not-lead` matches every non-lead type at once. */
export const NOT_A_LEAD_FILTER = "not-lead";
