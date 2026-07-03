"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Loader2, RefreshCw, Search, Phone, Mail, Tag, Calendar,
  ChevronDown, ChevronUp, MessageSquare, CheckCircle, AlertCircle, Filter,
} from "lucide-react";
import type { Lead } from "@/app/api/airtable/leads/route";

const GOLD   = "#C9A84C";
const CARD   = "#111117";
const CARD2  = "#0D0D12";
const BORDER = "rgba(201,168,76,0.12)";
const TEXT   = "#F0ECE4";
const MUTED  = "#7A7A8A";
const DIM    = "#5A5A6A";
const TEAL   = "#2DD4BF";

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  "New":            { color: GOLD,       bg: `${GOLD}15`,       label: "New"           },
  "Contacted":      { color: "#60A5FA",  bg: "rgba(96,165,250,0.12)", label: "Contacted" },
  "Booked":         { color: "#22C55E",  bg: "rgba(34,197,94,0.12)",  label: "Booked"    },
  "Not Interested": { color: "#F87171",  bg: "rgba(248,113,113,0.1)", label: "Not Interested" },
};

const TREATMENT_COLORS: Record<string, string> = {
  "Injectables (Botox/Filler)": "#A78BFA",
  "Weight Loss":                "#34D399",
  "Advanced Skin & Wellness":   "#60A5FA",
  "General Inquiry":            GOLD,
  "Other":                      MUTED,
};

const ALL_STATUSES = ["all", "New", "Contacted", "Booked", "Not Interested"];

function fmtDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24)  return `${hrs}h ago`;
  if (days < 7)  return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { color: MUTED, bg: "rgba(255,255,255,0.05)", label: status };
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
      padding: "3px 10px", borderRadius: 20,
      backgroundColor: cfg.bg, color: cfg.color,
    }}>
      {cfg.label}
    </span>
  );
}

function SentBadge({ label, status }: { label: string; status: string }) {
  const ok = status?.toLowerCase() === "sent" || status?.toLowerCase() === "delivered";
  const pending = status?.toLowerCase() === "pending";
  const color = ok ? "#22C55E" : pending ? GOLD : MUTED;
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
      {label}: {status || "—"}
    </span>
  );
}

