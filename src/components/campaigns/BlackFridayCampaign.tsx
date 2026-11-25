"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, ArrowUpRight, BellOff, ClipboardList, Copy, Crown, Eye, Inbox, Mail, MessageSquare, RefreshCw, Send, Sparkles, UserRound, Users,
} from "lucide-react";
import { CampaignMetricCard } from "@/components/campaigns/workspace/CampaignMetricCard";
import { CommunicationOverview } from "@/components/campaigns/workspace/CommunicationOverview";
import CampaignLeadModal from "@/components/campaigns/workspace/CampaignLeadModal";
import { useQuietRefresh } from "@/components/campaigns/workspace/useQuietRefresh";
import {
  Avatar, ClearFilters, EmptyState, FilterSelect, JourneyRail, RowMenu, SearchField, SplitBar, Tag, TablePagination,
  WorkspaceHero, WorkspaceTabs, workspace as s, type RailStep,
} from "@/components/campaigns/workspace/parts";
import BfContactModal from "@/components/campaigns/BfContactModal";
import BfInbox, { useBfThreads } from "@/components/campaigns/BfInbox";
import { UnsubscribeListDialog } from "@/components/campaigns/BfOptOut";
import { Toast } from "@/components/ui/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { DeliveryPill, StatusPill } from "@/components/leads/LeadUi";
import { formatCampaignDate } from "@/lib/campaigns/campaign-date";
import { countdown, paginate, relativeTime } from "@/lib/campaigns/paginate";
import { SEND_STEPS, isSendable, nextSend, type AudienceContact, type StepProgress } from "@/lib/black-friday/campaign";
import type { BlackFridayWorkspace } from "@/lib/black-friday/server";
import type { Lead } from "@/lib/leads/map-lead";

type TabKey = "overview" | "audience" | "leads" | "conversations";
const TABS: TabKey[] = ["overview", "audience", "leads", "conversations"];
const SHORT: Record<string, string> = { "Members Early Access": "Early access", "Public Sale Open": "Sale live", "Last Chance": "Last chance" };
const STATE_TONE: Record<StepProgress["state"], RailStep["state"]["tone"]> = { Sent: "success", Sending: "gold", "Partly sent": "warning", Scheduled: "muted", "Not sent": "danger" };
const copy = (value: string) => void navigator.clipboard?.writeText(value);

// Ticks every 30s so countdowns and "x ago" stay current; 0 during server render.
const subscribeClock = (cb: () => void) => { const t = window.setInterval(cb, 30_000); return () => window.clearInterval(t); };
const clock = () => Math.floor(Date.now() / 30_000) * 30_000;
function useNow() { return useSyncExternalStore(subscribeClock, clock, () => 0); }

