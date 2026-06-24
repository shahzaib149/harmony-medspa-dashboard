"use client";

import { useState, useEffect, useCallback } from "react";
import KPICard from "@/components/ui/KPICard";
import StatusBadge from "@/components/ui/StatusBadge";
import DateRangePicker from "@/components/ui/DateRangePicker";
import AdDraftModal from "@/components/ui/AdDraftModal";
import type { DateRangeOption } from "@/lib/types";
import { RefreshCw, Loader2, Pencil, TrendingUp, TrendingDown, Wifi, WifiOff } from "lucide-react";

const CPL_TARGET = 80;
const BOOKING_RATE_TARGET = 20;

interface Campaign {
  campaign_id: string;
  campaign_name: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  cpl: number;
  avg_cpc?: number;
}

interface SearchTerm {
  term: string;
  clicks: number;
  impressions: number;
  conversions: number;
  cost: number;
  ctr: number;
}

interface AdVariant {
  headline: string;
  description: string;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
}

interface AdsData {
  source: "live" | "mock";
  campaigns: Campaign[];
  searchTerms: SearchTerm[];
  adPerformance: AdVariant[];
  keywords: unknown[];
}

function rowColor(cpl: number, bookingRate: number, conversions: number): string {
  if (conversions === 0) return "bg-red-50";
  if (cpl > CPL_TARGET || bookingRate < 10) return "bg-amber-50";
  if (cpl <= CPL_TARGET && bookingRate > BOOKING_RATE_TARGET) return "bg-green-50";
  return "";
}

const DATE_RANGE_DAYS: Record<DateRangeOption, number> = {
  "7": 7, "14": 14, "30": 30, "90": 90,
};

