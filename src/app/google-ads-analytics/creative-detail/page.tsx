"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import type { Creative } from "../GoogleAdsAnalyticsClient";

// Ad copy record from the "Google Ad Preview" Airtable table
type AdPreviewRecord = {
  id: string;
  adId: string;
  adName: string;
  adType: string;
  status: string;
  adGroupResource: string;
  headline1: string; headline2: string; headline3: string; headline4: string;
  headline5: string; headline6: string; headline7: string; headline8: string;
  headline9: string; headline10: string; headline11: string; headline12: string;
  headline13: string; headline14: string; headline15: string;
  description1: string; description2: string; description3: string; description4: string;
  targetUrl: string;
};

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

function AdPreviewCard({ preview, adName }: { preview: AdPreviewRecord | null; adName: string }) {
  if (!preview) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-[#9CA3AF]">
        <Loader2 size={16} className="animate-spin mr-2" /> Loading ad copy…
      </div>
    );
  }

  const headlines = [
    preview.headline1, preview.headline2, preview.headline3, preview.headline4,
    preview.headline5, preview.headline6, preview.headline7, preview.headline8,
    preview.headline9, preview.headline10, preview.headline11, preview.headline12,
    preview.headline13, preview.headline14, preview.headline15,
  ].filter(Boolean);

  const descriptions = [
    preview.description1, preview.description2, preview.description3, preview.description4,
  ].filter(Boolean);

  const rawUrl = preview.targetUrl || "";
  const domain = rawUrl.replace(/^https?:\/\//, "").split("/")[0] || "harmonymedspafl.com";

  const isSearch = (preview.adType || "").includes("SEARCH") || (preview.adType || "").includes("RESPONSIVE");
  const isVideo  = (preview.adType || "").includes("VIDEO");

  if (isVideo) {
    return (
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
    );
  }

  if (!isSearch && !headlines.length) {
    return (
      <div className="bg-[#F5F7FA] rounded-xl p-5 text-center text-[#9CA3AF] text-sm">
        <p>{(preview.adType || "Unknown").replace(/_/g, " ")} — preview not available for this ad type</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Google SERP simulation ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0D0D14 0%, #13131C 100%)", border: "1px solid rgba(201,168,76,0.15)" }}
      >
        {/* Mock Google search bar */}
        <div className="px-6 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-3">
            {/* Google G logo */}
            <svg width="22" height="22" viewBox="0 0 48 48">
              <path fill="#4285F4" d="M44.5 20H24v8h11.8C34.7 33.9 29.1 38 24 38c-7.7 0-14-6.3-14-14s6.3-14 14-14c3.4 0 6.5 1.2 8.9 3.3l5.7-5.7C34.6 4.1 29.6 2 24 2 11.9 2 2 11.9 2 24s9.9 22 22 22c12 0 21-8.5 21-21.5 0-1.4-.1-2.7-.5-4.5z"/>
            </svg>
            <div
              className="flex-1 flex items-center gap-2 rounded-full px-4 py-2 text-sm"
              style={{ backgroundColor: "#1E1E28", border: "1px solid rgba(255,255,255,0.1)", color: "#D0CCC4" }}
            >
              <span style={{ color: "#7A7A8A" }}>wellness medspa sarasota</span>
              <span className="ml-auto" style={{ color: "#5A5A6A", fontSize: 11 }}>🔍</span>
            </div>
          </div>
          <p className="text-xs mt-2 ml-10" style={{ color: "#5A5A6A" }}>About 2,340,000 results (0.41 seconds)</p>
        </div>

        {/* The actual ad card */}
        <div className="px-6 py-5">
          <div
            className="rounded-xl p-5"
            style={{
              backgroundColor: "#fff",
              fontFamily: "arial,sans-serif",
              boxShadow: "0 2px 20px rgba(0,0,0,0.3)",
            }}
          >
            {/* URL + Ad badge row */}
            <div className="flex items-center gap-2 mb-2">
              {/* Favicon placeholder */}
              <div style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: "#C9A84C", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 9, color: "#fff", fontWeight: 700 }}>H</span>
              </div>
              <div>
                <p style={{ fontSize: 12, color: "#202124", lineHeight: 1, marginBottom: 1 }}>{domain}</p>
                <p style={{ fontSize: 11, color: "#4d5156" }}>
                  {rawUrl ? rawUrl.replace(/^https?:\/\/[^/]+/, "").split("?")[0] || "/" : "/"}
                </p>
              </div>
              <span
                style={{
                  marginLeft: 4, fontSize: 10, fontWeight: 600,
                  padding: "1px 5px", borderRadius: 3,
                  backgroundColor: "#006621", color: "#fff", flexShrink: 0,
                }}
              >Ad</span>
            </div>

            {/* Headline */}
            <p
              style={{ fontSize: 20, lineHeight: 1.3, marginBottom: 6, color: "#1a0dab", cursor: "pointer" }}
              className="hover:underline"
            >
              {headlines.length > 0 ? headlines.slice(0, 3).join(" | ") : adName}
            </p>

            {/* Descriptions */}
            {descriptions.slice(0, 2).map((d, i) => (
              <p key={i} style={{ fontSize: 14, lineHeight: 1.58, color: "#3C4043", margin: 0 }}>{d}</p>
            ))}

            {/* Sitelinks row */}
            <div className="flex flex-wrap gap-x-4 mt-3 pt-3" style={{ borderTop: "1px solid #e8eaed" }}>
              {["Book a Consultation", "Our Services", "Contact Us", "About Harmony"].map(sl => (
                <a key={sl} style={{ fontSize: 13, color: "#1a0dab", textDecoration: "none" }}
                  className="hover:underline" href="#">{sl}</a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── All Headlines ── */}
      {headlines.length > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: "#111117", border: "1px solid rgba(201,168,76,0.12)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#C9A84C" }}>
              All Headlines
            </p>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: "rgba(201,168,76,0.12)", color: "#C9A84C" }}
            >
              {headlines.length} / 15
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {headlines.map((h, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 rounded-xl px-3 py-2.5"
                style={{ backgroundColor: "#18181F", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <span
                  className="text-[10px] font-bold flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                  style={{ backgroundColor: "rgba(201,168,76,0.15)", color: "#C9A84C" }}
                >
                  {i + 1}
                </span>
                <span className="text-sm leading-snug" style={{ color: "#D0CCC4" }}>{h}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── All Descriptions ── */}
      {descriptions.length > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: "#111117", border: "1px solid rgba(201,168,76,0.12)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#C9A84C" }}>
              All Descriptions
            </p>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: "rgba(201,168,76,0.12)", color: "#C9A84C" }}
            >
              {descriptions.length} / 4
            </span>
          </div>
          <div className="space-y-3">
            {descriptions.map((d, i) => (
              <div
                key={i}
                className="flex gap-3 rounded-xl px-4 py-3"
                style={{
                  backgroundColor: "#18181F",
                  borderLeft: "3px solid #C9A84C",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderLeftWidth: 3,
                  borderLeftColor: "#C9A84C",
                }}
              >
                <span
                  className="text-[10px] font-bold flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                  style={{ backgroundColor: "rgba(201,168,76,0.15)", color: "#C9A84C" }}
                >
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed" style={{ color: "#D0CCC4" }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Target URL ── */}
      {rawUrl && (
        <div
          className="rounded-2xl px-5 py-4 flex items-center gap-3"
          style={{ backgroundColor: "#111117", border: "1px solid rgba(201,168,76,0.12)" }}
        >
          <span className="text-xs font-semibold uppercase tracking-widest flex-shrink-0" style={{ color: "#C9A84C" }}>
            Landing Page
          </span>
          <a
            href={rawUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs hover:underline truncate"
            style={{ color: "#7A7A8A" }}
          >
            {rawUrl}
          </a>
        </div>
      )}
    </div>
  );
}

function CreativeDetailInner() {
  const searchParams = useSearchParams();
  const adName = searchParams.get("name") ?? "";
  const adIdParam = searchParams.get("adId") ?? "";

  const [allCreatives, setAllCreatives] = useState<Creative[]>([]);
  const [adPreviewRecords, setAdPreviewRecords] = useState<AdPreviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyPage, setDailyPage] = useState(0);
  const DAILY_PER_PAGE = 10;

  // Fetch performance data (creatives) and ad copy (ad-preview) in parallel
  useEffect(() => {
    setLoading(true);
    setPreviewLoading(true);

    fetch("/api/airtable?table=creatives")
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setAllCreatives(d.data ?? []);
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));

    fetch("/api/airtable?table=ad-preview")
      .then(r => r.json())
      .then(d => { setAdPreviewRecords(d.data ?? []); })
      .catch(() => { /* non-fatal */ })
      .finally(() => setPreviewLoading(false));
  }, []);

  // Find the matching ad-preview record: prefer adId match, fall back to adName
  const adPreview = useMemo<AdPreviewRecord | null>(() => {
    if (adPreviewRecords.length === 0) return null;
    if (adIdParam) {
      const byId = adPreviewRecords.find(p => p.adId === adIdParam);
      if (byId) return byId;
    }
    return adPreviewRecords.find(p => p.adName === adName) ?? null;
  }, [adPreviewRecords, adIdParam, adName]);

  // Filter creatives to rows matching this ad
  const rows = useMemo(
    () => allCreatives.filter(c => c.adName === adName || (adIdParam && c.adId === adIdParam)),
    [allCreatives, adName, adIdParam]
  );

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

  const first = rows[0];
  const adType = adPreview?.adType || first?.adType || "";
  const campaignName = first?.campaignName ?? "";
  const adGroupName = first?.adGroupName ?? "";
  const tags = first?.creativeTagSuggestions ?? "";
  const dates = rows.map(r => r.date).filter(Boolean).sort();
  const dateMin = dates[0] ?? "";
  const dateMax = dates[dates.length - 1] ?? "";

  // Daily breakdown
  const dailyMap = new Map<string, Creative>();
  for (const r of rows) {
    if (!r.date) continue;
    const ex = dailyMap.get(r.date);
    if (ex) {
      ex.clicks += r.clicks; ex.cost += r.cost;
      ex.impressions += r.impressions; ex.conversions += r.conversions;
      ex.conversionValue += r.conversionValue;
    } else {
      dailyMap.set(r.date, { ...r });
    }
  }
  const dailyRows = Array.from(dailyMap.values()).sort((a, b) => b.date.localeCompare(a.date));
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
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>
    );
  }

  if (rows.length === 0 && !adPreview) {
    return (
      <div className="text-center py-16 text-[#6B7280]">
        Ad "{adName}" not found.{" "}
        <Link href="/google-ads-analytics?tab=creatives" className="text-[#1A6B6B] underline">← Back</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back */}
      <Link href="/google-ads-analytics?tab=creatives"
        className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1A1A2E] transition-colors">
        <ArrowLeft size={16} /> Back to Creatives
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">Google Ad</span>
          {adType && (
            <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-[#6B7280]">
              {adType.replace(/_/g, " ")}
            </span>
          )}
          {adPreview?.status && (
            <span
              className="px-2 py-0.5 rounded text-xs font-medium"
              style={{
                backgroundColor: adPreview.status === "ENABLED" ? "rgba(45,212,191,0.1)" : "rgba(245,158,11,0.1)",
                color: adPreview.status === "ENABLED" ? "#0D9488" : "#D97706",
              }}
            >
              {adPreview.status}
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

      {/* Ad Preview */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
        <h2 className="text-sm font-semibold text-[#1A1A2E] mb-4">Ad Preview</h2>
        {previewLoading && !adPreview
          ? <div className="flex items-center gap-2 text-sm text-[#9CA3AF]"><Loader2 size={16} className="animate-spin" /> Loading ad copy…</div>
          : <AdPreviewCard preview={adPreview} adName={adName} />
        }
      </div>

      {/* Creative Tags */}
      {tags && tags.trim() && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <h2 className="text-sm font-semibold text-[#1A1A2E] mb-3">Creative Tags</h2>
          <div className="flex flex-wrap gap-2">
            {tags.split(",").map(t => t.trim()).filter(Boolean).map((tag, i) => (
              <span key={i}
                className="text-xs px-3 py-1 rounded-full font-medium"
                style={{ backgroundColor: "rgba(201,168,76,0.1)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.2)" }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {rows.length > 0 && (
        <>
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
              <h2 className="text-sm font-semibold text-[#1A1A2E] mb-4">
                Daily Breakdown <span className="text-[#9CA3AF] font-normal">({dailyRows.length} days)</span>
              </h2>
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
        </>
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
