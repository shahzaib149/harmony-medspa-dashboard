"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Mail, MessageSquare, X } from "lucide-react";
import { SEND_HOUR_UTC_OFFSET, SEND_STEPS, isSendable, type AudienceContact } from "@/lib/black-friday/campaign";
import { Avatar, Tag, workspace as s } from "@/components/campaigns/workspace/parts";
import { OptOutControls } from "@/components/campaigns/BfOptOut";

const longDate = (iso: string) => new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));

function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  if (!value) return null;
  return (
    <button type="button" className={s.copy} aria-label={`Copy ${label}`}
      onClick={() => { void navigator.clipboard?.writeText(value); setDone(true); window.setTimeout(() => setDone(false), 1400); }}>
      {done ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

/** Detail popup for one of Hayden's Black Friday contacts (members and patients, not leads). */
export default function BfContactModal({ contact, onClose, nowMs, onOptOut }: {
  contact: AudienceContact | null;
  onClose: () => void;
  /** Current time (from the workspace clock). */
  nowMs: number;
  /** Editors only: called after emails / texts / everything were stopped for this contact. */
  onOptOut?: (updated: AudienceContact, message: string) => void;
}) {
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!contact) return;
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = previous; };
  }, [contact, onClose]);
  if (!contact) return null;

  const c = contact;
  const emailOn = c.emailOk && !!c.email;
  const smsOn = c.smsOk && !!c.phone;
  const channels = [emailOn ? "email" : "", smsOn ? "text" : ""].filter(Boolean).join(" + ") || "no channel";
  const member = c.segment === "Member";

  return (
    <div className={s.modalBackdrop} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="bf-contact-title" className={s.modal}>
        <header className={s.modalHead}>
          <div className="flex min-w-0 items-center gap-3.5">
            <Avatar name={c.name} />
            <div className="min-w-0">
              <p className={s.eyebrow}>Black Friday contact</p>
              <h2 id="bf-contact-title" className="mt-1 truncate text-xl font-bold text-[var(--text-primary)]">{c.name}</h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Tag tone={member ? "gold" : "muted"}>{member ? "Member" : "Existing patient"}</Tag>
                {c.unsubscribed ? <Tag tone="danger">Unsubscribed</Tag> : null}
                {c.alsoLead ? <Tag tone="info">Also a website lead</Tag> : null}
                {!isSendable(c) && !c.unsubscribed && !c.alsoLead ? <Tag tone="warning">Not reachable</Tag> : null}
              </div>
            </div>
          </div>
          <button ref={close} type="button" className={s.iconButton} aria-label="Close" onClick={onClose}><X size={17} /></button>
        </header>

        <div className={s.modalBody}>
          <section className={s.modalSection} aria-labelledby="bf-reach">
            <p id="bf-reach" className={s.sectionLabel}>How we reach them</p>
            <div className={s.tiles}>
              {([
                ["Email", Mail, c.email, emailOn, c.email ? (c.emailOk ? "Gets Black Friday emails" : "Emails off (shared inbox or opted out)") : "No email on file"],
                ["Text", MessageSquare, c.phone, smsOn, c.phone ? (c.smsOk ? "Gets Black Friday texts" : "Texts off (shared or invalid number)") : "No phone on file"],
              ] as const).map(([label, Icon, value, on, hint]) => (
                <div key={label} className={s.tileBox}>
                  <div className={s.tileTop}>
                    <span className="inline-flex items-center gap-1.5"><Icon size={14} /> {label}</span>
                    <Tag tone={on ? "success" : "muted"}>{on ? "Can send" : "Off"}</Tag>
                  </div>
                  <div className={s.tileValue}><span className="min-w-0 break-all">{value || "—"}</span><CopyButton value={value} label={label.toLowerCase()} /></div>
                  <p className="text-xs text-[var(--text-muted)]">{hint}</p>
                </div>
              ))}
            </div>
          </section>

          {onOptOut || c.unsubscribed ? (
            <section className={s.modalSection} aria-labelledby="bf-optout">
              <p id="bf-optout" className={s.sectionLabel}>Unsubscribe</p>
              <OptOutControls contact={c} onSaved={onOptOut ?? (() => undefined)} />
              <p className="text-xs leading-5 text-[var(--text-muted)]">Use this when someone asks to stop, by reply, phone or in person. Emails from Nov 27 also carry their own unsubscribe link, and texts honour STOP.</p>
            </section>
          ) : null}

          <section className={s.modalSection} aria-labelledby="bf-sends">
            <p id="bf-sends" className={s.sectionLabel}>Black Friday sends</p>
            <ol className={s.timeline}>
              {SEND_STEPS.map((step) => {
                const got = c.sentSteps.includes(step.id);
                // The next 10:00 ET slot for this step that hasn't happened yet.
                const nextSlot = step.sendDates.map((d) => `${d}${SEND_HOUR_UTC_OFFSET}`).find((at) => Date.parse(at) > nowMs);
                const text = got
                  ? `Sent by ${channels} · ${member ? "member" : "patient"} wording`
                  : c.unsubscribed ? "Won't be sent: unsubscribed"
                    : !isSendable(c) ? "Won't be sent: no usable channel (emails and texts off)"
                    : nextSlot ? `Next send ${longDate(nextSlot)} ET` : "Window closed before this contact was reached";
                return (
                  <li key={step.id} className={s.timelineItem}>
                    <span className={`${s.timelineDot} ${got ? s.timelineDotDone : ""}`}>{got ? <Check size={14} /> : null}</span>
                    <div className="min-w-0">
                      <p className={s.timelineTitle}>{step.label}</p>
                      <p className={s.timelineText}>{text}</p>
                    </div>
                    <Tag tone={got ? "success" : "muted"}>{got ? "Sent" : step.window}</Tag>
                  </li>
                );
              })}
            </ol>
            <p className="text-xs leading-5 text-[var(--text-muted)]">The segment sends record which step reached each contact; individual message copies are kept in Make.</p>
          </section>

          {c.notes ? (
            <section className={s.modalSection} aria-labelledby="bf-notes">
              <p id="bf-notes" className={s.sectionLabel}>Notes</p>
              <p className={s.noteBox}>{c.notes}</p>
            </section>
          ) : null}
        </div>
      </section>
    </div>
  );
}
