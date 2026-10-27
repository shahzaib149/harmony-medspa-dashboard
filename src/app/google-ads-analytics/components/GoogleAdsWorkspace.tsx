"use client";


import { LoadingRegion, SkeletonRows } from "@/components/ui/Skeleton";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { resolveAdsRange } from "@/lib/google/ads-range";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Copy,
  Download,
  FileSearch,
  FolderKanban,
  Gauge,
  KeyRound,
  Layers3,
  Loader2,
  MousePointerClick,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
  Workflow,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  AdGroup,
  Campaign,
  ConversionActionRow,
  Creative,
  Keyword,
  SearchTerm,
  SelectedEntity,
  WorkspaceSnapshot,
  WorkspaceTotals,
} from "../workspace-types";

const PendingAdsPanel = dynamic(
  () => import("@/app/dashboard/PendingAdsPanel"),
  {
    ssr: false,
    loading: () => <LoadingBlock label="Loading publishing records" />,
  },
);
const AISuggestionsTab = dynamic(() => import("./AISuggestionsTab"), {
  ssr: false,
  loading: () => <LoadingBlock label="Preparing AI suggestions" />,
});

export type WorkspaceTab =
  | "overview"
  | "campaigns"
  | "ad-groups"
  | "ads"
  | "keywords"
  | "search-terms"
  | "conversions"
  | "workflow"
  | "ai-suggestions";

const TABS: Array<{
  id: WorkspaceTab;
  label: string;
  icon: React.ElementType;
}> = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "campaigns", label: "Campaigns", icon: FolderKanban },
  { id: "ad-groups", label: "Ad groups", icon: Layers3 },
  { id: "ads", label: "Ads", icon: Sparkles },
  { id: "keywords", label: "Keywords", icon: KeyRound },
  { id: "search-terms", label: "Search terms", icon: Search },
  { id: "conversions", label: "Conversions", icon: BadgeCheck },
  { id: "workflow", label: "Publishing", icon: Workflow },
  { id: "ai-suggestions", label: "AI suggestions", icon: BrainCircuit },
];

const money = (value: number, compact = false) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 2,
  }).format(value || 0);
const number = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(
    value || 0,
  );
const pct = (value: number) => `${(value || 0).toFixed(2)}%`;
const roas = (value: number, available = true) =>
  available ? `${(value || 0).toFixed(2)}x` : "—";
const labelize = (value?: string) =>
  (value || "Unknown")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase());
const clip = (value: string, length = 32) =>
  value.length > length ? `${value.slice(0, length - 1)}…` : value;

const detailHref = (
  kind: "campaigns" | "ad-groups" | "ads" | "keywords",
  id: string,
) => `/google-ads-analytics/${kind}/${encodeURIComponent(id)}`;

const RANGE_KEYS = ["range", "days", "month", "from", "to"];

function withRange(href: string, params: URLSearchParams) {
  const [path, existing = ""] = href.split("?");
  const query = new URLSearchParams(existing);
  for (const key of RANGE_KEYS) {
    const value = params.get(key);
    if (value && !query.has(key)) query.set(key, value);
  }
  const search = query.toString();
  return search ? `${path}?${search}` : path;
}

/** Link that carries the selected Google Ads date range to the next page. */
function RangeLink({ href, ...props }: React.ComponentProps<typeof Link> & { href: string }) {
  const params = useSearchParams();
  return <Link href={withRange(href, new URLSearchParams(params.toString()))} {...props} />;
}

function LoadingBlock({
  label = "Loading Google Ads workspace",
}: {
  label?: string;
}) {
  return (
    <LoadingRegion label={label} className="min-h-64 overflow-hidden rounded-2xl border" >
      <SkeletonRows rows={5} />
    </LoadingRegion>
  );
}

function StatusBadge({
  value,
  onClick,
}: {
  value?: string;
  onClick?: () => void;
}) {
  const normalized = (value || "UNKNOWN").toUpperCase();
  const tone =
    normalized.includes("DISAPPROV") ||
    normalized.includes("REJECT") ||
    normalized.includes("FAIL")
      ? ["var(--danger-text)", "var(--danger-bg)", "var(--danger-border)"]
      : normalized.includes("ENABLE") ||
          normalized.includes("APPROVED") ||
          normalized.includes("ELIGIBLE")
        ? ["var(--success-text)", "var(--success-bg)", "var(--success-border)"]
        : normalized.includes("PAUSE") ||
            normalized.includes("REVIEW") ||
            normalized.includes("LIMITED")
          ? [
              "var(--warning-text)",
              "var(--warning-bg)",
              "var(--warning-border)",
            ]
          : [
              "var(--neutral-text)",
              "var(--neutral-bg)",
              "var(--neutral-border)",
            ];
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      onClick={onClick}
      className="inline-flex min-h-6 items-center gap-1.5 rounded-full border px-2.5 text-[10px] font-bold uppercase tracking-[.08em]"
      style={{ color: tone[0], background: tone[1], borderColor: tone[2] }}
    >
      <span className="size-1.5 rounded-full" style={{ background: tone[0] }} />
      {labelize(value)}
    </Tag>
  );
}

function ResourceName({ value }: { value?: string }) {
  const [copied, setCopied] = useState(false);
  if (!value) return <span style={{ color: "var(--text-muted)" }}>—</span>;
  return (
    <button
      className="group inline-flex max-w-full items-center gap-1.5 text-left font-mono text-[10px]"
      style={{ color: "var(--text-muted)" }}
      title={value}
      onClick={(event) => {
        event.stopPropagation();
        void navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      }}
    >
      <span className="truncate">{value}</span>
      <Copy size={11} className="shrink-0 opacity-60 group-hover:opacity-100" />
      {copied && <span className="sr-only">Copied</span>}
    </button>
  );
}

