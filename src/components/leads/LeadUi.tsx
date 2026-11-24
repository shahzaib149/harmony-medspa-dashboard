"use client";

// Shared lead UI: status/delivery pills, classification, Hayden notification and the lead
// details modal. Used by the Leads page and the campaign workspaces.


import { Skeleton } from "@/components/ui/Skeleton";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  Mail,
  Loader2,
  MessageSquare,
  Phone,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  X
} from "lucide-react";
import type { Lead } from "@/app/api/airtable/leads/route";
import { LeadCampaignBadges } from "@/components/campaigns/CampaignBadges";
import { formatCampaignDate } from "@/lib/campaigns/campaign-date";
import { automaticHaydenAlert, type ManualHaydenNotification } from "@/lib/leads/hayden-alert";
import { LEAD_CAMPAIGNS, adCampaignLabel, adGroupLabel, campaignByCode } from "@/lib/google/campaign-registry";
import {
  type LeadView
} from "@/lib/leads/view";
import type {
  AdCampaignBreakdown,
  LeadSummaryMetrics,
  LeadViewCounts
} from "@/lib/leads/summary";
import { GiftCardRequestCard } from "@/components/leads/GiftCardParts";
import {
  BLACK_FRIDAY_OFFER_CODE,
  isGiftCardLead,
  countsAsRealLead,
  isLeadType,
  NOT_A_LEAD_TYPES,
  sendsAutoReply,
  type LeadType
} from "@/lib/leads/classification";


export const GOLD = "var(--brand-primary)";
export const BG = "var(--background)";
export const PANEL = "var(--background-subtle)";
export const CARD = "var(--surface-1)";
export const CARD_HOVER = "var(--surface-hover)";
export const TEXT = "var(--text-primary)";
export const MUTED = "var(--text-muted)";
export const DIM = "var(--text-muted)";
export const BORDER = "var(--border-subtle)";
export const BORDER_SOFT = "var(--border-subtle)";
export const TEAL = "var(--healthy)";

export const STATUS_CONFIG: Record<
  string,
  { color: string; bg: string; border: string; label: string }
> = {
  New: {
    color: "var(--info-text)",
    bg: "var(--info-bg)",
    border: "var(--info-border)",
    label: "New"
  },
  Contacted: {
    color: "var(--warning-text)",
    bg: "var(--warning-bg)",
    border: "var(--warning-border)",
    label: "Contacted"
  },
  Booked: {
    color: "var(--success-text)",
    bg: "var(--success-bg)",
    border: "var(--success-border)",
    label: "Booked"
  },
  Duplicate: {
    color: "var(--neutral-text)",
    bg: "var(--neutral-bg)",
    border: "var(--neutral-border)",
    label: "Duplicate"
  },
  Failed: {
    color: "var(--danger-text)",
    bg: "var(--danger-bg)",
    border: "var(--danger-border)",
    label: "Failed"
  },
  "Not Interested": {
    color: "var(--danger-text)",
    bg: "var(--danger-bg)",
    border: "var(--danger-border)",
    label: "Not Interested"
  },
  "Not a Lead": {
    color: "var(--neutral-text)",
    bg: "var(--neutral-bg)",
    border: "var(--neutral-border)",
    label: "Not a Lead"
  }
};

export const STATUS_OPTIONS = [
  "New",
  "Contacted",
  "Booked",
  "Duplicate",
  "Failed",
  "Not Interested",
  "Not a Lead",
];

// Filter-only: "Replied" matches the Replied checkbox, so it is never offered as a status to set.
export const STATUS_FILTER_OPTIONS = ["New", "Contacted", "Replied", ...STATUS_OPTIONS.slice(2)];

export type Tone = { color: string; bg: string; border: string };
export const TONES: Record<"success" | "warning" | "info" | "neutral" | "danger", Tone> = {
  success: { color: "var(--success-text)", bg: "var(--success-bg)", border: "var(--success-border)" },
  warning: { color: "var(--warning-text)", bg: "var(--warning-bg)", border: "var(--warning-border)" },
  info: { color: "var(--info-text)", bg: "var(--info-bg)", border: "var(--info-border)" },
  neutral: { color: "var(--neutral-text)", bg: "var(--neutral-bg)", border: "var(--neutral-border)" },
  danger: { color: "var(--danger-text)", bg: "var(--danger-bg)", border: "var(--danger-border)" }
};

export const LEAD_TYPE_TONE: Record<LeadType, Tone> = {
  "Real Lead": TONES.success,
  Unclear: TONES.warning,
  "Existing Patient": TONES.info,
  "Appointment Change": TONES.info,
  Solicitor: TONES.neutral,
  "Job Seeker": TONES.neutral,
  Spam: TONES.danger,
  "Gift Card Lead": { color: "var(--brand-primary-strong)", bg: "var(--brand-primary-soft)", border: "var(--brand-primary)" }
};

export function leadTypeTone(leadType: string): Tone {
  return isLeadType(leadType) ? LEAD_TYPE_TONE[leadType] : TONES.neutral;
}

export const METHOD_LABEL: Record<string, string> = {
  Rule: "Paid-ad rule",
  AI: "AI",
  Fallback: "AI fallback",
  Manual: "Staff"
};

export const LEAD_DATE_PRESETS = ["today", "7", "30", "this-month", "last-month", "month", "custom"] as const;
export type SentFilter = "all" | "sent" | "not_sent";

