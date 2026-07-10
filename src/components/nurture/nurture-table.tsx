"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, ChevronDown, Clock3, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { DASHBOARD_REFRESH_EVENT } from "@/lib/dashboard-refresh";
import { NURTURE_STEPS, type NurtureEnrollment, type NurtureFunnelStep, type NurtureStats as Stats } from "@/lib/types/nurture";
import NurtureStats from "./nurture-stats";
import NurtureFunnel from "./nurture-funnel";
import NurtureDetail from "./nurture-detail";

const GOLD = "#C9A84C", PANEL = "#0D0D12", CARD = "#111117", TEXT = "#F0ECE4", MUTED = "#7A7A8A", DIM = "#5A5A6A", BORDER = "rgba(201,168,76,.12)", SOFT = "rgba(255,255,255,.06)";
const PAGE_LOADED_AT = Date.now();
type Sort = "next" | "last" | "name";

const statusTone: Record<string, { color: string; bg: string; border: string }> = {
  Active: { color: "#2DD4BF", bg: "rgba(45,212,191,.10)", border: "rgba(45,212,191,.28)" },
  Completed: { color: "#60A5FA", bg: "rgba(96,165,250,.10)", border: "rgba(96,165,250,.28)" },
  Stopped: { color: "#F87171", bg: "rgba(248,113,113,.10)", border: "rgba(248,113,113,.28)" },
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function initials(name: string) { return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?"; }

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return <label className="relative min-w-[150px] flex-1 sm:flex-none"><span className="sr-only">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} aria-label={label} className="h-11 w-full appearance-none rounded-xl border px-3 pr-8 text-xs font-semibold" style={{ backgroundColor: CARD, borderColor: BORDER, color: TEXT }}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: MUTED }} /></label>;
}

function StatusPill({ status }: { status: string }) {
  const tone = statusTone[status] ?? statusTone.Active;
  return <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold" style={{ color: tone.color, backgroundColor: tone.bg, borderColor: tone.border }}><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tone.color }} />{status}</span>;
}

function LoadingSkeleton() {
  return <div className="overflow-hidden rounded-2xl border" style={{ backgroundColor: CARD, borderColor: BORDER }}><div className="space-y-px">{Array.from({ length: 7 }).map((_, row) => <div key={row} className="grid grid-cols-5 gap-4 border-b px-4 py-4" style={{ borderColor: SOFT }}>{Array.from({ length: 5 }).map((__, col) => <div key={col} className="h-4 animate-pulse rounded bg-white/[.055]" style={{ width: col === 0 ? "80%" : "65%" }} />)}</div>)}</div></div>;
}

