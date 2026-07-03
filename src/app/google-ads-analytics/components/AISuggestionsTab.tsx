"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2, RefreshCw, Target, Lightbulb, TrendingUp, Tag, ChevronDown, ChevronUp, Send, CheckCircle, XCircle, Zap, Globe } from "lucide-react";
import type { Campaign, Creative, Keyword } from "../GoogleAdsAnalyticsClient";

/* ── Types ──────────────────────────────────────────────────────────────── */
type AISuggestion = {
  headlines: string[];
  descriptions: string[];
  displayPath: string[];
  targetKeywords: string[];
  insights: string[];
  bidRecommendation: string;
  topPerformerSummary: string;
};
type HistoryEntry = { date: string; suggestion: AISuggestion };
type SiteAd = {
  headline1: string; headline2: string; headline3: string;
  description: string; path1: string; path2: string; focus: string;
};

/* ── Constants ───────────────────────────────────────────────────────────── */
const STORAGE_KEY  = "harmony_ai_suggestions_v2";
const QA_KEY       = "harmony_quick_ads_v1";
const QA_TTL       = 24 * 60 * 60 * 1000;
const MAX_HISTORY  = 7;
const MAKE_WEBHOOK = "https://hook.us2.make.com/pwe6qssw5klmlhf958exyotd845uiahy";
const GOLD         = "#C9A84C";
const CARD         = "#111117";
const CARD2        = "#0D0D12";
const BORDER       = "rgba(201,168,76,0.12)";
const BORDER2      = "rgba(201,168,76,0.08)";
const TEXT         = "#F0ECE4";
const MUTED        = "#7A7A8A";
const TEAL         = "#2DD4BF";

/* ── localStorage helpers ───────────────────────────────────────────────── */
function getTodayKey() { return new Date().toISOString().slice(0, 10); }
function readHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; }
}
function writeHistory(h: HistoryEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(h.slice(0, MAX_HISTORY)));
}
function readSiteAds(): SiteAd[] {
  try {
    const raw = localStorage.getItem(QA_KEY);
    if (!raw) return [];
    const { ads, ts } = JSON.parse(raw);
    if (Date.now() - ts > QA_TTL) return [];
    return ads ?? [];
  } catch { return []; }
}
function fmtDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

/* ── Google logo SVG ────────────────────────────────────────────────────── */
function GoogleIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" fill="#FFC107"/>
      <path d="M6.3 14.7l7.4 5.4C15.5 16.1 19.4 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 16.3 2 9.7 7.4 6.3 14.7z" fill="#FF3D00"/>
      <path d="M24 46c5.5 0 10.5-1.9 14.3-5.2l-6.6-5.6C29.8 36.9 27 38 24 38c-6 0-10.6-3.9-11.7-9.2l-7.4 5.7C8.3 41.7 15.6 46 24 46z" fill="#4CAF50"/>
      <path d="M44.5 20H24v8.5h11.8c-.8 3.1-2.8 5.7-5.4 7.4l6.6 5.6C42 38.3 45 32 45 24c0-1.3-.2-2.7-.5-4z" fill="#1976D2"/>
    </svg>
  );
}

/* ── Compact ad card (grid item) ─────────────────────────────────────────── */
type RawAdPayload = {
  headline1: string; headline2: string; headline3: string;
  allHeadlines: string[];
  description1: string; description2: string;
  allDescriptions: string[];
  path1: string; path2: string;
  finalUrl: string; focus: string; source: string;
};
type UnifiedCard = {
  headline: string; description: string; path: string[];
  badge: string; badgeColor: string; icon: React.ReactNode;
  raw: RawAdPayload;
};