export const VIEW_OPTIONS: Array<{ value: LeadView; label: string; empty: string; hint: string }> = [
  { value: "all", label: "All", empty: "No Leads found", hint: "Every submission, including solicitors, spam and other non-leads." },
  { value: "leads", label: "Real Leads", empty: "No real Leads yet", hint: "Prospective patients only. Filter by Lead type → Not a lead to review everything else." },
  { value: "booked", label: "Booked", empty: "No booked Leads yet", hint: "" },
  { value: "gift-cards", label: "Gift Cards", empty: "No gift card requests yet", hint: "Requests from the website Gift Cards page. Contact the purchaser only, never the recipient. Not counted as leads." },
];

// "Call Leads" is a client-only tab. The leads APIs keep their three views; this
// tab shows the Calls table instead. Call alert emails still link to
// ?source=Call+Leads&call=<id>, which lands here.
export const CALLS_VIEW = "calls";
export const CALLS_TAB = {
  label: "Call Leads",
  hint: "Inbound Google Ads calls. Use Add details to log the caller; the call then shows in All and Real Leads like any other lead."
};

export function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

export function isSent(value: string) {
  const v = normalize(value);
  return v === "sent" || v === "delivered" || v === "opened" || v === "success";
}

export function timeAgo(iso: string) {
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
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function fullDate(iso: string) {
  if (!iso) return "No timestamp";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?"
  );
}

export function sourceLabel(source: string) {
  return source || "Unknown";
}

export function lastContacted(lead: Lead) {
  if (lead.lastContactedAt) return lead.lastContactedAt;
  if (isSent(lead.smsSentStatus) || isSent(lead.emailSentStatus))
    return lead.createdAt;
  if (lead.status === "Contacted" || lead.status === "Booked")
    return lead.createdAt;
  return "";
}

export function lastActivity(lead: Lead) {
  const timestamps = [lead.createdAt, lead.lastContactedAt]
    .map((value) => new Date(value).getTime())
    .filter(Number.isFinite);
  return timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : "";
}

export function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.New;
  return (
    <span
      role="status"
      aria-label={`Lead status: ${cfg.label}`}
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
      style={{
        color: cfg.color,
        backgroundColor: cfg.bg,
        border: `1px solid ${cfg.border}`
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: cfg.color }}
      />
      {cfg.label}
    </span>
  );
}

export function DeliveryPill({ label, value }: { label: string; value: string }) {
  const sent = isSent(value);
  const color = sent
    ? "var(--success-text)"
    : value
      ? "var(--warning-text)"
      : DIM;
  return (
    <span
      aria-label={`${label}: ${value || "not sent"}`}
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{
        color,
        backgroundColor: sent
          ? "var(--success-bg)"
          : value
            ? "var(--warning-bg)"
            : "var(--surface-2)"
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label} {value || "-"}
    </span>
  );
}

export function NotifyHaydenButton({
  lead,
  notifying,
  notified,
  onNotify,
  compact = false
}: {
  lead: Lead;
  notifying: boolean;
  notified: boolean;
  onNotify: (lead: Lead) => void;
  compact?: boolean;
}) {
  const label = notifying
    ? "Sending…"
    : notified
      ? "Hayden notified"
      : "Notify Hayden";
  return (
    <button
      type="button"
      disabled={notifying}
      onClick={(event) => {
        event.stopPropagation();
        onNotify(lead);
      }}
      className={compact
        ? "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition hover:brightness-125 disabled:cursor-wait disabled:opacity-70"
        : "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-bold transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70"}
      style={{
        color: notified ? "var(--success-text)" : TEAL,
        backgroundColor: notified ? "var(--success-bg)" : "color-mix(in srgb, var(--healthy) 10%, transparent)",
        borderColor: notified ? "var(--success-border)" : "color-mix(in srgb, var(--healthy) 35%, transparent)"
      }}
      aria-label={`${label} for ${lead.name || "lead"}`}
      title={label}
    >
      {notifying ? <Loader2 size={compact ? 15 : 14} className="animate-spin" /> : notified ? <Check size={compact ? 15 : 14} /> : <Bell size={compact ? 15 : 14} />}
      {!compact && label}
    </button>
  );
}

export function LeadTypeBadge({ leadType }: { leadType: string }) {
  if (!leadType) return null;
  const tone = leadTypeTone(leadType);
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold leading-4"
      style={{ color: tone.color, backgroundColor: tone.bg, borderColor: tone.border }}
      aria-label={`Lead type: ${leadType}`}
    >
      {leadType}
    </span>
  );
}

export function TagChip({ tag }: { tag: string }) {
  const review = tag === "Needs Review";
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-4"
      style={{
        color: review ? "var(--warning-text)" : MUTED,
        backgroundColor: review ? "var(--warning-bg)" : "var(--surface-2)"
      }}
    >
      {tag}
    </span>
  );
}

/** Lead type + first two tags + overflow count, sized for a table row. */
export function LeadClassificationChips({ lead, max = 2 }: { lead: Lead; max?: number }) {
  if (!lead.leadType && lead.aiTags.length === 0) return null;
  // Show Needs Review first: it is the tag that asks staff to act.
  const tags = [...lead.aiTags].sort((a, b) => Number(b === "Needs Review") - Number(a === "Needs Review"));
  const shown = tags.filter((tag) => tag !== lead.leadType).slice(0, max);
  const hidden = tags.filter((tag) => tag !== lead.leadType).length - shown.length;
  return (
    <span className="mt-1 flex min-w-0 flex-wrap items-center gap-1">
      <LeadTypeBadge leadType={lead.leadType} />
      {shown.map((tag) => <TagChip key={tag} tag={tag} />)}
      {hidden > 0 && (
        <span className="text-[10px] font-semibold" style={{ color: DIM }} title={tags.slice(max).join(", ")}>
          +{hidden}
        </span>
      )}
    </span>
  );
}

