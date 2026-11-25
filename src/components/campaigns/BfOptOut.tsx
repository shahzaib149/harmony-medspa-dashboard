"use client";

import { useEffect, useRef, useState } from "react";
import { BellOff, Check, ClipboardList, Mail, MessageSquare, X } from "lucide-react";
import { withOptOut, type OptOut, type UnsubscribeMatch } from "@/lib/black-friday/audience";
import type { AudienceContact } from "@/lib/black-friday/campaign";
import { Tag, workspace as s } from "@/components/campaigns/workspace/parts";

const ACTIONS: { kind: OptOut; label: string; confirm: (name: string) => string; done: string; Icon: typeof Mail }[] = [
  { kind: "email", label: "Stop emails", confirm: (n) => `Stop Black Friday emails to ${n}? Texts continue if allowed.`, done: "Emails stopped", Icon: Mail },
  { kind: "sms", label: "Stop texts", confirm: (n) => `Stop Black Friday texts to ${n}? Emails continue if allowed.`, done: "Texts stopped", Icon: MessageSquare },
  { kind: "all", label: "Unsubscribe from all", confirm: (n) => `Unsubscribe ${n} from all Black Friday emails and texts? They won't get the remaining sends.`, done: "Unsubscribed", Icon: BellOff },
];

/**
 * Stop emails, texts or everything for one contact, with an inline confirm. Already-off
 * channels are hidden; an unsubscribed contact just shows that state.
 */
