"use client";

import { useState } from "react";
import KPICard from "@/components/ui/KPICard";
import StatusBadge from "@/components/ui/StatusBadge";
import DateRangePicker from "@/components/ui/DateRangePicker";
import AdDraftModal from "@/components/ui/AdDraftModal";
import InsightCard from "@/components/ui/InsightCard";
import { mockGoogleAdsSnapshots, mockAIInsights } from "@/lib/mock-data";
import type { DateRangeOption, AIInsight } from "@/lib/types";
import { RefreshCw, Loader2, Pencil } from "lucide-react";

const CPL_TARGET = 80;
const BOOKING_RATE_TARGET = 20;

const searchTerms = [
  { term: "botox near me", clicks: 89, conversions: 6 },
  { term: "medspa botox [city]", clicks: 54, conversions: 4 },
  { term: "lip filler near me", clicks: 41, conversions: 3 },
  { term: "hydrafacial treatment", clicks: 38, conversions: 1 },
  { term: "anti aging medspa", clicks: 31, conversions: 2 },
  { term: "botox prices", clicks: 28, conversions: 0 },
  { term: "microneedling results", clicks: 24, conversions: 3 },
  { term: "laser hair removal deal", clicks: 22, conversions: 0 },
  { term: "filler specials near me", clicks: 19, conversions: 2 },
  { term: "medspa open saturday", clicks: 17, conversions: 1 },
];

const adCopyPerformance = [
  { headline: "Botox From $10/Unit", description: "Board-certified providers. Same-day appts.", ctr: 4.2, conversions: 8 },
  { headline: "Book Botox Today", description: "Results in 24 hrs. Free consult included.", ctr: 3.8, conversions: 6 },
  { headline: "Harmony MedSpa — Botox", description: "Award-winning care. Book online now.", ctr: 2.9, conversions: 3 },
];

function rowColor(cpl: number, bookingRate: number, conversions: number): string {
  if (conversions === 0) return "bg-red-50";
  if (cpl > CPL_TARGET || bookingRate < 10) return "bg-amber-50";
  if (cpl <= CPL_TARGET && bookingRate > BOOKING_RATE_TARGET) return "bg-green-50";
  return "";
}

