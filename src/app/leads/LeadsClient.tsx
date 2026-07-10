"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  ChevronDown,
  Clock3,
  Copy,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import type { Lead } from "@/app/api/airtable/leads/route";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";

const GOLD = "#C9A84C";
const BG = "#0A0A0D";
const PANEL = "#0D0D12";
const CARD = "#111117";
const CARD_HOVER = "#18181F";
const TEXT = "#F0ECE4";
const MUTED = "#7A7A8A";
const DIM = "#5A5A6A";
const BORDER = "rgba(201,168,76,0.12)";
const BORDER_SOFT = "rgba(255,255,255,0.06)";
const TEAL = "#2DD4BF";

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  "New": { color: "#60A5FA", bg: "rgba(96,165,250,0.12)", border: "rgba(96,165,250,0.28)", label: "New" },
  "Contacted": { color: "#F59E0B", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.28)", label: "Contacted" },
  "Booked": { color: "#22C55E", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.28)", label: "Booked" },
  "Duplicate": { color: "#A1A1AA", bg: "rgba(161,161,170,0.12)", border: "rgba(161,161,170,0.24)", label: "Duplicate" },
  "Failed": { color: "#F87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.28)", label: "Failed" },
  "Not Interested": { color: "#F87171", bg: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.22)", label: "Not Interested" },
};

const STATUS_OPTIONS = ["New", "Contacted", "Booked", "Duplicate", "Failed", "Not Interested"];

type DateFilter = "all" | "today" | "7" | "30";
type SentFilter = "all" | "sent" | "not_sent";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function isSent(value: string) {
  const v = normalize(value);
  return v === "sent" || v === "delivered" || v === "opened" || v === "success";
}

function timeAgo(iso: string) {
  if (!iso) return "No timestamp";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60000);
  const hour = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  if (hour < 24) return `${hour}h ago`;
  if (day < 7) return `${day}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fullDate(iso: string) {
  if (!iso) return "No timestamp";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function withinDateRange(iso: string, range: DateFilter) {
  if (range === "all") return true;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  if (range === "today") return date.toDateString() === now.toDateString();
  return now.getTime() - date.getTime() <= Number(range) * 86400000;
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
}

function sourceLabel(source: string) {
  return source || "Unknown";
}

function trendLabel(count: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((count / total) * 100)}%`;
}

function lastContacted(lead: Lead) {
  if (isSent(lead.smsSentStatus) || isSent(lead.emailSentStatus)) return lead.createdAt;
  if (lead.status === "Contacted" || lead.status === "Booked") return lead.createdAt;
  return "";
}

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.New;
  return (
    <span
      role="status"
      aria-label={`Lead status: ${cfg.label}`}
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
      style={{ color: cfg.color, backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
      {cfg.label}
    </span>
  );
}

function DeliveryPill({ label, value }: { label: string; value: string }) {
  const sent = isSent(value);
  const color = sent ? "#22C55E" : value ? "#F59E0B" : DIM;
  return (
    <span
      aria-label={`${label}: ${value || "not sent"}`}
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ color, backgroundColor: sent ? "rgba(34,197,94,0.10)" : "rgba(255,255,255,0.035)" }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {value || "-"}
    </span>
  );
}

function SelectControl({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <label className="relative min-w-[138px] flex-1 sm:flex-none">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full appearance-none rounded-xl border px-3 pr-8 text-xs font-semibold"
        style={{ backgroundColor: CARD, borderColor: BORDER, color: TEXT }}
        aria-label={label}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
    </label>
  );
}

function StatCard({ label, value, meta, color = GOLD }: { label: string; value: number; meta: string; color?: string }) {
  return (
    <div
      className="min-w-0 rounded-2xl border px-4 py-3"
      style={{
        background: `linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012)), ${CARD}`,
        borderColor: BORDER,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: DIM }}>
          {label}
        </p>
        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color, backgroundColor: `${color}18` }}>
          {meta}
        </span>
      </div>
      <p className="mt-2 text-[30px] font-extrabold leading-none" style={{ color: TEXT }}>
        {value}
      </p>
    </div>
  );
}

