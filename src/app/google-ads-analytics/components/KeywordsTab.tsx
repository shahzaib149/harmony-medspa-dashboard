"use client";

import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";
import type { Keyword } from "../GoogleAdsAnalyticsClient";

const MATCH_COLORS: Record<string, string> = {
  EXACT: "#2563EB", PHRASE: "#7C3AED", BROAD: "#0D9488",
};

function fmt$(n: number, compact = false) {
  if (compact && n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtPct(n: number) { return `${n.toFixed(2)}%`; }
function fmtRoas(n: number) { return `${n.toFixed(2)}x`; }
function trunc(s: string, len: number) { return s.length > len ? s.slice(0, len) + "…" : s; }

function exportCSV(rows: Keyword[]) {
  const headers = "Keyword,Match,Campaign,Spend,Clicks,CTR,ROAS";
  const lines = rows.map(r =>
    `"${r.keywordText}",${r.matchType},"${r.campaignName}",${r.cost.toFixed(2)},${r.clicks},${r.ctrPct.toFixed(2)},${r.roas.toFixed(2)}`
  );
  const blob = new Blob([headers + "\n" + lines.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "keywords.csv";
  a.click();
}

export default function KeywordsTab({ keywords }: { keywords: Keyword[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PER_PAGE = 10;

  const sorted = useMemo(() => [...keywords].sort((a, b) => b.cost - a.cost), [keywords]);

  const filtered = sorted.filter(k =>
    k.keywordText.toLowerCase().includes(search.toLowerCase()) ||
    k.campaignName.toLowerCase().includes(search.toLowerCase())
  );
  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const pages = Math.ceil(filtered.length / PER_PAGE);

  // Match type pie
  const byMatch: Record<string, number> = {};
  keywords.forEach(k => { byMatch[k.matchType || "BROAD"] = (byMatch[k.matchType || "BROAD"] ?? 0) + k.cost; });
  const matchPieData = Object.entries(byMatch).map(([name, value]) => ({ name, value }));

  // Top 10 by spend
  const top10 = sorted.slice(0, 10).map(k => ({
    name: trunc(k.keywordText, 24),
    full: k.keywordText,
    spend: k.cost,
    roas: k.roas,
  }));

  // Top ROAS keywords (min 5 clicks, 8 conversions)
  const topRoasKw = [...keywords]
    .filter(k => k.clicks >= 5 && k.conversions >= 8)
    .sort((a, b) => b.roas - a.roas)
    .slice(0, 8);

  // High spend, zero conversions ($50+, 0 conv)
  const wasted = sorted.filter(k => k.cost >= 50 && k.conversions === 0);

  if (keywords.length === 0) {
    return <div className="text-center py-16 text-[#6B7280]">No keyword data available.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Pie + Bar row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Match type pie */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <h3 className="text-sm font-semibold text-[#1A1A2E] mb-3">Match Type Spend</h3>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie data={matchPieData} dataKey="value" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {matchPieData.map((d) => (
                    <Cell key={d.name} fill={MATCH_COLORS[d.name] ?? "#9CA3AF"} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-[#1e293b] text-white text-xs px-3 py-2 rounded-lg shadow">
                        <p className="font-medium">{d.name}</p>
                        <p>{fmt$(d.value)}</p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {matchPieData.map(d => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: MATCH_COLORS[d.name] ?? "#9CA3AF" }} />
                  <span className="text-xs text-[#6B7280]">{d.name}</span>
                </div>
                <span className="text-xs font-medium text-[#1A1A2E]">{fmt$(d.value, true)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top keywords bar */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <h3 className="text-sm font-semibold text-[#1A1A2E] mb-4">Top Keywords by Spend</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={top10} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                <XAxis type="number" tickFormatter={v => fmt$(Number(v), true)}
                  tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={120}
                  tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-[#1e293b] text-white text-xs px-3 py-2 rounded-lg shadow">
                        <p className="font-medium mb-1">{d.full}</p>
                        <p>Spend: {fmt$(d.spend)}</p>
                        <p>ROAS: {fmtRoas(d.roas)}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="spend" fill="#7C3AED" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top ROAS Keywords */}
      {topRoasKw.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <h3 className="text-sm font-semibold text-[#1A1A2E]">Best Converting Keywords</h3>
          <p className="text-xs text-[#9CA3AF] mb-4 mt-0.5">Min 5 clicks and 8 conversions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {topRoasKw.map(k => (
              <div key={k.id} className="border border-[#E5E7EB] rounded-xl p-4">
                <p className="text-sm font-medium text-[#1A1A2E] leading-snug mb-1">{k.keywordText}</p>
                <p className="text-xs text-[#9CA3AF] mb-3">
                  <span style={{ color: MATCH_COLORS[k.matchType] ?? "#9CA3AF" }}>{k.matchType}</span>
                  {k.campaignName ? ` · ${trunc(k.campaignName, 24)}` : ""}
                </p>
                <p className="text-2xl font-bold" style={{ color: "#1A6B6B" }}>{fmtRoas(k.roas)}</p>
                <p className="text-xs text-[#9CA3AF] mt-1">{fmt$(k.cost)} · {Math.round(k.conversions)} conv.</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* High spend, zero conversions */}
      {wasted.length > 0 && (
        <div className="bg-white rounded-2xl border border-red-100 p-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-semibold text-[#1A1A2E]">High Spend, Low Conversion Keywords</h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Keywords with $50+ spend and zero conversions</p>
            </div>
            <button
              onClick={() => exportCSV(wasted)}
              className="text-xs px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:bg-gray-50"
            >
              CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F3F4F6]">
                  {["Keyword", "Match", "Campaign", "Spend", "Clicks", "ROAS"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-[#6B7280] pb-3 pr-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {wasted.map(k => (
                  <tr key={k.id} className="border-b border-[#FEF2F2] hover:bg-red-50">
                    <td className="py-2 pr-3 max-w-[160px] text-[#1A1A2E] font-medium">{trunc(k.keywordText, 40)}</td>
                    <td className="py-2 pr-3">
                      <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ color: MATCH_COLORS[k.matchType] ?? "#6B7280", backgroundColor: `${MATCH_COLORS[k.matchType] ?? "#9CA3AF"}15` }}>
                        {k.matchType}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-[#9CA3AF] text-xs">{trunc(k.campaignName, 28)}</td>
                    <td className="py-2 pr-3 text-red-600 font-medium">{fmt$(k.cost)}</td>
                    <td className="py-2 pr-3">{k.clicks.toLocaleString()}</td>
                    <td className="py-2 text-[#9CA3AF]">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All keywords table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h3 className="text-sm font-semibold text-[#1A1A2E]">All Keywords Performance</h3>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search keywords…"
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
                {["Keyword", "Match", "Campaign", "Spend", "Clicks", "CTR", "ROAS"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-[#6B7280] pb-3 pr-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map(k => (
                <tr key={k.id} className="border-b border-[#F9FAFB] hover:bg-[#F9FAFB]">
                  <td className="py-2.5 pr-3 font-medium text-[#1A1A2E]">{trunc(k.keywordText, 36)}</td>
                  <td className="py-2.5 pr-3">
                    <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ color: MATCH_COLORS[k.matchType] ?? "#6B7280", backgroundColor: `${MATCH_COLORS[k.matchType] ?? "#9CA3AF"}15` }}>
                      {k.matchType || "—"}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-[#9CA3AF] text-xs">{trunc(k.campaignName, 28)}</td>
                  <td className="py-2.5 pr-3 whitespace-nowrap">{fmt$(k.cost)}</td>
                  <td className="py-2.5 pr-3">{k.clicks.toLocaleString()}</td>
                  <td className="py-2.5 pr-3">{fmtPct(k.ctrPct)}</td>
                  <td className="py-2.5 font-bold" style={{ color: "#1A6B6B" }}>{fmtRoas(k.roas)}</td>
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
