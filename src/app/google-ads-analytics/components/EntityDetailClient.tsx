"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  ChevronRight,
  Copy,
  ExternalLink,
  FileSearch,
  Layers3,
  Loader2,
  Monitor,
  RefreshCw,
  Smartphone,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchWorkspaceSnapshot } from "../GoogleAdsAnalyticsClient";
import type {
  AdGroup,
  Campaign,
  Creative,
  Keyword,
  SelectedEntity,
  WorkspaceSnapshot,
} from "../workspace-types";

export type EntityKind = "campaign" | "ad-group" | "ad" | "keyword";
type HistoryPoint = {
  date: string;
  cost: number;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionValue: number;
  conversionValueAvailable: boolean;
  ctrPct: number;
  avgCpc: number;
  cpa: number;
  roas: number | null;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0);
const count = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(
    value || 0,
  );
const pct = (value: number) => `${(value || 0).toFixed(2)}%`;
const labelize = (value?: string) =>
  value
    ? value
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/(^|\s)\S/g, (char) => char.toUpperCase())
    : "Unavailable";
const entityId = (selected: SelectedEntity) =>
  selected.kind === "campaign"
    ? selected.value.campaignId
    : selected.kind === "ad-group"
      ? selected.value.adGroupId
      : selected.kind === "ad"
        ? selected.value.adId
        : selected.value.criterionId || selected.value.id;
const entityHref = (selected: SelectedEntity) =>
  `/google-ads-analytics/${selected.kind === "campaign" ? "campaigns" : selected.kind === "ad-group" ? "ad-groups" : selected.kind === "ad" ? "ads" : "keywords"}/${encodeURIComponent(entityId(selected))}`;

function canonicalStatusTone(value?: string) {
  const status = (value || "").toUpperCase();
  if (
    status.includes("DISAPPROV") ||
    status.includes("FAIL") ||
    status.includes("REJECT")
  )
    return ["var(--danger-text)", "var(--danger-bg)", "var(--danger-border)"];
  if (
    status.includes("ENABLE") ||
    status.includes("APPROV") ||
    status.includes("ELIGIBLE")
  )
    return [
      "var(--success-text)",
      "var(--success-bg)",
      "var(--success-border)",
    ];
  if (
    status.includes("PAUSE") ||
    status.includes("REVIEW") ||
    status.includes("LIMIT")
  )
    return [
      "var(--warning-text)",
      "var(--warning-bg)",
      "var(--warning-border)",
    ];
  return ["var(--neutral-text)", "var(--neutral-bg)", "var(--neutral-border)"];
}

function Status({ value }: { value?: string }) {
  const tone = canonicalStatusTone(value);
  return (
    <span
      className="inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 text-[10px] font-bold uppercase tracking-wider"
      style={{ color: tone[0], background: tone[1], borderColor: tone[2] }}
    >
      <span className="size-1.5 rounded-full" style={{ background: tone[0] }} />
      {labelize(value)}
    </span>
  );
}

function Resource({ value }: { value?: string }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <button
      onClick={() => {
        void navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1000);
      }}
      className="inline-flex max-w-full items-center gap-2 font-mono text-[11px]"
      style={{ color: "var(--text-muted)" }}
      title={value}
    >
      <span className="truncate">{value}</span>
      <Copy size={12} />
      {copied && <span className="font-sans text-[10px]">Copied</span>}
    </button>
  );
}

function Missing({ text, inline = false }: { text: string; inline?: boolean }) {
  if (inline)
    return (
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
        {text}
      </span>
    );
  return (
    <div
      className="rounded-xl border p-3 text-sm leading-6"
      style={{
        color: "var(--text-muted)",
        background: "var(--neutral-bg)",
        borderColor: "var(--neutral-border)",
      }}
    >
      <FileSearch size={15} className="mr-2 inline" />
      {text}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-5" aria-label="Loading entity details">
      <div className="rounded-2xl border p-5" style={{ background: "var(--surface-1)", borderColor: "var(--border-subtle)" }}>
        <div className="h-4 w-40 rounded" style={{ background: "var(--surface-2)" }} />
        <div className="mt-4 h-9 max-w-xl rounded-lg" style={{ background: "var(--surface-2)" }} />
        <div className="mt-3 h-4 max-w-md rounded" style={{ background: "var(--surface-2)" }} />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        {Array.from({ length: 8 }, (_, item) => (
          <div key={item} className="h-24 rounded-2xl border" style={{ background: "var(--surface-1)", borderColor: "var(--border-subtle)" }} />
        ))}
      </div>
      <div className="h-72 rounded-2xl border" style={{ background: "var(--surface-1)", borderColor: "var(--border-subtle)" }} />
    </div>
  );
}

