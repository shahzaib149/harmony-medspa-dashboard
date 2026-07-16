export const LEAD_VIEWS = ["leads", "replied", "booked"] as const;

export type LeadView = (typeof LEAD_VIEWS)[number];

type LeadViewFields = {
  status: string;
  replied: boolean;
};

export function normalizeLeadView(value: string | null | undefined): LeadView {
  return LEAD_VIEWS.includes(value as LeadView) ? (value as LeadView) : "leads";
}

export function leadViewFor(lead: LeadViewFields): LeadView {
  if (lead.status.trim().toLowerCase() === "booked") return "booked";
  if (lead.replied) return "replied";
  return "leads";
}

export function leadBelongsToView(lead: LeadViewFields, view: LeadView) {
  return leadViewFor(lead) === view;
}

export function leadViewFormula(view: LeadView) {
  if (view === "booked") return 'LOWER({Status}&"")="booked"';
  if (view === "replied") {
    return 'AND(LOWER({Status}&"")!="booked",{Replied}=TRUE())';
  }
  return 'AND(LOWER({Status}&"")!="booked",NOT({Replied}=TRUE()))';
}
