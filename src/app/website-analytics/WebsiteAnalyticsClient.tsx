"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  Check,
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
  WebsiteSourceChart,
  WebsiteTrafficChart,
} from "@/app/website-analytics/WebsiteAnalyticsCharts";
import { DASHBOARD_REFRESH_EVENT } from "@/lib/dashboard-refresh";
import type {
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

function websiteName(value: string) {
  if (value === "all") return "All websites";
  if (value === "harmony-medspa.vercel.app") return "Vercel marketing site";
  if (value === "www.harmonymedspafl.com") return "Main Harmony website";
  return "Tracked website";
}

function WebsitePicker({
  hostname,
  options,
  onChange,
}: {
  hostname: string | null;
  options: string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const selected = hostname ?? "all";

  useEffect(() => {
    if (!open) return;

    const closeOutside = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const values = ["all", ...options];

  return (
    <div ref={pickerRef} className="relative min-w-0 flex-1 sm:min-w-[260px] xl:flex-none">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Website hostname"
        className="flex min-h-14 w-full items-center gap-3 rounded-2xl border px-3.5 text-left transition-colors"
        style={{
          borderColor: open ? "var(--brand-primary)" : "var(--border-subtle)",
          background: "var(--surface-1)",
          boxShadow: open ? "0 0 0 3px var(--brand-primary-soft)" : "none",
        }}
      >
        <span
          className="grid size-9 shrink-0 place-items-center rounded-xl"
          style={{ color: "var(--brand-primary-strong)", background: "var(--brand-primary-soft)" }}
        >
          <Globe2 size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[9px] font-bold uppercase tracking-[.16em]" style={{ color: "var(--text-muted)" }}>
            Website
          </span>
          <span className="mt-0.5 block truncate text-xs font-bold" style={{ color: "var(--text-primary)" }}>
            {websiteName(selected)}
          </span>
        </span>
        <ChevronDown
          size={15}
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--text-muted)" }}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Choose a website"
          className="absolute right-0 top-[calc(100%+.5rem)] z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border p-2"
          style={{
            borderColor: "var(--border-subtle)",
            background: "var(--surface-1)",
            boxShadow: "0 24px 70px rgba(35, 27, 24, .18)",
          }}
        >
          <div className="px-3 pb-2 pt-1">
            <p className="text-[10px] font-bold uppercase tracking-[.16em]" style={{ color: "var(--text-muted)" }}>
              Reporting view
            </p>
          </div>
          {values.map((value) => {
            const active = selected === value;
            return (
              <button
                key={value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(value);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors"
                style={{ background: active ? "var(--brand-primary-soft)" : "transparent" }}
              >
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-lg border"
                  style={{
                    color: active ? "var(--brand-primary-strong)" : "var(--text-muted)",
                    borderColor: active ? "transparent" : "var(--border-subtle)",
                    background: active ? "var(--surface-1)" : "var(--surface-2)",
                  }}
                >
                  {active ? <Check size={14} /> : <Globe2 size={14} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                    {websiteName(value)}
                  </span>
                  <span className="mt-0.5 block truncate text-[10px]" style={{ color: "var(--text-muted)" }}>
                    {value === "all" ? "Combined GA4 property view" : value}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
            Connect Harmony&apos;s Google Analytics property once to turn this workspace into a live view of both the main website and the Vercel marketing site.
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

function EmptyState({ hostname }: { hostname: string | null }) {
  return (
    <div className="rounded-2xl border border-dashed p-8 text-center" style={{ borderColor: "var(--border-strong)" }}>
      <Globe2 className="mx-auto" size={28} style={{ color: "var(--brand-primary)" }} />
      <h3 className="mt-3 font-bold" style={{ color: "var(--text-primary)" }}>
        No GA4 activity in this range
      </h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6" style={{ color: "var(--text-muted)" }}>
        {hostname
          ? `GA4 returned no sessions for ${hostname}. Confirm that hostname is receiving the measurement tag or switch to All websites.`
          : "The property returned no sessions. Verify the measurement tag in GA4 Realtime and try a wider date range."}
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
  const requestedHostname = searchParams.get("hostname")?.trim().toLowerCase();
  const hostname =
    !requestedHostname || requestedHostname === "all" ? null : requestedHostname;
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
    return () => window.removeEventListener(DASHBOARD_REFRESH_EVENT, refresh);
  }, [load]);

  function setFilter(name: "days" | "hostname", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (name === "hostname" && value === "all") params.delete(name);
    else params.set(name, value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const knownHostnames = useMemo(() => {
    const values = new Set([
      "harmony-medspa.vercel.app",
      "www.harmonymedspafl.com",
      ...(snapshot?.sites.map((site) => site.hostName) ?? []),
    ]);
    if (hostname) values.add(hostname);
    return [...values].sort();
  }, [hostname, snapshot?.sites]);

  const metrics = snapshot
    ? summaryMetrics(snapshot.summary, snapshot.previousSummary)
    : [];
  const empty = snapshot?.summary.sessions === 0;
  const configurationRequired = error?.code === "GA4_NOT_CONFIGURED";

  return (
    <div className="space-y-5">
      <header
        className="relative z-30 flex flex-col gap-5 rounded-3xl border p-5 sm:p-6 xl:flex-row xl:items-end xl:justify-between"
        style={{
          borderColor: "var(--border-subtle)",
          background: "linear-gradient(135deg, var(--surface-1), color-mix(in srgb, var(--brand-primary-soft) 34%, var(--surface-1)))",
          boxShadow: "var(--shadow-soft)",
        }}
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p
              className="text-[10px] font-bold uppercase tracking-[.18em]"
              style={{ color: "var(--brand-primary-strong)" }}
            >
              Digital front door
            </p>
            <span
              className="flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold"
              style={{
                color: snapshot ? "var(--success-text)" : "var(--text-muted)",
                background: snapshot ? "var(--success-bg)" : "var(--surface-2)",
              }}
            >
              <Globe2 size={11} />
              {snapshot ? "Live GA4 reporting" : "GA4 connection"}
            </span>
          </div>
          <h1
            className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: "var(--text-primary)" }}
          >
            Website analytics
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6" style={{ color: "var(--text-muted)" }}>
            See who visits Harmony online, what brings them in, which pages hold attention, and where visits become leads.
          </p>
          {snapshot && (
            <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
              Property {snapshot.propertyId} · Updated {new Date(snapshot.fetchedAt).toLocaleString()} · Comparing with the previous {days} days
            </p>
          )}
        </div>

        {configurationRequired ? (
          <div
            className="flex min-w-0 items-center gap-3 rounded-2xl border px-4 py-3 xl:min-w-[285px]"
            style={{ borderColor: "var(--warning-border)", background: "var(--warning-bg)" }}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl" style={{ color: "var(--warning-text)", background: "var(--surface-1)" }}>
              <LockKeyhole size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold" style={{ color: "var(--warning-text)" }}>Analytics connection required</p>
              <p className="mt-0.5 text-[10px]" style={{ color: "var(--text-muted)" }}>Reporting filters unlock after setup</p>
            </div>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap xl:w-auto xl:justify-end">
            <WebsitePicker
              hostname={hostname}
              options={knownHostnames}
              onChange={(value) => setFilter("hostname", value)}
            />
            <div
              className="flex min-h-14 flex-1 items-center rounded-2xl border p-1 sm:flex-none"
              style={{ borderColor: "var(--border-subtle)", background: "var(--surface-1)" }}
              role="group"
              aria-label="Website Analytics date range"
            >
              <CalendarDays size={14} className="ml-2" style={{ color: "var(--text-muted)" }} />
              {[7, 14, 30, 90].map((value) => (
                <button
                  key={value}
                  onClick={() => setFilter("days", String(value))}
                  aria-pressed={days === value}
                  className="min-h-11 min-w-11 flex-1 rounded-xl px-2 text-xs font-bold sm:flex-none"
                  style={{
                    background: days === value ? "var(--brand-primary-soft)" : "transparent",
                    color: days === value ? "var(--brand-primary-strong)" : "var(--text-muted)",
                  }}
                >
                  {value}d
                </button>
              ))}
            </div>
            <button
              onClick={() => void load(true)}
              disabled={refreshing || loading}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-bold disabled:opacity-50"
              style={{ borderColor: "var(--border-subtle)", background: "var(--surface-1)" }}
            >
              {refreshing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
              Refresh
            </button>
          </div>
        )}
      </header>

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
            <EmptyState hostname={hostname} />
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
                  eyebrow="Website split"
                  title="Tracked hostnames"
                  description="The same GA4 property can report the old site and Vercel site separately."
                >
                  <div className="space-y-3">
                    {snapshot.sites.length === 0 ? (
                      <p className="text-sm" style={{ color: "var(--text-muted)" }}>No hostnames reported in this range.</p>
                    ) : (
                      snapshot.sites.map((site) => (
                        <button
                          key={`${site.hostName}:${site.streamId}`}
                          onClick={() => setFilter("hostname", site.hostName)}
                          className="w-full rounded-xl border p-3 text-left transition-colors"
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
                        </button>
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
