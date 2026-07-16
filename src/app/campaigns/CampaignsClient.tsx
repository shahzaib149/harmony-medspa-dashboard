"use client";

import Link from "next/link";
import {
  GitBranch,
  Megaphone,
  MessageSquare,
  Search,
  Users,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CampaignStatusBadge } from "@/components/campaigns/CampaignBadges";
import { formatCampaignDate } from "@/lib/campaigns/campaign-date";
import type { CampaignSummary } from "@/lib/types/campaigns";

const TEXT = "var(--text-primary)";
const MUTED = "var(--text-muted)";
const PANEL = "var(--surface-1)";

function fmt(value: string | null) {
  return formatCampaignDate(value, "No activity yet");
}

export default function CampaignsClient() {
  const [items, setItems] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [type, setType] = useState("All");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/airtable/campaigns", {
        cache: "no-store",
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setItems(body.campaigns);
    } catch (event) {
      setError(
        event instanceof Error ? event.message : "Could not load campaigns",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
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
      value: items.length,
      icon: <Megaphone size={18} />,
    },
    {
      label: "Active Campaigns",
      value: items.filter((campaign) => campaign.status === "Active").length,
      icon: <Zap size={18} />,
    },
    { label: "Campaign Leads", value: totalLeads, icon: <Users size={18} /> },
    {
      label: "Messages Sent",
      value: messages,
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
            className="h-11 w-full rounded-xl border bg-transparent pl-10 pr-3 text-sm text-white"
            style={{ borderColor: "#292932" }}
          />
        </label>
        <select
          aria-label="Campaign status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-11 w-full rounded-xl border bg-[#101016] px-3 text-sm text-white"
          style={{ borderColor: "#292932" }}
        >
          {["All", "Active", "Paused", "Coming Soon"].map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <select
          aria-label="Campaign type"
          value={type}
          onChange={(event) => setType(event.target.value)}
          className="h-11 w-full rounded-xl border bg-[#101016] px-3 text-sm text-white"
          style={{ borderColor: "#292932" }}
        >
          {["All", "Automatic", "Manual Enrollment"].map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-72 animate-pulse rounded-2xl bg-white/5"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center text-red-300">
          <p>{error}</p>
          <button
            onClick={load}
            className="mt-3 min-h-11 rounded-lg border px-4 py-2"
          >
            Retry
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div
          className="rounded-xl border border-white/10 p-10 text-center"
          style={{ color: MUTED }}
        >
          No campaigns match these filters.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((campaign) => (
            <Link
              key={campaign.slug}
              href={`/campaigns/${campaign.slug}`}
              className="block rounded-2xl border p-4 transition-colors hover:bg-white/[.02] sm:p-5"
              style={{ background: PANEL, borderColor: `${campaign.accent}33` }}
            >
              <article>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <div
                      className="grid size-11 shrink-0 place-items-center rounded-xl"
                      style={{
                        background: `${campaign.accent}18`,
                        color: campaign.accent,
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
                  <span className="rounded-full bg-white/5 px-2 py-1">
                    {campaign.type}
                  </span>
                  {campaign.channels.map((channel) => (
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
    </div>
  );
}
