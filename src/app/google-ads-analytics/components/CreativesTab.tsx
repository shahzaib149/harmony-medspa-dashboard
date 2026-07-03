"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";
import type { Creative } from "../GoogleAdsAnalyticsClient";

const PIE_COLORS = ["#2563EB", "#0D9488", "#DC2626", "#7C3AED", "#EA580C", "#10B981", "#F59E0B"];

function fmt$(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtRoas(n: number) { return `${n.toFixed(2)}x`; }
function trunc(s: string, len: number) { return s.length > len ? s.slice(0, len) + "…" : s; }

// Aggregate creatives by ad name
function aggregateCreatives(creatives: Creative[]) {
  const map = new Map<string, Creative & { count: number }>();
  for (const c of creatives) {
    const key = c.adName || c.id;
    const existing = map.get(key);
    if (existing) {
      existing.clicks += c.clicks;
      existing.cost += c.cost;
      existing.impressions += c.impressions;
      existing.conversions += c.conversions;
      existing.conversionValue += c.conversionValue;
      existing.count++;
    } else {
      map.set(key, { ...c, count: 1 });
    }
  }
  return Array.from(map.values()).map(c => ({
    ...c,
    ctrPct: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
    roas: c.cost > 0 ? c.conversionValue / c.cost : 0,
  }));
}

function exportCSV(rows: ReturnType<typeof aggregateCreatives>) {
  const headers = "Ad,Type,Campaign,Clicks,Spend,Conversions,ROAS";
  const lines = rows.map(r =>
    `"${r.adName}","${r.adType}","${r.campaignName}",${r.clicks},${r.cost.toFixed(2)},${r.conversions.toFixed(0)},${r.roas.toFixed(2)}`
  );
  const blob = new Blob([headers + "\n" + lines.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "creatives.csv";
  a.click();
}

export default function CreativesTab({ creatives }: { creatives: Creative[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PER_PAGE = 10;

  const aggregated = useMemo(() => aggregateCreatives(creatives), [creatives]);
  const sortedByClicks = useMemo(() => [...aggregated].sort((a, b) => b.clicks - a.clicks), [aggregated]);

  const filtered = sortedByClicks.filter(c =>
    c.adName.toLowerCase().includes(search.toLowerCase())
  );
  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const pages = Math.ceil(filtered.length / PER_PAGE);

  // Ad type breakdown for pie
  const byType: Record<string, number> = {};
  aggregated.forEach(c => {
    const t = c.adType || "UNKNOWN";
    byType[t] = (byType[t] ?? 0) + c.cost;
  });
  const pieData = Object.entries(byType).map(([name, value]) => ({
    name: name.replace(/_/g, " "),
    rawName: name,
    value,
  })).sort((a, b) => b.value - a.value);

  const totalPieValue = pieData.reduce((s, d) => s + d.value, 0);

  // Top 8 by clicks for bar chart
  const top8 = sortedByClicks.slice(0, 8).map(c => ({
    name: trunc(c.adName, 36),
    fullName: c.adName,
    clicks: c.clicks,
    roas: c.roas,
  }));

  if (creatives.length === 0) {
    return <div className="text-center py-16 text-[#6B7280]">No creatives data available.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Donut: ad type breakdown */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <h3 className="text-sm font-semibold text-[#1A1A2E] mb-4">Ad Type Breakdown by Spend</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={70} outerRadius={110} paddingAngle={2}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-[#1e293b] text-white text-xs px-3 py-2 rounded-lg shadow">
                        <p className="font-medium">{d.name}</p>
                        <p>{fmt$(d.value)} · {totalPieValue > 0 ? ((d.value / totalPieValue) * 100).toFixed(1) : 0}%</p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-xs text-[#6B7280]">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar: top ads by clicks */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <h3 className="text-sm font-semibold text-[#1A1A2E] mb-4">Top Ads by Clicks</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top8} margin={{ bottom: 60, left: 0, right: 10, top: 0 }}>
                <XAxis dataKey="name" tick={{ fill: "#9CA3AF", fontSize: 10, angle: -25, textAnchor: "end" }}
                  axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-[#1e293b] text-white text-xs px-3 py-2 rounded-lg shadow">
                        <p className="font-medium mb-1">{d.fullName}</p>
                        <p>Clicks: {d.clicks.toLocaleString()}</p>
                        <p>ROAS: {fmtRoas(d.roas)}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="clicks" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Creatives table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h3 className="text-sm font-semibold text-[#1A1A2E]">Creatives Performance</h3>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search ads…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="text-sm border border-[#E5E7EB] rounded-lg px-3 py-1.5 outline-none focus:border-[#1A6B6B] w-44"
            />
            <button
              onClick={() => exportCSV(filtered)}
              className="text-xs px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:bg-gray-50"
            >
              CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F3F4F6]">
                {["Ad", "Type", "Campaign", "Clicks", "Spend", "Conv.", "ROAS"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-[#6B7280] pb-3 pr-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map(c => (
                <tr key={c.id} className="border-b border-[#F9FAFB] hover:bg-[#F9FAFB]">
                  <td className="py-2.5 pr-3 max-w-[200px]">
                    <Link
                      href={`/google-ads-analytics/creative-detail?name=${encodeURIComponent(c.adName)}&adId=${encodeURIComponent(c.adId)}`}
                      className="font-medium hover:underline"
                      style={{ color: "#1A6B6B" }}
                    >
                      {trunc(c.adName, 36)}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-3">
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-[#6B7280]">
                      {(c.adType || "—").replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-[#9CA3AF] text-xs">{trunc(c.campaignName, 28)}</td>
                  <td className="py-2.5 pr-3">{c.clicks.toLocaleString()}</td>
                  <td className="py-2.5 pr-3 whitespace-nowrap">{fmt$(c.cost)}</td>
                  <td className="py-2.5 pr-3">{Math.round(c.conversions).toLocaleString()}</td>
                  <td className="py-2.5 font-bold" style={{ color: "#1A6B6B" }}>{fmtRoas(c.roas)}</td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-[#9CA3AF]">No results</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm text-[#6B7280]">
            <span>Page {page + 1} of {pages}</span>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 rounded border border-[#E5E7EB] disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 rounded border border-[#E5E7EB] disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
