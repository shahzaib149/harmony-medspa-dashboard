"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Info,
  LayoutDashboard,
  MousePointerClick,
  RefreshCw,
  Search,
  Target,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import type { Creative } from "../GoogleAdsAnalyticsClient";

type AdPreviewRecord = {
  id: string;
  adId: string;
  adName: string;
  adType: string;
  status: string;
  adGroupResource: string;
  headline1: string;
  headline2: string;
  headline3: string;
  headline4: string;
  headline5: string;
  headline6: string;
  headline7: string;
  headline8: string;
  headline9: string;
  headline10: string;
  headline11: string;
  headline12: string;
  headline13: string;
  headline14: string;
  headline15: string;
  description1: string;
  description2: string;
  description3: string;
  description4: string;
  targetUrl: string;
};

type DetailTab = "overview" | "copy" | "performance";

const DAILY_PER_PAGE = 10;
const TABS = [
  { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
  { id: "copy" as const, label: "Ad Copy", icon: FileText },
  { id: "performance" as const, label: "Performance", icon: BarChart3 },
];

function fmtCurrency(value: number) {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtPct(value: number) {
  return `${value.toFixed(2)}%`;
}

function fmtRoas(value: number) {
  return `${value.toFixed(2)}x`;
}

function formatDate(value: string) {
  if (!value) return "Unavailable";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatDateRange(start: string, end: string) {
  if (!start || !end) return "Unavailable";
  if (start === end) return formatDate(start);
  return `${formatDate(start)} – ${formatDate(end)}`;
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function urlParts(value: string) {
  if (!value) return { domain: "", path: "" };
  try {
    const url = new URL(value);
    return {
      domain: url.hostname.replace(/^www\./, ""),
      path: `${url.pathname}${url.search}` || "/",
    };
  } catch {
    const clean = value.replace(/^https?:\/\//, "");
    const [domain, ...rest] = clean.split("/");
    return { domain, path: rest.length ? `/${rest.join("/")}` : "/" };
  }
}

function previewAssets(preview: AdPreviewRecord | null) {
  if (!preview) return { headlines: [], descriptions: [] };
  return {
    headlines: [
      preview.headline1,
      preview.headline2,
      preview.headline3,
      preview.headline4,
      preview.headline5,
      preview.headline6,
      preview.headline7,
      preview.headline8,
      preview.headline9,
      preview.headline10,
      preview.headline11,
      preview.headline12,
      preview.headline13,
      preview.headline14,
      preview.headline15,
    ].filter(Boolean),
    descriptions: [
      preview.description1,
      preview.description2,
      preview.description3,
      preview.description4,
    ].filter(Boolean),
  };
}

function CreativeDetailSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-[1440px] animate-pulse space-y-5"
      aria-label="Loading creative details"
      role="status"
    >
      <div className="h-11 w-40 rounded-xl bg-[var(--surface-2)]" />
      <div className="h-44 rounded-2xl bg-[var(--surface-1)]" />
      <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-24 rounded-2xl bg-[var(--surface-1)]" />
        ))}
      </div>
      <div className="flex h-12 gap-3 border-b border-[var(--border-subtle)]">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-10 w-28 rounded-lg bg-[var(--surface-2)]" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <div className="h-[420px] rounded-2xl bg-[var(--surface-1)]" />
        <div className="h-[420px] rounded-2xl bg-[var(--surface-1)]" />
      </div>
      <span className="sr-only">Loading creative details</span>
    </div>
  );
}

function CreativeDetailErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-[color-mix(in_srgb,var(--danger)_25%,var(--border-subtle))] bg-[var(--surface-1)] p-6 sm:p-8">
      <div className="grid size-11 place-items-center rounded-xl bg-[var(--danger-soft)] text-[var(--danger)]">
        <AlertTriangle size={20} />
      </div>
      <h2 className="mt-5 text-xl font-bold text-[var(--text-primary)]">
        Creative details could not be loaded
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
        We could not retrieve this ad&apos;s performance data. Existing dashboard
        navigation remains available.
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 text-sm font-bold text-[var(--primary-foreground)] transition-colors duration-150 hover:bg-[var(--brand-primary-strong)] active:translate-y-px"
        >
          <RefreshCw size={15} /> Try again
        </button>
        <Link
          href="/google-ads-analytics?tab=creatives"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] px-4 text-sm font-bold text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft size={15} /> Back to Creatives
        </Link>
      </div>
      <details className="mt-5 text-xs text-[var(--text-muted)]">
        <summary className="cursor-pointer">Technical detail</summary>
        <p className="mt-2 break-words rounded-lg bg-[var(--surface-2)] p-3">
          {error}
        </p>
      </details>
    </div>
  );
}

