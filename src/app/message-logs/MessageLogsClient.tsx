"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  ChevronDown,
  Clock3,
  Copy,
  ExternalLink,
  Mail,
  MessageSquare,
  MoreHorizontal,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import type { DeliveryStatus, MessageChannel, MessageLog } from "@/types/message-log";

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
const GREEN = "#22C55E";
const AMBER = "#F59E0B";
const RED = "#F87171";

type ChannelFilter = MessageChannel | "All";
type StatusFilter = DeliveryStatus | "All";
type DateRangeFilter = "24h" | "7d" | "30d" | "90d" | "all";

const STATUS_CONFIG: Record<DeliveryStatus, { color: string; bg: string; border: string; label: string }> = {
  Sent: { color: GREEN, bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.28)", label: "Sent" },
  Pending: { color: AMBER, bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.28)", label: "Pending" },
  Failed: { color: RED, bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.28)", label: "Failed" },
  Unknown: { color: "#A1A1AA", bg: "rgba(161,161,170,0.10)", border: "rgba(161,161,170,0.22)", label: "Unknown" },
};

function timeAgo(iso: string | null) {
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

function fullDate(iso: string | null) {
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

function initials(name: string | null) {
  return (name ?? "Linked lead").split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
}

function percent(count: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((count / total) * 100)}%`;
}

function truncateId(id: string | null) {
  if (!id) return "-";
  if (id.length <= 16) return id;
  return `${id.slice(0, 8)}...${id.slice(-6)}`;
}

function previewBody(value: string) {
  if (!value) return "No message body captured.";
  return value.length > 132 ? `${value.slice(0, 132)}...` : value;
}

function contactLine(log: MessageLog) {
  return log.recipientLeadEmail || log.recipientLeadPhone || log.recipientLeadId || "No recipient details";
}

function recipientLabel(log: MessageLog) {
  if (log.recipientLeadName) return log.recipientLeadName;
  if (log.recipientLeadId) return "Linked lead";
  return "No linked lead";
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

function StatCard({ label, value, meta, color = GOLD }: { label: string; value: string | number; meta: string; color?: string }) {
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
      <p className="mt-2 truncate text-[30px] font-extrabold leading-none" style={{ color: TEXT }}>
        {value}
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: DeliveryStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.Unknown;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ color: cfg.color, backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
      {cfg.label}
    </span>
  );
}

function ChannelPill({ channel }: { channel: MessageChannel }) {
  const isSms = channel === "SMS";
  const color = isSms ? TEAL : channel === "Email" ? GOLD : "#A1A1AA";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ color, backgroundColor: `${color}16`, border: `1px solid ${color}35` }}>
      {isSms ? <MessageSquare size={12} /> : <Mail size={12} />}
      {channel}
    </span>
  );
}

function MessageTicker({ log }: { log: MessageLog | null }) {
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
              Last message sent
            </p>
            <p className="truncate text-sm font-bold" style={{ color: TEXT }}>
              {log ? `${log.channel} to ${recipientLabel(log)} - ${log.deliveryStatus}` : "No message activity yet"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold" style={{ color: MUTED, backgroundColor: "rgba(0,0,0,0.18)" }}>
          <Clock3 size={13} />
          {log ? timeAgo(log.sentAt ?? log.createdTime) : "No activity"}
        </div>
      </div>
    </div>
  );
}

function MiniAnalytics({
  sent,
  pending,
  failed,
  email,
  sms,
  total,
}: {
  sent: number;
  pending: number;
  failed: number;
  email: number;
  sms: number;
  total: number;
}) {
  const statuses = [
    { label: "Sent", count: sent, color: GREEN },
    { label: "Pending", count: pending, color: AMBER },
    { label: "Failed", count: failed, color: RED },
  ];
  const maxStatus = Math.max(...statuses.map((item) => item.count), 1);
  const emailPct = total ? (email / total) * 100 : 0;
  const smsPct = total ? (sms / total) * 100 : 0;

  return (
    <div className="grid gap-3 xl:grid-cols-[1.35fr_1fr]">
      <div className="rounded-2xl border p-4" style={{ backgroundColor: CARD, borderColor: BORDER }}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.09em]" style={{ color: GOLD }}>
            Delivery status
          </p>
          <p className="text-xs font-semibold" style={{ color: MUTED }}>{total} messages</p>
        </div>
        <div className="grid gap-3">
          {statuses.map((item) => (
            <div key={item.label} className="grid grid-cols-[76px_1fr_38px] items-center gap-3">
              <span className="text-xs font-bold" style={{ color: TEXT }}>{item.label}</span>
              <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.055)" }}>
                <div className="h-full rounded-full" style={{ width: `${Math.max(4, (item.count / maxStatus) * 100)}%`, backgroundColor: item.color }} />
              </div>
              <span className="text-right text-xs font-semibold" style={{ color: MUTED }}>{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border p-4" style={{ backgroundColor: CARD, borderColor: BORDER }}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.09em]" style={{ color: GOLD }}>
            Channel split
          </p>
          <p className="text-xs font-semibold" style={{ color: MUTED }}>Email vs SMS</p>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.055)" }}>
          <div style={{ width: `${smsPct}%`, backgroundColor: TEAL }} />
          <div style={{ width: `${emailPct}%`, backgroundColor: GOLD }} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl px-3 py-2" style={{ backgroundColor: "rgba(45,212,191,0.08)" }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: TEAL }}>SMS</p>
            <p className="mt-1 text-sm font-extrabold" style={{ color: TEXT }}>{percent(sms, total)}</p>
          </div>
          <div className="rounded-xl px-3 py-2" style={{ backgroundColor: "rgba(201,168,76,0.08)" }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: GOLD }}>Email</p>
            <p className="mt-1 text-sm font-extrabold" style={{ color: TEXT }}>{percent(email, total)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="rounded-2xl border p-4" style={{ backgroundColor: CARD, borderColor: BORDER }}>
      <div className="space-y-3">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="grid grid-cols-[1.4fr_0.6fr_2fr_0.7fr_0.7fr] gap-4 rounded-xl border p-3" style={{ borderColor: BORDER_SOFT, backgroundColor: "rgba(255,255,255,0.018)" }}>
            {Array.from({ length: 5 }).map((__, itemIndex) => (
              <div key={itemIndex} className="h-4 animate-pulse rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.07)" }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border px-6 py-16 text-center" style={{ borderColor: BORDER, backgroundColor: CARD }}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: "rgba(201,168,76,0.10)", color: GOLD }}>
        <SlidersHorizontal size={22} />
      </div>
      <p className="text-base font-bold" style={{ color: TEXT }}>{filtered ? "No message logs match these filters" : "No message logs yet"}</p>
      <p className="mt-1 max-w-md text-sm" style={{ color: MUTED }}>
        {filtered ? "Adjust the filters or search term to bring delivery records back into view." : "When Make.com sends the first email or SMS, delivery records will appear here."}
      </p>
      {!filtered && (
        <div className="mt-6 grid w-full max-w-xl gap-2 text-left sm:grid-cols-2">
          {["Webhook received lead", "Airtable lead created", "Mandrill email/SMS sent", "Message Log record created"].map((item) => (
            <div key={item} className="rounded-xl border px-3 py-2 text-xs font-semibold" style={{ color: MUTED, borderColor: BORDER_SOFT, backgroundColor: "rgba(255,255,255,0.025)" }}>
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MessageSlideOver({
  log,
  copiedId,
  onCopy,
  onClose,
}: {
  log: MessageLog | null;
  copiedId: string | null;
  onCopy: (value: string) => void;
  onClose: () => void;
}) {
  if (!log) return null;

  const events = [
    { label: "Created in Message Log", value: fullDate(log.createdTime), icon: Sparkles, tone: GOLD },
    { label: `Sent through Mandrill/Mailchimp`, value: log.mandrillMessageId ? truncateId(log.mandrillMessageId) : "No Mandrill ID captured", icon: Mail, tone: log.channel === "SMS" ? TEAL : GOLD },
    { label: `Delivery status updated`, value: log.deliveryStatus, icon: ShieldCheck, tone: STATUS_CONFIG[log.deliveryStatus].color },
  ];

  return (
    <div className="fixed inset-0 z-[70]">
      <button className="absolute inset-0 bg-black/55" aria-label="Close message detail panel" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[500px] flex-col border-l" style={{ backgroundColor: "#09090D", borderColor: BORDER, boxShadow: "-28px 0 80px rgba(0,0,0,0.42)" }}>
        <div className="flex items-start justify-between gap-4 border-b p-5" style={{ borderColor: BORDER }}>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: GOLD }}>Message details</p>
            <h2 className="mt-1 truncate text-xl font-extrabold" style={{ color: TEXT }}>{recipientLabel(log)}</h2>
            <p className="mt-1 text-xs" style={{ color: MUTED }}>{log.channel} - {timeAgo(log.sentAt ?? log.createdTime)}</p>
          </div>
          <button onClick={onClose} className="rounded-xl border p-2" style={{ borderColor: BORDER, color: MUTED, backgroundColor: CARD }} aria-label="Close message details">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex flex-wrap items-center gap-2">
            <ChannelPill channel={log.channel} />
            <StatusPill status={log.deliveryStatus} />
            {log.recipientLeadStatus && (
              <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ color: MUTED, backgroundColor: "rgba(255,255,255,0.04)" }}>
                Lead: {log.recipientLeadStatus}
              </span>
            )}
          </div>

          {log.deliveryStatus === "Failed" && (
            <div className="mt-5 rounded-2xl border p-4 text-sm" style={{ color: RED, backgroundColor: "rgba(248,113,113,0.08)", borderColor: "rgba(248,113,113,0.25)" }}>
              This message failed. Check Mandrill response, recipient address/phone, sender/domain status, and Make.com run history.
            </div>
          )}

          {log.deliveryStatus === "Pending" && (
            <div className="mt-5 rounded-2xl border p-4 text-sm" style={{ color: AMBER, backgroundColor: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.25)" }}>
              This message is still pending. Confirm whether Make.com updated the delivery status after Mandrill returned a response.
            </div>
          )}

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { label: "Recipient", value: recipientLabel(log), icon: MessageSquare },
              { label: "Contact", value: contactLine(log), icon: Mail },
              { label: "Sent At", value: fullDate(log.sentAt), icon: CalendarDays },
              { label: "Mandrill ID", value: log.mandrillMessageId || "Not captured", icon: Copy },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl border p-3" style={{ backgroundColor: CARD, borderColor: BORDER_SOFT }}>
                <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: DIM }}>
                  <Icon size={11} />
                  {label}
                </p>
                <p className="break-words text-sm font-semibold" style={{ color: value === "Not captured" ? MUTED : TEXT }}>{value}</p>
              </div>
            ))}
          </div>

          {log.mandrillMessageId && (
            <button type="button" onClick={() => onCopy(log.mandrillMessageId ?? "")} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold" style={{ color: GOLD, backgroundColor: "rgba(201,168,76,0.06)", borderColor: BORDER }}>
              <Copy size={15} />
              {copiedId === log.mandrillMessageId ? "Copied" : "Copy Mandrill Message ID"}
            </button>
          )}

          <div className="mt-5 rounded-2xl border p-4" style={{ backgroundColor: CARD, borderColor: BORDER_SOFT }}>
            <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: GOLD }}>
              <MessageSquare size={12} />
              Full message body
            </p>
            <p className="whitespace-pre-wrap text-sm leading-6" style={{ color: log.messageBody ? TEXT : MUTED }}>
              {log.messageBody || "No message body captured."}
            </p>
          </div>

          <div className="mt-5 rounded-2xl border p-4" style={{ backgroundColor: CARD, borderColor: BORDER_SOFT }}>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: GOLD }}>Error reason</p>
            <p className="break-words text-sm" style={{ color: log.errorReason ? RED : MUTED }}>{log.errorReason || "-"}</p>
          </div>

          <div className="mt-5 rounded-2xl border p-4" style={{ backgroundColor: CARD, borderColor: BORDER_SOFT }}>
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: GOLD }}>Automation timeline</p>
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
                    <p className="text-sm font-bold" style={{ color: TEXT }}>{label}</p>
                    <p className="mt-0.5 break-words text-xs" style={{ color: MUTED }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border p-4" style={{ backgroundColor: CARD, borderColor: BORDER_SOFT }}>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: GOLD }}>Record IDs</p>
            <div className="space-y-2">
              <p className="break-all text-xs" style={{ color: MUTED }}>Lead: {log.recipientLeadId || "No linked lead"}</p>
              <p className="break-all text-xs" style={{ color: MUTED }}>Message Log: {log.id}</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default function MessageLogsClient() {
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [dateRange, setDateRange] = useState<DateRangeFilter>("all");
  const [errorOnly, setErrorOnly] = useState(false);
  const [selectedLog, setSelectedLog] = useState<MessageLog | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        channel: channelFilter,
        status: statusFilter,
        dateRange,
        search,
      });
      const response = await fetch(`/api/airtable/message-logs?${params}`, { credentials: "same-origin" });
      const data = await response.json() as { messageLogs?: MessageLog[]; error?: string };
      if (!response.ok || data.error) throw new Error(data.error ?? "Could not load message logs");
      setLogs(data.messageLogs ?? []);
    } catch (event) {
      setError(String(event));
    } finally {
      setLoading(false);
    }
  }, [channelFilter, dateRange, search, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 180);
    return () => window.clearTimeout(timer);
  }, [load]);

  const filtered = useMemo(() => {
    if (!errorOnly) return logs;
    return logs.filter((log) => log.deliveryStatus === "Failed" || Boolean(log.errorReason));
  }, [errorOnly, logs]);

  const stats = useMemo(() => {
    const sent = logs.filter((log) => log.deliveryStatus === "Sent").length;
    const pending = logs.filter((log) => log.deliveryStatus === "Pending").length;
    const failed = logs.filter((log) => log.deliveryStatus === "Failed").length;
    const sms = logs.filter((log) => log.channel === "SMS").length;
    const email = logs.filter((log) => log.channel === "Email").length;
    return { sent, pending, failed, sms, email };
  }, [logs]);

  const latestLog = logs[0] ?? null;

  async function copy(value: string) {
    if (!value) return;
    await navigator.clipboard?.writeText(value);
    setCopiedId(value);
    window.setTimeout(() => setCopiedId((current) => current === value ? null : current), 1600);
  }

  const hasActiveFilters = Boolean(search) || channelFilter !== "All" || statusFilter !== "All" || dateRange !== "all" || errorOnly;

  return (
    <div className="space-y-5">
      <MessageTicker log={latestLog} />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <StatCard label="Total Messages" value={logs.length} meta={`${filtered.length} visible`} color={GOLD} />
        <StatCard label="Sent" value={stats.sent} meta={percent(stats.sent, logs.length)} color={GREEN} />
        <StatCard label="Pending" value={stats.pending} meta="awaiting" color={AMBER} />
        <StatCard label="Failed" value={stats.failed} meta={percent(stats.failed, logs.length)} color={RED} />
        <StatCard label="Channel Split" value={`${percent(stats.sms, logs.length)} / ${percent(stats.email, logs.length)}`} meta="SMS / Email" color={TEAL} />
      </div>

      <MiniAnalytics total={logs.length} sent={stats.sent} pending={stats.pending} failed={stats.failed} email={stats.email} sms={stats.sms} />

      <div className="rounded-2xl border p-3" style={{ background: `linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01)), ${PANEL}`, borderColor: BORDER }}>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search lead, email, phone, message, or Mandrill ID"
              aria-label="Search message logs"
              className="h-11 w-full rounded-xl border pl-10 pr-3 text-sm"
              style={{ backgroundColor: CARD, borderColor: BORDER, color: TEXT }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-5 xl:flex">
            <SelectControl label="Filter by channel" value={channelFilter} onChange={(value) => setChannelFilter(value as ChannelFilter)} options={[{ label: "All channels", value: "All" }, { label: "Email", value: "Email" }, { label: "SMS", value: "SMS" }]} />
            <SelectControl label="Filter by status" value={statusFilter} onChange={(value) => setStatusFilter(value as StatusFilter)} options={[{ label: "All statuses", value: "All" }, { label: "Pending", value: "Pending" }, { label: "Sent", value: "Sent" }, { label: "Failed", value: "Failed" }]} />
            <SelectControl label="Filter by date range" value={dateRange} onChange={(value) => setDateRange(value as DateRangeFilter)} options={[{ label: "Last 24 hours", value: "24h" }, { label: "Last 7 days", value: "7d" }, { label: "Last 30 days", value: "30d" }, { label: "Last 90 days", value: "90d" }, { label: "All dates", value: "all" }]} />
            <button
              type="button"
              onClick={() => setErrorOnly((value) => !value)}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-bold"
              style={{ color: errorOnly ? RED : MUTED, backgroundColor: errorOnly ? "rgba(248,113,113,0.08)" : CARD, borderColor: errorOnly ? "rgba(248,113,113,0.25)" : BORDER }}
            >
              <AlertCircle size={14} />
              Errors
            </button>
            <button
              type="button"
              onClick={() => void load()}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-bold"
              style={{ color: GOLD, backgroundColor: "rgba(201,168,76,0.06)", borderColor: BORDER }}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <div className="flex items-start gap-3 rounded-2xl border p-5" style={{ borderColor: "rgba(248,113,113,0.25)", backgroundColor: "rgba(248,113,113,0.08)" }}>
          <AlertCircle size={18} style={{ color: RED }} />
          <div>
            <p className="text-sm font-bold" style={{ color: RED }}>Could not load message logs.</p>
            <p className="mt-1 text-xs" style={{ color: MUTED }}>Check Airtable base access, table name &quot;Message Log&quot;, and field names.</p>
            <p className="mt-2 text-xs" style={{ color: MUTED }}>{error}</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState filtered={hasActiveFilters} />
      ) : (
        <>
          <div className="hidden overflow-visible rounded-2xl border md:block" style={{ borderColor: BORDER, backgroundColor: CARD }}>
            <div className="max-h-[68vh] overflow-auto">
              <table className="w-full min-w-[1180px] border-separate border-spacing-0">
                <thead className="sticky top-0 z-10">
                  <tr style={{ backgroundColor: "#0B0B10" }}>
                    {[
                      { key: "recipient", label: "Recipient" },
                      { key: "channel", label: "Channel" },
                      { key: "message", label: "Message Preview" },
                      { key: "status", label: "Status" },
                      { key: "sent-at", label: "Sent At" },
                      { key: "mandrill", label: "Mandrill ID" },
                      { key: "error", label: "Error" },
                      { key: "actions", label: "" },
                    ].map((heading) => (
                      <th key={heading.key} className="border-b px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.09em]" style={{ color: DIM, borderColor: BORDER_SOFT }}>
                        {heading.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log) => (
                    <tr
                      key={log.id}
                      className="group cursor-pointer transition-colors"
                      style={{ backgroundColor: BG }}
                      onClick={() => setSelectedLog(log)}
                      onMouseEnter={(event) => { event.currentTarget.style.backgroundColor = CARD_HOVER; }}
                      onMouseLeave={(event) => { event.currentTarget.style.backgroundColor = BG; }}
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") setSelectedLog(log);
                      }}
                    >
                      <td className="border-b px-4 py-3" style={{ borderColor: BORDER_SOFT }}>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-extrabold" style={{ color: GOLD, backgroundColor: "rgba(201,168,76,0.09)", borderColor: "rgba(201,168,76,0.18)" }}>
                            {initials(log.recipientLeadName)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold" style={{ color: TEXT }}>{recipientLabel(log)}</p>
                            <p className="truncate text-[11px]" style={{ color: DIM }}>{contactLine(log)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="border-b px-4 py-3" style={{ borderColor: BORDER_SOFT }}><ChannelPill channel={log.channel} /></td>
                      <td className="border-b px-4 py-3 text-sm" style={{ borderColor: BORDER_SOFT, color: MUTED }}>
                        <p className="line-clamp-2 leading-5">{previewBody(log.messageBody)}</p>
                      </td>
                      <td className="border-b px-4 py-3" style={{ borderColor: BORDER_SOFT }}><StatusPill status={log.deliveryStatus} /></td>
                      <td className="border-b px-4 py-3 text-xs" title={fullDate(log.sentAt)} style={{ borderColor: BORDER_SOFT, color: MUTED }}>{timeAgo(log.sentAt)}</td>
                      <td className="border-b px-4 py-3 text-xs font-semibold" style={{ borderColor: BORDER_SOFT, color: log.mandrillMessageId ? TEXT : MUTED }} onClick={(event) => event.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <span>{truncateId(log.mandrillMessageId)}</span>
                          {log.mandrillMessageId && (
                            <button type="button" onClick={() => void copy(log.mandrillMessageId ?? "")} className="rounded-lg border p-1.5 opacity-0 transition group-hover:opacity-100" style={{ borderColor: BORDER_SOFT, color: copiedId === log.mandrillMessageId ? TEAL : MUTED, backgroundColor: "rgba(255,255,255,0.025)" }} aria-label="Copy Mandrill Message ID">
                              <Copy size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="border-b px-4 py-3 text-xs" style={{ borderColor: BORDER_SOFT, color: log.errorReason ? RED : MUTED }}>{log.errorReason ? previewBody(log.errorReason) : "-"}</td>
                      <td className="relative border-b px-4 py-3 text-right" style={{ borderColor: BORDER_SOFT }} onClick={(event) => event.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {log.recipientLeadId && (
                            <a href={`/leads?leadId=${encodeURIComponent(log.recipientLeadId)}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border transition hover:brightness-125" style={{ borderColor: BORDER_SOFT, color: MUTED, backgroundColor: "rgba(255,255,255,0.025)" }} aria-label="Open linked lead" title="Open linked lead">
                              <ExternalLink size={14} />
                            </a>
                          )}
                          <button className="rounded-lg border p-1.5" style={{ borderColor: BORDER_SOFT, color: MUTED, backgroundColor: "rgba(255,255,255,0.025)" }} aria-label="Open message actions" onClick={() => setOpenMenuId(openMenuId === log.id ? null : log.id)}>
                            <MoreHorizontal size={15} />
                          </button>
                        </div>
                        {openMenuId === log.id && (
                          <div className="absolute right-3 top-10 z-20 w-48 rounded-xl border p-1 text-left" style={{ backgroundColor: "#08080C", borderColor: BORDER, boxShadow: "0 18px 50px rgba(0,0,0,0.35)" }}>
                            <button onClick={() => { setSelectedLog(log); setOpenMenuId(null); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold" style={{ color: TEXT }}><MessageSquare size={13} /> View details</button>
                            {log.mandrillMessageId && <button onClick={() => void copy(log.mandrillMessageId ?? "")} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold" style={{ color: TEXT }}><Copy size={13} /> Copy Mandrill ID</button>}
                            {log.recipientLeadId && <a href={`/leads?leadId=${encodeURIComponent(log.recipientLeadId)}`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold" style={{ color: TEXT }}><ExternalLink size={13} /> Open linked lead</a>}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-3 md:hidden">
            {filtered.map((log) => (
              <div key={log.id} onClick={() => setSelectedLog(log)} className="rounded-2xl border p-4 text-left" style={{ backgroundColor: CARD, borderColor: log.deliveryStatus === "Failed" ? "rgba(248,113,113,0.28)" : BORDER }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border text-xs font-extrabold" style={{ color: GOLD, backgroundColor: "rgba(201,168,76,0.09)", borderColor: "rgba(201,168,76,0.18)" }}>
                      {initials(log.recipientLeadName)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold" style={{ color: TEXT }}>{recipientLabel(log)}</p>
                      <p className="mt-1 truncate text-xs" style={{ color: MUTED }}>{contactLine(log)}</p>
                    </div>
                  </div>
                  <StatusPill status={log.deliveryStatus} />
                </div>
                <p className="mt-4 line-clamp-3 text-sm leading-5" style={{ color: MUTED }}>{previewBody(log.messageBody)}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <ChannelPill channel={log.channel} />
                  <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ color: MUTED, backgroundColor: "rgba(255,255,255,0.04)" }}>{timeAgo(log.sentAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <MessageSlideOver log={selectedLog} copiedId={copiedId} onCopy={(value) => void copy(value)} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