export default function BlackFridayCampaign({ initial, initialError }: { initial: BlackFridayWorkspace | null; initialError: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const now = useNow();
  const tabParam = params.get("tab") as TabKey | null;
  const tab: TabKey = tabParam && TABS.includes(tabParam) ? tabParam : "overview";

  const [data, setData] = useState(initial);
  const [error, setError] = useState(initialError);
  const [refreshing, setRefreshing] = useState(false);
  const [contact, setContact] = useState<AudienceContact | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [toast, setToast] = useState<{ variant: "success" | "danger"; message: string } | null>(null);
  const [listDialog, setListDialog] = useState(false);
  const { can } = useAuth();
  const canEdit = can("update:leads");

  const setTab = (key: TabKey) => router.replace(`${pathname}?tab=${key}`, { scroll: false });

  async function refresh() {
    setRefreshing(true);
    try {
      const response = await fetch("/api/black-friday/campaign?refresh=1", { cache: "no-store" });
      const body = await response.json() as BlackFridayWorkspace & { error?: string };
      if (!response.ok || body.error) throw new Error(body.error);
      setData(body);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error && caught.message ? caught.message : "Couldn't refresh. Showing the last loaded data.");
    } finally {
      setRefreshing(false);
    }
  }

  const threads = useBfThreads(data);
  const takeFresh = useCallback((fresh: BlackFridayWorkspace) => { setData(fresh); setError(""); }, []);
  useQuietRefresh(data, "/api/black-friday/campaign", takeFresh);

  // An opt-out saved from the popup, the inbox or the row menu: update the list on screen at once.
  const contactSaved = useCallback((updated: AudienceContact, message: string) => {
    setData((current) => current ? { ...current, audience: current.audience.map((c) => (c.id === updated.id ? updated : c)) } : current);
    setContact((open) => (open && open.id === updated.id ? updated : open));
    setToast({ variant: "success", message });
  }, []);
  const listApplied = useCallback((ids: string[], applied: number) => {
    const hit = new Set(ids);
    setData((current) => current ? { ...current, audience: current.audience.map((c) => (hit.has(c.id) ? { ...c, unsubscribed: true, emailOk: false, smsOk: false } : c)) } : current);
    setListDialog(false);
    setToast({ variant: "success", message: applied ? `Unsubscribed ${applied} contact${applied === 1 ? "" : "s"}. They won't get the remaining sends.` : "Everyone on that list was already unsubscribed." });
  }, []);
  useEffect(() => { if (!toast) return; const id = window.setTimeout(() => setToast(null), 5000); return () => window.clearTimeout(id); }, [toast]);

  const updateLead = useCallback((updated: Lead) => {
    setLead(updated);
    setData((current) => current ? { ...current, websiteLeads: current.websiteLeads.map((l) => (l.id === updated.id ? updated : l)) } : current);
  }, []);

  if (!data) {
    return (
      <div className={s.panel}>
        <EmptyState icon={<Sparkles size={22} />} title="Black Friday data didn't load" text={error || "Airtable didn't answer in time. Try again in a moment."} />
        <div className="flex justify-center pb-10"><button type="button" className={s.btn} onClick={() => void refresh()}><RefreshCw size={15} /> Try again</button></div>
      </div>
    );
  }

  const m = data.metrics;
  const reachable = data.steps[0]?.eligible ?? 0;
  const next = nextSend(data.steps, now ? new Date(now) : new Date(data.generatedAt));
  const reachedPct = reachable ? Math.round((m.reached / reachable) * 100) : 0;

  return (
    <div className="space-y-5">
      <Link href="/campaigns" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)]"><ArrowLeft size={15} /> Back to Campaigns</Link>

      <WorkspaceHero
        icon={<Sparkles size={22} />}
        eyebrow="Seasonal · Campaign workspace"
        title="Black Friday 2026"
        status={data.status}
        description="Hayden's members and established patients get the Black Friday sends by email and text, and website Black Friday leads get an instant reply and follow-ups."
        pills={[<><Mail size={12} /> Email</>, <><MessageSquare size={12} /> SMS</>, "Nov 23–30", `Updated ${relativeTime(data.generatedAt, now || Date.parse(data.generatedAt)) || "just now"}`]}
        actions={<>
          <button type="button" className={s.btn} onClick={() => void refresh()} disabled={refreshing}><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh</button>
          <button type="button" className={s.btnPrimary} onClick={() => setTab("audience")}>View contacts <ArrowUpRight size={15} /></button>
        </>}
        meta={[
          next
            ? { label: "Next send", value: SHORT[next.step.id] ?? next.step.label, hint: <>{formatCampaignDate(next.at)}{now ? ` · ${countdown(Date.parse(next.at), now)}` : ""}</> }
            : { label: "Next send", value: "All sends done", hint: "Nov 23–30" },
          { label: "Reached", value: `${reachedPct}%`, hint: `${m.reached.toLocaleString()} of ${reachable.toLocaleString()} reachable` },
        ]}
      />
      {error ? <p className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "var(--warning-border)", background: "var(--warning-bg)", color: "var(--warning-text)" }}>{error}</p> : null}

      <WorkspaceTabs label="Black Friday sections" active={tab} onChange={setTab} tabs={[
        { key: "overview", label: "Overview" },
        { key: "audience", label: "Hayden's list", count: m.contacts },
        { key: "leads", label: "Website leads", count: data.websiteLeads.length },
        // Website lead threads + list contacts who were sent at least one message.
        { key: "conversations", label: "Conversations", count: threads.length },
      ]} />

      {tab === "overview" && <Overview data={data} now={now} onOpenLead={setLead} onTab={setTab} />}
      {tab === "audience" && <Audience data={data} onOpen={setContact} canEdit={canEdit} onMarkList={() => setListDialog(true)} />}
      {tab === "leads" && <WebsiteLeads leads={data.websiteLeads} messages={data.conversations} onOpen={setLead} />}
      {tab === "conversations" && <BfInbox data={data} threads={threads} now={now} canEdit={canEdit} onOptOut={contactSaved} onOpenLead={setLead} />}

      <BfContactModal contact={contact} onClose={() => setContact(null)} nowMs={now || Date.parse(data.generatedAt)} onOptOut={canEdit ? contactSaved : undefined} />
      <UnsubscribeListDialog open={listDialog} onClose={() => setListDialog(false)} onApplied={listApplied} />
      {toast ? <Toast variant={toast.variant} message={toast.message} onClose={() => setToast(null)} /> : null}
      <CampaignLeadModal lead={lead} onClose={() => setLead(null)} onUpdated={updateLead} />
    </div>
  );
}