function MissingCreativeState({ adName }: { adName: string }) {
  return (
    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-6 py-14 text-center">
      <Search className="mx-auto text-[var(--text-muted)]" size={28} />
      <h2 className="mt-4 text-xl font-bold text-[var(--text-primary)]">
        Creative not found
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
        {adName
          ? `No creative or preview record was returned for “${adName}”.`
          : "No creative was selected."}
      </p>
      <Link
        href="/google-ads-analytics?tab=creatives"
        className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] px-4 text-sm font-bold text-[var(--text-primary)] transition-colors duration-150 hover:bg-[var(--surface-hover)]"
      >
        <ArrowLeft size={15} /> Back to Creatives
      </Link>
    </div>
  );
}

function CreativeIdentityHeader({
  adName,
  adType,
  status,
  campaignName,
  adGroupName,
  dateRange,
  targetUrl,
}: {
  adName: string;
  adType: string;
  status: string;
  campaignName: string;
  adGroupName: string;
  dateRange: string;
  targetUrl: string;
}) {
  const enabled = status.toUpperCase() === "ENABLED";
  return (
    <header className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 sm:p-6 lg:flex lg:items-end lg:justify-between lg:gap-8">
      <div className="min-w-0 lg:flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold text-[var(--text-secondary)]">
            {adType ? titleCase(adType) : "Google ad"}
          </p>
          {status && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                enabled
                  ? "bg-[var(--healthy-soft)] text-[var(--healthy)]"
                  : "bg-[var(--warning-soft)] text-[var(--warning)]"
              }`}
            >
              <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
              {titleCase(status)}
            </span>
          )}
        </div>
        <h1 className="mt-3 break-words text-[28px] font-bold leading-tight tracking-[-.02em] text-[var(--text-primary)] sm:text-[32px]">
          {adName || "Unnamed creative"}
        </h1>
        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {campaignName && (
            <div className="min-w-0">
              <dt className="inline text-[var(--text-muted)]">Campaign: </dt>
              <dd className="inline font-medium text-[var(--text-secondary)]">
                {campaignName}
              </dd>
            </div>
          )}
          {adGroupName && (
            <div className="min-w-0">
              <dt className="inline text-[var(--text-muted)]">Ad group: </dt>
              <dd className="inline font-medium text-[var(--text-secondary)]">
                {adGroupName}
              </dd>
            </div>
          )}
          {dateRange !== "Unavailable" && (
            <div>
              <dt className="sr-only">Date range</dt>
              <dd className="text-[var(--text-muted)]">{dateRange}</dd>
            </div>
          )}
        </dl>
      </div>
      {targetUrl && (
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View landing page in a new tab"
          className="mt-5 inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 text-sm font-bold text-[var(--primary-foreground)] transition-colors duration-150 hover:bg-[var(--brand-primary-strong)] active:translate-y-px"
        >
          View landing page <ExternalLink size={15} aria-hidden="true" />
        </a>
      )}
    </header>
  );
}

function PrimaryMetricCard({
  label,
  value,
  secondary,
  icon: Icon,
}: {
  label: string;
  value: string;
  secondary?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex min-h-24 items-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3 sm:gap-3 sm:p-5">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--surface-2)] text-[var(--brand-primary)] sm:size-10">
        <Icon size={18} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-[var(--text-muted)]">{label}</p>
        <p className="mt-1 whitespace-nowrap text-xl font-bold leading-none tabular-nums text-[var(--text-primary)] sm:text-2xl">
          {value}
        </p>
        {secondary && (
          <p className="mt-2 truncate text-xs text-[var(--text-muted)]">
            {secondary}
          </p>
        )}
      </div>
    </div>
  );
}

function CreativeTabs({
  activeTab,
  onChange,
}: {
  activeTab: DetailTab;
  onChange: (tab: DetailTab) => void;
}) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  return (
    <div
      className="overflow-x-auto border-b border-[var(--border-subtle)]"
      role="tablist"
      aria-label="Creative detail sections"
    >
      <div className="flex min-w-max gap-6 px-1 sm:min-w-0">
        {TABS.map(({ id, label, icon: Icon }, index) => {
          const selected = id === activeTab;
          return (
            <button
              key={id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`creative-tab-${id}`}
              aria-controls={`creative-panel-${id}`}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(id)}
              onKeyDown={(event) => {
                if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
                  return;
                event.preventDefault();
                let nextIndex = index;
                if (event.key === "Home") nextIndex = 0;
                if (event.key === "End") nextIndex = TABS.length - 1;
                if (event.key === "ArrowLeft")
                  nextIndex = (index - 1 + TABS.length) % TABS.length;
                if (event.key === "ArrowRight")
                  nextIndex = (index + 1) % TABS.length;
                const nextTab = TABS[nextIndex].id;
                onChange(nextTab);
                tabRefs.current[nextIndex]?.focus();
              }}
              className={`relative inline-flex min-h-12 items-center gap-2 whitespace-nowrap px-1 text-sm font-semibold transition-colors duration-150 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:transition-colors after:duration-150 ${
                selected
                  ? "text-[var(--brand-primary-strong)] after:bg-[var(--brand-primary)]"
                  : "text-[var(--text-muted)] after:bg-transparent hover:text-[var(--text-primary)]"
              }`}
            >
              <Icon size={16} aria-hidden="true" /> {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SearchAdPreview({
  preview,
  adName,
  loading,
}: {
  preview: AdPreviewRecord | null;
  adName: string;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="min-h-72 animate-pulse rounded-2xl bg-[var(--surface-2)]" />
    );
  }
  if (!preview) {
    return (
      <div className="rounded-2xl bg-[var(--surface-2)] px-6 py-14 text-center">
        <Search className="mx-auto text-[var(--text-muted)]" size={26} />
        <p className="mt-4 font-semibold text-[var(--text-primary)]">
          Search preview unavailable
        </p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          No ad copy record was returned for this creative.
        </p>
      </div>
    );
  }

  const { headlines, descriptions } = previewAssets(preview);
  const { domain, path } = urlParts(preview.targetUrl);
  const isVideo = preview.adType.includes("VIDEO");
  const isSearch =
    preview.adType.includes("SEARCH") || preview.adType.includes("RESPONSIVE");

  if (isVideo) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl bg-[var(--surface-2)] p-6 text-center">
        <div>
          <p className="font-semibold text-[var(--text-primary)]">YouTube video ad</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Preview this video creative in Google Ads.
          </p>
        </div>
      </div>
    );
  }

  if (!isSearch && headlines.length === 0) {
    return (
      <div className="rounded-2xl bg-[var(--surface-2)] px-6 py-14 text-center text-sm text-[var(--text-muted)]">
        Preview is unavailable for {titleCase(preview.adType || "this ad type")}.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-[var(--surface-2)]">
      <div className="border-b border-[var(--border-subtle)] p-4 sm:p-5">
        <div className="flex min-w-0 items-center gap-3 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-2.5">
          <Search className="shrink-0 text-[var(--text-muted)]" size={16} />
          <span className="min-w-0 truncate text-sm text-[var(--text-secondary)]">
            {adName || "Harmony MedSpa"}
          </span>
        </div>
      </div>
      <div className="p-4 sm:p-6">
        <article className="max-w-3xl rounded-xl bg-[var(--surface-1)] p-4 sm:p-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--brand-primary-soft)] text-xs font-bold text-[var(--brand-primary)]">
              H
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                {domain || "Harmony MedSpa"}
              </p>
              <p className="break-anywhere text-xs text-[var(--text-muted)]">
                <span className="font-semibold text-[var(--text-secondary)]">Sponsored</span>
                {path && ` · ${path}`}
              </p>
            </div>
          </div>
          <h3 className="mt-3 break-words text-lg font-medium leading-7 text-[var(--focus)] sm:text-xl">
            {headlines.length ? headlines.slice(0, 3).join(" | ") : adName}
          </h3>
          <div className="mt-1 space-y-1">
            {descriptions.length ? (
              descriptions.slice(0, 2).map((description, index) => (
                <p
                  key={`${description}-${index}`}
                  className="text-sm leading-6 text-[var(--text-secondary)]"
                >
                  {description}
                </p>
              ))
            ) : (
              <p className="text-sm text-[var(--text-muted)]">
                No description assets were returned for this ad.
              </p>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}

function CopyButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
    >
      <Copy size={14} aria-hidden="true" /> {label}
    </button>
  );
}

function AdSetupPanel({
  adId,
  adType,
  campaignName,
  adGroupName,
  status,
  dateRange,
  targetUrl,
  onCopy,
}: {
  adId: string;
  adType: string;
  campaignName: string;
  adGroupName: string;
  status: string;
  dateRange: string;
  targetUrl: string;
  onCopy: (value: string, label: string) => void;
}) {
  const { domain, path } = urlParts(targetUrl);
  const items = [
    ["Ad ID", adId || "Unavailable"],
    ["Type", adType ? titleCase(adType) : "Unavailable"],
    ["Campaign", campaignName || "Unavailable"],
    ["Ad group", adGroupName || "Unavailable"],
    ["Status", status ? titleCase(status) : "Unavailable"],
    ["Date range", dateRange],
  ];
  return (
    <section className="rounded-2xl bg-[var(--surface-1)] p-5 sm:p-6">
      <h2 className="text-lg font-bold text-[var(--text-primary)]">Ad setup</h2>
      <dl className="mt-5 grid gap-x-5 gap-y-5 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
        {items.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs font-medium text-[var(--text-muted)]">{label}</dt>
            <dd className="mt-1 flex min-w-0 items-start gap-1 break-words text-sm font-semibold leading-6 text-[var(--text-secondary)]">
              <span className="min-w-0 break-words">{value}</span>
              {label === "Ad ID" && adId && (
                <button
                  type="button"
                  aria-label="Copy ad ID"
                  onClick={() => onCopy(adId, "Ad ID")}
                  className="grid size-7 shrink-0 place-items-center rounded-md text-[var(--text-muted)] transition-colors duration-150 hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                >
                  <Copy size={13} aria-hidden="true" />
                </button>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 border-t border-[var(--border-subtle)] pt-5">
        <p className="text-xs font-medium text-[var(--text-muted)]">Final URL</p>
        {targetUrl ? (
          <>
            <p className="mt-2 break-anywhere text-sm font-semibold text-[var(--text-primary)]">
              {domain}
            </p>
            <p className="mt-1 break-anywhere text-xs leading-5 text-[var(--text-muted)]">
              {path}
            </p>
            <div className="mt-3 flex flex-wrap gap-1">
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open final URL in a new tab"
                className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
              >
                <ExternalLink size={14} aria-hidden="true" /> Open
              </a>
              <CopyButton
                label="Copy URL"
                onClick={() => onCopy(targetUrl, "URL")}
              />
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            No final URL was returned for this ad.
          </p>
        )}
      </div>
    </section>
  );
}

function AssetCount({ value, limit }: { value: string; limit: number }) {
  const length = value.length;
  const tone =
    length > limit
      ? "text-[var(--danger)]"
      : length >= limit * 0.87
        ? "text-[var(--warning)]"
        : "text-[var(--text-muted)]";
  return (
    <span className={`shrink-0 text-xs tabular-nums ${tone}`}>
      {length}/{limit}
    </span>
  );
}

function AssetList({
  title,
  assets,
  limit,
  emptyMessage,
}: {
  title: string;
  assets: string[];
  limit: number;
  emptyMessage: string;
}) {
  return (
    <section className="rounded-2xl bg-[var(--surface-1)] p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">{title}</h2>
        <span className="text-sm text-[var(--text-muted)]">
          {assets.length} {assets.length === 1 ? "asset" : "assets"}
        </span>
      </div>
      {assets.length ? (
        <div className="mt-5 grid gap-x-6 sm:grid-cols-2">
          {assets.map((asset, index) => (
            <div
              key={`${asset}-${index}`}
              className="group flex min-w-0 items-start gap-3 border-t border-[var(--border-subtle)] py-3.5 first:border-t-0 sm:[&:nth-child(2)]:border-t-0"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--surface-2)] text-xs font-bold text-[var(--brand-primary)] transition-colors duration-150 group-hover:bg-[var(--brand-primary-soft)]">
                {index + 1}
              </span>
              <p className="min-w-0 flex-1 break-words text-sm leading-6 text-[var(--text-secondary)]">
                {asset}
              </p>
              <AssetCount value={asset} limit={limit} />
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-xl bg-[var(--surface-2)] px-4 py-5 text-sm text-[var(--text-muted)]">
          {emptyMessage}
        </p>
      )}
    </section>
  );
}

function AssetHealthSummary({
  headlines,
  descriptions,
  targetUrl,
}: {
  headlines: string[];
  descriptions: string[];
  targetUrl: string;
}) {
  const withinLimits =
    headlines.every((headline) => headline.length <= 30) &&
    descriptions.every((description) => description.length <= 90);
  const facts = [
    `${headlines.length} headline${headlines.length === 1 ? "" : "s"} supplied`,
    `${descriptions.length} description${descriptions.length === 1 ? "" : "s"} supplied`,
    targetUrl ? "Final URL available" : "Final URL unavailable",
    withinLimits ? "Supplied assets are within character limits" : "One or more assets exceed character limits",
  ];
  return (
    <section className="rounded-2xl bg-[var(--surface-2)] p-5 sm:p-6">
      <h2 className="text-base font-bold text-[var(--text-primary)]">Asset health</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {facts.map((fact, index) => {
          const warning =
            (index === 2 && !targetUrl) || (index === 3 && !withinLimits);
          return (
            <li key={fact} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
              {warning ? (
                <AlertTriangle className="mt-0.5 shrink-0 text-[var(--warning)]" size={16} />
              ) : (
                <CheckCircle2 className="mt-0.5 shrink-0 text-[var(--healthy)]" size={16} />
              )}
              {fact}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function LandingPagePanel({
  targetUrl,
  onCopy,
}: {
  targetUrl: string;
  onCopy: (value: string, label: string) => void;
}) {
  if (!targetUrl) {
    return (
      <section className="rounded-2xl bg-[var(--surface-1)] p-5 sm:p-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Landing page</h2>
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          No final URL was returned for this ad.
        </p>
      </section>
    );
  }
  const { domain, path } = urlParts(targetUrl);
  return (
    <section className="rounded-2xl bg-[var(--surface-1)] p-5 sm:p-6 lg:flex lg:items-center lg:justify-between lg:gap-6">
      <div className="min-w-0">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Landing page</h2>
        <p className="mt-3 break-anywhere text-base font-semibold text-[var(--text-primary)]">
          {domain}
        </p>
        <p className="mt-1 break-anywhere text-sm leading-6 text-[var(--text-muted)]">
          {path}
        </p>
      </div>
      <div className="mt-5 flex flex-col gap-2 min-[390px]:flex-row lg:mt-0 lg:shrink-0">
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open landing page in a new tab"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] px-4 text-sm font-bold text-[var(--text-primary)] transition-colors duration-150 hover:bg-[var(--surface-hover)]"
        >
          Open landing page <ExternalLink size={14} aria-hidden="true" />
        </a>
        <button
          type="button"
          onClick={() => onCopy(targetUrl, "URL")}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary-soft)] px-4 text-sm font-bold text-[var(--brand-primary-strong)] transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--brand-primary)_16%,transparent)]"
        >
          <Copy size={14} aria-hidden="true" /> Copy URL
        </button>
      </div>
    </section>
  );
}

function DiagnosticMetric({
  label,
  value,
  definition,
}: {
  label: string;
  value: string;
  definition?: string;
}) {
  return (
    <div className="min-w-0 border-t border-[var(--border-subtle)] py-4 first:border-t-0 sm:[&:nth-child(2)]:border-t-0 lg:[&:nth-child(3)]:border-t-0">
      <div className="flex items-center gap-1.5">
        <p className="text-sm text-[var(--text-muted)]">{label}</p>
        {definition && (
          <span
            tabIndex={0}
            title={definition}
            aria-label={`${label}: ${definition}`}
            className="cursor-help text-[var(--text-muted)] focus:text-[var(--focus)]"
          >
            <Info size={13} aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="mt-2 truncate text-xl font-bold tabular-nums text-[var(--text-primary)]">
        {value}
      </p>
    </div>
  );
}

function PerformanceSignal({
  cost,
  clicks,
  conversions,
  conversionValue,
}: {
  cost: number;
  clicks: number;
  conversions: number;
  conversionValue: number;
}) {
  if (!(cost > 50 && conversions === 0)) return null;
  return (
    <section className="flex items-start gap-4 rounded-2xl bg-[var(--warning-soft)] p-5 sm:p-6">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--warning)_13%,transparent)] text-[var(--warning)]">
        <AlertTriangle size={19} aria-hidden="true" />
      </span>
      <div>
        <p className="text-xs font-semibold text-[var(--warning)]">Needs attention</p>
        <h2 className="mt-1 text-lg font-bold text-[var(--text-primary)]">
          Spend recorded with zero conversions
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          {fmtCurrency(cost)} was spent during this period with no recorded
          conversions. {clicks.toLocaleString()} clicks were generated. {conversionValue > 0
            ? `${fmtCurrency(conversionValue)} in conversion value was recorded.`
            : "No conversion value was recorded."}
        </p>
      </div>
    </section>
  );
}

function DailyPerformance({
  rows,
  page,
  pageCount,
  dateRange,
  onPageChange,
}: {
  rows: Creative[];
  page: number;
  pageCount: number;
  dateRange: string;
  onPageChange: (page: number) => void;
}) {
  if (!rows.length) {
    return (
      <section className="rounded-2xl bg-[var(--surface-1)] px-6 py-14 text-center">
        <BarChart3 className="mx-auto text-[var(--text-muted)]" size={26} />
        <h2 className="mt-4 text-lg font-bold text-[var(--text-primary)]">
          Daily performance is unavailable
        </h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          No dated performance rows were returned for the selected period.
        </p>
      </section>
    );
  }
  return (
    <section className="overflow-hidden rounded-2xl bg-[var(--surface-1)]">
      <div className="flex flex-col gap-1 border-b border-[var(--border-subtle)] px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            Daily performance
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{dateRange}</p>
        </div>
        <p className="text-xs text-[var(--text-muted)]">Newest first</p>
      </div>

      <div className="hidden overflow-x-auto px-6 md:block">
        <table className="w-full min-w-[760px] text-sm tabular-nums">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              <th scope="col" className="py-3 pr-4 text-left text-xs font-semibold text-[var(--text-muted)]">Date</th>
              {["Spend", "Impressions", "Clicks", "CTR", "Conversions", "ROAS"].map((heading) => (
                <th key={heading} scope="col" className="px-3 py-3 text-right text-xs font-semibold text-[var(--text-muted)]">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const ctr = row.impressions > 0 ? (row.clicks / row.impressions) * 100 : 0;
              const roas = row.cost > 0 ? row.conversionValue / row.cost : 0;
              return (
                <tr key={row.date} className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--surface-hover)]">
                  <th scope="row" className="py-4 pr-4 text-left font-semibold text-[var(--text-primary)]">
                    {formatDate(row.date)}
                  </th>
                  <td className="px-3 py-4 text-right text-[var(--text-secondary)]">{fmtCurrency(row.cost)}</td>
                  <td className="px-3 py-4 text-right text-[var(--text-secondary)]">{row.impressions.toLocaleString()}</td>
                  <td className="px-3 py-4 text-right text-[var(--text-secondary)]">{row.clicks.toLocaleString()}</td>
                  <td className="px-3 py-4 text-right text-[var(--text-secondary)]">{fmtPct(ctr)}</td>
                  <td className="px-3 py-4 text-right text-[var(--text-secondary)]">{row.conversions.toFixed(1)}</td>
                  <td className="py-4 pl-3 text-right font-semibold text-[var(--text-primary)]">{fmtRoas(roas)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-[var(--border-subtle)] px-5 md:hidden">
        {rows.map((row) => {
          const ctr = row.impressions > 0 ? (row.clicks / row.impressions) * 100 : 0;
          const roas = row.cost > 0 ? row.conversionValue / row.cost : 0;
          const metrics = [
            ["Spend", fmtCurrency(row.cost)],
            ["Clicks", row.clicks.toLocaleString()],
            ["Impressions", row.impressions.toLocaleString()],
            ["CTR", fmtPct(ctr)],
            ["Conversions", row.conversions.toFixed(1)],
            ["ROAS", fmtRoas(roas)],
          ];
          return (
            <article key={row.date} className="py-5">
              <h3 className="font-bold text-[var(--text-primary)]">
                {formatDate(row.date)}
              </h3>
              <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3">
                {metrics.map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-2">
                    <dt className="text-xs text-[var(--text-muted)]">{label}</dt>
                    <dd className="text-sm font-semibold tabular-nums text-[var(--text-secondary)]">{value}</dd>
                  </div>
                ))}
              </dl>
            </article>
          );
        })}
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-5 py-4 text-sm text-[var(--text-muted)] sm:px-6">
          <span>Page {page + 1} of {pageCount}</span>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Previous daily performance page"
              disabled={page === 0}
              onClick={() => onPageChange(page - 1)}
              className="grid size-10 place-items-center rounded-lg border border-[var(--border-subtle)] transition-colors duration-150 hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              aria-label="Next daily performance page"
              disabled={page >= pageCount - 1}
              onClick={() => onPageChange(page + 1)}
              className="grid size-10 place-items-center rounded-lg border border-[var(--border-subtle)] transition-colors duration-150 hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function CreativeDetailInner() {
  const searchParams = useSearchParams();
  const adName = searchParams.get("name") ?? "";
  const adIdParam = searchParams.get("adId") ?? "";

  const [allCreatives, setAllCreatives] = useState<Creative[]>([]);
  const [adPreviewRecords, setAdPreviewRecords] = useState<AdPreviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyPage, setDailyPage] = useState(0);
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [reloadKey, setReloadKey] = useState(0);
  const [copyNotice, setCopyNotice] = useState("");

  useEffect(() => {
    setLoading(true);
    setPreviewLoading(true);
    setError(null);

    fetch("/api/airtable?table=creatives")
      .then((response) => response.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setAllCreatives(data.data ?? []);
      })
      .catch((loadError) => setError(String(loadError)))
      .finally(() => setLoading(false));

    fetch("/api/airtable?table=ad-preview")
      .then((response) => response.json())
      .then((data) => setAdPreviewRecords(data.data ?? []))
      .catch(() => {
        // Preview data is helpful but non-fatal; performance can still render.
      })
      .finally(() => setPreviewLoading(false));
  }, [reloadKey]);

  const adPreview = useMemo<AdPreviewRecord | null>(() => {
    if (adPreviewRecords.length === 0) return null;
    if (adIdParam) {
      const byId = adPreviewRecords.find((preview) => preview.adId === adIdParam);
      if (byId) return byId;
    }
    return adPreviewRecords.find((preview) => preview.adName === adName) ?? null;
  }, [adPreviewRecords, adIdParam, adName]);

  const rows = useMemo(
    () =>
      allCreatives.filter(
        (creative) =>
          creative.adName === adName ||
          Boolean(adIdParam && creative.adId === adIdParam),
      ),
    [allCreatives, adIdParam, adName],
  );

  const totals = useMemo(() => {
    const clicks = rows.reduce((sum, row) => sum + row.clicks, 0);
    const cost = rows.reduce((sum, row) => sum + row.cost, 0);
    const impressions = rows.reduce((sum, row) => sum + row.impressions, 0);
    const conversions = rows.reduce((sum, row) => sum + row.conversions, 0);
    const conversionValue = rows.reduce(
      (sum, row) => sum + row.conversionValue,
      0,
    );
    return {
      clicks,
      cost,
      impressions,
      conversions,
      conversionValue,
      ctrPct: impressions > 0 ? (clicks / impressions) * 100 : 0,
      roas: cost > 0 ? conversionValue / cost : 0,
      avgCpc: clicks > 0 ? cost / clicks : 0,
      convRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
      costPerConv: conversions > 0 ? cost / conversions : null,
    };
  }, [rows]);

  const dailyRows = useMemo(() => {
    const dailyMap = new Map<string, Creative>();
    for (const row of rows) {
      if (!row.date) continue;
      const existing = dailyMap.get(row.date);
      if (existing) {
        existing.clicks += row.clicks;
        existing.cost += row.cost;
        existing.impressions += row.impressions;
        existing.conversions += row.conversions;
        existing.conversionValue += row.conversionValue;
      } else {
        dailyMap.set(row.date, { ...row });
      }
    }
    return Array.from(dailyMap.values()).sort((a, b) =>
      b.date.localeCompare(a.date),
    );
  }, [rows]);

  const first = rows[0];
  const adType = adPreview?.adType || first?.adType || "";
  const campaignName = first?.campaignName ?? "";
  const adGroupName = first?.adGroupName ?? "";
  const tags = first?.creativeTagSuggestions ?? "";
  const dates = rows
    .map((row) => row.date)
    .filter(Boolean)
    .sort();
  const dateMin = dates[0] ?? "";
  const dateMax = dates[dates.length - 1] ?? "";
  const dateRange = formatDateRange(dateMin, dateMax);
  const status = adPreview?.status || "";
  const targetUrl = adPreview?.targetUrl || first?.finalUrl || "";
  const { headlines, descriptions } = previewAssets(adPreview);
  const dailyPages = Math.ceil(dailyRows.length / DAILY_PER_PAGE);
  const dailyPaginated = dailyRows.slice(
    dailyPage * DAILY_PER_PAGE,
    (dailyPage + 1) * DAILY_PER_PAGE,
  );

  const copyText = useCallback(async (value: string, label: string) => {
    let copied = false;
    try {
      await navigator.clipboard.writeText(value);
      copied = true;
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      copied = document.execCommand("copy");
      textarea.remove();
    }
    setCopyNotice(copied ? `${label} copied` : `${label} could not be copied`);
    window.setTimeout(() => setCopyNotice(""), 2200);
  }, []);

  if (loading) return <CreativeDetailSkeleton />;
  if (error)
    return (
      <CreativeDetailErrorState
        error={error}
        onRetry={() => setReloadKey((value) => value + 1)}
      />
    );
  if (rows.length === 0 && !adPreview)
    return <MissingCreativeState adName={adName} />;

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-5">
      <Link
        href="/google-ads-analytics?tab=creatives"
        className="inline-flex min-h-11 items-center gap-2 rounded-lg pr-3 text-sm font-semibold text-[var(--text-muted)] transition-colors duration-150 hover:text-[var(--text-primary)]"
      >
        <ArrowLeft size={16} aria-hidden="true" /> Back to Creatives
      </Link>

      <CreativeIdentityHeader
        adName={adName || adPreview?.adName || "Unnamed creative"}
        adType={adType}
        status={status}
        campaignName={campaignName}
        adGroupName={adGroupName}
        dateRange={dateRange}
        targetUrl={targetUrl}
      />

      {rows.length > 0 ? (
        <section
          aria-label="Primary performance summary"
          className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-4"
        >
          <PrimaryMetricCard
            label="Spend"
            value={fmtCurrency(totals.cost)}
            secondary={totals.clicks > 0 ? `${fmtCurrency(totals.avgCpc)} average CPC` : undefined}
            icon={CircleDollarSign}
          />
          <PrimaryMetricCard
            label="Impressions"
            value={totals.impressions.toLocaleString()}
            secondary={totals.impressions > 0 ? `${fmtPct(totals.ctrPct)} CTR` : undefined}
            icon={Eye}
          />
          <PrimaryMetricCard
            label="Clicks"
            value={totals.clicks.toLocaleString()}
            secondary={`${totals.conversions.toFixed(1)} conversions`}
            icon={MousePointerClick}
          />
          <PrimaryMetricCard
            label="ROAS"
            value={fmtRoas(totals.roas)}
            secondary={totals.conversionValue > 0 ? `${fmtCurrency(totals.conversionValue)} conversion value` : undefined}
            icon={Target}
          />
        </section>
      ) : (
        <div className="rounded-2xl bg-[var(--surface-1)] px-5 py-4 text-sm text-[var(--text-muted)]">
          Performance summary is unavailable for this creative.
        </div>
      )}

      <CreativeTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" && (
        <div
          id="creative-panel-overview"
          role="tabpanel"
          aria-labelledby="creative-tab-overview"
          className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]"
        >
          <section className="rounded-2xl bg-[var(--surface-1)] p-4 sm:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                Search ad preview
              </h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Appearance may vary in Google Search.
              </p>
            </div>
            <SearchAdPreview
              preview={adPreview}
              adName={adName}
              loading={previewLoading}
            />
          </section>
          <div className="space-y-5">
            <AdSetupPanel
              adId={adIdParam || adPreview?.adId || first?.adId || ""}
              adType={adType}
              campaignName={campaignName}
              adGroupName={adGroupName}
              status={status}
              dateRange={dateRange}
              targetUrl={targetUrl}
              onCopy={copyText}
            />
            {tags.trim() && (
              <section className="rounded-2xl bg-[var(--surface-1)] p-5 sm:p-6">
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  Creative tags
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tags
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                    .map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[var(--brand-primary-soft)] px-3 py-1 text-xs font-medium text-[var(--brand-primary-strong)]"
                      >
                        {tag}
                      </span>
                    ))}
                </div>
              </section>
            )}
          </div>
        </div>
      )}

      {activeTab === "copy" && (
        <div
          id="creative-panel-copy"
          role="tabpanel"
          aria-labelledby="creative-tab-copy"
          className="space-y-5"
        >
          <AssetHealthSummary
            headlines={headlines}
            descriptions={descriptions}
            targetUrl={targetUrl}
          />
          <AssetList
            title="Headlines"
            assets={headlines}
            limit={30}
            emptyMessage="No headline assets were returned for this ad."
          />
          <AssetList
            title="Descriptions"
            assets={descriptions}
            limit={90}
            emptyMessage="No description assets were returned for this ad."
          />
          <LandingPagePanel targetUrl={targetUrl} onCopy={copyText} />
        </div>
      )}

      {activeTab === "performance" && (
        <div
          id="creative-panel-performance"
          role="tabpanel"
          aria-labelledby="creative-tab-performance"
          className="space-y-5"
        >
          {rows.length > 0 ? (
            <>
              <section className="rounded-2xl bg-[var(--surface-1)] p-5 sm:p-6">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">
                      Performance diagnostics
                    </h2>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      Efficiency and conversion signals for this creative.
                    </p>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">{dateRange}</p>
                </div>
                <div className="mt-4 grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
                  <DiagnosticMetric
                    label="CTR"
                    value={fmtPct(totals.ctrPct)}
                    definition="Click-through rate: clicks divided by impressions."
                  />
                  <DiagnosticMetric
                    label="Average CPC"
                    value={totals.clicks > 0 ? fmtCurrency(totals.avgCpc) : "—"}
                    definition="Average cost paid for each click."
                  />
                  <DiagnosticMetric
                    label="Conversions"
                    value={totals.conversions.toFixed(1)}
                  />
                  <DiagnosticMetric
                    label="Conversion rate"
                    value={totals.clicks > 0 ? fmtPct(totals.convRate) : "—"}
                    definition="Conversions divided by clicks."
                  />
                  <DiagnosticMetric
                    label="Cost per conversion"
                    value={totals.costPerConv === null ? "—" : fmtCurrency(totals.costPerConv)}
                    definition="Spend divided by recorded conversions."
                  />
                  <DiagnosticMetric
                    label="Conversion value"
                    value={fmtCurrency(totals.conversionValue)}
                  />
                  <DiagnosticMetric
                    label="ROAS"
                    value={fmtRoas(totals.roas)}
                    definition="Conversion value divided by ad spend."
                  />
                </div>
              </section>

              <PerformanceSignal
                cost={totals.cost}
                clicks={totals.clicks}
                conversions={totals.conversions}
                conversionValue={totals.conversionValue}
              />

              <DailyPerformance
                rows={dailyPaginated}
                page={dailyPage}
                pageCount={dailyPages}
                dateRange={dateRange}
                onPageChange={setDailyPage}
              />
            </>
          ) : (
            <div className="rounded-2xl bg-[var(--surface-1)] px-6 py-14 text-center">
              <BarChart3 className="mx-auto text-[var(--text-muted)]" size={26} />
              <h2 className="mt-4 text-lg font-bold text-[var(--text-primary)]">
                Performance data is unavailable
              </h2>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                No performance rows were returned for this ad.
              </p>
            </div>
          )}
        </div>
      )}

      <div
        aria-live="polite"
        aria-atomic="true"
        className={`pointer-events-none fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-[var(--surface-raised)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] shadow-[var(--shadow-modal)] transition-opacity duration-150 ${copyNotice ? "opacity-100" : "opacity-0"}`}
      >
        <Check size={15} className="text-[var(--healthy)]" aria-hidden="true" />
        {copyNotice || "Copied"}
      </div>
    </div>
  );
}

export default function CreativeDetailPage() {
  return (
    <DashboardLayout title="Creative Detail" subtitle="Ad performance breakdown">
      <Suspense fallback={<CreativeDetailSkeleton />}>
        <CreativeDetailInner />
      </Suspense>
    </DashboardLayout>
  );
}