function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        background: "var(--surface-1)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <p
        className="text-[11px] font-bold uppercase tracking-[.11em]"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </p>
      <p className="mt-2 text-xl font-bold tracking-tight">{value}</p>
      {note && (
        <p className="mt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
          {note}
        </p>
      )}
    </div>
  );
}

function MetricGrid({
  value,
}: {
  value: Campaign | AdGroup | Creative | Keyword;
}) {
  const conversionAvailable = value.conversionValueAvailable !== false;
  const avgCpc = value.avgCpc || (value.clicks ? value.cost / value.clicks : 0);
  const cpa =
    value.cpa || (value.conversions ? value.cost / value.conversions : 0);
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
      <Metric label="Spend" value={money(value.cost)} />
      <Metric label="Impressions" value={count(value.impressions)} />
      <Metric label="Clicks" value={count(value.clicks)} />
      <Metric
        label="CTR"
        value={
          value.impressions
            ? pct((value.clicks / value.impressions) * 100)
            : "—"
        }
      />
      <Metric label="Average CPC" value={value.clicks ? money(avgCpc) : "—"} />
      <Metric label="Conversions" value={count(value.conversions)} />
      <Metric label="CPA" value={value.conversions ? money(cpa) : "—"} />
      {conversionAvailable && (
        <Metric
          label="ROAS"
          value={
            value.cost
              ? `${(value.conversionValue / value.cost).toFixed(2)}x`
              : "—"
          }
          note={`${money(value.conversionValue)} conversion value`}
        />
      )}
    </div>
  );
}

