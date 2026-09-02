"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  Clock3,
  Database,
  ExternalLink,
  FileBarChart,
  Globe2,
  Laptop2,
  Loader2,
  LockKeyhole,
  MousePointerClick,
  RefreshCw,
  Route,
  Smartphone,
  Tablet,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  WebsiteLiveActivityChart,
  WebsiteRealtimeDeviceChart,
  WebsiteSourceChart,
  WebsiteTrafficChart,
} from "@/app/website-analytics/WebsiteAnalyticsCharts";
import { DASHBOARD_REFRESH_EVENT } from "@/lib/dashboard-refresh";
import type {
  WebsiteAnalyticsRealtime,
  WebsiteAnalyticsSnapshot,
  WebsiteAnalyticsSummary,
} from "@/lib/google/analytics-types";

type AnalyticsError = {
  message: string;
  code?: string;
  missing?: string[];
};

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

function percent(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

function duration(seconds: number) {
  const safe = Math.max(0, Math.round(seconds));
  if (safe < 60) return `${safe}s`;
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${minutes}m ${remainder}s`;
}

function change(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? null : 0;
  return ((current - previous) / previous) * 100;
}

function MetricCard({
  label,
  value,
  detail,
  current,
  previous,
  icon: Icon,
  accent = "brand",
  inverse = false,
}: {
  label: string;
  value: string;
  detail: string;
  current: number;
  previous: number;
  icon: LucideIcon;
  accent?: "brand" | "teal" | "blue" | "gold";
  inverse?: boolean;
}) {
  const delta = change(current, previous);
  const favorable = delta !== null && (inverse ? delta <= 0 : delta >= 0);
  const colors = {
    brand: ["var(--brand-primary)", "var(--brand-primary-soft)"],
    teal: ["var(--success-text)", "var(--success-bg)"],
    blue: ["var(--info-text)", "var(--info-bg)"],
    gold: ["var(--warning-text)", "var(--warning-bg)"],
  } as const;
  const [color, background] = colors[accent];

  return (
    <article
      className="rounded-2xl border p-4 sm:p-5"
      style={{
        background: "var(--surface-1)",
        borderColor: "var(--border-subtle)",
        boxShadow: "var(--shadow-soft)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="grid size-10 shrink-0 place-items-center rounded-xl"
          style={{ color, background }}
        >
          <Icon size={18} />
        </div>
        {delta === null ? (
          <span
            className="rounded-full px-2 py-1 text-[10px] font-bold"
            style={{ color: "var(--text-muted)", background: "var(--surface-2)" }}
          >
            New activity
          </span>
        ) : (
          <span
            className="flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold tabular-nums"
            style={{
              color: favorable ? "var(--success-text)" : "var(--danger-text)",
              background: favorable ? "var(--success-bg)" : "var(--danger-bg)",
            }}
          >
            {delta >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
      <p
        className="mt-4 text-[10px] font-bold uppercase tracking-[.14em]"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </p>
      <p
        className="mt-1 text-2xl font-bold tracking-tight tabular-nums sm:text-[1.75rem]"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </p>
      <p className="mt-1 text-xs leading-5" style={{ color: "var(--text-muted)" }}>
        {detail}
      </p>
    </article>
  );
}

function Panel({
  eyebrow,
  title,
  description,
  action,
  children,
  className = "",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-w-0 overflow-hidden rounded-2xl border ${className}`}
      style={{
        background: "var(--surface-1)",
        borderColor: "var(--border-subtle)",
        boxShadow: "var(--shadow-soft)",
      }}
    >
      <header
        className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div className="min-w-0">
          <p
            className="text-[10px] font-bold uppercase tracking-[.16em]"
            style={{ color: "var(--brand-primary-strong)" }}
          >
            {eyebrow}
          </p>
          <h2
            className="mt-1 text-base font-bold tracking-tight sm:text-lg"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-xs leading-5" style={{ color: "var(--text-muted)" }}>
              {description}
            </p>
          )}
        </div>
        {action}
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function DeviceIcon({ device }: { device: string }) {
  const name = device.toLowerCase();
  if (name === "mobile") return <Smartphone size={15} />;
  if (name === "tablet") return <Tablet size={15} />;
  return <Laptop2 size={15} />;
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-5" aria-label="Loading Website Analytics">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-44 animate-pulse rounded-2xl"
            style={{ background: "var(--surface-1)" }}
          />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,.8fr)]">
        <div className="h-[430px] animate-pulse rounded-2xl" style={{ background: "var(--surface-1)" }} />
        <div className="h-[430px] animate-pulse rounded-2xl" style={{ background: "var(--surface-1)" }} />
      </div>
    </div>
  );
}

const HARMONY_HOSTNAME = "www.harmonymedspafl.com";