function LeadTicker({ lead, loading, onRefresh }: { lead: Lead | null; loading: boolean; onRefresh: () => void }) {
  return (
    <div
      className="overflow-hidden rounded-2xl border px-4 py-3"
      style={{
        background: `linear-gradient(135deg, rgba(201,168,76,0.12), rgba(45,212,191,0.045) 45%, rgba(255,255,255,0.018)), ${PANEL}`,
        borderColor: "rgba(201,168,76,0.22)",
        boxShadow: "0 18px 60px rgba(0,0,0,0.22)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative flex h-3 w-3 flex-shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-40" style={{ backgroundColor: TEAL }} />
            <span className="relative inline-flex h-3 w-3 rounded-full" style={{ backgroundColor: TEAL }} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: GOLD }}>
              Last lead received
            </p>
            <p className="truncate text-sm font-bold" style={{ color: TEXT }}>
              {lead ? `${lead.name || "Unnamed lead"} - ${sourceLabel(lead.source)}` : "Waiting for the first lead"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold" style={{ color: MUTED, backgroundColor: "rgba(0,0,0,0.18)" }}>
            <Clock3 size={13} />
            {lead ? timeAgo(lead.createdAt) : "No activity"}
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold outline-none transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-[#C9A84C]/35"
            style={{ backgroundColor: "rgba(201,168,76,0.06)", borderColor: BORDER, color: GOLD }}
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

function LeadSlideOver({
  lead,
  duplicate,
  onClose,
  onStatusChange,
  canUpdate,
  canDelete,
  onDelete,
  getAuthHeaders,
}: {
  lead: Lead | null;
  duplicate: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  canUpdate: boolean;
  canDelete: boolean;
  onDelete: (lead: Lead) => void;
  getAuthHeaders: () => Promise<HeadersInit>;
}) {
  const [updating, setUpdating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!lead) return null;

  async function changeStatus(status: string) {
    if (!lead) return;
    setUpdating(true);
    setActionError(null);
    try {
      const res = await fetch("/api/airtable/leads", {
        method: "PATCH",
        credentials: "same-origin",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ id: lead.id, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        setActionError(data.error ?? "Could not update status");
        return;
      }
      onStatusChange(lead.id, status);
    } finally {
      setUpdating(false);
    }
  }

  const events = [
    { label: "Lead received", value: fullDate(lead.createdAt), icon: Sparkles, tone: GOLD },
    ...(lead.emailSentStatus ? [{ label: `Email ${lead.emailSentStatus}`, value: "Automation status", icon: Mail, tone: isSent(lead.emailSentStatus) ? "#22C55E" : "#F59E0B" }] : []),
    ...(lead.smsSentStatus ? [{ label: `SMS ${lead.smsSentStatus}`, value: "Automation status", icon: MessageSquare, tone: isSent(lead.smsSentStatus) ? "#22C55E" : "#F59E0B" }] : []),
    { label: `Current status: ${lead.status}`, value: duplicate ? "Possible duplicate detected" : "Live Airtable status", icon: ShieldCheck, tone: duplicate ? "#A1A1AA" : TEAL },
  ];

  return (
    <div className="fixed inset-0 z-[70]">
      <button className="absolute inset-0 bg-black/55" aria-label="Close lead detail panel" onClick={onClose} />
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-[480px] flex-col border-l"
        style={{ backgroundColor: "#09090D", borderColor: BORDER, boxShadow: "-28px 0 80px rgba(0,0,0,0.42)" }}
      >
        <div className="flex items-start justify-between gap-4 border-b p-5" style={{ borderColor: BORDER }}>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: GOLD }}>
              Lead profile
            </p>
            <h2 className="mt-1 truncate text-xl font-extrabold" style={{ color: TEXT }}>
              {lead.name || "Unnamed lead"}
            </h2>
            <p className="mt-1 text-xs" style={{ color: MUTED }}>
              {sourceLabel(lead.source)} - {timeAgo(lead.createdAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border p-2"
            style={{ borderColor: BORDER, color: MUTED, backgroundColor: CARD }}
            aria-label="Close lead details"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(lead)}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold"
              style={{ color: "#F87171", backgroundColor: "rgba(248,113,113,0.08)", borderColor: "rgba(248,113,113,0.25)" }}
            >
              <Trash2 size={15} />
              Delete lead
            </button>
          )}

          {actionError && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border p-3 text-sm" style={{ color: "#F87171", backgroundColor: "rgba(248,113,113,0.08)", borderColor: "rgba(248,113,113,0.25)" }}>
              <AlertCircle size={16} />
              {actionError}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={lead.status} />
            {duplicate && <StatusPill status="Duplicate" />}
            <DeliveryPill label="SMS" value={lead.smsSentStatus} />
            <DeliveryPill label="Email" value={lead.emailSentStatus} />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { label: "Phone", value: lead.phone, href: `tel:${lead.phone}`, icon: Phone },
              { label: "Email", value: lead.email, href: `mailto:${lead.email}`, icon: Mail },
              { label: "Treatment", value: lead.treatment, icon: Sparkles },
              { label: "Created", value: fullDate(lead.createdAt), icon: CalendarDays },
            ].map(({ label, value, href, icon: Icon }) => (
              <div key={label} className="rounded-2xl border p-3" style={{ backgroundColor: CARD, borderColor: BORDER_SOFT }}>
                <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: DIM }}>
                  <Icon size={11} />
                  {label}
                </p>
                {href && value ? (
                  <a className="break-words text-sm font-semibold" style={{ color: TEAL }} href={href}>
                    {value}
                  </a>
                ) : (
                  <p className="break-words text-sm font-semibold" style={{ color: value ? TEXT : MUTED }}>
                    {value || "Not captured"}
                  </p>
                )}
              </div>
            ))}
          </div>

          {canUpdate && (
            <div className="mt-5 rounded-2xl border p-4" style={{ backgroundColor: CARD, borderColor: BORDER_SOFT }}>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: GOLD }}>
                Inline status change
              </p>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    disabled={updating || lead.status === status}
                    onClick={() => changeStatus(status)}
                    className="rounded-xl border px-3 py-2 text-left text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      borderColor: lead.status === status ? STATUS_CONFIG[status].border : BORDER_SOFT,
                      color: lead.status === status ? STATUS_CONFIG[status].color : MUTED,
                      backgroundColor: lead.status === status ? STATUS_CONFIG[status].bg : "rgba(255,255,255,0.025)",
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 rounded-2xl border p-4" style={{ backgroundColor: CARD, borderColor: BORDER_SOFT }}>
            <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: GOLD }}>
              <MessageSquare size={12} />
              Original message
            </p>
            <p className="text-sm leading-6" style={{ color: lead.message ? TEXT : MUTED }}>
              {lead.message || "No message captured on this lead."}
            </p>
          </div>

          <div className="mt-5 rounded-2xl border p-4" style={{ backgroundColor: CARD, borderColor: BORDER_SOFT }}>
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: GOLD }}>
              Message and status timeline
            </p>
            <div className="space-y-4">
              {events.map(({ label, value, icon: Icon, tone }, index) => (
                <div key={`${label}-${index}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border" style={{ color: tone, backgroundColor: `${tone}12`, borderColor: `${tone}35` }}>
                      <Icon size={14} />
                    </div>
                    {index < events.length - 1 && <div className="mt-2 h-8 w-px" style={{ backgroundColor: BORDER_SOFT }} />}
                  </div>
                  <div className="min-w-0 pt-1">
                    <p className="text-sm font-bold" style={{ color: TEXT }}>
                      {label}
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: MUTED }}>
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border p-4" style={{ backgroundColor: CARD, borderColor: BORDER_SOFT }}>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: GOLD }}>
              Attribution
            </p>
            <div className="flex flex-wrap gap-2">
              {[lead.utmSource, lead.utmMedium, lead.utmCampaign, lead.pageUrl].filter(Boolean).map((item) => (
                <span key={item} className="max-w-full truncate rounded-full px-3 py-1 text-xs" style={{ color: MUTED, backgroundColor: "rgba(255,255,255,0.04)" }}>
                  {item}
                </span>
              ))}
              {![lead.utmSource, lead.utmMedium, lead.utmCampaign, lead.pageUrl].some(Boolean) && (
                <span className="text-xs" style={{ color: MUTED }}>No campaign attribution captured.</span>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default function LeadsClient() {
  const { can } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const canUpdateLeads = can("update:leads");
  const canDeleteLeads = can("delete:leads");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [smsFilter, setSmsFilter] = useState<SentFilter>("all");
  const [emailFilter, setEmailFilter] = useState<SentFilter>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/airtable/leads?status=all", { cache: "no-store" });
      const data = await res.json() as { leads?: Lead[]; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Could not load leads");
      setLeads(data.leads ?? []);
    } catch (event) {
      setError(String(event));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const duplicateKeys = useMemo(() => {
    const emailCounts = new Map<string, number>();
    const phoneCounts = new Map<string, number>();
    for (const lead of leads) {
      const email = normalize(lead.email);
      const phone = normalizePhone(lead.phone);
      if (email) emailCounts.set(email, (emailCounts.get(email) ?? 0) + 1);
      if (phone) phoneCounts.set(phone, (phoneCounts.get(phone) ?? 0) + 1);
    }
    return { emailCounts, phoneCounts };
  }, [leads]);

  const isDuplicateLead = useCallback((lead: Lead) => {
    const email = normalize(lead.email);
    const phone = normalizePhone(lead.phone);
    return Boolean((email && (duplicateKeys.emailCounts.get(email) ?? 0) > 1) || (phone && (duplicateKeys.phoneCounts.get(phone) ?? 0) > 1));
  }, [duplicateKeys]);

  const sources = useMemo(() => {
    const values = Array.from(new Set(leads.map((lead) => sourceLabel(lead.source)).filter(Boolean))).sort();
    return [{ label: "All sources", value: "all" }, ...values.map((source) => ({ label: source, value: source }))];
  }, [leads]);

  const filtered = useMemo(() => {
    const query = normalize(search);
    return leads.filter((lead) => {
      const matchesSearch = !query || [lead.name, lead.phone, lead.email].some((value) => normalize(value).includes(query));
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter || (statusFilter === "Duplicate" && isDuplicateLead(lead));
      const matchesSource = sourceFilter === "all" || sourceLabel(lead.source) === sourceFilter;
      const matchesDate = withinDateRange(lead.createdAt, dateFilter);
      const matchesSms = smsFilter === "all" || (smsFilter === "sent" ? isSent(lead.smsSentStatus) : !isSent(lead.smsSentStatus));
      const matchesEmail = emailFilter === "all" || (emailFilter === "sent" ? isSent(lead.emailSentStatus) : !isSent(lead.emailSentStatus));
      return matchesSearch && matchesStatus && matchesSource && matchesDate && matchesSms && matchesEmail;
    });
  }, [dateFilter, emailFilter, isDuplicateLead, leads, search, smsFilter, sourceFilter, statusFilter]);

  const latestLead = filtered[0] ?? leads[0] ?? null;
  const todayCount = leads.filter((lead) => withinDateRange(lead.createdAt, "today")).length;
  const contactedCount = leads.filter((lead) => lead.status === "Contacted").length;
  const bookedCount = leads.filter((lead) => lead.status === "Booked").length;
  const duplicateCount = leads.filter(isDuplicateLead).length;

  function updateStatus(id: string, status: string) {
    setLeads((current) => current.map((lead) => lead.id === id ? { ...lead, status } : lead));
    setSelectedLead((lead) => lead?.id === id ? { ...lead, status } : lead);
  }

  async function getAuthHeaders(): Promise<HeadersInit> {
    const { data } = await supabase.auth.getSession();
    return {
      "Content-Type": "application/json",
      ...(data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {}),
    };
  }

  async function changeRowStatus(lead: Lead, status: string) {
    if (!canUpdateLeads) return;
    setOpenMenuId(null);
    const res = await fetch("/api/airtable/leads", {
      method: "PATCH",
      credentials: "same-origin",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ id: lead.id, status }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
      setError(data.error ?? "Could not update status");
      return;
    }
    updateStatus(lead.id, status);
  }

  async function deleteLead(lead: Lead) {
    if (!canDeleteLeads) return;
    setOpenMenuId(null);
    setDeleteError(null);
    const res = await fetch("/api/airtable/leads", {
      method: "DELETE",
      credentials: "same-origin",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ id: lead.id }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
      setDeleteError(data.error ?? "Could not delete lead");
      return;
    }
    setLeads((current) => current.filter((item) => item.id !== lead.id));
    setSelectedLead((current) => current?.id === lead.id ? null : current);
  }

  return (
    <div className="space-y-5">
      <LeadTicker lead={latestLead} loading={loading} onRefresh={() => void load()} />

      {deleteError && (
        <div className="flex items-start justify-between gap-3 rounded-2xl border p-4" style={{ borderColor: "rgba(248,113,113,0.25)", backgroundColor: "rgba(248,113,113,0.08)" }}>
          <div className="flex items-start gap-3">
            <AlertCircle size={18} style={{ color: "#F87171" }} />
            <div>
              <p className="text-sm font-bold" style={{ color: "#F87171" }}>Could not delete lead</p>
              <p className="mt-1 text-xs" style={{ color: MUTED }}>{deleteError}</p>
            </div>
          </div>
          <button type="button" onClick={() => setDeleteError(null)} className="rounded-lg p-1" style={{ color: MUTED }}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <StatCard label="Total leads" value={leads.length} meta={`${filtered.length} visible`} color={GOLD} />
        <StatCard label="New today" value={todayCount} meta={trendLabel(todayCount, leads.length)} color="#60A5FA" />
        <StatCard label="Contacted" value={contactedCount} meta={trendLabel(contactedCount, leads.length)} color="#F59E0B" />
        <StatCard label="Booked" value={bookedCount} meta={trendLabel(bookedCount, leads.length)} color="#22C55E" />
        <StatCard label="Duplicates" value={duplicateCount} meta="matched" color="#A1A1AA" />
      </div>

      <div
        className="rounded-2xl border p-3"
        style={{
          background: `linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01)), ${PANEL}`,
          borderColor: BORDER,
        }}
      >
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, phone, or email"
              aria-label="Search leads"
              className="h-11 w-full rounded-xl border pl-10 pr-3 text-sm"
              style={{ backgroundColor: CARD, borderColor: BORDER, color: TEXT }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-5 xl:flex">
            <SelectControl
              label="Filter by status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[{ label: "All statuses", value: "all" }, ...STATUS_OPTIONS.map((status) => ({ label: status, value: status }))]}
            />
            <SelectControl label="Filter by source" value={sourceFilter} onChange={setSourceFilter} options={sources} />
            <SelectControl
              label="Filter by date range"
              value={dateFilter}
              onChange={(value) => setDateFilter(value as DateFilter)}
              options={[
                { label: "All dates", value: "all" },
                { label: "Today", value: "today" },
                { label: "Last 7 days", value: "7" },
                { label: "Last 30 days", value: "30" },
              ]}
            />
            <SelectControl
              label="Filter by SMS sent"
              value={smsFilter}
              onChange={(value) => setSmsFilter(value as SentFilter)}
              options={[
                { label: "SMS: All", value: "all" },
                { label: "SMS sent", value: "sent" },
                { label: "SMS not sent", value: "not_sent" },
              ]}
            />
            <SelectControl
              label="Filter by email sent"
              value={emailFilter}
              onChange={(value) => setEmailFilter(value as SentFilter)}
              options={[
                { label: "Email: All", value: "all" },
                { label: "Email sent", value: "sent" },
                { label: "Email not sent", value: "not_sent" },
              ]}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 rounded-2xl border py-20" style={{ borderColor: BORDER, backgroundColor: CARD }}>
          <RefreshCw size={18} className="animate-spin" style={{ color: GOLD }} />
          <span className="text-sm font-semibold" style={{ color: MUTED }}>Loading live Airtable leads...</span>
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 rounded-2xl border p-5" style={{ borderColor: "rgba(248,113,113,0.25)", backgroundColor: "rgba(248,113,113,0.08)" }}>
          <AlertCircle size={18} style={{ color: "#F87171" }} />
          <div>
            <p className="text-sm font-bold" style={{ color: "#F87171" }}>Could not load leads</p>
            <p className="mt-1 text-xs" style={{ color: MUTED }}>{error}</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border px-6 py-20 text-center" style={{ borderColor: BORDER, backgroundColor: CARD }}>
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: "rgba(201,168,76,0.10)", color: GOLD }}>
            <SlidersHorizontal size={22} />
          </div>
          <p className="text-base font-bold" style={{ color: TEXT }}>No leads match these filters</p>
          <p className="mt-1 max-w-md text-sm" style={{ color: MUTED }}>Adjust the filters or search term to bring the live Airtable records back into view.</p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-visible rounded-2xl border md:block" style={{ borderColor: BORDER, backgroundColor: CARD }}>
            <div className="max-h-[68vh] overflow-auto">
              <table className="w-full min-w-[1120px] border-separate border-spacing-0">
                <thead className="sticky top-0 z-10">
                  <tr style={{ backgroundColor: "#0B0B10" }}>
                    {[
                      { key: "name", label: "Name" },
                      { key: "phone", label: "Phone" },
                      { key: "email-address", label: "Email" },
                      { key: "source", label: "Source" },
                      { key: "status", label: "Status" },
                      { key: "sms", label: "SMS" },
                      { key: "email-delivery", label: "Email" },
                      { key: "created-at", label: "Created At" },
                      { key: "last-contacted", label: "Last Contacted" },
                      { key: "actions", label: "" },
                    ].map((heading) => (
                      <th key={heading.key} className="border-b px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.09em]" style={{ color: DIM, borderColor: BORDER_SOFT }}>
                        {heading.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead) => {
                    const duplicate = isDuplicateLead(lead);
                    return (
                      <tr
                        key={lead.id}
                        className="group cursor-pointer transition-colors"
                        style={{ backgroundColor: BG }}
                        onClick={() => setSelectedLead(lead)}
                        onMouseEnter={(event) => { event.currentTarget.style.backgroundColor = CARD_HOVER; }}
                        onMouseLeave={(event) => { event.currentTarget.style.backgroundColor = BG; }}
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") setSelectedLead(lead);
                        }}
                      >
                        <td className="border-b px-4 py-3" style={{ borderColor: BORDER_SOFT }}>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-extrabold" style={{ color: GOLD, backgroundColor: "rgba(201,168,76,0.09)", borderColor: "rgba(201,168,76,0.18)" }}>
                              {initials(lead.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold" style={{ color: TEXT }}>{lead.name || "Unnamed lead"}</p>
                              <p className="truncate text-[11px]" style={{ color: duplicate ? "#A1A1AA" : DIM }}>{duplicate ? "Possible duplicate" : lead.treatment || "No treatment captured"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="border-b px-4 py-3 text-sm" style={{ borderColor: BORDER_SOFT, color: MUTED }}>{lead.phone || "-"}</td>
                        <td className="border-b px-4 py-3 text-sm" style={{ borderColor: BORDER_SOFT, color: MUTED }}>{lead.email || "-"}</td>
                        <td className="border-b px-4 py-3 text-xs font-semibold" style={{ borderColor: BORDER_SOFT, color: TEXT }}>{sourceLabel(lead.source)}</td>
                        <td className="border-b px-4 py-3" style={{ borderColor: BORDER_SOFT }} onClick={(event) => event.stopPropagation()}>
                          {canUpdateLeads ? (
                            <select
                              value={lead.status}
                              onChange={(event) => changeRowStatus(lead, event.target.value)}
                              className="rounded-full border px-2.5 py-1 text-[11px] font-bold"
                              style={{
                                color: (STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.New).color,
                                backgroundColor: (STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.New).bg,
                                borderColor: (STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.New).border,
                              }}
                              aria-label={`Change status for ${lead.name}`}
                            >
                              {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                            </select>
                          ) : (
                            <StatusPill status={lead.status} />
                          )}
                        </td>
                        <td className="border-b px-4 py-3" style={{ borderColor: BORDER_SOFT }}><DeliveryPill label="SMS" value={lead.smsSentStatus} /></td>
                        <td className="border-b px-4 py-3" style={{ borderColor: BORDER_SOFT }}><DeliveryPill label="Email" value={lead.emailSentStatus} /></td>
                        <td className="border-b px-4 py-3 text-xs" style={{ borderColor: BORDER_SOFT, color: MUTED }}>{timeAgo(lead.createdAt)}</td>
                        <td className="border-b px-4 py-3 text-xs" style={{ borderColor: BORDER_SOFT, color: MUTED }}>{lastContacted(lead) ? timeAgo(lastContacted(lead)) : "Not contacted"}</td>
                        <td className="relative border-b px-4 py-3 text-right" style={{ borderColor: BORDER_SOFT }} onClick={(event) => event.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {canDeleteLeads && (
                              <button
                                type="button"
                                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border transition hover:brightness-125"
                                style={{ borderColor: "rgba(248,113,113,0.25)", color: "#F87171", backgroundColor: "rgba(248,113,113,0.08)" }}
                                aria-label={`Delete ${lead.name || "lead"}`}
                                onClick={() => void deleteLead(lead)}
                                title="Delete lead"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                            <button
                              className="rounded-lg border p-1.5"
                              style={{ borderColor: BORDER_SOFT, color: MUTED, backgroundColor: "rgba(255,255,255,0.025)" }}
                              aria-label={`Open quick actions for ${lead.name}`}
                              onClick={() => setOpenMenuId(openMenuId === lead.id ? null : lead.id)}
                            >
                              <MoreHorizontal size={15} />
                            </button>
                          </div>
                          {openMenuId === lead.id && (
                            <div className="absolute right-3 top-10 z-20 w-44 rounded-xl border p-1 text-left" style={{ backgroundColor: "#08080C", borderColor: BORDER, boxShadow: "0 18px 50px rgba(0,0,0,0.35)" }}>
                              <a href={`tel:${lead.phone}`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold" style={{ color: TEXT }}><Phone size={13} /> Call</a>
                              <a href={`mailto:${lead.email}`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold" style={{ color: TEXT }}><Mail size={13} /> Email</a>
                              <button onClick={() => navigator.clipboard?.writeText(`${lead.name} ${lead.phone} ${lead.email}`)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold" style={{ color: TEXT }}><Copy size={13} /> Copy contact</button>
                              {canDeleteLeads && (
                                <button type="button" onClick={() => void deleteLead(lead)} className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold" style={{ color: "#F87171" }}><Trash2 size={13} /> Delete lead</button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-3 md:hidden">
            {filtered.map((lead) => {
              const duplicate = isDuplicateLead(lead);
              return (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className="rounded-2xl border p-4 text-left"
                  style={{ backgroundColor: CARD, borderColor: duplicate ? "rgba(161,161,170,0.28)" : BORDER }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border text-xs font-extrabold" style={{ color: GOLD, backgroundColor: "rgba(201,168,76,0.09)", borderColor: "rgba(201,168,76,0.18)" }}>
                        {initials(lead.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold" style={{ color: TEXT }}>{lead.name || "Unnamed lead"}</p>
                        <p className="mt-1 truncate text-xs" style={{ color: MUTED }}>{lead.phone || lead.email || "No contact captured"}</p>
                      </div>
                    </div>
                    <StatusPill status={lead.status} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl px-3 py-2" style={{ backgroundColor: "rgba(255,255,255,0.025)" }}>
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: DIM }}>Source</p>
                      <p className="mt-1 truncate text-xs font-semibold" style={{ color: TEXT }}>{sourceLabel(lead.source)}</p>
                    </div>
                    <div className="rounded-xl px-3 py-2" style={{ backgroundColor: "rgba(255,255,255,0.025)" }}>
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: DIM }}>Created</p>
                      <p className="mt-1 text-xs font-semibold" style={{ color: TEXT }}>{timeAgo(lead.createdAt)}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {duplicate && <StatusPill status="Duplicate" />}
                    <DeliveryPill label="SMS" value={lead.smsSentStatus} />
                    <DeliveryPill label="Email" value={lead.emailSentStatus} />
                  </div>
                  {canDeleteLeads && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        void deleteLead(lead);
                      }}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold"
                      style={{ color: "#F87171", backgroundColor: "rgba(248,113,113,0.08)", borderColor: "rgba(248,113,113,0.25)" }}
                    >
                      <Trash2 size={14} />
                      Delete lead
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <LeadSlideOver
        lead={selectedLead}
        duplicate={selectedLead ? isDuplicateLead(selectedLead) : false}
        onClose={() => setSelectedLead(null)}
        onStatusChange={updateStatus}
        canUpdate={canUpdateLeads}
        canDelete={canDeleteLeads}
        onDelete={(lead) => void deleteLead(lead)}
        getAuthHeaders={getAuthHeaders}
      />
    </div>
  );
}