function AdGridCard({ card, selected, onClick }: { card: UnifiedCard; selected: boolean; onClick: () => void }) {
  const urlPath = card.path.filter(Boolean).join("/");
  return (
    <button
      onClick={onClick}
      style={{
        flex: "1 1 240px", minWidth: 0, textAlign: "left", cursor: "pointer",
        borderRadius: 14, overflow: "hidden", background: "none", padding: 0,
        borderWidth: "2px", borderStyle: "solid",
        borderColor: selected ? GOLD : BORDER2,
        transition: "border-color 0.18s, box-shadow 0.18s",
        boxShadow: selected ? `0 0 0 3px ${GOLD}18` : "none",
      }}
    >
      {/* Badge strip */}
      <div style={{
        padding: "6px 12px",
        display: "flex", alignItems: "center", gap: 6,
        backgroundColor: `${card.badgeColor}10`,
        borderBottomWidth: "1px", borderBottomStyle: "solid",
        borderBottomColor: `${card.badgeColor}18`,
      }}>
        {card.icon}
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
          textTransform: "uppercase", color: card.badgeColor,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {card.badge}
        </span>
        {selected && (
          <span style={{
            marginLeft: "auto", fontSize: 8, fontWeight: 800,
            letterSpacing: "0.05em", color: GOLD,
            backgroundColor: `${GOLD}20`, padding: "1px 6px", borderRadius: 20,
          }}>SELECTED</span>
        )}
      </div>

      {/* Mini Google preview */}
      <div style={{ backgroundColor: "#fff", padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
          <div style={{
            width: 18, height: 18, borderRadius: "50%", backgroundColor: "#f8f9fa",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <GoogleIcon size={10} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: 10, color: "#202124", fontWeight: 500, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              harmonymedspafl.com
            </p>
            <p style={{ fontSize: 9, color: "#5F6368", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              harmonymedspafl.com{urlPath ? `/${urlPath}` : ""}
            </p>
          </div>
          <span style={{
            fontSize: 8, color: "#006621", flexShrink: 0,
            borderWidth: "1px", borderStyle: "solid", borderColor: "#006621",
            borderRadius: 3, padding: "1px 4px",
          }}>Ad</span>
        </div>
        <h3 style={{
          fontSize: 12, color: "#1A0DAB", fontWeight: 400, lineHeight: 1.35,
          margin: "0 0 4px",
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>
          {card.headline}
        </h3>
        <p style={{
          fontSize: 10.5, color: "#3C4043", lineHeight: 1.45, margin: 0,
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>
          {card.description}
        </p>
      </div>
    </button>
  );
}

/* ── Expanded ad detail panel ────────────────────────────────────────────── */
function AdDetailPanel({
  card, publishing, publishResult, onPublish,
}: {
  card: UnifiedCard;
  publishing: boolean;
  publishResult: { ok: boolean; msg: string } | null;
  onPublish: () => void;
}) {
  const urlPath = card.path.filter(Boolean).join("/");
  const r = card.raw;

  return (
    <div className="ad-detail-panel" style={{
      backgroundColor: "#0A0A0E",
      borderRadius: 16, overflow: "hidden",
      borderWidth: "1px", borderStyle: "solid", borderColor: BORDER,
    }}>

      {/* Left: full Google SERP preview */}
      <div className="ad-detail-left" style={{ padding: "24px" }}>
        {/* Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
          {card.icon}
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: card.badgeColor }}>
            {card.badge}
          </span>
          <span style={{ fontSize: 10, color: MUTED, marginLeft: 4 }}>— Click Preview</span>
        </div>

        {/* Google SERP card */}
        <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: "20px 24px", maxWidth: 620, boxShadow: "0 4px 24px rgba(0,0,0,0.18)" }}>
          {/* Domain row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", backgroundColor: "#f8f9fa", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <GoogleIcon size={14} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: 13, color: "#202124", fontWeight: 500, margin: 0 }}>Harmony MedSpa · harmonymedspafl.com</p>
              <p style={{ fontSize: 11, color: "#5F6368", margin: 0 }}>
                harmonymedspafl.com{urlPath ? `/${urlPath}` : ""}
              </p>
            </div>
            <span style={{ fontSize: 10, color: "#006621", borderWidth: "1px", borderStyle: "solid", borderColor: "#006621", borderRadius: 3, padding: "2px 6px", flexShrink: 0 }}>Ad</span>
          </div>

          {/* Headline */}
          <h2 style={{ fontSize: 20, color: "#1A0DAB", fontWeight: 400, lineHeight: 1.35, margin: "0 0 6px", cursor: "pointer" }}>
            {[r.headline1, r.headline2, r.headline3].filter(Boolean).join(" | ")}
          </h2>

          {/* Description */}
          <p style={{ fontSize: 13.5, color: "#3C4043", lineHeight: 1.65, margin: "0 0 14px" }}>
            {r.description1}
          </p>

          {/* Sitelinks */}
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {["Free Consultation", "Botox & Fillers", "Weight Loss", "Book Now"].map(s => (
              <span key={s} style={{ fontSize: 13, color: "#1A0DAB", cursor: "pointer" }}>{s}</span>
            ))}
          </div>
        </div>

        {/* Ad copy breakdown */}
        <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { label: "Headline 1", value: r.headline1, max: 30 },
            { label: "Headline 2", value: r.headline2, max: 30 },
            { label: "Headline 3", value: r.headline3, max: 30 },
            { label: "Path", value: [r.path1, r.path2].filter(Boolean).join("/"), max: 30 },
          ].map(f => (
            <div key={f.label} style={{ padding: "8px 12px", borderRadius: 8, backgroundColor: "rgba(255,255,255,0.03)", borderWidth: "1px", borderStyle: "solid", borderColor: BORDER2 }}>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: MUTED, margin: "0 0 3px" }}>{f.label}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <p style={{ fontSize: 12, color: TEXT, margin: 0, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.value || "—"}</p>
                <span style={{ fontSize: 9, fontFamily: "monospace", flexShrink: 0, color: f.value.length <= f.max ? TEAL : "#F87171" }}>
                  {f.value.length}/{f.max}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Description */}
        <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 8, backgroundColor: "rgba(255,255,255,0.03)", borderWidth: "1px", borderStyle: "solid", borderColor: BORDER2 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: MUTED, margin: 0 }}>Description</p>
            <span style={{ fontSize: 9, fontFamily: "monospace", color: r.description1.length <= 90 ? TEAL : "#F87171" }}>
              {r.description1.length}/90
            </span>
          </div>
          <p style={{ fontSize: 12, color: TEXT, margin: 0, lineHeight: 1.5 }}>{r.description1}</p>
        </div>
      </div>

      {/* Right: publish panel */}
      <div style={{
        padding: "24px", display: "flex", flexDirection: "column", gap: 20,
        background: `linear-gradient(160deg, ${GOLD}06 0%, transparent 60%)`,
      }}>
        {/* Header */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Zap size={13} style={{ color: GOLD }} />
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: GOLD, margin: 0 }}>
              Publish to Google Ads
            </p>
          </div>
          <p style={{ fontSize: 12, color: MUTED, margin: 0, lineHeight: 1.6 }}>
            This sends the ad to Make.com, which creates a paused Responsive Search Ad in your Google Ads account. You can review and enable it there.
          </p>
        </div>

        {/* What's being sent */}
        <div style={{ borderRadius: 10, overflow: "hidden", borderWidth: "1px", borderStyle: "solid", borderColor: BORDER }}>
          <div style={{ padding: "8px 12px", backgroundColor: `${GOLD}10`, borderBottomWidth: "1px", borderBottomStyle: "solid", borderBottomColor: BORDER }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: GOLD, margin: 0 }}>Ad Preview</p>
          </div>
          <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: 7 }}>
            {[
              { label: "H1", value: r.headline1 },
              { label: "H2", value: r.headline2 },
              { label: "H3", value: r.headline3 },
            ].map(f => (
              <div key={f.label} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: GOLD, flexShrink: 0, paddingTop: 1, width: 14 }}>{f.label}</span>
                <span style={{ fontSize: 11, color: TEXT, lineHeight: 1.4, minWidth: 0 }}>{f.value}</span>
              </div>
            ))}
            <div style={{ height: 1, backgroundColor: BORDER2, margin: "2px 0" }} />
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: `${TEAL}90`, flexShrink: 0, paddingTop: 1, width: 14 }}>D1</span>
              <span style={{ fontSize: 10, color: MUTED, lineHeight: 1.4, minWidth: 0 }}>
                {r.description1.length > 55 ? r.description1.slice(0, 55) + "…" : r.description1}
              </span>
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Destination */}
        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 10px", borderRadius: 8, backgroundColor: "rgba(255,255,255,0.02)", borderWidth: "1px", borderStyle: "solid", borderColor: BORDER2 }}>
          <Globe size={11} style={{ color: MUTED, flexShrink: 0 }} />
          <p style={{ fontSize: 10, color: MUTED, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {r.finalUrl}
          </p>
        </div>

        {/* Publish button */}
        <button
          onClick={onPublish}
          disabled={publishing}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "13px 0", borderRadius: 12, cursor: publishing ? "not-allowed" : "pointer",
            fontWeight: 700, fontSize: 13, border: "none", width: "100%",
            background: publishing
              ? `rgba(201,168,76,0.2)`
              : `linear-gradient(135deg, #B8924A 0%, #E8C96A 50%, #C9A84C 100%)`,
            color: publishing ? GOLD : "#1A0D00",
            transition: "opacity 0.15s, transform 0.1s",
            boxShadow: publishing ? "none" : `0 4px 20px ${GOLD}40`,
          }}
        >
          {publishing
            ? <><Loader2 size={14} className="animate-spin" /> Publishing…</>
            : <><Send size={14} /> Publish Ad</>
          }
        </button>

        {/* Result banner */}
        {publishResult && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 8,
            padding: "10px 12px", borderRadius: 10, fontSize: 11, lineHeight: 1.5,
            backgroundColor: publishResult.ok ? "rgba(45,212,191,0.08)" : "rgba(248,113,113,0.08)",
            borderWidth: "1px", borderStyle: "solid",
            borderColor: publishResult.ok ? "rgba(45,212,191,0.3)" : "rgba(248,113,113,0.3)",
            color: publishResult.ok ? TEAL : "#F87171",
          }}>
            {publishResult.ok
              ? <CheckCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              : <XCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            }
            <span>{publishResult.msg}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Character badge ─────────────────────────────────────────────────────── */
