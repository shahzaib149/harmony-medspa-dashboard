"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clipboard,
  Clock3,
  ExternalLink,
  FileSearch,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import PendingAdReviewDialog from "@/app/dashboard/PendingAdReviewDialog";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import type { PendingAd } from "@/lib/google/pending-ads";
import { isVerifiedPublishedAd, unconfirmedApprovals, validatePendingAdPackage, warningCount } from "@/lib/google/pending-ads";

type StatusTab = "pending" | "published" | "failed";
type Counts = Record<StatusTab, number>;
const EMPTY_COUNTS: Counts = { pending: 0, published: 0, failed: 0 };

function displayDomain(url: string) {
  try { return new URL(url).hostname; } catch { return url || "No final URL"; }
}

function formatDate(value: string) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function publishedAdId(resourceName: string) {
  return resourceName.match(/\/adGroupAds\/\d+~(\d+)$/)?.[1] ?? "";
}

function AdPreview({ ad }: { ad: PendingAd }) {
  const review = ad.reviewPackage;
  return (
    <div className="rounded-xl border p-3" style={{ background: "var(--surface-2)", borderColor: "var(--border-subtle)" }}>
      <p className="truncate text-[11px]" style={{ color: "var(--success-text)" }}>Sponsored · {displayDomain(review.finalUrl)}/{[review.path1, review.path2].filter(Boolean).join("/")}</p>
      <p className="mt-1 line-clamp-2 text-[15px] leading-5" style={{ color: "var(--info-text)" }}>{review.headlines.slice(0, 3).map((item) => item.text).join(" | ")}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-5" style={{ color: "var(--text-secondary)" }}>{review.descriptions[0]?.text}</p>
    </div>
  );
}