export function ConfidenceMeter({ value }: { value: number | null }) {
  const filled = value === null ? 0 : Math.round(value * 10);
  return (
    <div className="flex items-center gap-2" aria-label={value === null ? "Confidence not recorded" : `Confidence ${Math.round(value * 100)}%`}>
      <div className="flex gap-[3px]" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, index) => (
          <span
            key={index}
            className="h-3 w-1.5 rounded-[2px]"
            style={{ backgroundColor: index < filled ? GOLD : "var(--surface-2)" }}
          />
        ))}
      </div>
      <span className="text-[11px] font-bold tabular-nums" style={{ color: MUTED }}>
        {value === null ? "—" : `${Math.round(value * 100)}%`}
      </span>
    </div>
  );
}

export function ClassificationCard({
  lead,
  canUpdate,
  saving,
  onReclassify
}: {
  lead: Lead;
  canUpdate: boolean;
  saving: boolean;
  onReclassify: (leadType: LeadType) => void;
}) {
  const [notLeadType, setNotLeadType] = useState<LeadType>("Solicitor");
  const real = countsAsRealLead(lead);
  const classified = Boolean(lead.leadType);
  const tone = classified ? leadTypeTone(lead.leadType) : TONES.neutral;
  const method = METHOD_LABEL[lead.classificationMethod] ?? lead.classificationMethod;
  const verdict = classified ? lead.leadType : "Not classified";
  const outcome = !classified
    ? "Received before AI classification. Counted as a real lead."
    : real
      ? lead.leadType === "Unclear"
        ? "Treated as a lead: instant reply sent, Hayden notified, enrolled in nurture. Confirm below."
        : "Instant reply sent, Hayden notified, enrolled in 14-Day Nurture."
      : !sendsAutoReply(lead.leadType)
        ? "No reply sent, no alert, no nurture. Only the record was kept."
        : lead.leadType === "Existing Patient"
          ? "Instant reply sent and Hayden notified. Not enrolled in nurture."
          : "Instant reply sent. No Hayden alert, no nurture.";

  return (
    <section
      aria-labelledby={`classification-${lead.id}`}
      className="relative mt-5 overflow-hidden rounded-2xl border"
      style={{ backgroundColor: CARD, borderColor: tone.border }}
    >
      <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: tone.color }} aria-hidden="true" />
      <div className="p-4 pl-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p id={`classification-${lead.id}`} className="text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: GOLD }}>
            Lead classification
          </p>
          {lead.classificationMethod && (
            <span
              className="rounded-md border border-dashed px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
              style={{ color: MUTED, borderColor: "var(--border-strong)" }}
              title={lead.classificationMethod === "Rule" ? "Paid-ad click detected (GCLID / Google CPC). AI was skipped." : undefined}
            >
              {method}
            </span>
          )}
        </div>

        <p className="mt-2 text-[26px] font-extrabold leading-tight tracking-[-0.02em]" style={{ color: classified ? tone.color : MUTED }}>
          {verdict}
        </p>
        <p className="mt-1 text-xs leading-5" style={{ color: MUTED }}>{outcome}</p>

        {lead.aiReason && (
          <blockquote className="mt-3 border-l-2 pl-3 text-sm italic leading-6" style={{ borderColor: "var(--border-strong)", color: TEXT }}>
            {lead.aiReason}
          </blockquote>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
          {classified && lead.classificationMethod !== "Manual" && (
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: DIM }}>Confidence</p>
              <ConfidenceMeter value={lead.aiConfidence} />
            </div>
          )}
          {lead.aiTags.length > 0 && (
            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: DIM }}>Tags</p>
              <div className="flex flex-wrap gap-1">{lead.aiTags.map((tag) => <TagChip key={tag} tag={tag} />)}</div>
            </div>
          )}
        </div>

        {(lead.classifiedAt || lead.classificationOverriddenBy) && (
          <p className="mt-3 text-[11px]" style={{ color: DIM }}>
            {lead.classificationOverriddenBy
              ? `Changed by ${lead.classificationOverriddenBy}`
              : `Classified by ${method || "automation"}`}
            {lead.classifiedAt ? ` · ${fullDate(lead.classifiedAt)}` : ""}
          </p>
        )}
      </div>

      {canUpdate && (
        <div className="flex flex-col gap-2 border-t p-4 pl-5 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: BORDER_SOFT, backgroundColor: "var(--surface-2)" }}>
          {real ? (
            <>
              <p className="text-xs" style={{ color: MUTED }}>
                Not a patient? Marking this stops any active nurture messages.
              </p>
              <div className="flex gap-2">
                <label className="relative">
                  <span className="sr-only">Reason this is not a lead</span>
                  <select
                    value={notLeadType}
                    onChange={(event) => setNotLeadType(event.target.value as LeadType)}
                    disabled={saving}
                    className="h-10 appearance-none rounded-xl border pl-3 pr-8 text-xs font-semibold"
                    style={{ backgroundColor: CARD, borderColor: BORDER, color: TEXT }}
                  >
                    {NOT_A_LEAD_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
                </label>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => onReclassify(notLeadType)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 text-xs font-bold disabled:cursor-wait disabled:opacity-60"
                  style={{ color: TEXT, borderColor: BORDER, backgroundColor: CARD }}
                >
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  Mark as not a lead
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs" style={{ color: MUTED }}>
                This is a prospective patient? Mark it and enroll them in nurture.
              </p>
              <button
                type="button"
                disabled={saving}
                onClick={() => onReclassify("Real Lead")}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-extrabold disabled:cursor-wait disabled:opacity-60"
                style={{ color: "var(--primary-foreground)", backgroundColor: GOLD }}
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <UserCheck size={14} />}
                Mark as real lead
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}

export function CopyValue({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1 text-xs"
      style={{ color: MUTED, backgroundColor: "rgba(255,255,255,0.04)" }}
      aria-label={`Copy ${label}`}
      title={value}
    >
      <strong>{label}:</strong>
      <span className="truncate font-mono">{value.length > 14 ? `${value.slice(0, 6)}…${value.slice(-6)}` : value}</span>
      {copied ? <Check size={12} style={{ color: TEAL }} /> : <Copy size={12} />}
    </button>
  );
}

export function SelectControl({
  label,
  value,
  onChange,
  options,
  className = "min-w-[138px] flex-1 sm:flex-none"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  className?: string;
}) {
  return (
    <label className={`relative ${className}`}>
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
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
        style={{ color: MUTED }}
      />
    </label>
  );
}

export function StatCard({
  label,
  value,
  meta,
  color = GOLD,
  active = false,
  onClick
}: {
  label: string;
  value: number | string;
  meta: string;
  color?: string;
  active?: boolean;
  /** Makes the card a shortcut to the matching status filter. */
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      {...(onClick ? { type: "button" as const, onClick, "aria-pressed": active, title: active ? `Clear the ${label} filter` : `Show ${label.toLowerCase()} leads` } : {})}
      className={"min-w-0 rounded-2xl border px-4 py-3 text-left" + (onClick ? " transition hover:border-[var(--brand-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" : "")}
      style={{
        backgroundColor: active ? "var(--brand-primary-soft)" : CARD,
        borderColor: active ? "var(--brand-primary)" : BORDER
      }}
    >
      <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <p
          className="truncate text-[10px] font-bold uppercase tracking-[0.08em]"
          style={{ color: DIM }}
        >
          {label}
        </p>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ color, backgroundColor: "var(--surface-2)" }}
        >
          {meta}
        </span>
      </div>
      <p
        className="mt-2 w-full truncate text-[24px] font-extrabold leading-none sm:text-[30px]"
        style={{ color: TEXT }}
        title={String(value)}
      >
        {value}
      </p>
    </Tag>
  );
}

export function SummarySkeleton() {
  return (
    <div
      className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 2xl:grid-cols-6"
      aria-label="Loading Lead summary"
      role="status"
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-[92px] animate-pulse rounded-2xl border bg-[var(--surface-1)] sm:h-[100px]"
          style={{ borderColor: BORDER }}
        />
      ))}
      <span className="sr-only">Loading real Lead summary metrics.</span>
    </div>
  );
}

