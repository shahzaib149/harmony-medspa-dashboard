"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AlertCircle, ChevronDown, Clock3, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { DASHBOARD_REFRESH_EVENT } from "@/lib/dashboard-refresh";
import { DATA_CACHE_KEYS, setCachedData, useDashboardCachedData } from "@/lib/dashboard-data-cache";
import { NURTURE_STEPS, type NurtureEnrollment, type NurtureFunnelStep, type NurtureStats as Stats } from "@/lib/types/nurture";
import { formatCampaignDate } from "@/lib/campaigns/campaign-date";
import NurtureStats from "./nurture-stats";
import NurtureDetail from "./nurture-detail";

const NurtureFunnel = dynamic(() => import("./nurture-funnel"), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)]" />,
});

const GOLD = "var(--brand-primary)", CARD = "var(--surface-1)", TEXT = "var(--text-primary)", MUTED = "var(--text-muted)", DIM = "var(--text-muted)";
const PAGE_LOADED_AT = Date.now();
type Sort = "next" | "last" | "name";

const statusTone: Record<string, { color: string; bg: string; border: string }> = {
  Active: { color: "var(--healthy)", bg: "var(--healthy-soft)", border: "color-mix(in srgb, var(--healthy) 28%, transparent)" },
  Completed: { color: "#3B82F6", bg: "rgba(59,130,246,.10)", border: "rgba(59,130,246,.28)" },
  Stopped: { color: "var(--danger)", bg: "var(--danger-soft)", border: "color-mix(in srgb, var(--danger) 28%, transparent)" },
};

function initials(name: string) { return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?"; }

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return <label className="relative min-w-[150px] flex-1 sm:flex-none"><span className="sr-only">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} aria-label={label} className="h-11 w-full appearance-none rounded-xl border border-[var(--border-subtle)] px-3 pr-8 text-xs font-semibold" style={{ backgroundColor: CARD, color: TEXT }}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: MUTED }} /></label>;
}

function StatusPill({ status }: { status: string }) {
  const tone = statusTone[status] ?? statusTone.Active;
  return <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold" style={{ color: tone.color, backgroundColor: tone.bg, borderColor: tone.border }}><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tone.color }} />{status}</span>;
}

function LoadingSkeleton() {
  return <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)]"><div className="space-y-px">{Array.from({ length: 7 }).map((_, row) => <div key={row} className="grid grid-cols-5 gap-4 border-b border-[var(--border-subtle)] px-4 py-4">{Array.from({ length: 5 }).map((__, col) => <div key={col} className="h-4 animate-pulse rounded bg-[var(--surface-2)]" style={{ width: col === 0 ? "80%" : "65%" }} />)}</div>)}</div></div>;
}

