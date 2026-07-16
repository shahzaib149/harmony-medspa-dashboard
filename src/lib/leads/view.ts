export const LEAD_VIEWS = ["all", "replied", "booked"] as const;

export type LeadView = (typeof LEAD_VIEWS)[number];

type LeadViewFields = {
  status: string;
  replied: boolean;
};

export function normalizeLeadView(value: string | null | undefined): LeadView {
  if (value === "leads") return "all";
  return LEAD_VIEWS.includes(value as LeadView) ? (value as LeadView) : "all";
}

export function leadBelongsToView(lead: LeadViewFields, view: LeadView) {
  if (view === "all") return true;
  if (view === "replied") return lead.replied;
  return lead.status.trim().toLowerCase() === "booked";
}

export function leadViewFormula(view: LeadView) {
  if (view === "all") return "";
  if (view === "booked") return 'LOWER({Status}&"")="booked"';
  return "{Replied}=TRUE()";
}
