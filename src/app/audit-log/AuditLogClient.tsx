"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Download,
  Filter,
  KeyRound,
  Loader2,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import type { AuditLogRecord } from "@/lib/audit/types";
import { AUDIT_CATEGORIES } from "@/lib/audit/types";
import {
  CLINIC_TIME_ZONE,
  formatClinicDate,
  formatClinicDateTime,
  formatClinicTime,
} from "@/lib/date-time";

type Filters = { search: string; dateFrom: string; dateTo: string; user: string; role: string; category: string; action: string; result: string; resourceType: string };
type ResponseData = {
  items: AuditLogRecord[];
  page: number;
  pageSize: number;
  total: number;
  visibleFrom: number;
  visibleTo: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  summary: { today: number; access: number; leadChanges: number; failed: number };
  users: Array<{ id: string; name: string; role: string }>;
};

const emptyFilters: Filters = { search: "", dateFrom: "", dateTo: "", user: "", role: "", category: "", action: "", result: "", resourceType: "" };
const actions = ["user_logged_in", "user_logged_out", "user_invited", "user_removed", "user_role_changed", "user_access_changed", "lead_created", "lead_updated", "lead_status_changed", "lead_replied_changed", "lead_deleted", "leads_imported", "leads_exported", "campaign_enrollment_started", "campaign_enrollment_stopped", "campaign_step_changed", "clinic_metrics_updated", "audit_logs_exported", "action_failed"];
const actionLabels: Record<string, string> = {
  user_logged_in: "Signed in", user_logged_out: "Signed out", user_invited: "Invited user", user_removed: "Removed user", user_role_changed: "Changed user role", user_access_changed: "Changed user access", user_updated: "Updated user",
  lead_created: "Created Lead", lead_updated: "Updated Lead", lead_status_changed: "Changed Lead status", lead_replied_changed: "Changed replied state", lead_deleted: "Deleted Lead", leads_imported: "Imported Leads", leads_exported: "Exported Leads",
  campaign_enrollment_started: "Started enrollment", campaign_enrollment_stopped: "Stopped nurture", campaign_step_changed: "Changed campaign step", clinic_metrics_updated: "Updated clinic metrics", audit_logs_exported: "Exported Audit Log", action_failed: "Action failed",
};
const label = (value: string) => actionLabels[value] || value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
const fieldLabel = (value: string) => value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
const initialResponse: ResponseData = { items: [], page: 1, pageSize: 25, total: 0, visibleFrom: 0, visibleTo: 0, hasPreviousPage: false, hasNextPage: false, summary: { today: 0, access: 0, leadChanges: 0, failed: 0 }, users: [] };

function trapTab(event: ReactKeyboardEvent<HTMLElement>) {
  if (event.key !== "Tab") return;
  const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), details summary, [href], [tabindex]:not([tabindex="-1"])'));
  if (!focusable.length) return;
  const first = focusable[0], last = focusable.at(-1)!;
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

