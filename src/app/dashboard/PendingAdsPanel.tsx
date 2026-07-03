"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, RefreshCw, ExternalLink, Send, CheckCircle, XCircle, Clock, AlertCircle, Zap } from "lucide-react";
import type { PendingAd } from "@/app/api/airtable/pending-ads/route";

const PUBLISH_WEBHOOK = "https://hook.us2.make.com/j51ev3akcj3svqgnxbi52f8a9v4rczhk";

const GOLD   = "#C9A84C";
const CARD   = "#111117";
const BORDER = "rgba(201,168,76,0.12)";
const TEXT   = "#F0ECE4";
const MUTED  = "#7A7A8A";
const DIM    = "#5A5A6A";
const TEAL   = "#2DD4BF";

type PublishState = "idle" | "publishing" | "published" | "error";

function GoogleLogo() {
  return (
    <svg width="12" height="12" viewBox="0 0 48 48" fill="none">
      <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" fill="#FFC107"/>
      <path d="M6.3 14.7l7.4 5.4C15.5 16.1 19.4 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 16.3 2 9.7 7.4 6.3 14.7z" fill="#FF3D00"/>
      <path d="M24 46c5.5 0 10.5-1.9 14.3-5.2l-6.6-5.6C29.8 36.9 27 38 24 38c-6 0-10.6-3.9-11.7-9.2l-7.4 5.7C8.3 41.7 15.6 46 24 46z" fill="#4CAF50"/>
      <path d="M44.5 20H24v8.5h11.8c-.8 3.1-2.8 5.7-5.4 7.4l6.6 5.6C42 38.3 45 32 45 24c0-1.3-.2-2.7-.5-4z" fill="#1976D2"/>
    </svg>
  );
}

