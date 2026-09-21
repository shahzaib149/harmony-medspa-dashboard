"use client";


import { Skeleton } from "@/components/ui/Skeleton";
import Link from "next/link";
import ReactivationCampaignCard, { type ReactivationCampaignSummary } from "@/components/reactivation/ReactivationCampaignCard";
import { DEFAULT_CAMPAIGN, type ReactivationMetrics } from "@/lib/reactivation/model";
import {
  GitBranch,
  Megaphone,
  MessageSquare,
  Search,
  Users,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CampaignStatusBadge } from "@/components/campaigns/CampaignBadges";
import { formatCampaignDate } from "@/lib/campaigns/campaign-date";
import type { CampaignSummary } from "@/lib/types/campaigns";
import { DATA_CACHE_KEYS, setCachedData, useDashboardCachedData } from "@/lib/dashboard-data-cache";

const TEXT = "var(--text-primary)";
const MUTED = "var(--text-muted)";
const PANEL = "var(--surface-1)";

const REACTIVATION_CAMPAIGNS = 1;

type CampaignsResponse = {
  campaigns: CampaignSummary[];
  reactivation: ReactivationCampaignSummary | null;
};

function fmt(value: string | null) {
  return formatCampaignDate(value, "No activity yet");
}

export default function CampaignsClient() {
  const cached = useDashboardCachedData<CampaignsResponse>(DATA_CACHE_KEYS.campaignsSummary);
  const hadCachedOnMount = useRef(Boolean(cached));
  const [items, setItems] = useState<CampaignSummary[]>(() => cached?.campaigns ?? []);
  const [loading, setLoading] = useState(() => !cached);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [type, setType] = useState("All");
  const [reactivationData, setReactivationData] = useState<ReactivationCampaignSummary | null>(() => cached?.reactivation ?? null);
  const reactivation: ReactivationMetrics | null = reactivationData
    ? { ...reactivationData.metrics, paused: reactivationData.paused }
    : null;
  const showReactivation = DEFAULT_CAMPAIGN.toLowerCase().includes(query.toLowerCase()) && (type === "All" || type === "Manual Enrollment") && (status === "All" || (reactivation && status === (reactivation.active ? "Active" : reactivation.paused ? "Paused" : "Idle")));

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
      setError("");
    }
    try {
      const response = await fetch("/api/airtable/campaigns", {
        cache: "no-store",
      });
      const body = await response.json() as CampaignsResponse & { error?: string };
      if (!response.ok) throw new Error(body.error);
      setItems(body.campaigns);
      setReactivationData(body.reactivation);
      setCachedData(DATA_CACHE_KEYS.campaignsSummary, body);
    } catch (event) {
      if (showLoading) {
        setError(event instanceof Error ? event.message : "Could not load campaigns");
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(!hadCachedOnMount.current);
  }, [load]);

  const visible = useMemo(
    () =>
      items.filter(
        (campaign) =>
          (status === "All" || campaign.status === status) &&
          (type === "All" || campaign.type === type) &&
          `${campaign.name} ${campaign.description}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [items, query, status, type],
  );
  const totalLeads = items.reduce(
    (total, campaign) => total + campaign.totalLeads,
    0,
  );
  const messages = items.reduce(
    (total, campaign) => total + campaign.messagesSent,
    0,
  );
  const summaryCards = [
    {
      label: "Total Campaigns",
      // Lead campaigns come from the registry; patient reactivation is a separate workspace.
      value: items.length + REACTIVATION_CAMPAIGNS,
      icon: <Megaphone size={18} />,
    },
    {
      label: "Active Campaigns",
      value: items.filter((campaign) => campaign.status === "Active").length + (reactivation && reactivation.active > 0 ? 1 : 0),
      icon: <Zap size={18} />,
    },
    { label: "Campaign Contacts", value: totalLeads + (reactivation?.total ?? 0), icon: <Users size={18} /> },
    {
      label: "Messages Sent",
      value: messages + (reactivation ? reactivation.email : 0),
      icon: <MessageSquare size={18} />,
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="min-w-0 rounded-xl border p-3.5 sm:p-4"
            style={{ background: PANEL, borderColor: "rgba(201,168,76,.14)" }}
          >
            <span className="text-[#C9A84C]">{card.icon}</span>
            <p
              className="mt-2 text-xl font-bold sm:mt-3 sm:text-2xl"
              style={{ color: TEXT }}
            >
              {card.value}
            </p>
            <p
              className="mt-0.5 text-[11px] leading-4 sm:text-xs"
              style={{ color: MUTED }}
            >
              {card.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_170px_190px] sm:gap-3">
        <label className="relative min-w-0">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            size={16}
            color={MUTED}
          />
          <input
            aria-label="Search campaigns"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search campaigns"
            className="h-11 w-full rounded-xl border bg-[var(--input-bg)] pl-10 pr-3 text-sm text-[var(--text-primary)]"
            style={{ borderColor: "var(--border-subtle)" }}
          />
        </label>
        <select
          aria-label="Campaign status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-11 w-full rounded-xl border bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          {["All", "Active", "Paused", "Idle", "Coming Soon"].map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <select
          aria-label="Campaign type"
          value={type}
          onChange={(event) => setType(event.target.value)}
          className="h-11 w-full rounded-xl border bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          {["All", "Automatic", "Manual Enrollment"].map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
      {loading ? (
        <div className="contents" role="status" aria-label="Loading campaigns">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="grid gap-4 rounded-2xl border p-5"
              style={{ background: PANEL, borderColor: "var(--border-subtle)" }}
            >
              <div className="flex items-center gap-3"><Skeleton className="size-11 rounded-xl" /><div className="grid flex-1 gap-2"><Skeleton className="h-4 w-1/2 rounded-full" /><Skeleton className="h-3 w-3/4 rounded-full" /></div></div>
              <div className="flex gap-2"><Skeleton className="h-6 w-24 rounded-full" /><Skeleton className="h-6 w-14 rounded-full" /></div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[0, 1, 2, 3].map((cell) => <Skeleton key={cell} className="h-14 rounded-xl" />)}</div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center text-red-300">
          <p>{error}</p>
          <button
            onClick={() => void load()}
            className="mt-3 min-h-11 rounded-lg border px-4 py-2"
          >
            Retry
          </button>
        </div>
      ) : visible.length === 0 && !showReactivation ? (
        <div
          className="rounded-xl border border-white/10 p-10 text-center"
          style={{ color: MUTED }}
        >
          No campaigns match these filters.
        </div>
      ) : (
        <div className="contents">
          {visible.map((campaign) => (
            <Link
              key={campaign.slug}
              href={`/campaigns/${campaign.slug}`}
              className="block rounded-2xl border p-4 transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] sm:p-5"
              style={{ background: PANEL, borderColor: `${campaign.accent ?? "#C9A84C"}33` }}
            >
              <article>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <div
                      className="grid size-11 shrink-0 place-items-center rounded-xl"
                      style={{
                        background: `${campaign.accent ?? "#C9A84C"}18`,
                        color: campaign.accent ?? "#C9A84C",
                      }}
                    >
                      {campaign.slug === "speed-to-lead" ? (
                        <Zap size={20} />
                      ) : (
                        <GitBranch size={20} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2
                        className="text-base font-bold sm:text-lg"
                        style={{ color: TEXT }}
                      >
                        {campaign.name}
                      </h2>
                      <p
                        className="mt-1 line-clamp-2 text-sm leading-5"
                        style={{ color: MUTED }}
                      >
                        {campaign.description}
                      </p>
                    </div>
                  </div>
                  <CampaignStatusBadge status={campaign.status} />
                </div>
                <div
                  className="mt-4 flex flex-wrap gap-2 text-[11px]"
                  style={{ color: MUTED }}
                >
                  {campaign.type && (
                    <span className="rounded-full bg-white/5 px-2 py-1">
                      {campaign.type}
                    </span>
                  )}
                  {(campaign.channels ?? []).map((channel) => (
                    <span
                      key={channel}
                      className="rounded-full bg-white/5 px-2 py-1"
                    >
                      {channel}
                    </span>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    ["Leads", campaign.totalLeads],
                    ["Active", campaign.activeLeads],
                    ["Completed", campaign.completedLeads],
                    ["Messages", campaign.messagesSent],
                  ].map(([label, value]) => (
                    <div
                      key={String(label)}
                      className="rounded-xl bg-white/[.025] px-3 py-2.5"
                    >
                      <p className="font-bold" style={{ color: TEXT }}>
                        {value}
                      </p>
                      <p className="text-[10px]" style={{ color: MUTED }}>
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 border-t border-white/5 pt-3">
                  <p className="text-xs" style={{ color: MUTED }}>
                    Last activity: {fmt(campaign.lastActivity)}
                  </p>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
      <ReactivationCampaignCard query={query} status={status} type={type} data={reactivationData}/>
      </div>
    </div>
  );
}
