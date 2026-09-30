// Pure aggregation of real leads by referrer class. No I/O here.
import { classifyLeadSource, sourceLabel, type LeadSourceClass } from "./referrer-classification";

export type AttributionLead = { createdAt: string; referrerSource: string; utmSource: string };

export type LeadAttribution = {
  /** Leads with a captured referrer. */
  captured: number;
  /** Leads created before referrer capture existed. */
  notCaptured: number;
  byClass: Record<LeadSourceClass, number>;
  /** AI-referred leads per month (YYYY-MM), from the first captured lead onward. */
  aiByMonth: Array<{ month: string; leads: number }>;
  /** AI-referred leads by tool, e.g. chatgpt.com. */
  aiSources: Array<{ source: string; leads: number }>;
};

export function summariseAttribution(leads: AttributionLead[]): LeadAttribution {
  const byClass: Record<LeadSourceClass, number> = { AI: 0, Search: 0, Social: 0, Direct: 0, Other: 0, "Not captured": 0 };
  const aiMonths = new Map<string, number>();
  const aiSources = new Map<string, number>();
  const capturedMonths = new Set<string>();

  for (const lead of leads) {
    const cls = classifyLeadSource(lead.referrerSource, lead.utmSource);
    byClass[cls] += 1;
    if (cls === "Not captured") continue;
    const month = lead.createdAt.slice(0, 7);
    if (month) capturedMonths.add(month);
    if (cls === "AI") {
      if (month) aiMonths.set(month, (aiMonths.get(month) ?? 0) + 1);
      const source = sourceLabel(lead.referrerSource, lead.utmSource);
      aiSources.set(source, (aiSources.get(source) ?? 0) + 1);
    }
  }

  const months = [...capturedMonths].sort();
  const aiByMonth = months.length ? monthRange(months[0], months[months.length - 1]).map((month) => ({ month, leads: aiMonths.get(month) ?? 0 })) : [];

  return {
    captured: leads.length - byClass["Not captured"],
    notCaptured: byClass["Not captured"],
    byClass,
    aiByMonth,
    aiSources: [...aiSources].map(([source, count]) => ({ source, leads: count })).sort((a, b) => b.leads - a.leads),
  };
}

function monthRange(first: string, last: string) {
  const out: string[] = [];
  let [year, month] = first.split("-").map(Number);
  const [lastYear, lastMonth] = last.split("-").map(Number);
  while (year < lastYear || (year === lastYear && month <= lastMonth)) {
    out.push(`${year}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month > 12) { month = 1; year += 1; }
  }
  return out;
}
