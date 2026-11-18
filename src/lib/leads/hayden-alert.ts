// When the Speed-to-Lead scenario (Make 5524123) emailed Hayden and management about a lead.
//
// Its last step ("notify Hayden", modules 310 / 410) runs for every submission the AI
// classifies as Real Lead, Unclear or Existing Patient, right after the classification is
// saved to the lead (Classified At). Make doesn't write anything back after the email, so
// the dashboard derives it from that same rule. Manual "Notify Hayden" clicks are recorded
// separately in the audit log (action lead_shared_with_hayden).

/** Lead types the scenario alerts Hayden about (module 307 `notify`). */
export const HAYDEN_ALERT_LEAD_TYPES = ["Real Lead", "Unclear", "Existing Patient"] as const;
/** Classification methods the scenario writes; "Manual" means staff re-classified it later. */
const AUTOMATIC_METHODS = new Set(["Rule", "AI", "Fallback"]);
/** The alert step went live with the classification rework on 2026-09-29. */
export const HAYDEN_ALERT_SINCE = "2026-09-29";

export type HaydenAlertLead = { leadType: string; classificationMethod: string; classifiedAt: string };

/** The automatic Speed-to-Lead alert for this lead, or null when the scenario wouldn't have sent one. */
export function automaticHaydenAlert(lead: HaydenAlertLead): { at: string; leadType: string } | null {
  const leadType = lead.leadType.trim();
  const at = lead.classifiedAt.trim();
  if (!at || Number.isNaN(Date.parse(at)) || at.slice(0, 10) < HAYDEN_ALERT_SINCE) return null;
  if (!AUTOMATIC_METHODS.has(lead.classificationMethod.trim())) return null;
  if (!(HAYDEN_ALERT_LEAD_TYPES as readonly string[]).includes(leadType)) return null;
  return { at, leadType };
}

export type ManualHaydenNotification = { at: string; by: string };
