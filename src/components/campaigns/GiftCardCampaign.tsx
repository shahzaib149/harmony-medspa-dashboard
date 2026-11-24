"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Clock3, Copy, DollarSign, Eye, Gift, Inbox, Mail, RefreshCw, Sparkles } from "lucide-react";
import CampaignConversationTable, { groupConversations, type Conversation } from "@/components/campaigns/CampaignConversationTable";
import { CampaignMetricCard } from "@/components/campaigns/workspace/CampaignMetricCard";
import { CommunicationOverview } from "@/components/campaigns/workspace/CommunicationOverview";
import ConversationDrawer from "@/components/campaigns/workspace/ConversationDrawer";
import CampaignLeadModal from "@/components/campaigns/workspace/CampaignLeadModal";
import {
  Avatar, ClearFilters, EmptyState, FilterSelect, JourneyRail, RowMenu, SearchField, TablePagination,
  WorkspaceHero, WorkspaceTabs, workspace as s, type RailStep,
} from "@/components/campaigns/workspace/parts";
import { GiftCardStatusPill, formatGiftAmount } from "@/components/leads/GiftCardParts";
import { useAuth } from "@/contexts/AuthContext";
import { formatCampaignDate } from "@/lib/campaigns/campaign-date";
import { countdown, paginate, relativeTime } from "@/lib/campaigns/paginate";
import { GIFT_BONUS_ENDS_AT, GIFT_BONUS_STARTS_AT, buildGiftCardCampaign } from "@/lib/gift-cards/campaign";
import { GIFT_CARD_STATUSES } from "@/lib/leads/classification";
import type { GiftCardWorkspace } from "@/lib/black-friday/server";
import type { Lead } from "@/lib/leads/map-lead";

type TabKey = "overview" | "requests" | "conversations";
const TABS: TabKey[] = ["overview", "requests", "conversations"];
const PIPELINE = ["Requested", "Contacted", "Paid", "Issued", "Completed"] as const;
const copy = (value: string) => void navigator.clipboard?.writeText(value);
const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const statusOf = (lead: Lead) => lead.giftCardStatus?.trim() || "Requested";

const subscribeClock = (cb: () => void) => { const t = window.setInterval(cb, 30_000); return () => window.clearInterval(t); };
const clock = () => Math.floor(Date.now() / 30_000) * 30_000;
function useNow() { return useSyncExternalStore(subscribeClock, clock, () => 0); }

