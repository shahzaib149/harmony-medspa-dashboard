"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { Activity, ArrowRight, CalendarClock, Gift, Megaphone, MessageSquare, RefreshCw, Search, SearchX, Sparkles, Users, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import CampaignCard, { FailedCampaignCard } from "@/components/campaigns/CampaignCard";
import CampaignSpotlight from "@/components/campaigns/CampaignSpotlight";
import c from "@/components/campaigns/campaigns.module.css";
import {
  blackFridayCard, giftCardCard, reactivationCard, reactivationStatus, registryCard, showSpotlight, statusCounts, type CampaignCardModel,
} from "@/lib/campaigns/card-model";
import { countdown, relativeTime } from "@/lib/campaigns/paginate";
import { useCountUp } from "@/lib/campaigns/useCountUp";
import { BLACK_FRIDAY_NAME, BLACK_FRIDAY_PATH, SEND_STEPS, nextSend } from "@/lib/black-friday/campaign";
import { GIFT_BONUS_ENDS_AT, GIFT_BONUS_STARTS_AT, GIFT_CARDS_NAME } from "@/lib/gift-cards/campaign";
import { DEFAULT_CAMPAIGN } from "@/lib/reactivation/model";
import { CAMPAIGNS } from "@/lib/campaigns/registry";
import type { CampaignsOverview } from "@/lib/campaigns/overview";

/** Registry campaigns + Black Friday + Gift Cards + Reactivation. */
export const TOTAL_CAMPAIGNS = CAMPAIGNS.length + 3;

const STATUS_ORDER = ["Active", "Scheduled", "Paused", "Idle", "Ended"];
const TYPES = [["All", "All types"], ["Automatic", "Automatic"], ["Manual Enrollment", "Manual"]] as const;

// Ticks every 30s so countdowns and "x ago" stay current; 0 during server render.
const subscribeClock = (cb: () => void) => { const t = window.setInterval(cb, 30_000); return () => window.clearInterval(t); };
const clock = () => Math.floor(Date.now() / 30_000) * 30_000;
function useNow() { return useSyncExternalStore(subscribeClock, clock, () => 0); }

/** Streaming fallback in the shape of the page. */
export function CampaignsSkeleton() {
  return (
    <div className={c.page} role="status" aria-label="Loading campaigns">
      <Skeleton className="h-[230px] rounded-[28px]" />
      <div className={c.kpis}>{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[126px] rounded-[20px]" />)}</div>
      <Skeleton className="h-[66px] rounded-[20px]" />
      <Skeleton className="h-[220px] rounded-[26px]" />
      <div className={c.grid}>{Array.from({ length: TOTAL_CAMPAIGNS - 1 }, (_, i) => <Skeleton key={i} className="h-[330px] rounded-[24px]" />)}</div>
    </div>
  );
}

type Item = { key: string; name: string; status: string; type: string; text: string; model: CampaignCardModel | null };

function Kpi({ label, value, hint, icon, accent, index }: { label: string; value: number; hint: string; icon: ReactNode; accent: string; index: number }) {
  const shown = Math.round(useCountUp(value)).toLocaleString("en-US");
  return (
    <div className={`${c.kpi} ${c.rise}`} style={{ "--accent": accent, "--i": index } as CSSProperties}>
      <div className={c.kpiTop}><span className={c.kpiLabel}>{label}</span><span className={c.kpiIcon}>{icon}</span></div>
      <p className={c.kpiValue}>{shown}</p>
      <p className={c.kpiHint}>{hint}</p>
    </div>
  );
}

type LiveItem = { key: string; icon: ReactNode; accent: string; title: string; text: string };

/** "Live now": rotates through what is happening across the campaigns. */
function LiveNow({ items }: { items: LiveItem[] }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (items.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % items.length), 5000);
    return () => window.clearInterval(id);
  }, [items.length]);
  const item = items[index % Math.max(1, items.length)];
  if (!item) return null;
  return (
    <aside className={c.live} aria-label="Live now">
      <div className={c.liveHead}>
        <span className="inline-flex items-center"><span className={c.liveDot} aria-hidden="true" />Live now</span>
        <span className={c.liveDots}>
          {items.map((it, i) => <button key={it.key} type="button" aria-label={`Show ${it.title}`} aria-current={i === index % items.length ? "true" : undefined} onClick={() => setIndex(i)} />)}
        </span>
      </div>
      <div key={item.key} className={c.liveItem} aria-live="polite" style={{ "--accent": item.accent } as CSSProperties}>
        <span className={c.liveIcon}>{item.icon}</span>
        <div className="min-w-0"><p className={c.liveTitle}>{item.title}</p><p className={c.liveText}>{item.text}</p></div>
      </div>
    </aside>
  );
}

