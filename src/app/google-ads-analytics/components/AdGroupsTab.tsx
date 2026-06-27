"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { AdGroup } from "../GoogleAdsAnalyticsClient";

function fmt$(n: number, compact = false) {
  if (compact && n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtPct(n: number) { return `${n.toFixed(2)}%`; }
function fmtRoas(n: number) { return `${n.toFixed(2)}x`; }
function trunc(s: string, len: number) { return s.length > len ? s.slice(0, len) + "…" : s; }

function exportCSV(rows: AdGroup[]) {
  const headers = "Ad Group,Campaign,Status,Spend,Clicks,CTR,ROAS";
  const lines = rows.map(r =>
    `"${r.adGroupName}","${r.campaignName}",${r.adGroupStatus},${r.cost.toFixed(2)},${r.clicks},${r.ctrPct.toFixed(2)},${r.roas.toFixed(2)}`
  );
  const blob = new Blob([headers + "\n" + lines.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "ad-groups.csv";
  a.click();
}

export default function AdGroupsTab({ adGroups }: { adGroups: AdGroup[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PER_PAGE = 10;

  const sorted = [...adGroups].sort((a, b) => b.cost - a.cost);
  const filtered = sorted.filter(ag =>
    ag.adGroupName.toLowerCase().includes(search.toLowerCase()) ||
    ag.campaignName.toLowerCase().includes(search.toLowerCase())
  );
  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const pages = Math.ceil(filtered.length / PER_PAGE);

  const top10 = sorted.slice(0, 10).map(ag => ({
    name: trunc(ag.adGroupName, 28),
    fullName: ag.adGroupName,
    spend: ag.cost,
    roas: ag.roas,
  }));

  if (adGroups.length === 0) {
    return <div className="text-center py-16 text-[#6B7280]">No ad group data available.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Bar chart */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
        <h3 className="text-sm font-semibold text-[#1A1A2E] mb-4">Top Ad Groups by Spend</h3>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top10} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
              <XAxis type="number" tickFormatter={v => fmt$(Number(v), true)}
                tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={130}
                tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-[#1e293b] text-white text-xs px-3 py-2 rounded-lg shadow">
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h3 className="text-sm font-semibold text-[#1A1A2E]">Ad Group Performance</h3>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search ad groups…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="text-sm border border-[#E5E7EB] rounded-lg px-3 py-1.5 outline-none focus:border-[#1A6B6B] w-48"
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
                {["Ad Group", "Campaign", "Status", "Spend", "Clicks", "CTR", "ROAS"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-[#6B7280] pb-3 pr-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map(ag => (
                <tr key={ag.id} className="border-b border-[#F9FAFB] hover:bg-[#F9FAFB]">
                  <td className="py-2.5 pr-3 font-medium text-[#1A1A2E]">{trunc(ag.adGroupName, 32)}</td>
                  <td className="py-2.5 pr-3 text-[#9CA3AF] text-xs">{trunc(ag.campaignName, 28)}</td>
                  <td className="py-2.5 pr-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      ag.adGroupStatus === "ENABLED" ? "bg-green-100 text-green-700" :
                      ag.adGroupStatus === "PAUSED" ? "bg-amber-100 text-amber-700" :
                      "bg-gray-100 text-gray-500"
                    }`}>{ag.adGroupStatus || "—"}</span>
                  </td>
                  <td className="py-2.5 pr-3 whitespace-nowrap">{fmt$(ag.cost)}</td>
                  <td className="py-2.5 pr-3">{ag.clicks.toLocaleString()}</td>
                  <td className="py-2.5 pr-3">{fmtPct(ag.ctrPct)}</td>
                  <td className="py-2.5 font-bold" style={{ color: "#1A6B6B" }}>{fmtRoas(ag.roas)}</td>
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