export default function GoogleAdsClient() {
  const [dateRange, setDateRange] = useState<DateRangeOption>("30");
  const [draftModal, setDraftModal] = useState<{ open: boolean; treatment?: string }>({ open: false });
  const [insights, setInsights] = useState<AIInsight[]>(mockAIInsights.filter(i => i.category === "Google Ads"));
  const [loadingInsights, setLoadingInsights] = useState(false);

  const totalSpend = mockGoogleAdsSnapshots.reduce((s, c) => s + c.spend, 0);
  const totalImpressions = mockGoogleAdsSnapshots.reduce((s, c) => s + c.impressions, 0);
  const totalClicks = mockGoogleAdsSnapshots.reduce((s, c) => s + c.clicks, 0);
  const totalConversions = mockGoogleAdsSnapshots.reduce((s, c) => s + c.conversions, 0);
  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0";
  const avgCPL = totalConversions > 0 ? (totalSpend / totalConversions).toFixed(0) : "0";

  const fetchInsights = async () => {
    setLoadingInsights(true);
    try {
      const res = await fetch("/api/ai-google-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaigns: mockGoogleAdsSnapshots }),
      });
      const data = await res.json();
      if (res.ok && data.insights) setInsights(data.insights);
    } catch {
      // keep existing
    } finally {
      setLoadingInsights(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        <button
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#E5E7EB] text-sm text-[#6B7280] hover:border-[#1A6B6B] hover:text-[#1A6B6B] transition-colors"
        >
          <RefreshCw size={14} />
          Sync Data
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-6 gap-4">
        <KPICard title="Total Spend" value={`$${totalSpend.toLocaleString()}`} color="teal" />
        <KPICard title="Impressions" value={totalImpressions.toLocaleString()} color="teal" />
        <KPICard title="Clicks" value={totalClicks.toLocaleString()} color="teal" />
        <KPICard title="CTR" value={`${avgCTR}%`} subtitle="Target: 2.5%" color="teal" />
        <KPICard title="Conversions" value={totalConversions} color="green" />
        <KPICard
          title="Cost Per Lead"
          value={`$${avgCPL}`}
          subtitle={`Target: $${CPL_TARGET}`}
          color={Number(avgCPL) > CPL_TARGET ? "amber" : "green"}
        />
      </div>

      {/* Campaign Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-base font-semibold text-[#1A1A2E]">
            Campaign Performance
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                {["Campaign", "Status", "Spend", "Impressions", "Clicks", "CTR", "Conv.", "CPL", "Book Rate", "Action"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {mockGoogleAdsSnapshots.map((c) => {
                const bookingRate = c.conversions > 0 ? Math.round((c.conversions / c.clicks) * 100) : 0;
                const bg = rowColor(c.cpl, bookingRate, c.conversions);
                return (
                  <tr key={c.id} className={`${bg} hover:bg-gray-50 transition-colors`}>
                    <td className="px-4 py-3 font-medium text-[#1A1A2E] max-w-[200px]">
                      {c.campaign_name}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge variant="active" />
                    </td>
                    <td className="px-4 py-3 tabular-nums">${c.spend.toFixed(0)}</td>
                    <td className="px-4 py-3 tabular-nums">{c.impressions.toLocaleString()}</td>
                    <td className="px-4 py-3 tabular-nums">{c.clicks}</td>
                    <td className="px-4 py-3 tabular-nums">{c.ctr.toFixed(2)}%</td>
                    <td className="px-4 py-3 tabular-nums">{c.conversions}</td>
                    <td className={`px-4 py-3 tabular-nums font-medium ${c.cpl > CPL_TARGET ? "text-red-600" : "text-green-700"}`}>
                      {c.conversions > 0 ? `$${c.cpl.toFixed(0)}` : "—"}
                    </td>
                    <td className={`px-4 py-3 tabular-nums ${bookingRate < 10 ? "text-amber-600" : "text-green-700"}`}>
                      {bookingRate}%
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDraftModal({ open: true, treatment: c.campaign_name.split(" —")[0] })}
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
          </table>
        </div>
        {/* Legend */}
        <div className="px-6 py-3 bg-[#F9FAFB] border-t border-[#E5E7EB] flex items-center gap-6 text-xs text-[#6B7280]">
          <span><span className="inline-block w-3 h-3 rounded-sm bg-green-100 mr-1" />CPL on target, booking rate &gt;20%</span>
          <span><span className="inline-block w-3 h-3 rounded-sm bg-amber-100 mr-1" />CPL above target or booking rate &lt;10%</span>
          <span><span className="inline-block w-3 h-3 rounded-sm bg-red-100 mr-1" />Zero conversions</span>
        </div>
      </div>

      {/* Search Terms + Ad Copy */}
      <div className="grid grid-cols-2 gap-6">
        {/* Search Terms */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
          <h2 className="text-base font-semibold text-[#1A1A2E] mb-4">
            Top Search Terms
          </h2>
          <div className="space-y-2">
            {searchTerms.map((t) => (
              <div key={t.term} className="flex items-center justify-between py-1.5 border-b border-[#F3F4F6] last:border-0">
                <span className="text-sm text-[#1A1A2E]">{t.term}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#6B7280] tabular-nums">
                    {t.clicks} clicks · {t.conversions} conv.
                  </span>
                  <button className="text-xs px-2 py-0.5 rounded border border-green-200 text-green-700 hover:bg-green-50">+KW</button>
                  <button className="text-xs px-2 py-0.5 rounded border border-red-200 text-red-600 hover:bg-red-50">−Neg</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ad Copy Performance */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
          <h2 className="text-base font-semibold text-[#1A1A2E] mb-4">
            Ad Copy Performance
          </h2>
          <div className="space-y-4">
            {adCopyPerformance.map((ad, i) => (
              <div key={i} className="border border-[#E5E7EB] rounded-xl p-4">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-sm font-semibold text-[#1A6B6B]">{ad.headline}</p>
                  <div className="text-right text-xs text-[#6B7280]">
                    <p>CTR: <span className="font-medium text-[#1A1A2E]">{ad.ctr}%</span></p>
                    <p>Conv: <span className="font-medium text-[#1A1A2E]">{ad.conversions}</span></p>
                  </div>
                </div>
                <p className="text-xs text-[#6B7280]">{ad.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-[#1A1A2E]">
              AI Recommendations
            </h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Claude analyzes your funnel top-down: CTR → CPC → Conversion → Booking
            </p>
          </div>
          <button
            onClick={fetchInsights}
            disabled={loadingInsights}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-60"
            style={{ backgroundColor: "#1A6B6B" }}
          >
            {loadingInsights ? (
              <><Loader2 size={14} className="animate-spin" />Analyzing...</>
            ) : (
              <><RefreshCw size={14} />Refresh Insights</>
            )}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {insights.slice(0, 3).map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
            />
          ))}
        </div>
        {insights.length === 0 && (
          <p className="text-center text-sm text-[#6B7280] py-8">
            Click &quot;Refresh Insights&quot; to generate AI recommendations.
          </p>
        )}
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
