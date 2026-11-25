// Opting Black Friday contacts out (BF Audience). Pure helpers, unit-tested in
// tests/black-friday-audience.test.ts; the Airtable writes live in audience-server.ts.
import { normalizeUsPhone } from "@/lib/airtable/fields";
import type { AudienceContact } from "./campaign";

/** What to stop: emails, texts, or everything (Unsubscribed also skips the contact in the sends). */
export type OptOut = "email" | "sms" | "all";

export function isOptOut(value: unknown): value is OptOut {
  return value === "email" || value === "sms" || value === "all";
}

const LABEL: Record<OptOut, string> = { email: "Emails stopped", sms: "Texts stopped", all: "Unsubscribed (email + text)" };

/** e.g. "Nov 25" in America/New_York. */
function shortDate(now: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" }).format(now);
}

/**
 * Airtable fields for an opt-out. The reason goes on its own line at the end of Notes,
 * so earlier notes (shared household email, invalid phone) are kept.
 */
export function optOutFields(kind: OptOut, currentNotes: string, by: string, now = new Date()) {
  const line = `${LABEL[kind]} ${shortDate(now)}${by ? ` · ${by}` : ""}`;
  const notes = currentNotes.trim() ? `${currentNotes.trim()}\n${line}` : line;
  if (kind === "email") return { "Email OK": false, Notes: notes };
  if (kind === "sms") return { "SMS OK": false, Notes: notes };
  return { Unsubscribed: true, "Email OK": false, "SMS OK": false, Notes: notes };
}

/** The contact as it reads after an opt-out was saved (the fields the API wrote). */
export function withOptOut<T extends Pick<AudienceContact, "emailOk" | "smsOk" | "unsubscribed" | "notes">>(contact: T, fields: Record<string, unknown>): T {
  return {
    ...contact,
    emailOk: fields["Email OK"] === false ? false : contact.emailOk,
    smsOk: fields["SMS OK"] === false ? false : contact.smsOk,
    unsubscribed: fields.Unsubscribed === true ? true : contact.unsubscribed,
    notes: typeof fields.Notes === "string" ? fields.Notes : contact.notes,
  };
}

/** Split pasted text (one per line, or comma / semicolon separated) into emails and phones. */
export function parseContactList(text: string) {
  const emails = new Set<string>();
  const phones = new Set<string>();
  const unreadable: string[] = [];
  for (const raw of text.split(/[\n,;\t]+/)) {
    const item = raw.trim().replace(/^<|>$/g, "");
    if (!item) continue;
    const email = item.match(/[^\s<>"']+@[^\s<>"']+\.[^\s<>"']+/)?.[0];
    if (email) { emails.add(email.toLowerCase()); continue; }
    const phone = normalizeUsPhone(item);
    if (phone) phones.add(phone);
    else unreadable.push(item);
  }
  return { emails, phones, unreadable };
}

export type UnsubscribeMatch = {
  matched: { id: string; name: string; email: string; phone: string; already: boolean }[];
  /** Pasted emails / phones with no contact on the list. */
  unmatched: string[];
  unreadable: string[];
};

/** Match a pasted list against the audience by email (any case) or phone (any US format). */
export function matchContacts(text: string, audience: Pick<AudienceContact, "id" | "name" | "email" | "phone" | "unsubscribed">[]): UnsubscribeMatch {
  const { emails, phones, unreadable } = parseContactList(text);
  const found = new Set<string>();
  const matched: UnsubscribeMatch["matched"] = [];
  for (const contact of audience) {
    const email = contact.email.trim().toLowerCase();
    const phone = normalizeUsPhone(contact.phone) ?? "";
    const hitEmail = !!email && emails.has(email);
    const hitPhone = !!phone && phones.has(phone);
    if (!hitEmail && !hitPhone) continue;
    if (hitEmail) found.add(email);
    if (hitPhone) found.add(phone);
    matched.push({ id: contact.id, name: contact.name, email: contact.email, phone: contact.phone, already: contact.unsubscribed });
  }
  const unmatched = [...emails, ...phones].filter((value) => !found.has(value));
  return { matched, unmatched, unreadable };
}
