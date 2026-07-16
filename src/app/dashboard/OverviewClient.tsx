"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  ContactRound,
  Database,
  ExternalLink,
  Mail,
  Megaphone,
  MessageCircleReply,
  MousePointerClick,
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
import type {
  AttentionItem,
  CampaignHealth,
  ClinicMetric,
  DeliveryChannelHealth,
  OverviewMetric,
  OverviewPeriodKey,
  OverviewResponse,
  RecentActivityItem,
} from "@/lib/overview-types";

const LeadTrendChart = dynamic(
  () => import("@/components/overview/OverviewCharts").then((module) => module.LeadTrendChart),
  { ssr: false, loading: () => <ChartSkeleton /> },
);
const ClinicMetricsChart = dynamic(
  () => import("@/components/overview/OverviewCharts").then((module) => module.ClinicMetricsChart),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
const integer = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

function ChartSkeleton() {
  return <div className="h-[250px] animate-pulse rounded-xl bg-[var(--surface-2)] sm:h-[280px]" />;
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
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(time),
  );
}

function formatSpeed(value: number | null) {
  if (value === null) return "Not available";
  if (value < 60) return `${value}s`;
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return seconds ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

function valueOrUnavailable(metric: OverviewMetric, suffix = "") {
  return metric.value === null ? "Not available" : `${integer.format(metric.value)}${suffix}`;
}

export default function OverviewClient() {
  const [period, setPeriod] = useState<OverviewPeriodKey>("month");
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const dataRef = useRef<OverviewResponse | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async (nextPeriod: OverviewPeriodKey) => {
    const id = ++requestId.current;
    if (dataRef.current) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/overview?period=${nextPeriod}`, {
        cache: "no-store",
        credentials: "same-origin",
      });
      const body = (await response.json()) as OverviewResponse & { error?: string };
      if (!response.ok) throw new Error(body.error || "Overview data could not be loaded");
      if (requestId.current !== id) return;
      dataRef.current = body;
      setData(body);
    } catch (event) {
      if (requestId.current !== id) return;
      setError(event instanceof Error ? event.message : "Overview data could not be loaded");
    } finally {
      if (requestId.current === id) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void load(period);
  }, [load, period]);

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
    <div className="flex items-center gap-2">
      {data?.updatedAt && (
        <span className="hidden items-center gap-1.5 text-xs text-[var(--text-muted)] xl:flex">
          <span className="size-1.5 rounded-full bg-[var(--healthy)]" aria-hidden="true" />
          Data through {formatDateTime(data.updatedAt)}
        </span>
      )}
      <label className="relative">
        <span className="sr-only">Overview date range</span>
        <CalendarDays
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--brand-primary)]"
          aria-hidden="true"
        />
        <select
          value={period}
          onChange={(event) => setPeriod(event.target.value as OverviewPeriodKey)}
          className="h-11 min-w-[132px] appearance-none rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] py-0 pl-9 pr-7 text-xs font-semibold text-[var(--text-primary)]"
        >
          <option value="month">Current month</option>
          <option value="30d">Last 30 days</option>
        </select>
      </label>
      {refreshing && <RefreshCw size={15} className="animate-spin text-[var(--text-muted)]" aria-label="Refreshing overview" />}
    </div>
  );

  return (
    <DashboardLayout
      title="Growth Command Center"
      subtitle="Live patient-growth and clinic operations"
      actions={headerActions}
    >
      {loading && !data ? (
        <OverviewSkeleton />
      ) : !data ? (
        <OverviewErrorState message={error} onRetry={() => void load(period)} />
      ) : (
        <OverviewContent
          data={data}
          refreshing={refreshing}
          refreshError={error}
          onRetry={() => void load(period)}
        />
      )}
    </DashboardLayout>
  );
}

function OverviewContent({
  data,
  refreshing,
  refreshError,
  onRetry,
}: {
  data: OverviewResponse;
  refreshing: boolean;
  refreshError: string;
  onRetry: () => void;
}) {
  const activityNow = Date.parse(data.period.to);
  const trendActivityDays = data.leadTrend.filter(
    (point) => point.leads > 0 || point.replied > 0 || point.booked > 0,
  );
  const attentionError = data.errors.leads || data.errors.campaigns || data.errors.delivery;
  const total = data.leadSummary.total.value ?? 0;
  const contacted = data.leadSummary.contacted.value ?? 0;
  const replied = data.leadSummary.replied.value ?? 0;
  const booked = data.leadSummary.booked.value ?? 0;
  const kpis: Array<{
    label: string;
    value: string;
    context: string;
    icon: LucideIcon;
    tone: "brand" | "teal" | "blue";
    comparison?: number | null;
  }> = [
    {
      label: "Total leads",
      value: valueOrUnavailable(data.leadSummary.total),
      context: `${integer.format(total)} recorded in ${data.period.label}`,
      icon: Users,
      tone: "brand",
      comparison: data.leadSummary.total.changePercent,
    },
    {
      label: "Contacted leads",
      value: valueOrUnavailable(data.leadSummary.contacted),
      context: total ? `${Math.round((contacted / total) * 100)}% of leads contacted` : "No leads in this period",
      icon: ContactRound,
      tone: "teal",
    },
    {
      label: "Replied leads",
      value: valueOrUnavailable(data.leadSummary.replied),
      context: contacted ? `${Math.round((replied / contacted) * 100)}% of contacted leads` : "No contacted leads yet",
      icon: MessageCircleReply,
      tone: "blue",
    },
    {
      label: "Booked leads",
      value: valueOrUnavailable(data.leadSummary.booked),
      context: replied ? `${Math.round((booked / replied) * 100)}% of replies booked` : "No replies booked yet",
      icon: UserCheck,
      tone: "teal",
    },
    {
      label: "Booking conversion",
      value: valueOrUnavailable(data.leadSummary.bookingRate, "%"),
      context: "Booked leads ÷ total leads",
      icon: TrendingUp,
      tone: "brand",
    },
    {
      label: "Average speed-to-lead",
      value: formatSpeed(data.leadSummary.averageSpeedSeconds.value),
      context: "First successful Speed-to-Lead message",
      icon: Clock3,
      tone: "blue",
    },
  ];

  return (
    <div className={`mx-auto max-w-[1680px] space-y-5 ${refreshing ? "opacity-[0.985]" : ""}`} aria-busy={refreshing}>
      {refreshError && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--warning-border)] bg-[var(--warning-bg)] px-4 py-3 text-sm text-[var(--warning-text)]">
          <span>{refreshError} Existing overview data is still shown.</span>
          <button onClick={onRetry} className="min-h-11 rounded-lg px-3 font-semibold hover:bg-black/5 dark:hover:bg-white/5">
            Retry
          </button>
        </div>
      )}

      <section aria-labelledby="growth-summary-title">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--brand-primary)]">Growth pulse</p>
            <h2 id="growth-summary-title" className="overview-display mt-1 text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">
              Patient growth at a glance
            </h2>
          </div>
          <span className="hidden text-xs text-[var(--text-muted)] sm:inline">{data.period.label}</span>
        </div>
        <div className="overview-command-kpis grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {kpis.map((item) => (
            <GrowthKpi key={item.label} {...item} previousLabel={data.period.previousLabel} />
          ))}
        </div>
      </section>

      <div className="overview-command-grid grid min-w-0 grid-cols-12 gap-5">
        <Panel
          title="Attention required"
          eyebrow="Daily operations"
          icon={AlertTriangle}
          className="order-[1] col-span-12 lg:order-[8] lg:col-span-5"
        >
          {attentionError ? (
            <SectionError message={attentionError} onRetry={onRetry} />
          ) : (
            <AttentionRequiredPanel items={data.attentionItems} />
          )}
        </Panel>

        <Panel
          title="Lead conversion funnel"
          eyebrow="Where leads move—or stall"
          icon={TrendingUp}
          className="order-[2] col-span-12 lg:order-[2] lg:col-span-5"
          error={data.errors.leads}
          onRetry={onRetry}
        >
          <LeadConversionFunnel stages={data.leadFunnel} />
        </Panel>

        <Panel
          title="Lead trend"
          eyebrow={`${data.period.label} · cohort by lead-created date`}
          icon={BarChart3}
          className="order-[3] col-span-12 lg:order-[3] lg:col-span-7"
          error={data.errors.leads}
          onRetry={onRetry}
        >
          {trendActivityDays.length >= 2 ? (
            <LeadTrendChart data={data.leadTrend} />
          ) : trendActivityDays.length === 1 ? (
            <LimitedTrendState point={trendActivityDays[0]} />
          ) : (
            <EmptyState icon={BarChart3} title="No lead history in this period" detail="Lead activity will appear here after new records arrive." />
          )}
        </Panel>

        <Panel
          title="Campaign health"
          eyebrow="Built campaigns only"
          icon={Zap}
          className="order-[4] col-span-12 lg:order-[5] lg:col-span-7"
          error={data.errors.campaigns}
          onRetry={onRetry}
        >
          <CampaignHealthPanel campaigns={data.campaignHealth} deliveryError={data.errors.delivery} />
        </Panel>

        <Panel
          title="Message delivery health"
          eyebrow={data.period.label}
          icon={Send}
          className="order-[5] col-span-12 lg:order-[7] lg:col-span-5"
          error={data.errors.delivery}
          onRetry={onRetry}
        >
          <DeliveryHealthPanel channels={data.deliveryHealth.channels} total={data.deliveryHealth.totalMessages} successRate={data.deliveryHealth.successRate} />
        </Panel>

        <Panel
          title="Lead source performance"
          eyebrow="Acquisition quality"
          icon={Megaphone}
          className="order-[6] col-span-12 lg:order-[4] lg:col-span-5"
          error={data.errors.leads}
          onRetry={onRetry}
        >
          <LeadSourcePerformance sources={data.sourcePerformance} />
        </Panel>

        <Panel
          title="Visits vs new patients"
          eyebrow="Recorded clinic totals"
          icon={Activity}
          className="order-[7] col-span-12 lg:order-[6] lg:col-span-7"
          error={data.errors.clinic}
          onRetry={onRetry}
        >
          <ClinicPerformance metrics={data.clinicMetrics} />
        </Panel>

        <Panel
          title="Google Ads summary"
          eyebrow={data.period.label}
          icon={CircleDollarSign}
          className="order-[8] col-span-12 lg:order-[7] lg:col-span-7"
          error={data.errors.googleAds}
          onRetry={onRetry}
        >
          <GoogleAdsPanel summary={data.googleAdsSummary} />
        </Panel>

        <Panel
          title="Recent activity"
          eyebrow="Latest meaningful changes"
          icon={Database}
          className="order-[9] col-span-12 lg:order-[9]"
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
    </div>
  );
}

function GrowthKpi({
  label,
  value,
  context,
  icon: Icon,
  tone,
  comparison,
  previousLabel,
}: {
  label: string;
  value: string;
  context: string;
  icon: LucideIcon;
  tone: "brand" | "teal" | "blue";
  comparison?: number | null;
  previousLabel: string;
}) {
  return (
    <article className="group min-w-0 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3.5 shadow-[var(--shadow-soft)] sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold uppercase leading-4 tracking-[0.1em] text-[var(--text-muted)]">{label}</p>
        <span className={`overview-kpi-icon overview-kpi-icon--${tone}`} aria-hidden="true">
          <Icon size={15} />
        </span>
      </div>
      <p className={`mt-3 break-words text-2xl font-semibold leading-none tracking-[-0.035em] text-[var(--text-primary)] ${value === "Not available" ? "text-lg tracking-normal" : "sm:text-[1.75rem]"}`}>
        {value}
      </p>
      {comparison !== undefined && comparison !== null ? (
        <p className={`mt-2 text-[11px] font-semibold ${comparison >= 0 ? "text-[var(--healthy)]" : "text-[var(--danger)]"}`}>
          {comparison >= 0 ? "↑" : "↓"} {Math.abs(comparison)}% vs {previousLabel}
        </p>
      ) : (
        <p className="mt-2 text-[11px] leading-4 text-[var(--text-muted)]">{context}</p>
      )}
    </article>
  );
}

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
    <section className={`min-w-0 overflow-hidden rounded-[20px] border border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-[var(--shadow-soft)] ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]" aria-hidden="true">
            <Icon size={16} />
          </span>
          <div className="min-w-0">
            <h2 className="overview-display text-lg font-semibold leading-6 text-[var(--text-primary)] sm:text-xl">{title}</h2>
            <p className="mt-0.5 text-[11px] leading-4 text-[var(--text-muted)]">{eyebrow}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="p-4 sm:p-5">{error ? <SectionError message={error} onRetry={onRetry} /> : children}</div>
    </section>
  );
}

