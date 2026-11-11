"use client";


import styles from "./CallLeadsPanel.module.css";
import { Skeleton } from "@/components/ui/Skeleton";
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
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  callMarker as marker,
  describeCallLines,
  formatCallRange,
  groupCallSources,
  pageOfCall,
  type CallRecord,
} from "@/lib/leads/call-records";
import { callMetrics, callNeedsDetails, filterCallLeads, type CallLeadFilters } from "@/lib/leads/call-filter";
import type { CallLeadsData } from "@/lib/leads/use-call-leads";

type CallLeadForm = {
  name: string;
  phone: string;
  email: string;
  treatment: string;
  notes: string;
};

const EMPTY_FORM: CallLeadForm = {
  name: "",
  phone: "",
  email: "",
  treatment: "",
  notes: "",
};

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
  data,
  filters,
  onLeadCreated,
  focusCallId,
}: {
  /** Shared call data from useCallLeads, so the page KPIs and this table agree. */
  data: CallLeadsData;
  filters: CallLeadFilters;
  onLeadCreated: () => void;
  /** Opens this call, e.g. from a call alert email's "Add caller details" link. */
  focusCallId?: string | null;
}) {
  const { can } = useAuth();
  const canAddLead = can("update:leads");
  const { calls: allRecords, loadError, checking, addedIds, notALeadIds, markAdded, reload: loadCalls } = data;
  const { fromDate, toDate } = filters;
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<CallRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState<CallLeadForm>(EMPTY_FORM);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const focusHandled = useRef(false);

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

  const allCalls = useMemo(() => filterCallLeads(allRecords ?? [], filters, addedIds), [allRecords, filters, addedIds]);
  const source = useMemo(() => {
    const picked = filters.source && filters.source !== "all"
      ? groupCallSources(allRecords ?? []).find((item) => item.id === filters.source)
      : null;
    return {
      label: picked?.label ?? "All",
      line: picked?.line ?? describeCallLines(groupCallSources(allRecords ?? [])),
      range: fromDate ? `${fromDate} to ${toDate ?? "today"}` : formatCallRange(allRecords ?? []),
    };
  }, [allRecords, filters.source, fromDate, toDate]);
  const loadingCalls = allRecords === null && !loadError;
  const calls = useMemo(() => [...allCalls].sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt)), [allCalls]);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(calls.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const visibleCalls = calls.slice(pageStart, pageStart + pageSize);
  const summary = useMemo(() => callMetrics(calls, addedIds), [calls, addedIds]);
  // Any filter change starts again from the first page.
  const filterKey = [filters.source, filters.status, filters.needsDetails, fromDate, toDate].join("|");
  const lastFilterKey = useRef(filterKey);
  useEffect(() => {
    if (lastFilterKey.current === filterKey) return;
    lastFilterKey.current = filterKey;
    setPage(1);
  }, [filterKey]);

  function openForm(call: CallRecord) {
    setForm(EMPTY_FORM);
    setError("");
    setSelected(call);
  }

  // Deep link: show the call's page, highlight it, and open the form if details are still missing.
  useEffect(() => {
    if (!focusCallId || focusHandled.current || !allRecords || checking) return;
    focusHandled.current = true;
    const call = allCalls.find((item) => item.id === focusCallId);
    if (!call) {
      setNotice("That call isn't in the selected filters. Choose All dates and clear the call filters to find it.");
      return;
    }
    setPage(pageOfCall(allCalls, call.id, pageSize) ?? 1);
    setHighlightedId(call.id);
    if (canAddLead && !addedIds.has(call.id)) openForm(call);
  }, [focusCallId, allRecords, allCalls, checking, canAddLead, addedIds]);

  useEffect(() => {
    if (highlightedId) document.getElementById("call-row-" + highlightedId)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [highlightedId, currentPage]);

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
      "Inbound " + selected.line + " call: " + selected.date + ", " + selected.occurredAt.slice(0, 4) + " at " + selected.time + " ET",
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
      markAdded(selected.id);
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
    <section id="call-leads" className={styles.panel + " mt-4 scroll-mt-24 min-w-0 max-w-full overflow-hidden rounded-[20px] border border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-[var(--shadow-soft)]"}>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-subtle)] px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]" aria-hidden="true">
            <PhoneCall size={19} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="overview-display text-lg font-semibold text-[var(--text-primary)]">Call Leads</h2>
            </div>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">Inbound call opportunities · {allRecords ? `${source.line} · ${source.range}` : loadError ? "unavailable" : "loading call history…"}</p>
          </div>
        </div>
        <div className={"flex flex-wrap gap-2 text-xs " + (allRecords ? "" : "invisible")} aria-hidden={!allRecords}>
          <SummaryChip value={calls.length} label="calls" />
          <SummaryChip value={summary.conversations} label="conversations" />
          <SummaryChip value={summary.averageDuration + "s"} label="avg. duration" />
          <SummaryChip value={summary.outOfState} label="out of state" title="Known area code outside Florida. Calls with no area code are never counted." />
        </div>
      </div>

      {notice && (
        <div className="mx-4 mt-4 flex items-center gap-2 rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] px-3 py-2.5 text-xs font-semibold text-[var(--success-text)] sm:mx-5">
          <BadgeCheck size={16} /> {notice}
        </div>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table} role="table" aria-label={source.label + " calls, newest first"}>
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-2)] text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              <th className="px-5 py-3">Date & time</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Caller region</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Call assessment</th>
              <th className="px-5 py-3 text-right">Lead record</th>
            </tr>
          </thead>
          <tbody role="rowgroup" className="divide-y divide-[var(--border-subtle)]">
            {loadingCalls && Array.from({ length: 4 }, (_, index) => (
              <tr key={"loading-" + index} aria-hidden="true"><td colSpan={6} className="px-5 py-3"><Skeleton className="h-9 w-full rounded-lg" /></td></tr>
            ))}
            {loadError && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-[var(--text-muted)]">
                {loadError}{" "}
                <button type="button" onClick={() => void loadCalls()} className="font-bold text-[var(--brand-primary)] underline-offset-2 hover:underline">Try again</button>
              </td></tr>
            )}
            {!loadingCalls && !loadError && !calls.length && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-[var(--text-muted)]">No calls in the selected date range.</td></tr>
            )}
            {visibleCalls.map((call) => {
              const added = addedIds.has(call.id);
              const needsDetails = callNeedsDetails(call, addedIds);
              return (
                <tr key={call.id} id={"call-row-" + call.id} role="row" className={"transition-colors hover:bg-[var(--surface-hover)] " + (call.id === highlightedId ? "bg-[var(--brand-primary-soft)]" : "")}>
                  <td role="cell" data-label="Date & time" className="px-5 py-3">
                    <p className="text-sm font-bold text-[var(--text-primary)]">{call.date}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{call.time} ET</p>
                  </td>
                  <td role="cell" data-label="Source" className="px-4 py-3 text-xs font-semibold text-[var(--text-secondary)]">{call.source}</td>
                  <td role="cell" data-label="Caller region" className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]"><MapPin size={13} />{call.areaCode}</span>
                  </td>
                  <td role="cell" data-label="Duration" className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs tabular-nums text-[var(--text-secondary)]"><Clock3 size={13} />{formatDuration(call)}</span>
                  </td>
                  <td role="cell" data-label="Call assessment" className="px-4 py-3">
                    <span className="inline-flex flex-wrap gap-1.5">
                      <span className={"inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold " + assessmentStyle(call.kind)}>{call.assessment}</span>
                      {call.region === "unknown" && (
                        <span title="Google Ads sent no caller area code, so the region is not known." className="inline-flex rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-bold text-[var(--text-muted)]">Region unknown</span>
                      )}
                    </span>
                  </td>
                  <td role="cell" data-label="Lead record" className="px-5 py-3 text-right">
                    {checking ? (
                      <span className="inline-flex min-h-9 items-center justify-end"><Skeleton className="h-9 w-28 rounded-lg" /><span className="sr-only">Checking lead status</span></span>
                    ) : notALeadIds.has(call.id) ? (
                      <span title="A lead was saved for this call and later marked Not a lead." className="inline-flex min-h-9 items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 text-xs font-bold text-[var(--text-muted)]">Not a lead</span>
                    ) : added ? (
                      <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[var(--success-border)] bg-[var(--success-bg)] px-3 text-xs font-bold text-[var(--success-text)]"><BadgeCheck size={14} /> Added</span>
                    ) : (
                      <span className="inline-flex flex-wrap items-center justify-end gap-2">
                        {needsDetails && <NeedsDetailsChip />}
                        {canAddLead ? (
                          <button type="button" onClick={() => openForm(call)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[var(--brand-primary)] px-3 text-xs font-extrabold text-[var(--primary-foreground)] transition hover:brightness-95"><UserRoundPlus size={14} /> Add details</button>
                        ) : !needsDetails && <span className="text-xs text-[var(--text-muted)]">Details pending</span>}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <nav aria-label="Call list pagination" className={styles.pagination}>
        <p role="status" aria-live="polite" className="text-xs text-[var(--text-muted)]">
          {calls.length ? pageStart + 1 : 0}&ndash;{Math.min(pageStart + pageSize, calls.length)} of {calls.length} calls &middot; Newest first
        </p>
        <div className={styles.pageControls}>
          <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label="Previous page of calls">Previous</button>
          <span className="text-xs tabular-nums text-[var(--text-secondary)]">Page {currentPage} of {totalPages}</span>
          <button type="button" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)} aria-label="Next page of calls">Next</button>
        </div>
      </nav>

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

function NeedsDetailsChip() {
  return <span className="inline-flex min-h-7 items-center rounded-full border border-[var(--warning-border)] bg-[var(--warning-bg)] px-2.5 text-[11px] font-bold text-[var(--warning-text)]">Needs details</span>;
}

function SummaryChip({ value, label, title }: { value: string | number; label: string; title?: string }) {
  return <span title={title} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2.5 py-1.5 text-[var(--text-muted)]"><strong className="mr-1 text-[var(--text-primary)] tabular-nums">{value}</strong>{label}</span>;
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