function initials(name: string | null) { return (name || "System").split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
function dateParts(value: string) {
  return { date: formatClinicDate(value), time: formatClinicTime(value) };
}
function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "Not set";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function ResultBadge({ result }: { result: string }) {
  const success = result === "success";
  return <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider" style={{ color: success ? "var(--healthy)" : "var(--danger)", borderColor: success ? "color-mix(in srgb, var(--healthy) 35%, transparent)" : "color-mix(in srgb, var(--danger) 35%, transparent)", backgroundColor: success ? "color-mix(in srgb, var(--healthy) 10%, transparent)" : "color-mix(in srgb, var(--danger) 10%, transparent)" }}>{success ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}{success ? "Success" : "Failed"}</span>;
}

function FilterFields({ filters, users, onChange }: { filters: Filters; users: ResponseData["users"]; onChange: (key: keyof Filters, value: string) => void }) {
  const control = "h-10 w-full rounded-xl border px-3 text-sm outline-none focus-visible:ring-2";
  const style = { backgroundColor: "var(--surface-1)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" };
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <label className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>From<input type="date" value={filters.dateFrom} onChange={(event) => onChange("dateFrom", event.target.value)} className={`${control} mt-1.5`} style={style} /></label>
    <label className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>To<input type="date" value={filters.dateTo} onChange={(event) => onChange("dateTo", event.target.value)} className={`${control} mt-1.5`} style={style} /></label>
    <label className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>User<select value={filters.user} onChange={(event) => onChange("user", event.target.value)} className={`${control} mt-1.5`} style={style}><option value="">All users</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label>
    <label className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>Role<select value={filters.role} onChange={(event) => onChange("role", event.target.value)} className={`${control} mt-1.5`} style={style}><option value="">All roles</option><option value="admin">Admin</option><option value="editor">Editor</option><option value="viewer">Viewer</option></select></label>
    <label className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>Area<select value={filters.category} onChange={(event) => onChange("category", event.target.value)} className={`${control} mt-1.5`} style={style}><option value="">All areas</option>{AUDIT_CATEGORIES.map((item) => <option key={item} value={item}>{fieldLabel(item)}</option>)}</select></label>
    <label className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>Action<select value={filters.action} onChange={(event) => onChange("action", event.target.value)} className={`${control} mt-1.5`} style={style}><option value="">All actions</option>{actions.map((item) => <option key={item} value={item}>{label(item)}</option>)}</select></label>
    <label className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>Result<select value={filters.result} onChange={(event) => onChange("result", event.target.value)} className={`${control} mt-1.5`} style={style}><option value="">All results</option><option value="success">Success</option><option value="failed">Failed</option></select></label>
    <label className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>Resource type<input value={filters.resourceType} onChange={(event) => onChange("resourceType", event.target.value)} placeholder="Lead, user, campaign…" className={`${control} mt-1.5`} style={style} /></label>
  </div>;
}

function EventDetails({
  event,
  loading,
  error,
  onRetry,
  onClose,
}: {
  event: AuditLogRecord;
  loading: boolean;
  error: string;
  onRetry: () => void;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const escape = (keyboard: KeyboardEvent) => { if (keyboard.key === "Escape") onClose(); };
    document.addEventListener("keydown", escape);
    const previous = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", escape); document.body.style.overflow = previous; };
  }, [onClose]);
  const changes = Array.from(new Set([...Object.keys(event.before_data || {}), ...Object.keys(event.after_data || {})]));
  return <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="audit-event-title" onKeyDown={trapTab} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="flex h-dvh w-full flex-col border sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:rounded-2xl" style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-modal)" }}>
      <header className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderColor: "var(--border-subtle)" }}><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em]" style={{ color: "var(--brand-primary)" }}>Activity detail</p><h2 id="audit-event-title" className="mt-1 text-lg font-bold" style={{ color: "var(--text-primary)" }}>{label(event.action)}</h2><p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>{event.summary}</p></div><button ref={closeRef} onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-xl border focus-visible:ring-2" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }} aria-label="Close activity details"><X size={18} /></button></header>
      <div className="overflow-y-auto p-5">
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">{[["Event ID", event.id], ["Timestamp", formatClinicDateTime(event.created_at)], ["Actor", event.actor_name || event.actor_email_masked || "System"], ["Role", event.actor_role ? fieldLabel(event.actor_role) : "System"], ["Category", fieldLabel(event.category)], ["Resource", event.resource_label || event.resource_id || event.resource_type || "Not applicable"], ["Result", event.result], ["Request ID", event.request_id || "Not available"], ["Source", event.source || "Dashboard"]].map(([term, description]) => <div key={term}><dt className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{term}</dt><dd className="mt-1 break-words text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{description}</dd></div>)}</dl>
        {loading && <div className="mt-6 flex items-center gap-2 rounded-xl border p-4 text-sm font-bold" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}><Loader2 className="animate-spin" size={16} />Loading activity details…</div>}
        {error && <div role="alert" className="mt-6 flex items-center justify-between gap-3 rounded-xl border p-4 text-sm font-bold" style={{ borderColor: "color-mix(in srgb, var(--danger) 30%, transparent)", color: "var(--danger)" }}><span>{error}</span><button onClick={onRetry} className="rounded-lg border border-current px-3 py-2 text-xs">Retry</button></div>}
        {!loading && !error && <>
          {changes.length > 0 && <section className="mt-6"><h3 className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>Changes</h3><div className="mt-3 space-y-3">{changes.map((key) => <div key={key} className="rounded-xl border p-3" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--background-subtle)" }}><p className="text-xs font-extrabold" style={{ color: "var(--brand-primary)" }}>{fieldLabel(key)}</p><div className="mt-2 grid items-center gap-2 sm:grid-cols-[1fr_auto_1fr]"><div><p className="text-[10px] font-bold uppercase" style={{ color: "var(--text-muted)" }}>Before</p><pre className="mt-1 whitespace-pre-wrap break-words font-sans text-sm" style={{ color: "var(--text-primary)" }}>{displayValue(event.before_data?.[key])}</pre></div><ArrowRight className="hidden sm:block" size={15} style={{ color: "var(--brand-primary)" }} /><div><p className="text-[10px] font-bold uppercase" style={{ color: "var(--text-muted)" }}>After</p><pre className="mt-1 whitespace-pre-wrap break-words font-sans text-sm" style={{ color: "var(--text-primary)" }}>{displayValue(event.after_data?.[key])}</pre></div></div></div>)}</div></section>}
          {event.metadata && Object.keys(event.metadata).length > 0 && <section className="mt-6"><h3 className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>Safe metadata</h3><dl className="mt-3 grid gap-3 sm:grid-cols-2">{Object.entries(event.metadata).map(([key, value]) => <div key={key} className="rounded-xl p-3" style={{ backgroundColor: "var(--background-subtle)" }}><dt className="text-[10px] font-bold uppercase" style={{ color: "var(--text-muted)" }}>{fieldLabel(key)}</dt><dd className="mt-1 break-words text-sm" style={{ color: "var(--text-primary)" }}>{displayValue(value)}</dd></div>)}</dl></section>}
          <details className="mt-6 rounded-xl border p-3" style={{ borderColor: "var(--border-subtle)" }}><summary className="cursor-pointer text-xs font-bold" style={{ color: "var(--text-muted)" }}>Technical JSON</summary><pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-all text-xs" style={{ color: "var(--text-muted)" }}>{JSON.stringify(event, null, 2)}</pre></details>
        </>}
      </div>
    </section>
  </div>;
}

export default function AuditLogClient() {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [data, setData] = useState<ResponseData>(initialResponse);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<AuditLogRecord | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const detailsController = useRef<AbortController | null>(null);
  const hasLoaded = useRef(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const activeCount = useMemo(() => Object.entries(filters).filter(([key, value]) => key !== "search" && Boolean(value)).length, [filters]);
  const queryFilters = useMemo(() => ({ ...filters, search: debouncedSearch }), [debouncedSearch, filters.action, filters.category, filters.dateFrom, filters.dateTo, filters.resourceType, filters.result, filters.role, filters.user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { const timeout = window.setTimeout(() => setDebouncedSearch(filters.search.trim()), 300); return () => window.clearTimeout(timeout); }, [filters.search]);
  useEffect(() => { if (!filtersOpen) return; const close = (event: KeyboardEvent) => { if (event.key === "Escape") setFiltersOpen(false); }; document.addEventListener("keydown", close); return () => document.removeEventListener("keydown", close); }, [filtersOpen]);
  const load = useCallback(async () => {
    controller.current?.abort(); const abort = new AbortController(); controller.current = abort;
    if (hasLoaded.current) setRefreshing(true); else setLoading(true); setError("");
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    Object.entries(queryFilters).forEach(([key, value]) => { if (value) params.set(key, value); });
    try { const response = await fetch(`/api/audit-logs?${params}`, { cache: "no-store", signal: abort.signal }); const body = await response.json(); if (!response.ok) throw new Error(body.error || "Audit activity could not be loaded"); setData(body); hasLoaded.current = true; }
    catch (caught) { if (!(caught instanceof DOMException && caught.name === "AbortError")) setError(caught instanceof Error ? caught.message : "Audit activity could not be loaded"); }
    finally { setLoading(false); setRefreshing(false); }
  }, [page, pageSize, queryFilters]);
  useEffect(() => { void load(); return () => controller.current?.abort(); }, [load]);
  const change = (key: keyof Filters, value: string) => { setFilters((current) => ({ ...current, [key]: value })); if (key !== "search") setPage(1); };
  const openDetails = useCallback(async (event: AuditLogRecord, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setSelected(event);
    setDetailsLoading(true);
    setDetailsError("");
    detailsController.current?.abort();
    const abort = new AbortController();
    detailsController.current = abort;
    try {
      const response = await fetch(`/api/audit-logs/${event.id}`, {
        cache: "no-store",
        signal: AbortSignal.any([abort.signal, AbortSignal.timeout(10_000)]),
      });
      const body = await response.json() as { item?: AuditLogRecord; error?: string };
      if (!response.ok || !body.item) throw new Error(body.error || "Audit activity details could not be loaded");
      if (!abort.signal.aborted) setSelected(body.item);
    } catch (caught) {
      if (!(caught instanceof DOMException && caught.name === "AbortError")) {
        setDetailsError(caught instanceof Error ? caught.message : "Audit activity details could not be loaded");
      }
    } finally {
      if (detailsController.current === abort) setDetailsLoading(false);
    }
  }, []);
  const closeDetails = useCallback(() => {
    detailsController.current?.abort();
    setSelected(null);
    setDetailsError("");
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }, []);
  const exportCsv = () => { const params = new URLSearchParams({ format: "csv" }); Object.entries(queryFilters).forEach(([key, value]) => { if (value) params.set(key, value); }); window.location.assign(`/api/audit-logs?${params}`); };
  const summary = [{ label: "Activities today", value: data.summary.today, icon: Activity }, { label: "User access events", value: data.summary.access, icon: KeyRound }, { label: "Lead changes", value: data.summary.leadChanges, icon: Users }, { label: "Failed actions", value: data.summary.failed, icon: AlertCircle }];

  return <div className="space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap items-center gap-2"><div className="inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.16em]" style={{ color: "var(--brand-primary)", borderColor: "color-mix(in srgb, var(--brand-primary) 30%, transparent)", backgroundColor: "var(--brand-primary-soft)" }}><ShieldCheck size={13} />Admin only</div><div className="inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-[10px] font-bold" style={{ color: "var(--text-muted)", borderColor: "var(--border-subtle)", backgroundColor: "var(--surface-1)" }}>Timezone: {CLINIC_TIME_ZONE}</div></div><button type="button" onClick={exportCsv} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-bold focus-visible:ring-2" style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)", backgroundColor: "var(--surface-1)" }}><Download size={15} />Export CSV</button></div>
    {loading ? <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[1,2,3,4].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl" style={{ backgroundColor: "var(--surface-1)" }} />)}</div> : <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{summary.map(({ label: summaryLabel, value, icon: Icon }) => <article key={summaryLabel} className="rounded-2xl border p-4" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--surface-1)" }}><div className="flex items-center justify-between gap-2"><p className="text-[11px] font-bold" style={{ color: "var(--text-muted)" }}>{summaryLabel}</p><Icon size={15} style={{ color: summaryLabel === "Failed actions" ? "var(--danger)" : "var(--brand-primary)" }} /></div><p className="mt-2 text-2xl font-extrabold tabular-nums" style={{ color: "var(--text-primary)" }}>{value.toLocaleString()}</p></article>)}</div>}
    <section className="rounded-2xl border p-3" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--background-subtle)" }}><div className="flex gap-2"><label className="relative min-w-0 flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} /><span className="sr-only">Search audit activity</span><input value={filters.search} onChange={(e) => change("search", e.target.value)} placeholder="Search people, actions, targets, or summaries" className="h-11 w-full rounded-xl border pl-10 pr-3 text-sm outline-none focus-visible:ring-2" style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }} /></label><button type="button" onClick={() => setFiltersOpen(true)} className="relative inline-flex h-11 items-center gap-2 rounded-xl border px-3 text-xs font-bold xl:hidden" style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)", backgroundColor: "var(--surface-1)" }}><Filter size={15} />Filters{activeCount > 0 && <span className="grid size-5 place-items-center rounded-full text-[10px]" style={{ backgroundColor: "var(--brand-primary)", color: "var(--background)" }}>{activeCount}</span>}</button></div><div className="mt-3 hidden xl:block"><FilterFields filters={filters} users={data.users} onChange={change} /></div>{activeCount > 0 && <div className="mt-3 flex flex-wrap gap-2"><button onClick={() => setFilters((current) => ({ ...emptyFilters, search: current.search }))} className="rounded-full border px-3 py-1 text-[11px] font-bold" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>Clear {activeCount} filters</button>{Object.entries(filters).filter(([key, value]) => key !== "search" && value).map(([key]) => <button key={key} onClick={() => change(key as keyof Filters, "")} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ color: "var(--brand-primary)", backgroundColor: "var(--brand-primary-soft)" }}>{fieldLabel(key)}<X size={11} /></button>)}</div>}</section>
    {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl border p-4" style={{ color: "var(--danger)", borderColor: "color-mix(in srgb, var(--danger) 30%, transparent)", backgroundColor: "color-mix(in srgb, var(--danger) 8%, transparent)" }}><span className="flex items-center gap-2 text-sm font-bold"><AlertCircle size={17} />{error}</span><button onClick={() => void load()} className="rounded-lg border px-3 py-2 text-xs font-bold" style={{ borderColor: "currentColor" }}>Retry</button></div>}
    <section className="relative">{refreshing && <div className="absolute right-3 top-3 z-20 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold" style={{ color: "var(--brand-primary)", backgroundColor: "var(--surface-1)", boxShadow: "var(--shadow-soft)" }}><Loader2 size={13} className="animate-spin" />Updating</div>}{!loading && !error && data.items.length === 0 ? <div className="rounded-2xl border px-6 py-20 text-center" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--surface-1)" }}><ShieldCheck className="mx-auto" style={{ color: "var(--brand-primary)" }} /><h2 className="mt-4 font-bold" style={{ color: "var(--text-primary)" }}>No activity matches these filters</h2><p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>Clear a filter or broaden the date range.</p></div> : <><div className="hidden overflow-hidden rounded-2xl border lg:block" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--surface-1)" }}><table className="w-full"><thead><tr style={{ backgroundColor: "var(--background-subtle)" }}>{["Time","User","Action","Area","Target","Result","Details"].map((heading) => <th key={heading} scope="col" className="border-b px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-wider" style={{ color: "var(--text-muted)", borderColor: "var(--border-subtle)" }}>{heading}</th>)}</tr></thead><tbody>{data.items.map((event) => { const time = dateParts(event.created_at); return <tr key={event.id} className="group"><td className="border-b px-4 py-3 text-xs tabular-nums" style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}>{time.date}<span className="mt-1 block" style={{ color: "var(--text-muted)" }}>{time.time}</span></td><td className="border-b px-4 py-3" style={{ borderColor: "var(--border-subtle)" }}><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-full text-[10px] font-extrabold" style={{ backgroundColor: "var(--brand-primary-soft)", color: "var(--brand-primary)" }}>{initials(event.actor_name)}</span><div><p className="max-w-40 truncate text-xs font-bold" style={{ color: "var(--text-primary)" }}>{event.actor_name || event.actor_email_masked || "System"}</p><p className="text-[10px] uppercase" style={{ color: "var(--text-muted)" }}>{event.actor_role || "System"}</p></div></div></td><td className="border-b px-4 py-3 text-xs font-bold" style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}>{label(event.action)}</td><td className="border-b px-4 py-3 text-xs" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>{fieldLabel(event.category)}</td><td className="max-w-52 border-b px-4 py-3 text-xs" style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}><span className="block truncate font-bold">{event.resource_label || "—"}</span><span className="mt-1 block truncate" style={{ color: "var(--text-muted)" }}>{event.summary}</span></td><td className="border-b px-4 py-3" style={{ borderColor: "var(--border-subtle)" }}><ResultBadge result={event.result} /></td><td className="border-b px-4 py-3" style={{ borderColor: "var(--border-subtle)" }}><button onClick={(e) => openDetails(event, e.currentTarget)} className="rounded-lg px-2 py-1.5 text-xs font-bold focus-visible:ring-2" style={{ color: "var(--brand-primary)" }}>View details</button></td></tr>; })}</tbody></table></div><div className="grid gap-3 lg:hidden">{data.items.map((event) => { const time = dateParts(event.created_at); return <button key={event.id} onClick={(e) => openDetails(event, e.currentTarget)} className="w-full rounded-2xl border p-4 text-left focus-visible:ring-2" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--surface-1)" }}><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-full text-[10px] font-extrabold" style={{ backgroundColor: "var(--brand-primary-soft)", color: "var(--brand-primary)" }}>{initials(event.actor_name)}</span><div className="min-w-0"><p className="truncate text-sm font-bold" style={{ color: "var(--text-primary)" }}>{event.actor_name || event.actor_email_masked || "System"}</p><p className="mt-1 text-xs font-bold" style={{ color: "var(--brand-primary)" }}>{label(event.action)}</p></div></div><ResultBadge result={event.result} /></div><p className="mt-3 truncate text-sm" style={{ color: "var(--text-primary)" }}>{event.resource_label || event.summary}</p><div className="mt-3 flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}><span>{time.date} · {time.time}</span><span className="inline-flex items-center gap-1 font-bold">Details<ChevronDown size={13} /></span></div></button>; })}</div></>}</section>
    {!loading && !error && <nav aria-label="Audit Log pagination" className="flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--surface-1)" }}><p className="text-sm font-semibold tabular-nums" style={{ color: "var(--text-muted)" }}>{data.visibleFrom ? `Showing ${data.visibleFrom}–${data.visibleTo} of ${data.total}` : "Showing 0 activities"}</p><div className="flex flex-wrap items-center justify-between gap-3"><label className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>Rows <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="ml-2 h-10 rounded-xl border px-3" style={{ backgroundColor: "var(--background-subtle)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}><option>25</option><option>50</option><option>100</option></select></label><button disabled={!data.hasPreviousPage || refreshing} onClick={() => setPage((current) => current - 1)} className="h-10 rounded-xl border px-3 text-xs font-bold disabled:opacity-40" style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}>Previous</button><span className="text-xs font-bold tabular-nums" style={{ color: "var(--text-muted)" }}>Page {page}</span><button disabled={!data.hasNextPage || refreshing} onClick={() => setPage((current) => current + 1)} className="h-10 rounded-xl border px-3 text-xs font-bold disabled:opacity-40" style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}>Next</button></div><p className="sr-only" aria-live="polite">Showing audit activities {data.visibleFrom} through {data.visibleTo}.</p></nav>}
    {filtersOpen && <div className="fixed inset-0 z-[70] flex items-end bg-black/70 xl:hidden" role="dialog" aria-modal="true" aria-labelledby="audit-filters-title" onKeyDown={trapTab}><section className="mobile-safe-bottom max-h-[90vh] w-full overflow-y-auto rounded-t-3xl border p-5" style={{ backgroundColor: "var(--background-subtle)", borderColor: "var(--border-subtle)" }}><header className="mb-5 flex items-center justify-between"><div><h2 id="audit-filters-title" className="font-bold" style={{ color: "var(--text-primary)" }}>Filter activity</h2><p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{activeCount} active filters</p></div><button autoFocus onClick={() => setFiltersOpen(false)} className="grid size-10 place-items-center rounded-xl border" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }} aria-label="Close filters"><X size={18} /></button></header><FilterFields filters={filters} users={data.users} onChange={change} /><div className="mt-5 flex gap-3"><button onClick={() => { setFilters((current) => ({ ...emptyFilters, search: current.search })); setPage(1); }} className="h-11 flex-1 rounded-xl border text-sm font-bold" style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}>Clear filters</button><button onClick={() => setFiltersOpen(false)} className="h-11 flex-1 rounded-xl text-sm font-extrabold" style={{ backgroundColor: "var(--brand-primary)", color: "var(--background)" }}>Show activity</button></div></section></div>}
    {selected && <EventDetails event={selected} loading={detailsLoading} error={detailsError} onRetry={() => { if (triggerRef.current) void openDetails(selected, triggerRef.current); }} onClose={closeDetails} />}
  </div>;
}