export default function GiftCardCampaign({ initial, initialError }: { initial: GiftCardWorkspace | null; initialError: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const now = useNow();
  const tabParam = params.get("tab") as TabKey | null;
  const tab: TabKey = tabParam && TABS.includes(tabParam) ? tabParam : "overview";
  const [data, setData] = useState(initial);
  const [error, setError] = useState(initialError);
  const [refreshing, setRefreshing] = useState(false);
  const [lead, setLead] = useState<Lead | null>(null);
  const setTab = (key: TabKey) => router.replace(`${pathname}?tab=${key}`, { scroll: false });

  async function refresh() {
    setRefreshing(true);
    try {
      const response = await fetch("/api/gift-cards/campaign?refresh=1", { cache: "no-store" });
      const body = await response.json() as GiftCardWorkspace & { error?: string };
      if (!response.ok || body.error) throw new Error(body.error);
      setData(body);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error && caught.message ? caught.message : "Couldn't refresh. Showing the last loaded data.");
    } finally {
      setRefreshing(false);
    }
  }

  // A status change updates the row and the counts at once (confirmations come from Message Log).
  const applyUpdate = useCallback((updated: Lead) => {
    setLead((current) => (current && current.id === updated.id ? updated : current));
    setData((current) => {
      if (!current) return current;
      const leads = current.leads.map((l) => (l.id === updated.id ? updated : l));
      const rebuilt = buildGiftCardCampaign(leads, []);
      return { ...current, ...rebuilt, metrics: { ...rebuilt.metrics, confirmations: current.metrics.confirmations }, lastActivity: current.lastActivity, generatedAt: current.generatedAt, conversations: current.conversations };
    });
  }, []);

  if (!data) {
    return (
      <div className={s.panel}>
        <EmptyState icon={<Gift size={22} />} title="Gift card data didn't load" text={error || "Airtable didn't answer in time. Try again in a moment."} />
        <div className="flex justify-center pb-10"><button type="button" className={s.btn} onClick={() => void refresh()}><RefreshCw size={15} /> Try again</button></div>
      </div>
    );
  }

  const m = data.metrics;
  const nowMs = now || Date.parse(data.generatedAt);
  const bonusHint = data.bonus === "Upcoming" ? `Starts Nov 27 · ${countdown(Date.parse(GIFT_BONUS_STARTS_AT), nowMs)}`
    : data.bonus === "Live" ? `Ends Nov 30 · ${countdown(Date.parse(GIFT_BONUS_ENDS_AT), nowMs)}` : "Ended Nov 30";

  return (
    <div className="space-y-5">
      <Link href="/campaigns" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)]"><ArrowLeft size={15} /> Back to Campaigns</Link>
      <WorkspaceHero
        icon={<Gift size={22} />}
        eyebrow="Seasonal · Campaign workspace"
        title="Gift Card Requests"
        status={data.status}
        description="Requests from the website gift card form. Staff call or text the purchaser to take payment; the recipient is never contacted. $100+ cards bought Nov 27–30 get 10% back."
        pills={[<><Mail size={12} /> Email confirmation</>, "Bonus Nov 27–30", `Updated ${relativeTime(data.generatedAt, nowMs) || "just now"}`]}
        actions={<>
          <button type="button" className={s.btn} onClick={() => void refresh()} disabled={refreshing}><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh</button>
          <button type="button" className={s.btnPrimary} onClick={() => setTab("requests")}>View requests <ArrowUpRight size={15} /></button>
        </>}
        meta={[
          { label: "Black Friday bonus", value: data.bonus === "Live" ? "Live now" : data.bonus, hint: bonusHint },
          { label: "Open requests", value: m.open.toLocaleString(), hint: m.requests ? `${m.requests.toLocaleString()} total · ${usd(m.amountRequested)}` : "None yet" },
        ]}
      />
      {error ? <p className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "var(--warning-border)", background: "var(--warning-bg)", color: "var(--warning-text)" }}>{error}</p> : null}

      <WorkspaceTabs label="Gift card sections" active={tab} onChange={setTab} tabs={[
        { key: "overview", label: "Overview" },
        { key: "requests", label: "Requests", count: m.requests },
        { key: "conversations", label: "Conversations", count: data.conversations.length },
      ]} />

      {tab === "overview" && <Overview data={data} nowMs={nowMs} onOpen={setLead} onTab={setTab} />}
      {tab === "requests" && <Requests leads={data.leads} onOpen={setLead} onUpdated={applyUpdate} />}
      {tab === "conversations" && <Conversations data={data} />}

      <CampaignLeadModal lead={lead} onClose={() => setLead(null)} onUpdated={applyUpdate} />
    </div>
  );
}

