"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle, ChevronDown, Clock3,
  ExternalLink, Mail, MessageSquare, RefreshCw, Search, X,
} from "lucide-react";
import { DASHBOARD_REFRESH_EVENT } from "@/lib/dashboard-refresh";
import { DATA_CACHE_KEYS, setCachedData, useDashboardCachedData } from "@/lib/dashboard-data-cache";
import type { DeliveryStatus, MessageChannel, MessageLog } from "@/types/message-log";

const GOLD        = "#C9A84C";
const PANEL       = "#0D0D12";
const CARD        = "#111117";
const CARD_HOVER  = "#161620";
const TEXT        = "#F0ECE4";
const MUTED       = "#7A7A8A";
const DIM         = "#5A5A6A";
const BORDER      = "rgba(201,168,76,0.12)";
const BORDER_SOFT = "rgba(255,255,255,0.06)";
const TEAL        = "#2DD4BF";
const GREEN       = "#22C55E";
const AMBER       = "#F59E0B";
const RED         = "#F87171";

type ChannelFilter   = MessageChannel | "All";
type StatusFilter    = DeliveryStatus | "All";
type DateRangeFilter = "24h" | "7d" | "30d" | "90d" | "all";

const STATUS_CFG: Record<DeliveryStatus, { color: string; bg: string; border: string }> = {
  Sent:    { color: GREEN, bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.28)"   },
  Pending: { color: AMBER, bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.28)"  },
  Failed:  { color: RED,   bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.28)" },
  Unknown: { color: MUTED, bg: "rgba(161,161,170,0.10)", border: "rgba(161,161,170,0.22)" },
};

function timeAgo(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const s = Date.now() - d.getTime();
  const m = Math.floor(s / 60000), h = Math.floor(s / 3600000), dy = Math.floor(s / 86400000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (dy < 7) return `${dy}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fullDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}
function initials(name: string | null) {
  return (name ?? "?").split(" ").filter(Boolean).slice(0, 2).map(p => p[0]).join("").toUpperCase() || "?";
}
function pct(a: number, b: number) { return b ? Math.round((a / b) * 100) : 0; }
function recipientLabel(log: MessageLog) {
  return log.recipientLeadName || "Unknown";
}
function contactLine(log: MessageLog) {
  return log.recipientLeadEmail || log.recipientLeadPhone || "—";
}
function previewBody(v: string) {
  if (!v) return "No message body";
  return v.length > 100 ? v.slice(0, 100) + "…" : v;
}

/* ── Status pill ── */
function StatusPill({ status }: { status: DeliveryStatus }) {
  const c = STATUS_CFG[status] ?? STATUS_CFG.Unknown;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
      style={{ color: c.color, backgroundColor: c.bg, border: `1px solid ${c.border}` }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.color }} />
      {status}
    </span>
  );
}

/* ── Channel pill ── */
function ChannelPill({ channel }: { channel: MessageChannel }) {
  const color = channel === "SMS" ? TEAL : channel === "Email" ? GOLD : MUTED;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
      style={{ color, backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
      {channel === "SMS" ? <MessageSquare size={11} /> : <Mail size={11} />}
      {channel}
    </span>
  );
}

/* ── KPI card ── */
function KpiCard({ label, value, sub, color = GOLD, icon: Icon }: {
  label: string; value: string | number; sub: string; color?: string; icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border p-5 flex items-center gap-4"
      style={{ backgroundColor: CARD, borderColor: `${color}20` }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}15` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.09em] mb-1" style={{ color: DIM }}>{label}</p>
        <p className="text-2xl font-extrabold leading-none" style={{ color: TEXT }}>{value}</p>
        <p className="text-[11px] mt-1" style={{ color: MUTED }}>{sub}</p>
      </div>
    </div>
  );
}