export type SummaryCardData = {
  label: string;
  value: number | string;
  meta: string;
  color: string;
  /** Status filter the card opens when clicked. */
  status?: string;
};

export function summaryCardsFor(
  view: LeadView,
  summary: LeadSummaryMetrics | null,
): SummaryCardData[] {
  const palette = [
    "var(--brand-primary)",
    "var(--info)",
    "var(--warning)",
    "var(--chart-replied)",
    "var(--success)",
    "var(--neutral-text)",
  ];
  const labels: Record<LeadView, string[]> = {
    all: ["All Submissions", "Leads", "Contacted", "Replied", "Booked", "Not a Lead"],
    leads: ["Real Leads", "New Today", "Contacted", "Replied", "Booked", "Not a Lead"],
    booked: ["Total Booked", "Received Today", "Replied + Booked", "Not Replied", "Top Source", "Duplicates"],
    "gift-cards": ["Requests This Month", "Requested This Month", "Open Requests"]
  };

  if (!summary) {
    return labels[view].map((label, index) => ({
      label,
      value: "—",
      meta: "Not available",
      color: palette[index]
    }));
  }

  if (view === "gift-cards") {
    const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
    return [
      { label: "Requests This Month", value: summary.giftCards.thisMonth, meta: `${summary.giftCards.total} matching filters`, color: "var(--brand-primary)" },
      { label: "Requested This Month", value: money.format(summary.giftCards.requestedThisMonth), meta: "total gift card amount", color: "var(--success)" },
      { label: "Open Requests", value: summary.giftCards.open, meta: "not Completed or Cancelled", color: "var(--warning)" },
    ];
  }

  if (view === "booked") {
    return [
      { label: "Total Booked", value: summary.total, meta: "matching filters", color: "var(--brand-primary)" },
      { label: "Received Today", value: summary.newToday, meta: "Lead Created At today", color: "var(--info)" },
      { label: "Replied + Booked", value: summary.replied, meta: "booked, replied", color: "var(--chart-replied)" },
      { label: "Not Replied", value: summary.notReplied, meta: "booked, not replied", color: "var(--warning)" },
      { label: "Top Source", value: summary.topSource ?? "—", meta: summary.topSource ? `${summary.topSourceCount} booked Leads` : "No source data", color: "var(--success)" },
      { label: "Duplicates", value: summary.duplicates, meta: "matching records", color: "var(--neutral-text)" },
    ];
  }

  const [first] = labels[view];
  return [
    { label: first, value: summary.total, meta: "matching filters", color: "var(--brand-primary)" },
    view === "all"
      ? { label: "Leads", value: summary.realLeads, meta: "real leads", color: "var(--info)" }
      : { label: "New Today", value: summary.newToday, meta: "received today", color: "var(--info)" },
    { label: "Contacted", value: summary.contacted, meta: "status: Contacted", color: "var(--warning)", status: "Contacted" },
    { label: "Replied", value: summary.replied, meta: "marked replied", color: "var(--chart-replied)", status: "Replied" },
    { label: "Booked", value: summary.booked, meta: "shown in Booked", color: "var(--success)", status: "Booked" },
    { label: "Not a Lead", value: summary.notALead, meta: "not counted", color: "var(--neutral-text)" },
  ];
}

