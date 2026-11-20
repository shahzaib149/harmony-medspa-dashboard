"use client";

import { useState } from "react";
import { Gift, Mail, MessageSquare, Phone, ShieldAlert } from "lucide-react";
import type { Lead } from "@/lib/leads/map-lead";
import { GIFT_CARD_STATUSES, type GiftCardStatus } from "@/lib/leads/classification";

// Gift card requests from the website /gift-cards form (Make scenario 7108868).
// Staff contact the PURCHASER only. The recipient block is shown for preparing the
// card and is never linked as tel:/mailto:, so nobody can contact them by accident.

const TEXT = "var(--text-primary)";
const MUTED = "var(--text-muted)";
const BORDER = "var(--border-subtle)";
const CARD = "var(--surface-1)";
const GOLD = "var(--brand-primary)";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function formatGiftAmount(value: number | null) {
  return value === null ? "—" : usd.format(value);
}

const STATUS_TONE: Record<GiftCardStatus, { color: string; bg: string; border: string }> = {
  Requested: { color: "var(--info-text)", bg: "var(--info-bg)", border: "var(--info-border)" },
  Contacted: { color: "var(--warning-text)", bg: "var(--warning-bg)", border: "var(--warning-border)" },
  Paid: { color: "var(--success-text)", bg: "var(--success-bg)", border: "var(--success-border)" },
  Issued: { color: "var(--success-text)", bg: "var(--success-bg)", border: "var(--success-border)" },
  Completed: { color: "var(--neutral-text)", bg: "var(--neutral-bg)", border: "var(--neutral-border)" },
  Cancelled: { color: "var(--danger-text)", bg: "var(--danger-bg)", border: "var(--danger-border)" },
};

function tone(status: string) {
  return STATUS_TONE[status as GiftCardStatus] ?? STATUS_TONE.Requested;
}

export function GiftCardStatusPill({ status }: { status: string }) {
  const t = tone(status || "Requested");
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
      style={{ color: t.color, backgroundColor: t.bg, border: `1px solid ${t.border}` }}
      aria-label={`Gift card status: ${status || "Requested"}`}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.color }} />
      {status || "Requested"}
    </span>
  );
}