/* ── Delivery bar chart ── */
function DeliveryBars({ sent, pending, failed, total }: { sent: number; pending: number; failed: number; total: number }) {
  const bars = [
    { label: "Sent",    count: sent,    pct: pct(sent, total),    color: GREEN },
    { label: "Failed",  count: failed,  pct: pct(failed, total),  color: RED   },
    { label: "Pending", count: pending, pct: pct(pending, total), color: AMBER },
  ];
  return (
    <div className="rounded-2xl border p-5" style={{ backgroundColor: CARD, borderColor: BORDER }}>
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.09em]" style={{ color: GOLD }}>Delivery Breakdown</p>
        <p className="text-xs font-semibold" style={{ color: MUTED }}>{total} total</p>
      </div>
      <div className="space-y-4">
        {bars.map(b => (
          <div key={b.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold" style={{ color: TEXT }}>{b.label}</span>
              <span className="text-xs font-bold" style={{ color: b.color }}>{b.count} <span style={{ color: DIM, fontWeight: 400 }}>({b.pct}%)</span></span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(b.pct > 0 ? 3 : 0, b.pct)}%`, backgroundColor: b.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Channel split ── */
function ChannelSplit({ email, sms, total }: { email: number; sms: number; total: number }) {
  const emailPct = pct(email, total);
  const smsPct   = pct(sms, total);
  return (
    <div className="rounded-2xl border p-5" style={{ backgroundColor: CARD, borderColor: BORDER }}>
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.09em]" style={{ color: GOLD }}>Channel Split</p>
        <p className="text-xs font-semibold" style={{ color: MUTED }}>Email vs SMS</p>
      </div>

      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-5" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
        {emailPct > 0 && <div style={{ width: `${emailPct}%`, backgroundColor: GOLD, borderRadius: "9999px 0 0 9999px" }} />}
        {smsPct > 0  && <div style={{ width: `${smsPct}%`,  backgroundColor: TEAL, borderRadius: "0 9999px 9999px 0" }} />}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Email", count: email, pct: emailPct, color: GOLD },
          { label: "SMS",   count: sms,   pct: smsPct,   color: TEAL },
        ].map(c => (
          <div key={c.label} className="rounded-xl p-3" style={{ backgroundColor: `${c.color}08`, border: `1px solid ${c.color}18` }}>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
              <p className="text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: c.color }}>{c.label}</p>
            </div>
            <p className="text-xl font-extrabold leading-none" style={{ color: TEXT }}>{c.pct}%</p>
            <p className="text-[11px] mt-1" style={{ color: MUTED }}>{c.count} messages</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Filter select ── */
function FilterSelect({ label, value, onChange, options }: {
  label: string; value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} aria-label={label}
        className="h-9 appearance-none rounded-xl border pl-3 pr-8 text-xs font-semibold"
        style={{ backgroundColor: CARD, borderColor: BORDER, color: TEXT }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
    </label>
  );
}

/* ── Slide-over detail panel ── */
function DetailPanel({ log, onClose }: {
  log: MessageLog | null; onClose: () => void;
}) {
  if (!log) return null;
  const c = STATUS_CFG[log.deliveryStatus];
  return (
    <div className="fixed inset-0 z-[70]">
      <button className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Close" />
      <aside className="absolute right-0 top-0 h-full w-full max-w-[460px] flex flex-col border-l overflow-hidden"
        style={{ backgroundColor: "#09090D", borderColor: BORDER, boxShadow: "-24px 0 80px rgba(0,0,0,0.5)" }}>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-5 border-b flex-shrink-0" style={{ borderColor: BORDER }}>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] mb-1" style={{ color: GOLD }}>Message Detail</p>
            <h2 className="text-lg font-extrabold truncate" style={{ color: TEXT }}>{recipientLabel(log)}</h2>
            <p className="text-xs mt-0.5" style={{ color: MUTED }}>{log.channel} · {timeAgo(log.sentAt ?? log.createdTime)}</p>
          </div>
          <button onClick={onClose} className="rounded-xl border p-2 flex-shrink-0"
            style={{ borderColor: BORDER, color: MUTED, backgroundColor: CARD }}>
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            <ChannelPill channel={log.channel} />
            <StatusPill status={log.deliveryStatus} />
          </div>

          {/* Alert banner for failed */}
          {log.deliveryStatus === "Failed" && (
            <div className="rounded-xl p-3 text-xs leading-5" style={{ color: RED, backgroundColor: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
              This message failed to deliver. Check Mandrill, recipient address, and Make.com run history.
            </div>
          )}

          {/* Key fields */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Recipient",  value: recipientLabel(log) },
              { label: "Contact",    value: contactLine(log)    },
              { label: "Sent At",    value: fullDate(log.sentAt) },
              { label: "Sequence",   value: log.sequence || "—" },
              { label: "Lead Status",value: log.recipientLeadStatus || "—" },
            ].map(f => (
              <div key={f.label} className="rounded-xl border p-3" style={{ backgroundColor: CARD, borderColor: BORDER_SOFT }}>
                <p className="text-[9px] font-bold uppercase tracking-[0.09em] mb-1" style={{ color: DIM }}>{f.label}</p>
                <p className="text-sm font-semibold break-words" style={{ color: TEXT }}>{f.value}</p>
              </div>
            ))}
          </div>

          {/* Message body */}
          <div className="rounded-xl border p-4" style={{ backgroundColor: CARD, borderColor: BORDER_SOFT }}>
            <p className="text-[9px] font-bold uppercase tracking-[0.09em] mb-3" style={{ color: GOLD }}>Message Body</p>
            <p className="text-sm leading-6 whitespace-pre-wrap" style={{ color: log.messageBody ? TEXT : MUTED }}>
              {log.messageBody || "No message body captured."}
            </p>
          </div>

          {/* Error reason */}
          {log.errorReason && (
            <div className="rounded-xl border p-4" style={{ backgroundColor: "rgba(248,113,113,0.06)", borderColor: "rgba(248,113,113,0.2)" }}>
              <p className="text-[9px] font-bold uppercase tracking-[0.09em] mb-2" style={{ color: RED }}>Error Reason</p>
              <p className="text-xs" style={{ color: RED }}>{log.errorReason}</p>
            </div>
          )}

          {/* Timeline */}
          <div className="rounded-xl border p-4" style={{ backgroundColor: CARD, borderColor: BORDER_SOFT }}>
            <p className="text-[9px] font-bold uppercase tracking-[0.09em] mb-4" style={{ color: GOLD }}>Automation Timeline</p>
            {[
              { label: "Lead record created",     value: fullDate(log.createdTime),                                  color: GOLD  },
              { label: "Message dispatched",       value: log.sequence || `${log.channel} automation`, color: log.channel === "SMS" ? TEAL : GOLD },
              { label: "Delivery status",          value: log.deliveryStatus,                                         color: c.color },
            ].map((e, i, arr) => (
              <div key={e.label} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center border flex-shrink-0"
                    style={{ backgroundColor: `${e.color}12`, borderColor: `${e.color}30`, color: e.color }}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
                  </div>
                  {i < arr.length - 1 && <div className="w-px flex-1 my-1" style={{ backgroundColor: BORDER_SOFT }} />}
                </div>
                <div className="pb-3 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: TEXT }}>{e.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: MUTED }}>{e.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Lead link */}
          {log.recipientLeadId && (
            <a href={`/leads?leadId=${encodeURIComponent(log.recipientLeadId)}`}
              className="flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-bold w-full"
              style={{ color: GOLD, backgroundColor: "rgba(201,168,76,0.06)", borderColor: BORDER }}>
              <ExternalLink size={14} /> View Lead Profile
            </a>
          )}
        </div>
      </aside>
    </div>
  );
}

/* ═══════════════════════════════════════ MAIN ═══════════════════════════════════════ */
export default function MessageLogsClient() {
  const cachedLogs = useDashboardCachedData<{ messageLogs?: MessageLog[] }>(DATA_CACHE_KEYS.messageLogs);
  const hadCachedLogsOnMount = useRef(Boolean(cachedLogs));
  const [logs, setLogs]             = useState<MessageLog[]>(() => cachedLogs?.messageLogs ?? []);
  const [loading, setLoading]       = useState(() => !cachedLogs);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState("");
  const [channelFilter, setChannel] = useState<ChannelFilter>("All");
  const [statusFilter, setStatus]   = useState<StatusFilter>("All");
  const [dateRange, setDateRange]   = useState<DateRangeFilter>("all");
  const [selected, setSelected]     = useState<MessageLog | null>(null);

  useEffect(() => {
    if (cachedLogs?.messageLogs) { setLogs(cachedLogs.messageLogs); setLoading(false); }
  }, [cachedLogs]);

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true); setError(null);
    try {
      const p = new URLSearchParams({ channel: channelFilter, status: statusFilter, dateRange, search });
      const res = await fetch(`/api/airtable/message-logs?${p}`, { credentials: "same-origin", cache: "no-store" });
      const data = await res.json() as { messageLogs?: MessageLog[]; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to load");
      setLogs(data.messageLogs ?? []);
      if (channelFilter === "All" && statusFilter === "All" && dateRange === "all" && !search) setCachedData(DATA_CACHE_KEYS.messageLogs, data);
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  }, [channelFilter, dateRange, search, statusFilter]);

  useEffect(() => {
    const isCachedDefault = hadCachedLogsOnMount.current && channelFilter === "All" && statusFilter === "All" && dateRange === "all" && !search;
    const t = setTimeout(() => void load(!isCachedDefault), 200);
    return () => clearTimeout(t);
  }, [channelFilter, dateRange, load, search, statusFilter]);

  useEffect(() => {
    const refresh = () => void load();
    window.addEventListener(DASHBOARD_REFRESH_EVENT, refresh);
    return () => window.removeEventListener(DASHBOARD_REFRESH_EVENT, refresh);
  }, [load]);

  const stats = useMemo(() => {
    const sent    = logs.filter(l => l.deliveryStatus === "Sent").length;
    const failed  = logs.filter(l => l.deliveryStatus === "Failed").length;
    const pending = logs.filter(l => l.deliveryStatus === "Pending").length;
    const sms     = logs.filter(l => l.channel === "SMS").length;
    const email   = logs.filter(l => l.channel === "Email").length;
    const rate    = pct(sent, logs.length);
    return { sent, failed, pending, sms, email, rate };
  }, [logs]);

  const latest = logs[0] ?? null;

  return (
    <div className="space-y-5">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] mb-1" style={{ color: GOLD }}>
            Automation Logs
          </p>
          <h1 className="text-2xl font-extrabold" style={{ color: "#F0ECE4" }}>Message Logs</h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>Email &amp; SMS delivery records from Make.com automations</p>
        </div>
        <div className="flex items-center gap-3">
          {latest && (
            <div className="hidden sm:flex items-center gap-2 rounded-xl border px-3 py-2"
              style={{ backgroundColor: CARD, borderColor: BORDER }}>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-40" style={{ backgroundColor: TEAL }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: TEAL }} />
              </span>
              <span className="text-xs font-semibold" style={{ color: MUTED }}>
                Last: <span style={{ color: TEXT }}>{latest.channel} to {recipientLabel(latest)}</span>
                <span className="ml-1.5" style={{ color: DIM }}>{timeAgo(latest.sentAt ?? latest.createdTime)}</span>
              </span>
            </div>
          )}
          <button onClick={() => void load()} disabled={loading}
            className="flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold"
            style={{ backgroundColor: "rgba(201,168,76,0.06)", borderColor: BORDER, color: GOLD }}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={MessageSquare} label="Total Messages"  value={logs.length}        sub="across all channels" color={GOLD}  />
        <KpiCard icon={Clock3}        label="Delivery Rate"   value={`${stats.rate}%`}   sub={`${stats.sent} of ${logs.length} sent`} color={GREEN} />
        <KpiCard icon={AlertCircle}   label="Failed"          value={stats.failed}        sub={`${pct(stats.failed, logs.length)}% failure rate`} color={RED}  />
        <KpiCard icon={Mail}          label="Pending"         value={stats.pending}       sub="awaiting delivery"   color={AMBER} />
      </div>

      {/* ── Analytics Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DeliveryBars sent={stats.sent} pending={stats.pending} failed={stats.failed} total={logs.length} />
        <ChannelSplit email={stats.email} sms={stats.sms} total={logs.length} />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border p-3"
        style={{ backgroundColor: PANEL, borderColor: BORDER }}>
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: MUTED }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search recipient, sequence, message, or Mandrill ID…"
            className="h-9 w-full rounded-xl border pl-9 pr-3 text-xs"
            style={{ backgroundColor: CARD, borderColor: BORDER, color: TEXT }} />
        </div>
        <FilterSelect label="Channel" value={channelFilter} onChange={v => setChannel(v as ChannelFilter)}
          options={[{ label: "All Channels", value: "All" }, { label: "Email", value: "Email" }, { label: "SMS", value: "SMS" }]} />
        <FilterSelect label="Status" value={statusFilter} onChange={v => setStatus(v as StatusFilter)}
          options={[{ label: "All Statuses", value: "All" }, { label: "Sent", value: "Sent" }, { label: "Pending", value: "Pending" }, { label: "Failed", value: "Failed" }]} />
        <FilterSelect label="Date Range" value={dateRange} onChange={v => setDateRange(v as DateRangeFilter)}
          options={[{ label: "Last 24h", value: "24h" }, { label: "Last 7 days", value: "7d" }, { label: "Last 30 days", value: "30d" }, { label: "All time", value: "all" }]} />
        {(search || channelFilter !== "All" || statusFilter !== "All" || dateRange !== "all") && (
          <button onClick={() => { setSearch(""); setChannel("All"); setStatus("All"); setDateRange("all"); }}
            className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold"
            style={{ color: MUTED, borderColor: BORDER, backgroundColor: CARD }}>
            <X size={11} /> Clear
          </button>
        )}
        <p className="ml-auto text-xs font-semibold" style={{ color: DIM }}>{logs.length} records</p>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: BORDER, backgroundColor: CARD }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-5 py-4 border-b" style={{ borderColor: BORDER_SOFT }}>
              <div className="w-9 h-9 rounded-xl animate-pulse" style={{ backgroundColor: "rgba(255,255,255,0.06)", flexShrink: 0 }} />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 rounded-full animate-pulse" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
                <div className="h-2.5 w-1/2 rounded-full animate-pulse" style={{ backgroundColor: "rgba(255,255,255,0.04)" }} />
              </div>
              <div className="w-16 h-5 rounded-full animate-pulse" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 rounded-2xl border p-5"
          style={{ borderColor: "rgba(248,113,113,0.25)", backgroundColor: "rgba(248,113,113,0.07)" }}>
          <AlertCircle size={18} style={{ color: RED }} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold mb-1" style={{ color: RED }}>Could not load message logs</p>
            <p className="text-xs" style={{ color: MUTED }}>{error}</p>
          </div>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border py-20 text-center"
          style={{ borderColor: BORDER, backgroundColor: CARD }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: `${GOLD}12` }}>
            <MessageSquare size={22} style={{ color: GOLD }} />
          </div>
          <p className="text-base font-bold mb-1" style={{ color: TEXT }}>No message logs yet</p>
          <p className="text-sm max-w-sm" style={{ color: MUTED }}>
            When Make.com sends an email or SMS, delivery records will appear here automatically.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-2xl border overflow-hidden" style={{ borderColor: BORDER }}>
            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
              <table className="w-full min-w-[900px] border-separate border-spacing-0">
                <thead className="sticky top-0 z-10">
                  <tr style={{ backgroundColor: "#0B0B10" }}>
                    {["Recipient", "Channel", "Sequence", "Message Preview", "Status", "Sent", ""].map(h => (
                      <th key={h} className="border-b px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.09em]"
                        style={{ color: DIM, borderColor: BORDER_SOFT }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} onClick={() => setSelected(log)}
                      className="cursor-pointer transition-colors"
                      style={{ backgroundColor: "transparent" }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = CARD_HOVER}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                      <td className="border-b px-4 py-3" style={{ borderColor: BORDER_SOFT }}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold flex-shrink-0"
                            style={{ backgroundColor: "rgba(201,168,76,0.08)", color: GOLD, border: "1px solid rgba(201,168,76,0.18)" }}>
                            {initials(log.recipientLeadName)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate" style={{ color: TEXT }}>{recipientLabel(log)}</p>
                            <p className="text-[11px] truncate" style={{ color: DIM }}>{contactLine(log)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="border-b px-4 py-3" style={{ borderColor: BORDER_SOFT }}>
                        <ChannelPill channel={log.channel} />
                      </td>
                      <td className="border-b px-4 py-3 text-xs font-semibold" style={{ borderColor: BORDER_SOFT, color: log.sequence ? TEXT : DIM }}>
                        {log.sequence || "—"}
                      </td>
                      <td className="border-b px-4 py-3 max-w-[260px]" style={{ borderColor: BORDER_SOFT }}>
                        <p className="text-xs leading-5 line-clamp-2" style={{ color: MUTED }}>{previewBody(log.messageBody)}</p>
                      </td>
                      <td className="border-b px-4 py-3" style={{ borderColor: BORDER_SOFT }}>
                        <StatusPill status={log.deliveryStatus} />
                      </td>
                      <td className="border-b px-4 py-3 text-xs whitespace-nowrap" title={fullDate(log.sentAt)}
                        style={{ borderColor: BORDER_SOFT, color: MUTED }}>
                        {timeAgo(log.sentAt)}
                      </td>
                      <td className="border-b px-3 py-3" style={{ borderColor: BORDER_SOFT }}>
                        {log.recipientLeadId && (
                          <a href={`/leads?leadId=${encodeURIComponent(log.recipientLeadId)}`}
                            onClick={e => e.stopPropagation()}
                            className="rounded-lg border p-1.5 flex items-center justify-center"
                            style={{ borderColor: BORDER_SOFT, color: MUTED, backgroundColor: "rgba(255,255,255,0.02)" }}
                            title="View lead">
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {logs.map(log => (
              <div key={log.id} onClick={() => setSelected(log)}
                className="rounded-2xl border p-4 cursor-pointer"
                style={{ backgroundColor: CARD, borderColor: log.deliveryStatus === "Failed" ? "rgba(248,113,113,0.25)" : BORDER }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold flex-shrink-0"
                      style={{ backgroundColor: "rgba(201,168,76,0.08)", color: GOLD, border: "1px solid rgba(201,168,76,0.15)" }}>
                      {initials(log.recipientLeadName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: TEXT }}>{recipientLabel(log)}</p>
                      <p className="text-xs truncate" style={{ color: MUTED }}>{contactLine(log)}</p>
                    </div>
                  </div>
                  <StatusPill status={log.deliveryStatus} />
                </div>
                <p className="text-xs leading-5 line-clamp-2 mb-3" style={{ color: MUTED }}>{previewBody(log.messageBody)}</p>
                <div className="flex items-center gap-2">
                  <ChannelPill channel={log.channel} />
                  {log.sequence && <span className="max-w-[150px] truncate rounded-full border px-2.5 py-1 text-[11px] font-semibold" style={{ color: GOLD, borderColor: BORDER, backgroundColor: "rgba(201,168,76,.06)" }}>{log.sequence}</span>}
                  <span className="text-[11px]" style={{ color: DIM }}>{timeAgo(log.sentAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <DetailPanel log={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
