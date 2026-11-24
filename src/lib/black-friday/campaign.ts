// Black Friday 2026: Hayden's member + patient list (Airtable "BF Audience"), the three
// segment sends (Make 7123840), and the website leads that got the Black Friday replies.
// Pure functions only, so they are unit-tested in tests/black-friday-campaign.test.ts.

export const BLACK_FRIDAY_PATH = "/campaigns/black-friday";
export const BLACK_FRIDAY_NAME = "Black Friday 2026";
export const BLACK_FRIDAY_SEQUENCE = "Black Friday 2026";
export const BF_AUDIENCE_TABLE = "tblfQm5BLm0fo1UBa";

/** Campaign window in America/New_York (-05:00 in late November). */
export const BF_STARTS_AT = "2026-11-23T00:00:00-05:00";
export const BF_ENDS_AT = "2026-12-01T00:00:00-05:00";

export type SendStepId = "Members Early Access" | "Public Sale Open" | "Last Chance";
/** The segment sends. `sendDates` mirrors module 1 of Make 7123840 (10:00 ET daily). */
export const SEND_STEPS: { id: SendStepId; label: string; window: string; sendDates: string[] }[] = [
  { id: "Members Early Access", label: "Members early access", window: "Nov 23–26", sendDates: ["2026-11-23", "2026-11-24", "2026-11-25", "2026-11-26"] },
  { id: "Public Sale Open", label: "Public sale is live", window: "Nov 27", sendDates: ["2026-11-27"] },
  { id: "Last Chance", label: "Last chance", window: "Nov 30", sendDates: ["2026-11-30"] },
];

export type AudienceContact = {
  id: string;
  name: string;
  firstName: string;
  email: string;
  phone: string;
  segment: "Member" | "Existing Patient" | "";
  emailOk: boolean;
  smsOk: boolean;
  unsubscribed: boolean;
  alsoLead: boolean;
  sentSteps: string[];
  notes: string;
  createdAt: string;
};

export type BfMessage = { id: string; step: string; channel: string; status: string; sentAt: string };
export type BfLead = { id: string; name: string; source: string; treatment: string; status: string; leadType: string; createdAt: string };

export type StepProgress = {
  id: SendStepId;
  label: string;
  window: string;
  eligible: number;
  sent: number;
  remaining: number;
  state: "Sent" | "Partly sent" | "Sending" | "Scheduled" | "Not sent";
};

export type BlackFridayCampaignData = {
  name: string;
  status: "Scheduled" | "Active" | "Ended";
  audience: AudienceContact[];
  metrics: {
    contacts: number;
    members: number;
    patients: number;
    emailOk: number;
    smsOk: number;
    unsubscribed: number;
    reached: number;
    websiteLeads: number;
    replies: number;
    /** Segment-send messages (per allowed channel, per step) plus logged Black Friday replies. */
    messagesSent: number;
  };
  steps: StepProgress[];
  leads: BfLead[];
  messages: { instant: number; followUp: number; failed: number };
  lastActivity: string;
  generatedAt: string;
};

export type BlackFridayCampaignSummary = Pick<BlackFridayCampaignData, "name" | "status" | "metrics" | "steps" | "lastActivity" | "generatedAt">;

const dayKey = (now: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);

export function campaignStatus(now: Date): BlackFridayCampaignData["status"] {
  const t = now.getTime();
  if (t < Date.parse(BF_STARTS_AT)) return "Scheduled";
  if (t < Date.parse(BF_ENDS_AT)) return "Active";
  return "Ended";
}

/** Contacts the segment send would message: not unsubscribed, not a website lead, and reachable. */
export function isSendable(contact: AudienceContact) {
  return !contact.unsubscribed && !contact.alsoLead && ((contact.emailOk && !!contact.email) || (contact.smsOk && !!contact.phone));
}

