"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileCheck2,
  Loader2,
  LockKeyhole,
  Pencil,
  Save,
  Send,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import {
  unconfirmedApprovals,
  validatePendingAdPackage,
  type DescriptionPin,
  type HeadlinePin,
  type PendingAd,
  type PendingAdPackage,
} from "@/lib/google/pending-ads";

type Props = {
  ad: PendingAd | null;
  onClose: () => void;
  onChanged: (ad: PendingAd) => void;
  onResolved: (id: string) => void;
};

type RecommendationAction = "add_keywords" | "add_negatives" | null;
type TrackingStatus = {
  loading: boolean;
  configured: boolean;
  enabledActionCount: number;
  primaryActionCount: number;
  leadUrlVerified: boolean;
};

const fieldClass = "w-full rounded-xl border px-3 py-2.5 text-sm";

function cloneReview(review: PendingAdPackage) {
  return structuredClone(review);
}

function Section({ title, eyebrow, children }: { title: string; eyebrow?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border p-4 sm:p-5" style={{ background: "var(--surface-1)", borderColor: "var(--border-subtle)" }}>
      {eyebrow && <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--brand-primary)" }}>{eyebrow}</p>}
      <h3 className="mt-1 text-base font-bold" style={{ color: "var(--text-primary)" }}>{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Count({ value, max }: { value: string; max: number }) {
  const invalid = value.length > max;
  return (
    <span
      className="shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold"
      style={{
        color: invalid ? "var(--danger-text)" : "var(--success-text)",
        background: invalid ? "var(--danger-bg)" : "var(--success-bg)",
      }}
    >
      {value.length}/{max}
    </span>
  );
}

function GooglePreview({ review }: { review: PendingAdPackage }) {
  const domain = (() => {
    try { return new URL(review.finalUrl).hostname; } catch { return "harmonymedspafl.com"; }
  })();
  return (
    <div className="rounded-2xl border bg-white p-4 text-left shadow-sm sm:p-5" style={{ borderColor: "#dadce0" }}>
      <div className="flex items-center gap-2 text-xs text-[#3c4043]">
        <span className="grid size-7 place-items-center rounded-full bg-[#f1f3f4] font-bold text-[#4285f4]">G</span>
        <div className="min-w-0">
          <p className="truncate font-medium">{domain}</p>
          <p className="truncate text-[11px] text-[#5f6368]">Sponsored · {domain}/{[review.path1, review.path2].filter(Boolean).join("/")}</p>
        </div>
      </div>
      <p className="mt-3 text-[19px] leading-6 text-[#1a0dab]">
        {review.headlines.slice(0, 3).map((item) => item.text).filter(Boolean).join(" | ") || "Responsive search ad preview"}
      </p>
      <p className="mt-1 text-[13px] leading-5 text-[#4d5156]">
        {review.descriptions[0]?.text || "Description preview"}
      </p>
    </div>
  );
}

function PublishConfirm({
  open,
  review,
  loading,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  review: PendingAdPackage;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[160] flex items-end justify-center sm:items-center sm:p-4" style={{ background: "var(--overlay)" }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="publish-confirm-title" className="flex max-h-[100dvh] w-full max-w-4xl flex-col overflow-hidden border sm:max-h-[92dvh] sm:rounded-3xl" style={{ background: "var(--surface-raised)", borderColor: "var(--warning-border)", boxShadow: "var(--shadow-modal)" }}>
        <header className="flex items-start gap-3 border-b p-4 sm:p-6" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="rounded-xl p-2" style={{ color: "var(--warning-text)", background: "var(--warning-bg)" }}><AlertTriangle size={20} /></div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--warning-text)" }}>Medium risk · Google Ads write</p>
            <h2 id="publish-confirm-title" className="mt-1 text-xl font-bold" style={{ color: "var(--text-primary)" }}>Create this ad as paused?</h2>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>This will create a new responsive search ad in Google Ads with status PAUSED. It will not go live until enabled in Google Ads.</p>
          </div>
          <button aria-label="Close" disabled={loading} onClick={onCancel} className="grid size-11 place-items-center rounded-xl" style={{ color: "var(--text-muted)" }}><X size={20} /></button>
        </header>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Campaign", review.campaignName],
              ["Ad group", review.adGroupName],
              ["Status after creation", "PAUSED"],
              ["Risk level", "Medium"],
            ].map(([label, value]) => <div key={label} className="rounded-xl border p-3" style={{ background: "var(--surface-2)", borderColor: "var(--border-subtle)" }}><p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{label}</p><p className="mt-1 break-words text-sm font-bold" style={{ color: value === "PAUSED" ? "var(--warning-text)" : "var(--text-primary)" }}>{value}</p></div>)}
          </div>
          <div><p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Final URL</p><p className="mt-1 break-all text-sm" style={{ color: "var(--text-primary)" }}>{review.finalUrl}</p></div>
          <div className="grid gap-5 lg:grid-cols-2">
            <div><p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Headlines</p><ol className="mt-2 space-y-1 text-sm" style={{ color: "var(--text-secondary)" }}>{review.headlines.map((item, index) => <li key={index}>{index + 1}. {item.text}{item.pinnedField ? <span className="ml-2 text-[10px] font-bold" style={{ color: "var(--brand-primary)" }}>PIN {item.pinnedField.replace("HEADLINE_", "H")}</span> : null}</li>)}</ol></div>
            <div><p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Descriptions</p><ol className="mt-2 space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>{review.descriptions.map((item, index) => <li key={index}>{index + 1}. {item.text}{item.pinnedField ? <span className="ml-2 text-[10px] font-bold" style={{ color: "var(--brand-primary)" }}>PIN D1</span> : null}</li>)}</ol></div>
          </div>
        </div>
        <footer className="mobile-safe-bottom flex flex-col-reverse gap-2 border-t p-4 min-[390px]:flex-row min-[390px]:justify-end sm:p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
          <button disabled={loading} onClick={onCancel} className="min-h-11 rounded-xl border px-5 text-sm font-bold" style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}>Cancel</button>
          <button disabled={loading} onClick={onConfirm} className="flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold disabled:opacity-60" style={{ background: "var(--brand-primary)", color: "var(--primary-foreground)" }}>{loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}{loading ? "Creating paused ad…" : "Create Paused Ad"}</button>
        </footer>
      </div>
    </div>
  );
}