function SetupState({ error }: { error: AnalyticsError }) {
  const missing = error.missing?.length
    ? error.missing
    : ["GA4_PROPERTY_ID", "GA4_SERVICE_ACCOUNT_EMAIL", "GA4_SERVICE_ACCOUNT_PRIVATE_KEY"];
  const benefits = [
    { icon: Activity, title: "Traffic quality", detail: "Visitors, engagement, and bounce" },
    { icon: Route, title: "Acquisition", detail: "Channels, sources, and campaigns" },
    { icon: Target, title: "Lead outcomes", detail: "Forms and visit-to-lead rate" },
  ];

  return (
    <section
      className="relative overflow-hidden rounded-3xl border"
      style={{
        background: "var(--surface-1)",
        borderColor: "var(--border-subtle)",
        boxShadow: "var(--shadow-soft)",
      }}
    >
      <div
        className="pointer-events-none absolute -right-24 -top-32 size-80 rounded-full blur-3xl"
        style={{ background: "var(--brand-primary-soft)", opacity: 0.72 }}
      />
      <div className="relative grid gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,.75fr)] lg:gap-12 lg:p-10">
        <div className="flex flex-col justify-center py-2 lg:py-5">
          <span
            className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em]"
            style={{ color: "var(--warning-text)", background: "var(--warning-bg)" }}
          >
            <span className="size-1.5 rounded-full" style={{ background: "var(--warning-text)" }} />
            Awaiting GA4 access
          </span>
          <h2
            className="mt-5 max-w-2xl text-2xl font-bold tracking-[-.025em] sm:text-4xl"
            style={{ color: "var(--text-primary)" }}
          >
            Your website performance, in one focused view.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 sm:text-[15px]" style={{ color: "var(--text-muted)" }}>
            Connect Harmony&apos;s Google Analytics property once to turn this workspace into a live view of Harmony Med Spa FL.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {benefits.map(({ icon: Icon, title, detail }) => (
              <div
                key={title}
                className="rounded-2xl border p-4"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: "color-mix(in srgb, var(--surface-2) 76%, transparent)",
                }}
              >
                <Icon size={16} style={{ color: "var(--brand-primary)" }} />
                <p className="mt-3 text-xs font-bold" style={{ color: "var(--text-primary)" }}>{title}</p>
                <p className="mt-1 text-[10px] leading-4" style={{ color: "var(--text-muted)" }}>{detail}</p>
              </div>
            ))}
          </div>
        </div>

        <aside
          className="rounded-3xl border p-5 sm:p-6"
          style={{
            borderColor: "color-mix(in srgb, var(--brand-primary) 20%, var(--border-subtle))",
            background: "color-mix(in srgb, var(--surface-1) 92%, var(--brand-primary-soft))",
            boxShadow: "0 18px 55px rgba(35, 27, 24, .08)",
          }}
        >
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl" style={{ color: "var(--brand-primary-strong)", background: "var(--brand-primary-soft)" }}>
              <Database size={19} />
            </span>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Connect Google Analytics</p>
              <p className="mt-0.5 text-[10px]" style={{ color: "var(--text-muted)" }}>One-time, read-only setup</p>
            </div>
          </div>

          <ol className="mt-6 space-y-4">
            {["Get Viewer access to the GA4 property", "Add the service account as a Viewer", "Save the three server credentials in Vercel"].map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-bold" style={{ color: "var(--brand-primary-strong)", background: "var(--brand-primary-soft)" }}>
                  {index + 1}
                </span>
                <p className="pt-0.5 text-xs font-semibold leading-5" style={{ color: "var(--text-secondary)" }}>{step}</p>
              </li>
            ))}
          </ol>

          <details className="group mt-6 rounded-2xl border" style={{ borderColor: "var(--border-subtle)", background: "var(--surface-1)" }}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-xs font-bold" style={{ color: "var(--text-primary)" }}>
              Configuration keys
              <ChevronDown size={14} className="transition-transform group-open:rotate-180" style={{ color: "var(--text-muted)" }} />
            </summary>
            <div className="space-y-2 border-t p-3" style={{ borderColor: "var(--border-subtle)" }}>
              {missing.map((item) => (
                <code key={item} className="block overflow-x-auto rounded-lg px-3 py-2 text-[10px]" style={{ color: "var(--brand-primary-strong)", background: "var(--surface-2)" }}>
                  {item}
                </code>
              ))}
            </div>
          </details>

          <div className="mt-4 flex items-start gap-2 text-[10px] leading-4" style={{ color: "var(--text-muted)" }}>
            <LockKeyhole size={13} className="mt-0.5 shrink-0" />
            Credentials stay server-side and are never exposed to the browser.
          </div>
        </aside>
      </div>
    </section>
  );
}

