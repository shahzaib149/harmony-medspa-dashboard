"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { CircleAlert, GitBranch, Megaphone, MessageSquare, RefreshCw, Search, Users, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import ReactivationCampaignCard from "@/components/reactivation/ReactivationCampaignCard";
import { BlackFridayCampaignCard, GiftCardCampaignCard } from "@/components/campaigns/SeasonalCampaignCards";
import { CampaignStatusBadge } from "@/components/campaigns/CampaignBadges";
import { formatCampaignDate } from "@/lib/campaigns/campaign-date";
import { DEFAULT_CAMPAIGN } from "@/lib/reactivation/model";
import { BLACK_FRIDAY_NAME } from "@/lib/black-friday/campaign";
import { GIFT_CARDS_NAME } from "@/lib/gift-cards/campaign";
import { CAMPAIGNS } from "@/lib/campaigns/registry";
import type { CampaignsOverview } from "@/lib/campaigns/overview";
import type { CampaignSummary } from "@/lib/types/campaigns";

const TEXT = "var(--text-primary)";
const MUTED = "var(--text-muted)";
const PANEL = "var(--surface-1)";

/** Registry campaigns + Black Friday + Gift Cards + Reactivation. */
export const TOTAL_CAMPAIGNS = CAMPAIGNS.length + 3;

function CardSkeleton() {
  return (
    <div className="grid gap-4 rounded-2xl border p-5" style={{ background: PANEL, borderColor: "var(--border-subtle)" }}>
      <div className="flex items-center gap-3"><Skeleton className="size-11 rounded-xl" /><div className="grid flex-1 gap-2"><Skeleton className="h-4 w-1/2 rounded-full" /><Skeleton className="h-3 w-3/4 rounded-full" /></div></div>
      <div className="flex gap-2"><Skeleton className="h-6 w-24 rounded-full" /><Skeleton className="h-6 w-14 rounded-full" /></div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[0, 1, 2, 3].map((cell) => <Skeleton key={cell} className="h-14 rounded-xl" />)}</div>
    </div>
  );
}

/** Streaming fallback: the KPI row and one placeholder per campaign. */
export function CampaignsSkeleton() {
  return (
    <div className="space-y-5 sm:space-y-6" role="status" aria-label="Loading campaigns">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[104px] rounded-xl" />)}</div>
      <Skeleton className="h-11 rounded-xl" />
      <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: TOTAL_CAMPAIGNS }, (_, i) => <CardSkeleton key={i} />)}</div>
    </div>
  );
}

function FailedCard({ name, onRetry, retrying }: { name: string; onRetry: () => void; retrying: boolean }) {
  return (
    <div className="grid min-h-[208px] place-items-center rounded-2xl border p-5 text-center" style={{ background: PANEL, borderColor: "var(--warning-border)" }}>
      <div className="grid justify-items-center gap-2">
        <CircleAlert size={20} style={{ color: "var(--warning-text)" }} />
        <p className="text-sm font-bold" style={{ color: TEXT }}>{name}</p>
        <p className="text-xs" style={{ color: MUTED }}>Couldn&apos;t load this campaign&apos;s numbers.</p>
        <button type="button" onClick={onRetry} disabled={retrying} className="mt-1 inline-flex min-h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold" style={{ borderColor: "var(--border-strong)", color: TEXT }}>
          <RefreshCw size={13} className={retrying ? "animate-spin" : ""} /> Try again
        </button>
      </div>
    </div>
  );
}

