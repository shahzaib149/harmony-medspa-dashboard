// The exact copy the Black Friday Segment Sends scenario (Make 7123840, modules 3 and 5)
// sends, so the CRM can show each contact's messages. The segment sends record only which
// step reached a contact (BF Audience › Sent Steps), not a Message Log row per message.
// Keep this in step with the scenario if its copy changes.
import type { MessageLog } from "@/types/message-log";
import { BLACK_FRIDAY_SEQUENCE, type AudienceContact, type SendStepId } from "./campaign";

/** When each send went out (10:00 ET daily; early access mostly in the Nov 24 8:02 AM ET run, the first 18 on Nov 23). */
export const SEGMENT_SENT_AT: Record<SendStepId, string> = {
  "Members Early Access": "2026-11-24T08:02:00-05:00",
  "Public Sale Open": "2026-11-27T10:00:00-05:00",
  "Last Chance": "2026-11-30T10:00:00-05:00",
};

const STEP_LABEL: Record<SendStepId, string> = {
  "Members Early Access": "Members early access",
  "Public Sale Open": "Public sale is live",
  "Last Chance": "Last chance",
};

export function firstNameFor(contact: Pick<AudienceContact, "firstName" | "name">) {
  return contact.firstName.trim() || contact.name.trim().split(/\s+/)[0] || "there";
}

function copyFor(step: SendStepId, member: boolean) {
  if (step === "Members Early Access") {
    return member
      ? {
          subject: "Your Harmony Black Friday early access is open",
          line: "As a Harmony member, you get first access to our Black Friday Beauty Event, November 23–26, with member pricing on injectables, four-treatment facial packages, laser and device packages and more.",
          sms: "Harmony Med Spa: Your Black Friday member early access is open through Nov 26! See pricing: harmonymedspafl.com/black-friday Call or text (941) 923-8990. Reply STOP to opt out.",
        }
      : {
          subject: "Black Friday early access is open for members",
          line: "Harmony members get first access to our Black Friday Beauty Event, November 23–26. Not a member yet? Request a membership and receive member pricing once your first membership payment has cleared. Our public sale opens November 27.",
          sms: "Harmony Med Spa: Black Friday early access is open for members through Nov 26. Join for member pricing: harmonymedspafl.com/black-friday Call or text (941) 923-8990. Reply STOP to opt out.",
        };
  }
  if (step === "Public Sale Open") {
    return {
      subject: "Harmony's Black Friday sale is live",
      line: "Our Black Friday sale is live through November 30: injectables, four-treatment facial packages, up to 30% off laser and device packages, selected skincare and more. Plus, buy a $100+ gift card and get 10% back in bonus credit for you.",
      sms: "Harmony Med Spa: Our Black Friday sale is live through Nov 30! Plus 10% back on $100+ gift cards. harmonymedspafl.com/black-friday Call or text (941) 923-8990. Reply STOP to opt out.",
    };
  }
  return {
    subject: "Last chance: Black Friday ends tonight",
    line: "Today is the last day of Harmony's Black Friday pricing. Offers end tonight, November 30.",
    sms: "Harmony Med Spa: Last chance! Black Friday pricing ends tonight. harmonymedspafl.com/black-friday Call or text (941) 923-8990. Reply STOP to opt out.",
  };
}

/** Early access asked for a reply; from Nov 27 each email carries the contact's own unsubscribe link. */
function footer(step: SendStepId) {
  return step === "Members Early Access"
    ? `You're receiving this because you opted in to Harmony Med Spa emails. Reply "unsubscribe" to stop.`
    : "You're receiving this because you opted in to Harmony Med Spa emails. To stop these emails, unsubscribe here: (their personal unsubscribe link)";
}

function emailBody(firstName: string, line: string, step: SendStepId) {
  return `Hi ${firstName},\n\n${line}\n\nSee every special, with member and nonmember pricing:\nhttps://www.harmonymedspafl.com/black-friday\n\nTo claim an offer, call or text us at (941) 923-8990, or book online:\nhttps://na02.patientnow.com/a/HARMONYMEDSPA/OnlineBooking.aspx\n\n— Harmony Med Spa\n2184 Gulf Gate Dr., Unit B, Sarasota, FL 34231\n\n${footer(step)}`;
}

const MONTHS: Record<string, number> = { Nov: 10, Dec: 11 };

/**
 * When a channel was turned off by an opt-out, from the dated lines in Notes
 * ("Emails stopped Nov 25 · Hayden", "Unsubscribed (email + text) Nov 26", …). Null if never.
 */
export function optedOutAt(notes: string, channel: "email" | "sms"): number | null {
  const pattern = channel === "email" ? /(?:Unsubscribed|Emails stopped)\b[^\n]*?\b(Nov|Dec) (\d{1,2})\b/ : /(?:Unsubscribed|Texts stopped)\b[^\n]*?\b(Nov|Dec) (\d{1,2})\b/;
  const hit = notes.match(pattern);
  if (!hit) return null;
  // End of that day in New York: anything sent on or before it went out before the opt-out.
  return Date.UTC(2026, MONTHS[hit[1]], Number(hit[2]) + 1, 5);
}

/** Whether the contact could get this channel when the step went out (it may be off now). */
function hadChannel(contact: AudienceContact, channel: "email" | "sms", sentAt: string) {
  const value = channel === "email" ? contact.email : contact.phone;
  if (!value) return false;
  if (channel === "email" ? contact.emailOk : contact.smsOk) return true;
  const off = optedOutAt(contact.notes, channel);
  return off !== null && Date.parse(sentAt) < off;
}

/**
 * The messages one contact received from the segment sends, in the MessageLog shape the
 * conversation table and drawer use. One email and/or one text per step they got,
 * depending on which channels were allowed.
 */
export function segmentMessages(contact: AudienceContact): MessageLog[] {
  const member = contact.segment === "Member";
  const first = firstNameFor(contact);
  const out: MessageLog[] = [];
  for (const step of Object.keys(SEGMENT_SENT_AT) as SendStepId[]) {
    if (!contact.sentSteps.includes(step)) continue;
    const copy = copyFor(step, member);
    const base = {
      recipientLeadId: contact.id, recipientLeadName: contact.name, recipientLeadEmail: contact.email || null,
      recipientLeadPhone: contact.phone || null, recipientLeadStatus: member ? "Member" : "Existing patient",
      isOrphaned: false, sequence: BLACK_FRIDAY_SEQUENCE, sequenceStep: STEP_LABEL[step],
      deliveryStatus: "Sent" as const, rawDeliveryStatus: "sent", sentAt: SEGMENT_SENT_AT[step],
      mandrillMessageId: null, errorReason: null, createdTime: SEGMENT_SENT_AT[step],
    };
    if (hadChannel(contact, "email", SEGMENT_SENT_AT[step])) out.push({ ...base, id: `${contact.id}:${step}:email`, channel: "Email", messageBody: `Subject: ${copy.subject}\n\n${emailBody(first, copy.line, step)}` });
    if (hadChannel(contact, "sms", SEGMENT_SENT_AT[step])) out.push({ ...base, id: `${contact.id}:${step}:sms`, channel: "SMS", messageBody: copy.sms });
  }
  return out;
}