function Breadcrumbs({ selected }: { selected: SelectedEntity }) {
  const campaign = selected.value.campaignName;
  const campaignId = selected.value.campaignId;
  const groupName =
    "adGroupName" in selected.value ? selected.value.adGroupName : "";
  const groupId = "adGroupId" in selected.value ? selected.value.adGroupId : "";
  const crumbs: Array<{ label: string; href?: string }> = [
    { label: "Google Ads", href: "/google-ads-analytics" },
    { label: "Campaigns", href: "/google-ads-analytics/campaigns" },
  ];
  if (selected.kind !== "campaign" && campaign)
    crumbs.push({
      label: campaign,
      href: campaignId
        ? `/google-ads-analytics/campaigns/${campaignId}`
        : undefined,
    });
  if (selected.kind === "ad-group")
    crumbs.push(
      { label: "Ad Groups", href: "/google-ads-analytics/ad-groups" },
      { label: selected.value.adGroupName },
    );
  if (selected.kind === "ad") {
    if (groupName)
      crumbs.push({
        label: groupName,
        href: groupId
          ? `/google-ads-analytics/ad-groups/${groupId}`
          : undefined,
      });
    crumbs.push(
      { label: "Ads", href: "/google-ads-analytics/ads" },
      { label: selected.value.adName },
    );
  }
  if (selected.kind === "keyword") {
    if (groupName)
      crumbs.push({
        label: groupName,
        href: groupId
          ? `/google-ads-analytics/ad-groups/${groupId}`
          : undefined,
      });
    crumbs.push(
      { label: "Keywords", href: "/google-ads-analytics/keywords" },
      { label: selected.value.keywordText },
    );
  }
  if (selected.kind === "campaign")
    crumbs.push({ label: selected.value.campaignName });
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-1.5 text-xs"
      style={{ color: "var(--text-muted)" }}
    >
      {crumbs.map((crumb, index) => (
        <span
          key={`${crumb.label}-${index}`}
          className="flex items-center gap-1.5"
        >
          {index > 0 && <ChevronRight size={12} />}
          {crumb.href ? (
            <Link href={crumb.href} className="font-semibold hover:underline">
              {crumb.label}
            </Link>
          ) : (
            <span aria-current="page">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

function entityName(selected: SelectedEntity) {
  return selected.kind === "campaign"
    ? selected.value.campaignName
    : selected.kind === "ad-group"
      ? selected.value.adGroupName
      : selected.kind === "ad"
        ? selected.value.adName
        : selected.value.keywordText;
}
function entityStatus(selected: SelectedEntity) {
  return selected.kind === "campaign"
    ? selected.value.campaignStatus
    : selected.kind === "ad-group"
      ? selected.value.adGroupStatus
      : selected.kind === "ad"
        ? selected.value.status || selected.value.primaryStatus
        : selected.value.negative
          ? "Negative"
          : selected.value.status;
}

function DetailHeader({
  selected,
  days,
  onRefresh,
  refreshing,
}: {
  selected: SelectedEntity;
  days: number;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const value = selected.value;
  const resource =
    value.resourceName ||
    (selected.kind === "ad" ? selected.value.adGroupAdResourceName : undefined);
  const synchronizedAt =
    ("lastSynced" in value && value.lastSynced) ||
    ("pulledAt" in value && value.pulledAt);
  return (
    <header
      className="sticky top-0 z-20 -mx-4 border-b px-4 py-4 backdrop-blur-xl sm:-mx-6 sm:px-6"
      style={{
        background: "color-mix(in srgb, var(--background) 94%, transparent)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <Breadcrumbs selected={selected} />
      <div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Status value={entityStatus(selected)} />
            {selected.kind === "ad" && (
              <>
                <Status value={selected.value.approvalStatus} />
                <Status value={selected.value.reviewStatus} />
              </>
            )}
          </div>
          <h1 className="mt-2 break-words text-2xl font-bold tracking-tight sm:text-3xl">
            {entityName(selected)}
          </h1>
          <div className="mt-2">
            <Resource value={resource} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={
              selected.kind === "campaign"
                ? "/google-ads-analytics/campaigns"
                : selected.kind === "ad-group"
                  ? "/google-ads-analytics/ad-groups"
                  : selected.kind === "ad"
                    ? "/google-ads-analytics/ads"
                    : "/google-ads-analytics/keywords"
            }
            className="flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--surface-1)",
            }}
          >
            <ArrowLeft size={14} />
            Back to list
          </Link>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold disabled:opacity-50"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--surface-1)",
            }}
          >
            {refreshing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            Refresh entity
          </button>
        </div>
      </div>
      <div
        className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px]"
        style={{ color: "var(--text-muted)" }}
      >
        <span>
          ID:{" "}
          <strong style={{ color: "var(--text-secondary)" }}>
            {entityId(selected)}
          </strong>
        </span>
        <span>Range: last {days} days</span>
        {synchronizedAt && (
          <span>
            Last synchronized:{" "}
            {new Date(String(synchronizedAt)).toLocaleString()}
          </span>
        )}
      </div>
    </header>
  );
}

const DETAIL_TABS: Record<EntityKind, string[]> = {
  campaign: ["overview", "ad-groups", "ads", "keywords", "performance"],
  "ad-group": ["overview", "ads", "keywords", "performance"],
  ad: ["overview", "creative", "performance", "relationships"],
  keyword: ["overview", "performance", "related-ads", "opportunities"],
};

function DetailTabs({ tabs, active }: { tabs: string[]; active: string }) {
  return (
    <nav
      className="google-ads-tabs flex gap-1 overflow-x-auto border-b py-2"
      style={{ borderColor: "var(--border-subtle)" }}
    >
      {tabs.map((tab) => (
        <Link
          key={tab}
          href={`?view=${tab}`}
          scroll={false}
          aria-current={active === tab ? "page" : undefined}
          className="min-h-11 shrink-0 rounded-xl px-3 py-2 text-xs font-bold"
          style={{
            color:
              active === tab
                ? "var(--brand-primary-strong)"
                : "var(--text-muted)",
            background:
              active === tab ? "var(--brand-primary-soft)" : "transparent",
          }}
        >
          {labelize(tab)}
        </Link>
      ))}
    </nav>
  );
}

function PerformanceChart({ history }: { history: HistoryPoint[] }) {
  if (!history.length)
    return (
      <Missing text="No performance was recorded for this entity during the selected date range. The entity can still exist in Google Ads; change the date range or review its current delivery status." />
    );
  return (
    <section
      className="rounded-2xl border p-4 sm:p-5"
      style={{
        background: "var(--surface-1)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <div>
        <h2 className="font-bold">Performance over time</h2>
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          Daily performance snapshots aggregated by date.
        </p>
      </div>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history} margin={{ left: -15, right: 10, top: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis
              yAxisId="spend"
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => `$${Number(value).toFixed(0)}`}
            />
            <YAxis
              yAxisId="clicks"
              orientation="right"
              tick={{ fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                background: "var(--chart-tooltip)",
                borderColor: "var(--border-subtle)",
                borderRadius: 12,
              }}
              formatter={(value, name) => [
                name === "cost" ? money(Number(value)) : count(Number(value)),
                name === "cost" ? "Spend" : labelize(String(name)),
              ]}
            />
            <Line
              yAxisId="spend"
              type="monotone"
              dataKey="cost"
              stroke="var(--chart-1)"
              strokeWidth={2.5}
              dot={false}
            />
            <Line
              yAxisId="clicks"
              type="monotone"
              dataKey="clicks"
              stroke="var(--chart-2)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="clicks"
              type="monotone"
              dataKey="conversions"
              stroke="var(--chart-3)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function IdentityGrid({ selected }: { selected: SelectedEntity }) {
  const rows: Array<[string, string]> = [];
  if (selected.kind === "campaign") {
    if (
      selected.value.channelType &&
      selected.value.channelType !== "UNSPECIFIED"
    )
      rows.push(["Campaign type", labelize(selected.value.channelType)]);
    if (selected.value.budget != null)
      rows.push(["Daily budget", money(selected.value.budget)]);
    if (selected.value.biddingStrategy)
      rows.push(["Bidding strategy", labelize(selected.value.biddingStrategy)]);
    if (selected.value.startDate || selected.value.endDate)
      rows.push([
        "Start / end",
        `${selected.value.startDate || "No start"} – ${selected.value.endDate || "No end"}`,
      ]);
  } else if (selected.kind === "ad-group") {
    if (selected.value.campaignName)
      rows.push(["Parent campaign", selected.value.campaignName]);
    if (
      selected.value.adGroupType &&
      selected.value.adGroupType !== "UNSPECIFIED"
    )
      rows.push(["Ad group type", labelize(selected.value.adGroupType)]);
    if (selected.value.campaignId)
      rows.push(["Campaign ID", selected.value.campaignId]);
    if (selected.value.adGroupStatus)
      rows.push(["Status", labelize(selected.value.adGroupStatus)]);
  } else if (selected.kind === "ad") {
    if (selected.value.campaignName)
      rows.push(["Parent campaign", selected.value.campaignName]);
    if (selected.value.adGroupName)
      rows.push(["Parent ad group", selected.value.adGroupName]);
    if (selected.value.adType)
      rows.push(["Ad type", labelize(selected.value.adType)]);
    if (selected.value.publishSource)
      rows.push(["Publish source", selected.value.publishSource]);
    if (selected.value.primaryStatus)
      rows.push(["Primary status", labelize(selected.value.primaryStatus)]);
    if (selected.value.strength)
      rows.push(["Ad strength", labelize(selected.value.strength)]);
    if (selected.value.approvalStatus)
      rows.push(["Approval", labelize(selected.value.approvalStatus)]);
    if (selected.value.reviewStatus)
      rows.push(["Review", labelize(selected.value.reviewStatus)]);
  } else {
    if (selected.value.campaignName)
      rows.push(["Parent campaign", selected.value.campaignName]);
    if (selected.value.adGroupName)
      rows.push(["Parent ad group", selected.value.adGroupName]);
    if (selected.value.negative || selected.value.matchType)
      rows.push([
        "Match type",
        selected.value.negative
          ? "Negative keyword"
          : labelize(selected.value.matchType),
      ]);
    if (selected.value.qualityScore)
      rows.push(["Quality score", `${selected.value.qualityScore}/10`]);
  }
  if (!rows.length) return null;
  return (
    <section
      className="rounded-2xl border p-4 sm:p-5"
      style={{
        background: "var(--surface-1)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <h2 className="font-bold">Entity configuration</h2>
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {rows.map(([label, value]) => (
          <div key={label}>
            <p
              className="text-[9px] font-bold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              {label}
            </p>
            <p className="mt-1 break-words text-sm font-bold">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function InventoryList({
  title,
  items,
}: {
  title: string;
  items: SelectedEntity[];
}) {
  if (!items.length) return null;
  return (
    <section
      className="rounded-2xl border p-4 sm:p-5"
      style={{
        background: "var(--surface-1)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-bold">{title}</h2>
        <span
          className="rounded-full px-2 py-1 text-xs font-bold"
          style={{ background: "var(--neutral-bg)" }}
        >
          {items.length} unique
        </span>
      </div>
      <div
        className="mt-3 divide-y"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        {items.map((item) => (
          <Link
            key={`${item.kind}-${entityId(item)}`}
            href={entityHref(item)}
            className="group flex items-center gap-3 py-3"
          >
            <span
              className="grid size-9 shrink-0 place-items-center rounded-xl"
              style={{
                background: "var(--background-subtle)",
                color: "var(--brand-primary-strong)",
              }}
            >
              {item.kind === "ad-group" ? (
                <Layers3 size={15} />
              ) : (
                <Activity size={15} />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block break-words text-sm leading-5">
                {entityName(item)}
              </strong>
              <span
                className="block break-words text-[11px] leading-4"
                style={{ color: "var(--text-muted)" }}
              >
                {labelize(entityStatus(item))} · ID {entityId(item)}
              </span>
            </span>
            <ChevronRight size={15} />
          </Link>
        ))}
      </div>
    </section>
  );
}

function splitAssets(value: string) {
  return value
    .split(/\s*\|\s*|\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}
function CreativeView({ ad }: { ad: Creative }) {
  const [mode, setMode] = useState<"desktop" | "mobile">("desktop");
  const headlines = ad.headlineAssets?.length
    ? ad.headlineAssets
    : splitAssets(ad.headlines).map((text) => ({ text }));
  const descriptions = ad.descriptionAssets?.length
    ? ad.descriptionAssets
    : splitAssets(ad.descriptions).map((text) => ({ text }));
  return (
    <div className="space-y-4">
      <section
        className="rounded-2xl border p-4 sm:p-5"
        style={{
          background: "var(--surface-1)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold">Search ad preview</h2>
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              Preview uses synchronized RSA assets; Google can combine them
              differently.
            </p>
          </div>
          <div
            className="flex rounded-xl border p-1"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <button
              onClick={() => setMode("desktop")}
              className="flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-bold"
              style={{
                background:
                  mode === "desktop"
                    ? "var(--brand-primary-soft)"
                    : "transparent",
              }}
            >
              <Monitor size={13} />
              Desktop
            </button>
            <button
              onClick={() => setMode("mobile")}
              className="flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-bold"
              style={{
                background:
                  mode === "mobile"
                    ? "var(--brand-primary-soft)"
                    : "transparent",
              }}
            >
              <Smartphone size={13} />
              Mobile
            </button>
          </div>
        </div>
        <div
          className={`mt-5 rounded-2xl border p-5 ${mode === "mobile" ? "mx-auto max-w-sm" : ""}`}
          style={{
            borderColor: "var(--border-subtle)",
            background: "var(--surface-2)",
          }}
        >
          {(ad.displayUrl || ad.finalUrl) && (
            <p className="text-xs" style={{ color: "var(--success-text)" }}>
              Sponsored · {ad.displayUrl || ad.finalUrl}/
              {[ad.path1, ad.path2].filter(Boolean).join("/")}
            </p>
          )}
          <p
            className="mt-1 text-lg leading-6"
            style={{ color: "var(--info-text)" }}
          >
            {headlines
              .slice(0, 3)
              .map((item) => item.text)
              .join(" | ") || ad.adName}
          </p>
          {descriptions[0]?.text && (
            <p
              className="mt-1 text-sm leading-6"
              style={{ color: "var(--text-secondary)" }}
            >
              {descriptions[0].text}
            </p>
          )}
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <AssetList title="Headlines" items={headlines} />
        <AssetList title="Descriptions" items={descriptions} />
      </section>
      {(ad.finalUrl || ad.path1 || ad.path2) && (
        <section
          className="rounded-2xl border p-4 sm:p-5"
          style={{
            background: "var(--surface-1)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <h2 className="font-bold">URLs and paths</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Final URL" value={ad.finalUrl} link />
            <Field label="Path 1" value={ad.path1} />
            <Field label="Path 2" value={ad.path2} />
          </div>
        </section>
      )}
    </div>
  );
}

function AssetList({
  title,
  items,
}: {
  title: string;
  items: Array<{ text: string; pinnedField?: string }>;
}) {
  if (!items.length) return null;
  return (
    <section
      className="rounded-2xl border p-4 sm:p-5"
      style={{
        background: "var(--surface-1)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-bold">{title}</h2>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {items.length}
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {items.map((item, index) => (
          <div
            key={`${item.text}-${index}`}
            className="rounded-xl border p-3"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--surface-2)",
            }}
          >
            <p className="text-sm">{item.text}</p>
            {item.pinnedField && (
              <p
                className="mt-1 text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "var(--brand-primary-strong)" }}
              >
                Pinned to {labelize(item.pinnedField)}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
function Field({
  label,
  value,
  link = false,
}: {
  label: string;
  value?: string;
  link?: boolean;
}) {
  if (!value) return null;
  return (
    <div>
      <p
        className="text-[9px] font-bold uppercase tracking-wider"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </p>
      {link ? (
        <Link
          href={value}
          target="_blank"
          className="mt-1 flex items-center gap-1 break-all text-sm font-bold"
          style={{ color: "var(--info-text)" }}
        >
          {value}
          <ExternalLink size={12} />
        </Link>
      ) : (
        <p className="mt-1 text-sm font-bold">{value}</p>
      )}
    </div>
  );
}

function OverviewContent({
  selected,
  snapshot,
  history,
}: {
  selected: SelectedEntity;
  snapshot: WorkspaceSnapshot;
  history: HistoryPoint[];
}) {
  const campaignId = selected.value.campaignId;
  const groupId = "adGroupId" in selected.value ? selected.value.adGroupId : "";
  const groups = snapshot.adGroups.filter(
    (item) => item.campaignId === campaignId,
  );
  const ads = snapshot.ads.filter((item) =>
    selected.kind === "campaign"
      ? item.campaignId === campaignId
      : item.adGroupId === groupId,
  );
  const keywords = snapshot.keywords.filter((item) =>
    selected.kind === "campaign"
      ? item.campaignId === campaignId
      : item.adGroupId === groupId,
  );
  return (
    <div className="space-y-4">
      <MetricGrid value={selected.value} />
      <IdentityGrid selected={selected} />
      {history.length > 0 && <PerformanceChart history={history} />}
      {selected.kind === "campaign" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <InventoryList
            title="Ad groups"
            items={groups.map((value) => ({ kind: "ad-group", value }))}
          />
          <InventoryList
            title="Ads"
            items={ads.map((value) => ({ kind: "ad", value }))}
          />
          <InventoryList
            title="Keywords"
            items={keywords.map((value) => ({ kind: "keyword", value }))}
          />
        </div>
      )}
      {selected.kind === "ad-group" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <InventoryList
            title="Ads"
            items={ads.map((value) => ({ kind: "ad", value }))}
          />
          <InventoryList
            title="Keywords"
            items={keywords.map((value) => ({ kind: "keyword", value }))}
          />
        </div>
      )}
      {selected.kind === "ad" && <CreativeView ad={selected.value} />}
      {selected.kind === "keyword" && (
        <KeywordOpportunity keyword={selected.value} relatedAds={ads} />
      )}
    </div>
  );
}

function KeywordOpportunity({
  keyword,
  relatedAds,
}: {
  keyword: Keyword;
  relatedAds: Creative[];
}) {
  const waste = keyword.cost >= 50 && !keyword.conversions;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section
        className="rounded-2xl border p-5"
        style={{
          color: waste ? "var(--danger-text)" : "var(--success-text)",
          background: waste ? "var(--danger-bg)" : "var(--success-bg)",
          borderColor: waste ? "var(--danger-border)" : "var(--success-border)",
        }}
      >
        <div className="flex gap-3">
          {waste ? <AlertTriangle size={18} /> : <BadgeCheck size={18} />}
          <div>
            <h2 className="font-bold">
              {waste
                ? "High spend with zero conversions"
                : "No waste threshold triggered"}
            </h2>
            <p className="mt-1 text-sm leading-6">
              {waste
                ? "Review matched search terms, landing-page alignment, and match type before adding more spend."
                : "The current selected range does not meet the high-spend, zero-conversion warning rule."}
            </p>
          </div>
        </div>
      </section>
      <InventoryList
        title="Ads in the same ad group"
        items={relatedAds.map((value) => ({ kind: "ad", value }))}
      />
    </div>
  );
}

function TabContent({
  selected,
  snapshot,
  history,
  active,
}: {
  selected: SelectedEntity;
  snapshot: WorkspaceSnapshot;
  history: HistoryPoint[];
  active: string;
}) {
  const campaignId = selected.value.campaignId;
  const groupId = "adGroupId" in selected.value ? selected.value.adGroupId : "";
  const groups = snapshot.adGroups.filter(
    (item) => item.campaignId === campaignId,
  );
  const ads = snapshot.ads.filter((item) =>
    active === "related-ads" || selected.kind !== "campaign"
      ? item.adGroupId === groupId
      : item.campaignId === campaignId,
  );
  const keywords = snapshot.keywords.filter((item) =>
    selected.kind === "campaign"
      ? item.campaignId === campaignId
      : item.adGroupId === groupId,
  );
  if (active === "overview")
    return (
      <OverviewContent
        selected={selected}
        snapshot={snapshot}
        history={history}
      />
    );
  if (active === "performance")
    return (
      <div className="space-y-4">
        <MetricGrid value={selected.value} />
        <PerformanceChart history={history} />
      </div>
    );
  if (active === "ad-groups")
    return (
      <InventoryList
        title="Campaign ad groups"
        items={groups.map((value) => ({ kind: "ad-group", value }))}
      />
    );
  if (active === "ads" || active === "related-ads")
    return (
      <InventoryList
        title={
          selected.kind === "keyword"
            ? "Ads in the same ad group"
            : "Related ads"
        }
        items={ads.map((value) => ({ kind: "ad", value }))}
      />
    );
  if (active === "keywords")
    return (
      <InventoryList
        title="Related keywords"
        items={keywords.map((value) => ({ kind: "keyword", value }))}
      />
    );
  if (selected.kind === "ad" && active === "creative")
    return <CreativeView ad={selected.value} />;
  if (selected.kind === "ad" && active === "relationships")
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <InventoryList
          title="Keywords in this ad group"
          items={keywords.map((value) => ({ kind: "keyword", value }))}
        />
        <section
          className="rounded-2xl border p-5"
          style={{
            background: "var(--surface-1)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <h2 className="font-bold">Parent relationships</h2>
          <div className="mt-3 space-y-2">
            <Link
              href={`/google-ads-analytics/campaigns/${selected.value.campaignId}`}
              className="block rounded-xl border p-3 text-sm font-bold"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              Campaign · {selected.value.campaignName}
            </Link>
            {selected.value.adGroupId && (
              <Link
                href={`/google-ads-analytics/ad-groups/${selected.value.adGroupId}`}
                className="block rounded-xl border p-3 text-sm font-bold"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                Ad group · {selected.value.adGroupName}
              </Link>
            )}
            <Link
              href={`/google-ads-analytics/publishing?adId=${selected.value.adId}`}
              className="block rounded-xl border p-3 text-sm font-bold"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              Publishing records
            </Link>
          </div>
        </section>
      </div>
    );
  if (selected.kind === "keyword" && active === "opportunities")
    return <KeywordOpportunity keyword={selected.value} relatedAds={ads} />;
  return (
    <Missing
      text={`${labelize(active)} data is not available from the current synchronized fields. No placeholder values have been generated.`}
    />
  );
}

export default function EntityDetailClient({
  kind,
  id,
}: {
  kind: EntityKind;
  id: string;
}) {
  const searchParams = useSearchParams();
  const days = [7, 14, 30, 90].includes(Number(searchParams.get("days")))
    ? Number(searchParams.get("days"))
    : 30;
  const requestedView = searchParams.get("view") || "overview";
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const visibleTabs = DETAIL_TABS[kind].filter(
    (tab) => tab !== "performance" || history.length > 0,
  );
  const active = visibleTabs.includes(requestedView)
    ? requestedView
    : "overview";

  const load = useCallback(
    async (quiet = false) => {
      if (quiet) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const [workspace, historyResponse] = await Promise.all([
          fetchWorkspaceSnapshot(days),
          fetch(
            `/api/google-ads/history?entity=${kind}&id=${encodeURIComponent(id)}&days=${days}`,
            { cache: "no-store" },
          ).then(async (response) => {
            const data = await response.json();
            if (!response.ok)
              throw new Error(data.error || "History could not be loaded.");
            return data as { data?: HistoryPoint[] };
          }),
        ]);
        setSnapshot(workspace.snapshot);
        setHistory(historyResponse.data || []);
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Entity details could not be loaded.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      days,
      id,
      kind,
      setError,
      setHistory,
      setLoading,
      setRefreshing,
      setSnapshot,
    ],
  );
  useEffect(() => {
    void load();
  }, [load]);

  const selected = useMemo<SelectedEntity | null>(() => {
    if (!snapshot) return null;
    if (kind === "campaign") {
      const value = snapshot.campaigns.find(
        (item) => item.campaignId === id || item.resourceName === id,
      );
      return value ? { kind, value } : null;
    }
    if (kind === "ad-group") {
      const value = snapshot.adGroups.find(
        (item) => item.adGroupId === id || item.resourceName === id,
      );
      return value ? { kind, value } : null;
    }
    if (kind === "ad") {
      const value = snapshot.ads.find(
        (item) =>
          item.adId === id ||
          item.resourceName === id ||
          item.adGroupAdResourceName === id,
      );
      return value ? { kind, value } : null;
    }
    const value = snapshot.keywords.find(
      (item) =>
        item.criterionId === id || item.resourceName === id || item.id === id,
    );
    return value ? { kind, value } : null;
  }, [id, kind, snapshot]);

  if (loading) return <DetailSkeleton />;
  if (error)
    return (
      <div
        className="rounded-2xl border p-5"
        style={{
          color: "var(--danger-text)",
          background: "var(--danger-bg)",
          borderColor: "var(--danger-border)",
        }}
      >
        <h1 className="font-bold">Entity details could not load</h1>
        <p className="mt-2 text-sm leading-6">{error}</p>
        <button
          onClick={() => void load()}
          className="mt-4 rounded-xl border px-4 py-2 text-sm font-bold"
          style={{ borderColor: "var(--danger-border)" }}
        >
          Try again
        </button>
      </div>
    );
  if (!snapshot || !selected)
    return (
      <div
        className="rounded-2xl border p-8 text-center"
        style={{
          background: "var(--surface-1)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <FileSearch
          size={28}
          className="mx-auto"
          style={{ color: "var(--text-muted)" }}
        />
        <h1 className="mt-4 text-xl font-bold">
          Record not found in the latest inventory
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          The requested ID is not present in live Google Ads or the normalized
          Airtable fallback.
        </p>
        <Link
          href="/google-ads-analytics"
          className="mt-4 inline-flex rounded-xl px-4 py-2 text-sm font-bold"
          style={{
            background: "var(--brand-primary-soft)",
            color: "var(--brand-primary-strong)",
          }}
        >
          Back to Google Ads
        </Link>
      </div>
    );
  return (
    <div className="w-full min-w-0 max-w-full space-y-5 overflow-x-hidden">
      <DetailHeader
        selected={selected}
        days={days}
        onRefresh={() => void load(true)}
        refreshing={refreshing}
      />
      <DetailTabs tabs={visibleTabs} active={active} />
      <TabContent
        selected={selected}
        snapshot={snapshot}
        history={history}
        active={active}
      />
    </div>
  );
}
