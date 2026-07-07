"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, RefreshCw, Loader2 } from "lucide-react";

type AdCard = {
  headline1: string;
  headline2: string;
  headline3: string;
  description: string;
  path1: string;
  path2: string;
  focus: string;
  insight: string;
};

const GOLD   = "#C9A84C";
const CARD   = "#111117";
const BORDER = "rgba(201,168,76,0.12)";
const MUTED  = "#7A7A8A";

const QA_KEY = "harmony_quick_ads_v1";
const QA_TTL = 24 * 60 * 60 * 1000; // 24 hours

function readCache(): { ads: AdCard[]; ts: number } | null {
  try {
    const raw = localStorage.getItem(QA_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}
function writeCache(ads: AdCard[]) {
  localStorage.setItem(QA_KEY, JSON.stringify({ ads, ts: Date.now() }));
}

function GoogleMiniAd({ ad }: { ad: AdCard }) {
  const headline = [ad.headline1, ad.headline2, ad.headline3].filter(Boolean).join(" | ");
  const path = [ad.path1, ad.path2].filter(Boolean).join("/");

  return (
    <div style={{
      backgroundColor: "#fff",
      borderRadius: 10,
      padding: "16px 18px",
      flex: 1,
      minWidth: 0,
      boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
    }}>
      {/* URL row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <div style={{
          width: 22, height: 22, borderRadius: "50%",
          backgroundColor: "#f1f3f4",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <svg width="12" height="12" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="24" fill="#fff" />
            <path d="M24 10a14 14 0 1 0 0 28A14 14 0 0 0 24 10z" fill="#4285F4" />
            <path d="M24 10c-3.9 0-7.4 1.6-10 4.1L10 10h28l-4 4.1A14 14 0 0 0 24 10z" fill="#EA4335" />
            <path d="M10 10l4 4.1A13.9 13.9 0 0 0 10 24H4a20 20 0 0 1 6-14z" fill="#FBBC05" />
            <path d="M38 10l-4 4.1A13.9 13.9 0 0 1 38 24h6a20 20 0 0 0-6-14z" fill="#34A853" />
          </svg>
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: 11, color: "#202124", fontWeight: 500, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            harmonymedspafl.com
          </p>
          <p style={{ fontSize: 10, color: "#5F6368", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            harmonymedspafl.com{path ? `/${path}` : ""}
          </p>
        </div>
        <span style={{
          fontSize: 9, color: "#006621",
          borderWidth: "1px", borderStyle: "solid", borderColor: "#006621",
          borderRadius: 3, padding: "1px 4px", flexShrink: 0,
        }}>Ad</span>
      </div>

      {/* Headline */}
      <h3 style={{
        fontSize: 14, color: "#1A0DAB", fontWeight: 400,
        lineHeight: 1.35, margin: "0 0 5px", cursor: "pointer",
        overflow: "hidden", textOverflow: "ellipsis",
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
      }}>
        {headline}
      </h3>

      {/* Description */}
      <p style={{
        fontSize: 11.5, color: "#3C4043", lineHeight: 1.5, margin: 0,
        overflow: "hidden", textOverflow: "ellipsis",
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
      }}>
        {ad.description}
      </p>
    </div>
  );
}

function SkeletonAd() {
  return (
    <div style={{
      backgroundColor: "#fff", borderRadius: 10, padding: "16px 18px",
      flex: 1, minWidth: 0, boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ width: 22, height: 22, borderRadius: "50%", backgroundColor: "#f1f3f4" }} />
        <div style={{ flex: 1, height: 10, borderRadius: 4, backgroundColor: "#f1f3f4" }} />
      </div>
      <div style={{ height: 13, borderRadius: 4, backgroundColor: "#e8f0fe", marginBottom: 6 }} />
      <div style={{ height: 13, borderRadius: 4, backgroundColor: "#e8f0fe", marginBottom: 5, width: "80%" }} />
      <div style={{ height: 10, borderRadius: 4, backgroundColor: "#f5f5f5", marginBottom: 3 }} />
      <div style={{ height: 10, borderRadius: 4, backgroundColor: "#f5f5f5", width: "60%" }} />
    </div>
  );
}

export default function QuickAiAds() {
  const [ads, setAds]         = useState<AdCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [generated, setGenerated] = useState<string | null>(null);

  const load = useCallback(async (bust = false) => {
    // Use cache unless busting
    if (!bust) {
      const cached = readCache();
      if (cached && Date.now() - cached.ts < QA_TTL) {
        setAds(cached.ads);
        setGenerated(new Date(cached.ts).toISOString());
        setLoading(false);
        return;
      }
    }
    setLoading(true);
    setError(null);
    try {
      const url = `/api/ai-quick-ads?t=${Date.now()}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      writeCache(data.ads ?? []);
      setAds(data.ads ?? []);
      setGenerated(data.generated ?? null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{
      borderRadius: 16,
      padding: "18px 20px",
      backgroundColor: CARD,
      borderWidth: "1px", borderStyle: "solid", borderColor: BORDER,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={14} style={{ color: GOLD, flexShrink: 0 }} />
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: GOLD, margin: 0 }}>
            AI-Suggested Ads · Site Audit
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {generated && !loading && (
            <p style={{ fontSize: 10, color: MUTED, margin: 0 }}>
              Based on harmonymedspafl.com
            </p>
          )}
          <button
            onClick={() => load(true)}
            disabled={loading}
            title="Regenerate"
            style={{
              background: "none", border: "none", cursor: loading ? "not-allowed" : "pointer",
              padding: 4, color: MUTED, display: "flex", alignItems: "center",
            }}
          >
            <RefreshCw size={12} style={{ opacity: loading ? 0.4 : 0.7 }} />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p style={{ fontSize: 12, color: "#F87171", margin: "0 0 10px" }}>
          {error}
        </p>
      )}

      {/* Ad cards */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {loading ? (
          <>
            <SkeletonAd />
            <SkeletonAd />
            <SkeletonAd />
          </>
        ) : (
          ads.map((ad, i) => (
            <div key={i} style={{ flex: "1 1 220px", minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              <GoogleMiniAd ad={ad} />
              {ad.focus && (
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
                  textTransform: "uppercase", padding: "3px 8px",
                  borderRadius: 20, alignSelf: "flex-start",
                  backgroundColor: `${GOLD}15`, color: GOLD,
                }}>
                  {ad.focus}
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
          <Loader2 size={11} style={{ color: GOLD, animation: "spin 1s linear infinite" }} />
          <p style={{ fontSize: 10, color: MUTED, margin: 0 }}>Auditing harmonymedspafl.com…</p>
        </div>
      )}

      <p style={{ fontSize: 10, color: "#3A3A4A", margin: "12px 0 0", textAlign: "right" }}>
        Powered by Claude · Based on live website audit
      </p>
    </div>
  );
}