function AdCard({ ad, onOpen, onReturnPending }: { ad: PendingAd; onOpen: () => void; onReturnPending: () => void }) {
  const review = ad.reviewPackage;
  const status = ad.publication_status;
  const publishing = status === "Publishing";
  const published = status === "Published";
  const failed = status === "Failed";
  const warnings = warningCount(review);
  const ready = warnings === 0;
  const verified = isVerifiedPublishedAd(ad);

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border" style={{ background: "var(--surface-1)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-soft)" }}>
      <button onClick={onOpen} className="flex flex-1 flex-col text-left" aria-label={`Open ${review.internalTitle} details`}>
        <div className="border-b px-4 py-4" style={{ borderColor: "var(--border-subtle)", background: "linear-gradient(110deg, var(--brand-primary-soft), transparent 62%)" }}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: failed ? "var(--danger-text)" : published ? "var(--success-text)" : "var(--warning-text)", background: failed ? "var(--danger-bg)" : published ? "var(--success-bg)" : "var(--warning-bg)" }}>
              {publishing && <Loader2 size={11} className="animate-spin" />}{status}{published ? " · Paused" : ""}
            </span>
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{formatDate(ad.published_at || ad.publish_requested_at || ad.created_at)}</span>
          </div>
          <h3 className="mt-3 line-clamp-2 text-base font-bold leading-5" style={{ color: "var(--text-primary)" }}>{review.internalTitle}</h3>
          <p className="mt-1 truncate text-xs" style={{ color: "var(--text-muted)" }}>{review.campaignName} · {review.adGroupName}</p>
        </div>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <AdPreview ad={ad} />
          {publishing && <p className="flex items-center gap-2 text-xs font-bold" style={{ color: "var(--warning-text)" }}><Loader2 size={14} className="animate-spin" />Publishing to Google Ads…</p>}
          {published && <div className="space-y-1 text-xs" style={{ color: "var(--text-secondary)" }}><p><strong>Published:</strong> {formatDate(ad.published_at)}</p><p><strong>By:</strong> {ad.published_by || "Dashboard admin"}</p>{!verified && <p style={{ color: "var(--warning-text)" }}>Waiting for verified PAUSED resource details.</p>}</div>}
          {failed && <div className="rounded-xl border p-3 text-xs" style={{ color: "var(--danger-text)", background: "var(--danger-bg)", borderColor: "var(--danger-border)" }}><p className="font-bold">Publishing failed</p><p className="mt-1 leading-5">{ad.publish_error || "The publishing workflow reported a failure."}</p><p className="mt-1 opacity-80">{formatDate(ad.last_status_sync || ad.publish_requested_at)}</p></div>}
          {!publishing && !published && !failed && <div className="mt-auto flex flex-wrap items-center gap-2"><span className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold" style={{ color: ready ? "var(--success-text)" : "var(--warning-text)", background: ready ? "var(--success-bg)" : "var(--warning-bg)" }}>{ready ? <CheckCircle2 size={13} /> : <ShieldAlert size={13} />}{ready ? "Ready" : "Review required"}</span><span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{validatePendingAdPackage(review).length} copy · {unconfirmedApprovals(review).length} approvals</span></div>}
        </div>
      </button>
      <div className="flex flex-wrap items-center gap-2 border-t px-4 py-3" style={{ borderColor: "var(--border-subtle)" }}>
        <a href={review.finalUrl} target="_blank" rel="noreferrer" className="mr-auto flex min-w-0 items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--text-muted)" }}><ExternalLink size={13} /><span className="max-w-48 truncate">{review.finalUrl}</span></a>
        {published && ad.ad_resource_name && <button onClick={() => void navigator.clipboard.writeText(ad.ad_resource_name)} title="Copy Google resource name" className="grid size-9 place-items-center rounded-lg border" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}><Clipboard size={14} /></button>}
        {published && publishedAdId(ad.ad_resource_name) && <Link href={`/google-ads-analytics/ads/${publishedAdId(ad.ad_resource_name)}`} className="flex min-h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-bold" style={{ color: "var(--brand-primary-strong)", borderColor: "var(--border-subtle)" }}>Open live ad<ExternalLink size={13} /></Link>}
        {failed && <button onClick={onReturnPending} className="flex min-h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-bold" style={{ color: "var(--text-secondary)", borderColor: "var(--border-subtle)" }}><RotateCcw size={13} />Return to review</button>}
        <button onClick={onOpen} className="min-h-9 rounded-lg px-2.5 text-xs font-bold" style={{ color: "var(--brand-primary-strong)", background: "var(--brand-primary-soft)" }}>{failed ? "Retry / details" : "Open details"}</button>
      </div>
    </article>
  );
}

