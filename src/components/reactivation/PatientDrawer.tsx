"use client";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { DateTime } from "luxon";
import { CalendarCheck, ChevronDown, Mail, MailX, MessageCircleReply, MessageSquare, RefreshCw } from "lucide-react";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";
import { CLINIC_ZONE, deliveryState, type Patient, type PatientMessage } from "@/lib/reactivation/model";
import PatientDialog from "./PatientDialog";
import DeletePatientButton from "./DeletePatientButton";
import s from "./reactivation.module.css";

type Detail = { patient: Patient; messages: PatientMessage[] };
type Action = "replied" | "booked" | "opted-out";

function date(value: string, withTime = false) {
  if (!value) return "Not recorded";
  const d = DateTime.fromISO(value, { zone: CLINIC_ZONE }).setZone(CLINIC_ZONE);
  return d.isValid ? d.toFormat(withTime ? "MMM d, yyyy · h:mm a ZZZZ" : "MMM d, yyyy") : "Not recorded";
}
async function json<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed. Please retry.");
  return data;
}

const DELIVERY_TONE = {
  sent: { color: "var(--neutral-text)", background: "var(--neutral-bg)", border: "var(--neutral-border)" },
  failed: { color: "var(--danger-text)", background: "var(--danger-bg)", border: "var(--danger-border)" },
  pending: { color: "var(--warning-text)", background: "var(--warning-bg)", border: "var(--warning-border)" },
};

// Collapsed to a two-line preview; expands to the full message and delivery details.
export function MessageCard({ message, open, onToggle, patientName, onPatient }: { message: PatientMessage; open: boolean; onToggle: () => void; patientName?: string; onPatient?: () => void }) {
  const tone = DELIVERY_TONE[deliveryState(message.status)];
  return <article className="overflow-hidden rounded-2xl border transition-colors" style={{ borderColor: open ? "var(--brand-primary)" : "var(--border-subtle)", background: "var(--surface-1)" }}>
    {patientName && <div className="flex items-center justify-between gap-3 border-b px-4 py-2.5" style={{ borderColor: "var(--border-subtle)", background: "var(--background-subtle)" }}>
      {onPatient ? <button type="button" onClick={onPatient} className={"text-xs font-bold " + s.rowLink}>{patientName}</button> : <span className="text-xs font-bold">{patientName}</span>}
      {onPatient && <button type="button" onClick={onPatient} className="text-[11px] font-semibold" style={{ color: "var(--brand-primary)" }}>View patient</button>}
    </div>}
    <button type="button" aria-expanded={open} aria-controls={"message-" + message.id} onClick={onToggle} className="w-full p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--brand-primary)]">
      <div className="flex items-center justify-between gap-3">
        <p className="flex min-w-0 items-center gap-2 text-sm font-bold" style={{ color: "var(--text-primary)" }}>
          {message.channel.toLowerCase() === "sms" ? <MessageSquare size={15} /> : <Mail size={15} />}
          <span className="truncate">Reactivation · {message.step || message.channel}</span>
        </p>
        <span className="flex shrink-0 items-center gap-3">
          <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: tone.color, background: tone.background, borderColor: tone.border }}><span className="mr-1.5 size-1.5 rounded-full" style={{ background: tone.color }} aria-hidden="true" />{message.status}</span>
          <ChevronDown size={16} className="transition-transform duration-300" style={{ color: "var(--text-muted)", transform: open ? "rotate(180deg)" : "none" }} />
        </span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>{message.body || "No message body was recorded."}</p>
      <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>{date(message.sentAt, true)}</p>
    </button>
    <div id={"message-" + message.id} className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
      <div className="overflow-hidden">
        <div className="border-t px-4 pb-4 pt-4" style={{ borderColor: "var(--border-subtle)" }}>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--brand-primary)" }}>Full message</p>
          <p className="whitespace-pre-wrap break-words text-sm leading-7" style={{ color: "var(--text-primary)" }}>{message.body || "No message body was recorded."}</p>
          <div className="mt-4 rounded-xl p-3 text-xs leading-5" style={{ background: "var(--background-subtle)", color: "var(--text-muted)" }}>
            <p>Channel: {message.channel}</p>
            <p>Sent: {date(message.sentAt, true)}</p>
            <p>Delivery status: {message.status}</p>
          </div>
        </div>
      </div>
    </div>
  </article>;
}