function NurtureRefreshBar({ latest, loading, onRefresh }: { latest: NurtureEnrollment | null; loading: boolean; onRefresh: () => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3" style={{ background: `linear-gradient(135deg, rgba(201,168,76,.12), rgba(45,212,191,.045) 45%, rgba(255,255,255,.018)), var(--surface-1)`, boxShadow: "0 18px 60px rgba(0,0,0,.08)" }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative flex h-3 w-3 flex-shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-40" style={{ backgroundColor: "var(--healthy)" }} />
            <span className="relative inline-flex h-3 w-3 rounded-full" style={{ backgroundColor: "var(--healthy)" }} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[.1em]" style={{ color: GOLD }}>Last nurture update</p>
            <p className="truncate text-sm font-bold" style={{ color: TEXT }}>
              {latest ? `${latest.leadName} - ${latest.currentStep || latest.status}` : "Waiting for the first nurture sequence"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-[var(--border-subtle)] px-3 py-1 text-xs font-semibold" style={{ color: MUTED, backgroundColor: "var(--surface-2)" }}>
            <Clock3 size={13} />
            {latest?.nextSendAt ? `Next ${formatCampaignDate(latest.nextSendAt)}` : "No activity"}
          </div>
          <button type="button" onClick={onRefresh} disabled={loading} className="flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] px-3 py-2 text-xs font-bold outline-none transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/35" style={{ backgroundColor: "var(--brand-primary-soft)", color: GOLD }}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NurtureTable() {
  const cachedNurture = useDashboardCachedData<{ enrollments?: NurtureEnrollment[] }>(DATA_CACHE_KEYS.nurture);
  const hadCachedNurtureOnMount = useRef(Boolean(cachedNurture));
  const [enrollments, setEnrollments] = useState<NurtureEnrollment[]>(() => cachedNurture?.enrollments ?? []);
  const [loading, setLoading] = useState(() => !cachedNurture);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");
  const [step, setStep] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("next");
  const [selected, setSelected] = useState<NurtureEnrollment | null>(null);

  useEffect(() => {
    if (cachedNurture?.enrollments) { setEnrollments(cachedNurture.enrollments); setLoading(false); }
  }, [cachedNurture]);

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true); setError("");
    try {
      const response = await fetch("/api/airtable/nurture", { cache: "no-store" });
      const data = await response.json() as { enrollments?: NurtureEnrollment[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not load nurture enrollments");
      setEnrollments(data.enrollments ?? []);
      setCachedData(DATA_CACHE_KEYS.nurture, data);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load nurture enrollments"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(!hadCachedNurtureOnMount.current); }, [load]);

  useEffect(() => {
    const refresh = () => void load();
    window.addEventListener(DASHBOARD_REFRESH_EVENT, refresh);
    return () => window.removeEventListener(DASHBOARD_REFRESH_EVENT, refresh);
  }, [load]);

  const visible = useMemo(() => enrollments.filter((item) => {
    const haystack = `${item.leadName} ${item.leadPhone} ${item.leadEmail}`.toLowerCase();
    return (status === "all" || item.status === status) && (step === "all" || item.currentStep === step) && (!search.trim() || haystack.includes(search.trim().toLowerCase()));
  }).sort((a, b) => {
    if (sort === "name") return a.leadName.localeCompare(b.leadName);
    const left = new Date(sort === "next" ? a.nextSendAt ?? "9999-12-31" : a.lastSentAt ?? 0).getTime();
    const right = new Date(sort === "next" ? b.nextSendAt ?? "9999-12-31" : b.lastSentAt ?? 0).getTime();
    return sort === "last" ? right - left : left - right;
  }), [enrollments, search, sort, status, step]);

  const stats = useMemo<Stats>(() => {
    const active = enrollments.filter((item) => item.status === "Active").length;
    const completedItems = enrollments.filter((item) => item.status === "Completed");
    const booked = completedItems.filter((item) => item.leadStatus.toLowerCase() === "booked");
    const bookingDays = booked.flatMap((item) => item.bookedAt ? [(new Date(item.bookedAt).getTime() - new Date(item.enrolledAt).getTime()) / 86400000] : []).filter((days) => Number.isFinite(days) && days >= 0);
    return { active, completed: completedItems.length, stopped: enrollments.filter((item) => item.status === "Stopped").length, conversionRate: completedItems.length ? Math.round(booked.length / completedItems.length * 100) : 0, avgDaysToBook: bookingDays.length ? Number((bookingDays.reduce((sum, days) => sum + days, 0) / bookingDays.length).toFixed(1)) : null };
  }, [enrollments]);

  const funnel = useMemo<NurtureFunnelStep[]>(() => NURTURE_STEPS.map((name, index) => {
    const reached = enrollments.filter((item) => Math.max(0, NURTURE_STEPS.indexOf(item.currentStep as (typeof NURTURE_STEPS)[number])) >= index);
    return { step: name.replace("Day ", "D"), entered: reached.length, booked: reached.filter((item) => item.currentStep === name && item.stopReason === "Booked").length, stopped: reached.filter((item) => item.currentStep === name && item.status === "Stopped" && item.stopReason !== "Booked").length, stillActive: reached.filter((item) => item.status === "Active").length };
  }), [enrollments]);

  const latestEnrollment = enrollments[0] ?? null;

  return <div className="space-y-5">
    <NurtureRefreshBar latest={latestEnrollment} loading={loading} onRefresh={() => void load()} />
    <NurtureStats stats={stats} />
    <NurtureFunnel data={funnel} />
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: MUTED }} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, phone, or email" className="h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] pl-10 pr-3 text-sm" style={{ color: TEXT }} /></div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:flex">
          <Select label="Filter by nurture status" value={status} onChange={setStatus} options={[{ value: "all", label: "All statuses" }, ...["Active", "Completed", "Stopped"].map((value) => ({ value, label: value }))]} />
          <Select label="Filter by current step" value={step} onChange={setStep} options={[{ value: "all", label: "All steps" }, ...NURTURE_STEPS.map((value) => ({ value, label: value }))]} />
          <Select label="Sort enrollments" value={sort} onChange={(value) => setSort(value as Sort)} options={[{ value: "next", label: "Next send ↑" }, { value: "last", label: "Last sent ↓" }, { value: "name", label: "Lead name A–Z" }]} />
        </div>
      </div>
    </section>
    {loading ? <LoadingSkeleton /> : error ? <div className="flex items-start justify-between gap-3 rounded-2xl border border-[rgba(248,113,113,.25)] bg-[rgba(248,113,113,.08)] p-5" style={{ color: "var(--danger)" }}><div className="flex gap-3"><AlertCircle size={18} /><div><p className="text-sm font-bold">Could not load nurture sequences</p><p className="mt-1 text-xs text-[var(--text-muted)]">{error}</p></div></div><button onClick={() => void load()} className="rounded-xl border border-[rgba(248,113,113,.25)] p-2"><RefreshCw size={15} /></button></div> : visible.length === 0 ? <div className="flex flex-col items-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-6 py-20 text-center"><span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ color: GOLD, backgroundColor: "rgba(201,168,76,.1)" }}><SlidersHorizontal size={22} /></span><p className="font-bold text-[var(--text-primary)]">No nurture sequences found</p><p className="mt-1 text-sm text-[var(--text-muted)]">Adjust the filters or search term to see live Airtable enrollments.</p></div> : <>
      <div className="hidden overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] md:block"><div className="max-h-[68vh] overflow-auto"><table className="w-full min-w-[1280px] border-separate border-spacing-0"><thead className="sticky top-0 z-10 bg-[var(--surface-2)]"><tr>{["Lead Name", "Phone", "Treatment Interest", "Nurture Status", "Current Step", "Next Send At", "Last Sent At", "Stop Reason", "Lead Status"].map((heading) => <th key={heading} className="border-b border-[var(--border-subtle)] px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[.09em]" style={{ color: DIM }}>{heading}</th>)}</tr></thead><tbody>{visible.map((item) => { const overdue = item.status === "Active" && item.nextSendAt && new Date(item.nextSendAt).getTime() < PAGE_LOADED_AT; return <tr key={item.id} tabIndex={0} onClick={() => setSelected(item)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelected(item); }} className="cursor-pointer bg-[var(--surface-1)] transition hover:bg-[var(--surface-hover)]">
        <td className="border-b border-[var(--border-subtle)] px-4 py-3"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(201,168,76,.18)] text-xs font-extrabold" style={{ color: GOLD, backgroundColor: "rgba(201,168,76,.09)" }}>{initials(item.leadName)}</span><div><p className="text-sm font-bold text-[var(--text-primary)]">{item.leadName}</p><p className="text-[11px] text-[var(--text-muted)]">{item.leadEmail || "No email"}</p></div></div></td>
        <td className="border-b border-[var(--border-subtle)] px-4 py-3 text-sm" style={{ color: MUTED }}>{item.leadPhone || "—"}</td><td className="border-b border-[var(--border-subtle)] px-4 py-3 text-xs font-semibold" style={{ color: TEXT }}>{item.leadTreatmentInterest || "—"}</td><td className="border-b border-[var(--border-subtle)] px-4 py-3"><StatusPill status={item.status} /></td><td className="border-b border-[var(--border-subtle)] px-4 py-3"><span className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)]">{item.currentStep || "Not started"}</span></td><td className="border-b border-[var(--border-subtle)] px-4 py-3 text-xs" style={{ color: overdue ? "var(--danger)" : MUTED }}>{overdue && <span className="mb-1 flex items-center gap-1 font-bold"><Clock3 size={11} />Overdue</span>}{formatCampaignDate(item.nextSendAt)}</td><td className="border-b border-[var(--border-subtle)] px-4 py-3 text-xs" style={{ color: MUTED }}>{formatCampaignDate(item.lastSentAt)}</td><td className="border-b border-[var(--border-subtle)] px-4 py-3 text-xs" style={{ color: item.stopReason ? "#F59E0B" : DIM }}>{item.status === "Stopped" ? item.stopReason || "Not recorded" : "—"}</td><td className="border-b border-[var(--border-subtle)] px-4 py-3 text-xs font-bold" style={{ color: item.leadStatus === "Booked" ? "var(--healthy)" : TEXT }}>{item.leadStatus}</td>
      </tr>; })}</tbody></table></div></div>
      <div className="grid gap-3 md:hidden">{visible.map((item) => <button key={item.id} onClick={() => setSelected(item)} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 text-left"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-[var(--text-primary)]">{item.leadName}</p><p className="mt-1 text-xs text-[var(--text-muted)]">{item.leadPhone || item.leadEmail || "No contact captured"}</p></div><StatusPill status={item.status} /></div><div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl bg-[var(--surface-2)] p-3"><p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Current step</p><p className="mt-1 text-xs font-semibold text-[var(--text-primary)]">{item.currentStep || "Not started"}</p></div><div className="rounded-xl bg-[var(--surface-2)] p-3"><p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Next send</p><p className="mt-1 text-xs font-semibold text-[var(--text-primary)]">{formatCampaignDate(item.nextSendAt)}</p></div></div></button>)}</div>
    </>}
    <NurtureDetail enrollment={selected} onClose={() => setSelected(null)} />
  </div>;
}