function submitted(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function contactLabel(method: string) {
  return method === "SMS" ? "Text (SMS)" : method || "—";
}

/** The Gift Cards tab list: newest first (the API already sorts by Lead Created At desc). */
export function GiftCardsTable({ leads, onOpen }: { leads: Lead[]; onOpen: (lead: Lead) => void }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border lg:block" style={{ borderColor: BORDER, backgroundColor: CARD }}>
        <table className="w-full table-fixed border-separate border-spacing-0">
          <thead>
            <tr style={{ backgroundColor: "var(--background-subtle)" }}>
              {["Purchaser", "Amount", "Bonus", "Preferred contact", "Gift card status", "Submitted"].map((label, index) => (
                <th key={label} className={`border-b px-3 py-3 text-left text-[10px] font-bold uppercase tracking-[0.09em] ${index === 0 ? "w-[30%]" : ""}`} style={{ color: MUTED, borderColor: BORDER }}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr
                key={lead.id}
                tabIndex={0}
                className="cursor-pointer transition-colors hover:bg-[var(--surface-hover)]"
                onClick={() => onOpen(lead)}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpen(lead); } }}
              >
                <td className="border-b px-3 py-3" style={{ borderColor: BORDER }}>
                  <p className="text-sm font-bold [overflow-wrap:anywhere]" style={{ color: TEXT }}>{lead.name || "Unnamed purchaser"}</p>
                  <p className="text-[11px] [overflow-wrap:anywhere]" style={{ color: MUTED }}>{[lead.phone, lead.email].filter(Boolean).join(" · ") || "No contact details"}</p>
                </td>
                <td className="border-b px-3 py-3 text-sm font-bold tabular-nums" style={{ borderColor: BORDER, color: TEXT }}>{formatGiftAmount(lead.giftCardAmount)}</td>
                <td className="border-b px-3 py-3 text-sm tabular-nums" style={{ borderColor: BORDER, color: lead.giftCardBonus ? GOLD : MUTED }}>{lead.giftCardBonus ? formatGiftAmount(lead.giftCardBonus) : "—"}</td>
                <td className="border-b px-3 py-3 text-xs font-semibold" style={{ borderColor: BORDER, color: TEXT }}>{contactLabel(lead.preferredContactMethod)}</td>
                <td className="border-b px-3 py-3" style={{ borderColor: BORDER }}><GiftCardStatusPill status={lead.giftCardStatus} /></td>
                <td className="border-b px-3 py-3 text-xs" style={{ borderColor: BORDER, color: MUTED }}>{submitted(lead.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="grid gap-3 lg:hidden">
        {leads.map((lead) => (
          <li key={lead.id}>
            <button type="button" onClick={() => onOpen(lead)} className="w-full rounded-2xl border p-4 text-left" style={{ borderColor: BORDER, backgroundColor: CARD }}>
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-sm font-bold [overflow-wrap:anywhere]" style={{ color: TEXT }}>{lead.name || "Unnamed purchaser"}</span>
                  <span className="block text-[11px]" style={{ color: MUTED }}>{submitted(lead.createdAt)} · {contactLabel(lead.preferredContactMethod)}</span>
                </span>
                <span className="shrink-0 text-base font-extrabold tabular-nums" style={{ color: TEXT }}>{formatGiftAmount(lead.giftCardAmount)}</span>
              </span>
              <span className="mt-3 flex flex-wrap items-center gap-2">
                <GiftCardStatusPill status={lead.giftCardStatus} />
                {lead.giftCardBonus ? <span className="text-[11px] font-semibold" style={{ color: GOLD }}>+{formatGiftAmount(lead.giftCardBonus)} bonus</span> : null}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: MUTED }}>{label}</p>
      <p className="mt-0.5 text-sm font-semibold [overflow-wrap:anywhere]" style={{ color: TEXT }}>{value || "—"}</p>
    </div>
  );
}

/** Lead detail section for a Gift Card Lead: purchaser (contactable), recipient (never), amount and status. */
export function GiftCardRequestCard({
  lead,
  canUpdate,
  getAuthHeaders,
  onUpdated,
}: {
  lead: Lead;
  canUpdate: boolean;
  getAuthHeaders: () => Promise<HeadersInit>;
  onUpdated: (lead: Lead) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const status = lead.giftCardStatus || "Requested";
  const recipient = [lead.recipientFirstName, lead.recipientLastName].filter(Boolean).join(" ");

  async function changeStatus(next: string) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/airtable/leads", {
        method: "PATCH",
        credentials: "same-origin",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ id: lead.id, giftCardStatus: next }),
      });
      const data = await response.json().catch(() => ({})) as { error?: string; lead?: Lead };
      if (!response.ok || data.error) throw new Error(data.error ?? "Could not update the gift card status");
      onUpdated(data.lead ?? { ...lead, giftCardStatus: next });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update the gift card status");
    } finally {
      setSaving(false);
    }
  }

  const contactButtons = [
    lead.phone ? { label: "Call", href: `tel:${lead.phone}`, icon: Phone } : null,
    lead.phone ? { label: "Text", href: `sms:${lead.phone}`, icon: MessageSquare } : null,
    lead.email ? { label: "Email", href: `mailto:${lead.email}`, icon: Mail } : null,
  ].filter((item): item is { label: string; href: string; icon: typeof Phone } => Boolean(item));

  return (
    <section className="mt-5 rounded-2xl border p-4" style={{ borderColor: "rgba(201,168,76,0.35)", backgroundColor: CARD }} aria-labelledby="gift-card-request-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p id="gift-card-request-title" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: GOLD }}>
          <Gift size={14} aria-hidden="true" /> Gift card request
        </p>
        {canUpdate ? (
          <label className="flex items-center gap-2 text-xs font-semibold" style={{ color: MUTED }}>
            Status
            <select
              value={status}
              disabled={saving}
              onChange={(event) => void changeStatus(event.target.value)}
              className="min-h-9 rounded-full border px-3 text-xs font-bold"
              style={{ color: tone(status).color, backgroundColor: tone(status).bg, borderColor: tone(status).border }}
              aria-label="Gift card status"
            >
              {GIFT_CARD_STATUSES.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        ) : (
          <GiftCardStatusPill status={status} />
        )}
      </div>
      {error ? <p role="alert" className="mt-2 text-xs font-semibold" style={{ color: "var(--danger-text)" }}>{error}</p> : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Field label="Amount" value={formatGiftAmount(lead.giftCardAmount)} />
        <Field label="Black Friday bonus" value={lead.giftCardBonus ? formatGiftAmount(lead.giftCardBonus) : "None"} />
        <Field label="Preferred contact" value={contactLabel(lead.preferredContactMethod)} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border p-3" style={{ borderColor: BORDER }}>
          <p className="text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: MUTED }}>Purchaser · contact this person</p>
          <p className="mt-1 text-sm font-bold" style={{ color: TEXT }}>{lead.name || "Unnamed purchaser"}</p>
          <p className="text-xs [overflow-wrap:anywhere]" style={{ color: MUTED }}>{[lead.phone, lead.email].filter(Boolean).join(" · ") || "No contact details"}</p>
          {contactButtons.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {contactButtons.map(({ label, href, icon: Icon }) => (
                <a key={label} href={href} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold" style={{ borderColor: BORDER, color: TEXT }}>
                  <Icon size={13} aria-hidden="true" /> {label}
                </a>
              ))}
            </div>
          ) : null}
        </div>
        <div className="rounded-xl border p-3" style={{ borderColor: "var(--danger-border)", backgroundColor: "var(--danger-bg)" }}>
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: "var(--danger-text)" }}>
            <ShieldAlert size={12} aria-hidden="true" /> Recipient · do not contact (surprise gift)
          </p>
          <p className="mt-1 text-sm font-bold" style={{ color: TEXT }}>{recipient || "—"}</p>
          <p className="text-xs [overflow-wrap:anywhere]" style={{ color: MUTED }}>{[lead.recipientPhone, lead.recipientEmail].filter(Boolean).join(" · ") || "No recipient details"}</p>
          <p className="mt-2 text-[11px]" style={{ color: "var(--danger-text)" }}>For preparing the card only. Never call, text or email the recipient.</p>
        </div>
      </div>
    </section>
  );
}
