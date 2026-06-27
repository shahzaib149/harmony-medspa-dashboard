"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import type { Creative } from "../GoogleAdsAnalyticsClient";

function fmt$(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtPct(n: number) { return `${n.toFixed(2)}%`; }
function fmtRoas(n: number) { return `${n.toFixed(2)}x`; }

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
      <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-1">{label}</p>
      <p className="text-xl font-bold text-[#1A1A2E]">{value}</p>
    </div>
  );
}

function CreativeDetailInner() {
  const searchParams = useSearchParams();
  const adName = searchParams.get("name") ?? "";
  const [allCreatives, setAllCreatives] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyPage, setDailyPage] = useState(0);
  const DAILY_PER_PAGE = 10;

  useEffect(() => {
    fetch("/api/airtable?table=creatives")
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setAllCreatives(d.data ?? []);
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  // Filter to rows matching this ad name
  const rows = useMemo(
    () => allCreatives.filter(c => c.adName === adName),
    [allCreatives, adName]
  );

  // Aggregate totals
  const totals = useMemo(() => {
    const clicks = rows.reduce((s, r) => s + r.clicks, 0);
    const cost = rows.reduce((s, r) => s + r.cost, 0);
    const impressions = rows.reduce((s, r) => s + r.impressions, 0);
    const conversions = rows.reduce((s, r) => s + r.conversions, 0);
    const conversionValue = rows.reduce((s, r) => s + r.conversionValue, 0);
    return {
      clicks, cost, impressions, conversions, conversionValue,
      ctrPct: impressions > 0 ? (clicks / impressions) * 100 : 0,
      roas: cost > 0 ? conversionValue / cost : 0,
      avgCpc: clicks > 0 ? cost / clicks : 0,
      convRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
      costPerConv: conversions > 0 ? cost / conversions : 0,
    };
  }, [rows]);

  // First row metadata
  const first = rows[0];
  const adType = first?.adType ?? "";
  const campaignName = first?.campaignName ?? "";
  const adGroupName = first?.adGroupName ?? "";
  const tags = first?.creativeTagSuggestions ?? "";
  const dates = rows.map(r => r.date).filter(Boolean).sort();
  const dateMin = dates[0] ?? "";
  const dateMax = dates[dates.length - 1] ?? "";

  // Daily breakdown: deduplicate by date, merge same-date rows
  const dailyMap = new Map<string, Creative>();
  for (const r of rows) {
    if (!r.date) continue;
    const ex = dailyMap.get(r.date);
    if (ex) {
      ex.clicks += r.clicks;
      ex.cost += r.cost;
      ex.impressions += r.impressions;
      ex.conversions += r.conversions;
      ex.conversionValue += r.conversionValue;
    } else {
      dailyMap.set(r.date, { ...r });
    }
  }
  const dailyRows = Array.from(dailyMap.values())
    .sort((a, b) => b.date.localeCompare(a.date));
  const dailyPages = Math.ceil(dailyRows.length / DAILY_PER_PAGE);
  const dailyPaginated = dailyRows.slice(dailyPage * DAILY_PER_PAGE, (dailyPage + 1) * DAILY_PER_PAGE);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={32} className="animate-spin text-[#1A6B6B]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
        {error}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-16 text-[#6B7280]">
        Ad "{adName}" not found.{" "}
        <Link href="/google-ads-analytics?tab=creatives" className="text-[#1A6B6B] underline">← Back</Link>
      </div>
    );
  }

  const isVideo = adType.includes("VIDEO") || adType.includes("DEMAND_GEN_VIDEO");
  const isSearch = adType.includes("SEARCH") || adType.includes("RESPONSIVE_SEARCH");

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back link */}
      <Link href="/google-ads-analytics?tab=creatives"
        className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1A1A2E] transition-colors">
        <ArrowLeft size={16} />
        Back to Creatives
      </Link>

      {/* Ad header */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">Google Ad</span>
          {adType && (
            <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-[#6B7280]">
              {adType.replace(/_/g, " ")}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-[#1A1A2E] mb-1">{adName}</h1>
        <p className="text-sm text-[#9CA3AF]">
          {campaignName && <span>{campaignName}</span>}
          {adGroupName && <span> · {adGroupName}</span>}
          {dateMin && dateMax && <span> · {dateMin} – {dateMax}</span>}
        </p>
      </div>

      {/* Ad preview */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
        <h2 className="text-sm font-semibold text-[#1A1A2E] mb-4">Ad Preview</h2>
        {isVideo ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-full max-w-xl aspect-video bg-[#1e293b] rounded-xl flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
                  <span className="text-3xl">▶</span>
                </div>
                <p className="text-sm">YouTube Video Ad</p>
              </div>
            </div>
            <p className="text-xs text-[#9CA3AF]">Video creative — view in Google Ads for preview</p>
          </div>
        ) : isSearch ? (
          <div className="border border-[#E5E7EB] rounded-xl p-5 max-w-xl bg-[#FAFAFA]">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-[#006621] text-white px-1.5 py-0.5 rounded font-medium">Ad</span>
              <span className="text-xs text-[#3C4043]">harmony-medspa.com</span>
            </div>
            <p className="text-[#1a0dab] text-lg font-medium leading-snug mb-1 cursor-pointer hover:underline">
              {adName}
            </p>
            <p className="text-sm text-[#3C4043]">Discover premium medspa treatments tailored for you. Book your consultation today.</p>
          </div>
        ) : (
          <div className="bg-[#F5F7FA] rounded-xl p-5 text-center text-[#9CA3AF] text-sm">
            <p className="mb-1">{adType.replace(/_/g, " ")} Creative</p>
            <p className="text-xs">Preview not available for this ad type</p>
          </div>
        )}
      </div>

      {/* Creative tags */}
      {tags && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <h2 className="text-sm font-semibold text-[#1A1A2E] mb-2">Creative Tags</h2>
          <p className="text-sm text-[#374151]">{tags}</p>
        </div>
      )}

      {/* Analytics metrics */}
      <div>
        <h2 className="text-sm font-semibold text-[#1A1A2E] mb-3">Performance Metrics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <MetricCard label="Spend" value={fmt$(totals.cost)} />
          <MetricCard label="Impressions" value={totals.impressions.toLocaleString()} />
          <MetricCard label="Clicks" value={totals.clicks.toLocaleString()} />
          <MetricCard label="CTR" value={fmtPct(totals.ctrPct)} />
          <MetricCard label="Avg. CPC" value={fmt$(totals.avgCpc)} />
          <MetricCard label="Conversions" value={totals.conversions.toFixed(1)} />
          <MetricCard label="Conv. Rate" value={fmtPct(totals.convRate)} />
          <MetricCard label="ROAS" value={fmtRoas(totals.roas)} />
          <MetricCard label="Cost / Conv." value={fmt$(totals.costPerConv)} />
          <MetricCard label="Conv. Value" value={fmt$(totals.conversionValue)} />
        </div>
      </div>

      {/* Daily breakdown */}
      {dailyRows.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#1A1A2E]">
              Daily Breakdown <span className="text-[#9CA3AF] font-normal">({dailyRows.length} days)</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F3F4F6]">
                  {["Date", "Spend", "Impressions", "Clicks", "Conv.", "ROAS"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-[#6B7280] pb-3 pr-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dailyPaginated.map(r => {
                  const roas = r.cost > 0 ? r.conversionValue / r.cost : 0;
                  return (
                    <tr key={r.date} className="border-b border-[#F9FAFB] hover:bg-[#F9FAFB]">
                      <td className="py-2.5 pr-3 text-[#1A1A2E]">{r.date}</td>
                      <td className="py-2.5 pr-3">{fmt$(r.cost)}</td>
                      <td className="py-2.5 pr-3">{r.impressions.toLocaleString()}</td>
                      <td className="py-2.5 pr-3">{r.clicks.toLocaleString()}</td>
                      <td className="py-2.5 pr-3">{r.conversions.toFixed(1)}</td>
                      <td className="py-2.5 font-bold" style={{ color: "#1A6B6B" }}>{fmtRoas(roas)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {dailyPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-[#6B7280]">
              <span>Page {dailyPage + 1} of {dailyPages}</span>
              <div className="flex gap-2">
                <button disabled={dailyPage === 0} onClick={() => setDailyPage(p => p - 1)}
                  className="flex items-center gap-1 px-3 py-1 rounded border border-[#E5E7EB] disabled:opacity-40 hover:bg-gray-50">
                  <ChevronLeft size={14} /> Prev
                </button>
                <button disabled={dailyPage >= dailyPages - 1} onClick={() => setDailyPage(p => p + 1)}
                  className="flex items-center gap-1 px-3 py-1 rounded border border-[#E5E7EB] disabled:opacity-40 hover:bg-gray-50">
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CreativeDetailPage() {
  return (
    <DashboardLayout title="Creative Detail" subtitle="Ad performance breakdown">
      <Suspense fallback={<div className="flex items-center justify-center py-32"><Loader2 size={32} className="animate-spin text-[#1A6B6B]" /></div>}>
        <CreativeDetailInner />
      </Suspense>
    </DashboardLayout>
  );
}