function AdCard({ ad }: { ad: PendingAd }) {
  const [state, setState]   = useState<PublishState>("idle");
  const [errMsg, setErrMsg] = useState("");

  const domain  = (() => { try { return new URL(ad.final_url).hostname; } catch { return "harmonymedspafl.com"; } })();
  const urlPath = [ad.path1, ad.path2].filter(Boolean).join("/");
  const displayUrl = urlPath ? `${domain}/${urlPath}` : domain;

  const headlines = [ad.headline1, ad.headline2, ad.headline3].filter(Boolean).join(" | ");

  async function handlePublish() {
    setState("publishing");
    setErrMsg("");
    try {
      const res = await fetch(PUBLISH_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ad_resource_name: ad.ad_resource_name,
          record_id:        ad.id,
        }),
      });
      if (!res.ok) throw new Error(`Webhook ${res.status}`);
      setState("published");
    } catch (e) {
      setErrMsg(String(e));
      setState("error");
    }
  }

  return (
    <div style={{
      backgroundColor: CARD,
      borderRadius: 16,
      borderWidth: "1px", borderStyle: "solid",
      borderColor: state === "published" ? `${TEAL}40` : BORDER,
      overflow: "hidden",
      transition: "border-color 0.2s",
    }}>
      {/* Card header */}
      <div style={{
        padding: "12px 16px",
        borderBottomWidth: "1px", borderBottomStyle: "solid", borderBottomColor: BORDER,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
        background: state === "published" ? `${TEAL}06` : `${GOLD}06`,
      }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {ad.business_name || "—"}
          </p>
          <p style={{ fontSize: 10, color: MUTED, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {[ad.campaign_name, ad.ad_group_name].filter(Boolean).join(" › ")}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 9, color: DIM }}>{ad.created_at}</span>
          {state === "published" ? (
            <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20, backgroundColor: `${TEAL}15`, color: TEAL }}>
              PUBLISHED
            </span>
          ) : (
            <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20, backgroundColor: `${GOLD}15`, color: GOLD }}>
              PENDING
            </span>
          )}
        </div>
      </div>

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Google SERP preview */}
        <div style={{ backgroundColor: "#fff", borderRadius: 10, padding: "14px 16px" }}>
          {/* Domain row */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", backgroundColor: "#f8f9fa", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <GoogleLogo />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: 11, color: "#202124", fontWeight: 500, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {domain}
              </p>
              <p style={{ fontSize: 10, color: "#5F6368", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {displayUrl}
              </p>
            </div>
            <span style={{ fontSize: 9, color: "#006621", borderWidth: "1px", borderStyle: "solid", borderColor: "#006621", borderRadius: 3, padding: "1px 4px", flexShrink: 0 }}>
              Ad
            </span>
          </div>

          {/* Headline */}
          <h3 style={{ fontSize: 16, color: "#1A0DAB", fontWeight: 400, lineHeight: 1.35, margin: "0 0 6px", cursor: "pointer" }}>
            {headlines || "—"}
          </h3>

          {/* Descriptions */}
          {ad.description1 && (
            <p style={{ fontSize: 12, color: "#3C4043", lineHeight: 1.55, margin: "0 0 3px" }}>
              {ad.description1}
            </p>
          )}
          {ad.description2 && (
            <p style={{ fontSize: 12, color: "#3C4043", lineHeight: 1.55, margin: 0 }}>
              {ad.description2}
            </p>
          )}
        </div>

        {/* Ad copy breakdown */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          {[
            { label: "H1", value: ad.headline1, max: 30 },
            { label: "H2", value: ad.headline2, max: 30 },
            { label: "H3", value: ad.headline3, max: 30 },
          ].map(f => (
            <div key={f.label} style={{ padding: "6px 8px", borderRadius: 8, backgroundColor: "rgba(255,255,255,0.025)", borderWidth: "1px", borderStyle: "solid", borderColor: "rgba(255,255,255,0.05)" }}>
              <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: DIM, margin: "0 0 3px" }}>{f.label}</p>
              <p style={{ fontSize: 10, color: TEXT, margin: 0, lineHeight: 1.3 }}>{f.value || "—"}</p>
              <p style={{ fontSize: 8, fontFamily: "monospace", color: f.value.length <= f.max ? TEAL : "#F87171", margin: "3px 0 0" }}>
                {f.value.length}/{f.max}
              </p>
            </div>
          ))}
        </div>

        {/* Descriptions row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {[
            { label: "D1", value: ad.description1, max: 90 },
            { label: "D2", value: ad.description2, max: 90 },
          ].map(f => (
            <div key={f.label} style={{ padding: "6px 8px", borderRadius: 8, backgroundColor: "rgba(255,255,255,0.025)", borderWidth: "1px", borderStyle: "solid", borderColor: "rgba(255,255,255,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: DIM, margin: 0 }}>{f.label}</p>
                <p style={{ fontSize: 8, fontFamily: "monospace", color: f.value.length <= f.max ? TEAL : "#F87171", margin: 0 }}>
                  {f.value.length}/{f.max}
                </p>
              </div>
              <p style={{ fontSize: 10, color: MUTED, margin: 0, lineHeight: 1.4 }}>
                {f.value ? (f.value.length > 60 ? f.value.slice(0, 60) + "…" : f.value) : "—"}
              </p>
            </div>
          ))}
        </div>

        {/* Final URL + Publish row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {ad.final_url && (
            <a
              href={ad.final_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: MUTED, textDecoration: "none", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              <ExternalLink size={11} style={{ flexShrink: 0, color: DIM }} />
              {ad.final_url}
            </a>
          )}

          {/* Publish button */}
          {state === "published" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 10, backgroundColor: `${TEAL}12`, borderWidth: "1px", borderStyle: "solid", borderColor: `${TEAL}30` }}>
              <CheckCircle size={13} style={{ color: TEAL }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: TEAL }}>Published</span>
            </div>
          ) : (
            <button
              onClick={handlePublish}
              disabled={state === "publishing"}
              style={{
                display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                padding: "9px 18px", borderRadius: 10, border: "none", cursor: state === "publishing" ? "not-allowed" : "pointer",
                fontWeight: 700, fontSize: 12,
                background: state === "publishing"
                  ? `rgba(201,168,76,0.2)`
                  : `linear-gradient(135deg, #B8924A 0%, #E8C96A 50%, #C9A84C 100%)`,
                color: state === "publishing" ? GOLD : "#1A0D00",
                boxShadow: state === "publishing" ? "none" : `0 3px 14px ${GOLD}35`,
                transition: "opacity 0.15s",
              }}
            >
              {state === "publishing"
                ? <><Loader2 size={12} className="animate-spin" /> Publishing…</>
                : <><Send size={12} /> Publish</>
              }
            </button>
          )}
        </div>

        {/* Error */}
        {state === "error" && errMsg && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 7, padding: "8px 12px", borderRadius: 8, backgroundColor: "rgba(248,113,113,0.08)", borderWidth: "1px", borderStyle: "solid", borderColor: "rgba(248,113,113,0.25)", fontSize: 11, color: "#F87171", lineHeight: 1.5 }}>
            <XCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{errMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PendingAdsPanel() {
  const [ads, setAds]       = useState<PendingAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/airtable/pending-ads");
      const data = await res.json() as { ads?: PendingAd[]; error?: string };
      if (data.error) throw new Error(data.error);
      setAds(data.ads ?? []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ borderRadius: 20, overflow: "hidden", borderWidth: "1px", borderStyle: "solid", borderColor: BORDER }}>
      {/* Panel header */}
      <div style={{
        padding: "16px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        background: `linear-gradient(90deg, ${GOLD}08 0%, transparent 60%)`,
        borderBottomWidth: "1px", borderBottomStyle: "solid", borderBottomColor: BORDER,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: `${GOLD}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Clock size={15} style={{ color: GOLD }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: 0 }}>Pending Ads Review</p>
            <p style={{ fontSize: 11, color: MUTED, margin: "2px 0 0" }}>
              {loading ? "Loading…" : `${ads.length} ad${ads.length !== 1 ? "s" : ""} awaiting approval`}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!loading && ads.length > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, backgroundColor: `${GOLD}15`, color: GOLD }}>
              {ads.length} PENDING
            </span>
          )}
          <button
            onClick={load}
            disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", backgroundColor: "rgba(255,255,255,0.04)", color: MUTED, border: `1px solid ${BORDER}` }}
          >
            {loading ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
            Refresh
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "16px 20px", backgroundColor: "#0D0D12" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 0", gap: 10 }}>
            <Loader2 size={22} className="animate-spin" style={{ color: GOLD }} />
            <span style={{ fontSize: 13, color: MUTED }}>Fetching pending ads…</span>
          </div>
        ) : error ? (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "16px", borderRadius: 12, backgroundColor: "rgba(248,113,113,0.08)", borderWidth: "1px", borderStyle: "solid", borderColor: "rgba(248,113,113,0.2)" }}>
            <AlertCircle size={16} style={{ color: "#F87171", marginTop: 1, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#F87171", margin: "0 0 4px" }}>Could not load pending ads</p>
              <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>{error}</p>
            </div>
          </div>
        ) : ads.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 0", gap: 10 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: `${TEAL}10`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={20} style={{ color: TEAL }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: TEXT, margin: "0 0 4px" }}>All caught up!</p>
              <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>No ads pending review right now.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
            {ads.map(ad => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