export default function PendingAdsPanel() {
  const { role } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState<StatusTab>("pending");
  const [ads, setAds] = useState<PendingAd[]>([]);
  const [counts, setCounts] = useState<Counts>(EMPTY_COUNTS);
  const [selected, setSelected] = useState<PendingAd | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const authenticatedFetch = useCallback(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const send = async (refresh: boolean) => {
      const { data } = refresh ? await supabase.auth.refreshSession() : await supabase.auth.getSession();
      const headers = new Headers(init.headers);
      if (data.session?.access_token) headers.set("Authorization", `Bearer ${data.session.access_token}`);
      return fetch(input, { ...init, headers, credentials: "same-origin" });
    };
    const response = await send(false);
    return response.status === 401 ? send(true) : response;
  }, [supabase]);

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch(`/api/airtable/ad-reviews?status=${tab}`, { cache: "no-store" });
      const data = await response.json().catch(() => null) as { ads?: PendingAd[]; counts?: Counts; error?: string } | null;
      if (!response.ok) throw new Error(response.status === 401 ? "Your session expired. Sign in again and refresh this page." : data?.error || "Ad publishing records could not be loaded.");
      setAds(data?.ads ?? []);
      setCounts(data?.counts ?? EMPTY_COUNTS);
      setSelected((current) => current ? (data?.ads ?? []).find((item) => item.id === current.id) ?? current : null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Ad publishing records could not be loaded.");
    } finally { setLoading(false); }
  }, [authenticatedFetch, tab]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!ads.some((ad) => ad.publication_status === "Publishing")) return;
    const timer = window.setInterval(() => void load(false), 3000);
    return () => window.clearInterval(timer);
  }, [ads, load]);

  async function returnPending(ad: PendingAd) {
    if (role !== "admin") { setNotice("Admin access is required to change publishing status."); return; }
    const response = await authenticatedFetch("/api/airtable/ad-reviews", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "return_pending", id: ad.id }) });
    const data = await response.json().catch(() => null) as { error?: string } | null;
    if (!response.ok) { setError(data?.error || "The ad could not be returned to review."); return; }
    setNotice("Ad returned to Pending Review.");
    void load(false);
  }

  const tabs: Array<{ id: StatusTab; label: string }> = [{ id: "pending", label: "Pending Review" }, { id: "published", label: "Published" }, { id: "failed", label: "Failed" }];

  return (
    <div className="overflow-hidden rounded-3xl border" style={{ borderColor: "var(--border-subtle)", background: "var(--surface-1)" }}>
      <div className="border-b p-4 sm:p-5" style={{ borderColor: "var(--border-subtle)", background: "linear-gradient(100deg, var(--brand-primary-soft), transparent 58%)" }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-2xl" style={{ color: "var(--brand-primary)", background: "var(--brand-primary-soft)" }}><Clock3 size={18} /></div><div><p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Ad Publishing</p><p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>Airtable-backed publishing status and history</p></div></div>
          <button onClick={() => void load()} disabled={loading} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold disabled:opacity-50" style={{ color: "var(--text-secondary)", borderColor: "var(--border-subtle)", background: "var(--surface-2)" }}>{loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}Sync status</button>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto" role="tablist">{tabs.map((item) => <button key={item.id} role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)} className="flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-xs font-bold" style={{ color: tab === item.id ? "var(--brand-primary-strong)" : "var(--text-muted)", background: tab === item.id ? "var(--surface-1)" : "transparent", borderColor: tab === item.id ? "var(--border-strong)" : "transparent" }}>{item.label}<span className="rounded-full px-2 py-0.5" style={{ background: "var(--neutral-bg)" }}>{counts[item.id]}</span></button>)}</div>
      </div>
      <div className="p-3 sm:p-5" style={{ background: "var(--background-subtle)" }}>
        {notice && <div className="mb-4 flex items-center justify-between rounded-xl border p-3 text-sm" style={{ color: "var(--success-text)", background: "var(--success-bg)", borderColor: "var(--success-border)" }}><span>{notice}</span><button onClick={() => setNotice(null)} aria-label="Dismiss">×</button></div>}
        {loading ? <div className="flex min-h-64 items-center justify-center gap-3"><Loader2 size={24} className="animate-spin" style={{ color: "var(--brand-primary)" }} /><span className="text-sm" style={{ color: "var(--text-muted)" }}>Loading ad publishing records…</span></div>
          : error ? <div className="flex gap-3 rounded-2xl border p-4" style={{ color: "var(--danger-text)", background: "var(--danger-bg)", borderColor: "var(--danger-border)" }}><AlertCircle size={19} /><div><p className="font-bold">Could not load ad publishing</p><p className="mt-1 text-sm">{error}</p></div></div>
            : ads.length === 0 ? <div className="flex min-h-64 flex-col items-center justify-center text-center"><div className="grid size-14 place-items-center rounded-2xl" style={{ color: "var(--success-text)", background: "var(--success-bg)" }}><FileSearch size={23} /></div><p className="mt-4 font-bold" style={{ color: "var(--text-primary)" }}>No {tabs.find((item) => item.id === tab)?.label.toLowerCase()} ads</p><p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>Use Sync status to check Airtable again.</p></div>
              : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{ads.map((ad) => <AdCard key={ad.id} ad={ad} onOpen={() => setSelected(ad)} onReturnPending={() => void returnPending(ad)} />)}</div>}
      </div>
      <PendingAdReviewDialog ad={selected} onClose={() => { setSelected(null); void load(false); }} onChanged={(changed) => { setSelected(changed); setAds((current) => current.map((item) => item.id === changed.id ? changed : item)); }} onResolved={() => void load(false)} />
    </div>
  );
}