export default function PendingAdReviewDialog({ ad, onClose, onChanged, onResolved }: Props) {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const selectedAdId = ad?.id ?? null;
  const supabase = useMemo(() => createClient(), []);
  const panelRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<PendingAdPackage | null>(ad ? cloneReview(ad.reviewPackage) : null);
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [working, setWorking] = useState<"save" | "reject" | "publish" | "recommendation" | null>(null);
  const [error, setError] = useState<{ title: string; message: string; requestId?: string } | null>(null);
  const [result, setResult] = useState<{ title: string; message: string; resourceName?: string } | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [publishOpen, setPublishOpen] = useState(false);
  const [recommendationAction, setRecommendationAction] = useState<RecommendationAction>(null);
  const [tracking, setTracking] = useState<TrackingStatus>({ loading: false, configured: false, enabledActionCount: 0, primaryActionCount: 0, leadUrlVerified: false });

  async function authHeaders() {
    const { data } = await supabase.auth.getSession();
    return {
      "Content-Type": "application/json",
      ...(data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {}),
    };
  }

  useEffect(() => {
    setDraft(ad ? cloneReview(ad.reviewPackage) : null);
    setEditing(false);
    setDirty(false);
    setError(null);
    setResult(null);
  }, [ad]);

  useEffect(() => {
    if (!selectedAdId) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    void fetch("/api/airtable/pending-ads", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "opened", id: selectedAdId }),
    });
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedAdId]);

  useEffect(() => {
    if (!selectedAdId) return;
    let cancelled = false;
    setTracking((current) => ({ ...current, loading: true }));
    void fetch("/api/google-ads/conversion-tracking", { credentials: "same-origin", cache: "no-store" })
      .then((response) => response.json())
      .then((data: Partial<TrackingStatus>) => {
        if (cancelled) return;
        setTracking({
          loading: false,
          configured: Boolean(data.configured),
          enabledActionCount: Number(data.enabledActionCount ?? 0),
          primaryActionCount: Number(data.primaryActionCount ?? 0),
          leadUrlVerified: Boolean(data.leadUrlVerified),
        });
      })
      .catch(() => {
        if (!cancelled) setTracking({ loading: false, configured: false, enabledActionCount: 0, primaryActionCount: 0, leadUrlVerified: false });
      });
    return () => { cancelled = true; };
  }, [selectedAdId]);

  useEffect(() => {
    if (!ad) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !working && !publishOpen && !rejectOpen) onClose();
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>("button:not([disabled]),a[href],input:not([disabled]),textarea:not([disabled]),select:not([disabled])")];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [ad, onClose, publishOpen, rejectOpen, working]);

  if (!ad || !draft) return null;

  const pendingAdId = ad.id;
  const validationErrors = validatePendingAdPackage(draft);
  const missingApprovals = unconfirmedApprovals(draft);
  const ready = validationErrors.length === 0 && missingApprovals.length === 0 && !dirty;
  const conversionApproved = draft.approvalChecklist.find((item) => item.key === "conversion_tracking")?.confirmed ?? false;

  const updateDraft = (updater: (current: PendingAdPackage) => PendingAdPackage) => {
    setDraft((current) => current ? updater(current) : current);
    setDirty(true);
    setResult(null);
  };

  async function save() {
    setWorking("save"); setError(null);
    try {
      const response = await fetch("/api/airtable/pending-ads", {
        method: "PATCH", credentials: "same-origin", headers: await authHeaders(),
        body: JSON.stringify({ action: "update", id: pendingAdId, reviewPackage: draft }),
      });
      const data = await response.json() as { ad?: PendingAd; error?: string; requestId?: string };
      if (!response.ok || !data.ad) throw new Error(data.error || "Changes could not be saved.");
      setDraft(cloneReview(data.ad.reviewPackage)); setDirty(false); setEditing(false); onChanged(data.ad);
      setResult({ title: "Changes saved", message: "The pending review package was updated in Airtable." });
    } catch (caught) {
      setError({ title: "Changes could not be saved", message: caught instanceof Error ? caught.message : "Try again." });
    } finally { setWorking(null); }
  }

  async function reject() {
    setWorking("reject"); setError(null);
    try {
      const response = await fetch("/api/airtable/pending-ads", {
        method: "PATCH", credentials: "same-origin", headers: await authHeaders(),
        body: JSON.stringify({ action: "reject", id: pendingAdId, reason: rejectReason }),
      });
      const data = await response.json() as { error?: string; requestId?: string };
      if (!response.ok) throw new Error(data.error || "The ad could not be rejected.");
      setRejectOpen(false); setResult({ title: "Ad rejected", message: "The record was retained in Airtable history and removed from active review." }); onResolved(pendingAdId);
    } catch (caught) {
      setError({ title: "Ad could not be rejected", message: caught instanceof Error ? caught.message : "Try again." });
    } finally { setWorking(null); }
  }

  async function publish() {
    setWorking("publish"); setError(null);
    try {
      const response = await fetch("/api/google-ads/create-ad", {
        method: "POST", credentials: "same-origin", headers: await authHeaders(),
        body: JSON.stringify({ pendingAdId, explicitConfirmation: true }),
      });
      const data = await response.json() as { error?: string; message?: string; detail?: string; resourceName?: string; requestId?: string };
      if (!response.ok) {
        setPublishOpen(false);
        setError({ title: data.error || "Ad could not be created.", message: data.message || "The pending status was preserved. Review the request and retry.", requestId: data.requestId });
        return;
      }
      setPublishOpen(false); onResolved(pendingAdId);
      setResult({ title: data.message || "Paused ad created in Google Ads.", message: data.detail || "This ad is not live yet. Hayden can review and enable it from Google Ads.", resourceName: data.resourceName });
    } catch {
      setPublishOpen(false);
      setError({ title: "Ad could not be created.", message: "The request could not be completed. The ad remains in Pending Review." });
    } finally { setWorking(null); }
  }

  async function applyRecommendations() {
    if (!recommendationAction) return;
    setWorking("recommendation"); setError(null);
    try {
      const response = await fetch("/api/google-ads/pending-recommendations", {
        method: "POST", credentials: "same-origin", headers: await authHeaders(),
        body: JSON.stringify({ pendingAdId, action: recommendationAction, explicitConfirmation: true }),
      });
      const data = await response.json() as { error?: string; message?: string; count?: number; requestId?: string };
      if (!response.ok) throw new Error(data.message || data.error || "Recommendations could not be added.");
      setResult({ title: recommendationAction === "add_keywords" ? "Keywords added" : "Campaign negatives added", message: `${data.count ?? 0} explicitly confirmed recommendations were added to Google Ads.` });
      setRecommendationAction(null);
    } catch (caught) {
      setError({ title: "Recommendations could not be added", message: caught instanceof Error ? caught.message : "Review Google Ads before retrying." });
    } finally { setWorking(null); }
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-end justify-center sm:items-center sm:p-4" style={{ background: "var(--overlay)" }} onMouseDown={(event) => { if (event.target === event.currentTarget && !working) onClose(); }}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="pending-ad-title" className="flex h-[100dvh] w-full max-w-6xl flex-col overflow-hidden border sm:h-auto sm:max-h-[94dvh] sm:rounded-3xl" style={{ background: "var(--background-subtle)", borderColor: "var(--border-subtle)", boxShadow: "var(--shadow-modal)" }}>
        <header className="mobile-safe-top flex items-start gap-3 border-b px-4 py-3 sm:px-6 sm:py-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
          <div className="mt-0.5 hidden rounded-xl p-2 sm:block" style={{ color: "var(--brand-primary)", background: "var(--brand-primary-soft)" }}><FileCheck2 size={20} /></div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--warning-text)", background: "var(--warning-bg)" }}>{ad.status}</span><span className="text-xs" style={{ color: "var(--text-muted)" }}>Created {ad.created_at}</span></div>
            <h2 id="pending-ad-title" className="mt-2 truncate text-lg font-bold sm:text-xl" style={{ color: "var(--text-primary)" }}>{draft.internalTitle}</h2>
            <p className="mt-1 truncate text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>{draft.campaignName} · {draft.adGroupName}</p>
          </div>
          {!isAdmin && <div className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold sm:flex" style={{ color: "var(--neutral-text)", background: "var(--neutral-bg)" }}><LockKeyhole size={13} /> View only</div>}
          <button aria-label="Close review" onClick={onClose} className="grid size-11 shrink-0 place-items-center rounded-xl" style={{ color: "var(--text-muted)" }}><X size={20} /></button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto grid max-w-[1180px] gap-4 p-3 sm:p-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-5">
            <div className="min-w-0 space-y-4">
              {result && <div className="rounded-2xl border p-4" style={{ color: "var(--success-text)", background: "var(--success-bg)", borderColor: "var(--success-border)" }}><div className="flex gap-3"><CheckCircle2 className="mt-0.5 shrink-0" size={19} /><div><p className="font-bold">{result.title}</p><p className="mt-1 text-sm leading-6">{result.message}</p>{result.resourceName && <p className="mt-2 break-all font-mono text-[11px]">{result.resourceName}</p>}</div></div></div>}
              {error && <div className="rounded-2xl border p-4" style={{ color: "var(--danger-text)", background: "var(--danger-bg)", borderColor: "var(--danger-border)" }}><div className="flex gap-3"><XCircle className="mt-0.5 shrink-0" size={19} /><div><p className="font-bold">{error.title}</p><p className="mt-1 text-sm leading-6">{error.message}</p>{error.requestId && <p className="mt-2 font-mono text-[11px]">Request ID: {error.requestId}</p>}</div></div></div>}

              <Section title="Ad setup" eyebrow="Review file">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>Ad name<input disabled={!editing} value={draft.internalTitle} onChange={(e) => updateDraft((r) => ({ ...r, internalTitle: e.target.value }))} className={`${fieldClass} mt-1.5`} /></label>
                  <label className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>Strategy label<input disabled={!editing} value={draft.strategyLabel} onChange={(e) => updateDraft((r) => ({ ...r, strategyLabel: e.target.value }))} className={`${fieldClass} mt-1.5`} /></label>
                  <label className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>Campaign<input disabled value={draft.campaignName} className={`${fieldClass} mt-1.5`} /></label>
                  <label className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>Ad group<input disabled value={draft.adGroupName} className={`${fieldClass} mt-1.5`} /></label>
                  <label className="text-xs font-bold sm:col-span-2" style={{ color: "var(--text-secondary)" }}>Final URL<input disabled={!editing} type="url" value={draft.finalUrl} onChange={(e) => updateDraft((r) => ({ ...r, finalUrl: e.target.value }))} className={`${fieldClass} mt-1.5`} /></label>
                  <label className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>Display path 1<div className="mt-1.5 flex items-center gap-2"><input disabled={!editing} value={draft.path1} onChange={(e) => updateDraft((r) => ({ ...r, path1: e.target.value }))} className={fieldClass} /><Count value={draft.path1} max={15} /></div></label>
                  <label className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>Display path 2<div className="mt-1.5 flex items-center gap-2"><input disabled={!editing} value={draft.path2} onChange={(e) => updateDraft((r) => ({ ...r, path2: e.target.value }))} className={fieldClass} /><Count value={draft.path2} max={15} /></div></label>
                </div>
              </Section>

              <Section title="Headlines" eyebrow="15 assets · 30 character limit">
                <div className="space-y-3">{draft.headlines.map((asset, index) => <div key={index} className="rounded-xl border p-3" style={{ background: "var(--surface-2)", borderColor: asset.text.length > 30 ? "var(--danger-border)" : "var(--border-subtle)" }}><div className="flex items-center justify-between gap-3"><label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Headline {index + 1}</label><Count value={asset.text} max={30} /></div><div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_150px]"><input disabled={!editing} value={asset.text} onChange={(e) => updateDraft((r) => ({ ...r, headlines: r.headlines.map((item, i) => i === index ? { ...item, text: e.target.value } : item) }))} className={fieldClass} /><select disabled={!editing} value={asset.pinnedField ?? ""} onChange={(e) => updateDraft((r) => ({ ...r, headlines: r.headlines.map((item, i) => i === index ? { ...item, pinnedField: (e.target.value || null) as HeadlinePin } : item) }))} className={fieldClass}><option value="">Unpinned</option><option value="HEADLINE_1">Pin to position 1</option><option value="HEADLINE_2">Pin to position 2</option><option value="HEADLINE_3">Pin to position 3</option></select></div></div>)}</div>
              </Section>

              <Section title="Descriptions" eyebrow="4 assets · 90 character limit">
                <div className="space-y-3">{draft.descriptions.map((asset, index) => <div key={index} className="rounded-xl border p-3" style={{ background: "var(--surface-2)", borderColor: asset.text.length > 90 ? "var(--danger-border)" : "var(--border-subtle)" }}><div className="flex items-center justify-between gap-3"><label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Description {index + 1}</label><Count value={asset.text} max={90} /></div><textarea disabled={!editing} rows={3} value={asset.text} onChange={(e) => updateDraft((r) => ({ ...r, descriptions: r.descriptions.map((item, i) => i === index ? { ...item, text: e.target.value } : item) }))} className={`${fieldClass} mt-2 resize-y`} /><select disabled={!editing} value={asset.pinnedField ?? ""} onChange={(e) => updateDraft((r) => ({ ...r, descriptions: r.descriptions.map((item, i) => i === index ? { ...item, pinnedField: (e.target.value || null) as DescriptionPin } : item) }))} className={`${fieldClass} mt-2 sm:max-w-[220px]`}><option value="">Unpinned</option><option value="DESCRIPTION_1">Pin to position 1</option><option value="DESCRIPTION_2">Pin to position 2</option></select></div>)}</div>
              </Section>

              <Section title="Recommended Keywords" eyebrow="Not included in RSA publish">
                <div className="flex flex-wrap gap-2">{draft.recommendedKeywords.map((keyword) => <span key={`${keyword.matchType}-${keyword.text}`} className="rounded-full border px-3 py-1.5 text-xs" style={{ background: "var(--surface-2)", borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}>{keyword.matchType === "PHRASE" ? `“${keyword.text}”` : `[${keyword.text}]`}</span>)}</div>
                {isAdmin && draft.recommendedKeywords.length > 0 && <button onClick={() => setRecommendationAction("add_keywords")} className="mt-4 min-h-11 rounded-xl border px-4 text-sm font-bold" style={{ color: "var(--brand-primary-strong)", borderColor: "var(--border-strong)" }}>Add keywords to ad group</button>}
              </Section>

              <Section title="Recommended Negative Keywords" eyebrow="Campaign level · separate confirmation">
                <div className="flex flex-wrap gap-2">{draft.recommendedNegativeKeywords.map((keyword) => <span key={keyword} className="rounded-full border px-3 py-1.5 text-xs" style={{ background: "var(--danger-bg)", borderColor: "var(--danger-border)", color: "var(--danger-text)" }}>{keyword}</span>)}</div>
                {isAdmin && draft.recommendedNegativeKeywords.length > 0 && <button onClick={() => setRecommendationAction("add_negatives")} className="mt-4 min-h-11 rounded-xl border px-4 text-sm font-bold" style={{ color: "var(--danger-text)", borderColor: "var(--danger-border)" }}>Add negatives to campaign</button>}
              </Section>

              <Section title="Recommended assets" eyebrow="Review only · not published with RSA">
                <div className="space-y-3">{draft.assets.sitelinks.map((link) => <div key={link.title} className="rounded-xl border p-3" style={{ background: "var(--surface-2)", borderColor: "var(--border-subtle)" }}><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{link.title}</p>{link.needsUrl ? <span className="text-xs font-bold" style={{ color: "var(--warning-text)" }}>Needs URL</span> : link.url ? <a href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-bold" style={{ color: "var(--brand-primary-strong)" }}>Open <ExternalLink size={12} /></a> : null}</div><p className="mt-1 break-all text-xs" style={{ color: "var(--text-muted)" }}>{link.url || "No approved URL"}</p><p className="mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>{link.description1} · {link.description2}</p></div>)}</div>
                <div className="mt-4"><p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Callouts</p><div className="mt-2 flex flex-wrap gap-2">{draft.assets.callouts.map((item) => <span key={item} className="rounded-full px-3 py-1.5 text-xs" style={{ color: "var(--success-text)", background: "var(--success-bg)" }}>{item}</span>)}</div></div>
                <div className="mt-4"><p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{draft.assets.structuredSnippet.header}</p><p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>{draft.assets.structuredSnippet.values.join(" · ")}</p></div>
                <div className="mt-4 rounded-xl border p-3" style={{ color: draft.assets.callAsset.phoneNumber ? "var(--success-text)" : "var(--warning-text)", background: draft.assets.callAsset.phoneNumber ? "var(--success-bg)" : "var(--warning-bg)", borderColor: draft.assets.callAsset.phoneNumber ? "var(--success-border)" : "var(--warning-border)" }}>
                  <div className="flex gap-3">
                    {draft.assets.callAsset.phoneNumber ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <AlertTriangle size={18} className="mt-0.5 shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">Clinic call number</p>
                      <p className="mt-1 text-xs leading-5">{draft.assets.callAsset.phoneNumber ? "Saved for call asset setup. The paused RSA publish action will not create a call asset." : `${draft.assets.callAsset.warning} The Mandrill/SMS automation number cannot be used.`}</p>
                      <label className="mt-3 block text-xs font-bold">Front-desk phone number
                        <input
                          disabled={!editing}
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          placeholder="(941) 555-0123"
                          value={draft.assets.callAsset.phoneNumber ?? ""}
                          onChange={(event) => updateDraft((review) => ({
                            ...review,
                            assets: {
                              ...review.assets,
                              callAsset: {
                                ...review.assets.callAsset,
                                phoneNumber: event.target.value.trimStart() || null,
                              },
                            },
                          }))}
                          className={`${fieldClass} mt-1.5`}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </Section>

              <Section title="Notes"><textarea disabled={!editing} rows={4} value={draft.notes} onChange={(e) => updateDraft((r) => ({ ...r, notes: e.target.value }))} className={`${fieldClass} resize-y`} /></Section>

              <Section title="Activity"><div className="space-y-3">{draft.history.length ? [...draft.history].reverse().map((item, index) => <div key={`${item.at}-${index}`} className="flex gap-3"><span className="mt-1 grid size-7 shrink-0 place-items-center rounded-full" style={{ color: "var(--brand-primary)", background: "var(--brand-primary-soft)" }}><Clock3 size={13} /></span><div><p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{item.type.replaceAll("_", " ")}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>{new Date(item.at).toLocaleString()} · {item.actor || "System"}</p>{item.detail && <p className="mt-1 text-xs leading-5" style={{ color: "var(--text-secondary)" }}>{item.detail}</p>}</div></div>) : <p className="text-sm" style={{ color: "var(--text-muted)" }}>No activity has been recorded yet.</p>}</div></Section>
            </div>

            <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
              <GooglePreview review={draft} />
              <section className="overflow-hidden rounded-2xl border" style={{ background: "var(--surface-1)", borderColor: ready ? "var(--success-border)" : "var(--warning-border)" }}>
                <div className="border-b p-4" style={{ background: ready ? "var(--success-bg)" : "var(--warning-bg)", borderColor: ready ? "var(--success-border)" : "var(--warning-border)" }}><div className="flex items-center gap-2" style={{ color: ready ? "var(--success-text)" : "var(--warning-text)" }}>{ready ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}<p className="text-sm font-bold">{ready ? "Ready to create paused" : "Review required"}</p></div><p className="mt-1 text-xs leading-5" style={{ color: "var(--text-secondary)" }}>{validationErrors.length} copy issue{validationErrors.length === 1 ? "" : "s"} · {missingApprovals.length} confirmation{missingApprovals.length === 1 ? "" : "s"} remaining{dirty ? " · unsaved changes" : ""}</p></div>
                {validationErrors.length > 0 && <div className="border-b p-4" style={{ borderColor: "var(--border-subtle)" }}><p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--danger-text)" }}>Copy validation</p><ul className="mt-2 space-y-2">{validationErrors.map((item) => <li key={item} className="flex gap-2 text-xs leading-5" style={{ color: "var(--text-secondary)" }}><XCircle size={14} className="mt-0.5 shrink-0" style={{ color: "var(--danger)" }} />{item}</li>)}</ul></div>}
                <div className="p-4"><p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Required approvals</p><div className="mt-3 space-y-3">{draft.approvalChecklist.map((item, index) => <label key={item.key} className={`flex gap-2.5 text-xs leading-5 ${editing && isAdmin ? "cursor-pointer" : ""}`} style={{ color: "var(--text-secondary)" }}><input type="checkbox" disabled={!editing || !isAdmin} checked={item.confirmed} onChange={(e) => updateDraft((r) => ({ ...r, approvalChecklist: r.approvalChecklist.map((current, i) => i === index ? { ...current, confirmed: e.target.checked } : current) }))} className="mt-0.5 size-4 shrink-0 accent-[var(--success)]" />{item.label}</label>)}</div></div>
              </section>
              <div className="rounded-2xl border p-4" style={{ background: tracking.configured ? "var(--info-bg)" : "var(--warning-bg)", borderColor: tracking.configured ? "var(--info-border)" : "var(--warning-border)", color: tracking.configured ? "var(--info-text)" : "var(--warning-text)" }}>
                <p className="text-sm font-bold">{tracking.loading ? "Checking conversion tracking…" : tracking.configured ? "Conversion actions detected." : conversionApproved ? "Tracking bypass explicitly confirmed." : "Conversion tracking is not confirmed."}</p>
                <p className="mt-2 text-xs leading-5">{tracking.configured ? `${tracking.enabledActionCount} enabled conversion action${tracking.enabledActionCount === 1 ? "" : "s"} (${tracking.primaryActionCount} primary) found in Google Ads. The /lead submit event still requires admin confirmation.` : "This ad may receive clicks but still show 0 conversions in reporting. Set up tracking on the /lead form submit or redirect event before launching, or explicitly confirm an intentional bypass."}</p>
              </div>
            </aside>
          </div>
        </div>

        <footer className="mobile-safe-bottom flex flex-col gap-2 border-t p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4" style={{ background: "var(--surface-raised)", borderColor: "var(--border-subtle)" }}>
          <button onClick={onClose} className="min-h-11 rounded-xl border px-4 text-sm font-bold sm:order-none" style={{ color: "var(--text-secondary)", borderColor: "var(--border-subtle)" }}>Close</button>
          {isAdmin && !result?.resourceName && result?.title !== "Ad rejected" && <div className="grid grid-cols-2 gap-2 sm:flex">
            <button onClick={() => setRejectOpen(true)} disabled={Boolean(working)} className="min-h-11 rounded-xl border px-4 text-sm font-bold" style={{ color: "var(--danger-text)", borderColor: "var(--danger-border)", background: "var(--danger-bg)" }}>Reject</button>
            {editing ? <button onClick={save} disabled={!dirty || Boolean(working)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold disabled:opacity-50" style={{ color: "var(--brand-primary-strong)", borderColor: "var(--border-strong)" }}>{working === "save" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}Save changes</button> : <button onClick={() => setEditing(true)} disabled={Boolean(working)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold" style={{ color: "var(--text-primary)", borderColor: "var(--border-strong)" }}><Pencil size={15} />Edit</button>}
            <button onClick={() => setPublishOpen(true)} disabled={!ready || Boolean(working) || editing} className="col-span-2 flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-45" style={{ background: "var(--brand-primary)", color: "var(--primary-foreground)" }}><Send size={15} />Publish as Paused Ad</button>
          </div>}
        </footer>
      </div>

      <ConfirmDialog open={rejectOpen} title="Reject this pending ad?" description="The ad will leave active Pending Review but remain in Airtable and audit history." confirmLabel="Reject ad" destructive loading={working === "reject"} loadingLabel="Rejecting…" onCancel={() => setRejectOpen(false)} onConfirm={reject}>
        <label className="block text-xs font-bold" style={{ color: "var(--text-secondary)" }}>Optional reason<textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} className={`${fieldClass} mt-2 resize-none`} placeholder="What should change before this idea is reconsidered?" /></label>
      </ConfirmDialog>
      <ConfirmDialog open={Boolean(recommendationAction)} title={recommendationAction === "add_keywords" ? "Add keywords to the Wellness ad group?" : "Add negatives to the campaign?"} description={recommendationAction === "add_keywords" ? "This is a separate Google Ads change. It is not part of creating the responsive search ad." : "This will add the listed recommendations at campaign level. It is not part of creating the responsive search ad."} confirmLabel={recommendationAction === "add_keywords" ? "Add keywords" : "Add campaign negatives"} loading={working === "recommendation"} loadingLabel="Applying…" onCancel={() => setRecommendationAction(null)} onConfirm={applyRecommendations} />
      <PublishConfirm open={publishOpen} review={draft} loading={working === "publish"} onCancel={() => setPublishOpen(false)} onConfirm={publish} />
    </div>
  );
}
