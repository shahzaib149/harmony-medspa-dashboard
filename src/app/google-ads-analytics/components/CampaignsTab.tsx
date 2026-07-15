"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Campaign } from "../GoogleAdsAnalyticsClient";

const CHANNEL_COLORS: Record<string, string> = {
  SEARCH: "#2563EB",
  DISPLAY: "#0D9488",
  VIDEO: "#DC2626",
  PERFORMANCE_MAX: "#7C3AED",
  DEMAND_GEN: "#EA580C",
};

function fmt$(n: number, compact = false) {
  if (compact && n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtN(n: number) {
  return n.toLocaleString();
}
function fmtPct(n: number) {
  return `${n.toFixed(2)}%`;
}
function fmtRoas(n: number) {
  return `${n.toFixed(2)}x`;
}
function trunc(s: string, len: number) {
  return s.length > len ? s.slice(0, len) + "…" : s;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ENABLED: "bg-green-100 text-green-700",
    PAUSED: "bg-amber-100 text-amber-700",
    REMOVED: "bg-gray-100 text-gray-500",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-500"}`}
    >
      {status}
    </span>
  );
}

function exportCSV(rows: Campaign[]) {
  const headers = "Campaign,Status,Type,Spend,Clicks,CTR,Conversions,ROAS";
  const lines = rows.map(
    (r) =>
      `"${r.campaignName}",${r.campaignStatus},${r.channelType},${r.cost.toFixed(2)},${r.clicks},${r.ctrPct.toFixed(2)},${r.conversions.toFixed(0)},${r.roas.toFixed(2)}`,
  );
  const blob = new Blob([headers + "\n" + lines.join("\n")], {
    type: "text/csv",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "campaigns.csv";
  a.click();
}

export default function CampaignsTab({ campaigns }: { campaigns: Campaign[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PER_PAGE = 10;

  const sorted = [...campaigns].sort((a, b) => b.cost - a.cost);
  const filtered = sorted.filter((c) =>
    c.campaignName.toLowerCase().includes(search.toLowerCase()),
  );
  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const pages = Math.ceil(filtered.length / PER_PAGE);

  // Top 10 by spend for chart
  const top10 = sorted.slice(0, 10).map((c) => ({
    name: trunc(c.campaignName, 32),
    fullName: c.campaignName,
    spend: c.cost,
    roas: c.roas,
  }));

  // Channel breakdown
  const byChannel: Record<string, number> = {};
  campaigns.forEach((c) => {
    const ch = c.channelType || "SEARCH";
    byChannel[ch] = (byChannel[ch] ?? 0) + c.cost;
  });
  const channelEntries = Object.entries(byChannel).sort((a, b) => b[1] - a[1]);
  const maxChannelSpend = channelEntries[0]?.[1] ?? 1;

  // Impression share
  const avgIS =
    campaigns.length > 0
      ? campaigns.reduce((s, c) => s + c.impressionShare, 0) / campaigns.length
      : 0;
  const avgLostBudget =
    campaigns.length > 0
      ? campaigns.reduce((s, c) => s + c.impressionShareLostBudget, 0) /
        campaigns.length
      : 0;
  const avgLostRank =
    campaigns.length > 0
      ? campaigns.reduce((s, c) => s + c.impressionShareLostRank, 0) /
        campaigns.length
      : 0;

  // Top ROAS (min $5 spend, min 5 conversions)
  const topRoas = [...campaigns]
    .filter((c) => c.cost >= 5 && c.conversions >= 5)
    .sort((a, b) => b.roas - a.roas)
    .slice(0, 5);

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-16 text-[#6B7280]">
        No campaign data available. Check your Airtable connection.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top campaigns by spend */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <h3 className="text-sm font-semibold text-[#1A1A2E] mb-4">
            Top Campaigns by Spend
          </h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart
                data={top10}
                layout="vertical"
                margin={{ left: 0, right: 20, top: 0, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  tickFormatter={(v) => fmt$(Number(v), true)}
                  tick={{ fill: "#9CA3AF", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fill: "#6B7280", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v) => [fmt$(Number(v)), "Spend"]}
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="text-xs px-3 py-2 rounded-lg shadow" style={{ background: "var(--surface-raised)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)" }}>
                        <p className="font-medium mb-1">{d.fullName}</p>
                        <p>Spend: {fmt$(d.spend)}</p>
                        <p>ROAS: {fmtRoas(d.roas)}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="spend" fill="#2563EB" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel breakdown */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <h3 className="text-sm font-semibold text-[#1A1A2E] mb-4">
            Channel Type Breakdown
          </h3>
          <div className="space-y-4">
            {channelEntries.map(([channel, spend]) => (
              <div key={channel}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-[#374151]">
                    {channel.replace(/_/g, " ")}
                  </span>
                  <span className="text-sm font-medium text-[#1A1A2E]">
                    {fmt$(spend, true)}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(spend / maxChannelSpend) * 100}%`,
                      backgroundColor: CHANNEL_COLORS[channel] ?? "#6B7280",
                    }}
                  />
                </div>
              </div>
            ))}
            {channelEntries.length === 0 && (
              <p className="text-sm text-[#9CA3AF] text-center py-8">
                No channel data
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Impression share */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: "Search Impression Share",
            value: avgIS,
            color: "#2563EB",
            desc: "% of eligible impressions received",
          },
          {
            label: "Lost to Budget",
            value: avgLostBudget,
            color: "#F59E0B",
            desc: "Missed due to budget constraints",
          },
          {
            label: "Lost to Ad Rank",
            value: avgLostRank,
            color: "#EF4444",
            desc: "Missed due to low bid or quality score",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-2xl border border-[#E5E7EB] p-5"
          >
            <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">
              {item.label}
            </p>
            <p className="text-3xl font-bold text-[#1A1A2E] my-2">
              {fmtPct(item.value)}
            </p>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(item.value, 100)}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
            <p className="text-xs text-[#9CA3AF]">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Table + Top ROAS sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Campaign table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h3 className="text-sm font-semibold text-[#1A1A2E]">
              Campaign Performance
            </h3>
            <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:w-auto">
              <input
                type="text"
                placeholder="Search campaigns…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="h-11 w-full rounded-xl border border-[#E5E7EB] px-3 text-sm outline-none focus:border-[#1A6B6B] sm:w-44"
              />
              <button
                onClick={() => exportCSV(filtered)}
                className="h-11 rounded-xl border border-[#E5E7EB] px-3 text-xs text-[#6B7280] hover:bg-gray-50"
              >
                CSV
              </button>
            </div>
          </div>
          <div className="grid gap-3 md:hidden">
            {paginated.map((c) => (
              <article
                key={c.id}
                className="rounded-2xl border border-[#E5E7EB] bg-white/[.02] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 break-words text-sm font-bold text-[#1A1A2E]">
                    {c.campaignName}
                  </p>
                  <StatusBadge status={c.campaignStatus} />
                </div>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                  {(c.channelType || "—").replace(/_/g, " ")}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    ["Spend", fmt$(c.cost)],
                    ["Clicks", fmtN(c.clicks)],
                    ["CTR", fmtPct(c.ctrPct)],
                    ["Conversions", fmtN(Math.round(c.conversions))],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-white/[.035] p-3">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[#6B7280]">
                        {label}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#1A1A2E]">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-[#F3F4F6] pt-3">
                  <span className="text-xs text-[#6B7280]">
                    Return on ad spend
                  </span>
                  <span
                    className="text-lg font-bold"
                    style={{ color: "#1A6B6B" }}
                  >
                    {fmtRoas(c.roas)}
                  </span>
                </div>
              </article>
            ))}
            {paginated.length === 0 && (
              <p className="py-8 text-center text-sm text-[#9CA3AF]">
                No results
              </p>
            )}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F3F4F6]">
                  {[
                    "Campaign",
                    "Status",
                    "Type",
                    "Spend",
                    "Clicks",
                    "CTR",
                    "Conv.",
                    "ROAS",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-semibold text-[#6B7280] pb-3 pr-3 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-[#F9FAFB] hover:bg-[#F9FAFB]"
                  >
                    <td className="py-2.5 pr-3 font-medium text-[#1A1A2E] max-w-[180px]">
                      {trunc(c.campaignName, 28)}
                    </td>
                    <td className="py-2.5 pr-3">
                      <StatusBadge status={c.campaignStatus} />
                    </td>
                    <td className="py-2.5 pr-3 text-[#6B7280] text-xs">
                      {(c.channelType || "—").replace(/_/g, " ")}
                    </td>
                    <td className="py-2.5 pr-3 whitespace-nowrap">
                      {fmt$(c.cost)}
                    </td>
                    <td className="py-2.5 pr-3">{fmtN(c.clicks)}</td>
                    <td className="py-2.5 pr-3">{fmtPct(c.ctrPct)}</td>
                    <td className="py-2.5 pr-3">
                      {fmtN(Math.round(c.conversions))}
                    </td>
                    <td
                      className="py-2.5 font-bold"
                      style={{ color: "#1A6B6B" }}
                    >
                      {fmtRoas(c.roas)}
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#9CA3AF]">
                      No results
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-[#6B7280]">
              <span>
                Page {page + 1} of {pages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 rounded border border-[#E5E7EB] disabled:opacity-40 hover:bg-gray-50"
                >
                  Prev
                </button>
                <button
                  disabled={page >= pages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 rounded border border-[#E5E7EB] disabled:opacity-40 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Top ROAS sidebar */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <h3 className="text-sm font-semibold text-[#1A1A2E]">
            Top Performing Campaigns
          </h3>
          <p className="text-xs text-[#9CA3AF] mb-4 mt-0.5">
            By ROAS with minimum spend threshold
          </p>
          {topRoas.length === 0 ? (
            <p className="text-sm text-[#9CA3AF] text-center py-8">
              No campaigns meet the threshold
            </p>
          ) : (
            <div className="space-y-4">
              {topRoas.map((c, i) => (
                <div
                  key={c.id}
                  className="flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#F5F7FA] text-[#6B7280] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[#1A1A2E] leading-snug">
                        {trunc(c.campaignName, 28)}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">
                        {fmt$(c.cost)} · {Math.round(c.conversions)} conv.
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-lg font-bold flex-shrink-0"
                    style={{ color: "#1A6B6B" }}
                  >
                    {fmtRoas(c.roas)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