// Patient profile, enrollment and message history, with staff actions. Shared by the
// Dormant Patients directory and the reactivation campaign page.
export default function PatientDrawer({ patientId, onClose, canManage, canDelete, onChanged, enrollSlot }: {
  patientId: string | null;
  onClose: () => void;
  canManage: boolean;
  canDelete: boolean;
  onChanged: (message: string, closed?: boolean) => void | Promise<void>;
  enrollSlot?: (patient: Patient) => ReactNode;
}) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stopId, setStopId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState<Action | "">("");
  const [openMessage, setOpenMessage] = useState<string | null>(null);

  const reload = useCallback(async (id: string, signal?: AbortSignal) => {
    setLoading(true); setError("");
    try { setDetail(await json<Detail>("/api/reactivation/patients/" + id, { signal })); }
    catch (e) { if (!signal?.aborted) setError(e instanceof Error ? e.message : "Could not load history."); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, []);

  useEffect(() => {
    if (!patientId) return;
    const controller = new AbortController();
    setDetail(null); setStopId(null); setOpenMessage(null);
    void reload(patientId, controller.signal);
    return () => controller.abort();
  }, [patientId, reload]);

  async function patientAction(action: Action) {
    if (!patientId || actionBusy) return;
    setActionBusy(action); setError("");
    try {
      const r = await json<{ stopped: number }>("/api/reactivation/patients/" + patientId + "/action", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const label = action === "replied" ? "Marked as replied" : action === "booked" ? "Marked as booked" : "Unsubscribed from emails";
      await reload(patientId);
      await onChanged(label + (r.stopped ? " · " + r.stopped + " enrollment stopped" : ""));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not update patient."); }
    finally { setActionBusy(""); }
  }

  async function stop() {
    if (!stopId || !patientId) return;
    setBusy(true); setError("");
    try {
      await json("/api/reactivation/stop", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enrollmentId: stopId }) });
      setStopId(null);
      await reload(patientId);
      await onChanged("Removed from campaign. Scheduled sends cleared; history retained.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not stop enrollment."); }
    finally { setBusy(false); }
  }

  const patient = detail?.patient;
  return <PatientDialog open={Boolean(patientId)} onClose={() => { if (!busy) onClose(); }} title={patient?.name || "Patient details"} eyebrow="Patient profile" drawer busy={busy}>
    {loading && !detail ? <LoadingRegion label="Loading patient history" className="grid gap-5">
      <div className={s.detailGrid}>{[0, 1, 2, 3, 4, 5].map(i => <div key={i}><Skeleton className="h-2.5 w-16 rounded-full" /><Skeleton className="mt-2.5 h-3.5 w-3/4 rounded-full" /></div>)}</div>
      <div className="flex flex-wrap gap-2">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-6 w-28 rounded-full" />)}</div>
      <Skeleton className="h-3.5 w-40 rounded-full" />
      {[0, 1].map(i => <div key={i} className={s.history}><Skeleton className="h-3.5 w-1/2 rounded-full" /><Skeleton className="mt-3 h-3 w-1/3 rounded-full" /><Skeleton className="mt-3 h-14 w-full rounded-lg" /></div>)}
    </LoadingRegion> : null}
    {error && <div className={s.notice + " " + s.warning} role="alert">{error}{patientId && !detail && <button className={s.button + " mt-3"} onClick={() => void reload(patientId)}>Retry</button>}</div>}
    {patient && <>
      <dl className={s.detailGrid}>{[["Phone", patient.phone], ["Email", patient.email], ["Last visit", date(patient.lastVisit)], ["Days since last visit", patient.days === null ? "Unknown" : String(patient.days)], ["Last treatment", patient.lastTreatment], ["Status", patient.status]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "Not recorded"}</dd></div>)}</dl>
      <div className="flex flex-wrap gap-2">{([["Email consent", patient.emailConsent], ["Opted out", patient.optedOut], ["Do not contact", patient.doNotContact], ["Future booking", patient.futureBooking]] as const).map(([label, value]) => <span key={label} className={s.badge + " " + s.neutral}>{label}: {value ? "Yes" : "No"}</span>)}</div>
      {enrollSlot?.(patient)}
      {canManage && <div className={s.actionRow}>{([["replied", "Mark replied", MessageCircleReply], ["booked", "Mark booked", CalendarCheck], ["opted-out", "Unsubscribe", MailX]] as const).map(([action, label, Icon]) => <button key={action} className={s.button} disabled={Boolean(actionBusy) || busy} onClick={() => void patientAction(action)}>{actionBusy === action ? <RefreshCw size={14} className="animate-spin" /> : <Icon size={14} />}{label}</button>)}</div>}
      {canDelete && <DeletePatientButton id={patient.id} name={patient.name} onDeleted={async () => { onClose(); setDetail(null); await onChanged("Patient permanently deleted. History retained.", true); }} />}
      <section><h3 className={s.sectionTitle}>Enrollment history · {patient.enrollments.length}</h3>{!patient.enrollments.length ? <p className={s.muted}>This patient hasn’t been enrolled in reactivation.</p> : <div className={s.timeline}>{patient.enrollments.map(e => <article key={e.id} className={s.history}><div className="flex justify-between gap-2"><h4>{e.campaign}</h4><span className={s.badge + " " + (e.status === "Active" ? "" : s.neutral)}>{e.status}</span></div><p>{e.currentStep}</p><p className={s.muted}>Enrolled: {date(e.createdAt, true)}<br />Next send: {date(e.nextSendAt, true)}<br />Last sent: {date(e.lastSentAt, true)}<br />Stop reason: {e.stopReason || "—"}</p>{["Active", "Paused"].includes(e.status) && canManage && (stopId === e.id ? <div className={s.notice}><p>Remove this patient from the campaign? Scheduled sends will be cleared; enrollment and message history will remain.</p><div className="mt-3 flex gap-2"><button className={s.button} disabled={busy} onClick={() => setStopId(null)}>Cancel</button><button className={s.button} disabled={busy} onClick={stop}>{busy ? "Stopping…" : "Remove from campaign"}</button></div></div> : <button className={s.button + " mt-3"} disabled={busy} onClick={() => setStopId(e.id)}>Remove from campaign</button>)}</article>)}</div>}</section>
      <section><h3 className={s.sectionTitle}>Message history · {detail.messages.length}</h3>{!detail.messages.length ? <p className={s.muted}>No messages have been logged for this patient yet.</p> : <div className="grid gap-3">{detail.messages.map(m => <MessageCard key={m.id} message={m} open={openMessage === m.id} onToggle={() => setOpenMessage(current => current === m.id ? null : m.id)} />)}</div>}</section>
    </>}
  </PatientDialog>;
}
