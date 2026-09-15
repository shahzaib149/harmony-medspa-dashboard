"use client";

import {
  BadgeCheck,
  Clock3,
  Loader2,
  MapPin,
  PhoneCall,
  Plus,
  UserRoundPlus,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

type CallRecord = {
  id: string;
  date: string;
  time: string;
  occurredAt: string;
  areaCode: string;
  duration: number;
  assessment: string;
  kind: "conversation" | "brief" | "out-of-state" | "hangup";
  missed?: boolean;
};

type CallSourceId = "website" | "cs2";

type CallSource = {
  id: CallSourceId;
  label: string;
  line: string;
  range: string;
  calls: CallRecord[];
};

type CallLeadForm = {
  name: string;
  phone: string;
  email: string;
  treatment: string;
  notes: string;
};

type ExistingLead = { message?: string; notes?: string };

const CS2_CALLS: CallRecord[] = [
  { id: "cs2-2026-08-31-1306", date: "Aug 31", time: "1:06 PM", occurredAt: "2026-08-31T13:06:00-04:00", areaCode: "941", duration: 49, assessment: "Real conversation", kind: "conversation" },
  { id: "cs2-2026-09-01-1512", date: "Sep 1", time: "3:12 PM", occurredAt: "2026-09-01T15:12:00-04:00", areaCode: "941", duration: 30, assessment: "Short but real", kind: "conversation" },
  { id: "cs2-2026-09-02-1113", date: "Sep 2", time: "11:13 AM", occurredAt: "2026-09-02T11:13:00-04:00", areaCode: "330 · Ohio", duration: 87, assessment: "Out of state, but long", kind: "out-of-state" },
  { id: "cs2-2026-09-07-0958", date: "Sep 7", time: "9:58 AM", occurredAt: "2026-09-07T09:58:00-04:00", areaCode: "941", duration: 70, assessment: "Real conversation", kind: "conversation" },
  { id: "cs2-2026-09-07-1344", date: "Sep 7", time: "1:44 PM", occurredAt: "2026-09-07T13:44:00-04:00", areaCode: "Unknown", duration: 10, assessment: "Hangup / wrong number", kind: "hangup" },
  { id: "cs2-2026-09-08-0930", date: "Sep 8", time: "9:30 AM", occurredAt: "2026-09-08T09:30:00-04:00", areaCode: "941", duration: 20, assessment: "Brief", kind: "brief" },
  { id: "cs2-2026-09-08-1146", date: "Sep 8", time: "11:46 AM", occurredAt: "2026-09-08T11:46:00-04:00", areaCode: "Unknown", duration: 12, assessment: "Hangup", kind: "hangup" },
  { id: "cs2-2026-09-09-0918", date: "Sep 9", time: "9:18 AM", occurredAt: "2026-09-09T09:18:00-04:00", areaCode: "707 · California", duration: 28, assessment: "Out of state", kind: "out-of-state" },
];

// Website tracking line. Calls from other Florida area codes count as in-state.
const WEBSITE_CALLS: CallRecord[] = [
  { id: "web-2026-08-03-0925", date: "Aug 3", time: "9:25 AM", occurredAt: "2026-08-03T09:25:00-04:00", areaCode: "Unknown", duration: 0, assessment: "Missed call", kind: "hangup", missed: true },
  { id: "web-2026-08-03-0940", date: "Aug 3", time: "9:40 AM", occurredAt: "2026-08-03T09:40:00-04:00", areaCode: "941", duration: 52, assessment: "Real conversation", kind: "conversation" },
  { id: "web-2026-08-04-1211", date: "Aug 4", time: "12:11 PM", occurredAt: "2026-08-04T12:11:00-04:00", areaCode: "941", duration: 303, assessment: "Long conversation", kind: "conversation" },
  { id: "web-2026-08-04-1405", date: "Aug 4", time: "2:05 PM", occurredAt: "2026-08-04T14:05:00-04:00", areaCode: "813 · Tampa", duration: 101, assessment: "Real conversation", kind: "conversation" },
  { id: "web-2026-08-05-1425", date: "Aug 5", time: "2:25 PM", occurredAt: "2026-08-05T14:25:00-04:00", areaCode: "941", duration: 76, assessment: "Real conversation", kind: "conversation" },
  { id: "web-2026-08-06-1728", date: "Aug 6", time: "5:28 PM", occurredAt: "2026-08-06T17:28:00-04:00", areaCode: "203 · Connecticut", duration: 77, assessment: "Out of state, but long", kind: "out-of-state" },
  { id: "web-2026-08-07-1243", date: "Aug 7", time: "12:43 PM", occurredAt: "2026-08-07T12:43:00-04:00", areaCode: "207 · Maine", duration: 54, assessment: "Out of state", kind: "out-of-state" },
  { id: "web-2026-08-07-1522", date: "Aug 7", time: "3:22 PM", occurredAt: "2026-08-07T15:22:00-04:00", areaCode: "941", duration: 99, assessment: "Real conversation", kind: "conversation" },
  { id: "web-2026-08-10-1358", date: "Aug 10", time: "1:58 PM", occurredAt: "2026-08-10T13:58:00-04:00", areaCode: "941", duration: 35, assessment: "Short but real", kind: "conversation" },
  { id: "web-2026-08-10-1401", date: "Aug 10", time: "2:01 PM", occurredAt: "2026-08-10T14:01:00-04:00", areaCode: "941", duration: 40, assessment: "Real conversation", kind: "conversation" },
  { id: "web-2026-08-13-1448", date: "Aug 13", time: "2:48 PM", occurredAt: "2026-08-13T14:48:00-04:00", areaCode: "610 · Pennsylvania", duration: 66, assessment: "Out of state, but long", kind: "out-of-state" },
  { id: "web-2026-08-14-1342", date: "Aug 14", time: "1:42 PM", occurredAt: "2026-08-14T13:42:00-04:00", areaCode: "941", duration: 70, assessment: "Real conversation", kind: "conversation" },
  { id: "web-2026-08-17-0912", date: "Aug 17", time: "9:12 AM", occurredAt: "2026-08-17T09:12:00-04:00", areaCode: "610 · Pennsylvania", duration: 24, assessment: "Out of state", kind: "out-of-state" },
  { id: "web-2026-08-17-0918", date: "Aug 17", time: "9:18 AM", occurredAt: "2026-08-17T09:18:00-04:00", areaCode: "941", duration: 19, assessment: "Brief", kind: "brief" },
  { id: "web-2026-08-18-0921", date: "Aug 18", time: "9:21 AM", occurredAt: "2026-08-18T09:21:00-04:00", areaCode: "850 · Florida", duration: 77, assessment: "Real conversation", kind: "conversation" },
  { id: "web-2026-08-19-1232", date: "Aug 19", time: "12:32 PM", occurredAt: "2026-08-19T12:32:00-04:00", areaCode: "941", duration: 1166, assessment: "Long conversation", kind: "conversation" },
  { id: "web-2026-08-20-0806", date: "Aug 20", time: "8:06 AM", occurredAt: "2026-08-20T08:06:00-04:00", areaCode: "Unknown", duration: 0, assessment: "Hangup", kind: "hangup" },
  { id: "web-2026-08-20-0806-2", date: "Aug 20", time: "8:06 AM", occurredAt: "2026-08-20T08:06:00-04:00", areaCode: "267 · Pennsylvania", duration: 16, assessment: "Out of state", kind: "out-of-state" },
  { id: "web-2026-08-21-0909", date: "Aug 21", time: "9:09 AM", occurredAt: "2026-08-21T09:09:00-04:00", areaCode: "941", duration: 42, assessment: "Real conversation", kind: "conversation" },
  { id: "web-2026-08-25-1303", date: "Aug 25", time: "1:03 PM", occurredAt: "2026-08-25T13:03:00-04:00", areaCode: "941", duration: 52, assessment: "Real conversation", kind: "conversation" },
  { id: "web-2026-08-31-0946", date: "Aug 31", time: "9:46 AM", occurredAt: "2026-08-31T09:46:00-04:00", areaCode: "561 · Florida", duration: 33, assessment: "Short but real", kind: "conversation" },
  { id: "web-2026-08-31-1529", date: "Aug 31", time: "3:29 PM", occurredAt: "2026-08-31T15:29:00-04:00", areaCode: "732 · New Jersey", duration: 92, assessment: "Out of state, but long", kind: "out-of-state" },
  { id: "web-2026-09-01-1633", date: "Sep 1", time: "4:33 PM", occurredAt: "2026-09-01T16:33:00-04:00", areaCode: "941", duration: 37, assessment: "Short but real", kind: "conversation" },
  { id: "web-2026-09-08-1201", date: "Sep 8", time: "12:01 PM", occurredAt: "2026-09-08T12:01:00-04:00", areaCode: "Unknown", duration: 11, assessment: "Hangup", kind: "hangup" },
];

const CALL_SOURCES: CallSource[] = [
  { id: "website", label: "Website", line: "Website new", range: "Aug 3–Sep 8, 2026", calls: WEBSITE_CALLS },
  { id: "cs2", label: "CS2", line: "CS2", range: "Aug 31–Sep 9, 2026", calls: CS2_CALLS },
];

const ALL_CALLS = CALL_SOURCES.flatMap((source) => source.calls);

const EMPTY_FORM: CallLeadForm = {
  name: "",
  phone: "",
  email: "",
  treatment: "",
  notes: "",
};

function marker(id: string) {
  return "[Call lead: " + id + "]";
}

function formatDuration(call: CallRecord) {
  if (call.missed) return "Missed";
  if (call.duration < 120) return call.duration + "s";
  return Math.round(call.duration / 60) + " min";
}

function assessmentStyle(kind: CallRecord["kind"]) {
  if (kind === "conversation") return "border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]";
  if (kind === "hangup") return "border-[var(--danger-border)] bg-[var(--danger-bg)] text-[var(--danger-text)]";
  if (kind === "out-of-state") return "border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-text)]";
  return "border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-secondary)]";
}

export default function CallLeadsPanel({
  onLeadCreated,
}: {
  onLeadCreated: () => void;
}) {
  const { can } = useAuth();
  const canAddLead = can("update:leads");
  const [sourceId, setSourceId] = useState<CallSourceId>("website");
  const [selected, setSelected] = useState<CallRecord | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState<CallLeadForm>(EMPTY_FORM);

  const loadAddedCalls = useCallback(async () => {
    try {
      const params = new URLSearchParams({ source: "Call Leads", pageSize: "50" });
      const response = await fetch("/api/airtable/leads?" + params, {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!response.ok) return;
      const body = await response.json() as { items?: ExistingLead[] };
      const text = (body.items ?? [])
        .map((lead) => (lead.message ?? "") + "\n" + (lead.notes ?? ""))
        .join("\n");
      setAddedIds(new Set(
        ALL_CALLS.filter((call) => text.includes(marker(call.id))).map((call) => call.id),
      ));
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void loadAddedCalls();
  }, [loadAddedCalls]);

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) setSelected(null);
    };
    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [saving, selected]);

  const source = CALL_SOURCES.find((item) => item.id === sourceId) ?? CALL_SOURCES[0];
  const calls = source.calls;
  const summary = useMemo(() => {
    const answered = calls.filter((call) => !call.missed);
    return {
      conversations: calls.filter((call) => call.kind === "conversation").length,
      outOfState: calls.filter((call) => call.kind === "out-of-state").length,
      averageDuration: answered.length ? Math.round(answered.reduce((sum, call) => sum + call.duration, 0) / answered.length) : 0,
    };
  }, [calls]);

  function sourceFor(call: CallRecord) {
    return CALL_SOURCES.find((item) => item.calls.includes(call)) ?? source;
  }

  function openForm(call: CallRecord) {
    setForm(EMPTY_FORM);
    setError("");
    setSelected(call);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || saving) return;
    if (!form.name.trim() || !form.phone.trim()) {
      setError("Full name and phone number are required.");
      return;
    }
    setSaving(true);
    setError("");
    const callContext = [
      marker(selected.id),
      "Inbound " + sourceFor(selected).line + " call: " + selected.date + ", 2026 at " + selected.time + " ET",
      "Area code: " + selected.areaCode,
      "Duration: " + selected.duration + "s",
      "Call assessment: " + selected.assessment,
      form.notes.trim() ? "Staff notes: " + form.notes.trim() : "",
    ].filter(Boolean).join("\n");

    try {
      const response = await fetch("/api/airtable/leads", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          treatment: form.treatment,
          message: callContext,
          source: "Call Leads",
          leadCreatedAt: selected.occurredAt,
        }),
      });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(body.error || "Could not add this call lead");
      const savedName = form.name.trim();
      setAddedIds((current) => new Set(current).add(selected.id));
      setSelected(null);
      setNotice(savedName + " was added as a Call Lead.");
      window.setTimeout(() => setNotice(""), 4500);
      onLeadCreated();
    } catch (event) {
      setError(event instanceof Error ? event.message : "Could not add this call lead");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-4 overflow-hidden rounded-[20px] border border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-subtle)] px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]" aria-hidden="true">
            <PhoneCall size={19} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="overview-display text-lg font-semibold text-[var(--text-primary)]">Call Leads</h2>
              <div role="tablist" aria-label="Call source" className="inline-flex rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] p-0.5">
                {CALL_SOURCES.map((item) => {
                  const active = item.id === sourceId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setSourceId(item.id)}
                      className={"rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] " + (active ? "bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]")}
                    >
                      {item.label} <span className="tabular-nums opacity-70">{item.calls.length}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">Inbound call opportunities · {source.line} · {source.range}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <SummaryChip value={calls.length} label="calls" />
          <SummaryChip value={summary.conversations} label="conversations" />
          <SummaryChip value={summary.averageDuration + "s"} label="avg. duration" />
          <SummaryChip value={summary.outOfState} label="out of state" />
        </div>
      </div>

      {notice && (
        <div className="mx-4 mt-4 flex items-center gap-2 rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] px-3 py-2.5 text-xs font-semibold text-[var(--success-text)] sm:mx-5">
          <BadgeCheck size={16} /> {notice}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-2)] text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              <th className="px-5 py-3">Date & time</th>
              <th className="px-4 py-3">Caller region</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Call assessment</th>
              <th className="px-5 py-3 text-right">Lead record</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {calls.map((call) => {
              const added = addedIds.has(call.id);
              return (
                <tr key={call.id} className="transition-colors hover:bg-[var(--surface-hover)]">
                  <td className="px-5 py-3">
                    <p className="text-sm font-bold text-[var(--text-primary)]">{call.date}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{call.time} ET</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]"><MapPin size={13} />{call.areaCode}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs tabular-nums text-[var(--text-secondary)]"><Clock3 size={13} />{formatDuration(call)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={"inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold " + assessmentStyle(call.kind)}>{call.assessment}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {checking ? (
                      <span className="inline-flex min-h-9 items-center gap-1.5 px-3 text-xs text-[var(--text-muted)]"><Loader2 size={14} className="animate-spin" /> Checking</span>
                    ) : added ? (
                      <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[var(--success-border)] bg-[var(--success-bg)] px-3 text-xs font-bold text-[var(--success-text)]"><BadgeCheck size={14} /> Added</span>
                    ) : canAddLead ? (
                      <button type="button" onClick={() => openForm(call)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[var(--brand-primary)] px-3 text-xs font-extrabold text-[var(--primary-foreground)] transition hover:brightness-95"><UserRoundPlus size={14} /> Add details</button>
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">Details pending</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="call-lead-title">
          <button type="button" className="absolute inset-0 bg-black/75 backdrop-blur-sm" aria-label="Close Call Lead form" onClick={() => !saving && setSelected(null)} />
          <div className="relative flex h-dvh max-h-dvh w-full max-w-[620px] flex-col overflow-hidden border border-[var(--border-strong)] bg-[var(--surface-raised)] shadow-[var(--shadow-modal)] sm:h-auto sm:max-h-[92dvh] sm:rounded-3xl">
            <div className="flex shrink-0 items-start justify-between border-b border-[var(--border-subtle)] px-5 py-4 sm:px-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--brand-primary)]">Call Lead · {selected.date}, {selected.time}</p>
                <h2 id="call-lead-title" className="overview-display mt-1 text-xl font-semibold text-[var(--text-primary)]">Add caller details</h2>
                <p className="mt-1 text-xs text-[var(--text-muted)]">This creates an Airtable lead with source “Call Leads.”</p>
              </div>
              <button type="button" disabled={saving} onClick={() => setSelected(null)} className="grid size-10 shrink-0 place-items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-muted)] disabled:opacity-40" aria-label="Close"><X size={16} /></button>
            </div>
            <form onSubmit={submit} className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
              <div className="grid grid-cols-3 gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3 text-center">
                <CallFact label="Area code" value={selected.areaCode} />
                <CallFact label="Duration" value={formatDuration(selected)} />
                <CallFact label="Assessment" value={selected.assessment} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name *" value={form.name} onChange={(name) => setForm((current) => ({ ...current, name }))} placeholder="Caller’s full name" autoFocus />
                <Field label="Phone number *" value={form.phone} onChange={(phone) => setForm((current) => ({ ...current, phone }))} placeholder="(941) 555-0123" type="tel" />
                <Field label="Email address" value={form.email} onChange={(email) => setForm((current) => ({ ...current, email }))} placeholder="name@example.com" type="email" />
                <Field label="Treatment interest" value={form.treatment} onChange={(treatment) => setForm((current) => ({ ...current, treatment }))} placeholder="e.g. Medical weight loss" />
              </div>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-[var(--text-primary)]">Follow-up notes</span>
                <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} rows={4} placeholder="What did the caller ask about? Add the next action or appointment details." className="w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--input-bg)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus-visible:border-[var(--focus)] focus-visible:ring-2 focus-visible:ring-[var(--focus)]" />
              </label>
              {error && <p className="rounded-xl border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-2.5 text-sm text-[var(--danger-text)]">{error}</p>}
              <div className="flex flex-col-reverse gap-2 border-t border-[var(--border-subtle)] pt-4 sm:flex-row sm:justify-end">
                <button type="button" disabled={saving} onClick={() => setSelected(null)} className="min-h-11 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 text-sm font-bold text-[var(--text-primary)] disabled:opacity-40">Cancel</button>
                <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 text-sm font-extrabold text-[var(--primary-foreground)] disabled:opacity-60">
                  {saving ? <><Loader2 size={16} className="animate-spin" />Saving…</> : <><Plus size={16} />Add Call Lead</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function SummaryChip({ value, label }: { value: string | number; label: string }) {
  return <span className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2.5 py-1.5 text-[var(--text-muted)]"><strong className="mr-1 text-[var(--text-primary)] tabular-nums">{value}</strong>{label}</span>;
}

function CallFact({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">{label}</p><p className="mt-1 truncate text-xs font-bold text-[var(--text-primary)]" title={value}>{value}</p></div>;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoFocus = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-[var(--text-primary)]">{label}</span>
      <input autoFocus={autoFocus} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus-visible:border-[var(--focus)] focus-visible:ring-2 focus-visible:ring-[var(--focus)]" />
    </label>
  );
}
