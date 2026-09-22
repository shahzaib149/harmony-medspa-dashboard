import {
  countsAsRealLead,
  needsReview,
  NEEDS_REVIEW_FORMULA,
  NOT_A_LEAD_FORMULA,
  REAL_LEAD_FORMULA,
} from "@/lib/leads/classification";

export const LEAD_VIEWS = ["leads", "review", "not-lead", "replied", "booked", "all"] as const;

export type LeadView = (typeof LEAD_VIEWS)[number];

export const DEFAULT_LEAD_VIEW: LeadView = "leads";

type LeadViewFields = {
  status: string;
  replied: boolean;
  leadType: string;
  isRealLead: boolean;
  aiTags: string[];
};

export function normalizeLeadView(value: string | null | undefined): LeadView {
  return LEAD_VIEWS.includes(value as LeadView) ? (value as LeadView) : DEFAULT_LEAD_VIEW;
}

export function leadBelongsToView(lead: LeadViewFields, view: LeadView) {
  if (view === "all") return true;
  if (view === "leads") return countsAsRealLead(lead);
  if (view === "not-lead") return !countsAsRealLead(lead);
  if (view === "review") return needsReview(lead);
  if (view === "replied") return lead.replied;
  return lead.status.trim().toLowerCase() === "booked";
}

export function leadViewFormula(view: LeadView) {
  if (view === "all") return "";
  if (view === "leads") return REAL_LEAD_FORMULA;
  if (view === "not-lead") return NOT_A_LEAD_FORMULA;
  if (view === "review") return NEEDS_REVIEW_FORMULA;
  if (view === "booked") return 'LOWER({Status}&"")="booked"';
  return "{Replied}=TRUE()";
}