function EmptyState({
  hostname,
  realtime,
}: {
  hostname: string | null;
  realtime: WebsiteAnalyticsRealtime;
}) {
  const hasRealtimeActivity =
    realtime.activeUsers > 0 ||
    realtime.sessions > 0 ||
    realtime.pageViews > 0 ||
    realtime.leads > 0;

  if (hasRealtimeActivity) {
    const liveMetrics = [
      { label: "Active visitors", value: realtime.activeUsers, detail: "On the site now", icon: Users },
      { label: "Sessions", value: realtime.sessions, detail: "Visits started", icon: Route },
      { label: "Page views", value: realtime.pageViews, detail: "Pages opened", icon: FileBarChart },
      { label: "Interactions", value: realtime.eventCount, detail: "All tracked events", icon: MousePointerClick },
      { label: "Lead events", value: realtime.leads, detail: "Forms completed", icon: Target },
    ];
    const conversionRate = realtime.sessions > 0 ? realtime.leads / realtime.sessions : 0;
    const viewsPerVisitor = realtime.activeUsers > 0 ? realtime.pageViews / realtime.activeUsers : 0;

    return (
      <div className="space-y-5">
        <section
          className="relative overflow-hidden rounded-3xl border"
          style={{
            borderColor: "var(--success-border)",
            background: "linear-gradient(135deg, var(--surface-1), color-mix(in srgb, var(--success-bg) 62%, var(--surface-1)))",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full blur-3xl" style={{ background: "var(--success-bg)", opacity: 0.8 }} />
          <div className="relative flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex items-start gap-3">
              <span className="relative grid size-11 shrink-0 place-items-center rounded-2xl" style={{ color: "var(--success-text)", background: "var(--success-bg)" }}>
                <Activity size={21} />
                <span className="absolute right-0 top-0 size-2.5 rounded-full border-2 border-white bg-emerald-500">
                  <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400" />
                </span>
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-[.18em]" style={{ color: "var(--success-text)" }}>Live command center</p>
                  <span className="rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--success-text)", background: "var(--success-bg)" }}>Connected</span>
                </div>
                <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl" style={{ color: "var(--text-primary)" }}>Website activity, right now</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                  A live operational view of visitors, content, devices, locations, and conversion activity from GA4.
                </p>
              </div>
            </div>
            <div className="flex w-fit items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-bold" style={{ color: "var(--success-text)", background: "var(--surface-1)", borderColor: "var(--success-border)" }}>
              <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
              Last 30 minutes
            </div>
          </div>

          <div className="relative grid grid-cols-2 gap-px bg-[var(--border-subtle)] lg:grid-cols-5">
            {liveMetrics.map(({ label, value, detail, icon: Icon }) => (
              <article key={label} className="bg-[var(--surface-1)] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <Icon size={17} style={{ color: "var(--brand-primary)" }} />
                  <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Live</span>
                </div>
                <p className="mt-4 text-3xl font-bold tracking-tight tabular-nums" style={{ color: "var(--text-primary)" }}>{numberFormatter.format(value)}</p>
                <p className="mt-1 text-xs font-bold" style={{ color: "var(--text-primary)" }}>{label}</p>
                <p className="mt-0.5 text-[10px]" style={{ color: "var(--text-muted)" }}>{detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,.65fr)]">
          <Panel eyebrow="Live pulse" title="Activity over the last 30 minutes" description="Page views and active visitors minute by minute.">
            <div className="mb-2 flex flex-wrap gap-4 text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
              <span className="flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: "var(--brand-primary)" }} />Page views</span>
              <span className="flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: "var(--success-text)" }} />Active visitors</span>
            </div>
            <WebsiteLiveActivityChart data={realtime.trend} />
          </Panel>

          <Panel eyebrow="Live quality" title="Visit health" description="Immediate signals while daily GA4 reporting finishes processing.">
            <div className="space-y-3">
              {[
                { label: "Views per visitor", value: viewsPerVisitor.toFixed(2), hint: "Content depth" },
                { label: "Live conversion rate", value: percent(conversionRate), hint: "Leads ÷ sessions" },
                { label: "Events per visitor", value: realtime.activeUsers ? (realtime.eventCount / realtime.activeUsers).toFixed(1) : "0.0", hint: "Interaction depth" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border p-4" style={{ borderColor: "var(--border-subtle)", background: "var(--surface-2)" }}>
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{item.label}</p>
                      <p className="mt-1 text-[10px]" style={{ color: "var(--text-muted)" }}>{item.hint}</p>
                    </div>
                    <strong className="text-2xl tracking-tight tabular-nums" style={{ color: "var(--brand-primary-strong)" }}>{item.value}</strong>
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-2 rounded-2xl p-3 text-[10px] leading-5" style={{ color: "var(--text-muted)", background: "var(--brand-primary-soft)" }}>
                <Clock3 size={14} className="mt-0.5 shrink-0" />
                Standard trends, acquisition, engagement, and exact URL reports can take up to 24 hours to populate for a new stream.
              </div>
            </div>
          </Panel>
        </section>

        <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,.55fr)_minmax(300px,.65fr)]">
          <Panel eyebrow="Live content" title="Pages being viewed" description="Current page titles ranked by views.">
            {realtime.pages.length ? (
              <div className="space-y-2">
                {realtime.pages.map((page, index) => {
                  const maxViews = realtime.pages[0]?.views || 1;
                  return (
                    <div key={page.name} className="relative overflow-hidden rounded-xl border px-3 py-3" style={{ borderColor: "var(--border-subtle)", background: "var(--surface-2)" }}>
                      <span className="absolute inset-y-0 left-0 opacity-10" style={{ width: `${Math.max(4, (page.views / maxViews) * 100)}%`, background: "var(--brand-primary)" }} />
                      <div className="relative flex items-center gap-3">
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg text-[10px] font-bold" style={{ color: "var(--brand-primary-strong)", background: "var(--brand-primary-soft)" }}>{String(index + 1).padStart(2, "0")}</span>
                        <p className="min-w-0 flex-1 truncate text-xs font-bold" style={{ color: "var(--text-primary)" }}>{page.name}</p>
                        <span className="text-xs font-bold tabular-nums" style={{ color: "var(--brand-primary-strong)" }}>{page.views} {page.views === 1 ? "view" : "views"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-sm" style={{ color: "var(--text-muted)" }}>No page titles reported in this live window.</p>}
          </Panel>

          <Panel eyebrow="Technology" title="Live device mix" description="Visitors by device category.">
            {realtime.devices.length ? (
              <>
                <WebsiteRealtimeDeviceChart data={realtime.devices} />
                <div className="space-y-2">
                  {realtime.devices.map((device, index) => (
                    <div key={device.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 font-semibold capitalize" style={{ color: "var(--text-primary)" }}>
                        <span className="size-2.5 rounded-full" style={{ background: ["#b7831f", "#2a867a", "#5879a7", "#a45f69"][index % 4] }} />
                        {device.name}
                      </span>
                      <strong className="tabular-nums">{device.value}</strong>
                    </div>
                  ))}
                </div>
              </>
            ) : <p className="text-sm" style={{ color: "var(--text-muted)" }}>Device data will appear with live visitors.</p>}
          </Panel>

          <div className="grid gap-5">
            <Panel eyebrow="Geography" title="Visitor locations" description="Live cities and countries.">
              <div className="space-y-3">
                {realtime.locations.length ? realtime.locations.map((location, index) => (
                  <div key={location.name} className="flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-lg text-[10px] font-bold" style={{ color: "var(--brand-primary-strong)", background: "var(--brand-primary-soft)" }}>{index + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{location.name}</span>
                    <strong className="text-xs tabular-nums">{location.value}</strong>
                  </div>
                )) : <p className="text-sm" style={{ color: "var(--text-muted)" }}>Location data will appear with live visitors.</p>}
              </div>
            </Panel>
            <Panel eyebrow="Event stream" title="Top interactions" description="GA4 events in the live window.">
              <div className="space-y-2">
                {realtime.events.length ? realtime.events.slice(0, 6).map((event) => (
                  <div key={event.name} className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5" style={{ borderColor: "var(--border-subtle)" }}>
                    <span className="truncate text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>{event.name.replaceAll("_", " ")}</span>
                    <strong className="text-xs tabular-nums" style={{ color: "var(--brand-primary-strong)" }}>{event.value}</strong>
                  </div>
                )) : <p className="text-sm" style={{ color: "var(--text-muted)" }}>No events reported yet.</p>}
              </div>
            </Panel>
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--border-subtle)", background: "var(--surface-1)" }}>
          <div>
            <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>Historical reporting is preparing</p>
            <p className="mt-1 text-[11px] leading-5" style={{ color: "var(--text-muted)" }}>This live dashboard proves tracking is active. The same page will automatically expand into daily trend, source, campaign, device, content, engagement, and lead reports as GA4 processes the new stream.</p>
          </div>
          <a href="https://analytics.google.com/" target="_blank" rel="noreferrer" className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-bold" style={{ borderColor: "var(--border-subtle)", color: "var(--brand-primary-strong)" }}>Open GA4 <ExternalLink size={13} /></a>
        </section>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed p-8 text-center" style={{ borderColor: "var(--border-strong)" }}>
      <Globe2 className="mx-auto" size={28} style={{ color: "var(--brand-primary)" }} />
      <h3 className="mt-3 font-bold" style={{ color: "var(--text-primary)" }}>No GA4 activity in this range</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6" style={{ color: "var(--text-muted)" }}>
        {hostname ? "No visitors are active in the current 30-minute window, and GA4 is still processing the new stream. Open the website, browse a few pages, then refresh." : "The property returned no sessions. Verify the measurement tag in GA4 Realtime and try a wider date range."}
      </p>
    </div>
  );
}

function summaryMetrics(
  current: WebsiteAnalyticsSummary,
  previous: WebsiteAnalyticsSummary,
) {
  return [
    {
      label: "Active visitors",
      value: numberFormatter.format(current.activeUsers),
      detail: `${numberFormatter.format(current.newUsers)} first-time visitors`,
      current: current.activeUsers,
      previous: previous.activeUsers,
      icon: Users,
      accent: "brand" as const,
    },
    {
      label: "Sessions",
      value: numberFormatter.format(current.sessions),
      detail: `${current.viewsPerSession.toFixed(2)} views per session`,
      current: current.sessions,
      previous: previous.sessions,
      icon: Route,
      accent: "blue" as const,
    },
    {
      label: "Page views",
      value: numberFormatter.format(current.pageViews),
      detail: "Repeated page views included",
      current: current.pageViews,
      previous: previous.pageViews,
      icon: FileBarChart,
      accent: "gold" as const,
    },
    {
      label: "Engagement rate",
      value: percent(current.engagementRate),
      detail: `${numberFormatter.format(current.engagedSessions)} engaged sessions`,
      current: current.engagementRate,
      previous: previous.engagementRate,
      icon: Activity,
      accent: "teal" as const,
    },
    {
      label: "Bounce rate",
      value: percent(current.bounceRate),
      detail: "Sessions that were not engaged",
      current: current.bounceRate,
      previous: previous.bounceRate,
      icon: MousePointerClick,
      accent: "gold" as const,
      inverse: true,
    },
    {
      label: "Avg. engagement",
      value: duration(current.averageEngagementSeconds),
      detail: "Foreground time per active visitor",
      current: current.averageEngagementSeconds,
      previous: previous.averageEngagementSeconds,
      icon: Clock3,
      accent: "blue" as const,
    },
    {
      label: "GA4 leads",
      value: numberFormatter.format(current.leads),
      detail: "Successful generate_lead events",
      current: current.leads,
      previous: previous.leads,
      icon: Target,
      accent: "teal" as const,
    },
    {
      label: "Visit-to-lead rate",
      value: percent(current.leadRate),
      detail: "GA4 leads divided by sessions",
      current: current.leadRate,
      previous: previous.leadRate,
      icon: TrendingUp,
      accent: "brand" as const,
    },
  ];
}

async function getAnalytics(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  const body = (await response.json().catch(() => null)) as
    | (WebsiteAnalyticsSnapshot & { error?: string })
    | ({ error?: string; code?: string; missing?: string[] })
    | null;
  if (!response.ok || !body || "error" in body) {
    const errorBody = body as { error?: string; code?: string; missing?: string[] } | null;
    const caught = new Error(errorBody?.error || `Request failed (${response.status})`) as Error & {
      code?: string;
      missing?: string[];
    };
    caught.code = errorBody?.code;
    caught.missing = errorBody?.missing;
    throw caught;
  }
  return body as WebsiteAnalyticsSnapshot;
}

export default function WebsiteAnalyticsClient() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const requestedDays = Number(searchParams.get("days") ?? 30);
  const days = [7, 14, 30, 90].includes(requestedDays) ? requestedDays : 30;
  const hostname = HARMONY_HOSTNAME;
  const [snapshot, setSnapshot] = useState<WebsiteAnalyticsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<AnalyticsError | null>(null);

  const load = useCallback(
    async (force = false) => {
      if (force) {
        setRefreshing(true);
      } else {
        setLoading(true);
        setSnapshot(null);
      }
      setError(null);
      try {
        const params = new URLSearchParams({ days: String(days) });
        if (hostname) params.set("hostname", hostname);
        if (force) params.set("refresh", "1");
        const data = await getAnalytics(`/api/google-analytics/overview?${params.toString()}`);
        setSnapshot(data);
      } catch (caught) {
        const typed = caught as Error & { code?: string; missing?: string[] };
        setError({
          message: typed.message,
          code: typed.code,
          missing: typed.missing,
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [days, hostname],
  );

  useEffect(() => void load(), [load]);
  useEffect(() => {
    const refresh = () => void load(true);
    window.addEventListener(DASHBOARD_REFRESH_EVENT, refresh);
    const interval = window.setInterval(refresh, 60_000);
    return () => {
      window.removeEventListener(DASHBOARD_REFRESH_EVENT, refresh);
      window.clearInterval(interval);
    };
  }, [load]);

  function setFilter(name: "days", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("hostname");
    params.set(name, value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }


  const metrics = snapshot
    ? summaryMetrics(snapshot.summary, snapshot.previousSummary)
    : [];
  const empty = snapshot?.summary.sessions === 0;
  const configurationRequired = error?.code === "GA4_NOT_CONFIGURED";

  return (
    <div className="space-y-5">
            <section
        className="relative z-30 flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:px-5 xl:flex-row xl:items-center xl:justify-between"
        style={{
          borderColor: "var(--border-subtle)",
          background: "var(--surface-1)",
          boxShadow: "var(--shadow-soft)",
        }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="relative grid size-10 shrink-0 place-items-center rounded-xl"
            style={{ color: snapshot ? "var(--success-text)" : "var(--brand-primary-strong)", background: snapshot ? "var(--success-bg)" : "var(--brand-primary-soft)" }}
          >
            <Activity size={18} />
            {snapshot && <span className="absolute right-0 top-0 size-2.5 rounded-full border-2 border-white bg-emerald-500" />}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-bold" style={{ color: "var(--text-primary)" }}>Harmony Med Spa FL</p>
              <span className="rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wider" style={{ color: snapshot ? "var(--success-text)" : "var(--text-muted)", background: snapshot ? "var(--success-bg)" : "var(--surface-2)" }}>
                {snapshot ? "GA4 connected" : "Connecting"}
              </span>
            </div>
            <p className="mt-0.5 truncate text-[10px]" style={{ color: "var(--text-muted)" }}>
              {snapshot
                ? `Property ${snapshot.propertyId} · Updated ${new Date(snapshot.fetchedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · Auto-refreshes every minute`
                : "Realtime and historical website reporting"}
            </p>
          </div>
        </div>

        {configurationRequired ? (
          <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold" style={{ color: "var(--warning-text)", background: "var(--warning-bg)" }}>
            <LockKeyhole size={14} />
            Analytics connection required
          </div>
        ) : (
          <div className="flex w-full flex-col gap-2 sm:flex-row xl:w-auto">
            <div className="flex min-h-11 flex-1 items-center rounded-xl border p-1 sm:flex-none" style={{ borderColor: "var(--border-subtle)", background: "var(--surface-2)" }} role="group" aria-label="Website Analytics date range">
              <CalendarDays size={13} className="ml-2" style={{ color: "var(--text-muted)" }} />
              {[7, 14, 30, 90].map((value) => (
                <button
                  key={value}
                  onClick={() => setFilter("days", String(value))}
                  aria-pressed={days === value}
                  className="min-h-9 min-w-10 flex-1 rounded-lg px-2 text-[11px] font-bold sm:flex-none"
                  style={{ background: days === value ? "var(--surface-1)" : "transparent", color: days === value ? "var(--brand-primary-strong)" : "var(--text-muted)", boxShadow: days === value ? "var(--shadow-soft)" : "none" }}
                >
                  {value}d
                </button>
              ))}
            </div>
            <button onClick={() => void load(true)} disabled={refreshing || loading} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-bold disabled:opacity-50" style={{ borderColor: "var(--border-subtle)", background: "var(--surface-1)" }}>
              {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Refresh
            </button>
          </div>
        )}
      </section>

      {error?.code === "GA4_NOT_CONFIGURED" ? (
        <SetupState error={error} />
      ) : error && !snapshot ? (
        <section
          className="flex gap-3 rounded-2xl border p-5"
          style={{ color: "var(--danger-text)", background: "var(--danger-bg)", borderColor: "var(--danger-border)" }}
        >
          <AlertTriangle size={20} className="mt-0.5 shrink-0" />
          <div>
            <h2 className="font-bold">Website Analytics could not load</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6">{error.message}</p>
            <button
              onClick={() => void load()}
              className="mt-3 min-h-11 rounded-xl border px-4 text-xs font-bold"
              style={{ borderColor: "var(--danger-border)" }}
            >
              Try again
            </button>
          </div>
        </section>
      ) : loading && !snapshot ? (
        <AnalyticsSkeleton />
      ) : snapshot ? (
        <>
          {error && (
            <div
              className="flex gap-3 rounded-2xl border p-4 text-sm"
              style={{ color: "var(--warning-text)", background: "var(--warning-bg)", borderColor: "var(--warning-border)" }}
            >
              <AlertTriangle size={17} className="mt-0.5 shrink-0" />
              <p>Refresh failed; showing the last loaded GA4 snapshot. {error.message}</p>
            </div>
          )}
          {empty ? (
            <EmptyState hostname={hostname} realtime={snapshot.realtime} />
          ) : (
            <>
              <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                {metrics.map((metric) => (
                  <MetricCard key={metric.label} {...metric} />
                ))}
              </section>

              <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,.8fr)]">
                <Panel
                  eyebrow="Performance over time"
                  title="Traffic and lead trend"
                  description="Daily visitors, sessions, and successful GA4 lead events."
                >
                  <div className="mb-3 flex flex-wrap gap-4 text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
                    {[
                      ["Visitors", "var(--chart-leads)"],
                      ["Sessions", "var(--chart-visits)"],
                      ["Leads", "var(--chart-booked)"],
                    ].map(([label, color]) => (
                      <span key={label} className="flex items-center gap-2">
                        <span className="size-2 rounded-full" style={{ background: color }} />
                        {label}
                      </span>
                    ))}
                  </div>
                  <WebsiteTrafficChart data={snapshot.trend} />
                </Panel>

                <Panel
                  eyebrow="Website"
                  title="Harmony Med Spa FL"
                  description="GA4 traffic recorded for www.harmonymedspafl.com."
                >
                  <div className="space-y-3">
                    {snapshot.sites.length === 0 ? (
                      <p className="text-sm" style={{ color: "var(--text-muted)" }}>No hostnames reported in this range.</p>
                    ) : (
                      snapshot.sites.map((site) => (
                        <article
                          key={`${site.hostName}:${site.streamId}`}
                          className="w-full rounded-xl border p-3 text-left"
                          style={{ borderColor: "var(--border-subtle)", background: "var(--surface-2)" }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold" style={{ color: "var(--text-primary)" }}>{site.hostName}</p>
                              <p className="mt-1 truncate text-[10px]" style={{ color: "var(--text-muted)" }}>{site.streamName}{site.streamId ? ` · Stream ${site.streamId}` : ""}</p>
                            </div>
                            <span className="text-xs font-bold tabular-nums" style={{ color: "var(--brand-primary-strong)" }}>{percent(site.share, 0)}</span>
                          </div>
                          <div className="mt-3 h-1.5 overflow-hidden rounded-full" style={{ background: "var(--border-subtle)" }}>
                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, site.share * 100)}%`, background: "var(--brand-primary)" }} />
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]" style={{ color: "var(--text-muted)" }}>
                            <span><b className="block text-xs tabular-nums" style={{ color: "var(--text-primary)" }}>{numberFormatter.format(site.activeUsers)}</b>Visitors</span>
                            <span><b className="block text-xs tabular-nums" style={{ color: "var(--text-primary)" }}>{numberFormatter.format(site.sessions)}</b>Sessions</span>
                            <span><b className="block text-xs tabular-nums" style={{ color: "var(--text-primary)" }}>{numberFormatter.format(site.pageViews)}</b>Views</span>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </Panel>
              </section>

              <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)]">
                <Panel
                  eyebrow="Acquisition"
                  title="Where visitors come from"
                  description="Session source, campaign, engagement, and GA4 leads."
                >
                  <WebsiteSourceChart sources={snapshot.sources} />
                </Panel>
                <Panel
                  eyebrow="Audience technology"
                  title="Device mix"
                  description="Sessions and visitors by desktop, mobile, and tablet."
                >
                  <div className="space-y-4">
                    {snapshot.devices.map((device) => (
                      <div key={device.device}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-sm font-bold capitalize" style={{ color: "var(--text-primary)" }}>
                            <span className="grid size-8 place-items-center rounded-lg" style={{ color: "var(--brand-primary)", background: "var(--brand-primary-soft)" }}>
                              <DeviceIcon device={device.device} />
                            </span>
                            {device.device}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{numberFormatter.format(device.sessions)} sessions</p>
                            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{numberFormatter.format(device.activeUsers)} visitors</p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: "var(--border-subtle)" }}>
                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, device.share * 100)}%`, background: "var(--healthy)" }} />
                          </div>
                          <span className="w-10 text-right text-xs font-bold tabular-nums" style={{ color: "var(--success-text)" }}>{percent(device.share, 0)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              </section>

              <Panel
                eyebrow="Content performance"
                title="Top pages"
                description="Page views, visitors, and average engagement time for the selected website and range."
              >
                <div className="space-y-3 md:hidden">
                  {snapshot.pages.map((page) => (
                    <article key={`${page.hostName}:${page.path}:${page.title}`} className="rounded-xl border p-3" style={{ borderColor: "var(--border-subtle)", background: "var(--surface-2)" }}>
                      <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{page.title}</p>
                      <p className="mt-1 break-all text-[10px]" style={{ color: "var(--text-muted)" }}>{page.hostName}{page.path}</p>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]" style={{ color: "var(--text-muted)" }}>
                        <span><b className="block text-sm tabular-nums" style={{ color: "var(--text-primary)" }}>{numberFormatter.format(page.pageViews)}</b>Views</span>
                        <span><b className="block text-sm tabular-nums" style={{ color: "var(--text-primary)" }}>{numberFormatter.format(page.activeUsers)}</b>Visitors</span>
                        <span><b className="block text-sm tabular-nums" style={{ color: "var(--text-primary)" }}>{duration(page.averageEngagementSeconds)}</b>Engagement</span>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[780px] border-collapse text-left text-xs">
                    <thead>
                      <tr style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border-subtle)" }}>
                        <th className="pb-3 pr-4 font-bold uppercase tracking-wider">Page</th>
                        <th className="pb-3 pr-4 text-right font-bold uppercase tracking-wider">Views</th>
                        <th className="pb-3 pr-4 text-right font-bold uppercase tracking-wider">Visitors</th>
                        <th className="pb-3 text-right font-bold uppercase tracking-wider">Avg. engagement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {snapshot.pages.map((page) => (
                        <tr key={`${page.hostName}:${page.path}:${page.title}`} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                          <td className="py-3 pr-4">
                            <p className="font-bold" style={{ color: "var(--text-primary)" }}>{page.title}</p>
                            <p className="mt-1 max-w-xl truncate" style={{ color: "var(--text-muted)" }}>{page.hostName}{page.path}</p>
                          </td>
                          <td className="py-3 pr-4 text-right font-bold tabular-nums">{numberFormatter.format(page.pageViews)}</td>
                          <td className="py-3 pr-4 text-right tabular-nums">{numberFormatter.format(page.activeUsers)}</td>
                          <td className="py-3 text-right tabular-nums">{duration(page.averageEngagementSeconds)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>

              <Panel
                eyebrow="Acquisition ledger"
                title="Traffic sources and campaigns"
                description="Use this table to isolate paid search, organic, direct, social, email, and individual UTM campaigns."
                action={
                  <a
                    href="https://analytics.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-bold"
                    style={{ borderColor: "var(--border-subtle)", color: "var(--brand-primary-strong)" }}
                  >
                    Open GA4 <ExternalLink size={13} />
                  </a>
                }
              >
                <div className="space-y-3 md:hidden">
                  {snapshot.sources.map((source) => (
                    <article key={`${source.sourceMedium}:${source.campaign}:${source.channel}`} className="rounded-xl border p-3" style={{ borderColor: "var(--border-subtle)", background: "var(--surface-2)" }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold" style={{ color: "var(--text-primary)" }}>{source.sourceMedium}</p>
                          <p className="mt-1 truncate text-[10px]" style={{ color: "var(--text-muted)" }}>{source.campaign} · {source.channel}</p>
                        </div>
                        <span className="rounded-full px-2 py-1 text-[10px] font-bold" style={{ color: "var(--brand-primary-strong)", background: "var(--brand-primary-soft)" }}>{numberFormatter.format(source.sessions)} sessions</span>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]" style={{ color: "var(--text-muted)" }}>
                        <span><b className="block text-sm tabular-nums" style={{ color: "var(--text-primary)" }}>{numberFormatter.format(source.activeUsers)}</b>Visitors</span>
                        <span><b className="block text-sm tabular-nums" style={{ color: "var(--text-primary)" }}>{percent(source.engagementRate)}</b>Engagement</span>
                        <span><b className="block text-sm tabular-nums" style={{ color: "var(--text-primary)" }}>{numberFormatter.format(source.leads)}</b>Leads</span>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[980px] border-collapse text-left text-xs">
                    <thead>
                      <tr style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border-subtle)" }}>
                        {[
                          ["Source / medium", "left"],
                          ["Campaign", "left"],
                          ["Channel", "left"],
                          ["Sessions", "right"],
                          ["Visitors", "right"],
                          ["Engagement", "right"],
                          ["Leads", "right"],
                          ["Lead rate", "right"],
                        ].map(([label, align]) => (
                          <th key={label} className={`pb-3 pr-4 font-bold uppercase tracking-wider ${align === "right" ? "text-right" : ""}`}>{label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {snapshot.sources.map((source) => (
                        <tr key={`${source.sourceMedium}:${source.campaign}:${source.channel}`} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                          <td className="py-3 pr-4 font-bold" style={{ color: "var(--text-primary)" }}>{source.sourceMedium}</td>
                          <td className="max-w-52 truncate py-3 pr-4" style={{ color: "var(--text-muted)" }}>{source.campaign}</td>
                          <td className="py-3 pr-4">{source.channel}</td>
                          <td className="py-3 pr-4 text-right font-bold tabular-nums">{numberFormatter.format(source.sessions)}</td>
                          <td className="py-3 pr-4 text-right tabular-nums">{numberFormatter.format(source.activeUsers)}</td>
                          <td className="py-3 pr-4 text-right tabular-nums">{percent(source.engagementRate)}</td>
                          <td className="py-3 pr-4 text-right font-bold tabular-nums">{numberFormatter.format(source.leads)}</td>
                          <td className="py-3 pr-4 text-right tabular-nums">{percent(source.leadRate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}
