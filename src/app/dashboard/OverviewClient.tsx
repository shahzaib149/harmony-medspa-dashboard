"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ContactRound,
  Database,
  ExternalLink,
  MessageCircleReply,
  RefreshCw,
  Send,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Sparkline from "@/components/overview/Sparkline";
import { getCachedData, setCachedData } from "@/lib/dashboard-data-cache";
import { useAuth } from "@/contexts/AuthContext";
import type {
  AttentionItem,
  CampaignHealth,
  ClinicMetric,
  FailedSmsAlert,
  LeadFunnelStage,
  LeadTrendPoint,
  NurtureJourneyStep,
  OverviewMetric,
  OverviewPeriodKey,
  OverviewResponse,
  RecentActivityItem,
} from "@/lib/overview-types";

const ChartFallback = ({ height = 300 }: { height?: number }) => (
  <div className="w-full animate-pulse rounded-xl bg-[var(--surface-2)]" style={{ height }} />
);

const GrowthTrendChart = dynamic(
  () => import("@/components/overview/OverviewCharts").then((m) => m.GrowthTrendChart),
  { ssr: false, loading: () => <ChartFallback height={340} /> },
);
const LeadSourceChart = dynamic(
  () => import("@/components/overview/OverviewCharts").then((m) => m.LeadSourceChart),
  { ssr: false, loading: () => <ChartFallback height={220} /> },
);
const DeliveryChart = dynamic(
  () => import("@/components/overview/OverviewCharts").then((m) => m.DeliveryChart),
  { ssr: false, loading: () => <ChartFallback height={240} /> },
);
const GoogleAdsChart = dynamic(
  () => import("@/components/overview/OverviewCharts").then((m) => m.GoogleAdsChart),
  { ssr: false, loading: () => <ChartFallback height={220} /> },
);
const ClinicMetricsChart = dynamic(
  () => import("@/components/overview/OverviewCharts").then((m) => m.ClinicMetricsChart),
  { ssr: false, loading: () => <ChartFallback height={240} /> },
);

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
const integer = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

const RANGE_OPTIONS: Array<{ key: OverviewPeriodKey; label: string; full: string }> = [
  { key: "7d", label: "7D", full: "Last 7 days" },
  { key: "30d", label: "30D", full: "Last 30 days" },
  { key: "90d", label: "90D", full: "Last 90 days" },
  { key: "month", label: "Month", full: "This month" },
];

const SUPPORTED = new Set<OverviewPeriodKey>(["7d", "30d", "90d", "month"]);

function rangeFromLocation(fallback: OverviewPeriodKey): OverviewPeriodKey {
  if (typeof window === "undefined") return fallback;
  const value = new URLSearchParams(window.location.search).get("range");
  return SUPPORTED.has(value as OverviewPeriodKey) ? (value as OverviewPeriodKey) : fallback;
}

function formatDateTime(value: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  }).format(date);
}

