"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileSearch,
  Loader2,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import type { PendingAd } from "@/lib/google/pending-ads";
import { unconfirmedApprovals, validatePendingAdPackage, warningCount } from "@/lib/google/pending-ads";
import PendingAdReviewDialog from "@/app/dashboard/PendingAdReviewDialog";

function displayDomain(url: string) {
  try { return new URL(url).hostname; } catch { return url || "No final URL"; }
}

function PendingAdCard({ ad, onOpen }: { ad: PendingAd; onOpen: () => void }) {
  const review = ad.reviewPackage;
  const copyErrors = validatePendingAdPackage(review).length;
  const approvals = unconfirmedApprovals(review).length;
  const warnings = warningCount(review);
  const ready = warnings === 0;

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border transition-[border-color,transform,box-shadow] hover:-translate-y-0.5" style={{ background: "var(--surface-1)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-soft)" }}>
      <button onClick={onOpen} className="flex min-h-0 flex-1 flex-col text-left" aria-label={`Open ${review.internalTitle} details`}>
        <div className="flex items-start justify-between gap-3 border-b px-4 py-4" style={{ borderColor: "var(--border-subtle)", background: "linear-gradient(110deg, var(--brand-primary-soft), transparent 62%)" }}>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--warning-text)", background: "var(--warning-bg)" }}>{ad.status}</span>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{ad.created_at}</span>
            </div>
            <h3 className="mt-3 line-clamp-2 text-base font-bold leading-5" style={{ color: "var(--text-primary)" }}>{review.internalTitle}</h3>
            <p className="mt-1 line-clamp-2 text-xs leading-5" style={{ color: "var(--brand-primary-strong)" }}>{review.strategyLabel}</p>
          </div>
          <span className="grid size-9 shrink-0 place-items-center rounded-xl transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ color: "var(--brand-primary)", background: "var(--brand-primary-soft)" }}><ArrowUpRight size={17} /></span>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-x-3 gap-y-2 text-xs">
            <span style={{ color: "var(--text-muted)" }}>Campaign</span><span className="truncate font-semibold" style={{ color: "var(--text-secondary)" }}>{review.campaignName}</span>
            <span style={{ color: "var(--text-muted)" }}>Ad group</span><span className="truncate font-semibold" style={{ color: "var(--text-secondary)" }}>{review.adGroupName}</span>
          </div>

          <div className="rounded-xl border p-3" style={{ background: "var(--surface-2)", borderColor: "var(--border-subtle)" }}>
            <p className="truncate text-[11px]" style={{ color: "var(--success-text)" }}>Sponsored · {displayDomain(review.finalUrl)}/{[review.path1, review.path2].filter(Boolean).join("/")}</p>
            <p className="mt-1 line-clamp-2 text-[15px] leading-5" style={{ color: "var(--info-text)" }}>{review.headlines.slice(0, 3).map((item) => item.text).join(" | ")}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-5" style={{ color: "var(--text-secondary)" }}>{review.descriptions[0]?.text}</p>
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold" style={{ color: ready ? "var(--success-text)" : "var(--warning-text)", background: ready ? "var(--success-bg)" : "var(--warning-bg)" }}>{ready ? <CheckCircle2 size={13} /> : <ShieldAlert size={13} />}{ready ? "Ready" : "Review required"}</span>
            <span className="rounded-full px-2.5 py-1.5 text-[11px]" style={{ color: "var(--text-muted)", background: "var(--neutral-bg)" }}>{warnings} warning{warnings === 1 ? "" : "s"}</span>
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{copyErrors} copy · {approvals} approvals</span>
          </div>
        </div>
      </button>
      <div className="flex items-center justify-between gap-2 border-t px-4 py-3" style={{ borderColor: "var(--border-subtle)" }}>
        <a href={review.finalUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="flex min-w-0 items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--text-muted)" }}><ExternalLink size={13} className="shrink-0" /><span className="truncate">{review.finalUrl}</span></a>
        <button onClick={onOpen} className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold" style={{ color: "var(--brand-primary-strong)", background: "var(--brand-primary-soft)" }}>Open details</button>
      </div>
    </article>
  );
}

export default function PendingAdsPanel() {
  const [ads, setAds] = useState<PendingAd[]>([]);
  const [selected, setSelected] = useState<PendingAd | null>(null);
  const [resolvedIds, setResolvedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/airtable/pending-ads", { cache: "no-store" });
      const data = await response.json() as { ads?: PendingAd[]; error?: string };
      if (!response.ok || data.error) throw new Error(data.error || "Pending ads could not be loaded.");
      setAds(data.ads ?? []); setResolvedIds([]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Pending ads could not be loaded.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const visibleAds = ads.filter((ad) => !resolvedIds.includes(ad.id));

  return (
    <div className="overflow-hidden rounded-3xl border" style={{ borderColor: "var(--border-subtle)", background: "var(--surface-1)" }}>
      <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5" style={{ borderColor: "var(--border-subtle)", background: "linear-gradient(100deg, var(--brand-primary-soft), transparent 58%)" }}>
        <div className="flex items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-2xl" style={{ color: "var(--brand-primary)", background: "var(--brand-primary-soft)" }}><Clock3 size={18} /></div>
          <div><p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Pending Review</p><p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>{loading ? "Loading review queue…" : `${visibleAds.length} ad${visibleAds.length === 1 ? "" : "s"} awaiting approval`}</p></div>
        </div>
        <button onClick={() => void load()} disabled={loading} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold disabled:opacity-50" style={{ color: "var(--text-secondary)", borderColor: "var(--border-subtle)", background: "var(--surface-2)" }}>{loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}Refresh</button>
      </div>

      <div className="p-3 sm:p-5" style={{ background: "var(--background-subtle)" }}>
        {loading ? <div className="flex min-h-64 items-center justify-center gap-3"><Loader2 size={24} className="animate-spin" style={{ color: "var(--brand-primary)" }} /><span className="text-sm" style={{ color: "var(--text-muted)" }}>Fetching pending ads…</span></div>
          : error ? <div className="flex gap-3 rounded-2xl border p-4" style={{ color: "var(--danger-text)", background: "var(--danger-bg)", borderColor: "var(--danger-border)" }}><AlertCircle size={19} className="mt-0.5 shrink-0" /><div><p className="font-bold">Could not load pending ads</p><p className="mt-1 text-sm leading-6">{error}</p></div></div>
            : visibleAds.length === 0 ? <div className="flex min-h-64 flex-col items-center justify-center text-center"><div className="grid size-14 place-items-center rounded-2xl" style={{ color: "var(--success-text)", background: "var(--success-bg)" }}><FileSearch size={23} /></div><p className="mt-4 font-bold" style={{ color: "var(--text-primary)" }}>Review queue complete</p><p className="mt-1 max-w-sm text-sm" style={{ color: "var(--text-muted)" }}>No active ads are waiting for review. Rejected and created ads remain in Airtable history.</p></div>
              : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleAds.map((ad) => <PendingAdCard key={ad.id} ad={ad} onOpen={() => setSelected(ad)} />)}</div>}
      </div>

      <PendingAdReviewDialog
        ad={selected}
        onClose={() => { setSelected(null); if (resolvedIds.length) void load(false); }}
        onChanged={(changed) => { setSelected(changed); setAds((current) => current.map((item) => item.id === changed.id ? changed : item)); }}
        onResolved={(id) => setResolvedIds((current) => current.includes(id) ? current : [...current, id])}
      />
    </div>
  );
}