export default function CampaignsClient({ initial }: { initial: CampaignsOverview }) {
  const [data, setData] = useState(initial);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [type, setType] = useState("All");
  const clockNow = useNow();
  const now = clockNow || Date.parse(data.generatedAt);

  async function refresh() {
    setRefreshing(true);
    try {
      const response = await fetch("/api/airtable/campaigns?refresh=1", { cache: "no-store" });
      if (response.ok) setData(await response.json() as CampaignsOverview);
    } finally {
      setRefreshing(false);
    }
  }

  // Fixed order: lead automations, then the seasonal campaigns, then patient reactivation.
  const items: Item[] = useMemo(() => {
    const registry: Item[] = data.campaigns
      ? data.campaigns.map((s) => ({ key: s.slug, name: s.name, status: s.status, type: s.type, text: s.description, model: registryCard(s) }))
      : CAMPAIGNS.map((s) => ({ key: s.slug, name: s.name, status: s.status, type: s.type, text: s.description, model: null }));
    const bf = data.blackFriday ? blackFridayCard(data.blackFriday) : null;
    const gift = data.giftCards ? giftCardCard(data.giftCards) : null;
    const reactivationOk = data.reactivation || !data.failed.includes("reactivation");
    return [
      ...registry,
      { key: "black-friday", name: BLACK_FRIDAY_NAME, status: data.blackFriday?.status ?? "Active", type: "Automatic", text: bf?.description ?? "", model: bf },
      { key: "gift-cards", name: GIFT_CARDS_NAME, status: data.giftCards?.status ?? "Active", type: "Automatic", text: gift?.description ?? "", model: gift },
      { key: "reactivation", name: DEFAULT_CAMPAIGN, status: reactivationStatus(data.reactivation), type: "Manual Enrollment", text: "", model: reactivationOk ? reactivationCard(data.reactivation) : null },
    ];
  }, [data]);

  const matches = (item: Item, ignoreStatus = false) =>
    (ignoreStatus || status === "All" || item.status === status) && (type === "All" || item.type === type)
    && `${item.name} ${item.text}`.toLowerCase().includes(query.trim().toLowerCase());
  const spotlight = showSpotlight(data.blackFriday) && data.blackFriday ? data.blackFriday : null;
  const visible = items.filter((item) => matches(item));
  const spotlightVisible = !!spotlight && visible.some((item) => item.key === "black-friday");
  const gridItems = visible.filter((item) => !(spotlight && item.key === "black-friday"));
  const counts = statusCounts(items.filter((item) => matches(item, true)).map((item) => item.status));
  // Statuses with campaigns, plus the selected one so it never vanishes mid-search.
  const statusPills = ["All", ...STATUS_ORDER.filter((s) => counts[s] || s === status)];

  const registry = data.campaigns ?? [];
  const running = items.filter((item) => item.status === "Active").length;
  const kpis = [
    { label: "Campaigns running", value: running, hint: `of ${TOTAL_CAMPAIGNS} campaigns`, icon: <Megaphone size={18} />, accent: "var(--brand-primary)" },
    { label: "People in campaigns", value: registry.reduce((t, s) => t + s.totalLeads, 0) + (data.reactivation?.metrics.total ?? 0) + (data.blackFriday?.metrics.contacts ?? 0) + (data.giftCards?.metrics.requests ?? 0), hint: "leads, patients and Black Friday contacts", icon: <Users size={18} />, accent: "#4ecdc4" },
    { label: "Messages sent", value: registry.reduce((t, s) => t + s.messagesSent, 0) + (data.reactivation?.metrics.email ?? 0) + (data.blackFriday?.metrics.messagesSent ?? 0) + (data.giftCards?.metrics.confirmations ?? 0), hint: "emails and texts, all campaigns", icon: <MessageSquare size={18} />, accent: "#b9786a" },
    { label: "In progress now", value: registry.reduce((t, s) => t + s.activeLeads, 0) + (data.reactivation?.metrics.active ?? 0) + (data.giftCards?.metrics.open ?? 0), hint: "mid-sequence or awaiting follow-up", icon: <Activity size={18} />, accent: "#6f9a82" },
  ];

  const next = data.blackFriday ? nextSend(data.blackFriday.steps, new Date(now)) : null;
  const latest = items.map((item) => item.model).filter((m): m is CampaignCardModel => !!m && !!m.lastActivity)
    .sort((a, b) => Date.parse(b.lastActivity) - Date.parse(a.lastActivity))[0];
  const bonus = now < Date.parse(GIFT_BONUS_STARTS_AT) ? "upcoming" : now < Date.parse(GIFT_BONUS_ENDS_AT) ? "live" : "ended";
  const live: LiveItem[] = [
    ...(next ? [{ key: "bf", icon: <CalendarClock size={19} />, accent: "#b9786a", title: `Black Friday · ${SEND_STEPS.find((s) => s.id === next.step.id)?.label}`, text: `Next send ${countdown(Date.parse(next.at), now)}, to ${next.step.remaining.toLocaleString("en-US")} people` }] : []),
    ...(data.blackFriday ? [{ key: "reach", icon: <Sparkles size={19} />, accent: "#c9a84c", title: `${data.blackFriday.metrics.reached.toLocaleString("en-US")} people reached`, text: `${data.blackFriday.metrics.messagesSent.toLocaleString("en-US")} Black Friday emails and texts so far` }] : []),
    ...(bonus !== "ended" ? [{ key: "gift", icon: <Gift size={19} />, accent: "#c8a46a", title: bonus === "live" ? "Gift card bonus is live" : "Gift card bonus starts Nov 27", text: bonus === "live" ? `10% back on $100+ · ends ${countdown(Date.parse(GIFT_BONUS_ENDS_AT), now)}` : `10% back on $100+ · ${countdown(Date.parse(GIFT_BONUS_STARTS_AT), now)}` }] : []),
    ...(latest ? [{ key: "latest", icon: <Zap size={19} />, accent: latest.accent, title: `Latest: ${latest.name}`, text: `Last activity ${relativeTime(latest.lastActivity, now)}` }] : []),
  ];
  const filtering = Boolean(query) || status !== "All" || type !== "All";

  return (
    <div className={c.page}>
      <section className={`${c.hero} ${c.rise}`} aria-labelledby="campaigns-title">
        <span className={`${c.orb} ${c.orbA}`} aria-hidden="true" /><span className={`${c.orb} ${c.orbB}`} aria-hidden="true" /><span className={`${c.orb} ${c.orbC}`} aria-hidden="true" />
        <span className={c.grain} aria-hidden="true" />
        <div className={c.heroGrid}>
          <div>
            <span className={c.eyebrow}>Growth automations</span>
            <h1 id="campaigns-title" className={`${c.heroTitle} font-serif`}>Campaign <em>command center</em></h1>
            <p className={c.heroText}>
              {running} of {TOTAL_CAMPAIGNS} campaigns running.{next ? ` Next Black Friday send (${SEND_STEPS.find((s) => s.id === next.step.id)?.label.toLowerCase()}) goes out ${countdown(Date.parse(next.at), now)}.` : ""} Every lead, patient and message in one place.
            </p>
            <div className={c.heroActions}>
              {spotlight ? <Link href={BLACK_FRIDAY_PATH} prefetch className={c.btnGold}><Sparkles size={15} /> Black Friday workspace <ArrowRight size={15} /></Link> : null}
              <button type="button" className={c.btn} onClick={() => void refresh()} disabled={refreshing}><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> {refreshing ? "Refreshing…" : "Refresh"}</button>
            </div>
          </div>
          <LiveNow items={live} />
        </div>
      </section>

      <section className={c.kpis} aria-label="Campaign totals">
        {kpis.map((kpi, i) => <Kpi key={kpi.label} {...kpi} index={i + 1} />)}
      </section>

      <div className={`${c.toolbar} ${c.rise}`} style={{ "--i": 4 } as CSSProperties}>
        <label className={c.search}>
          <Search size={16} />
          <input aria-label="Search campaigns" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search campaigns" />
        </label>
        <div className={c.pills} role="group" aria-label="Filter by status">
          {statusPills.map((s) => (
            <button key={s} type="button" aria-pressed={status === s} className={`${c.pill} ${status === s ? c.pillActive : ""}`} onClick={() => setStatus(s)}>
              {s} <span className={c.pillCount}>{counts[s] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className={c.pills} role="group" aria-label="Filter by type">
          {TYPES.map(([value, label]) => (
            <button key={value} type="button" aria-pressed={type === value} className={`${c.pill} ${type === value ? c.pillActive : ""}`} onClick={() => setType(value)}>{label}</button>
          ))}
        </div>
      </div>

      {spotlightVisible && spotlight ? <CampaignSpotlight data={spotlight} now={now} /> : null}

      {gridItems.length ? (
        <div className={c.grid}>
          {gridItems.map((item, i) => (
            <div key={item.key} className="min-w-0">
              {item.model
                ? <CampaignCard model={item.model} index={i + 5} now={now} />
                : <FailedCampaignCard name={item.name} index={i + 5} onRetry={() => void refresh()} retrying={refreshing} />}
            </div>
          ))}
        </div>
      ) : !spotlightVisible ? (
        <div className={c.empty}>
          <span className={c.emptyIcon}><SearchX size={24} /></span>
          <p className={`${c.emptyTitle} font-serif`}>No campaigns match</p>
          <p className={c.emptyText}>Try another search, or show every campaign.</p>
          {filtering ? <button type="button" className={c.btn} onClick={() => { setQuery(""); setStatus("All"); setType("All"); }}>Clear filters</button> : null}
        </div>
      ) : null}
    </div>
  );
}