export default function GoogleAdsClient() {
  const [dateRange, setDateRange] = useState<DateRangeOption>("30");
  const [data, setData] = useState<AdsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftModal, setDraftModal] = useState<{ open: boolean; treatment?: string }>({ open: false });
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async (showSyncing = false) => {
    if (showSyncing) setSyncing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/google-ads/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: DATE_RANGE_DAYS[dateRange] }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch");
      setData(json);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [dateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const campaigns = data?.campaigns ?? [];
  const filtered = selectedCampaigns.size > 0
    ? campaigns.filter(c => selectedCampaigns.has(c.campaign_id))
    : campaigns;

  const totalSpend = filtered.reduce((s, c) => s + c.spend, 0);
  const totalImpressions = filtered.reduce((s, c) => s + c.impressions, 0);
  const totalClicks = filtered.reduce((s, c) => s + c.clicks, 0);
  const totalConversions = filtered.reduce((s, c) => s + c.conversions, 0);
  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0";
  const avgCPL = totalConversions > 0 ? (totalSpend / totalConversions).toFixed(0) : "—";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <Loader2 size={32} className="animate-spin text-[#1A6B6B] mx-auto" />
          <p className="text-sm text-[#6B7280]">Loading Google Ads data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters + Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DateRangePicker value={dateRange} onChange={setDateRange} />

          {/* Campaign multi-select */}
          {campaigns.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {campaigns.map(c => (
                <button
                  key={c.campaign_id}
                  onClick={() => {
                    const next = new Set(selectedCampaigns);
                    if (next.has(c.campaign_id)) next.delete(c.campaign_id);
                    else next.add(c.campaign_id);
                    setSelectedCampaigns(next);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    selectedCampaigns.has(c.campaign_id)
                      ? "bg-[#1A6B6B] text-white border-[#1A6B6B]"
                      : "text-[#6B7280] border-[#E5E7EB] hover:border-[#1A6B6B]"
                  }`}
                >
                  {c.campaign_name.split("—")[0].trim()}
                </button>
              ))}
              {selectedCampaigns.size > 0 && (
                <button onClick={() => setSelectedCampaigns(new Set())} className="text-xs text-[#6B7280] underline">
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Live / Mock badge */}
          {data && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
              data.source === "live"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}>
              {data.source === "live" ? <Wifi size={12} /> : <WifiOff size={12} />}
              {data.source === "live" ? "Live Data" : "Mock Data"}
            </div>
          )}

          <button
            onClick={() => fetchData(true)}
            disabled={syncing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#E5E7EB] text-sm text-[#6B7280] hover:border-[#1A6B6B] hover:text-[#1A6B6B] transition-colors disabled:opacity-60"
          >
            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Syncing…" : "Sync Now"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-6 gap-4">
        <KPICard title="Total Spend" value={`$${totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} color="teal" />
        <KPICard title="Impressions" value={totalImpressions.toLocaleString()} color="teal" />
        <KPICard title="Clicks" value={totalClicks.toLocaleString()} color="teal" />
        <KPICard
          title="CTR"
          value={`${avgCTR}%`}
          subtitle="Target: 2.5%"
          color={Number(avgCTR) >= 2.5 ? "green" : "amber"}
        />
        <KPICard title="Conversions" value={totalConversions} color="green" />
        <KPICard
          title="Cost Per Lead"
          value={avgCPL === "—" ? "—" : `$${avgCPL}`}
          subtitle={`Target: $${CPL_TARGET}`}
          color={avgCPL === "—" || Number(avgCPL) > CPL_TARGET ? "amber" : "green"}
        />
      </div>

      {/* Campaign Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#1A1A2E]">Campaign Performance</h2>
          <span className="text-xs text-[#6B7280]">{filtered.length} campaign{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-[#6B7280]">
            No campaign data found for this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                  {["Campaign", "Status", "Spend", "Impressions", "Clicks", "CTR", "Conv.", "Avg CPC", "CPL", "Book Rate", "Action"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {filtered.map((c) => {
                  const bookingRate = c.clicks > 0 ? Math.round((c.conversions / c.clicks) * 100) : 0;
                  const bg = rowColor(c.cpl, bookingRate, c.conversions);
                  return (
                    <tr key={c.campaign_id} className={`${bg} hover:bg-gray-50 transition-colors`}>
                      <td className="px-4 py-3 font-medium text-[#1A1A2E] max-w-[180px]">
                        <span className="block truncate" title={c.campaign_name}>{c.campaign_name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge variant={
                          c.status === "ENABLED" || c.status === "enabled" ? "active" :
                          c.status === "PAUSED" || c.status === "paused" ? "paused" : "pending"
                        } />
                      </td>
                      <td className="px-4 py-3 tabular-nums font-medium">${c.spend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td className="px-4 py-3 tabular-nums">{c.impressions.toLocaleString()}</td>
                      <td className="px-4 py-3 tabular-nums">{c.clicks.toLocaleString()}</td>
                      <td className="px-4 py-3 tabular-nums">
                        <span className={`flex items-center gap-1 ${c.ctr >= 2.5 ? "text-green-700" : "text-amber-600"}`}>
                          {c.ctr >= 2.5 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {c.ctr.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums font-medium text-green-700">{c.conversions}</td>
                      <td className="px-4 py-3 tabular-nums text-[#6B7280]">
                        {c.avg_cpc ? `$${c.avg_cpc.toFixed(2)}` : "—"}
                      </td>
                      <td className={`px-4 py-3 tabular-nums font-medium ${c.cpl > CPL_TARGET ? "text-red-600" : "text-green-700"}`}>
                        {c.conversions > 0 ? `$${c.cpl.toFixed(0)}` : "—"}
                      </td>
                      <td className={`px-4 py-3 tabular-nums ${bookingRate < 10 ? "text-amber-600" : "text-green-700"}`}>
                        {bookingRate}%
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setDraftModal({ open: true, treatment: c.campaign_name.split("—")[0].trim() })}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-[#1A6B6B] border border-[#1A6B6B]/30 hover:bg-teal-50 transition-colors"
                        >
                          <Pencil size={12} />
                          Draft Ad
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Totals row */}
              {filtered.length > 1 && (
                <tfoot>
                  <tr className="bg-[#F9FAFB] border-t-2 border-[#E5E7EB] font-semibold text-[#1A1A2E]">
                    <td className="px-4 py-3" colSpan={2}>Totals</td>
                    <td className="px-4 py-3 tabular-nums">${totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="px-4 py-3 tabular-nums">{totalImpressions.toLocaleString()}</td>
                    <td className="px-4 py-3 tabular-nums">{totalClicks.toLocaleString()}</td>
                    <td className="px-4 py-3 tabular-nums">{avgCTR}%</td>
                    <td className="px-4 py-3 tabular-nums">{totalConversions}</td>
                    <td className="px-4 py-3">—</td>
                    <td className="px-4 py-3 tabular-nums">{avgCPL === "—" ? "—" : `$${avgCPL}`}</td>
                    <td className="px-4 py-3" colSpan={2} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        <div className="px-6 py-3 bg-[#F9FAFB] border-t border-[#E5E7EB] flex items-center gap-6 text-xs text-[#6B7280]">
          <span><span className="inline-block w-3 h-3 rounded-sm bg-green-100 mr-1.5" />CPL on target · booking rate &gt;20%</span>
          <span><span className="inline-block w-3 h-3 rounded-sm bg-amber-100 mr-1.5" />CPL above target or booking rate &lt;10%</span>
          <span><span className="inline-block w-3 h-3 rounded-sm bg-red-100 mr-1.5" />Zero conversions</span>
        </div>
      </div>

      {/* Search Terms + Ad Copy */}
      <div className="grid grid-cols-2 gap-6">
        {/* Search Terms */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
          <h2 className="text-base font-semibold text-[#1A1A2E] mb-4">Top Search Terms</h2>
          {(data?.searchTerms ?? []).length === 0 ? (
            <p className="text-sm text-[#6B7280] py-8 text-center">No search term data available for this period.</p>
          ) : (
            <div className="space-y-2">
              {(data?.searchTerms ?? []).slice(0, 10).map((t) => (
                <div key={t.term} className="flex items-center justify-between py-1.5 border-b border-[#F3F4F6] last:border-0">
                  <span className="text-sm text-[#1A1A2E] truncate max-w-[160px]" title={t.term}>{t.term}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-[#6B7280] tabular-nums">
                      {t.clicks} clicks · {t.conversions} conv.
                    </span>
                    <button className="text-xs px-2 py-0.5 rounded border border-green-200 text-green-700 hover:bg-green-50">+KW</button>
                    <button className="text-xs px-2 py-0.5 rounded border border-red-200 text-red-600 hover:bg-red-50">−Neg</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ad Copy Performance */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
          <h2 className="text-base font-semibold text-[#1A1A2E] mb-4">Ad Copy Performance</h2>
          {(data?.adPerformance ?? []).length === 0 ? (
            <p className="text-sm text-[#6B7280] py-8 text-center">No ad copy data available for this period.</p>
          ) : (
            <div className="space-y-4">
              {(data?.adPerformance ?? []).slice(0, 5).map((ad, i) => (
                <div key={i} className="border border-[#E5E7EB] rounded-xl p-4">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm font-semibold text-[#1A6B6B] leading-snug flex-1 pr-3">{ad.headline}</p>
                    <div className="text-right text-xs text-[#6B7280] flex-shrink-0">
                      <p>CTR: <span className="font-semibold text-[#1A1A2E]">{ad.ctr.toFixed(2)}%</span></p>
                      <p>Conv: <span className="font-semibold text-[#1A1A2E]">{ad.conversions}</span></p>
                    </div>
                  </div>
                  <p className="text-xs text-[#6B7280]">{ad.description}</p>
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (ad.ctr / 5) * 100)}%`,
                        backgroundColor: ad.ctr >= 2.5 ? "#10B981" : "#F59E0B",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ad Draft Modal */}
      <AdDraftModal
        open={draftModal.open}
        onClose={() => setDraftModal({ open: false })}
        defaultTreatment={draftModal.treatment}
      />
    </div>
  );
}