function CharBadge({ text, max }: { text: string; max: number }) {
  const ok = text.length <= max;
  return (
    <span style={{ fontSize: 9, fontFamily: "monospace", color: ok ? TEAL : "#F87171", flexShrink: 0 }}>
      {text.length}/{max}
    </span>
  );
}

/* ── History card ───────────────────────────────────────────────────────── */
function HistoryCard({ entry, onPromote }: { entry: HistoryEntry; onPromote: () => void }) {
  const [open, setOpen] = useState(false);
  const s = entry.suggestion;
  return (
    <div style={{ borderRadius: 12, overflow: "hidden", backgroundColor: CARD, borderWidth: "1px", borderStyle: "solid", borderColor: BORDER }}>
      <button onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 18px", textAlign: "left", background: "none", cursor: "pointer",
          borderBottomWidth: open ? "1px" : "0", borderBottomStyle: "solid", borderBottomColor: BORDER,
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: `${GOLD}50`, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: TEXT, flexShrink: 0 }}>{fmtDate(entry.date)}</span>
          <span style={{ fontSize: 11, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
            — {s.topPerformerSummary}
          </span>
        </div>
        {open ? <ChevronUp size={12} style={{ color: MUTED, flexShrink: 0 }} /> : <ChevronDown size={12} style={{ color: MUTED, flexShrink: 0 }} />}
      </button>
      {open && (
        <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ backgroundColor: "#fff", borderRadius: 10, padding: "14px 16px", maxWidth: 500 }}>
            <h3 style={{ fontSize: 15, color: "#1A0DAB", fontWeight: 400, margin: "0 0 5px" }}>
              {(s.headlines ?? []).slice(0, 3).join(" | ")}
            </h3>
            <p style={{ fontSize: 12, color: "#3C4043", margin: 0 }}>{s.descriptions?.[0]}</p>
          </div>
          {(s.targetKeywords?.length ?? 0) > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {s.targetKeywords.map((kw, i) => (
                <span key={i} style={{
                  padding: "2px 10px", borderRadius: 20, fontSize: 11,
                  backgroundColor: `${GOLD}10`, color: GOLD,
                  borderWidth: "1px", borderStyle: "solid", borderColor: `${GOLD}20`,
                }}>{kw}</span>
              ))}
            </div>
          )}
          <button onClick={onPromote} style={{ fontSize: 11, color: `${GOLD}90`, background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}>
            View full suggestions →
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function AISuggestionsTab({
  campaigns, creatives, keywords, days,
}: {
  campaigns: Campaign[]; creatives: Creative[]; keywords: Keyword[]; days: number;
}) {
  const [history, setHistory]   = useState<HistoryEntry[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [promoted, setPromoted] = useState<AISuggestion | null>(null);
  const [siteAds, setSiteAds]   = useState<SiteAd[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [publishing, setPublishing]   = useState(false);
  const [publishResult, setPublishResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const todayKey   = getTodayKey();
  const todayEntry = history.find(e => e.date === todayKey) ?? null;
  const pastEntries = history.filter(e => e.date !== todayKey);
  const active     = promoted ?? todayEntry?.suggestion ?? null;

  useEffect(() => {
    const stored = readHistory();
    setHistory(stored);
    setSiteAds(readSiteAds());
    const hasToday = stored.some(e => e.date === todayKey);
    if (!hasToday) runGenerate(stored);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function runGenerate(base: HistoryEntry[] = history) {
    setLoading(true);
    setError(null);
    setPromoted(null);
    try {
      const res = await fetch("/api/ai-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaigns, creatives, keywords, days }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const newEntry: HistoryEntry = { date: todayKey, suggestion: data };
      const updated = [newEntry, ...base.filter(e => e.date !== todayKey)];
      writeHistory(updated);
      setHistory(updated);
      setSelectedIdx(0);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  /* Build unified cards */
  const cards: UnifiedCard[] = [
    ...siteAds.map(a => ({
      headline: [a.headline1, a.headline2, a.headline3].filter(Boolean).join(" | "),
      description: a.description,
      path: [a.path1, a.path2],
      badge: a.focus || "Site Audit",
      badgeColor: GOLD,
      icon: <Sparkles size={10} style={{ color: GOLD, flexShrink: 0 }} />,
      raw: {
        headline1: a.headline1, headline2: a.headline2, headline3: a.headline3,
        allHeadlines: [a.headline1, a.headline2, a.headline3].filter(Boolean),
        description1: a.description, description2: "",
        allDescriptions: [a.description],
        path1: a.path1, path2: a.path2,
        finalUrl: "https://www.harmonymedspafl.com/",
        focus: a.focus || "Site Audit", source: "site-audit",
      },
    })),
    ...(active ? [{
      headline: (active.headlines ?? []).slice(0, 3).join(" | "),
      description: active.descriptions?.[0] ?? "",
      path: active.displayPath ?? [],
      badge: "Data-Driven",
      badgeColor: TEAL,
      icon: <TrendingUp size={10} style={{ color: TEAL, flexShrink: 0 }} />,
      raw: {
        headline1: active.headlines?.[0] ?? "",
        headline2: active.headlines?.[1] ?? "",
        headline3: active.headlines?.[2] ?? "",
        allHeadlines: active.headlines ?? [],
        description1: active.descriptions?.[0] ?? "",
        description2: active.descriptions?.[1] ?? "",
        allDescriptions: active.descriptions ?? [],
        path1: active.displayPath?.[0] ?? "",
        path2: active.displayPath?.[1] ?? "",
        finalUrl: "https://www.harmonymedspafl.com/",
        focus: "Data-Driven Analytics", source: "analytics",
      },
    }] : []),
  ];

  async function publishAd() {
    const card = cards[selectedIdx];
    if (!card) return;
    setPublishing(true);
    setPublishResult(null);
    try {
      const res = await fetch(MAKE_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...card.raw,
          adType: "RESPONSIVE_SEARCH_AD",
          businessName: "Harmony MedSpa",
          publishedAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error(`Webhook returned ${res.status}`);
      setPublishResult({ ok: true, msg: "Ad sent to Make.com! Check your scenario." });
    } catch (e) {
      setPublishResult({ ok: false, msg: String(e) });
    } finally {
      setPublishing(false);
      setTimeout(() => setPublishResult(null), 6000);
    }
  }

  /* ── Loading state ── */
  if (loading && history.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 20 }}>
        <div style={{ position: "relative" }}>
          <div style={{
            width: 68, height: 68, borderRadius: "50%",
            background: `${GOLD}10`, borderWidth: "1px", borderStyle: "solid", borderColor: `${GOLD}25`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Sparkles size={26} style={{ color: GOLD }} />
          </div>
          <Loader2 size={76} className="animate-spin" style={{ color: GOLD, position: "absolute", top: -4, left: -4, opacity: 0.35 }} />
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontWeight: 600, color: TEXT, margin: "0 0 6px" }}>Generating your ad suggestions…</p>
          <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>
            Analyzing {campaigns.length} campaigns · {creatives.length} ads · {keywords.length} keywords
          </p>
        </div>
      </div>
    );
  }

  /* ── Error / empty ── */
  if (!active && !loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 0", gap: 16, textAlign: "center" }}>
        {error && (
          <div style={{
            borderRadius: 12, padding: "14px 18px", fontSize: 13, maxWidth: 480,
            backgroundColor: "rgba(248,113,113,0.08)",
            borderWidth: "1px", borderStyle: "solid", borderColor: "rgba(248,113,113,0.2)",
            color: "#F87171",
          }}>
            {error}
          </div>
        )}
        <button onClick={() => runGenerate()}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "12px 28px", borderRadius: 14, fontWeight: 700, fontSize: 14, border: "none",
            background: `linear-gradient(135deg, #B8924A 0%, #E8C96A 45%, #C9A84C 100%)`,
            color: "#2A1F00", cursor: "pointer",
          }}>
          <Sparkles size={15} /> Retry Generation
        </button>
      </div>
    );
  }

  const s = active!;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: TEXT, margin: 0 }}>AI-Generated Ad Suggestions</h3>
            {todayEntry && !promoted && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 20, backgroundColor: `${GOLD}15`, color: GOLD }}>Today</span>
            )}
            {promoted && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 20, backgroundColor: `${TEAL}12`, color: TEAL }}>
                {fmtDate(history.find(e => e.suggestion === promoted)?.date ?? "")}
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: MUTED, margin: "4px 0 0" }}>
            Based on last {days} days · Powered by Claude{todayEntry && !promoted ? " · Cached for today" : ""}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {promoted && (
            <button onClick={() => setPromoted(null)}
              style={{
                fontSize: 12, padding: "6px 14px", borderRadius: 10, color: MUTED, cursor: "pointer",
                backgroundColor: "rgba(255,255,255,0.04)", borderWidth: "1px", borderStyle: "solid", borderColor: BORDER,
              }}>
              ← Today
            </button>
          )}
          <button onClick={() => runGenerate()} disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
              backgroundColor: `${GOLD}10`, color: GOLD,
              borderWidth: "1px", borderStyle: "solid", borderColor: `${GOLD}25`,
            }}>
            {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            {loading ? "Generating…" : "Regenerate"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ borderRadius: 10, padding: "12px 16px", fontSize: 13, backgroundColor: "rgba(248,113,113,0.08)", borderWidth: "1px", borderStyle: "solid", borderColor: "rgba(248,113,113,0.2)", color: "#F87171" }}>
          {error}
        </div>
      )}

      {/* ── Ad card grid ── */}
      {cards.length > 0 && (
        <div style={{ borderRadius: 16, padding: "20px", backgroundColor: CARD, borderWidth: "1px", borderStyle: "solid", borderColor: BORDER }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED, margin: "0 0 14px" }}>
            Suggested Ads · Select to preview &amp; publish
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
            {cards.map((card, i) => (
              <AdGridCard
                key={i}
                card={card}
                selected={selectedIdx === i}
                onClick={() => { setSelectedIdx(i); setPublishResult(null); }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Expanded detail panel ── */}
      {cards[selectedIdx] && (
        <AdDetailPanel
          card={cards[selectedIdx]}
          publishing={publishing}
          publishResult={publishResult}
          onPublish={publishAd}
        />
      )}

      {/* ── Performance insight ── */}
      {s.topPerformerSummary && (
        <div style={{ borderRadius: 14, padding: "16px 20px", backgroundColor: `${GOLD}07`, borderWidth: "1px", borderStyle: "solid", borderColor: `${GOLD}18`, display: "flex", alignItems: "flex-start", gap: 12 }}>
          <TrendingUp size={16} style={{ color: GOLD, marginTop: 1, flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: TEXT, lineHeight: 1.65, margin: 0 }}>{s.topPerformerSummary}</p>
        </div>
      )}

      {/* ── Headlines + Descriptions ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Headlines */}
        <div style={{ borderRadius: 14, padding: "18px 20px", backgroundColor: CARD, borderWidth: "1px", borderStyle: "solid", borderColor: BORDER }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: GOLD, margin: "0 0 4px" }}>All Headlines</p>
          <p style={{ fontSize: 11, color: MUTED, margin: "0 0 14px" }}>{s.headlines?.length ?? 0}/15 generated · max 30 chars</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {(s.headlines ?? []).map((h, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8, backgroundColor: "rgba(255,255,255,0.025)" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: `${GOLD}60`, width: 16, textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: 12, color: TEXT, flex: 1, minWidth: 0 }}>{h}</span>
                <CharBadge text={h} max={30} />
              </div>
            ))}
          </div>
        </div>

        {/* Descriptions + Keywords */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ borderRadius: 14, padding: "18px 20px", backgroundColor: CARD, borderWidth: "1px", borderStyle: "solid", borderColor: BORDER }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: GOLD, margin: "0 0 4px" }}>Descriptions</p>
            <p style={{ fontSize: 11, color: MUTED, margin: "0 0 14px" }}>max 90 chars each</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(s.descriptions ?? []).map((d, i) => (
                <div key={i} style={{
                  padding: "10px 12px", borderRadius: 10,
                  backgroundColor: "rgba(255,255,255,0.025)",
                  borderLeftWidth: "3px", borderLeftStyle: "solid", borderLeftColor: `${GOLD}40`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: `${GOLD}80` }}>D{i + 1}</span>
                    <CharBadge text={d} max={90} />
                  </div>
                  <p style={{ fontSize: 12, color: TEXT, margin: 0, lineHeight: 1.5 }}>{d}</p>
                </div>
              ))}
            </div>
          </div>

          {(s.targetKeywords?.length ?? 0) > 0 && (
            <div style={{ borderRadius: 14, padding: "18px 20px", backgroundColor: CARD, borderWidth: "1px", borderStyle: "solid", borderColor: BORDER }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <Tag size={11} style={{ color: GOLD }} />
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: GOLD, margin: 0 }}>Keywords to Test</p>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {s.targetKeywords.map((kw, i) => (
                  <span key={i} style={{
                    padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 500,
                    backgroundColor: `${GOLD}10`, color: GOLD,
                    borderWidth: "1px", borderStyle: "solid", borderColor: `${GOLD}20`,
                  }}>{kw}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Insights ── */}
      {(s.insights?.length ?? 0) > 0 && (
        <div style={{ borderRadius: 14, padding: "18px 20px", backgroundColor: CARD, borderWidth: "1px", borderStyle: "solid", borderColor: BORDER }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <Lightbulb size={13} style={{ color: GOLD }} />
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: GOLD, margin: 0 }}>Optimization Insights</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {s.insights.map((insight, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", backgroundColor: `${GOLD}14`, color: GOLD, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 10, fontWeight: 700 }}>{i + 1}</div>
                <p style={{ fontSize: 13, color: TEXT, lineHeight: 1.6, margin: 0 }}>{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bid recommendation ── */}
      {s.bidRecommendation && (
        <div style={{ borderRadius: 14, padding: "16px 20px", backgroundColor: CARD, borderWidth: "1px", borderStyle: "solid", borderColor: BORDER, display: "flex", alignItems: "flex-start", gap: 12 }}>
          <Target size={15} style={{ color: TEAL, marginTop: 1, flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: TEAL, margin: "0 0 6px" }}>
              Bid &amp; Budget Recommendation
            </p>
            <p style={{ fontSize: 13, color: TEXT, lineHeight: 1.6, margin: 0 }}>{s.bidRecommendation}</p>
          </div>
        </div>
      )}

      {/* ── Previous days ── */}
      {pastEntries.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 1, backgroundColor: BORDER }} />
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED, margin: 0, padding: "0 4px" }}>Previous Days</p>
            <div style={{ flex: 1, height: 1, backgroundColor: BORDER }} />
          </div>
          {pastEntries.map(entry => (
            <HistoryCard key={entry.date} entry={entry} onPromote={() => setPromoted(entry.suggestion)} />
          ))}
        </div>
      )}

      <p style={{ textAlign: "center", fontSize: 11, color: "#3A3A4A", paddingBottom: 8 }}>
        Powered by Claude · {history.length} day{history.length !== 1 ? "s" : ""} of history stored
      </p>
    </div>
  );
}