function stepState(step: (typeof SEND_STEPS)[number], sent: number, eligible: number, today: string): StepProgress["state"] {
  const first = step.sendDates[0];
  const last = step.sendDates[step.sendDates.length - 1];
  if (eligible > 0 && sent >= eligible) return "Sent";
  if (today < first) return sent > 0 ? "Partly sent" : "Scheduled";
  if (today <= last) return sent > 0 ? "Sending" : "Scheduled";
  return sent > 0 ? "Partly sent" : "Not sent";
}

export function buildBlackFridayCampaign(audience: AudienceContact[], messages: BfMessage[], leads: BfLead[], now = new Date()): BlackFridayCampaignData {
  const today = dayKey(now);
  const sendable = audience.filter(isSendable);
  const steps = SEND_STEPS.map((step) => {
    const sent = audience.filter((c) => c.sentSteps.includes(step.id)).length;
    const remaining = sendable.filter((c) => !c.sentSteps.includes(step.id)).length;
    const eligible = sent + remaining;
    return { id: step.id, label: step.label, window: step.window, eligible, sent, remaining, state: stepState(step, sent, eligible, today) };
  });
  const isInstant = (m: BfMessage) => m.step === "BF-Instant";
  const isFailed = (m: BfMessage) => /fail|reject|bounce|invalid|error/i.test(m.status);
  const lastActivity = [...messages.map((m) => m.sentAt), ...leads.map((l) => l.createdAt)].filter(Boolean).sort().at(-1) ?? "";
  return {
    name: BLACK_FRIDAY_NAME,
    status: campaignStatus(now),
    audience: [...audience].sort((a, b) => (a.segment === b.segment ? a.name.localeCompare(b.name) : a.segment === "Member" ? -1 : 1)),
    metrics: {
      contacts: audience.length,
      members: audience.filter((c) => c.segment === "Member").length,
      patients: audience.filter((c) => c.segment === "Existing Patient").length,
      emailOk: audience.filter((c) => c.emailOk && !!c.email).length,
      smsOk: audience.filter((c) => c.smsOk && !!c.phone).length,
      unsubscribed: audience.filter((c) => c.unsubscribed).length,
      reached: audience.filter((c) => c.sentSteps.length > 0).length,
      websiteLeads: leads.length,
      replies: messages.filter(isInstant).length,
      messagesSent: segmentMessagesSent(audience) + messages.filter((m) => !isFailed(m)).length,
    },
    steps,
    leads: [...leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    messages: {
      instant: messages.filter((m) => isInstant(m) && !isFailed(m)).length,
      followUp: messages.filter((m) => !isInstant(m) && !isFailed(m)).length,
      failed: messages.filter(isFailed).length,
    },
    lastActivity,
    generatedAt: now.toISOString(),
  };
}

export function summarizeBlackFriday(data: BlackFridayCampaignData): BlackFridayCampaignSummary {
  const { name, status, metrics, steps, lastActivity, generatedAt } = data;
  return { name, status, metrics, steps, lastActivity, generatedAt };
}

/** Make 7123840 runs daily at 10:00 ET; late November is EST (-05:00). */
export const SEND_HOUR_UTC_OFFSET = "T10:00:00-05:00";

/**
 * The next scheduled send after `now`: the first step/date slot still to come whose step
 * has contacts left. Null once every send is done or past.
 */
export function nextSend(steps: StepProgress[], now = new Date()): { step: StepProgress; at: string } | null {
  for (const def of SEND_STEPS) {
    const step = steps.find((s) => s.id === def.id);
    if (!step || (step.eligible > 0 && step.remaining === 0)) continue;
    const slot = def.sendDates.map((d) => `${d}${SEND_HOUR_UTC_OFFSET}`).find((at) => Date.parse(at) > now.getTime());
    if (slot) return { step, at: slot };
  }
  return null;
}

/** Messages the segment sends have delivered (one per channel the contact allows, per step). */
export function segmentMessagesSent(audience: AudienceContact[]) {
  return audience.reduce((total, c) => total + c.sentSteps.length * ((c.emailOk && c.email ? 1 : 0) + (c.smsOk && c.phone ? 1 : 0)), 0);
}