function RegistryCard({ campaign }: { campaign: CampaignSummary }) {
  return (
    <Link
      href={`/campaigns/${campaign.slug}`}
      className="block rounded-2xl border p-4 transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] sm:p-5"
      style={{ background: PANEL, borderColor: `${campaign.accent ?? "#C9A84C"}33` }}
    >
      <article>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl" style={{ background: `${campaign.accent ?? "#C9A84C"}18`, color: campaign.accent ?? "#C9A84C" }}>
              {campaign.slug === "speed-to-lead" ? <Zap size={20} /> : <GitBranch size={20} />}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold sm:text-lg" style={{ color: TEXT }}>{campaign.name}</h2>
              <p className="mt-1 line-clamp-2 text-sm leading-5" style={{ color: MUTED }}>{campaign.description}</p>
            </div>
          </div>
          <CampaignStatusBadge status={campaign.status} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-[11px]" style={{ color: MUTED }}>
          {campaign.type ? <span className="rounded-full bg-[var(--surface-2)] px-2 py-1">{campaign.type}</span> : null}
          {(campaign.channels ?? []).map((channel) => <span key={channel} className="rounded-full bg-[var(--surface-2)] px-2 py-1">{channel}</span>)}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {([["Leads", campaign.totalLeads], ["Active", campaign.activeLeads], ["Completed", campaign.completedLeads], ["Messages", campaign.messagesSent]] as const).map(([label, value]) => (
            <div key={label} className="rounded-xl bg-[var(--surface-2)] px-3 py-2.5">
              <p className="font-bold tabular-nums" style={{ color: TEXT }}>{value}</p>
              <p className="text-[10px]" style={{ color: MUTED }}>{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-[var(--border-subtle)] pt-3">
          <p className="text-xs" style={{ color: MUTED }}>Last activity: {formatCampaignDate(campaign.lastActivity, "No activity yet")}</p>
        </div>
      </article>
    </Link>
  );
}

type Entry = { key: string; name: string; description: string; status: string; type: string; node: ReactNode };

export default function CampaignsClient({ initial }: { initial: CampaignsOverview }) {
  const [data, setData] = useState(initial);
  const [retrying, setRetrying] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [type, setType] = useState("All");

  async function retry() {
    setRetrying(true);
    try {
      const response = await fetch("/api/airtable/campaigns?refresh=1", { cache: "no-store" });
      if (response.ok) setData(await response.json() as CampaignsOverview);
    } finally {
      setRetrying(false);
    }
  }

  const reactivationState = data.reactivation ? (data.reactivation.metrics.active ? "Active" : data.reactivation.paused ? "Paused" : "Idle") : "Idle";

  // Fixed order: lead automations, then the seasonal workspaces, then patient reactivation.
  const entries: Entry[] = useMemo(() => {
    const registry: Entry[] = data.campaigns
      ? data.campaigns.map((c) => ({ key: c.slug, name: c.name, description: c.description, status: c.status, type: c.type ?? "", node: <RegistryCard campaign={c} /> }))
      : CAMPAIGNS.map((c) => ({ key: c.slug, name: c.name, description: c.description, status: c.status, type: c.type ?? "", node: <FailedCard name={c.name} onRetry={() => void retry()} retrying={retrying} /> }));
    const bf: Entry = { key: "black-friday", name: BLACK_FRIDAY_NAME, description: "Black Friday members patients", status: data.blackFriday?.status ?? "Active", type: "Automatic",
      node: data.blackFriday ? <BlackFridayCampaignCard data={data.blackFriday} query="" status="All" type="All" /> : <FailedCard name={BLACK_FRIDAY_NAME} onRetry={() => void retry()} retrying={retrying} /> };
    const gift: Entry = { key: "gift-cards", name: GIFT_CARDS_NAME, description: "Gift card requests bonus", status: data.giftCards?.status ?? "Active", type: "Automatic",
      node: data.giftCards ? <GiftCardCampaignCard data={data.giftCards} query="" status="All" type="All" /> : <FailedCard name={GIFT_CARDS_NAME} onRetry={() => void retry()} retrying={retrying} /> };
    const reactivation: Entry = { key: "reactivation", name: DEFAULT_CAMPAIGN, description: "Three-step email follow-up for returning patients", status: reactivationState, type: "Manual Enrollment",
      node: data.reactivation || !data.failed.includes("reactivation") ? <ReactivationCampaignCard query="" status="All" type="All" data={data.reactivation} /> : <FailedCard name={DEFAULT_CAMPAIGN} onRetry={() => void retry()} retrying={retrying} /> };
    return [...registry, bf, gift, reactivation];
  }, [data, retrying, reactivationState]);

  const visible = entries.filter((e) => (status === "All" || e.status === status) && (type === "All" || e.type === type) && `${e.name} ${e.description}`.toLowerCase().includes(query.toLowerCase()));

  const registry = data.campaigns ?? [];
  const summaryCards = [
    { label: "Total Campaigns", value: TOTAL_CAMPAIGNS, icon: <Megaphone size={18} /> },
    { label: "Active Campaigns", value: entries.filter((e) => e.status === "Active").length, icon: <Zap size={18} /> },
    { label: "Campaign Contacts", value: registry.reduce((t, c) => t + c.totalLeads, 0) + (data.reactivation?.metrics.total ?? 0) + (data.blackFriday?.metrics.contacts ?? 0) + (data.giftCards?.metrics.requests ?? 0), icon: <Users size={18} /> },
    { label: "Messages Sent", value: registry.reduce((t, c) => t + c.messagesSent, 0) + (data.reactivation?.metrics.email ?? 0) + (data.blackFriday?.metrics.messagesSent ?? 0) + (data.giftCards?.metrics.confirmations ?? 0), icon: <MessageSquare size={18} /> },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="min-w-0 rounded-xl border p-3.5 sm:p-4" style={{ background: PANEL, borderColor: "rgba(201,168,76,.14)" }}>
            <span className="text-[#C9A84C]">{card.icon}</span>
            <p className="mt-2 text-xl font-bold tabular-nums sm:mt-3 sm:text-2xl" style={{ color: TEXT }}>{card.value.toLocaleString()}</p>
            <p className="mt-0.5 text-[11px] leading-4 sm:text-xs" style={{ color: MUTED }}>{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_170px_190px] sm:gap-3">
        <label className="relative min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" size={16} color={MUTED} />
          <input aria-label="Search campaigns" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search campaigns"
            className="h-11 w-full rounded-xl border bg-[var(--input-bg)] pl-10 pr-3 text-sm text-[var(--text-primary)]" style={{ borderColor: "var(--border-subtle)" }} />
        </label>
        <select aria-label="Campaign status" value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 w-full rounded-xl border bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]" style={{ borderColor: "var(--border-subtle)" }}>
          {["All", "Active", "Paused", "Idle", "Scheduled", "Ended"].map((o) => <option key={o}>{o}</option>)}
        </select>
        <select aria-label="Campaign type" value={type} onChange={(e) => setType(e.target.value)} className="h-11 w-full rounded-xl border bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]" style={{ borderColor: "var(--border-subtle)" }}>
          {["All", "Automatic", "Manual Enrollment"].map((o) => <option key={o}>{o}</option>)}
        </select>
      </div>

      {visible.length ? (
        <div className="grid gap-4 md:grid-cols-2">{visible.map((e) => <div key={e.key} className="min-w-0">{e.node}</div>)}</div>
      ) : (
        <div className="rounded-2xl border p-10 text-center text-sm" style={{ color: MUTED, borderColor: "var(--border-subtle)", background: PANEL }}>No campaigns match these filters.</div>
      )}
    </div>
  );
}