/** Percent change vs the previous period; null when there is no baseline. */
function percentChange(current: number, previous: number) {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

function DeltaChip({ delta, lowerIsBetter = false }: { delta: number | null; lowerIsBetter?: boolean }) {
  if (delta === null || !Number.isFinite(delta)) return null;
  const flat = Math.abs(delta) < 0.5;
  const good = flat ? null : lowerIsBetter ? delta < 0 : delta > 0;
  const color = good === null ? "var(--text-muted)" : good ? "var(--success-text)" : "var(--danger-text)";
  const bg = good === null ? "var(--neutral-bg)" : good ? "var(--success-bg)" : "var(--danger-bg)";
  return (
    <span
      className="rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
      style={{ color, background: bg }}
      title="Change vs previous period of equal length"
    >
      {flat ? "±0%" : `${delta > 0 ? "+" : ""}${delta.toFixed(0)}%`}
    </span>
  );
}

function MetricCard({
  label,
  value,
  note,
  icon: Icon,
  onClick,
  tone = "brand",
  delta = null,
  lowerIsBetter = false,
}: {
  label: string;
  value: string;
  note: string;
  icon: React.ElementType;
  onClick?: () => void;
  tone?: "brand" | "teal" | "blue" | "danger";
  delta?: number | null;
  lowerIsBetter?: boolean;
}) {
  const color =
    tone === "teal"
      ? "var(--success-text)"
      : tone === "blue"
        ? "var(--info-text)"
        : tone === "danger"
          ? "var(--danger-text)"
          : "var(--brand-primary-strong)";
  const bg =
    tone === "teal"
      ? "var(--success-bg)"
      : tone === "blue"
        ? "var(--info-bg)"
        : tone === "danger"
          ? "var(--danger-bg)"
          : "var(--brand-primary-soft)";
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className="group min-w-0 rounded-2xl border p-4 text-left transition-transform hover:-translate-y-0.5"
      style={{
        background: "var(--surface-1)",
        borderColor: "var(--border-subtle)",
        boxShadow: "var(--shadow-soft)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="text-[10px] font-bold uppercase tracking-[.14em]"
            style={{ color: "var(--text-muted)" }}
          >
            {label}
          </p>
          <p
            className="mt-2 flex flex-wrap items-baseline gap-2 text-2xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {value}
            <DeltaChip delta={delta} lowerIsBetter={lowerIsBetter} />
          </p>
        </div>
        <span
          className="grid size-9 shrink-0 place-items-center rounded-xl"
          style={{ color, background: bg }}
        >
          <Icon size={17} />
        </span>
      </div>
      <p
        className="mt-2 flex items-center gap-1 truncate text-[11px]"
        style={{ color: "var(--text-muted)" }}
      >
        {note}
        {onClick && (
          <ChevronRight
            size={12}
            className="transition-transform group-hover:translate-x-0.5"
          />
        )}
      </p>
    </Tag>
  );
}

function EmptyState({
  title,
  body,
  onRefresh,
}: {
  title: string;
  body: string;
  onRefresh?: () => void;
}) {
  return (
    <div
      className="flex min-h-64 flex-col items-center justify-center rounded-2xl border p-8 text-center"
      style={{
        background: "var(--surface-1)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <span
        className="grid size-12 place-items-center rounded-2xl"
        style={{ background: "var(--neutral-bg)", color: "var(--text-muted)" }}
      >
        <FileSearch size={21} />
      </span>
      <h3 className="mt-4 font-bold" style={{ color: "var(--text-primary)" }}>
        {title}
      </h3>
      <p
        className="mt-1 max-w-md text-sm leading-6"
        style={{ color: "var(--text-muted)" }}
      >
        {body}
      </p>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="mt-4 flex min-h-10 items-center gap-2 rounded-xl border px-4 text-sm font-bold"
          style={{
            borderColor: "var(--border-subtle)",
            color: "var(--text-secondary)",
          }}
        >
          <RefreshCw size={14} />
          Refresh inventory
        </button>
      )}
    </div>
  );
}

function FilterBar({
  search,
  setSearch,
  status,
  setStatus,
  campaign,
  setCampaign,
  campaigns,
  clearFilters,
  extra,
  onExport,
}: {
  search: string;
  setSearch: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  campaign: string;
  setCampaign: (value: string) => void;
  campaigns: string[];
  clearFilters: () => void;
  extra?: React.ReactNode;
  onExport: () => void;
}) {
  return (
    <div
      className="flex min-w-0 flex-wrap items-center gap-3 rounded-2xl border p-3 [&>*]:min-w-[150px] [&>*]:flex-1 sm:[&>*]:flex-none"
      style={{
        background: "var(--surface-1)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <label className="relative min-w-0 basis-full sm:basis-auto sm:!flex-1">
        <Search
          size={15}
          className="absolute left-3 top-3.5"
          style={{ color: "var(--text-muted)" }}
        />
        <span className="sr-only">Search</span>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search names, IDs or relationships"
          className="h-11 w-full rounded-xl border pl-9 pr-3 text-sm"
        />
      </label>
      <select
        aria-label="Filter by status"
        value={status}
        onChange={(event) => setStatus(event.target.value)}
        className="h-11 w-full min-w-0 rounded-xl border px-3 text-sm"
      >
        <option value="">All statuses</option>
        <option value="ENABLED">Enabled</option>
        <option value="PAUSED">Paused</option>
        <option value="REMOVED">Removed</option>
        <option value="APPROVED">Approved</option>
        <option value="PAUSED APPROVED">Approved paused</option>
        <option value="DISAPPROVED">Disapproved</option>
        <option value="REVIEW">Under review</option>
      </select>
      <select
        aria-label="Filter by campaign"
        value={campaign}
        onChange={(event) => setCampaign(event.target.value)}
        className="h-11 w-full min-w-0 rounded-xl border px-3 text-sm"
      >
        <option value="">All campaigns</option>
        {campaigns.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      {extra}
      <button
        onClick={onExport}
        className="flex h-11 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold"
        style={{
          borderColor: "var(--border-subtle)",
          color: "var(--text-secondary)",
        }}
      >
        <Download size={14} />
        CSV
      </button>
      {(search || status || campaign) && (
        <button
          type="button"
          onClick={clearFilters}
          className="min-h-11 rounded-xl border px-3 text-sm font-bold"
          style={{
            borderColor: "var(--border-subtle)",
            color: "var(--brand-primary-strong)",
          }}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

function exportRows(filename: string, rows: Array<Record<string, unknown>>) {
  if (!rows.length) return;
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((key) => `"${String(row[key] ?? "").replaceAll('"', '""')}"`)
        .join(","),
    ),
  ].join("\n");
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

/** Account structure at a glance: how many of each level are live, paused or total. */
function StructureSummary({
  snapshot,
  setTab,
}: {
  snapshot: WorkspaceSnapshot;
  setTab: (tab: WorkspaceTab, status?: string) => void;
}) {
  const levels: Array<{ label: string; tab: WorkspaceTab; statuses: string[] }> = [
    { label: "Campaigns", tab: "campaigns", statuses: snapshot.campaigns.map((item) => item.campaignStatus) },
    { label: "Ad groups", tab: "ad-groups", statuses: snapshot.adGroups.map((item) => item.adGroupStatus) },
    { label: "Ads", tab: "ads", statuses: snapshot.ads.map((item) => item.status || "") },
    { label: "Keywords", tab: "keywords", statuses: snapshot.keywords.map((item) => item.status || "") },
  ];
  return (
    <section aria-label="Account structure" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {levels.map((level) => {
        const enabled = level.statuses.filter((value) => value.toUpperCase() === "ENABLED").length;
        const paused = level.statuses.filter((value) => value.toUpperCase() === "PAUSED").length;
        return (
          <button
            key={level.label}
            onClick={() => setTab(level.tab)}
            className="group min-w-0 rounded-2xl border p-4 text-left transition-transform hover:-translate-y-0.5"
            style={{ background: "var(--surface-1)", borderColor: "var(--border-subtle)" }}
          >
            <span className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[.14em]" style={{ color: "var(--text-muted)" }}>
              {level.label}
              <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
            </span>
            <span className="mt-2 block text-2xl font-bold tracking-tight">{level.statuses.length}</span>
            <span className="mt-1 flex flex-wrap gap-x-3 text-[11px]" style={{ color: "var(--text-muted)" }}>
              <span><strong style={{ color: "var(--success-text)" }}>{enabled}</strong> enabled</span>
              <span><strong style={{ color: "var(--warning-text)" }}>{paused}</strong> paused</span>
            </span>
          </button>
        );
      })}
    </section>
  );
}

const TREND_METRICS = [
  { key: "cost", label: "Cost", format: (v: number) => money(v) },
  { key: "clicks", label: "Clicks", format: (v: number) => number(v) },
  { key: "conversions", label: "Conversions", format: (v: number) => number(v) },
  { key: "cpa", label: "Cost / conv.", format: (v: number) => money(v) },
  { key: "ctrPct", label: "CTR", format: (v: number) => pct(v) },
] as const;

function TrendChart({ daily }: { daily: NonNullable<WorkspaceSnapshot["daily"]> }) {
  const [metric, setMetric] = useState<(typeof TREND_METRICS)[number]["key"]>("cost");
  const active = TREND_METRICS.find((item) => item.key === metric) ?? TREND_METRICS[0];
  const data = daily.map((point) => ({
    date: point.date,
    label: new Date(`${point.date}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    value: point[metric],
  }));
  return (
    <section
      className="rounded-2xl border p-4 sm:p-5"
      style={{ background: "var(--surface-1)", borderColor: "var(--border-subtle)" }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-bold">Performance over time</h3>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            Daily account totals for the selected range.
          </p>
        </div>
        <div role="radiogroup" aria-label="Chart metric" className="flex flex-wrap gap-1">
          {TREND_METRICS.map((item) => (
            <button
              key={item.key}
              role="radio"
              aria-checked={metric === item.key}
              onClick={() => setMetric(item.key)}
              className="min-h-9 rounded-lg border px-3 text-xs font-bold"
              style={{
                borderColor: metric === item.key ? "var(--brand-primary)" : "var(--border-subtle)",
                color: metric === item.key ? "var(--brand-primary-strong)" : "var(--text-muted)",
                background: metric === item.key ? "var(--brand-primary-soft)" : "transparent",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <AreaChart data={data} margin={{ left: -8, right: 8, top: 6, bottom: 0 }}>
            <defs>
              <linearGradient id="ads-trend-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} minTickGap={24} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(value) => active.format(Number(value))} width={64} />
            <Tooltip
              formatter={(value) => [active.format(Number(value)), active.label]}
              labelFormatter={(_, payload) => String(payload?.[0]?.payload?.date ?? "")}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--chart-1)"
              strokeWidth={2}
              fill="url(#ads-trend-fill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function Overview({
  snapshot,
  setTab,
  onOpen,
}: {
  snapshot: WorkspaceSnapshot;
  setTab: (tab: WorkspaceTab, status?: string) => void;
  onOpen: (entity: SelectedEntity) => void;
}) {
  const totals = useMemo(
    () =>
      snapshot.campaigns.reduce(
        (acc, item) => ({
          cost: acc.cost + item.cost,
          impressions: acc.impressions + item.impressions,
          clicks: acc.clicks + item.clicks,
          conversions: acc.conversions + item.conversions,
          value: acc.value + item.conversionValue,
          conversionValueAvailable:
            acc.conversionValueAvailable ||
            item.conversionValueAvailable !== false,
        }),
        {
          cost: 0,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          value: 0,
          conversionValueAvailable: false,
        },
      ),
    [snapshot.campaigns],
  );
  const weightedCtr = totals.impressions
    ? (totals.clicks / totals.impressions) * 100
    : 0;
  const current = snapshot.summary?.current;
  const previous = snapshot.summary?.previous;
  const change = (key: keyof WorkspaceTotals) =>
    current && previous ? percentChange(current[key], previous[key]) : null;
  const pending = snapshot.ads.filter((ad) =>
    `${ad.reviewStatus} ${ad.primaryStatus}`.toUpperCase().includes("REVIEW"),
  ).length;
  const disapproved = snapshot.ads.filter((ad) =>
    `${ad.approvalStatus} ${ad.primaryStatus}`
      .toUpperCase()
      .includes("DISAPPROV"),
  ).length;
  const pausedApproved = snapshot.ads.filter(
    (ad) =>
      ad.status?.toUpperCase() === "PAUSED" &&
      ad.approvalStatus?.toUpperCase().includes("APPROVED"),
  ).length;
  const chartData = [...snapshot.campaigns]
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 8)
    .map((item) => ({
      name: clip(item.campaignName, 20),
      full: item,
      spend: item.cost,
      conversions: item.conversions,
    }));
  const topGroups = [...snapshot.adGroups]
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5);
  const topAds = snapshot.ads
    .filter((ad) => ad.status?.toUpperCase() === "ENABLED")
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);
  return (
    <div className="space-y-5">
      <StructureSummary snapshot={snapshot} setTab={setTab} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-8">
        <MetricCard
          label="Spend"
          value={money(totals.cost, true)}
          note="vs previous period"
          icon={CircleDollarSign}
          delta={change("cost")}
          onClick={() => setTab("campaigns")}
        />
        <MetricCard
          label="Impressions"
          value={number(totals.impressions)}
          note={`${pct(weightedCtr)} CTR`}
          icon={Target}
          tone="blue"
          delta={change("impressions")}
          onClick={() => setTab("campaigns")}
        />
        <MetricCard
          label="Clicks"
          value={number(totals.clicks)}
          note={
            money(totals.clicks ? totals.cost / totals.clicks : 0) + " avg CPC"
          }
          icon={MousePointerClick}
          tone="blue"
          delta={change("clicks")}
          onClick={() => setTab("ads")}
        />
        <MetricCard
          label="Conversions"
          value={number(totals.conversions)}
          note={
            money(totals.conversions ? totals.cost / totals.conversions : 0) +
            " CPA"
          }
          icon={BadgeCheck}
          tone="teal"
          delta={change("conversions")}
          onClick={() => setTab("conversions")}
        />
        {totals.conversionValueAvailable && (
          <MetricCard
            label="ROAS"
            value={roas(totals.cost ? totals.value / totals.cost : 0)}
            note={money(totals.value, true) + " value"}
            icon={Gauge}
            tone="teal"
            delta={change("roas")}
          />
        )}
        <MetricCard
          label="Under review"
          value={number(pending)}
          note="Open publishing"
          icon={Clock3}
          onClick={() => setTab("workflow")}
        />
        <MetricCard
          label="Approved paused"
          value={number(pausedApproved)}
          note="Ready to inspect"
          icon={CheckCircle2}
          tone="teal"
          onClick={() => setTab("ads", "PAUSED APPROVED")}
        />
        <MetricCard
          label="Disapproved"
          value={number(disapproved)}
          note="Policy attention"
          icon={ShieldAlert}
          tone="danger"
          onClick={() => setTab("ads", "DISAPPROVED")}
        />
      </div>

      {snapshot.daily && snapshot.daily.length > 0 && (
        <TrendChart daily={snapshot.daily} />
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.55fr)]">
        <section
          className="rounded-2xl border p-4 sm:p-5"
          style={{
            background: "var(--surface-1)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold">Spend by campaign</h3>
              <p
                className="mt-1 text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                Select a bar to inspect its complete child inventory.
              </p>
            </div>
            <button
              onClick={() => setTab("campaigns")}
              className="text-xs font-bold"
              style={{ color: "var(--brand-primary-strong)" }}
            >
              View table
            </button>
          </div>
          {chartData.length ? (
            <div className="mt-4 h-72">
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                minHeight={0}
              >
                <BarChart
                  data={chartData}
                  margin={{ left: -18, right: 8, top: 6, bottom: 30 }}
                  onClick={(state) => {
                    const index = state?.activeTooltipIndex;
                    if (typeof index === "number" && chartData[index])
                      onOpen({
                        kind: "campaign",
                        value: chartData[index].full,
                      });
                  }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-18}
                    textAnchor="end"
                    height={55}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    tickFormatter={(value) => money(Number(value), true)}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--brand-primary-soft)" }}
                    formatter={(value) => money(Number(value))}
                  />
                  <Bar
                    dataKey="spend"
                    fill="var(--chart-1)"
                    radius={[5, 5, 0, 0]}
                    className="cursor-pointer"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No campaign performance yet"
              body="New campaigns can appear before their first impression. Refresh after Google Ads reports metrics."
            />
          )}
        </section>
        <section
          className="rounded-2xl border p-4 sm:p-5"
          style={{
            background: "var(--surface-1)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <h3 className="font-bold">Approval control</h3>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            Current ad policy and activation signals.
          </p>
          <div className="mt-5 space-y-3">
            {[
              [
                "Enabled / running",
                snapshot.ads.filter(
                  (ad) => ad.status?.toUpperCase() === "ENABLED",
                ).length,
                "var(--success-text)",
                "ads" as WorkspaceTab,
                "ENABLED",
              ],
              [
                "Pending Google review",
                pending,
                "var(--warning-text)",
                "workflow" as WorkspaceTab,
              ],
              [
                "Approved and paused",
                pausedApproved,
                "var(--info-text)",
                "ads" as WorkspaceTab,
                "PAUSED APPROVED",
              ],
              [
                "Disapproved",
                disapproved,
                "var(--danger-text)",
                "ads" as WorkspaceTab,
                "DISAPPROVED",
              ],
            ].map(([label, count, color, tab, status]) => (
              <button
                key={String(label)}
                onClick={() =>
                  setTab(tab as WorkspaceTab, status as string | undefined)
                }
                className="flex w-full items-center justify-between rounded-xl border p-3 text-left"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: String(color) }}
                  />
                  {label}
                </span>
                <span className="text-lg font-bold">{count}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RankedList
          title="Top ad groups"
          subtitle="By spend in the selected range"
          rows={topGroups.map((item) => ({
            title: item.adGroupName,
            parent: item.campaignName,
            metric: money(item.cost),
            action: () => onOpen({ kind: "ad-group", value: item }),
          }))}
          onAll={() => setTab("ad-groups")}
        />
        <RankedList
          title="Top ads"
          subtitle="By clicks, with approval status"
          rows={topAds.map((item) => ({
            title: item.adName,
            parent: `${item.campaignName} · ${item.adGroupName}`,
            metric: number(item.clicks),
            badge: item.approvalStatus || item.status,
            action: () => onOpen({ kind: "ad", value: item }),
          }))}
          onAll={() => setTab("ads")}
        />
      </div>
    </div>
  );
}

function RankedList({
  title,
  subtitle,
  rows,
  onAll,
}: {
  title: string;
  subtitle: string;
  rows: Array<{
    title: string;
    parent: string;
    metric: string;
    badge?: string;
    action: () => void;
  }>;
  onAll: () => void;
}) {
  return (
    <section
      className="rounded-2xl border p-4 sm:p-5"
      style={{
        background: "var(--surface-1)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold">{title}</h3>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        </div>
        <button
          onClick={onAll}
          className="text-xs font-bold"
          style={{ color: "var(--brand-primary-strong)" }}
        >
          View all
        </button>
      </div>
      <div
        className="mt-3 divide-y"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        {rows.map((row) => (
          <button
            key={`${row.title}-${row.parent}`}
            onClick={row.action}
            className="group flex w-full items-center gap-3 py-3 text-left"
          >
            <span
              className="grid size-8 shrink-0 place-items-center rounded-xl"
              style={{
                background: "var(--background-subtle)",
                color: "var(--brand-primary-strong)",
              }}
            >
              <ChevronRight size={15} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">
                {row.title}
              </span>
              <span
                className="block truncate text-[11px]"
                style={{ color: "var(--text-muted)" }}
              >
                {row.parent}
              </span>
            </span>
            {row.badge && <StatusBadge value={row.badge} />}
            <span className="font-mono text-sm font-bold">{row.metric}</span>
          </button>
        ))}
      </div>
      {!rows.length && (
        <p
          className="py-10 text-center text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          No records in this range.
        </p>
      )}
    </section>
  );
}

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);
  return debounced;
}

function useEntityFilters<T extends { campaignName?: string }>(
  storageKey: string,
  rows: T[],
  searchable: (row: T) => string,
  statusText: (row: T) => string,
  initialStatus = "",
) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [campaign, setCampaign] = useState("");
  const restored = useRef(false);
  const debouncedSearch = useDebouncedValue(search, 300);
  useEffect(() => {
    try {
      const saved = JSON.parse(
        window.sessionStorage.getItem(`google-ads-filters:${storageKey}`) ||
          "null",
      ) as { search?: string; status?: string; campaign?: string } | null;
      if (saved) {
        setSearch(saved.search || "");
        setStatus(initialStatus || saved.status || "");
        setCampaign(saved.campaign || "");
      }
    } catch {
      // Storage may be blocked; filtering still works for the current page.
    } finally {
      restored.current = true;
    }
  }, [initialStatus, storageKey]);
  useEffect(() => {
    if (!restored.current) return;
    try {
      window.sessionStorage.setItem(
        `google-ads-filters:${storageKey}`,
        JSON.stringify({ search, status, campaign }),
      );
    } catch {
      // Storage may be blocked; no user-facing error is necessary.
    }
  }, [campaign, search, status, storageKey]);
  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        const needle = debouncedSearch.trim().toLowerCase();
        const statusHaystack = statusText(row).toUpperCase();
        const statusMatch =
          !status ||
          status
            .toUpperCase()
            .split(/\s+/)
            .every((token) => statusHaystack.includes(token));
        return (
          (!needle || searchable(row).toLowerCase().includes(needle)) &&
          statusMatch &&
          (!campaign || row.campaignName === campaign)
        );
      }),
    [campaign, debouncedSearch, rows, searchable, status, statusText],
  );
  useEffect(() => setStatus(initialStatus), [initialStatus]);
  return {
    search,
    setSearch,
    status,
    setStatus,
    campaign,
    setCampaign,
    clearFilters: () => {
      setSearch("");
      setStatus("");
      setCampaign("");
    },
    filtered,
  };
}

type EntitySort = "spend" | "clicks" | "conversions" | "name";
function usePagedEntities<
  T extends { cost: number; clicks: number; conversions: number },
>(rows: T[], name: (row: T) => string) {
  const [sort, setSort] = useState<EntitySort>("spend");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<25 | 50 | 100>(25);
  const sorted = useMemo(
    () =>
      [...rows].sort((left, right) => {
        if (sort === "name") return name(left).localeCompare(name(right));
        const key = sort === "spend" ? "cost" : sort;
        return right[key] - left[key];
      }),
    [name, rows, sort],
  );
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  useEffect(() => setPage(0), [pageSize, rows, sort]);
  return {
    rows: sorted.slice(safePage * pageSize, (safePage + 1) * pageSize),
    sort,
    setSort,
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    pageCount,
    total: sorted.length,
  };
}

function SortSelect({
  value,
  onChange,
}: {
  value: EntitySort;
  onChange: (value: EntitySort) => void;
}) {
  return (
    <select
      aria-label="Sort rows"
      value={value}
      onChange={(event) => onChange(event.target.value as EntitySort)}
      className="h-11 rounded-xl border px-3 text-sm"
    >
      <option value="spend">Spend: high to low</option>
      <option value="clicks">Clicks: high to low</option>
      <option value="conversions">Conversions: high to low</option>
      <option value="name">Name: A to Z</option>
    </select>
  );
}

function PageControls({
  page,
  pageCount,
  pageSize,
  total,
  onChange,
  onPageSizeChange,
}: {
  page: number;
  pageCount: number;
  pageSize: 25 | 50 | 100;
  total: number;
  onChange: (page: number) => void;
  onPageSizeChange: (pageSize: 25 | 50 | 100) => void;
}) {
  if (!total) return null;
  const first = page * pageSize + 1;
  const last = Math.min(total, (page + 1) * pageSize);
  return (
    <div
      className="flex flex-col gap-3 rounded-xl border px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between"
      style={{
        borderColor: "var(--border-subtle)",
        color: "var(--text-muted)",
      }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span>
          Showing {first}–{last} of {total} · Page {page + 1} of {pageCount}
        </span>
        <label className="flex items-center gap-2 font-semibold">
          Rows
          <select
            aria-label="Rows per page"
            value={pageSize}
            onChange={(event) =>
              onPageSizeChange(Number(event.target.value) as 25 | 50 | 100)
            }
            className="h-10 rounded-lg border px-2 text-xs"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          disabled={page === 0}
          onClick={() => onChange(page - 1)}
          className="min-h-11 rounded-lg border px-3 font-bold disabled:opacity-40"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          Previous
        </button>
        <button
          disabled={page + 1 >= pageCount}
          onClick={() => onChange(page + 1)}
          className="min-h-11 rounded-lg border px-3 font-bold disabled:opacity-40"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

type MobileCardMetric = { label: string; value: string };

function MobileEntityCard({
  href,
  title,
  eyebrow,
  status,
  relationship,
  description,
  metrics,
  synchronized,
  actionLabel,
}: {
  href: string;
  title: string;
  eyebrow: string;
  status?: string;
  relationship?: string;
  description?: string;
  metrics: MobileCardMetric[];
  synchronized?: string;
  actionLabel: string;
}) {
  return (
    <RangeLink
      href={href}
      aria-label={`${actionLabel}: ${title}`}
      className="group block min-w-0 rounded-2xl border p-4 focus-visible:ring-2"
      style={{
        borderColor: "var(--border-subtle)",
        background: "var(--surface-1)",
        boxShadow: "var(--shadow-soft)",
      }}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="text-[11px] font-bold uppercase tracking-[.1em]"
            style={{ color: "var(--text-muted)" }}
          >
            {eyebrow}
          </p>
          <h3 className="mt-1 break-words text-base font-bold leading-6">
            {title || "Unnamed entity"}
          </h3>
        </div>
        {status && <StatusBadge value={status} />}
      </div>
      {relationship && (
        <p
          className="mt-2 break-words text-sm leading-5"
          style={{ color: "var(--text-secondary)" }}
        >
          {relationship}
        </p>
      )}
      {description && (
        <p
          className="break-anywhere mt-1 text-xs leading-5"
          style={{ color: "var(--text-muted)" }}
        >
          {description}
        </p>
      )}
      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4 min-[420px]:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="min-w-0">
            <dt
              className="text-[11px] font-semibold"
              style={{ color: "var(--text-muted)" }}
            >
              {metric.label}
            </dt>
            <dd className="mt-1 break-words text-sm font-bold tabular-nums">
              {metric.value}
            </dd>
          </div>
        ))}
      </dl>
      <div
        className="mt-4 flex min-h-11 items-center justify-between gap-3 border-t pt-3 text-xs"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <span
          className="min-w-0 break-words"
          style={{ color: "var(--text-muted)" }}
        >
          {synchronized
            ? `Synced ${synchronized}`
            : "Synchronization time unavailable"}
        </span>
        <span
          className="flex shrink-0 items-center gap-1 font-bold"
          style={{ color: "var(--brand-primary-strong)" }}
        >
          {actionLabel}
          <ArrowRight
            size={14}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </div>
    </RangeLink>
  );
}

const campaignSearch = (row: Campaign) =>
  `${row.campaignName} ${row.campaignId} ${row.resourceName}`;
const campaignStatus = (row: Campaign) => row.campaignStatus;
function CampaignsTable({
  rows,
  adGroups,
  ads,
  keywords,
  onOpen,
  onScope,
}: {
  rows: Campaign[];
  adGroups: AdGroup[];
  ads: Creative[];
  keywords: Keyword[];
  onOpen: (entity: SelectedEntity) => void;
  onScope: (campaignId: string) => void;
}) {
  const filters = useEntityFilters(
    "campaigns",
    rows,
    campaignSearch,
    campaignStatus,
  );
  const table = usePagedEntities(filters.filtered, (item) => item.campaignName);
  const inventoryByCampaign = useMemo(() => {
    const inventory = new Map<
      string,
      { groups: number; ads: number; keywords: number }
    >();
    const entry = (id: string) => {
      const existing = inventory.get(id) || { groups: 0, ads: 0, keywords: 0 };
      inventory.set(id, existing);
      return existing;
    };
    adGroups.forEach((item) => (entry(item.campaignId).groups += 1));
    ads.forEach((item) => (entry(item.campaignId).ads += 1));
    keywords.forEach((item) => (entry(item.campaignId).keywords += 1));
    return inventory;
  }, [adGroups, ads, keywords]);
  return (
    <EntitySection
      eyebrow="Account structure"
      title="Campaigns"
      description="Budget, delivery and child inventory stay joined to the canonical Google campaign resource."
    >
      <FilterBar
        {...filters}
        campaigns={[]}
        extra={<SortSelect value={table.sort} onChange={table.setSort} />}
        onExport={() =>
          exportRows(
            "google-ads-campaigns.csv",
            filters.filtered as unknown as Array<Record<string, unknown>>,
          )
        }
      />
      <div className="space-y-3 md:hidden">
        {table.rows.map((item) => {
          const inventory = inventoryByCampaign.get(item.campaignId) || {
            groups: 0,
            ads: 0,
            keywords: 0,
          };
          return (
            <MobileEntityCard
              key={item.id}
              href={detailHref("campaigns", item.campaignId)}
              title={item.campaignName}
              eyebrow={labelize(item.channelType)}
              status={item.campaignStatus}
              relationship={`${inventory.groups} ad groups · ${inventory.ads} ads · ${inventory.keywords} keywords`}
              metrics={[
                { label: "Spend", value: money(item.cost) },
                { label: "Clicks", value: number(item.clicks) },
                { label: "Conversions", value: number(item.conversions) },
                {
                  label: "CTR",
                  value: item.impressions
                    ? pct((item.clicks / item.impressions) * 100)
                    : "—",
                },
                {
                  label: "CPA",
                  value: item.conversions
                    ? money(item.cost / item.conversions)
                    : "—",
                },
                {
                  label: "Daily budget",
                  value: !item.budget ? "—" : money(item.budget),
                },
              ]}
              synchronized={
                item.pulledAt
                  ? new Date(item.pulledAt).toLocaleDateString()
                  : undefined
              }
              actionLabel="Open campaign"
            />
          );
        })}
      </div>
      <DataTable
        columns={[
          "Campaign",
          "Delivery",
          "Type",
          "Daily budget",
          "Spend",
          "Impressions",
          "Clicks",
          "CTR",
          "Avg CPC",
          "Conversions",
          "CPA",
          "Conv. value",
          "ROAS",
          "Inventory",
          "Search IS",
          "Last synchronized",
        ]}
      >
        {table.rows.map((item) => {
          const inventory = inventoryByCampaign.get(item.campaignId) || {
            groups: 0,
            ads: 0,
            keywords: 0,
          };
          return (
            <tr
              key={item.id}
              onClick={() => onOpen({ kind: "campaign", value: item })}
              className="cursor-pointer border-b"
            >
              <NameCell
                title={item.campaignName}
                id={item.campaignId}
                resource={item.resourceName}
                href={detailHref("campaigns", item.campaignId)}
              />
              <td>
                <StatusBadge value={item.campaignStatus} />
              </td>
              <td>
                <strong>{labelize(item.channelType)}</strong>
              </td>
              <MetricCell
                value={!item.budget ? "—" : money(item.budget)}
                note={!item.budget ? undefined : "Per day"}
              />
              <MetricCell value={money(item.cost)} />
              <MetricCell value={number(item.impressions)} />
              <MetricCell value={number(item.clicks)} />
              <MetricCell
                value={
                  item.impressions
                    ? pct((item.clicks / item.impressions) * 100)
                    : "—"
                }
              />
              <MetricCell
                value={item.clicks ? money(item.cost / item.clicks) : "—"}
              />
              <MetricCell value={number(item.conversions)} />
              <MetricCell
                value={
                  item.conversions ? money(item.cost / item.conversions) : "—"
                }
              />
              <MetricCell
                value={
                  item.conversionValueAvailable === false
                    ? "—"
                    : money(item.conversionValue)
                }
              />
              <td
                className="font-bold"
                style={{ color: "var(--success-text)" }}
              >
                {roas(item.roas, item.conversionValueAvailable !== false)}
              </td>
              <td className="text-right">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onScope(item.campaignId);
                  }}
                  className="font-bold hover:underline"
                  style={{ color: "var(--brand-primary-strong)" }}
                  title="Show this campaign's ad groups, ads, keywords and search terms"
                >
                  {inventory.groups} / {inventory.ads} / {inventory.keywords}
                </button>
                <small>Groups / ads / keywords</small>
              </td>
              <MetricCell
                value={item.impressionShare ? pct(item.impressionShare) : "—"}
                note={
                  item.impressionShare
                    ? `Lost: ${pct(item.impressionShareLostBudget)} budget · ${pct(item.impressionShareLostRank)} rank`
                    : undefined
                }
              />
              <MetricCell
                value={
                  item.pulledAt
                    ? new Date(item.pulledAt).toLocaleDateString()
                    : "—"
                }
              />
            </tr>
          );
        })}
      </DataTable>
      <PageControls
        page={table.page}
        pageCount={table.pageCount}
        pageSize={table.pageSize}
        total={table.total}
        onChange={table.setPage}
        onPageSizeChange={table.setPageSize}
      />
      {!filters.filtered.length && (
        <EmptyState
          title="No campaigns match these filters"
          body="Clear filters or refresh the live inventory. Zero-impression campaigns are included when live sync is connected."
        />
      )}
    </EntitySection>
  );
}

const groupSearch = (row: AdGroup) =>
  `${row.adGroupName} ${row.adGroupId} ${row.resourceName} ${row.campaignName}`;
const groupStatus = (row: AdGroup) => row.adGroupStatus;
function AdGroupsTable({
  rows,
  campaigns,
  ads,
  keywords,
  onOpen,
}: {
  rows: AdGroup[];
  campaigns: Campaign[];
  ads: Creative[];
  keywords: Keyword[];
  onOpen: (entity: SelectedEntity) => void;
}) {
  const filters = useEntityFilters("ad-groups", rows, groupSearch, groupStatus);
  const table = usePagedEntities(filters.filtered, (item) => item.adGroupName);
  const campaignNames = [
    ...new Set(campaigns.map((item) => item.campaignName)),
  ];
  const inventoryByGroup = useMemo(() => {
    const inventory = new Map<
      string,
      { ads: number; keywords: number; policyIssues: number }
    >();
    const entry = (id: string) => {
      const existing = inventory.get(id) || {
        ads: 0,
        keywords: 0,
        policyIssues: 0,
      };
      inventory.set(id, existing);
      return existing;
    };
    ads.forEach((item) => {
      const counts = entry(item.adGroupId || "");
      counts.ads += 1;
      if (
        (item.approvalStatus || "").includes("DISAPPROV") ||
        (item.primaryStatus || "").includes("LIMITED")
      ) {
        counts.policyIssues += 1;
      }
    });
    keywords.forEach((item) => (entry(item.adGroupId || "").keywords += 1));
    return inventory;
  }, [ads, keywords]);
  return (
    <EntitySection
      eyebrow="Relationship inventory"
      title="Ad groups"
      description="Each row shows its parent campaign and the ads and keywords Google currently links beneath it."
    >
      <FilterBar
        {...filters}
        campaigns={campaignNames}
        extra={<SortSelect value={table.sort} onChange={table.setSort} />}
        onExport={() =>
          exportRows(
            "google-ads-ad-groups.csv",
            filters.filtered as unknown as Array<Record<string, unknown>>,
          )
        }
      />
      <div className="space-y-3 md:hidden">
        {table.rows.map((item) => {
          const inventory = inventoryByGroup.get(item.adGroupId) || {
            ads: 0,
            keywords: 0,
            policyIssues: 0,
          };
          return (
            <MobileEntityCard
              key={item.id}
              href={detailHref("ad-groups", item.adGroupId)}
              title={item.adGroupName}
              eyebrow={labelize(item.adGroupType)}
              status={item.adGroupStatus}
              relationship={item.campaignName || "Parent campaign unavailable"}
              description={`${inventory.ads} ads · ${inventory.keywords} keywords${inventory.policyIssues ? ` · ${inventory.policyIssues} policy issues` : ""}`}
              metrics={[
                { label: "Spend", value: money(item.cost) },
                { label: "Clicks", value: number(item.clicks) },
                { label: "Conversions", value: number(item.conversions) },
                {
                  label: "CTR",
                  value: item.impressions
                    ? pct((item.clicks / item.impressions) * 100)
                    : "—",
                },
                { label: "Ads", value: number(inventory.ads) },
                { label: "Keywords", value: number(inventory.keywords) },
              ]}
              synchronized={
                item.pulledAt
                  ? new Date(item.pulledAt).toLocaleDateString()
                  : undefined
              }
              actionLabel="Open ad group"
            />
          );
        })}
      </div>
      <DataTable
        columns={[
          "Ad group",
          "Parent campaign",
          "Status",
          "Type",
          "Ads / keywords",
          "Spend",
          "Impressions",
          "Clicks",
          "CTR",
          "Avg CPC",
          "Conversions",
          "CPA",
          "ROAS",
          "Policy issues",
          "Last synchronized",
        ]}
      >
        {table.rows.map((item) => {
          const inventory = inventoryByGroup.get(item.adGroupId) || {
            ads: 0,
            keywords: 0,
            policyIssues: 0,
          };
          return (
            <tr
              key={item.id}
              onClick={() => onOpen({ kind: "ad-group", value: item })}
              className="cursor-pointer border-b"
            >
              <NameCell
                title={item.adGroupName}
                id={item.adGroupId}
                resource={item.resourceName}
                href={detailHref("ad-groups", item.adGroupId)}
              />
              <td>
                <strong>{item.campaignName}</strong>
                {item.campaignId && <small>Campaign {item.campaignId}</small>}
              </td>
              <td>
                <StatusBadge value={item.adGroupStatus} />
              </td>
              <td>{labelize(item.adGroupType)}</td>
              <MetricCell
                value={`${inventory.ads} ads`}
                note={`${inventory.keywords} keywords`}
              />
              <MetricCell value={money(item.cost)} />
              <MetricCell value={number(item.impressions)} />
              <MetricCell value={number(item.clicks)} />
              <MetricCell
                value={
                  item.impressions
                    ? pct((item.clicks / item.impressions) * 100)
                    : "—"
                }
              />
              <MetricCell
                value={item.clicks ? money(item.cost / item.clicks) : "—"}
              />
              <MetricCell value={number(item.conversions)} />
              <MetricCell
                value={
                  item.conversions ? money(item.cost / item.conversions) : "—"
                }
              />
              <td
                className="font-bold"
                style={{ color: "var(--success-text)" }}
              >
                {roas(item.roas, item.conversionValueAvailable !== false)}
              </td>
              <MetricCell
                value={String(inventory.policyIssues)}
                note="Ads requiring attention"
              />
              <MetricCell
                value={
                  item.pulledAt
                    ? new Date(item.pulledAt).toLocaleDateString()
                    : "—"
                }
              />
            </tr>
          );
        })}
      </DataTable>
      <PageControls
        page={table.page}
        pageCount={table.pageCount}
        pageSize={table.pageSize}
        total={table.total}
        onChange={table.setPage}
        onPageSizeChange={table.setPageSize}
      />
      {!filters.filtered.length && (
        <EmptyState
          title="No ad groups match these filters"
          body="New groups appear through their resource identity even before performance metrics arrive."
        />
      )}
    </EntitySection>
  );
}

const adSearch = (row: Creative) =>
  `${row.adName} ${row.adId} ${row.resourceName} ${row.campaignName} ${row.adGroupName} ${row.finalUrl}`;
const adStatus = (row: Creative) =>
  `${row.status} ${row.primaryStatus} ${row.approvalStatus} ${row.reviewStatus}`;

function useServerAds({
  enabled,
  initialRows,
  initialPagination,
  initialStatus,
  days,
}: {
  enabled: boolean;
  initialRows: Creative[];
  initialPagination?: WorkspaceSnapshot["pagination"];
  initialStatus?: string;
  days: number;
}) {
  const searchParams = useSearchParams();
  const rangeKey = searchParams.toString();
  const range = useMemo(() => resolveAdsRange(new URLSearchParams(rangeKey)), [rangeKey]);
  const [rows, setRows] = useState(initialRows);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(initialStatus || "");
  const [campaign, setCampaign] = useState("");
  const [sort, setSort] = useState<EntitySort>("spend");
  const [page, setPage] = useState(initialPagination?.page || 0);
  const [pageSize, setPageSize] = useState<25 | 50 | 100>(
    initialPagination?.pageSize || 25,
  );
  const [total, setTotal] = useState(
    initialPagination?.total ?? initialRows.length,
  );
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 300);
  const initialKey = `0|25|spend|||`;
  const loadedKey = useRef(initialKey);
  const restored = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    try {
      const saved = JSON.parse(
        window.sessionStorage.getItem("google-ads-filters:ads") || "null",
      ) as { search?: string; status?: string; campaign?: string } | null;
      if (saved) {
        setSearch(saved.search || "");
        setStatus(initialStatus || saved.status || "");
        setCampaign(saved.campaign || "");
      }
    } catch {
      // Storage may be blocked; server pagination still works.
    } finally {
      restored.current = true;
    }
  }, [enabled, initialStatus]);

  useEffect(() => {
    if (!enabled || !restored.current) return;
    try {
      window.sessionStorage.setItem(
        "google-ads-filters:ads",
        JSON.stringify({ search, status, campaign }),
      );
    } catch {
      // Storage may be blocked; retain filters for this mount only.
    }
  }, [campaign, enabled, search, status]);

  useEffect(() => {
    setRows(initialRows);
    setTotal(initialPagination?.total ?? initialRows.length);
  }, [initialPagination?.total, initialRows]);

  useEffect(() => {
    if (!enabled) return;
    const requestKey = `${range.from}|${range.to}|${page}|${pageSize}|${sort}|${debouncedSearch}|${status}|${campaign}`;
    if (loadedKey.current === requestKey) return;
    loadedKey.current = requestKey;
    const controller = new AbortController();
    const params = new URLSearchParams({
      days: String(days),
      from: range.from,
      to: range.to,
      view: "ads",
      page: String(page),
      pageSize: String(pageSize),
      sort,
    });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (status) params.set("status", status);
    if (campaign) params.set("campaign", campaign);
    setLoading(true);
    void fetch(`/api/google-ads/workspace?${params}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = (await response.json()) as WorkspaceSnapshot & {
          error?: string;
        };
        if (!response.ok) throw new Error(data.error || "Ads could not load");
        setRows(data.ads || []);
        setTotal(data.pagination?.total ?? data.ads?.length ?? 0);
        if (data.pagination && data.pagination.page !== page) {
          setPage(data.pagination.page);
        }
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        loadedKey.current = "";
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [campaign, days, range, debouncedSearch, enabled, page, pageSize, sort, status]);

  useEffect(
    () => setPage(0),
    [campaign, debouncedSearch, pageSize, sort, status],
  );
  useEffect(() => setStatus(initialStatus || ""), [initialStatus]);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return {
    filters: {
      search,
      setSearch,
      status,
      setStatus,
      campaign,
      setCampaign,
      clearFilters: () => {
        setSearch("");
        setStatus("");
        setCampaign("");
      },
      filtered: rows,
    },
    table: {
      rows,
      sort,
      setSort,
      page,
      setPage,
      pageSize,
      setPageSize,
      pageCount,
      total,
    },
    loading,
  };
}

function AdsTable({
  rows,
  campaigns,
  onOpen,
  initialStatus,
  days,
  source,
  pagination,
}: {
  rows: Creative[];
  campaigns: Campaign[];
  onOpen: (entity: SelectedEntity) => void;
  initialStatus?: string;
  days: number;
  source: WorkspaceSnapshot["source"];
  pagination?: WorkspaceSnapshot["pagination"];
}) {
  const serverEnabled = source === "live" && pagination?.entity === "ads";
  const defaultStatus = initialStatus || "ENABLED";
  const localFilters = useEntityFilters(
    serverEnabled ? "ads-local-fallback" : "ads",
    rows,
    adSearch,
    adStatus,
    defaultStatus,
  );
  const localTable = usePagedEntities(
    localFilters.filtered,
    (item) => item.adName,
  );
  const server = useServerAds({
    enabled: serverEnabled,
    initialRows: rows,
    initialPagination: pagination,
    initialStatus: defaultStatus,
    days,
  });
  const filters = serverEnabled ? server.filters : localFilters;
  const table = serverEnabled ? server.table : localTable;
  const campaignNames = [
    ...new Set(campaigns.map((item) => item.campaignName)),
  ];
  return (
    <EntitySection
      eyebrow="Creative control"
      title="Ads & creatives"
      description="Inspect full copy, final URLs, Google policy state, ad strength, provenance and performance."
    >
      <FilterBar
        {...filters}
        campaigns={campaignNames}
        clearFilters={() => {
          filters.clearFilters();
          filters.setStatus("ENABLED");
        }}
        extra={
          <>
            <SortSelect value={table.sort} onChange={table.setSort} />
            <button
              type="button"
              aria-pressed={filters.status === "REMOVED"}
              onClick={() =>
                filters.setStatus(
                  filters.status === "REMOVED" ? "ENABLED" : "REMOVED",
                )
              }
              className="flex h-11 items-center justify-center rounded-xl border px-3 text-sm font-bold"
              style={{
                borderColor: "var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              Show removed
            </button>
          </>
        }
        onExport={() =>
          exportRows(
            "google-ads-creatives.csv",
            filters.filtered as unknown as Array<Record<string, unknown>>,
          )
        }
      />
      {serverEnabled && server.loading && (
        <p
          role="status"
          className="flex min-h-11 items-center gap-2 rounded-xl border px-3 text-xs font-bold"
          style={{
            borderColor: "var(--border-subtle)",
            color: "var(--text-muted)",
          }}
        >
          <Loader2 size={14} className="animate-spin" />
          Updating this page of ads…
        </p>
      )}
      <div className="space-y-3 md:hidden">
        {table.rows.map((item) => (
          <MobileEntityCard
            key={item.id}
            href={detailHref("ads", item.adId)}
            title={item.adName || `Ad ${item.adId}`}
            eyebrow={labelize(item.adType)}
            status={item.status || item.primaryStatus}
            relationship={[item.campaignName, item.adGroupName]
              .filter(Boolean)
              .join(" · ")}
            description={`Approval: ${labelize(item.approvalStatus)}${item.finalUrl ? ` · ${item.finalUrl}` : ""}`}
            metrics={[
              { label: "Spend", value: money(item.cost) },
              { label: "Clicks", value: number(item.clicks) },
              { label: "Conversions", value: number(item.conversions) },
              {
                label: "CTR",
                value: item.impressions
                  ? pct((item.clicks / item.impressions) * 100)
                  : "—",
              },
              {
                label: "CPA",
                value: item.conversions
                  ? money(item.cost / item.conversions)
                  : "—",
              },
              {
                label: "ROAS",
                value: roas(item.roas, item.conversionValueAvailable !== false),
              },
            ]}
            synchronized={
              item.lastSynced || item.date
                ? new Date(item.lastSynced || item.date).toLocaleDateString()
                : undefined
            }
            actionLabel="Open ad"
          />
        ))}
      </div>
      <DataTable
        columns={[
          "Ad",
          "Campaign / ad group",
          "Delivery",
          "Effective status",
          "Approval",
          "Review",
          "Strength",
          "Final URL",
          "Impressions",
          "Clicks",
          "CTR",
          "Spend",
          "Conversions",
          "CPA",
          "ROAS",
          "Last synchronized",
        ]}
      >
        {table.rows.map((item) => (
          <tr
            key={item.id}
            onClick={() => onOpen({ kind: "ad", value: item })}
            className="cursor-pointer border-b"
          >
            <NameCell
              title={item.adName || `Ad ${item.adId}`}
              id={item.adId}
              resource={item.resourceName || item.adGroupAdResourceName}
              note={labelize(item.adType)}
              href={detailHref("ads", item.adId)}
            />
            <td>
              <strong>{item.campaignName}</strong>
              {item.adGroupName && <small>{item.adGroupName}</small>}
            </td>
            <td>
              <StatusBadge value={item.status || item.primaryStatus} />
            </td>
            <td>
              {item.primaryStatus ? (
                <StatusBadge value={item.primaryStatus} />
              ) : (
                "—"
              )}
            </td>
            <td>
              {item.approvalStatus ? (
                <StatusBadge value={item.approvalStatus} />
              ) : (
                "—"
              )}
            </td>
            <td>
              {item.reviewStatus ? (
                <StatusBadge value={item.reviewStatus} />
              ) : (
                "—"
              )}
            </td>
            <td>
              {item.strength ? <StatusBadge value={item.strength} /> : "—"}
            </td>
            <td>
              <span
                className="block max-w-48 truncate text-xs"
                title={item.finalUrl}
              >
                {item.finalUrl || "—"}
              </span>
            </td>
            <MetricCell value={number(item.impressions)} />
            <MetricCell value={number(item.clicks)} />
            <MetricCell
              value={
                item.impressions
                  ? pct((item.clicks / item.impressions) * 100)
                  : "—"
              }
            />
            <MetricCell value={money(item.cost)} />
            <MetricCell value={number(item.conversions)} />
            <MetricCell
              value={
                item.conversions ? money(item.cost / item.conversions) : "—"
              }
            />
            <td className="font-bold" style={{ color: "var(--success-text)" }}>
              {roas(item.roas, item.conversionValueAvailable !== false)}
            </td>
            <MetricCell
              value={
                item.lastSynced || item.date
                  ? new Date(item.lastSynced || item.date).toLocaleDateString()
                  : "—"
              }
            />
          </tr>
        ))}
      </DataTable>
      <PageControls
        page={table.page}
        pageCount={table.pageCount}
        pageSize={table.pageSize}
        total={table.total}
        onChange={table.setPage}
        onPageSizeChange={table.setPageSize}
      />
      {!filters.filtered.length && (
        <EmptyState
          title="No ads match these filters"
          body="Try another approval state or refresh live inventory. Paused and zero-impression ads are included by ID."
        />
      )}
    </EntitySection>
  );
}

const keywordSearch = (row: Keyword) =>
  `${row.keywordText} ${row.criterionId} ${row.resourceName} ${row.campaignName} ${row.adGroupName}`;
const keywordStatus = (row: Keyword) =>
  `${row.status} ${row.negative ? "NEGATIVE" : "ACTIVE"}`;
function KeywordsTable({
  rows,
  campaigns,
  onOpen,
}: {
  rows: Keyword[];
  campaigns: Campaign[];
  onOpen: (entity: SelectedEntity) => void;
}) {
  const filters = useEntityFilters(
    "keywords",
    rows,
    keywordSearch,
    keywordStatus,
  );
  const [match, setMatch] = useState("");
  const displayed = useMemo(
    () =>
      filters.filtered.filter(
        (row) =>
          !match || (row.negative ? "NEGATIVE" : row.matchType) === match,
      ),
    [filters.filtered, match],
  );
  const table = usePagedEntities(displayed, (item) => item.keywordText);
  const campaignNames = [
    ...new Set(campaigns.map((item) => item.campaignName)),
  ];
  const keywordInsights = useMemo(
    () => ({
      wasted: rows.filter((item) => item.cost >= 50 && !item.conversions)
        .length,
      converting: rows.filter((item) => item.conversions > 0).length,
      negative: rows.filter((item) => item.negative).length,
    }),
    [rows],
  );
  return (
    <EntitySection
      eyebrow="Intent structure"
      title="Keywords"
      description="Group and filter by campaign, ad group, match type, status and negative targeting while keeping criterion IDs visible."
    >
      <FilterBar
        {...filters}
        campaigns={campaignNames}
        extra={
          <>
            <select
              aria-label="Filter match type"
              value={match}
              onChange={(event) => setMatch(event.target.value)}
              className="h-11 rounded-xl border px-3 text-sm"
            >
              <option value="">All match types</option>
              <option value="EXACT">Exact</option>
              <option value="PHRASE">Phrase</option>
              <option value="BROAD">Broad</option>
              <option value="NEGATIVE">Negative</option>
            </select>
            {match && (
              <button
                type="button"
                onClick={() => setMatch("")}
                className="h-11 rounded-xl border px-3 text-sm font-bold"
                style={{ color: "var(--brand-primary-strong)" }}
              >
                Clear match filter
              </button>
            )}
            <SortSelect value={table.sort} onChange={table.setSort} />
          </>
        }
        onExport={() =>
          exportRows(
            "google-ads-keywords.csv",
            displayed as unknown as Array<Record<string, unknown>>,
          )
        }
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <InsightStrip
          label="High spend, no conversion"
          value={keywordInsights.wasted}
          tone="danger"
        />
        <InsightStrip
          label="Top converting"
          value={keywordInsights.converting}
          tone="teal"
        />
        <InsightStrip
          label="Negative keywords"
          value={keywordInsights.negative}
          tone="blue"
        />
      </div>
      <div className="space-y-3 md:hidden">
        {table.rows.map((item) => (
          <MobileEntityCard
            key={item.id}
            href={detailHref("keywords", item.criterionId || item.id)}
            title={item.keywordText}
            eyebrow={
              item.negative ? "Negative keyword" : labelize(item.matchType)
            }
            status={item.status}
            relationship={[item.campaignName, item.adGroupName]
              .filter(Boolean)
              .join(" · ")}
            metrics={[
              { label: "Spend", value: money(item.cost) },
              { label: "Clicks", value: number(item.clicks) },
              { label: "Conversions", value: number(item.conversions) },
              {
                label: "CTR",
                value: item.impressions
                  ? pct((item.clicks / item.impressions) * 100)
                  : "—",
              },
              {
                label: "CPA",
                value: item.conversions
                  ? money(item.cost / item.conversions)
                  : "—",
              },
              {
                label: "Quality",
                value: item.qualityScore ? `${item.qualityScore}/10` : "—",
              },
            ]}
            synchronized={
              item.pulledAt
                ? new Date(item.pulledAt).toLocaleDateString()
                : undefined
            }
            actionLabel="Open keyword"
          />
        ))}
      </div>
      <DataTable
        columns={[
          "Keyword",
          "Match type",
          "Status",
          "Campaign / ad group",
          "Quality",
          "Impressions",
          "Clicks",
          "CTR",
          "Spend",
          "Avg CPC",
          "Conversions",
          "CPA",
          "ROAS",
          "Search IS",
          "Last synchronized",
        ]}
      >
        {table.rows.map((item) => (
          <tr
            key={item.id}
            onClick={() => onOpen({ kind: "keyword", value: item })}
            className="cursor-pointer border-b"
          >
            <NameCell
              title={item.keywordText}
              id={item.criterionId || item.id}
              resource={item.resourceName}
              href={detailHref("keywords", item.criterionId || item.id)}
            />
            <td>
              <StatusBadge
                value={item.negative ? "Negative" : item.matchType}
              />
            </td>
            <td>{item.status ? <StatusBadge value={item.status} /> : "—"}</td>
            <td>
              <strong>{item.campaignName}</strong>
              {item.adGroupName && <small>{item.adGroupName}</small>}
            </td>
            <MetricCell
              value={item.qualityScore ? `${item.qualityScore}/10` : "—"}
              note={labelize(item.creativeQuality)}
            />
            <MetricCell value={number(item.impressions)} />
            <MetricCell value={number(item.clicks)} />
            <MetricCell
              value={
                item.impressions
                  ? pct((item.clicks / item.impressions) * 100)
                  : "—"
              }
            />
            <MetricCell value={money(item.cost)} />
            <MetricCell
              value={item.clicks ? money(item.cost / item.clicks) : "—"}
            />
            <MetricCell value={number(item.conversions)} />
            <MetricCell
              value={
                item.conversions ? money(item.cost / item.conversions) : "—"
              }
            />
            <td className="font-bold" style={{ color: "var(--success-text)" }}>
              {roas(item.roas, item.conversionValueAvailable !== false)}
            </td>
            <MetricCell
              value={
                item.searchImpressionShare == null
                  ? "—"
                  : pct(item.searchImpressionShare)
              }
            />
            <MetricCell
              value={
                item.pulledAt
                  ? new Date(item.pulledAt).toLocaleDateString()
                  : "—"
              }
            />
          </tr>
        ))}
      </DataTable>
      <PageControls
        page={table.page}
        pageCount={table.pageCount}
        pageSize={table.pageSize}
        total={table.total}
        onChange={table.setPage}
        onPageSizeChange={table.setPageSize}
      />
      {!displayed.length && (
        <EmptyState
          title="No keywords match these filters"
          body="Clear match type, campaign or status filters to widen the inventory."
        />
      )}
    </EntitySection>
  );
}

function InsightStrip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "danger" | "teal" | "blue";
}) {
  const color =
    tone === "danger"
      ? "var(--danger-text)"
      : tone === "teal"
        ? "var(--success-text)"
        : "var(--info-text)";
  const bg =
    tone === "danger"
      ? "var(--danger-bg)"
      : tone === "teal"
        ? "var(--success-bg)"
        : "var(--info-bg)";
  return (
    <div
      className="flex items-center justify-between rounded-xl border p-3"
      style={{ background: bg, borderColor: "var(--border-subtle)" }}
    >
      <span className="text-xs font-bold" style={{ color }}>
        {label}
      </span>
      <strong className="text-lg" style={{ color }}>
        {value}
      </strong>
    </div>
  );
}

function PublishingWorkflow() {
  const stages = [
    ["Draft / review", "Airtable", "Copy and approvals checked"],
    ["Publishing", "Make / API", "Idempotent request in flight"],
    ["Published paused", "Google Ads", "Resource ID confirmed"],
    ["Approved paused", "Policy", "Ready for activation"],
    ["Enabled / running", "Delivery", "Serving eligible traffic"],
  ];
  return (
    <div className="space-y-5">
      <EntitySection
        eyebrow="Operational control"
        title="Publishing workflow"
        description="Follow each proposed ad from review through a verified paused Google resource, policy approval and activation."
      >
        <div className="grid gap-2 lg:grid-cols-5">
          {stages.map(([title, system, body], index) => (
            <div
              key={title}
              className="relative rounded-xl border p-3"
              style={{
                background: "var(--surface-1)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="grid size-6 place-items-center rounded-full text-[10px] font-bold"
                  style={{
                    background: "var(--brand-primary-soft)",
                    color: "var(--brand-primary-strong)",
                  }}
                >
                  {index + 1}
                </span>
                {index < stages.length - 1 && (
                  <ArrowRight
                    size={14}
                    style={{ color: "var(--text-muted)" }}
                  />
                )}
              </div>
              <p className="mt-3 text-sm font-bold">{title}</p>
              <p
                className="mt-1 text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "var(--brand-primary-strong)" }}
              >
                {system}
              </p>
              <p
                className="mt-1 text-xs leading-5"
                style={{ color: "var(--text-muted)" }}
              >
                {body}
              </p>
            </div>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <InsightStrip
            label="Failure path: retry with same key"
            value={1}
            tone="danger"
          />
          <InsightStrip
            label="Duplicate path: compare resources"
            value={1}
            tone="blue"
          />
          <InsightStrip
            label="Success path: verify paused"
            value={1}
            tone="teal"
          />
        </div>
      </EntitySection>
      <PendingAdsPanel />
    </div>
  );
}

function EntitySection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <p
          className="text-[10px] font-bold uppercase tracking-[.16em]"
          style={{ color: "var(--brand-primary-strong)" }}
        >
          {eyebrow}
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">{title}</h2>
        <p
          className="mt-1 max-w-3xl text-sm leading-6"
          style={{ color: "var(--text-muted)" }}
        >
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}
type ResponsiveColumn = {
  key: string;
  label: string;
  minWidth: number;
  align: "left" | "center" | "right";
  priority: "primary" | "secondary" | "tertiary";
};

function columnMetadata(label: string): ResponsiveColumn {
  const key = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const numericColumn =
    /spend|budget|impressions|clicks|ctr|cpc|conversion|cpa|roas|quality|inventory|search is/i.test(
      label,
    );
  const primary = /^(campaign|ad group|ad|keyword)$/i.test(label);
  const relationship = /parent|campaign \/ ad group|final url|bidding/i.test(
    label,
  );
  return {
    key,
    label,
    minWidth: primary ? 240 : relationship ? 190 : numericColumn ? 112 : 132,
    align: numericColumn
      ? "right"
      : /status|delivery|approval|review|strength|type/i.test(label)
        ? "center"
        : "left",
    priority: primary
      ? "primary"
      : numericColumn || /status|delivery|parent/i.test(label)
        ? "secondary"
        : "tertiary",
  };
}

function DataTable({
  columns,
  children,
}: {
  columns: Array<string | ResponsiveColumn>;
  children: React.ReactNode;
}) {
  const resolvedColumns = columns.map((column) =>
    typeof column === "string" ? columnMetadata(column) : column,
  );
  return (
    <div
      className="google-ads-table-shell hidden max-h-[70vh] w-full min-w-0 max-w-full overflow-auto overscroll-x-contain rounded-2xl border md:block"
      style={{
        borderColor: "var(--border-subtle)",
        background: "var(--surface-1)",
      }}
      tabIndex={0}
      aria-label="Scrollable Google Ads data table"
    >
      <table className="google-ads-table w-full min-w-max table-auto border-separate border-spacing-0 text-left text-[13px] tabular-nums">
        <thead>
          <tr>
            {resolvedColumns.map((column) => (
              <th
                key={column.key}
                scope="col"
                data-priority={column.priority}
                style={{
                  minWidth: column.minWidth,
                  textAlign: column.align,
                }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
function NameCell({
  title,
  id,
  resource,
  note,
  href,
}: {
  title: string;
  id: string;
  resource?: string;
  note?: string;
  href?: string;
}) {
  return (
    <td className="max-w-64">
      {href ? (
        <RangeLink
          href={href}
          onClick={(event) => event.stopPropagation()}
          className="block break-words text-sm font-bold leading-5 hover:underline"
          title={title}
        >
          {title || "Unnamed entity"}
        </RangeLink>
      ) : (
        <strong className="block break-words text-sm leading-5" title={title}>
          {title || "Unnamed entity"}
        </strong>
      )}
      <small>
        {note ? `${note} · ` : ""}ID {id || "—"}
      </small>
      <ResourceName value={resource} />
    </td>
  );
}
function MetricCell({ value, note }: { value: string; note?: string }) {
  return (
    <td className="text-right">
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </td>
  );
}

/** Loads the (large) search-term report only when this tab is opened. */
function useSearchTerms(campaignScope: string) {
  const searchParams = useSearchParams();
  const rangeKey = searchParams.toString();
  const range = useMemo(() => resolveAdsRange(new URLSearchParams(rangeKey)), [rangeKey]);
  const [state, setState] = useState<{ rows: SearchTerm[]; loading: boolean; error: string | null }>({ rows: [], loading: true, error: null });
  useEffect(() => {
    const controller = new AbortController();
    setState((current) => ({ ...current, loading: true, error: null }));
    void fetch(`/api/google-ads/airtable-workspace?days=${range.days}&from=${range.from}&to=${range.to}&view=search-terms`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = (await response.json()) as { searchTerms?: SearchTerm[]; error?: string };
        if (!response.ok) throw new Error(data.error || "Search terms could not load");
        setState({ rows: data.searchTerms ?? [], loading: false, error: null });
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({ rows: [], loading: false, error: error instanceof Error ? error.message : String(error) });
      });
    return () => controller.abort();
  }, [range]);
  const rows = useMemo(
    () => (campaignScope ? state.rows.filter((row) => row.campaignId === campaignScope) : state.rows),
    [campaignScope, state.rows],
  );
  return { ...state, rows };
}

function SearchTermsTable({ campaignScope }: { campaignScope: string }) {
  const { rows, loading, error } = useSearchTerms(campaignScope);
  const sorted = useMemo(() => [...rows].sort((a, b) => b.cost - a.cost), [rows]);
  if (loading) return <LoadingBlock label="Loading search terms" />;
  if (error) return <EmptyState title="Search terms could not load" body={error} />;
  return (
    <EntitySection
      eyebrow="Query intelligence"
      title="Search terms"
      description="The real searches that triggered your ads. Rows with spend and no conversions are highlighted as possible negative keywords."
    >
      <DataTable columns={["Search term", "Matched keyword", "Match type", "Campaign / ad group", "Spend", "Impressions", "Clicks", "CTR", "Conversions"]}>
        {sorted.map((item) => {
          const wasted = item.cost > 0 && !item.conversions;
          return (
            <tr key={item.id} className="border-b" style={wasted ? { background: "var(--warning-bg)" } : undefined}>
              <td className="max-w-64"><strong className="block break-words text-sm">{item.term}</strong>{item.status && item.status !== "NONE" && <small>{labelize(item.status)}</small>}</td>
              <td>{item.matchedKeyword || "—"}</td>
              <td className="text-center">{labelize(item.matchType)}</td>
              <td><small>{item.campaignName} · {item.adGroupName}</small></td>
              <MetricCell value={money(item.cost)} />
              <MetricCell value={number(item.impressions)} />
              <MetricCell value={number(item.clicks)} />
              <MetricCell value={item.impressions ? pct((item.clicks / item.impressions) * 100) : "—"} />
              <MetricCell value={number(item.conversions)} />
            </tr>
          );
        })}
      </DataTable>
      {!rows.length && <EmptyState title="No search terms in this range" body="Run the Make 'Google Ads Search Terms' scenario for these dates to fill this view." />}
    </EntitySection>
  );
}

function ConversionsTab({ rows }: { rows: ConversionActionRow[] }) {
  const byAction = useMemo(() => {
    const map = new Map<string, ConversionActionRow>();
    for (const row of rows) {
      const current = map.get(row.actionId);
      map.set(row.actionId, current ? { ...current, conversions: current.conversions + row.conversions, conversionValue: current.conversionValue + row.conversionValue, allConversions: current.allConversions + row.allConversions, allConversionValue: current.allConversionValue + row.allConversionValue } : { ...row });
    }
    return [...map.values()].sort((a, b) => b.allConversions - a.allConversions);
  }, [rows]);
  return (
    <EntitySection
      eyebrow="Measurement"
      title="Conversions by action"
      description="Which conversion actions Google Ads counted in this range. 'Conversions' are the ones used for bidding; 'All conversions' include secondary actions."
    >
      <DataTable columns={["Conversion action", "Category", "Conversions", "Conv. value", "All conversions", "All conv. value"]}>
        {byAction.map((item) => (
          <tr key={item.actionId} className="border-b">
            <td><strong className="text-sm">{item.actionName}</strong><small>ID {item.actionId}</small></td>
            <td className="text-center">{labelize(item.category)}</td>
            <MetricCell value={number(item.conversions)} />
            <MetricCell value={money(item.conversionValue)} />
            <MetricCell value={number(item.allConversions)} />
            <MetricCell value={money(item.allConversionValue)} />
          </tr>
        ))}
      </DataTable>
      {!rows.length && <EmptyState title="No conversions in this range" body="Run the Make 'Google Ads Conversion Actions' scenario for these dates to fill this view." />}
    </EntitySection>
  );
}

export default function GoogleAdsWorkspace({
  snapshot,
  activeTab,
  setTab,
  statusFilter,
  campaignScope = "",
  days,
}: {
  snapshot: WorkspaceSnapshot;
  activeTab: WorkspaceTab;
  setTab: (tab: WorkspaceTab, status?: string, campaign?: string | null) => void;
  statusFilter?: string;
  campaignScope?: string;
  days: number;
}) {
  const scopedCampaign = snapshot.campaigns.find((item) => item.campaignId === campaignScope);
  // Child levels are limited to the scoped campaign, like the Google Ads left-hand tree.
  const scoped = useMemo(() => {
    if (!campaignScope) return snapshot;
    const inScope = (item: { campaignId: string }) => item.campaignId === campaignScope;
    return {
      ...snapshot,
      adGroups: snapshot.adGroups.filter(inScope),
      ads: snapshot.ads.filter(inScope),
      keywords: snapshot.keywords.filter(inScope),
      searchTerms: snapshot.searchTerms.filter(inScope),
      conversionActions: snapshot.conversionActions?.filter(inScope),
    };
  }, [campaignScope, snapshot]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabScroller = useRef<HTMLDivElement>(null);
  const [tabOverflow, setTabOverflow] = useState({ left: false, right: false });
  const updateTabOverflow = useCallback(() => {
    const node = tabScroller.current;
    if (!node) return;
    setTabOverflow({
      left: node.scrollLeft > 2,
      right: node.scrollLeft + node.clientWidth < node.scrollWidth - 2,
    });
  }, []);
  useEffect(() => {
    const node = tabScroller.current;
    const active = node?.querySelector<HTMLElement>("[aria-current='page']");
    active?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
    const frame = window.requestAnimationFrame(updateTabOverflow);
    window.addEventListener("resize", updateTabOverflow);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateTabOverflow);
    };
  }, [activeTab, updateTabOverflow]);
  const open = (entity: SelectedEntity) => {
    const id =
      entity.kind === "campaign"
        ? entity.value.campaignId
        : entity.kind === "ad-group"
          ? entity.value.adGroupId
          : entity.kind === "ad"
            ? entity.value.adId
            : entity.value.criterionId || entity.value.id;
    const segment =
      entity.kind === "campaign"
        ? "campaigns"
        : entity.kind === "ad-group"
          ? "ad-groups"
          : entity.kind === "ad"
            ? "ads"
            : "keywords";
    router.push(withRange(`/google-ads-analytics/${segment}/${encodeURIComponent(id)}`, new URLSearchParams(searchParams.toString())));
  };
  return (
    <div className="google-ads-workspace w-full min-w-0 max-w-full space-y-5">
      <div
        className="relative sticky top-0 z-20 -mx-1 border-b backdrop-blur-xl"
        style={{
          background: "color-mix(in srgb, var(--background) 90%, transparent)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <div
          ref={tabScroller}
          onScroll={updateTabOverflow}
          className="google-ads-tabs overflow-x-auto px-1"
        >
          <nav
            aria-label="Google Ads workspace sections"
            role="tablist"
            className="flex min-w-max gap-1 py-2"
          >
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                role="tab"
                onClick={() => setTab(id)}
                aria-selected={activeTab === id}
                aria-current={activeTab === id ? "page" : undefined}
                className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-xs font-bold transition-colors"
                style={{
                  color:
                    activeTab === id
                      ? "var(--brand-primary-strong)"
                      : "var(--text-muted)",
                  background:
                    activeTab === id
                      ? "var(--brand-primary-soft)"
                      : "transparent",
                }}
              >
                <Icon size={14} />
                {label}
                {id === "workflow" && (
                  <span
                    className="size-1.5 rounded-full"
                    style={{ background: "var(--warning)" }}
                  />
                )}
              </button>
            ))}
          </nav>
        </div>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-8 transition-opacity"
          style={{
            opacity: tabOverflow.left ? 1 : 0,
            background:
              "linear-gradient(to right, var(--background), transparent)",
          }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-8 transition-opacity"
          style={{
            opacity: tabOverflow.right ? 1 : 0,
            background:
              "linear-gradient(to left, var(--background), transparent)",
          }}
        />
      </div>
      {campaignScope && activeTab !== "campaigns" && (
        <div
          className="flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 text-xs"
          style={{ borderColor: "var(--brand-primary)", background: "var(--brand-primary-soft)" }}
        >
          <span style={{ color: "var(--text-muted)" }}>Showing only</span>
          <strong style={{ color: "var(--brand-primary-strong)" }}>
            Campaign: {scopedCampaign?.campaignName ?? campaignScope}
          </strong>
          <button
            onClick={() => setTab(activeTab, undefined, null)}
            className="ml-auto min-h-9 rounded-lg border px-3 font-bold"
            style={{ borderColor: "var(--border-subtle)", background: "var(--surface-1)" }}
          >
            Show all campaigns
          </button>
        </div>
      )}
      {activeTab === "overview" && (
        <Overview snapshot={snapshot} setTab={setTab} onOpen={open} />
      )}
      {activeTab === "campaigns" && (
        <CampaignsTable
          rows={snapshot.campaigns}
          adGroups={snapshot.adGroups}
          ads={snapshot.ads}
          keywords={snapshot.keywords}
          onOpen={open}
          onScope={(campaignId) => setTab("ad-groups", undefined, campaignId)}
        />
      )}
      {activeTab === "ad-groups" && (
        <AdGroupsTable
          rows={scoped.adGroups}
          campaigns={snapshot.campaigns}
          ads={scoped.ads}
          keywords={scoped.keywords}
          onOpen={open}
        />
      )}
      {activeTab === "ads" && (
        <AdsTable
          rows={scoped.ads}
          campaigns={snapshot.campaigns}
          onOpen={open}
          initialStatus={statusFilter}
          days={days}
          source={snapshot.source}
          pagination={snapshot.pagination}
        />
      )}
      {activeTab === "keywords" && (
        <KeywordsTable
          rows={scoped.keywords}
          campaigns={snapshot.campaigns}
          onOpen={open}
        />
      )}
      {activeTab === "search-terms" && <SearchTermsTable campaignScope={campaignScope} />}
      {activeTab === "conversions" && <ConversionsTab rows={scoped.conversionActions ?? []} />}
      {activeTab === "workflow" && <PublishingWorkflow />}
      {activeTab === "ai-suggestions" && (
        <AISuggestionsTab
          campaigns={snapshot.campaigns}
          creatives={snapshot.ads}
          keywords={snapshot.keywords}
          days={days}
        />
      )}
    </div>
  );
}