/* ---------------- Overview ---------------- */

function Overview({ data, now, onOpenLead, onTab }: { data: BlackFridayWorkspace; now: number; onOpenLead: (lead: Lead) => void; onTab: (t: TabKey) => void }) {
  const m = data.metrics;
  const reachable = data.steps[0]?.eligible ?? 0;
  const metrics: [string, number, ReactNode][] = [
    ["Contacts", m.contacts, <Users key="i" size={16} />], ["Members", m.members, <Crown key="i" size={16} />], ["Patients", m.patients, <UserRound key="i" size={16} />],
    ["Reachable", reachable, <Mail key="i" size={16} />], ["Reached so far", m.reached, <Send key="i" size={16} />],
    ["Messages sent", m.messagesSent, <MessageSquare key="i" size={16} />], ["Website leads", m.websiteLeads, <Sparkles key="i" size={16} />],
  ];
  const currentIndex = data.steps.findIndex((step) => step.state === "Sending");
  const rail: RailStep[] = data.steps.map((step, i) => ({
    key: step.id,
    label: step.label,
    when: SEND_STEPS[i].sendDates.length > 1 ? `${SEND_STEPS[i].window} · daily 10:00 ET` : `${SEND_STEPS[i].window} · 10:00 ET`,
    figure: step.sent.toLocaleString(),
    total: `of ${step.eligible.toLocaleString()}`,
    progress: step.eligible ? (step.sent / step.eligible) * 100 : 0,
    state: { label: step.state, tone: STATE_TONE[step.state] },
    node: step.state === "Sent" ? "done" : step.state === "Sending" ? "live" : "todo",
    current: i === currentIndex,
    footLeft: step.remaining ? `${step.remaining.toLocaleString()} to go` : "Everyone reached",
    footRight: step.eligible ? `${Math.round((step.sent / step.eligible) * 100)}%` : "",
  }));
  const feed = [
    ...data.conversations.slice(0, 8).map((msg) => ({ id: msg.id, at: msg.sentAt ?? msg.createdTime, icon: msg.channel === "SMS" ? <MessageSquare size={15} /> : <Mail size={15} />, title: `${msg.sequenceStep ?? "Message"} · ${msg.channel}`, text: msg.recipientLeadName ?? "Lead", lead: data.websiteLeads.find((l) => l.id === msg.recipientLeadId) ?? null })),
    ...data.websiteLeads.slice(0, 8).map((l) => ({ id: `lead-${l.id}`, at: l.createdAt, icon: <UserRound size={15} />, title: `New website lead · ${l.source || "Website"}`, text: `${l.name}${l.treatment ? ` · ${l.treatment}` : ""}`, lead: l })),
  ].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 8);

  return (
    <div className="space-y-5">
      <section aria-label="Black Friday performance" className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {metrics.map(([label, value, icon]) => <CampaignMetricCard key={label} label={label} value={value.toLocaleString()} icon={icon} accent="var(--brand-primary)" />)}
      </section>

      <section className={`${s.panel} ${s.panelPad}`} aria-labelledby="bf-journey">
        <div className={s.panelHead}>
          <div>
            <h2 id="bf-journey" className={s.panelTitle}>Send journey</h2>
            <p className={s.panelText}>Three sends to Hayden&apos;s list. Members get member wording, patients get patient wording; each goes by email and, where allowed, by text.</p>
          </div>
          <button type="button" className={s.btn} onClick={() => onTab("audience")}><Users size={15} /> Who got what</button>
        </div>
        <JourneyRail steps={rail} />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <section className={`${s.panel} ${s.panelPad} space-y-5`} aria-labelledby="bf-mix">
          <div>
            <h2 id="bf-mix" className={s.panelTitle}>Audience mix</h2>
            <p className={s.panelText}>Who is on the list and how we can reach them.</p>
          </div>
          <SplitBar label="Segment" left={{ label: "Members", value: m.members }} right={{ label: "Patients", value: m.patients }} />
          {/* Email and text overlap (most contacts have both), so each is shown against the whole list. */}
          <div className="grid gap-3">
            <p className="text-xs font-bold text-[var(--text-secondary)]">Reach</p>
            {([["Can email", m.emailOk], ["Can text", m.smsOk]] as const).map(([label, value]) => (
              <div key={label} className="grid gap-1.5">
                <div className="flex justify-between text-xs text-[var(--text-muted)]"><span>{label}</span><span className="tabular-nums"><b className="text-[var(--text-primary)]">{value.toLocaleString()}</b> of {m.contacts.toLocaleString()}</span></div>
                <div className={s.track} role="img" aria-label={`${label}: ${value} of ${m.contacts}`}><div className={s.trackFill} style={{ width: `${m.contacts ? (value / m.contacts) * 100 : 0}%` }} /></div>
              </div>
            ))}
          </div>
          <p className="text-xs leading-5 text-[var(--text-muted)]">{(m.contacts - reachable).toLocaleString()} contacts have no usable email or phone and are skipped. Households sharing an inbox or number get one message.</p>
          <p className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]"><BellOff size={13} /> {data.audience.filter((c) => c.unsubscribed || /(Emails|Texts) stopped/.test(c.notes)).length.toLocaleString()} opted out ({m.unsubscribed.toLocaleString()} fully unsubscribed). They are skipped in the remaining sends.</p>
        </section>

        <section className={`${s.panel} ${s.panelPad}`} aria-labelledby="bf-activity">
          <div className={s.panelHead}>
            <div>
              <h2 id="bf-activity" className={s.panelTitle}>Recent activity</h2>
              <p className={s.panelText}>Website Black Friday leads and the replies they got.</p>
            </div>
            <button type="button" className={s.btn} onClick={() => onTab("conversations")}><Inbox size={15} /> Conversations</button>
          </div>
          {feed.length ? (
            <ul className={s.feed}>
              {feed.map((item) => (
                <li key={item.id}>
                  <button type="button" className={`${s.feedItem} w-full text-left`} onClick={() => item.lead && onOpenLead(item.lead)} disabled={!item.lead}>
                    <span className={s.feedIcon}>{item.icon}</span>
                    <span className="min-w-0"><span className={`${s.feedTitle} block`}>{item.title}</span><span className={`${s.feedText} block`}>{item.text}</span></span>
                    <span className={s.feedTime}>{relativeTime(item.at, now || Date.parse(data.generatedAt))}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : <EmptyState icon={<Inbox size={20} />} title="No activity yet" text="Website Black Friday leads and their replies will appear here." />}
        </section>
      </div>

      <section aria-labelledby="bf-delivery" className="space-y-3">
        <h2 id="bf-delivery" className={s.panelTitle}>Reply delivery</h2>
        <CommunicationOverview messages={data.conversations} />
      </section>
    </div>
  );
}

/* ---------------- Hayden's list ---------------- */

function Audience({ data, onOpen, canEdit, onMarkList }: { data: BlackFridayWorkspace; onOpen: (c: AudienceContact) => void; canEdit: boolean; onMarkList: () => void }) {
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState("all");
  const [channel, setChannel] = useState("all");
  const [send, setSend] = useState("all");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(30);
  const reset = () => setPage(1);
  const filtering = Boolean(query) || segment !== "all" || channel !== "all" || send !== "all";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.audience.filter((c) => {
      if (q && !`${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(q)) return false;
      if (segment !== "all" && c.segment !== segment) return false;
      if (channel === "email" && !(c.emailOk && c.email)) return false;
      if (channel === "sms" && !(c.smsOk && c.phone)) return false;
      if (channel === "textsOff" && c.smsOk) return false;
      if (channel === "unreachable" && isSendable(c)) return false;
      if (channel === "unsubscribed" && !c.unsubscribed) return false;
      if (channel === "optedOut" && !(c.unsubscribed || /(Emails|Texts) stopped/.test(c.notes))) return false;
      if (send.startsWith("got:") && !c.sentSteps.includes(send.slice(4))) return false;
      // Same rule as the send itself (and the progress rail): reachable, not unsubscribed, not a website lead.
      if (send.startsWith("due:") && (c.sentSteps.includes(send.slice(4)) || !isSendable(c))) return false;
      return true;
    });
  }, [data.audience, query, segment, channel, send]);
  const view = paginate(filtered, page, size);

  return (
    <section className={`${s.panel} overflow-hidden`} aria-label="Hayden's list">
      <div className={s.toolbar}>
        <div className={s.toolbarRow} style={{ "--filters": 3 } as CSSProperties}>
          <SearchField value={query} onChange={(v) => { setQuery(v); reset(); }} placeholder="Search name, email or phone" />
          <FilterSelect label="Segment" value={segment} onChange={(v) => { setSegment(v); reset(); }} options={[{ value: "all", label: "Members + patients" }, { value: "Member", label: "Members" }, { value: "Existing Patient", label: "Patients" }]} />
          <FilterSelect label="Channel" value={channel} onChange={(v) => { setChannel(v); reset(); }} options={[{ value: "all", label: "Any channel" }, { value: "email", label: "Can email" }, { value: "sms", label: "Can text" }, { value: "textsOff", label: "Texts off" }, { value: "unreachable", label: "Not reachable" }, { value: "unsubscribed", label: "Unsubscribed" }, { value: "optedOut", label: "Any opt-out" }]} />
          <FilterSelect label="Send" value={send} onChange={(v) => { setSend(v); reset(); }} options={[{ value: "all", label: "Any send" }, ...SEND_STEPS.map((st) => ({ value: `got:${st.id}`, label: `Got: ${SHORT[st.id]}` })), ...SEND_STEPS.map((st) => ({ value: `due:${st.id}`, label: `Not yet: ${SHORT[st.id]}` }))]} />
        </div>
        <div className={s.toolbarMeta}>
          <span>{filtered.length.toLocaleString()} of {data.audience.length.toLocaleString()} contacts</span>
          {filtering ? <ClearFilters onClear={() => { setQuery(""); setSegment("all"); setChannel("all"); setSend("all"); reset(); }} /> : null}
          {canEdit ? <button type="button" className={`${s.btn} ml-auto`} style={{ minHeight: 34 }} onClick={onMarkList}><ClipboardList size={14} /> Mark unsubscribes</button> : null}
        </div>
      </div>

      {view.total ? (
        <>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <colgroup><col style={{ width: "28%" }} /><col style={{ width: "30%" }} /><col style={{ width: "14%" }} /><col /><col style={{ width: 64 }} /></colgroup>
              <thead><tr><th>Contact</th><th>Reach</th><th>Sends</th><th>Notes</th><th><span className={s.srOnly}>Actions</span></th></tr></thead>
              <tbody>
                {view.rows.map((c) => (
                  <tr key={c.id} onClick={() => onOpen(c)} tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") onOpen(c); }} aria-label={`Open ${c.name}`}>
                    <td>
                      <div className={s.cellMain}>
                        <SegmentAvatar contact={c} />
                        <div className="min-w-0"><p className={s.cellName}>{c.name}</p><p className={s.cellSub}>{c.segment === "Member" ? "Member" : "Existing patient"}{c.unsubscribed ? " · Unsubscribed" : ""}</p></div>
                      </div>
                    </td>
                    <td><Reach contact={c} /></td>
                    <td><StepDots steps={c.sentSteps} /></td>
                    <td><p className={s.notes}>{c.notes || "—"}</p></td>
                    <td onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                      <RowMenu label={`Actions for ${c.name}`}>{(close) => <>
                        <button type="button" role="menuitem" onClick={() => { close(); onOpen(c); }}><Eye size={15} /> View details</button>
                        {c.email ? <button type="button" role="menuitem" onClick={() => { copy(c.email); close(); }}><Copy size={15} /> Copy email</button> : null}
                        {c.phone ? <button type="button" role="menuitem" onClick={() => { copy(c.phone); close(); }}><Copy size={15} /> Copy phone</button> : null}
                        {canEdit && !c.unsubscribed ? <button type="button" role="menuitem" onClick={() => { close(); onOpen(c); }}><BellOff size={15} /> Unsubscribe…</button> : null}
                      </>}</RowMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={s.cards}>
            {view.rows.map((c) => (
              <button key={c.id} type="button" className={s.card} onClick={() => onOpen(c)}>
                <div className="flex items-center justify-between gap-3">
                  <div className={s.cellMain}><SegmentAvatar contact={c} /><div className="min-w-0"><p className={s.cellName}>{c.name}</p><p className={s.cellSub}>{c.segment === "Member" ? "Member" : "Existing patient"}</p></div></div>
                  <StepDots steps={c.sentSteps} />
                </div>
                <Reach contact={c} />
              </button>
            ))}
          </div>
          <TablePagination {...view} pageSize={size} noun="contacts" onPage={setPage} onPageSize={(n) => { setSize(n); reset(); }} />
        </>
      ) : <EmptyState icon={<Users size={22} />} title="No contacts match" text="Try a different search or clear the filters." />}
    </section>
  );
}

function SegmentAvatar({ contact }: { contact: AudienceContact }) {
  return (
    <span className="relative flex-none">
      <Avatar name={contact.name} />
      {contact.segment === "Member" ? <span className="absolute -bottom-1 -right-1 grid size-4 place-items-center rounded-full bg-[var(--brand-primary)] text-[9px] font-black text-[var(--primary-foreground)] ring-2 ring-[var(--surface-1)]" title="Member">M</span> : null}
    </span>
  );
}

function Reach({ contact: c }: { contact: AudienceContact }) {
  return (
    <div className={s.reach}>
      <span className={c.emailOk && c.email ? "" : s.reachOff}><Mail size={13} aria-label={c.emailOk ? "Can email" : "Email off"} /><em>{c.email || "No email"}</em></span>
      <span className={c.smsOk && c.phone ? "" : s.reachOff}><MessageSquare size={13} aria-label={c.smsOk ? "Can text" : "Texts off"} /><em className={s.num}>{c.phone || "No phone"}</em></span>
    </div>
  );
}

function StepDots({ steps }: { steps: string[] }) {
  return (
    <span className={s.dots} role="img" aria-label={SEND_STEPS.map((st) => `${SHORT[st.id]}: ${steps.includes(st.id) ? "sent" : "not yet"}`).join(", ")}>
      {SEND_STEPS.map((st) => (
        <span key={st.id} title={`${SHORT[st.id]}: ${steps.includes(st.id) ? "sent" : "not yet"}`} className={`${s.dot} ${steps.includes(st.id) ? s.dotDone : s.dotDue}`} />
      ))}
    </span>
  );
}

/* ---------------- Website leads ---------------- */

function WebsiteLeads({ leads, messages, onOpen }: { leads: Lead[]; messages: BlackFridayWorkspace["conversations"]; onOpen: (l: Lead) => void }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? leads.filter((l) => `${l.name} ${l.email} ${l.phone} ${l.treatment} ${l.source}`.toLowerCase().includes(q)) : leads;
  }, [leads, query]);
  const view = paginate(filtered, page, size);
  const replies = (id: string) => messages.filter((msg) => msg.recipientLeadId === id);

  return (
    <section className={`${s.panel} overflow-hidden`} aria-label="Website Black Friday leads">
      <div className={s.toolbar}>
        <div className={s.toolbarRow} style={{ "--filters": 0 } as CSSProperties}>
          <SearchField value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search leads" />
        </div>
        <div className={s.toolbarMeta}><span>Leads from the Black Friday page or a Black Friday option on the ad pages (offer code BF2026).</span></div>
      </div>
      {view.total ? (
        <>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <colgroup><col style={{ width: "26%" }} /><col style={{ width: "20%" }} /><col style={{ width: "14%" }} /><col style={{ width: "19%" }} /><col /><col style={{ width: 64 }} /></colgroup>
              <thead><tr><th>Lead</th><th>Source · interest</th><th>Status</th><th>Black Friday reply</th><th>Submitted</th><th><span className={s.srOnly}>Actions</span></th></tr></thead>
              <tbody>
                {view.rows.map((l) => {
                  const sent = replies(l.id);
                  return (
                    <tr key={l.id} onClick={() => onOpen(l)} tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") onOpen(l); }} aria-label={`Open ${l.name}`}>
                      <td><div className={s.cellMain}><Avatar name={l.name} /><div className="min-w-0"><p className={s.cellName}>{l.name}</p><p className={s.cellSub}>{l.email || l.phone}</p></div></div></td>
                      <td><p className={s.cellName}>{l.source || "Website"}</p><p className={s.cellSub}>{l.treatment || "No treatment chosen"}</p></td>
                      <td><StatusPill status={l.status} /></td>
                      <td>
                        <div className="flex flex-wrap gap-1.5">
                          {sent.length ? sent.slice(0, 2).map((msg) => <DeliveryPill key={msg.id} label={msg.channel} value={msg.deliveryStatus} />) : <Tag>Not sent yet</Tag>}
                        </div>
                      </td>
                      <td className={s.num}>{formatCampaignDate(l.createdAt)}</td>
                      <td onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                        <RowMenu label={`Actions for ${l.name}`}>{(close) => <>
                          <button type="button" role="menuitem" onClick={() => { close(); onOpen(l); }}><Eye size={15} /> View lead</button>
                          <Link role="menuitem" href={`/leads?lead=${l.id}`} onClick={close}><ArrowUpRight size={15} /> Open in Leads</Link>
                          {l.email ? <button type="button" role="menuitem" onClick={() => { copy(l.email); close(); }}><Copy size={15} /> Copy email</button> : null}
                          {l.phone ? <button type="button" role="menuitem" onClick={() => { copy(l.phone); close(); }}><Copy size={15} /> Copy phone</button> : null}
                        </>}</RowMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className={s.cards}>
            {view.rows.map((l) => (
              <button key={l.id} type="button" className={s.card} onClick={() => onOpen(l)}>
                <div className="flex items-center justify-between gap-3"><div className={s.cellMain}><Avatar name={l.name} /><div className="min-w-0"><p className={s.cellName}>{l.name}</p><p className={s.cellSub}>{l.treatment || l.source}</p></div></div><StatusPill status={l.status} /></div>
                <p className="text-xs text-[var(--text-muted)]">{formatCampaignDate(l.createdAt)}</p>
              </button>
            ))}
          </div>
          <TablePagination {...view} pageSize={size} noun="leads" onPage={setPage} onPageSize={(n) => { setSize(n); setPage(1); }} />
        </>
      ) : <EmptyState icon={<Send size={22} />} title={query ? "No leads match" : "No Black Friday leads yet"} text={query ? "Try a different search." : "Leads from the Black Friday page and the Black Friday options on the ad landing pages appear here."} />}
    </section>
  );
}