function NurtureRefreshBar({ latest, loading, onRefresh }: { latest: NurtureEnrollment | null; loading: boolean; onRefresh: () => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border px-4 py-3" style={{ background: `linear-gradient(135deg, rgba(201,168,76,.12), rgba(45,212,191,.045) 45%, rgba(255,255,255,.018)), ${PANEL}`, borderColor: "rgba(201,168,76,.22)", boxShadow: "0 18px 60px rgba(0,0,0,.22)" }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative flex h-3 w-3 flex-shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-40" style={{ backgroundColor: "#2DD4BF" }} />
            <span className="relative inline-flex h-3 w-3 rounded-full" style={{ backgroundColor: "#2DD4BF" }} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[.1em]" style={{ color: GOLD }}>Last nurture update</p>
            <p className="truncate text-sm font-bold" style={{ color: TEXT }}>
              {latest ? `${latest.leadName} - ${latest.currentStep || latest.status}` : "Waiting for the first nurture sequence"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold" style={{ color: MUTED, backgroundColor: "rgba(0,0,0,.18)" }}>
            <Clock3 size={13} />
            {latest?.nextSendAt ? `Next ${formatDate(latest.nextSendAt)}` : "No activity"}
          </div>
          <button type="button" onClick={onRefresh} disabled={loading} className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold outline-none transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-[#C9A84C]/35" style={{ backgroundColor: "rgba(201,168,76,.06)", borderColor: BORDER, color: GOLD }}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NurtureTable() {
  const [enrollments, setEnrollments] = useState<NurtureEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");
  const [step, setStep] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("next");
  const [selected, setSelected] = useState<NurtureEnrollment | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/airtable/nurture", { cache: "no-store" });
      const data = await response.json() as { enrollments?: NurtureEnrollment[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not load nurture enrollments");
      setEnrollments(data.enrollments ?? []);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load nurture enrollments"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

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
    <section className="rounded-2xl border p-3" style={{ background: `linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.01)),${PANEL}`, borderColor: BORDER }}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: MUTED }} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, phone, or email" className="h-11 w-full rounded-xl border pl-10 pr-3 text-sm" style={{ backgroundColor: CARD, borderColor: BORDER, color: TEXT }} /></div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:flex">
          <Select label="Filter by nurture status" value={status} onChange={setStatus} options={[{ value: "all", label: "All statuses" }, ...["Active", "Completed", "Stopped"].map((value) => ({ value, label: value }))]} />
          <Select label="Filter by current step" value={step} onChange={setStep} options={[{ value: "all", label: "All steps" }, ...NURTURE_STEPS.map((value) => ({ value, label: value }))]} />
          <Select label="Sort enrollments" value={sort} onChange={(value) => setSort(value as Sort)} options={[{ value: "next", label: "Next send ↑" }, { value: "last", label: "Last sent ↓" }, { value: "name", label: "Lead name A–Z" }]} />
        </div>
      </div>
    </section>
    {loading ? <LoadingSkeleton /> : error ? <div className="flex items-start justify-between gap-3 rounded-2xl border p-5" style={{ color: "#F87171", backgroundColor: "rgba(248,113,113,.08)", borderColor: "rgba(248,113,113,.25)" }}><div className="flex gap-3"><AlertCircle size={18} /><div><p className="text-sm font-bold">Could not load nurture sequences</p><p className="mt-1 text-xs text-[#7A7A8A]">{error}</p></div></div><button onClick={() => void load()} className="rounded-xl border p-2" style={{ borderColor: "rgba(248,113,113,.25)" }}><RefreshCw size={15} /></button></div> : visible.length === 0 ? <div className="flex flex-col items-center rounded-2xl border px-6 py-20 text-center" style={{ backgroundColor: CARD, borderColor: BORDER }}><span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ color: GOLD, backgroundColor: "rgba(201,168,76,.1)" }}><SlidersHorizontal size={22} /></span><p className="font-bold text-[#F0ECE4]">No nurture sequences found</p><p className="mt-1 text-sm text-[#7A7A8A]">Adjust the filters or search term to see live Airtable enrollments.</p></div> : <>
      <div className="hidden overflow-hidden rounded-2xl border md:block" style={{ backgroundColor: CARD, borderColor: BORDER }}><div className="max-h-[68vh] overflow-auto"><table className="w-full min-w-[1280px] border-separate border-spacing-0"><thead className="sticky top-0 z-10 bg-[#0B0B10]"><tr>{["Lead Name", "Phone", "Treatment Interest", "Nurture Status", "Current Step", "Next Send At", "Last Sent At", "Stop Reason", "Lead Status"].map((heading) => <th key={heading} className="border-b px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[.09em]" style={{ color: DIM, borderColor: SOFT }}>{heading}</th>)}</tr></thead><tbody>{visible.map((item) => { const overdue = item.status === "Active" && item.nextSendAt && new Date(item.nextSendAt).getTime() < PAGE_LOADED_AT; return <tr key={item.id} tabIndex={0} onClick={() => setSelected(item)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelected(item); }} className="cursor-pointer bg-[#0A0A0D] transition hover:bg-[#18181F]"> 
        <td className="border-b px-4 py-3" style={{ borderColor: SOFT }}><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-extrabold" style={{ color: GOLD, backgroundColor: "rgba(201,168,76,.09)", borderColor: "rgba(201,168,76,.18)" }}>{initials(item.leadName)}</span><div><p className="text-sm font-bold text-[#F0ECE4]">{item.leadName}</p><p className="text-[11px] text-[#5A5A6A]">{item.leadEmail || "No email"}</p></div></div></td>
        <td className="border-b px-4 py-3 text-sm" style={{ color: MUTED, borderColor: SOFT }}>{item.leadPhone || "—"}</td><td className="border-b px-4 py-3 text-xs font-semibold" style={{ color: TEXT, borderColor: SOFT }}>{item.leadTreatmentInterest || "—"}</td><td className="border-b px-4 py-3" style={{ borderColor: SOFT }}><StatusPill status={item.status} /></td><td className="border-b px-4 py-3" style={{ borderColor: SOFT }}><span className="rounded-full bg-white/[.045] px-2.5 py-1 text-[11px] font-semibold text-[#A3A3AF]">{item.currentStep || "Not started"}</span></td><td className="border-b px-4 py-3 text-xs" style={{ color: overdue ? "#F87171" : MUTED, borderColor: SOFT }}>{overdue && <span className="mb-1 flex items-center gap-1 font-bold"><Clock3 size={11} />Overdue</span>}{formatDate(item.nextSendAt)}</td><td className="border-b px-4 py-3 text-xs" style={{ color: MUTED, borderColor: SOFT }}>{formatDate(item.lastSentAt)}</td><td className="border-b px-4 py-3 text-xs" style={{ color: item.stopReason ? "#F59E0B" : DIM, borderColor: SOFT }}>{item.status === "Stopped" ? item.stopReason || "Not recorded" : "—"}</td><td className="border-b px-4 py-3 text-xs font-bold" style={{ color: item.leadStatus === "Booked" ? "#2DD4BF" : TEXT, borderColor: SOFT }}>{item.leadStatus}</td>
      </tr>; })}</tbody></table></div></div>
      <div className="grid gap-3 md:hidden">{visible.map((item) => <button key={item.id} onClick={() => setSelected(item)} className="rounded-2xl border p-4 text-left" style={{ backgroundColor: CARD, borderColor: BORDER }}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-[#F0ECE4]">{item.leadName}</p><p className="mt-1 text-xs text-[#7A7A8A]">{item.leadPhone || item.leadEmail || "No contact captured"}</p></div><StatusPill status={item.status} /></div><div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl bg-white/[.025] p-3"><p className="text-[10px] font-bold uppercase text-[#5A5A6A]">Current step</p><p className="mt-1 text-xs font-semibold text-[#F0ECE4]">{item.currentStep || "Not started"}</p></div><div className="rounded-xl bg-white/[.025] p-3"><p className="text-[10px] font-bold uppercase text-[#5A5A6A]">Next send</p><p className="mt-1 text-xs font-semibold text-[#F0ECE4]">{formatDate(item.nextSendAt)}</p></div></div></button>)}</div>
    </>}
    <NurtureDetail enrollment={selected} onClose={() => setSelected(null)} />
  </div>;
}