function Overview({ data, nowMs, onOpen, onTab }: { data: GiftCardWorkspace; nowMs: number; onOpen: (l: Lead) => void; onTab: (t: TabKey) => void }) {
  const m = data.metrics;
  const metrics: [string, string, ReactNode][] = [
    ["Requests", m.requests.toLocaleString(), <Gift key="i" size={16} />], ["Open", m.open.toLocaleString(), <Clock3 key="i" size={16} />],
    ["Amount requested", usd(m.amountRequested), <DollarSign key="i" size={16} />], ["Bonus promised", usd(m.bonusPromised), <Sparkles key="i" size={16} />],
    ["Paid or issued", (m.paid + m.issued).toLocaleString(), <CheckCircle2 key="i" size={16} />], ["Confirmations sent", m.confirmations.toLocaleString(), <Mail key="i" size={16} />],
  ];
  const counts = Object.fromEntries(data.byStatus.map((x) => [x.status, x.count]));
  const reached = (i: number) => PIPELINE.slice(i).reduce((sum, st) => sum + (counts[st] ?? 0), 0);
  const total = Math.max(1, m.requests - (counts.Cancelled ?? 0));
  const rail: RailStep[] = PIPELINE.map((status, i) => ({
    key: status, label: status, when: i === 0 ? "Form submitted" : i === 1 ? "Staff called or texted" : i === 2 ? "Payment taken" : i === 3 ? "Card sent to recipient" : "Done",
    figure: (counts[status] ?? 0).toLocaleString(), total: "here now",
    progress: m.requests ? (reached(i) / total) * 100 : 0,
    state: { label: `${reached(i)} reached`, tone: (counts[status] ?? 0) ? "gold" : "muted" },
    // Filled once every request has moved past it; ringed while requests sit here.
    node: (counts[status] ?? 0) ? "live" : reached(i) ? "done" : "todo",
    footLeft: m.requests ? `${Math.round((reached(i) / total) * 100)}% of active requests got this far` : "No requests yet",
  }));
  const recent = data.leads.slice(0, 6);

  return (
    <div className="space-y-5">
      <section aria-label="Gift card performance" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {metrics.map(([label, value, icon]) => <CampaignMetricCard key={label} label={label} value={value} icon={icon} accent="var(--brand-primary)" />)}
      </section>
      <section className={`${s.panel} ${s.panelPad}`} aria-labelledby="gc-pipeline">
        <div className={s.panelHead}>
          <div>
            <h2 id="gc-pipeline" className={s.panelTitle}>Request pipeline</h2>
            <p className={s.panelText}>Where each request is now. Cancelled: {(counts.Cancelled ?? 0).toLocaleString()}.</p>
          </div>
          <button type="button" className={s.btn} onClick={() => onTab("requests")}><Gift size={15} /> Work the requests</button>
        </div>
        <JourneyRail steps={rail} />
      </section>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section className={`${s.panel} ${s.panelPad}`} aria-labelledby="gc-recent">
          <h2 id="gc-recent" className={s.panelTitle}>Latest requests</h2>
          {recent.length ? (
            <ul className={s.feed}>
              {recent.map((l) => (
                <li key={l.id}>
                  <button type="button" className={`${s.feedItem} w-full text-left`} onClick={() => onOpen(l)}>
                    <span className={s.feedIcon}><Gift size={15} /></span>
                    <span className="min-w-0"><span className={`${s.feedTitle} block`}>{l.name} · {formatGiftAmount(l.giftCardAmount)}</span><span className={`${s.feedText} block`}>{statusOf(l)}{l.preferredContactMethod ? ` · prefers ${l.preferredContactMethod === "SMS" ? "text" : "a call"}` : ""}</span></span>
                    <span className={s.feedTime}>{relativeTime(l.createdAt, nowMs)}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : <EmptyState icon={<Gift size={20} />} title="No requests yet" text="Requests from the website gift card form appear here the moment they're submitted." />}
        </section>
        <section aria-labelledby="gc-delivery" className="space-y-3">
          <h2 id="gc-delivery" className={s.panelTitle}>Confirmation delivery</h2>
          <CommunicationOverview messages={data.conversations} />
        </section>
      </div>
    </div>
  );
}

function Requests({ leads, onOpen, onUpdated }: { leads: Lead[]; onOpen: (l: Lead) => void; onUpdated: (l: Lead) => void }) {
  const { can } = useAuth();
  const canUpdate = can("update:leads");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [saving, setSaving] = useState<string | null>(null);
  const [rowError, setRowError] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((l) => (status === "all" || (status === "open" ? !["Completed", "Cancelled"].includes(statusOf(l)) : statusOf(l) === status))
      && (!q || `${l.name} ${l.email} ${l.phone}`.toLowerCase().includes(q)));
  }, [leads, query, status]);
  const view = paginate(filtered, page, size);

  async function changeStatus(lead: Lead, next: string) {
    setSaving(lead.id);
    setRowError("");
    onUpdated({ ...lead, giftCardStatus: next });
    try {
      const response = await fetch("/api/airtable/leads", {
        method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead.id, giftCardStatus: next }),
      });
      const body = await response.json().catch(() => ({})) as { error?: string; lead?: Lead };
      if (!response.ok || body.error) throw new Error(body.error || "Couldn't update the gift card status.");
      onUpdated(body.lead ?? { ...lead, giftCardStatus: next });
    } catch (caught) {
      onUpdated(lead);
      setRowError(caught instanceof Error ? caught.message : "Couldn't update the gift card status.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <section className={`${s.panel} overflow-hidden`} aria-label="Gift card requests">
      <div className={s.toolbar}>
        <div className={s.toolbarRow} style={{ "--filters": 1 } as CSSProperties}>
          <SearchField value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search purchaser" />
          <FilterSelect label="Gift card status" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[{ value: "all", label: "Any status" }, { value: "open", label: "Open" }, ...GIFT_CARD_STATUSES.map((st) => ({ value: st, label: st }))]} />
        </div>
        <div className={s.toolbarMeta}>
          <span>{filtered.length.toLocaleString()} of {leads.length.toLocaleString()} requests · the recipient is never contacted</span>
          {query || status !== "all" ? <ClearFilters onClear={() => { setQuery(""); setStatus("all"); setPage(1); }} /> : null}
        </div>
        {rowError ? <p className="text-sm text-[var(--danger-text)]" role="alert">{rowError}</p> : null}
      </div>
      {view.total ? (
        <>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <colgroup><col style={{ width: "28%" }} /><col style={{ width: "11%" }} /><col style={{ width: "10%" }} /><col style={{ width: "13%" }} /><col style={{ width: "17%" }} /><col /><col style={{ width: 64 }} /></colgroup>
              <thead><tr><th>Purchaser</th><th>Amount</th><th>Bonus</th><th>Prefers</th><th>Gift card status</th><th>Submitted</th><th><span className={s.srOnly}>Actions</span></th></tr></thead>
              <tbody>
                {view.rows.map((l) => (
                  <tr key={l.id} onClick={() => onOpen(l)} tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") onOpen(l); }} aria-label={`Open ${l.name}`}>
                    <td><div className={s.cellMain}><Avatar name={l.name} /><div className="min-w-0"><p className={s.cellName}>{l.name}</p><p className={s.cellSub}>{l.email || l.phone}</p></div></div></td>
                    <td className={`${s.num} font-bold`}>{formatGiftAmount(l.giftCardAmount)}</td>
                    <td className={s.num}>{formatGiftAmount(l.giftCardBonus)}</td>
                    <td>{l.preferredContactMethod === "SMS" ? "Text" : l.preferredContactMethod || "—"}</td>
                    <td onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                      {canUpdate ? (
                        <select aria-label={`Gift card status for ${l.name}`} className={s.pagerSelect} value={statusOf(l)} disabled={saving === l.id} onChange={(e) => void changeStatus(l, e.target.value)}>
                          {GIFT_CARD_STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                        </select>
                      ) : <GiftCardStatusPill status={statusOf(l)} />}
                    </td>
                    <td className={s.num}>{formatCampaignDate(l.createdAt)}</td>
                    <td onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                      <RowMenu label={`Actions for ${l.name}`}>{(close) => <>
                        <button type="button" role="menuitem" onClick={() => { close(); onOpen(l); }}><Eye size={15} /> View request</button>
                        <Link role="menuitem" href={`/leads?lead=${l.id}`} onClick={close}><ArrowUpRight size={15} /> Open in Leads</Link>
                        {l.phone ? <button type="button" role="menuitem" onClick={() => { copy(l.phone); close(); }}><Copy size={15} /> Copy phone</button> : null}
                        {l.email ? <button type="button" role="menuitem" onClick={() => { copy(l.email); close(); }}><Copy size={15} /> Copy email</button> : null}
                      </>}</RowMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={s.cards}>
            {view.rows.map((l) => (
              <button key={l.id} type="button" className={s.card} onClick={() => onOpen(l)}>
                <div className="flex items-center justify-between gap-3"><div className={s.cellMain}><Avatar name={l.name} /><div className="min-w-0"><p className={s.cellName}>{l.name}</p><p className={s.cellSub}>{formatGiftAmount(l.giftCardAmount)} · {formatCampaignDate(l.createdAt)}</p></div></div><GiftCardStatusPill status={statusOf(l)} /></div>
              </button>
            ))}
          </div>
          <TablePagination {...view} pageSize={size} noun="requests" onPage={setPage} onPageSize={(n) => { setSize(n); setPage(1); }} />
        </>
      ) : <EmptyState icon={<Gift size={22} />} title={leads.length ? "No requests match" : "No gift card requests yet"} text={leads.length ? "Try a different search or clear the filters." : "Requests from the website gift card form appear here as soon as they're submitted. The Black Friday bonus starts Nov 27."} />}
    </section>
  );
}

function Conversations({ data }: { data: GiftCardWorkspace }) {
  const conversations = useMemo(() => groupConversations(data.conversations, data.leads), [data.conversations, data.leads]);
  const [open, setOpen] = useState<Conversation | null>(null);
  const failed = data.conversations.filter((msg) => msg.deliveryStatus === "Failed").length;
  const stats: [string, number][] = [["Purchasers", conversations.length], ["Confirmations", data.conversations.length], ["Delivered", data.conversations.length - failed], ["Failed", failed]];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{stats.map(([label, value]) => <CampaignMetricCard key={label} label={label} value={value.toLocaleString()} accent="var(--brand-primary)" />)}</div>
      {conversations.length ? <CampaignConversationTable conversations={conversations} onOpen={setOpen} />
        : <div className={s.panel}><EmptyState icon={<Inbox size={22} />} title="No confirmations yet" text="Each purchaser's gift card confirmation email appears here." /></div>}
      {open ? <ConversationDrawer conversation={open} onClose={() => setOpen(null)} /> : null}
    </div>
  );
}