/** Leads in the current filters grouped by Google Ads campaign and ad group. Click a campaign to filter. */
export function AdCampaignBreakdownPanel({
  groups,
  active,
  onSelect
}: {
  groups: AdCampaignBreakdown[];
  active: string;
  onSelect: (code: string) => void;
}) {
  return (
    <section aria-label="Leads by ad campaign" className="mt-3 rounded-2xl border p-3" style={{ borderColor: BORDER, backgroundColor: CARD }}>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: GOLD }}>
        Leads by ad campaign
      </p>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {groups.map((group) => (
          <button
            key={group.code}
            type="button"
            onClick={() => onSelect(group.code)}
            aria-pressed={active === group.code}
            className="min-h-11 rounded-xl border px-3 py-2 text-left"
            style={{
              borderColor: active === group.code ? TEAL : BORDER_SOFT,
              backgroundColor: active === group.code ? "var(--brand-primary-soft)" : PANEL
            }}
          >
            <span className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-bold" style={{ color: TEXT }}>{group.label}</span>
              <span className="text-sm font-bold tabular-nums" style={{ color: TEXT }}>{group.total}</span>
            </span>
            <span className="mt-0.5 block text-[11px]" style={{ color: MUTED }}>
              {group.booked} booked · {group.adGroups.map((adGroup) => `${adGroup.label} ${adGroup.total}`).join(" · ")}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export type LatestLead = Pick<Lead, "id" | "name" | "source" | "status" | "createdAt">;

export type LeadSummaryApiResponse = {
  summary?: LeadSummaryMetrics | null;
  viewCounts?: LeadViewCounts | null;
  latestLead?: LatestLead | null;
  sources?: string[];
  configured?: boolean;
  error?: string;
};

export function LeadTicker({
  lead,
  loading,
  error
}: {
  lead: LatestLead | null;
  loading: boolean;
  error: boolean;
}) {
  return (
    <div
      className="relative overflow-visible rounded-2xl border px-4 py-3"
      style={{
        background: `linear-gradient(135deg, var(--brand-primary-soft), transparent 60%), ${PANEL}`,
        borderColor: "var(--border-subtle)"
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative flex h-3 w-3 flex-shrink-0">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-40"
              style={{ backgroundColor: TEAL }}
            />
            <span
              className="relative inline-flex h-3 w-3 rounded-full"
              style={{ backgroundColor: TEAL }}
            />
          </span>
          <div className="min-w-0">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.1em]"
              style={{ color: GOLD }}
            >
              Latest in Leads
            </p>
            <p className="truncate text-sm font-bold" style={{ color: TEXT }}>
              {lead ? (
                `${lead.name || "Unnamed lead"} - ${sourceLabel(lead.source)}`
              ) : loading ? (
                <span
                  className="inline-block h-4 w-40 animate-pulse rounded bg-[var(--surface-2)]"
                  aria-label="Loading latest Lead"
                />
              ) : error ? (
                "Latest Lead unavailable"
              ) : (
                "No Leads yet"
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {lead && <StatusPill status={lead.status} />}
          <div
            className="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ color: MUTED, backgroundColor: "var(--surface-1)" }}
          >
            <Clock3 size={13} />
            {lead
              ? timeAgo(lead.createdAt)
              : loading ? <Skeleton className="h-3 w-14 rounded-full" />
                : error
                  ? "Not available"
                  : "No activity"}
          </div>
        </div>
      </div>
    </div>
  );
}

export const AD_CAMPAIGN_OPTIONS = [
  { label: "All ad campaigns", value: "all" },
  { label: "Any Google Ads campaign", value: "google-ads" },
  // Value is the campaign code, so CS2 covers both cs2_main and cs2_weight_loss.
  ...LEAD_CAMPAIGNS.map((campaign) => ({ label: campaign.lifecycle === "paused" ? `${campaign.label} (paused)` : campaign.label, value: campaign.code })),
];

/** Chip / breakdown label for an adCampaign filter value (campaign code or raw utm code). */
export function adCampaignFilterLabel(value: string) {
  return campaignByCode(value)?.label ?? adCampaignLabel(value);
}

/** "CS3 Hormone Optimization (cs3_hormone)"; just the value when no readable name exists. */
export function withCode(label: string, code: string) {
  return label && label !== code ? `${label} (${code})` : code;
}

export function attributionItems(lead: Lead) {
  return ([
    ["Keyword", lead.utmTerm],
    ["Match type", lead.matchType],
    ["Ad", lead.utmContent],
    ["Campaign", lead.utmCampaign ? withCode(adCampaignLabel(lead.utmCampaign), lead.utmCampaign) : ""],
    ["Ad group", lead.utmAdGroup ? withCode(adGroupLabel(lead.utmAdGroup), lead.utmAdGroup) : ""],
    ["Source", lead.utmSource],
    ["Medium", lead.utmMedium],
    ["Device", lead.device],
    ["Network", lead.network],
    ["Best time", lead.bestTime],
    ["Landing", lead.landingUrl],
    ["Page", lead.pageUrl],
  ] as Array<[string, string]>).filter(([, value]) => Boolean(value));
}

/**
 * Campaign Activity entry for the last Speed-to-Lead step: the automatic email to Hayden and
 * management (derived from the classification Make saves just before sending it), plus any
 * "Notify Hayden" sends from the dashboard (audit log).
 */
export function HaydenNotificationActivity({
  lead,
  notifiedThisSession,
  getAuthHeaders
}: {
  lead: Lead;
  notifiedThisSession: boolean;
  getAuthHeaders: () => Promise<HeadersInit>;
}) {
  const automatic = automaticHaydenAlert(lead);
  const [manual, setManual] = useState<ManualHaydenNotification[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`/api/airtable/leads/${lead.id}/notify-hayden`, { headers: await getAuthHeaders(), cache: "no-store" });
        const data = (await response.json().catch(() => ({}))) as { notifications?: ManualHaydenNotification[] };
        if (!cancelled) setManual(Array.isArray(data.notifications) ? data.notifications : []);
      } catch {
        if (!cancelled) setManual([]);
      }
    })();
    return () => { cancelled = true; };
    // getAuthHeaders is recreated on every parent render; refetch only for a new lead or a new send.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id, notifiedThisSession]);

  const sends = manual ?? [];
  if (!automatic && !sends.length && !notifiedThisSession) return null;
  return (
    <div className="mt-3 rounded-xl p-3 text-xs" style={{ backgroundColor: "rgba(255,255,255,.025)", color: MUTED }} data-testid="hayden-activity">
      <div className="flex items-center justify-between gap-3">
        <b className="inline-flex items-center gap-1.5" style={{ color: TEXT }}><Bell size={13} aria-hidden="true" /> Hayden notified</b>
        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: "var(--success)", backgroundColor: "var(--success-bg, rgba(34,197,94,.12))" }}>Notified</span>
      </div>
      {automatic && (
        <p className="mt-2">
          Automatic · Speed-to-Lead emailed Hayden and management when this lead was classified as {automatic.leadType} · {formatCampaignDate(automatic.at)}
        </p>
      )}
      {sends.map((send) => (
        <p key={send.at} className="mt-1">Sent from the dashboard by {send.by} · {formatCampaignDate(send.at)}</p>
      ))}
      {notifiedThisSession && !sends.length && <p className="mt-1">Sent from the dashboard just now</p>}
    </div>
  );
}

export function LeadDetailsModal({
  lead,
  duplicate,
  onClose,
  onStatusChange,
  canUpdate,
  canDelete,
  onDelete,
  getAuthHeaders,
  onLeadUpdate,
  onAddToCampaign,
  onNotify,
  notifying,
  notified,
  onReclassify,
  reclassifying
}: {
  lead: Lead | null;
  duplicate: boolean;
  onClose: () => void;
  onStatusChange: (lead: Lead) => void;
  canUpdate: boolean;
  canDelete: boolean;
  onDelete: (lead: Lead) => void;
  getAuthHeaders: () => Promise<HeadersInit>;
  onLeadUpdate: (lead: Lead) => void;
  onAddToCampaign?: (lead: Lead) => void;
  onNotify: (lead: Lead) => void;
  notifying: boolean;
  notified: boolean;
  onReclassify: (lead: Lead, leadType: LeadType) => void;
  reclassifying: boolean;
}) {
  const [updating, setUpdating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    treatment: "",
    message: "",
    source: "",
    notes: ""
  });

  useEffect(() => {
    if (lead)
      setEditForm({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        treatment: lead.treatment,
        message: lead.message,
        source: lead.source,
        notes: lead.notes
      });
  }, [lead]);

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
        body: JSON.stringify({ id: lead.id, status })
      });
      const data = await res.json().catch(() => ({})) as { error?: string; lead?: Lead };
      if (!res.ok || data.error) {
        setActionError(data.error ?? "Could not update status");
        return;
      }
      onStatusChange(data.lead ?? { ...lead, status });
    } finally {
      setUpdating(false);
    }
  }

  async function saveLeadFields() {
    if (!lead) return;
    const currentLead = lead;
    setEditSaving(true);
    setActionError(null);
    try {
      const res = await fetch("/api/airtable/leads", {
        method: "PATCH",
        credentials: "same-origin",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ id: currentLead.id, ...editForm })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save lead");
      onLeadUpdate({ ...currentLead, ...editForm });
      setEditing(false);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not save lead",
      );
    } finally {
      setEditSaving(false);
    }
  }

  const events = [
    {
      label: "Lead received",
      value: fullDate(lead.createdAt),
      icon: Sparkles,
      tone: GOLD
    },
    ...(lead.emailSentStatus
      ? [
          {
            label: `Email ${lead.emailSentStatus}`,
            value: "Automation status",
            icon: Mail,
            tone: isSent(lead.emailSentStatus) ? "#22C55E" : "#F59E0B"
          },
        ]
      : []),
    ...(lead.smsSentStatus
      ? [
          {
            label: `SMS ${lead.smsSentStatus}`,
            value: "Automation status",
            icon: MessageSquare,
            tone: isSent(lead.smsSentStatus) ? "#22C55E" : "#F59E0B"
          },
        ]
      : []),
    {
      label: `Current status: ${lead.status}`,
      value: duplicate ? "Possible duplicate detected" : "Live Airtable status",
      icon: ShieldCheck,
      tone: duplicate ? "#A1A1AA" : TEAL
    },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-0 sm:p-8">
      <button
        className="absolute inset-0 bg-black/55"
        aria-label="Close lead detail panel"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex h-dvh max-h-dvh w-full flex-col overflow-hidden border sm:h-[78dvh] sm:max-h-[760px] sm:w-[calc(100vw-4rem)] sm:max-w-[980px] sm:rounded-2xl"
        style={{
          backgroundColor: "#09090D",
          borderColor: BORDER,
          boxShadow: "0 28px 100px rgba(0,0,0,0.58)"
        }}
      >
        <div
          className="mobile-safe-top flex shrink-0 items-start justify-between gap-4 border-b p-4 sm:p-5"
          style={{ borderColor: BORDER }}
        >
          <div className="min-w-0">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.1em]"
              style={{ color: GOLD }}
            >
              Lead profile
            </p>
            <h2
              className="mt-1 truncate text-xl font-extrabold"
              style={{ color: TEXT }}
            >
              {lead.name || "Unnamed lead"}
            </h2>
            <p className="mt-1 text-xs" style={{ color: MUTED }}>
              {sourceLabel(lead.source)} - {timeAgo(lead.createdAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid size-11 shrink-0 place-items-center rounded-xl border"
            style={{ borderColor: BORDER, color: MUTED, backgroundColor: CARD }}
            aria-label="Close lead details"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mobile-safe-bottom flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
          {actionError && (
            <div
              className="mb-4 flex items-start gap-2 rounded-xl border p-3 text-sm"
              style={{
                color: "#F87171",
                backgroundColor: "rgba(248,113,113,0.08)",
                borderColor: "rgba(248,113,113,0.25)"
              }}
            >
              <AlertCircle size={16} />
              {actionError}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={lead.status} />
            {duplicate && <StatusPill status="Duplicate" />}
            <DeliveryPill label="SMS" value={lead.smsSentStatus} />
            <DeliveryPill label="Email" value={lead.emailSentStatus} />
            {lead.offerCode && (
              <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold" style={{ color: "var(--brand-primary-strong)", backgroundColor: "var(--brand-primary-soft)", borderColor: "var(--brand-primary)" }} aria-label={`Offer code: ${lead.offerCode}`}>
                Offer {lead.offerCode}
              </span>
            )}
            {lead.offerCode === BLACK_FRIDAY_OFFER_CODE && (
              <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ color: MUTED, backgroundColor: "var(--surface-2)" }}>
                SMS consent: {lead.smsConsent ? "Yes" : "No"} · Email consent: {lead.emailConsent ? "Yes" : "No"}
              </span>
            )}
          </div>

          {isGiftCardLead(lead) && (
            <GiftCardRequestCard lead={lead} canUpdate={canUpdate} getAuthHeaders={getAuthHeaders} onUpdated={onStatusChange} />
          )}

          <ClassificationCard
            lead={lead}
            canUpdate={canUpdate}
            saving={reclassifying}
            onReclassify={(leadType) => onReclassify(lead, leadType)}
          />

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              {
                label: "Phone",
                value: lead.phone,
                href: `tel:${lead.phone}`,
                icon: Phone
              },
              {
                label: "Email",
                value: lead.email,
                href: `mailto:${lead.email}`,
                icon: Mail
              },
              { label: "Treatment", value: lead.treatment, icon: Sparkles },
              {
                label: "Created",
                value: fullDate(lead.createdAt),
                icon: CalendarDays
              },
            ].map(({ label, value, href, icon: Icon }) => (
              <div
                key={label}
                className="rounded-2xl border p-3"
                style={{ backgroundColor: CARD, borderColor: BORDER_SOFT }}
              >
                <p
                  className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em]"
                  style={{ color: DIM }}
                >
                  <Icon size={11} />
                  {label}
                </p>
                {href && value ? (
                  <a
                    className="break-words text-sm font-semibold"
                    style={{ color: TEAL }}
                    href={href}
                  >
                    {value}
                  </a>
                ) : (
                  <p
                    className="break-words text-sm font-semibold"
                    style={{ color: value ? TEXT : MUTED }}
                  >
                    {value || "Not captured"}
                  </p>
                )}
              </div>
            ))}
          </div>

          {canUpdate && (
            <div
              className="mt-5 rounded-2xl border p-4"
              style={{ backgroundColor: CARD, borderColor: BORDER_SOFT }}
            >
              <p
                className="mb-3 text-[10px] font-bold uppercase tracking-[0.08em]"
                style={{ color: GOLD }}
              >
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
                      borderColor:
                        lead.status === status
                          ? STATUS_CONFIG[status].border
                          : BORDER_SOFT,
                      color:
                        lead.status === status
                          ? STATUS_CONFIG[status].color
                          : MUTED,
                      backgroundColor:
                        lead.status === status
                          ? STATUS_CONFIG[status].bg
                          : "rgba(255,255,255,0.025)"
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div
            className="mt-5 rounded-2xl border p-4"
            style={{ backgroundColor: CARD, borderColor: BORDER_SOFT }}
          >
            <p
              className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em]"
              style={{ color: GOLD }}
            >
              <MessageSquare size={12} />
              Original message
            </p>
            <p
              className="text-sm leading-6"
              style={{ color: lead.message ? TEXT : MUTED }}
            >
              {lead.message || "No message captured on this lead."}
            </p>
          </div>

          <div
            className="mt-5 rounded-2xl border p-4"
            style={{ backgroundColor: CARD, borderColor: BORDER_SOFT }}
          >
            <p
              className="mb-4 text-[10px] font-bold uppercase tracking-[0.08em]"
              style={{ color: GOLD }}
            >
              Message and status timeline
            </p>
            <div className="space-y-4">
              {events.map(({ label, value, icon: Icon, tone }, index) => (
                <div key={`${label}-${index}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full border"
                      style={{
                        color: tone,
                        backgroundColor: `color-mix(in srgb, ${tone} 9%, transparent)`,
                        borderColor: `color-mix(in srgb, ${tone} 28%, transparent)`
                      }}
                    >
                      <Icon size={14} />
                    </div>
                    {index < events.length - 1 && (
                      <div
                        className="mt-2 h-8 w-px"
                        style={{ backgroundColor: BORDER_SOFT }}
                      />
                    )}
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

          {canUpdate && (
            <div
              className="mt-5 rounded-2xl border p-4"
              style={{ backgroundColor: CARD, borderColor: BORDER_SOFT }}
            >
              <div className="flex items-center justify-between">
                <p
                  className="text-[10px] font-bold uppercase"
                  style={{ color: GOLD }}
                >
                  Lead details
                </p>
                <button
                  onClick={() => setEditing((value) => !value)}
                  className="text-xs font-bold"
                  style={{ color: GOLD }}
                >
                  {editing ? "Cancel" : "Edit"}
                </button>
              </div>
              {editing && (
                <>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {[
                      ["Name", "name"],
                      ["Email", "email"],
                      ["Phone", "phone"],
                      ["Treatment Interest", "treatment"],
                      ["Source", "source"],
                      ["Message", "message"],
                      ["Notes", "notes"],
                    ].map(([label, key]) => (
                      <label
                        key={key}
                        className={
                          key === "message" || key === "notes"
                            ? "sm:col-span-2"
                            : ""
                        }
                      >
                        <span
                          className="mb-1 block text-[10px] uppercase"
                          style={{ color: DIM }}
                        >
                          {label}
                        </span>
                        <input
                          value={editForm[key as keyof typeof editForm]}
                          onChange={(event) =>
                            setEditForm((current) => ({
                              ...current,
                              [key]: event.target.value
                            }))
                          }
                          className="h-10 w-full rounded-lg border px-3 text-sm"
                          style={{
                            backgroundColor: PANEL,
                            borderColor: BORDER,
                            color: TEXT
                          }}
                        />
                      </label>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      onClick={() => setEditing(false)}
                      className="rounded-lg border px-3 py-2 text-xs"
                      style={{ borderColor: BORDER, color: MUTED }}
                    >
                      Cancel
                    </button>
                    <button
                      disabled={editSaving}
                      onClick={() => void saveLeadFields()}
                      className="rounded-lg px-3 py-2 text-xs font-bold"
                      style={{ backgroundColor: GOLD, color: BG }}
                    >
                      {editSaving ? "Saving…" : "Save"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <div
            className="mt-5 rounded-2xl border p-4"
            style={{ backgroundColor: CARD, borderColor: BORDER_SOFT }}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.08em]"
                style={{ color: GOLD }}
              >
                Campaign Activity
              </p>
              {onAddToCampaign && <button
                type="button"
                onClick={() => onAddToCampaign(lead)}
                className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition hover:brightness-110"
                style={{
                  color: "var(--primary-foreground)",
                  backgroundColor: GOLD,
                  borderColor: "#D7B95B"
                }}
              >
                <Plus size={14} /> Add to campaign
              </button>}
            </div>
            <LeadCampaignBadges campaigns={lead.campaigns} />
            {lead.campaigns.map((item) => (
              <div
                key={`${item.slug}-${item.enrollmentId ?? item.status}`}
                className="mt-3 rounded-xl p-3 text-xs"
                style={{
                  backgroundColor: "rgba(255,255,255,.025)",
                  color: MUTED
                }}
              >
                <div className="flex justify-between gap-3">
                  <b style={{ color: TEXT }}>{item.campaign}</b>
                  <Link
                    href={`/campaigns/${item.slug}`}
                    style={{ color: GOLD }}
                  >
                    View Campaign
                  </Link>
                </div>
                <p className="mt-2">
                  {item.status}
                  {item.currentStep ? ` · ${item.currentStep}` : ""}
                </p>
                {item.nextSendAt && (
                  <p>Next send: {formatCampaignDate(item.nextSendAt)}</p>
                )}
                {item.lastSentAt && (
                  <p>Last sent: {formatCampaignDate(item.lastSentAt)}</p>
                )}
                {item.stopReason && <p>Stop reason: {item.stopReason}</p>}
              </div>
            ))}
            <HaydenNotificationActivity lead={lead} notifiedThisSession={notified} getAuthHeaders={getAuthHeaders} />
          </div>

          <div
            className="mt-5 rounded-2xl border p-4"
            style={{ backgroundColor: CARD, borderColor: BORDER_SOFT }}
          >
            <p
              className="mb-3 text-[10px] font-bold uppercase tracking-[0.08em]"
              style={{ color: GOLD }}
            >
              Attribution
            </p>
            <div className="flex flex-wrap gap-2">
              {lead.gclid && <CopyValue label="GCLID" value={lead.gclid} />}
              {!lead.gclid && lead.gbraid && <CopyValue label="GBRAID" value={lead.gbraid} />}
              {!lead.gclid && !lead.gbraid && lead.wbraid && <CopyValue label="WBRAID" value={lead.wbraid} />}
              {attributionItems(lead).map((item) => (
                <span
                  key={item[0]}
                  className="max-w-full truncate rounded-full px-3 py-1 text-xs"
                  style={{
                    color: MUTED,
                    backgroundColor: "rgba(255,255,255,0.04)"
                  }}
                  title={item[1]}
                >
                  <strong>{item[0]}:</strong> {item[1]}
                </span>
              ))}
              {!lead.gclid && !lead.gbraid && !lead.wbraid && attributionItems(lead).length === 0 && (
                <span className="text-xs" style={{ color: MUTED }}>
                  No campaign attribution captured.
                </span>
              )}
            </div>
          </div>

          {(canUpdate || canDelete) && (
            <div
              className="mt-4 flex flex-wrap justify-end gap-2 border-t pt-4"
              style={{ borderColor: BORDER_SOFT }}
            >
              {canUpdate && (
                <NotifyHaydenButton lead={lead} notifying={notifying} notified={notified} onNotify={onNotify} />
              )}
              {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(lead)}
                className="flex shrink-0 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold"
                style={{
                  color: "#F87171",
                  backgroundColor: "rgba(248,113,113,0.06)",
                  borderColor: "rgba(248,113,113,0.22)"
                }}
              >
                <Trash2 size={14} /> Delete lead
              </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