function LeadConversionFunnel({ stages }: { stages: OverviewResponse["leadFunnel"] }) {
  if (!stages.length) return <EmptyState icon={TrendingUp} title="No funnel data available" detail="Lead stages will appear after records are available." />;
  const max = Math.max(...stages.map((stage) => stage.count), 1);
  return (
    <div className="harmony-journey-line" role="list" aria-label="Lead conversion stages">
      {stages.map((stage, index) => (
        <div key={stage.key} className="harmony-journey-stage" role="listitem">
          <div className="harmony-journey-marker" aria-hidden="true">
            <span style={{ transform: `scale(${Math.max(0.42, stage.count / max)})` }} />
          </div>
          <div className="min-w-0 flex-1 md:text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">{stage.label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">{integer.format(stage.count)}</p>
            {index > 0 && (
              <p className="mt-1 text-[11px] leading-4 text-[var(--text-muted)]">
                {stage.conversionFromPrevious === null ? "No prior-stage volume" : `${stage.conversionFromPrevious}% advanced`}
                {stage.dropOffFromPrevious ? ` · ${stage.dropOffFromPrevious} drop-off` : ""}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function LimitedTrendState({ point }: { point: OverviewResponse["leadTrend"][number] }) {
  return (
    <div className="rounded-2xl bg-[var(--surface-2)] p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">Limited history</p>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">A trend needs activity on at least two dates. Current data is concentrated on {point.label}.</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[["New leads", point.leads], ["Replied", point.replied], ["Booked", point.booked]].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3 text-center">
            <p className="text-lg font-semibold text-[var(--text-primary)]">{value}</p>
            <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeadSourcePerformance({ sources }: { sources: OverviewResponse["sourcePerformance"] }) {
  if (!sources.length) return <EmptyState icon={Megaphone} title="No source data in this period" detail="Acquisition sources will appear as new leads arrive." />;
  if (sources.length === 1) {
    const source = sources[0];
    return (
      <div className="rounded-2xl bg-[var(--surface-2)] p-4 sm:p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--brand-primary)]">Only lead source</p>
        <p className="overview-display mt-2 text-2xl font-semibold text-[var(--text-primary)]">{source.source}</p>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <SourceStat label="Leads" value={source.leads} />
          <SourceStat label="Booked" value={source.booked} />
          <SourceStat label="Conversion" value={`${source.conversionRate}%`} />
        </div>
        <p className="mt-4 text-xs leading-5 text-[var(--text-muted)]">A chart is hidden because one source accounts for {source.share}% of lead volume.</p>
      </div>
    );
  }
  const max = Math.max(...sources.map((source) => source.leads), 1);
  return (
    <div className="space-y-4">
      {sources.map((source) => (
        <div key={source.source}>
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="truncate font-semibold text-[var(--text-primary)]">{source.source}</span>
            <span className="shrink-0 text-[var(--text-muted)]">{source.leads} leads · {source.booked} booked · {source.conversionRate}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div className="h-full rounded-full bg-[var(--chart-leads)]" style={{ width: `${Math.max(4, (source.leads / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SourceStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xl font-semibold text-[var(--text-primary)]">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">{label}</p>
    </div>
  );
}

function CampaignHealthPanel({ campaigns, deliveryError }: { campaigns: CampaignHealth[]; deliveryError?: string }) {
  if (!campaigns.length) return <EmptyState icon={Zap} title="No built campaigns available" detail="Only active or built campaigns appear here." />;
  return (
    <div className="space-y-3">
      {deliveryError && <p className="rounded-xl border border-[var(--warning-border)] bg-[var(--warning-bg)] p-3 text-xs text-[var(--warning-text)]">Delivery metrics are unavailable; campaign enrollment data is still shown.</p>}
      {campaigns.map((campaign) => (
        <article key={campaign.slug} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                {campaign.slug === "speed-to-lead" ? <Zap size={15} className="text-[var(--brand-primary)]" /> : <Mail size={15} className="text-[var(--healthy)]" />}
                <h3 className="font-semibold text-[var(--text-primary)]">{campaign.name}</h3>
              </div>
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">Recent activity {formatDateTime(campaign.lastActivityAt)}</p>
            </div>
            <StatusPill status={campaign.status} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
            <CampaignMetric label="Active leads" value={campaign.slug === "speed-to-lead" ? "Automatic" : campaign.activeLeads} />
            <CampaignMetric label="Messages" value={campaign.messagesSent} />
            <CampaignMetric label="Replies" value={campaign.replies} />
            <CampaignMetric label="Booked" value={campaign.booked} />
            <CampaignMetric label="Delivery" value={campaign.deliverySuccessRate === null ? "Not available" : `${campaign.deliverySuccessRate}%`} />
            <CampaignMetric label="Failed" value={campaign.failedMessages} />
            <div className="col-span-2 sm:col-span-2">
              <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Next due activity</p>
              <p className="mt-1 text-xs font-semibold text-[var(--text-primary)]">{campaign.slug === "speed-to-lead" ? "Triggered by each new lead" : formatDateTime(campaign.nextDueAt)}</p>
            </div>
          </div>
          <Link href={`/campaigns/${campaign.slug}`} className="panel-link mt-4 w-fit">
            View campaign <ArrowRight size={14} />
          </Link>
        </article>
      ))}
    </div>
  );
}

function CampaignMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">{label}</p>
      <p className={`mt-1 font-semibold text-[var(--text-primary)] ${value === "Not available" ? "text-xs" : "text-sm"}`}>{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: CampaignHealth["status"] }) {
  const healthy = status === "Healthy" || status === "Active";
  return (
    <span className={`inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 text-[10px] font-bold uppercase tracking-[0.08em] ${healthy ? "border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-text)]" : "border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-text)]"}`}>
      {healthy ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />} {status}
    </span>
  );
}

function DeliveryHealthPanel({ channels, total, successRate }: { channels: DeliveryChannelHealth[]; total: number; successRate: number | null }) {
  if (!total) {
    return <EmptyState icon={Send} title="No Message Log records in this period" detail="Delivery status is not available until SMS or email records are written to Message Log." action={<Link href="/message-logs" className="panel-link">View Message Log <ArrowRight size={14} /></Link>} />;
  }
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">{successRate === null ? "Not available" : `${successRate}%`}</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Overall known-status delivery success</p>
        </div>
        <ShieldCheck size={28} className="text-[var(--healthy)]" aria-hidden="true" />
      </div>
      <div className="mt-5 space-y-3">
        {channels.map((channel) => (
          <div key={channel.channel} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3.5">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">{channel.channel === "SMS" ? <MessageCircleReply size={15} /> : <Mail size={15} />} {channel.channel}</span>
              <span className="text-xs text-[var(--text-muted)]">{channel.sent} sent</span>
            </div>
            <DeliveryBar channel={channel} />
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[var(--text-muted)]">
              <span>{channel.successful} successful</span><span>{channel.failed} failed</span><span>{channel.pending} pending</span>{channel.unknown > 0 && <span>{channel.unknown} status unavailable</span>}
            </div>
          </div>
        ))}
      </div>
      <Link href="/message-logs" className="panel-link mt-4 w-fit">View campaign messages <ArrowRight size={14} /></Link>
    </div>
  );
}

function DeliveryBar({ channel }: { channel: DeliveryChannelHealth }) {
  if (!channel.sent) return <div className="mt-3 h-2 rounded-full bg-[var(--border-subtle)]" aria-label={`No ${channel.channel} messages`} />;
  const pieces = [[channel.successful, "var(--chart-success)"], [channel.failed, "var(--chart-warning)"], [channel.pending, "var(--chart-email)"], [channel.unknown, "var(--chart-axis)"]] as const;
  return (
    <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-[var(--border-subtle)]" aria-label={`${channel.successful} successful, ${channel.failed} failed, ${channel.pending} pending, ${channel.unknown} status unavailable`}>
      {pieces.map(([count, color], index) => count > 0 && <span key={index} style={{ width: `${(count / channel.sent) * 100}%`, background: color }} />)}
    </div>
  );
}

function ClinicPerformance({ metrics }: { metrics: ClinicMetric[] }) {
  if (!metrics.length) {
    return <EmptyState icon={Activity} title="Clinic totals are not available" detail="No Clinic Metrics rows exist yet. Lead-based projections are intentionally not shown as clinic totals." action={<Link href="/leads" className="panel-link">Update clinic totals <ArrowRight size={14} /></Link>} />;
  }
  if (metrics.length === 1) return <CurrentMonthClinic metric={metrics[0]} />;
  return <ClinicMetricsChart data={metrics} />;
}

function CurrentMonthClinic({ metric }: { metric: ClinicMetric }) {
  const ratio = metric.totalVisits ? Math.min(100, (metric.newPatients / metric.totalVisits) * 100) : 0;
  const label = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${metric.month}-01T00:00:00.000Z`));
  return (
    <div className="rounded-2xl bg-[var(--surface-2)] p-4 sm:p-5">
      <p className="text-xs font-semibold text-[var(--brand-primary)]">Current month comparison · {label}</p>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div><p className="text-3xl font-semibold text-[var(--text-primary)]">{metric.totalVisits}</p><p className="mt-1 text-xs text-[var(--text-muted)]">Total visits</p></div>
        <div><p className="text-3xl font-semibold text-[var(--text-primary)]">{metric.newPatients}</p><p className="mt-1 text-xs text-[var(--text-muted)]">New patients</p></div>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--border-subtle)]"><div className="h-full rounded-full bg-[var(--chart-new-patients)]" style={{ width: `${ratio}%` }} /></div>
      <p className="mt-2 text-[11px] text-[var(--text-muted)]">New patients represent {Math.round(ratio)}% of recorded visits.</p>
    </div>
  );
}

function GoogleAdsPanel({ summary }: { summary: OverviewResponse["googleAdsSummary"] }) {
  if (!summary) return <EmptyState icon={CircleDollarSign} title="Google Ads data unavailable" detail="Lead and campaign information is still available." />;
  if (!summary.spend && !summary.impressions && !summary.clicks) return <EmptyState icon={CircleDollarSign} title="No Google Ads activity in this period" detail="The latest synced analytics do not contain activity for this range." action={<Link href="/google-ads-analytics" className="panel-link">Open Google Ads <ExternalLink size={13} /></Link>} />;
  const metrics = [
    ["Spend", currency.format(summary.spend), CircleDollarSign],
    ["Impressions", integer.format(summary.impressions), Megaphone],
    ["Clicks", integer.format(summary.clicks), MousePointerClick],
    ["CTR", summary.ctr === null ? "Not available" : `${summary.ctr.toFixed(2)}%`, TrendingUp],
    ["Conversions", integer.format(summary.conversions), UserCheck],
    ["Attributed leads", integer.format(summary.attributedLeads), Users],
    ["Cost per lead", summary.costPerLead === null ? "Not available" : currency.format(summary.costPerLead), CircleDollarSign],
    ["ROAS", summary.roas === null ? "Not available" : `${summary.roas.toFixed(2)}×`, TrendingUp],
  ] as const;
  return (
    <div>
      {summary.attentionMessage && <div className="mb-4 flex items-start gap-2 rounded-xl border border-[var(--warning-border)] bg-[var(--warning-bg)] p-3 text-xs leading-5 text-[var(--warning-text)]"><AlertTriangle size={15} className="mt-0.5 shrink-0" />{summary.attentionMessage}</div>}
      <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
        {metrics.map(([label, value, Icon]) => (
          <div key={label} className="min-w-0">
            <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]"><Icon size={12} /> {label}</p>
            <p className={`mt-1.5 break-words font-semibold text-[var(--text-primary)] ${value === "Not available" ? "text-xs" : "text-base"}`}>{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <AdsHighlight label="Top campaign" value={summary.topCampaign} />
        <AdsHighlight label="Top creative" value={summary.topCreative} />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-[var(--text-muted)]">Latest sync {formatDateTime(summary.latestSyncAt)}</p>
        <Link href="/google-ads-analytics" className="panel-link">Open Google Ads <ExternalLink size={13} /></Link>
      </div>
    </div>
  );
}

function AdsHighlight({ label, value }: { label: string; value: string | null }) {
  return <div className="rounded-xl bg-[var(--surface-2)] p-3"><p className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-muted)]">{label}</p><p className="mt-1.5 truncate text-sm font-semibold text-[var(--text-primary)]" title={value ?? undefined}>{value || "Not available"}</p></div>;
}

function AttentionRequiredPanel({ items }: { items: AttentionItem[] }) {
  if (!items.length) {
    return <div className="flex min-h-52 flex-col items-center justify-center text-center"><span className="grid size-12 place-items-center rounded-full bg-[var(--success-bg)] text-[var(--success-text)]"><CheckCircle2 size={22} /></span><h3 className="overview-display mt-4 text-lg font-semibold text-[var(--text-primary)]">Everything looks healthy</h3><p className="mt-1 max-w-xs text-xs leading-5 text-[var(--text-muted)]">No failed messages, overdue steps, disconnected enrollments, or incomplete lead contact details were found.</p></div>;
  }
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article key={item.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3.5">
          <div className="flex items-start gap-3">
            <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ${item.severity === "critical" ? "bg-[var(--danger-bg)] text-[var(--danger-text)]" : "bg-[var(--warning-bg)] text-[var(--warning-text)]"}`}><AlertTriangle size={15} /></span>
            <div className="min-w-0 flex-1"><h3 className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</h3><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{item.detail}</p><Link href={item.href} className="panel-link mt-2 w-fit">{item.actionLabel} <ArrowRight size={13} /></Link></div>
          </div>
        </article>
      ))}
    </div>
  );
}

const activityIcons: Record<RecentActivityItem["category"], LucideIcon> = {
  lead: Users,
  campaign: Zap,
  message: Send,
  clinic: Activity,
  audit: ShieldCheck,
};

function RecentActivityFeed({ items, now }: { items: RecentActivityItem[]; now: number }) {
  if (!items.length) return <EmptyState icon={Database} title="No recent activity" detail="Meaningful lead, campaign, message, and clinic updates will appear here." />;
  return (
    <ol className="grid gap-x-6 lg:grid-cols-2">
      {items.map((item) => {
        const Icon = activityIcons[item.category];
        const content = <><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--surface-2)] text-[var(--brand-primary)]"><Icon size={16} /></span><div className="min-w-0 flex-1"><p className="text-sm font-medium leading-5 text-[var(--text-primary)]">{item.title}</p><p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[var(--text-muted)]"><span>{item.actor}</span>{item.resource && <><span aria-hidden="true">·</span><span>{item.resource}</span></>}<span aria-hidden="true">·</span><time dateTime={item.occurredAt}>{formatRelative(item.occurredAt, now)}</time></p></div></>;
        return <li key={item.id} className="border-b border-[var(--border-subtle)] py-3 first:pt-0 last:border-0 lg:[&:nth-last-child(-n+2)]:border-0">{item.href ? <Link href={item.href} className="flex min-h-11 items-start gap-3 rounded-xl p-1.5 transition-colors hover:bg-[var(--surface-hover)]">{content}</Link> : <div className="flex min-h-11 items-start gap-3 p-1.5">{content}</div>}</li>;
      })}
    </ol>
  );
}

function EmptyState({ icon: Icon, title, detail, action }: { icon: LucideIcon; title: string; detail: string; action?: React.ReactNode }) {
  return <div className="flex min-h-52 flex-col items-center justify-center px-4 text-center"><span className="grid size-11 place-items-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--brand-primary)]"><Icon size={19} /></span><h3 className="overview-display mt-4 text-base font-semibold text-[var(--text-primary)]">{title}</h3><p className="mt-1 max-w-sm text-xs leading-5 text-[var(--text-muted)]">{detail}</p>{action && <div className="mt-4">{action}</div>}</div>;
}

function SectionError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-[var(--warning-border)] bg-[var(--warning-bg)] px-5 text-center"><AlertTriangle size={20} className="text-[var(--warning-text)]" /><p className="mt-3 text-sm font-semibold text-[var(--warning-text)]">{message}</p><p className="mt-1 text-xs text-[var(--warning-text)]">Other Overview sections remain available.</p>{onRetry && <button onClick={onRetry} className="mt-4 min-h-11 rounded-xl border border-[var(--warning-border)] px-4 text-xs font-bold text-[var(--warning-text)] hover:bg-black/5 dark:hover:bg-white/5">Retry section data</button>}</div>;
}

function OverviewSkeleton() {
  return (
    <div className="mx-auto max-w-[1680px] space-y-5" aria-label="Loading Growth Command Center" role="status">
      <div className="space-y-2"><div className="h-3 w-24 animate-pulse rounded bg-[var(--surface-2)]" /><div className="h-7 w-64 animate-pulse rounded bg-[var(--surface-2)]" /></div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)]" />)}</div>
      <div className="grid grid-cols-12 gap-5"><div className="col-span-12 h-72 animate-pulse rounded-[20px] bg-[var(--surface-1)] lg:col-span-5" /><div className="col-span-12 h-72 animate-pulse rounded-[20px] bg-[var(--surface-1)] lg:col-span-7" /><div className="col-span-12 h-80 animate-pulse rounded-[20px] bg-[var(--surface-1)] lg:col-span-5" /><div className="col-span-12 h-80 animate-pulse rounded-[20px] bg-[var(--surface-1)] lg:col-span-7" /><div className="col-span-12 h-64 animate-pulse rounded-[20px] bg-[var(--surface-1)]" /></div>
      <span className="sr-only">Loading lead, campaign, delivery, clinic, advertising, and activity data.</span>
    </div>
  );
}

function OverviewErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="mx-auto flex min-h-[55vh] max-w-xl flex-col items-center justify-center text-center"><span className="grid size-14 place-items-center rounded-full bg-[var(--danger-bg)] text-[var(--danger-text)]"><AlertTriangle size={24} /></span><h2 className="overview-display mt-5 text-2xl font-semibold text-[var(--text-primary)]">The Overview could not be loaded</h2><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{message || "The dashboard data request did not complete."}</p><button onClick={onRetry} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 text-sm font-bold text-[var(--primary-foreground)]"><RefreshCw size={15} /> Retry Overview</button></div>;
}
