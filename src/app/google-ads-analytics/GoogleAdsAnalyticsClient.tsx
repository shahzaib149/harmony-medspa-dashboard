"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DollarSign, MousePointerClick, TrendingUp, ShoppingCart, RefreshCw, Loader2 } from "lucide-react";
import CampaignsTab from "./components/CampaignsTab";
import AdGroupsTab from "./components/AdGroupsTab";
import CreativesTab from "./components/CreativesTab";
import KeywordsTab from "./components/KeywordsTab";
import AISuggestionsTab from "./components/AISuggestionsTab";
import PendingAdsPanel from "@/app/dashboard/PendingAdsPanel";
import { DASHBOARD_REFRESH_EVENT } from "@/lib/dashboard-refresh";

export type Campaign = {
  id: string; accountName: string; campaignId: string; campaignName: string;
  campaignStatus: string; channelType: string; cost: number; clicks: number;
  impressions: number; ctrPct: number; conversions: number; conversionValue: number;
  roas: number; optimizationScore: number; impressionShare: number;
  impressionShareLostBudget: number; impressionShareLostRank: number; pulledAt: string;
};
export type AdGroup = {
  id: string; accountName: string; campaignId: string; campaignName: string;
  adGroupId: string; adGroupName: string; adGroupStatus: string; cost: number;
  clicks: number; impressions: number; ctrPct: number; conversions: number;
  conversionValue: number; roas: number;
};
export type Creative = {
  id: string; adId: string; adName: string; adType: string; campaignId: string;
  campaignName: string; adGroupName: string; cost: number; clicks: number;
  impressions: number; ctrPct: number; conversions: number; conversionValue: number;
  roas: number; date: string; creativeTagSuggestions: string;
  headlines: string; descriptions: string;
  finalUrl: string; displayUrl: string; path1: string; path2: string;
};
export type Keyword = {
  id: string; keywordText: string; matchType: string; campaignId: string;
  campaignName: string; adGroupName: string; cost: number; clicks: number;
  impressions: number; ctrPct: number; conversions: number; conversionValue: number;
  roas: number;
};

const TABS = [
  { id: "campaigns",       label: "Campaigns" },
  { id: "ad-groups",       label: "Ad Groups" },
  { id: "creatives",       label: "Creatives" },
  { id: "keywords",        label: "Keywords" },
  { id: "ai-suggestions",  label: "✦ AI Suggestions" },
  { id: "pending-review",  label: "⏳ Pending Review" },
] as const;

type TabId = typeof TABS[number]["id"];

function fmt$(n: number) {
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(2)}`;
}
function fmtN(n: number) { return n.toLocaleString(); }

const GOLD = "#C9A84C";
const CARD = "#111117";
const BORDER = "rgba(201,168,76,0.12)";
const TEXT = "#F0ECE4";
const MUTED = "#7A7A8A";

function KPICard({ icon: Icon, label, value, accent }: {
  icon: React.ElementType; label: string; value: string; accent?: string;
}) {
  const color = accent ?? GOLD;
  return (
    <div className="rounded-2xl p-5 flex items-center gap-4"
      style={{ backgroundColor: CARD, border: `1px solid ${accent ? `${accent}25` : BORDER}` }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${color}15` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#5A5A6A" }}>{label}</p>
        <p className="text-xl font-bold" style={{ color: TEXT }}>{value}</p>
      </div>
    </div>
  );
}

function AnalyticsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = (searchParams.get("tab") ?? "campaigns") as TabId;
  const days = Number(searchParams.get("days") ?? 30);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [adGroups, setAdGroups] = useState<AdGroup[]>([]);
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cr, ag, cv, kw] = await Promise.all([
        fetch(`/api/airtable?table=campaigns&days=${days}`).then(r => r.json()),
        fetch(`/api/airtable?table=ad-groups&days=${days}`).then(r => r.json()),
        fetch(`/api/airtable?table=creatives&days=${days}`).then(r => r.json()),
        fetch(`/api/airtable?table=keywords&days=${days}`).then(r => r.json()),
      ]);
      if (cr.error) throw new Error(cr.error);
      setCampaigns(cr.data ?? []);
      setAdGroups(ag.data ?? []);
      setCreatives(cv.data ?? []);
      setKeywords(kw.data ?? []);
      setLastRefresh(new Date());
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const refresh = () => void fetchAll();
    window.addEventListener(DASHBOARD_REFRESH_EVENT, refresh);
    return () => window.removeEventListener(DASHBOARD_REFRESH_EVENT, refresh);
  }, [fetchAll]);

  const setTab = (t: TabId) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("tab", t);
    router.replace(`?${p.toString()}`);
  };

  const setDays = (d: number) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("days", String(d));
    router.replace(`?${p.toString()}`);
  };

  const totalSpend = campaigns.reduce((s, c) => s + c.cost, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);
  const totalConvValue = campaigns.reduce((s, c) => s + c.conversionValue, 0);
  // Use conversionValue/spend if available; otherwise use spend-weighted average of per-campaign ROAS from Airtable
  const overallRoas = totalSpend > 0
    ? totalConvValue > 0
      ? totalConvValue / totalSpend
      : campaigns.reduce((s, c) => s + c.roas * c.cost, 0) / totalSpend
    : 0;
  const accountName = campaigns[0]?.accountName ?? "Harmony MedSpa";
  const latestSync = campaigns.reduce((latest, c) => c.pulledAt > latest ? c.pulledAt : latest, "");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: GOLD }}>
            Google Ads Performance
          </p>
          <h1 className="text-2xl font-bold mt-1" style={{ color: TEXT }}>Google Ads Analytics</h1>
          <p className="text-sm mt-0.5" style={{ color: MUTED }}>
            Campaign performance, creative insights, and keyword analysis
          </p>
          {campaigns.length > 0 && (
            <p className="text-xs mt-1" style={{ color: "#5A5A6A" }}>
              {accountName} · {campaigns.length} campaigns · last {days} days
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <span className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: `${GOLD}15`, color: GOLD }}>
            Google Ads
          </span>
          {latestSync && (
            <span className="px-3 py-1 rounded-full text-xs"
              style={{ backgroundColor: "rgba(255,255,255,0.05)", color: MUTED }}>
              Synced {new Date(latestSync).toLocaleDateString()}
            </span>
          )}
          {lastRefresh && (
            <span className="px-3 py-1 rounded-full text-xs"
              style={{ backgroundColor: "rgba(255,255,255,0.05)", color: MUTED }}>
              Refreshed {lastRefresh.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            </span>
          )}
          <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
            {[7, 14, 30, 90].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className="px-3 py-1.5 text-xs font-medium transition-colors"
                style={days === d ? { backgroundColor: GOLD, color: "#0A0A0D" } : { color: MUTED }}>
                {d}d
              </button>
            ))}
          </div>
          <button onClick={fetchAll} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
            style={{ border: `1px solid ${BORDER}`, color: MUTED }}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl p-4 text-sm"
          style={{ backgroundColor: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#F87171" }}>
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={DollarSign} label="Total Spend" value={fmt$(totalSpend)} accent={GOLD} />
        <KPICard icon={MousePointerClick} label="Total Clicks" value={fmtN(totalClicks)} />
        <KPICard icon={TrendingUp} label="Overall ROAS" value={`${overallRoas.toFixed(2)}x`} accent="#2DD4BF" />
        <KPICard icon={ShoppingCart} label="Total Conversions" value={fmtN(Math.round(totalConversions))} />
      </div>

      {/* Tab nav */}
      <div style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex gap-0 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            const isAI      = tab.id === "ai-suggestions";
            const isPending = tab.id === "pending-review";
            const accentColor = isPending ? "#2DD4BF" : GOLD;
            return (
              <button key={tab.id} onClick={() => setTab(tab.id)}
                className="px-4 md:px-5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0"
                style={{
                  borderBottomWidth: "2px",
                  borderBottomStyle: "solid",
                  borderBottomColor: active ? accentColor : "transparent",
                  color: active ? accentColor : (isAI || isPending) ? `${accentColor}90` : MUTED,
                  fontWeight: (isAI || isPending) ? 600 : 500,
                }}>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin text-[#1A6B6B]" />
        </div>
      ) : (
        <>
          {activeTab === "campaigns"      && <CampaignsTab campaigns={campaigns} />}
          {activeTab === "ad-groups"      && <AdGroupsTab adGroups={adGroups} />}
          {activeTab === "creatives"      && <CreativesTab creatives={creatives} />}
          {activeTab === "keywords"       && <KeywordsTab keywords={keywords} />}
          {activeTab === "ai-suggestions" && (
            <AISuggestionsTab
              campaigns={campaigns}
              creatives={creatives}
              keywords={keywords}
              days={days}
            />
          )}
          {activeTab === "pending-review" && <PendingAdsPanel />}
        </>
      )}
    </div>
  );
}

export default function GoogleAdsAnalyticsClient() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 size={32} className="animate-spin text-[#1A6B6B]" /></div>}>
      <AnalyticsInner />
    </Suspense>
  );
}
