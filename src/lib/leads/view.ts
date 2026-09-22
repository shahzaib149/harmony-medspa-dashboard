import { countsAsRealLead, REAL_LEAD_FORMULA } from "@/lib/leads/classification";

// Tab order in the Leads page: All | Real Leads | Booked.
// Non-leads and "Needs Review" are reached through the Lead type / Tag filters.
export const LEAD_VIEWS = ["all", "leads", "booked"] as const;

export type LeadView = (typeof LEAD_VIEWS)[number];

export const DEFAULT_LEAD_VIEW: LeadView = "leads";

type LeadViewFields = {
  status: string;
  leadType: string;
  isRealLead: boolean;
};

export function normalizeLeadView(value: string | null | undefined): LeadView {
  return LEAD_VIEWS.includes(value as LeadView) ? (value as LeadView) : DEFAULT_LEAD_VIEW;
}

export function leadBelongsToView(lead: LeadViewFields, view: LeadView) {
  if (view === "all") return true;
  if (view === "leads") return countsAsRealLead(lead);
  return lead.status.trim().toLowerCase() === "booked";
}

export function leadViewFormula(view: LeadView) {
  if (view === "all") return "";
  if (view === "leads") return REAL_LEAD_FORMULA;
  return 'LOWER({Status}&"")="booked"';
}