function LeadCard({ lead, onStatusChange }: { lead: Lead; onStatusChange: (id: string, s: string) => void }) {
  const [expanded, setExpanded]     = useState(false);
  const [updating, setUpdating]     = useState(false);
  const [localStatus, setLocalStatus] = useState(lead.status);
  const treatColor = TREATMENT_COLORS[lead.treatment] ?? GOLD;

  async function changeStatus(newStatus: string) {
    setUpdating(true);
    try {
      await fetch("/api/airtable/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead.id, status: newStatus }),
      });
      setLocalStatus(newStatus);
      onStatusChange(lead.id, newStatus);
    } finally { setUpdating(false); }
  }

  return (
    <div style={{
      backgroundColor: CARD,
      borderRadius: 14,
      borderWidth: "1px", borderStyle: "solid",
      borderColor: localStatus === "Booked" ? "rgba(34,197,94,0.25)" : BORDER,
      overflow: "hidden",
      transition: "border-color 0.2s",
    }}>
      {/* Main row */}
      <div
        style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
        onClick={() => setExpanded(e => !e)}
      >
        {/* Avatar */}
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: `linear-gradient(135deg, ${treatColor}30, ${treatColor}15)`,
          borderWidth: "1px", borderStyle: "solid", borderColor: `${treatColor}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700, color: treatColor,
        }}>
          {initials(lead.name)}
        </div>

        {/* Core info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: 0 }}>{lead.name || "—"}</p>
            <StatusBadge status={localStatus} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 3, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: MUTED, display: "flex", alignItems: "center", gap: 3 }}>
              <Tag size={10} style={{ color: treatColor }} />
              {lead.treatment || "—"}
            </span>
            <span style={{ fontSize: 10, color: DIM }}>·</span>
            <span style={{ fontSize: 11, color: DIM }}>{fmtDate(lead.createdAt)}</span>
            {lead.utmCampaign && (
              <>
                <span style={{ fontSize: 10, color: DIM }}>·</span>
                <span style={{ fontSize: 10, color: DIM }}>📍 {lead.utmCampaign}</span>
              </>
            )}
          </div>
        </div>

        {/* Contact quick icons */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {lead.phone && (
            <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()}
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: TEAL, textDecoration: "none" }}>
              <Phone size={12} />
              <span className="hidden sm:inline">{lead.phone}</span>
            </a>
          )}
          {expanded
            ? <ChevronUp size={14} style={{ color: MUTED }} />
            : <ChevronDown size={14} style={{ color: MUTED }} />
          }
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{
          borderTopWidth: "1px", borderTopStyle: "solid", borderTopColor: BORDER,
          padding: "16px", display: "flex", flexDirection: "column", gap: 14,
        }}>
          {/* Contact details */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
            {[
              { icon: Phone, label: "Phone",  value: lead.phone,  href: `tel:${lead.phone}` },
              { icon: Mail,  label: "Email",  value: lead.email,  href: `mailto:${lead.email}` },
            ].map(f => (
              <div key={f.label} style={{ padding: "8px 12px", borderRadius: 8, backgroundColor: "rgba(255,255,255,0.025)", borderWidth: "1px", borderStyle: "solid", borderColor: "rgba(255,255,255,0.05)" }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: DIM, margin: "0 0 3px", display: "flex", alignItems: "center", gap: 4 }}>
                  <f.icon size={9} /> {f.label}
                </p>
                {f.value
                  ? <a href={f.href} style={{ fontSize: 12, color: TEAL, textDecoration: "none" }}>{f.value}</a>
                  : <span style={{ fontSize: 12, color: MUTED }}>—</span>
                }
              </div>
            ))}
            <div style={{ padding: "8px 12px", borderRadius: 8, backgroundColor: "rgba(255,255,255,0.025)", borderWidth: "1px", borderStyle: "solid", borderColor: "rgba(255,255,255,0.05)" }}>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: DIM, margin: "0 0 3px", display: "flex", alignItems: "center", gap: 4 }}>
                <Calendar size={9} /> Submitted
              </p>
              <span style={{ fontSize: 12, color: TEXT }}>
                {lead.createdAt ? new Date(lead.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—"}
              </span>
            </div>
            <div style={{ padding: "8px 12px", borderRadius: 8, backgroundColor: "rgba(255,255,255,0.025)", borderWidth: "1px", borderStyle: "solid", borderColor: "rgba(255,255,255,0.05)" }}>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: DIM, margin: "0 0 3px" }}>Source</p>
              <span style={{ fontSize: 12, color: TEXT }}>{lead.source || "—"}</span>
            </div>
          </div>

          {/* Message */}
          {lead.message && (
            <div style={{ padding: "10px 12px", borderRadius: 10, backgroundColor: `${GOLD}06`, borderLeftWidth: "3px", borderLeftStyle: "solid", borderLeftColor: `${GOLD}40` }}>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: GOLD, margin: "0 0 5px", display: "flex", alignItems: "center", gap: 4 }}>
                <MessageSquare size={9} /> Message
              </p>
              <p style={{ fontSize: 12, color: TEXT, lineHeight: 1.6, margin: 0 }}>{lead.message}</p>
            </div>
          )}

          {/* UTM attribution */}
          {(lead.utmSource || lead.utmCampaign || lead.utmMedium) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {[
                { label: "Source",   value: lead.utmSource },
                { label: "Campaign", value: lead.utmCampaign },
                { label: "Medium",   value: lead.utmMedium },
              ].filter(f => f.value).map(f => (
                <span key={f.label} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, backgroundColor: "rgba(255,255,255,0.05)", color: MUTED }}>
                  {f.label}: <span style={{ color: TEXT }}>{f.value}</span>
                </span>
              ))}
            </div>
          )}

          {/* Automation status + Update status */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", gap: 12 }}>
              <SentBadge label="Email" status={lead.emailSentStatus} />
              <SentBadge label="SMS"   status={lead.smsSentStatus}   />
            </div>

            {/* Status update buttons */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {updating && <Loader2 size={13} className="animate-spin" style={{ color: GOLD }} />}
              {Object.entries(STATUS_CONFIG)
                .filter(([key]) => key !== localStatus)
                .map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => changeStatus(key)}
                    disabled={updating}
                    style={{
                      fontSize: 10, fontWeight: 600, padding: "4px 12px", borderRadius: 20,
                      cursor: updating ? "not-allowed" : "pointer", border: "none",
                      backgroundColor: cfg.bg, color: cfg.color,
                      opacity: updating ? 0.5 : 1,
                    }}
                  >
                    → {cfg.label}
                  </button>
                ))
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LeadsClient() {
  const [leads, setLeads]       = useState<Lead[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch]     = useState("");

  const load = useCallback(async (status = statusFilter) => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/airtable/leads?status=${status}`);
      const data = await res.json() as { leads?: Lead[]; error?: string };
      if (data.error) throw new Error(data.error);
      setLeads(data.leads ?? []);
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  function handleStatusChange(id: string, newStatus: string) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      l.phone.includes(q) ||
      l.treatment.toLowerCase().includes(q)
    );
  }, [leads, search]);

  // KPIs
  const total     = leads.length;
  const newCount  = leads.filter(l => l.status === "New").length;
  const booked    = leads.filter(l => l.status === "Booked").length;
  const contacted = leads.filter(l => l.status === "Contacted").length;
  const convRate  = total > 0 ? Math.round((booked / total) * 100) : 0;

  const today = new Date().toDateString();
  const todayCount = leads.filter(l => {
    try { return new Date(l.createdAt).toDateString() === today; } catch { return false; }
  }).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: GOLD, margin: "0 0 4px" }}>
            Lead Management
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: TEXT, margin: "0 0 4px" }}>Leads</h1>
          <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>
            All form submissions from the Harmony MedSpa lead form
          </p>
        </div>
        <button
          onClick={() => load()}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            backgroundColor: "rgba(255,255,255,0.04)", color: MUTED,
            borderWidth: "1px", borderStyle: "solid", borderColor: BORDER,
          }}
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          Refresh
        </button>
      </div>

      {/* ── KPI cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { label: "Total Leads",   value: total,       color: GOLD,      sub: "all time" },
          { label: "New",           value: newCount,    color: GOLD,      sub: "awaiting contact" },
          { label: "Today",         value: todayCount,  color: TEAL,      sub: "submitted today" },
          { label: "Contacted",     value: contacted,   color: "#60A5FA", sub: "in progress" },
          { label: "Booked",        value: booked,      color: "#22C55E", sub: `${convRate}% conversion` },
        ].map(k => (
          <div key={k.label} style={{
            backgroundColor: CARD, borderRadius: 14,
            borderWidth: "1px", borderStyle: "solid", borderColor: BORDER,
            padding: "14px 16px",
          }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: DIM, margin: "0 0 6px" }}>{k.label}</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: k.color, margin: "0 0 2px", lineHeight: 1 }}>{k.value}</p>
            <p style={{ fontSize: 10, color: DIM, margin: 0 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Filters + Search ── */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 0 }}>
          <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: MUTED, pointerEvents: "none" }} />
          <input
            type="text"
            placeholder="Search name, email, phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "9px 12px 9px 32px", borderRadius: 10, fontSize: 13,
              backgroundColor: CARD, color: TEXT,
              borderWidth: "1px", borderStyle: "solid", borderColor: BORDER,
              outline: "none",
            }}
          />
        </div>

        {/* Status filter pills */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <Filter size={12} style={{ color: MUTED, flexShrink: 0 }} />
          {ALL_STATUSES.map(s => {
            const cfg = STATUS_CONFIG[s];
            const active = statusFilter === s;
            return (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); load(s); }}
                style={{
                  fontSize: 11, fontWeight: 600, padding: "5px 14px", borderRadius: 20, cursor: "pointer",
                  borderWidth: "1px", borderStyle: "solid",
                  backgroundColor: active ? (cfg ? cfg.bg : `${GOLD}15`) : "transparent",
                  color: active ? (cfg ? cfg.color : GOLD) : MUTED,
                  borderColor: active ? (cfg ? cfg.color + "40" : `${GOLD}40`) : BORDER,
                  transition: "all 0.15s",
                }}
              >
                {s === "all" ? "All" : s}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Lead list ── */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 10 }}>
          <Loader2 size={24} className="animate-spin" style={{ color: GOLD }} />
          <span style={{ fontSize: 13, color: MUTED }}>Loading leads…</span>
        </div>
      ) : error ? (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "20px", borderRadius: 14, backgroundColor: "rgba(248,113,113,0.08)", borderWidth: "1px", borderStyle: "solid", borderColor: "rgba(248,113,113,0.2)" }}>
          <AlertCircle size={18} style={{ color: "#F87171", flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#F87171", margin: "0 0 4px" }}>Could not load leads</p>
            <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>{error}</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 10 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: `${GOLD}10`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle size={22} style={{ color: GOLD }} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: TEXT, margin: 0 }}>
            {search ? "No leads match your search" : "No leads yet"}
          </p>
          <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>
            {search ? "Try a different search term" : "Leads will appear here when the form is submitted"}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontSize: 11, color: DIM, margin: "0 0 4px" }}>
            {filtered.length} lead{filtered.length !== 1 ? "s" : ""}
            {search ? ` matching "${search}"` : ""}
          </p>
          {filtered.map(lead => (
            <LeadCard key={lead.id} lead={lead} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
}