export function OptOutControls({ contact, onSaved, compact = false }: {
  contact: AudienceContact;
  onSaved: (updated: AudienceContact, message: string) => void;
  compact?: boolean;
}) {
  const [pending, setPending] = useState<OptOut | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setPending(null); setError(""); }, [contact.id]);

  if (contact.unsubscribed) {
    return <p className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]"><BellOff size={14} /> Unsubscribed. No more Black Friday emails or texts.</p>;
  }
  const available = ACTIONS.filter((a) => (a.kind === "email" ? contact.emailOk : a.kind === "sms" ? contact.smsOk : true));
  const action = ACTIONS.find((a) => a.kind === pending);

  async function save(kind: OptOut) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/black-friday/audience/${contact.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stop: kind }) });
      const body = await response.json().catch(() => ({})) as { fields?: Record<string, unknown>; error?: string };
      if (!response.ok || !body.fields) throw new Error(body.error || "Couldn't save. Please try again.");
      setPending(null);
      onSaved(withOptOut(contact, body.fields), `${ACTIONS.find((a) => a.kind === kind)?.done}: ${contact.name}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (action) {
    return (
      <div className="grid gap-2 rounded-2xl border p-3" style={{ borderColor: "var(--warning-border)", background: "var(--warning-bg)" }} role="group" aria-label="Confirm opt-out">
        <p className="text-sm font-semibold" style={{ color: "var(--warning-text)" }}>{action.confirm(contact.name)}</p>
        {error ? <p role="alert" className="text-xs font-semibold" style={{ color: "var(--danger-text)" }}>{error}</p> : null}
        <div className="flex flex-wrap gap-2">
          <button type="button" className={s.btnPrimary} disabled={saving} onClick={() => void save(action.kind)}><Check size={15} /> {saving ? "Saving…" : action.label}</button>
          <button type="button" className={s.btn} disabled={saving} onClick={() => setPending(null)}>Cancel</button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {available.map(({ kind, label, Icon }) => (
        <button key={kind} type="button" className={s.btn} style={compact ? { minHeight: 34, padding: "0 12px", fontSize: 12 } : undefined} onClick={() => setPending(kind)}>
          <Icon size={14} /> {label}
        </button>
      ))}
    </div>
  );
}

/** Paste Hayden's unsubscribe list (emails and/or phones): preview the matches, then unsubscribe them. */
export function UnsubscribeListDialog({ open, onClose, onApplied }: {
  open: boolean;
  onClose: () => void;
  onApplied: (ids: string[], applied: number) => void;
}) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<(UnsubscribeMatch & { applied: number }) | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const field = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    field.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onClose(); };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = previous; };
  }, [open, busy, onClose]);
  if (!open) return null;

  async function call(confirm: boolean) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/black-friday/audience/unsubscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, confirm }) });
      const body = await response.json().catch(() => ({})) as UnsubscribeMatch & { applied: number; error?: string };
      if (!response.ok || body.error) throw new Error(body.error || "Couldn't check the list. Please try again.");
      if (confirm) {
        onApplied(body.matched.map((m) => m.id), body.applied);
        setText("");
        setPreview(null);
      } else setPreview(body);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const toApply = preview ? preview.matched.filter((m) => !m.already).length : 0;
  return (
    <div className={s.modalBackdrop} onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="bf-unsub-title" className={s.modal}>
        <header className={s.modalHead}>
          <div className="flex min-w-0 items-center gap-3.5">
            <span className={s.feedIcon} aria-hidden="true"><ClipboardList size={18} /></span>
            <div className="min-w-0">
              <p className={s.eyebrow}>Hayden&apos;s list</p>
              <h2 id="bf-unsub-title" className="mt-1 text-xl font-bold text-[var(--text-primary)]">Mark unsubscribes</h2>
            </div>
          </div>
          <button type="button" className={s.iconButton} aria-label="Close" onClick={onClose} disabled={busy}><X size={17} /></button>
        </header>
        <div className={s.modalBody}>
          <label className="grid gap-2">
            <span className={s.sectionLabel}>Emails or phone numbers</span>
            <textarea ref={field} value={text} onChange={(e) => { setText(e.target.value); setPreview(null); }} rows={7}
              placeholder={"One per line, or separated by commas.\njane@example.com\n(941) 555-0100"}
              className="w-full resize-y rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-1)] p-3 font-mono text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)]" />
            <span className="text-xs leading-5 text-[var(--text-muted)]">Matching contacts are unsubscribed from all Black Friday emails and texts, so they won&apos;t get the remaining sends. Nothing changes until you confirm.</span>
          </label>

          {error ? <p role="alert" className="rounded-xl border px-3 py-2 text-sm font-semibold" style={{ borderColor: "var(--danger-border)", background: "var(--danger-bg)", color: "var(--danger-text)" }}>{error}</p> : null}

          {preview ? (
            <section className={s.modalSection} aria-live="polite" aria-label="Matches">
              <div className="flex flex-wrap gap-2">
                <Tag tone="success">{toApply} to unsubscribe</Tag>
                {preview.matched.length - toApply ? <Tag tone="muted">{preview.matched.length - toApply} already unsubscribed</Tag> : null}
                {preview.unmatched.length ? <Tag tone="warning">{preview.unmatched.length} not on the list</Tag> : null}
                {preview.unreadable.length ? <Tag tone="danger">{preview.unreadable.length} not an email or phone</Tag> : null}
              </div>
              {preview.matched.length ? (
                <ul className="max-h-56 divide-y divide-[var(--border-subtle)] overflow-y-auto rounded-2xl border border-[var(--border-subtle)]">
                  {preview.matched.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                      <span className="min-w-0"><span className="block truncate font-semibold text-[var(--text-primary)]">{m.name}</span><span className="block truncate text-xs text-[var(--text-muted)]">{[m.email, m.phone].filter(Boolean).join(" · ")}</span></span>
                      {m.already ? <Tag tone="muted">Already</Tag> : <Tag tone="danger">Unsubscribe</Tag>}
                    </li>
                  ))}
                </ul>
              ) : null}
              {preview.unmatched.length || preview.unreadable.length ? (
                <p className="text-xs leading-5 text-[var(--text-muted)]">Not found: {[...preview.unmatched, ...preview.unreadable].slice(0, 12).join(", ")}{preview.unmatched.length + preview.unreadable.length > 12 ? "…" : ""}</p>
              ) : null}
            </section>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className={s.btn} onClick={onClose} disabled={busy}>Cancel</button>
            {preview && toApply ? (
              <button type="button" className={s.btnPrimary} onClick={() => void call(true)} disabled={busy}><BellOff size={15} /> {busy ? "Saving…" : `Unsubscribe ${toApply} contact${toApply === 1 ? "" : "s"}`}</button>
            ) : (
              <button type="button" className={s.btnPrimary} onClick={() => void call(false)} disabled={busy || !text.trim()}>{busy ? "Checking…" : "Check list"}</button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