function formatRelative(value: string, now: number) {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return "Time unavailable";
  const seconds = Math.max(0, Math.round((now - time) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(time));
}

function formatSpeed(value: number | null) {
  if (value === null) return "—";
  if (value < 60) return `${value}s`;
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return seconds ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

export default function OverviewClient({ initialRange = "30d" }: { initialRange?: OverviewPeriodKey }) {
  const [period, setPeriod] = useState<OverviewPeriodKey>(initialRange);
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const dataRef = useRef<OverviewResponse | null>(null);
  const requestId = useRef(0);
  const requestAbort = useRef<AbortController | null>(null);
  const inFlightRange = useRef<OverviewPeriodKey | null>(null);

  const load = useCallback(async (nextPeriod: OverviewPeriodKey) => {
    if (inFlightRange.current === nextPeriod) return;
    requestAbort.current?.abort();
    const controller = new AbortController();
    requestAbort.current = controller;
    inFlightRange.current = nextPeriod;
    const id = ++requestId.current;
    if (dataRef.current) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/overview?range=${nextPeriod}`, {
        cache: "no-store",
        credentials: "same-origin",
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]),
      });
      const body = (await response.json()) as OverviewResponse & { error?: string; message?: string };
      if (!response.ok) throw new Error(body.message || body.error || "Overview data could not be loaded");
      if (requestId.current !== id) return;
      dataRef.current = body;
      setData(body);
      setCachedData(`overview:${nextPeriod}`, body);
    } catch (event) {
      if (requestId.current !== id) return;
      if (event instanceof DOMException && event.name === "AbortError") return;
      setError(event instanceof Error ? event.message : "Overview data could not be loaded");
    } finally {
      if (requestAbort.current === controller) {
        requestAbort.current = null;
        inFlightRange.current = null;
      }
      if (requestId.current === id) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const cached = getCachedData<OverviewResponse>(`overview:${period}`);
    if (cached) {
      dataRef.current = cached;
      setData(cached);
      setLoading(false);
    }
    void load(period);
    return () => {
      requestAbort.current?.abort();
      requestAbort.current = null;
      inFlightRange.current = null;
    };
  }, [load, period]);

  // Confirmed-success removal: once Airtable has accepted the review, drop the
  // alert from local state instantly instead of paying for a full overview
  // refetch. Keeps the ref and the cache in sync so the change survives a range
  // switch and back.
  const removeFailedSmsAlert = useCallback(
    (id: string) => {
      const current = dataRef.current;
      if (!current) return;
      const remaining = current.failedSmsAlerts.filter((alert) => alert.id !== id);
      if (remaining.length === current.failedSmsAlerts.length) return;
      const count = remaining.length;
      const attentionItems = current.attentionItems
        .map((item) =>
          item.id === "failed-sms"
            ? { ...item, count, title: `${count} SMS ${count === 1 ? "message needs" : "messages need"} review` }
            : item,
        )
        .filter((item) => !(item.id === "failed-sms" && count === 0));
      const next: OverviewResponse = {
        ...current,
        failedSmsAlerts: remaining,
        attentionItems,
        reviewedSmsCount: current.reviewedSmsCount + 1,
      };
      dataRef.current = next;
      setData(next);
      setCachedData(`overview:${period}`, next);
    },
    [period],
  );

  // Keep the range in the URL so refresh, back and forward all restore it.
  const selectRange = useCallback(
    (next: OverviewPeriodKey) => {
      setPeriod((current) => {
        if (current === next) return current;
        window.history.pushState(null, "", `/dashboard?range=${next}`);
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    const onPopState = () => setPeriod(rangeFromLocation(initialRange));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [initialRange]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") void load(period);
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [load, period]);

  const headerActions = (
    <div className="flex items-center gap-2.5">
      {refreshing && (
        <RefreshCw size={15} className="animate-spin text-[var(--text-muted)]" aria-label="Refreshing overview" />
      )}
      <RangeControl value={period} onChange={selectRange} />
    </div>
  );

  return (
    <DashboardLayout
      title="Growth Command Center"
      subtitle="Live patient-growth analytics"
      actions={headerActions}
    >
      {loading && !data ? (
        <OverviewSkeleton />
      ) : !data ? (
        <OverviewErrorState message={error} onRetry={() => void load(period)} />
      ) : (
        <OverviewContent data={data} refreshing={refreshing} refreshError={error} onRetry={() => void load(period)} onReviewFailedSms={removeFailedSmsAlert} />
      )}
    </DashboardLayout>
  );
}

function RangeControl({
  value,
  onChange,
}: {
  value: OverviewPeriodKey;
  onChange: (next: OverviewPeriodKey) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Overview date range"
      className="inline-flex items-center gap-0.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-0.5"
    >
      <CalendarDays size={14} className="ml-1.5 mr-0.5 hidden text-[var(--brand-primary)] sm:block" aria-hidden="true" />
      {RANGE_OPTIONS.map((option) => {
        const active = option.key === value;
        return (
          <button
            key={option.key}
            role="tab"
            aria-selected={active}
            title={option.full}
            onClick={() => onChange(option.key)}
            className={`min-h-9 rounded-lg px-2.5 text-xs font-bold transition-colors sm:px-3 ${
              active
                ? "bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Page composition ─────────────────────────────────────────────────────── */

function OverviewContent({
  data,
  refreshing,
  refreshError,
  onRetry,
  onReviewFailedSms,
}: {
  data: OverviewResponse;
  refreshing: boolean;
  refreshError: string;
  onRetry: () => void;
  onReviewFailedSms: (id: string) => void;
}) {
  const [failureReviewOpen, setFailureReviewOpen] = useState(false);
  const activityNow = Date.parse(data.period.to);
  const trend = data.leadTrend;
  const seriesFrom = (pick: (p: LeadTrendPoint) => number) => trend.map(pick);

  const s = data.leadSummary;
  const kpis: Array<{
    label: string;
    metric: OverviewMetric;
    display: string;
    icon: LucideIcon;
    tone: "brand" | "teal" | "blue";
    series?: number[];
    seriesColor?: string;
    invert?: boolean;
  }> = [
    { label: "Total leads", metric: s.total, display: integer.format(s.total.value ?? 0), icon: Users, tone: "brand", series: seriesFrom((p) => p.leads), seriesColor: "var(--chart-leads)" },
    { label: "Contacted", metric: s.contacted, display: integer.format(s.contacted.value ?? 0), icon: ContactRound, tone: "teal", series: seriesFrom((p) => p.contacted), seriesColor: "var(--chart-6)" },
    { label: "Replied", metric: s.replied, display: integer.format(s.replied.value ?? 0), icon: MessageCircleReply, tone: "blue", series: seriesFrom((p) => p.replied), seriesColor: "var(--chart-replied)" },
    { label: "Booked", metric: s.booked, display: integer.format(s.booked.value ?? 0), icon: UserCheck, tone: "teal", series: seriesFrom((p) => p.booked), seriesColor: "var(--chart-booked)" },
    { label: "Booking conversion", metric: s.bookingRate, display: s.bookingRate.value === null ? "—" : `${s.bookingRate.value}%`, icon: TrendingUp, tone: "brand" },
    { label: "Avg speed-to-lead", metric: s.averageSpeedSeconds, display: formatSpeed(s.averageSpeedSeconds.value), icon: Clock3, tone: "blue", invert: true },
  ];

  return (
    <div className={`mx-auto max-w-[1600px] transition-opacity ${refreshing ? "opacity-70" : "opacity-100"}`} aria-busy={refreshing}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--brand-primary)]">Growth pulse</p>
          <h2 className="overview-display mt-1 text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">
            Patient growth at a glance
          </h2>
        </div>
        <span className="text-xs text-[var(--text-muted)]">
          {data.period.label} · through {formatDateTime(data.updatedAt)}
        </span>
      </div>

      {refreshError && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--warning-border)] bg-[var(--warning-bg)] px-4 py-3 text-sm text-[var(--warning-text)]">
          <span>{refreshError} Existing analytics are still shown.</span>
          <button onClick={onRetry} className="min-h-9 rounded-lg px-3 font-semibold hover:bg-black/5 dark:hover:bg-white/5">
            Retry
          </button>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map((item) => (
          <KpiCard key={item.label} {...item} previousLabel={data.period.previousLabel} />
        ))}
      </div>

      {/* Analytical grid */}
      <div className="mt-4 grid grid-cols-12 gap-4">
        {/* Attention — first on mobile, tucked right on desktop */}
        <Panel title="Attention required" eyebrow="Daily operations" icon={AlertTriangle} className="order-1 col-span-12 lg:order-none lg:col-span-6 xl:col-span-4">
          {data.errors.leads || data.errors.campaigns || data.errors.delivery ? (
            <SectionError message={data.errors.leads || data.errors.campaigns || data.errors.delivery!} onRetry={onRetry} />
          ) : (
            <AttentionPanel
              items={data.attentionItems}
              reviewedSmsCount={data.reviewedSmsCount}
              onReviewFailure={() => setFailureReviewOpen(true)}
            />
          )}
        </Panel>

        {/* Growth trend — hero, above the fold */}
        <Panel
          title="Patient growth trend"
          eyebrow={`New, replied and booked leads · ${data.period.label}`}
          icon={TrendingUp}
          className="order-2 col-span-12 lg:col-span-8 xl:col-span-8"
          error={data.errors.leads}
          onRetry={onRetry}
        >
          <GrowthTrendChart data={trend} />
        </Panel>

        {/* Conversion funnel */}
        <Panel title="Lead conversion funnel" eyebrow="Where leads advance or stall" icon={TrendingUp} className="order-3 col-span-12 lg:col-span-6 xl:col-span-4" error={data.errors.leads} onRetry={onRetry}>
          <VisualFunnel stages={data.leadFunnel} previousLabel="previous stage" />
        </Panel>

        {/* Lead sources */}
        <Panel title="Lead source performance" eyebrow="Acquisition quality" icon={Users} className="order-6 col-span-12 lg:col-span-6 xl:col-span-4" error={data.errors.leads} onRetry={onRetry}>
          <LeadSourceSection sources={data.sourcePerformance} periodLabel={data.period.label} />
        </Panel>

        {/* Campaign journey */}
        <Panel title="Campaign journey" eyebrow="14-Day Nurture distribution" icon={Zap} className="order-4 col-span-12 lg:col-span-6 xl:col-span-4" error={data.errors.campaigns} onRetry={onRetry}>
          <CampaignJourney journey={data.nurtureJourney} campaigns={data.campaignHealth} deliveryError={data.errors.delivery} />
        </Panel>

        {/* Delivery health */}
        <Panel title="Message delivery health" eyebrow={data.period.label} icon={Send} className="order-5 col-span-12 lg:col-span-6 xl:col-span-4" error={data.errors.delivery} onRetry={onRetry}>
          <DeliverySection delivery={data.deliveryHealth} />
        </Panel>

        {/* Clinic metrics */}
        <Panel title="Visits & new patients" eyebrow="Recorded clinic totals" icon={Activity} className="order-7 col-span-12 lg:col-span-6 xl:col-span-4" error={data.errors.clinic} onRetry={onRetry}>
          <ClinicSection metrics={data.clinicMetrics} />
        </Panel>

        {/* Google Ads */}
        <Panel title="Google Ads performance" eyebrow={data.period.label} icon={TrendingUp} className="order-8 col-span-12 lg:col-span-6 xl:col-span-4" error={data.errors.googleAds} onRetry={onRetry}>
          <GoogleAdsSection summary={data.googleAdsSummary} />
        </Panel>

        {/* Activity heatmap */}
        <Panel title="Operational activity" eyebrow="Leads, campaigns and messages by day" icon={Activity} className="order-9 col-span-12 lg:col-span-6 xl:col-span-8">
          <ActivityHeatmap days={data.activityByDay} />
        </Panel>

        {/* Recent activity — secondary */}
        <Panel
          title="Recent activity"
          eyebrow="Latest meaningful changes"
          icon={Database}
          className="order-10 col-span-12 xl:col-span-4"
          action={
            data.canViewAuditLog ? (
              <Link href="/audit-log" className="panel-link">
                View Audit Log <ArrowRight size={14} />
              </Link>
            ) : null
          }
        >
          <RecentActivityFeed items={data.recentActivity} now={activityNow} />
        </Panel>
      </div>

      <FailedSmsReviewModal
        open={failureReviewOpen}
        alerts={data.failedSmsAlerts}
        onClose={() => setFailureReviewOpen(false)}
        onReviewed={onReviewFailedSms}
      />
    </div>
  );
}

/* ── KPI card ─────────────────────────────────────────────────────────────── */

function KpiCard({
  label,
  display,
  metric,
  icon: Icon,
  tone,
  series,
  seriesColor,
  previousLabel,
  invert = false,
}: {
  label: string;
  display: string;
  metric: OverviewMetric;
  icon: LucideIcon;
  tone: "brand" | "teal" | "blue";
  series?: number[];
  seriesColor?: string;
  previousLabel: string;
  invert?: boolean;
}) {
  const change = metric.changePercent;
  const good = change !== null && change !== undefined && (invert ? change <= 0 : change >= 0);
  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3.5 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold uppercase leading-4 tracking-[0.1em] text-[var(--text-muted)]">{label}</p>
        <span className={`overview-kpi-icon overview-kpi-icon--${tone}`} aria-hidden="true">
          <Icon size={14} />
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold leading-none tracking-[-0.035em] text-[var(--text-primary)] tabular-nums">
        {display}
      </p>
      <div className="mt-2 flex-1">
        {series && series.some((v) => v > 0) ? (
          <Sparkline values={series} color={seriesColor} />
        ) : null}
      </div>
      {change !== undefined && change !== null ? (
        <p className={`mt-1.5 text-[11px] font-semibold tabular-nums ${good ? "text-[var(--healthy)]" : "text-[var(--danger)]"}`}>
          {change >= 0 ? "↑" : "↓"} {Math.abs(change)}% <span className="font-normal text-[var(--text-muted)]">vs {previousLabel}</span>
        </p>
      ) : (
        <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">No prior comparison</p>
      )}
    </article>
  );
}

/* ── Panel shell ──────────────────────────────────────────────────────────── */

function Panel({
  title,
  eyebrow,
  icon: Icon,
  children,
  className = "",
  action,
  error,
  onRetry,
}: {
  title: string;
  eyebrow: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  error?: string;
  onRetry?: () => void;
}) {
  return (
    <section className={`flex min-w-0 flex-col overflow-hidden rounded-[20px] border border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-[var(--shadow-soft)] ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]" aria-hidden="true">
            <Icon size={15} />
          </span>
          <div className="min-w-0">
            <h2 className="overview-display text-base font-semibold leading-5 text-[var(--text-primary)]">{title}</h2>
            <p className="mt-0.5 text-[11px] leading-4 text-[var(--text-muted)]">{eyebrow}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="flex-1 p-4 sm:p-5">{error ? <SectionError message={error} onRetry={onRetry} /> : children}</div>
    </section>
  );
}

/* ── Lead conversion funnel — real horizontal bars ────────────────────────── */

const FUNNEL_COLORS = ["var(--chart-leads)", "var(--chart-6)", "var(--chart-replied)", "var(--chart-booked)"];

function VisualFunnel({ stages, previousLabel }: { stages: LeadFunnelStage[]; previousLabel: string }) {
  if (!stages.length) {
    return <CompactEmpty icon={TrendingUp} title="No funnel data yet" detail="Lead stages appear once records arrive." />;
  }
  const first = stages[0]?.count ?? 0;
  return (
    <div className="flex h-full flex-col justify-between gap-4" role="list" aria-label="Lead conversion stages">
      {stages.map((stage, index) => {
        const width = first ? Math.max(2, Math.round((stage.count / first) * 100)) : 0;
        return (
          <div key={stage.key} role="listitem">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--text-secondary)]">{stage.label}</span>
              <span className="flex items-baseline gap-2">
                <span className="text-xl font-semibold tabular-nums text-[var(--text-primary)]">{integer.format(stage.count)}</span>
                <span className="text-[11px] text-[var(--text-muted)]">{stage.percentOfFirst}%</span>
              </span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <div className="h-full rounded-full transition-all" style={{ width: `${width}%`, background: FUNNEL_COLORS[index] }} />
            </div>
            {index > 0 && (
              <p className="mt-1 text-[11px] leading-4 text-[var(--text-muted)]">
                {stage.conversionFromPrevious === null ? `No ${previousLabel} volume` : `${stage.conversionFromPrevious}% advanced`}
                {stage.dropOffFromPrevious ? ` · ${integer.format(stage.dropOffFromPrevious)} drop-off` : ""}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Lead source performance ──────────────────────────────────────────────── */

function LeadSourceSection({ sources, periodLabel }: { sources: OverviewResponse["sourcePerformance"]; periodLabel: string }) {
  if (!sources.length) {
    return <CompactEmpty icon={Users} title="No source data in this period" detail="Acquisition sources appear as new leads arrive." />;
  }
  if (sources.length === 1) {
    const source = sources[0];
    return (
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <p className="overview-display truncate text-lg font-semibold text-[var(--text-primary)]" title={source.source}>{source.source}</p>
          <span className="shrink-0 text-xs text-[var(--text-muted)]">only source</span>
        </div>
        <div className="mt-3 h-8 overflow-hidden rounded-lg bg-[var(--surface-2)]">
          <div className="flex h-full items-center rounded-lg bg-[var(--chart-leads)] px-3" style={{ width: "100%" }}>
            <span className="text-xs font-bold text-[var(--primary-foreground)]">{integer.format(source.leads)} leads</span>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-3">
          <SourceStat label="Replied" value={integer.format(source.replied)} />
          <SourceStat label="Booked" value={integer.format(source.booked)} />
          <SourceStat label="Booking rate" value={`${source.conversionRate}%`} />
        </dl>
        <p className="mt-3 text-[11px] leading-4 text-[var(--text-muted)]">
          One source accounts for all lead volume in {periodLabel}.
        </p>
      </div>
    );
  }
  return (
    <div>
      <LeadSourceChart sources={sources} />
      <div className="mt-2 flex items-center gap-4 text-[11px] text-[var(--text-muted)]">
        <span className="flex items-center gap-1.5"><span className="inline-block size-2.5 rounded-full bg-[var(--chart-booked)]" /> Booked</span>
        <span className="flex items-center gap-1.5"><span className="inline-block size-2.5 rounded-full bg-[var(--chart-leads)]" /> Not booked</span>
      </div>
      <table className="mt-3 w-full border-t border-[var(--border-subtle)] text-xs">
        <thead>
          <tr className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-muted)]">
            <th className="py-2 text-left font-semibold">Source</th>
            <th className="py-2 text-right font-semibold">Leads</th>
            <th className="py-2 text-right font-semibold">Replied</th>
            <th className="py-2 text-right font-semibold">Booked</th>
            <th className="py-2 text-right font-semibold">Rate</th>
          </tr>
        </thead>
        <tbody>
          {sources.slice(0, 6).map((s) => (
            <tr key={s.source} className="border-t border-[var(--border-subtle)]">
              <td className="max-w-0 truncate py-1.5 pr-2 font-medium text-[var(--text-primary)]" title={s.source}>{s.source}</td>
              <td className="py-1.5 text-right tabular-nums text-[var(--text-secondary)]">{integer.format(s.leads)}</td>
              <td className="py-1.5 text-right tabular-nums text-[var(--text-secondary)]">{integer.format(s.replied)}</td>
              <td className="py-1.5 text-right tabular-nums text-[var(--text-secondary)]">{integer.format(s.booked)}</td>
              <td className="py-1.5 text-right tabular-nums font-semibold text-[var(--text-primary)]">{s.conversionRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SourceStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dd className="text-lg font-semibold tabular-nums text-[var(--text-primary)]">{value}</dd>
      <dt className="mt-0.5 text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">{label}</dt>
    </div>
  );
}

/* ── Campaign journey ─────────────────────────────────────────────────────── */

function CampaignJourney({
  journey,
  campaigns,
  deliveryError,
}: {
  journey: NurtureJourneyStep[];
  campaigns: CampaignHealth[];
  deliveryError?: string;
}) {
  const speed = campaigns.find((c) => c.slug === "speed-to-lead");
  const nurture = campaigns.find((c) => c.slug === "14-day-nurture");
  const enrolled = nurture?.leadsProcessed ?? 0;
  const steps = journey.filter((j) => j.key !== "completed" && j.key !== "stopped");
  const completed = journey.find((j) => j.key === "completed");
  const stopped = journey.find((j) => j.key === "stopped");
  const maxReached = Math.max(1, ...journey.map((j) => j.reached));

  return (
    <div>
      {speed && (
        <div className="mb-4 grid grid-cols-5 gap-1 rounded-xl bg-[var(--surface-2)] px-2 py-3">
          <SpeedStat label="Leads" value={integer.format(speed.leadsProcessed)} />
          <SpeedStat label="SMS" value={integer.format(speed.smsSent)} />
          <SpeedStat label="Email" value={integer.format(speed.emailsSent)} />
          <SpeedStat label="Failed" value={integer.format(speed.failedMessages)} tone={speed.failedMessages ? "danger" : undefined} />
          <SpeedStat label="Speed" value={formatSpeed(speed.averageFirstContactSeconds)} />
        </div>
      )}

      {deliveryError && (
        <p className="mb-3 rounded-lg border border-[var(--warning-border)] bg-[var(--warning-bg)] p-2.5 text-[11px] text-[var(--warning-text)]">
          Delivery metrics unavailable; enrollment distribution is still shown.
        </p>
      )}

      {enrolled === 0 ? (
        <CompactEmpty icon={Zap} title="No enrollments in this period" detail="Leads appear here as they enter 14-Day Nurture." />
      ) : (
        <>
          <p className="mb-2.5 text-[11px] text-[var(--text-muted)]">{integer.format(enrolled)} enrolled leads · active by step</p>
          <ol className="space-y-2" aria-label="14-Day Nurture journey by step">
            {steps.map((step) => (
              <li key={step.key} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-[11px] font-semibold text-[var(--text-secondary)]">{step.step}</span>
                <div className="h-5 flex-1 overflow-hidden rounded-md bg-[var(--surface-2)]">
                  <div
                    className="flex h-full items-center rounded-md bg-[var(--chart-booked)] px-2"
                    style={{ width: `${Math.max(step.reached ? 6 : 0, Math.round((step.reached / maxReached) * 100))}%` }}
                  >
                    {step.active > 0 && <span className="text-[10px] font-bold text-[var(--primary-foreground)]">{step.active}</span>}
                  </div>
                </div>
                <span className="w-8 shrink-0 text-right text-[11px] tabular-nums text-[var(--text-muted)]">{step.percentage}%</span>
              </li>
            ))}
          </ol>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <JourneyOutcome label="Completed" value={completed?.reached ?? 0} tone="success" />
            <JourneyOutcome label="Stopped" value={stopped?.reached ?? 0} tone={stopped?.reached ? "danger" : "muted"} />
          </div>
        </>
      )}

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
        <Link href="/campaigns/speed-to-lead" className="panel-link">Speed-to-Lead <ArrowRight size={13} /></Link>
        <Link href="/campaigns/14-day-nurture" className="panel-link">14-Day Nurture <ArrowRight size={13} /></Link>
      </div>
    </div>
  );
}

function SpeedStat({ label, value, tone }: { label: string; value: string; tone?: "danger" }) {
  return (
    <div className="min-w-0 text-center">
      <p className={`truncate text-[15px] font-semibold tabular-nums ${tone === "danger" ? "text-[var(--danger)]" : "text-[var(--text-primary)]"}`}>{value}</p>
      <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.04em] text-[var(--text-muted)]">{label}</p>
    </div>
  );
}

function JourneyOutcome({ label, value, tone }: { label: string; value: number; tone: "success" | "danger" | "muted" }) {
  const styles =
    tone === "success"
      ? "border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]"
      : tone === "danger"
        ? "border-[var(--danger-border)] bg-[var(--danger-bg)] text-[var(--danger-text)]"
        : "border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-secondary)]";
  return (
    <div className={`flex items-center justify-between rounded-xl border px-3 py-2 ${styles}`}>
      <span className="text-[11px] font-bold uppercase tracking-[0.08em]">{label}</span>
      <span className="text-lg font-semibold tabular-nums">{integer.format(value)}</span>
    </div>
  );
}

/* ── Delivery ─────────────────────────────────────────────────────────────── */

function DeliverySection({ delivery }: { delivery: OverviewResponse["deliveryHealth"] }) {
  const sms = delivery.channels.find((c) => c.channel === "SMS");
  const email = delivery.channels.find((c) => c.channel === "Email");
  if (!delivery.totalMessages) {
    return (
      <div>
        <div className="mb-3 flex h-24 items-end gap-1.5 rounded-xl bg-[var(--surface-2)] px-4 pb-3" aria-hidden="true">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex-1 rounded-sm bg-[var(--border-subtle)]" style={{ height: "6%" }} />
          ))}
        </div>
        <CompactEmpty
          icon={Send}
          title="No campaign messages in this period"
          detail="Delivery appears once SMS or email records reach the Message Log."
          action={<Link href="/message-logs" className="panel-link">View Conversations <ArrowRight size={13} /></Link>}
        />
      </div>
    );
  }
  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <DeliveryStat label="SMS success" value={sms?.successRate === null || sms?.successRate === undefined ? "—" : `${sms.successRate}%`} />
        <DeliveryStat label="Email success" value={email?.successRate === null || email?.successRate === undefined ? "—" : `${email.successRate}%`} />
        <DeliveryStat label="Total sent" value={integer.format(delivery.successful + delivery.failed + delivery.pending + delivery.unknown)} />
        <DeliveryStat label="Failed" value={integer.format(delivery.failed)} tone={delivery.failed ? "danger" : undefined} />
      </div>
      <DeliveryChart data={delivery.trend} />
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--text-muted)]">
        <span className="flex items-center gap-1.5"><span className="inline-block size-2.5 rounded-full bg-[var(--chart-sms)]" /> SMS</span>
        <span className="flex items-center gap-1.5"><span className="inline-block size-2.5 rounded-full bg-[var(--chart-email)]" /> Email</span>
        <span className="flex items-center gap-1.5"><span className="inline-block size-2.5 rounded-full bg-[var(--chart-warning)]" /> Failed</span>
      </div>
    </div>
  );
}

function DeliveryStat({ label, value, tone }: { label: string; value: string; tone?: "danger" }) {
  return (
    <div className="rounded-xl bg-[var(--surface-2)] px-3 py-2">
      <p className={`text-lg font-semibold tabular-nums ${tone === "danger" ? "text-[var(--danger)]" : "text-[var(--text-primary)]"}`}>{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-[0.06em] text-[var(--text-muted)]">{label}</p>
    </div>
  );
}

/* ── Clinic metrics ───────────────────────────────────────────────────────── */

function ClinicSection({ metrics }: { metrics: ClinicMetric[] }) {
  if (!metrics.length) {
    return (
      <CompactEmpty
        icon={Activity}
        title="No clinic totals recorded"
        detail="Add monthly visits and new patients to track clinic growth."
        action={<Link href="/leads" className="panel-link">Update clinic totals <ArrowRight size={13} /></Link>}
      />
    );
  }
  if (metrics.length === 1) return <SingleMonthClinic metric={metrics[0]} />;
  return <ClinicMetricsChart data={metrics} />;
}

function SingleMonthClinic({ metric }: { metric: ClinicMetric }) {
  const share = metric.totalVisits ? Math.min(100, Math.round((metric.newPatients / metric.totalVisits) * 100)) : 0;
  const label = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${metric.month}-01T00:00:00.000Z`));
  const maxBar = Math.max(metric.totalVisits, 1);
  return (
    <div>
      <p className="text-[11px] font-semibold text-[var(--brand-primary)]">{label} · single recorded month</p>
      <div className="mt-4 space-y-4">
        {[
          { label: "Total visits", value: metric.totalVisits, color: "var(--chart-visits)" },
          { label: "New patients", value: metric.newPatients, color: "var(--chart-new-patients)" },
        ].map((row) => (
          <div key={row.label}>
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">{row.label}</span>
              <span className="text-xl font-semibold tabular-nums text-[var(--text-primary)]">{integer.format(row.value)}</span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <div className="h-full rounded-full" style={{ width: `${Math.max(2, Math.round((row.value / maxBar) * 100))}%`, background: row.color }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] text-[var(--text-muted)]">New patients are {share}% of recorded visits.</p>
    </div>
  );
}

/* ── Google Ads ───────────────────────────────────────────────────────────── */

function GoogleAdsSection({ summary }: { summary: OverviewResponse["googleAdsSummary"] }) {
  if (!summary) {
    return <CompactEmpty icon={TrendingUp} title="Google Ads unavailable" detail="Lead and campaign analytics remain available." />;
  }
  const hasActivity = summary.spend > 0 || summary.clicks > 0 || summary.impressions > 0;
  if (!hasActivity) {
    return (
      <CompactEmpty
        icon={TrendingUp}
        title="No advertising activity in this period"
        detail="Synced analytics show no spend or clicks for this range."
        action={<Link href="/google-ads-analytics" className="panel-link">Open Google Ads <ExternalLink size={13} /></Link>}
      />
    );
  }
  const metrics: Array<[string, string]> = [
    ["Spend", currency.format(summary.spend)],
    ["Clicks", integer.format(summary.clicks)],
    ["CTR", summary.ctr === null ? "—" : `${summary.ctr.toFixed(2)}%`],
    ["Avg CPC", summary.averageCpc === null ? "—" : currency.format(summary.averageCpc)],
    ["Conversions", integer.format(summary.conversions)],
    ["Cost / conv.", summary.costPerConversion === null ? "—" : currency.format(summary.costPerConversion)],
  ];
  return (
    <div>
      {summary.attentionMessage && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-[var(--warning-border)] bg-[var(--warning-bg)] p-2.5 text-[11px] leading-4 text-[var(--warning-text)]">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          {summary.attentionMessage}
        </div>
      )}
      <GoogleAdsChart daily={summary.daily} />
      <dl className="mt-4 grid grid-cols-3 gap-x-3 gap-y-3">
        {metrics.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dd className="truncate text-sm font-semibold text-[var(--text-primary)]" title={value}>{value}</dd>
            <dt className="mt-0.5 text-[10px] uppercase tracking-[0.06em] text-[var(--text-muted)]">{label}</dt>
          </div>
        ))}
      </dl>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-[11px] text-[var(--text-muted)]">Latest sync {formatDateTime(summary.latestSyncAt)}</span>
        <Link href="/google-ads-analytics" className="panel-link">Open Google Ads <ExternalLink size={13} /></Link>
      </div>
    </div>
  );
}

/* ── Activity heatmap — dependency-free calendar grid ─────────────────────── */

function ActivityHeatmap({ days }: { days: OverviewResponse["activityByDay"] }) {
  const total = days.reduce((sum, day) => sum + day.count, 0);
  if (!days.length || total === 0) {
    return <CompactEmpty icon={Activity} title="No operational activity recorded" detail="Lead, campaign and message events appear here as they occur." />;
  }
  const max = Math.max(...days.map((d) => d.count), 1);
  const level = (count: number) => {
    if (count === 0) return 0;
    const ratio = count / max;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  };
  const levelColor = (lvl: number) =>
    lvl === 0
      ? "var(--surface-2)"
      : `color-mix(in srgb, var(--brand-primary) ${lvl * 22 + 12}%, var(--surface-2))`;
  const firstWeekday = (() => {
    const d = new Date(`${days[0].date}T00:00:00`);
    return (d.getDay() + 6) % 7; // Monday = 0
  })();
  const busiest = days.reduce((a, b) => (b.count > a.count ? b : a), days[0]);
  const activeDays = days.filter((d) => d.count > 0).length;
  const weekdayTotals = new Array(7).fill(0);
  days.forEach((d) => {
    const wd = (new Date(`${d.date}T00:00:00`).getDay() + 6) % 7;
    weekdayTotals[wd] += d.count;
  });
  const WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const peakWeekday = WD[weekdayTotals.indexOf(Math.max(...weekdayTotals))];

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <div className="flex items-start gap-2 overflow-x-auto pb-1">
          <div className="grid shrink-0 gap-[4px] pt-[2px] text-[9px] text-[var(--text-muted)]" style={{ gridTemplateRows: "repeat(7, 15px)" }}>
            {["", "Mon", "", "Wed", "", "Fri", ""].map((wlabel, i) => (
              <span key={i} className="flex h-[15px] items-center leading-none">{wlabel}</span>
            ))}
          </div>
          <div
            className="grid grid-flow-col gap-[4px]"
            style={{ gridTemplateRows: "repeat(7, 15px)" }}
            role="img"
            aria-label={`Activity heatmap. ${total} total events across ${days.length} days. Busiest day ${busiest.label} with ${busiest.count} events.`}
          >
            {days.map((day, index) => {
              const lvl = level(day.count);
              return (
                <span
                  key={day.date}
                  title={`${day.label}: ${day.count} ${day.count === 1 ? "event" : "events"}`}
                  className="size-[15px] rounded-[3px]"
                  style={{
                    background: levelColor(lvl),
                    ...(index === 0 ? { gridRowStart: firstWeekday + 1 } : {}),
                  }}
                />
              );
            })}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
          Less
          {[0, 1, 2, 3, 4].map((lvl) => (
            <span key={lvl} className="size-3 rounded-[3px]" style={{ background: levelColor(lvl) }} />
          ))}
          More
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-3 lg:w-56 lg:shrink-0 lg:grid-cols-2">
        <HeatStat label="Total events" value={integer.format(total)} />
        <HeatStat label="Active days" value={`${activeDays}/${days.length}`} />
        <HeatStat label="Busiest day" value={`${busiest.count}`} sub={busiest.label} />
        <HeatStat label="Peak weekday" value={peakWeekday} />
      </dl>
    </div>
  );
}

function HeatStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface-2)] px-3 py-2.5">
      <dd className="text-lg font-semibold tabular-nums text-[var(--text-primary)]">{value}</dd>
      <dt className="mt-0.5 text-[10px] uppercase tracking-[0.06em] text-[var(--text-muted)]">{label}</dt>
      {sub && <p className="mt-0.5 truncate text-[10px] text-[var(--text-muted)]">{sub}</p>}
    </div>
  );
}

/* ── Attention ────────────────────────────────────────────────────────────── */

const MONITORED_SIGNALS: Array<{ label: string; ids: string[] }> = [
  { label: "SMS delivery", ids: ["failed-sms"] },
  { label: "Email delivery", ids: ["failed-email"] },
  { label: "Enrollment integrity", ids: ["disconnected"] },
  { label: "Campaign timing", ids: ["overdue-enrollment"] },
  { label: "Lead response", ids: ["overdue-lead"] },
  { label: "Contact details", ids: ["missing-phone", "missing-email", "duplicates"] },
];

function AttentionPanel({
  items,
  reviewedSmsCount,
  onReviewFailure,
}: {
  items: AttentionItem[];
  reviewedSmsCount: number;
  onReviewFailure: () => void;
}) {
  const flagged = new Set(items.map((item) => item.id));
  return (
    <div className="flex h-full flex-col gap-4">
      {items.length ? (
        <div className="space-y-2.5">
          {items.slice(0, 4).map((item) => {
            const iconWrap = `mt-0.5 grid size-7 shrink-0 place-items-center rounded-full ${item.severity === "critical" ? "bg-[var(--danger-bg)] text-[var(--danger-text)]" : "bg-[var(--warning-bg)] text-[var(--warning-text)]"}`;
            const shell = "flex w-full items-start gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3 text-left transition-colors hover:bg-[var(--surface-hover)]";
            const inner = (
              <>
                <span className={iconWrap}>
                  <AlertTriangle size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</p>
                  <p className="mt-0.5 text-[11px] leading-4 text-[var(--text-muted)]">{item.detail}</p>
                </div>
                <ArrowRight size={14} className="mt-0.5 shrink-0 text-[var(--text-muted)]" />
              </>
            );
            // Failed SMS opens the in-place review flow rather than navigating away.
            if (item.id === "failed-sms") {
              return (
                <button key={item.id} type="button" onClick={onReviewFailure} className={shell}>
                  {inner}
                </button>
              );
            }
            return (
              <Link key={item.id} href={item.href} className={shell}>
                {inner}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] p-3.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--surface-1)] text-[var(--success-text)]">
            <CheckCircle2 size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold text-[var(--success-text)]">Everything looks healthy</p>
            <p className="mt-0.5 text-[11px] leading-4 text-[var(--text-secondary)]">No failed messages, overdue steps, or disconnected enrollments.</p>
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">Monitored signals</p>
        <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {MONITORED_SIGNALS.map((signal) => {
            const warn = signal.ids.some((id) => flagged.has(id));
            return (
              <li key={signal.label} className="flex items-center gap-2 rounded-lg bg-[var(--surface-2)] px-2.5 py-2">
                {warn ? (
                  <AlertTriangle size={13} className="shrink-0 text-[var(--warning-text)]" />
                ) : (
                  <CheckCircle2 size={13} className="shrink-0 text-[var(--success-text)]" />
                )}
                <span className="truncate text-[11px] font-medium text-[var(--text-secondary)]">{signal.label}</span>
              </li>
            );
          })}
        </ul>
        {reviewedSmsCount > 0 && (
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
            <CheckCircle2 size={12} className="shrink-0 text-[var(--success-text)]" />
            {reviewedSmsCount} delivery {reviewedSmsCount === 1 ? "issue" : "issues"} reviewed in the last 30 days
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Failed SMS review ────────────────────────────────────────────────────── */

function maskedOrPlaceholder(value: string | null) {
  return value && value.trim() ? value : "Not available";
}

function FailedSmsReviewModal({
  open,
  alerts,
  onClose,
  onReviewed,
}: {
  open: boolean;
  alerts: FailedSmsAlert[];
  onClose: () => void;
  onReviewed: (id: string) => void;
}) {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const review = useCallback(
    async (id: string) => {
      setPendingId(id);
      setErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      try {
        const response = await fetch("/api/airtable/message-logs", {
          method: "PATCH",
          credentials: "same-origin",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "review", id }),
          signal: AbortSignal.timeout(20_000),
        });
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        // Do not remove the alert unless Airtable confirmed the update.
        if (!response.ok) throw new Error(body.error || "The review could not be saved.");
        // Confirmed success — drop it locally (no full overview refetch).
        onReviewed(id);
      } catch (event) {
        const message =
          event instanceof DOMException && event.name === "TimeoutError"
            ? "The review timed out. Please try again."
            : event instanceof Error
              ? event.message
              : "The review could not be saved.";
        setErrors((prev) => ({ ...prev, [id]: message }));
      } finally {
        setPendingId(null);
      }
    },
    [onReviewed],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sms-review-title"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden border border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-[var(--shadow-modal)] sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-[var(--danger-bg)] text-[var(--danger-text)]">
              <AlertTriangle size={15} />
            </span>
            <div className="min-w-0">
              <h2 id="sms-review-title" className="text-base font-semibold text-[var(--text-primary)]">SMS delivery failures</h2>
              <p className="mt-0.5 text-[11px] leading-4 text-[var(--text-muted)]">Review each failure. The campaign continues to its next scheduled step.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg px-2 py-1 text-lg leading-none text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
          >
            ×
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
          {alerts.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] p-3.5">
              <CheckCircle2 size={18} className="shrink-0 text-[var(--success-text)]" />
              <p className="text-sm font-semibold text-[var(--success-text)]">All delivery failures have been reviewed.</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{alert.leadName}</p>
                  <span className="shrink-0 rounded-full bg-[var(--danger-bg)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--danger-text)]">
                    {alert.deliveryStatus}
                  </span>
                </div>
                <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1.5 text-[11px] sm:grid-cols-2">
                  <ReviewField label="Phone" value={maskedOrPlaceholder(alert.phoneMasked)} />
                  <ReviewField label="Sent" value={formatDateTime(alert.sentAt)} />
                  <ReviewField label="Campaign" value={maskedOrPlaceholder(alert.sequence)} />
                  <ReviewField label="Step" value={maskedOrPlaceholder(alert.sequenceStep)} />
                  <ReviewField label="Provider reason" value={maskedOrPlaceholder(alert.errorReason)} full />
                </dl>

                {errors[alert.id] && (
                  <p className="mt-2 rounded-lg bg-[var(--danger-bg)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--danger-text)]">
                    {errors[alert.id]}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {alert.leadHref && (
                    <Link href={alert.leadHref} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] px-3 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]">
                      Open Lead <ExternalLink size={12} />
                    </Link>
                  )}
                  <Link href={alert.messageLogHref} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] px-3 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]">
                    Open Message Log <ExternalLink size={12} />
                  </Link>
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => void review(alert.id)}
                      disabled={pendingId === alert.id}
                      className="ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[var(--brand-primary)] px-3 text-xs font-bold text-white hover:opacity-90 disabled:opacity-60"
                    >
                      {pendingId === alert.id ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" /> Saving…
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={12} /> Mark as reviewed
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="ml-auto text-[11px] font-medium text-[var(--text-muted)]">Admin review required</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewField({ label, value, full = false }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <dt className="text-[10px] uppercase tracking-[0.06em] text-[var(--text-muted)]">{label}</dt>
      <dd className="mt-0.5 break-words font-medium text-[var(--text-secondary)]">{value}</dd>
    </div>
  );
}

/* ── Recent activity ──────────────────────────────────────────────────────── */

const activityIcons: Record<RecentActivityItem["category"], LucideIcon> = {
  lead: Users,
  campaign: Zap,
  message: Send,
  clinic: Activity,
  audit: ShieldCheck,
};

function RecentActivityFeed({ items, now }: { items: RecentActivityItem[]; now: number }) {
  if (!items.length) {
    return <CompactEmpty icon={Database} title="No recent activity" detail="Lead, campaign and message updates appear here." />;
  }
  return (
    <ol className="space-y-1">
      {items.slice(0, 6).map((item) => {
        const Icon = activityIcons[item.category];
        const body = (
          <>
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--surface-2)] text-[var(--brand-primary)]">
              <Icon size={14} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium leading-5 text-[var(--text-primary)]">{item.title}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-[var(--text-muted)]">
                <span className="truncate">{item.actor}</span>
                <span aria-hidden="true">·</span>
                <time dateTime={item.occurredAt}>{formatRelative(item.occurredAt, now)}</time>
              </p>
            </div>
          </>
        );
        return (
          <li key={item.id}>
            {item.href ? (
              <Link href={item.href} className="flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-[var(--surface-hover)]">{body}</Link>
            ) : (
              <div className="flex items-center gap-3 p-1.5">{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ── Shared states ────────────────────────────────────────────────────────── */

function CompactEmpty({
  icon: Icon,
  title,
  detail,
  action,
}: {
  icon: LucideIcon;
  title: string;
  detail: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-2)] p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--surface-1)] text-[var(--brand-primary)]">
        <Icon size={17} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
        <p className="mt-0.5 text-[11px] leading-4 text-[var(--text-muted)]">{detail}</p>
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}

function SectionError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-[var(--warning-border)] bg-[var(--warning-bg)] p-4">
      <div className="flex items-start gap-2.5">
        <AlertTriangle size={17} className="mt-0.5 shrink-0 text-[var(--warning-text)]" />
        <div>
          <p className="text-sm font-semibold text-[var(--warning-text)]">{message}</p>
          <p className="mt-0.5 text-[11px] text-[var(--warning-text)]">Other analytics remain available.</p>
        </div>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="min-h-9 rounded-lg border border-[var(--warning-border)] px-3 text-xs font-bold text-[var(--warning-text)] hover:bg-black/5 dark:hover:bg-white/5">
          Retry section
        </button>
      )}
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="mx-auto max-w-[1600px]" aria-label="Loading Growth Command Center" role="status">
      <div className="space-y-2">
        <div className="h-3 w-24 animate-pulse rounded bg-[var(--surface-2)]" />
        <div className="h-7 w-64 animate-pulse rounded bg-[var(--surface-2)]" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)]" />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-12 gap-4">
        <div className="col-span-12 h-72 animate-pulse rounded-[20px] bg-[var(--surface-1)] xl:col-span-4" />
        <div className="col-span-12 h-72 animate-pulse rounded-[20px] bg-[var(--surface-1)] xl:col-span-8" />
        <div className="col-span-12 h-72 animate-pulse rounded-[20px] bg-[var(--surface-1)] xl:col-span-4" />
        <div className="col-span-12 h-72 animate-pulse rounded-[20px] bg-[var(--surface-1)] xl:col-span-4" />
        <div className="col-span-12 h-72 animate-pulse rounded-[20px] bg-[var(--surface-1)] xl:col-span-4" />
      </div>
      <span className="sr-only">Loading lead, campaign, delivery, clinic and advertising analytics.</span>
    </div>
  );
}

function OverviewErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center text-center">
      <span className="grid size-14 place-items-center rounded-full bg-[var(--danger-bg)] text-[var(--danger-text)]">
        <AlertTriangle size={24} />
      </span>
      <h2 className="overview-display mt-5 text-2xl font-semibold text-[var(--text-primary)]">The Overview could not be loaded</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{message || "The dashboard data request did not complete."}</p>
      <button onClick={onRetry} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 text-sm font-bold text-[var(--primary-foreground)]">
        <RefreshCw size={15} /> Retry Overview
      </button>
    </div>
  );
}
