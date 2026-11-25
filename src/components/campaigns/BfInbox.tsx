"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, BellOff, CalendarClock, ChevronLeft, ChevronRight, CircleAlert, CircleCheck, ExternalLink, Inbox, Mail, MessageSquare, Phone, Send, Users,
} from "lucide-react";
import { CampaignMetricCard } from "@/components/campaigns/workspace/CampaignMetricCard";
import { MessageThread, splitSubject } from "@/components/campaigns/workspace/MessageThread";
import { Avatar, ClearFilters, EmptyState, FilterSelect, SearchField, Tag, workspace as s } from "@/components/campaigns/workspace/parts";
import t from "@/components/campaigns/workspace/thread.module.css";
import { OptOutControls } from "@/components/campaigns/BfOptOut";
import { paginate, relativeTime } from "@/lib/campaigns/paginate";
import { SEND_HOUR_UTC_OFFSET, SEND_STEPS, isSendable, type AudienceContact } from "@/lib/black-friday/campaign";
import { segmentMessages } from "@/lib/black-friday/copy";
import type { BlackFridayWorkspace } from "@/lib/black-friday/server";
import type { Lead } from "@/lib/leads/map-lead";
import type { MessageLog } from "@/types/message-log";

/** The SMS number the Black Friday texts come from (Make 7123840 module 6). */
const FROM_PHONE = "(863) 862-0501";
const PAGE_SIZE = 30;

export type Thread = {
  key: string;
  kind: "list" | "website";
  name: string;
  email: string;
  phone: string;
  contact?: AudienceContact;
  lead?: Lead;
  messages: MessageLog[];
  last: string;
  preview: string;
  emails: number;
  texts: number;
  failed: number;
  steps: Set<string>;
};

/** Readable step names: the list sends already carry them; website replies use Make's step codes. */
export function stepName(raw: string | null) {
  const value = (raw ?? "").trim();
  if (/instant/i.test(value)) return "Instant reply";
  const follow = value.match(/follow[- ]?up\s*(\d+)?/i);
  if (follow) return follow[1] ? `Follow-up ${follow[1]}` : "Follow-up";
  if (/last/i.test(value)) return "Last chance";
  return value || "Message";
}

const at = (m: MessageLog) => m.sentAt ?? m.createdTime;
const longDate = (iso: string) => new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));

function previewOf(m: MessageLog) {
  if (m.channel === "SMS") return m.messageBody.replace(/^Harmony Med Spa:\s*/, "");
  const { subject, body } = splitSubject(m.messageBody);
  return subject || body.replace(/\s+/g, " ").slice(0, 140);
}

function threadFrom(key: string, kind: Thread["kind"], messages: MessageLog[], who: { name: string; email: string; phone: string }, extra: Pick<Thread, "contact" | "lead">): Thread {
  // Newest first; when an email and a text went out together, the email (with its subject) leads.
  const latest = [...messages].sort((a, b) => Date.parse(at(b)) - Date.parse(at(a)) || (a.channel === "Email" ? -1 : 1))[0];
  return {
    key, kind, ...who, ...extra, messages,
    last: latest ? at(latest) : "",
    preview: latest ? previewOf(latest) : "",
    emails: messages.filter((m) => m.channel === "Email").length,
    texts: messages.filter((m) => m.channel === "SMS").length,
    failed: messages.filter((m) => m.deliveryStatus === "Failed").length,
    steps: new Set(messages.map((m) => stepName(m.sequenceStep))),
  };
}

/** Every Black Friday conversation, newest first. Pass null while data is loading. */
export function useBfThreads(data: BlackFridayWorkspace | null): Thread[] {
  const conversations = data?.conversations;
  const websiteLeads = data?.websiteLeads;
  const audience = data?.audience;
  return useMemo(() => {
    if (!conversations || !websiteLeads || !audience) return [];
    const leads = new Map(websiteLeads.map((l) => [l.id, l]));
    const byLead = new Map<string, MessageLog[]>();
    for (const m of conversations) {
      const key = m.recipientLeadId ?? `orphan:${m.id}`;
      byLead.set(key, [...(byLead.get(key) ?? []), m]);
    }
    const website = [...byLead].map(([key, messages]) => {
      const lead = leads.get(key);
      const first = messages[0];
      return threadFrom(key, "website", messages, {
        name: lead?.name || first.recipientLeadName || "Website lead",
        email: lead?.email || first.recipientLeadEmail || "",
        phone: lead?.phone || first.recipientLeadPhone || "",
      }, { lead });
    });
    const list = audience.flatMap((c) => {
      const messages = segmentMessages(c);
      return messages.length ? [threadFrom(c.id, "list", messages, { name: c.name, email: c.email, phone: c.phone }, { contact: c })] : [];
    });
    return [...website, ...list].sort((a, b) => Date.parse(b.last) - Date.parse(a.last) || a.name.localeCompare(b.name));
  }, [conversations, websiteLeads, audience]);
}

function optedOut(c?: AudienceContact) {
  return !!c && (c.unsubscribed || /(Emails|Texts) stopped/.test(c.notes));
}

function ChannelMark({ kind, sent, failed, off }: { kind: "email" | "sms"; sent: number; failed: number; off: boolean }) {
  const Icon = kind === "email" ? Mail : MessageSquare;
  const label = kind === "email" ? "Email" : "Text";
  if (failed) return <span className={`${t.chan} ${t.chanFail}`} title={`${label} failed`}><Icon size={12} /> {failed} failed</span>;
  if (!sent) return <span className={`${t.chan} ${t.chanOff}`} title={`No ${label.toLowerCase()}`}><Icon size={12} /></span>;
  return <span className={`${t.chan} ${off ? "" : t.chanOn}`} title={`${sent} ${label.toLowerCase()}${sent === 1 ? "" : "s"} sent${off ? ", now stopped" : ""}`}><Icon size={12} /> {sent}</span>;
}

function KindTag({ thread }: { thread: Thread }) {
  if (thread.kind === "website") return <Tag tone="info">Website lead</Tag>;
  return thread.contact?.segment === "Member" ? <Tag tone="gold">Member</Tag> : <Tag tone="muted">Patient</Tag>;
}

/** What happens next for this person, shown under the thread. */
function nextFor(thread: Thread, now: number): { icon: ReactNode; text: string } {
  if (thread.kind === "website") return { icon: <Send size={14} />, text: "Website lead: Black Friday follow-ups go out at 10:00 ET while they're open. Open the lead to update their status." };
  const c = thread.contact!;
  if (c.unsubscribed) return { icon: <BellOff size={14} />, text: "Unsubscribed. They won't get any more Black Friday emails or texts." };
  if (!isSendable(c)) return { icon: <BellOff size={14} />, text: "Emails and texts are off. They won't get the remaining sends." };
  const channels = [c.emailOk && c.email ? "email" : "", c.smsOk && c.phone ? "text" : ""].filter(Boolean).join(" + ");
  for (const step of SEND_STEPS) {
    if (c.sentSteps.includes(step.id)) continue;
    const slot = step.sendDates.map((d) => `${d}${SEND_HOUR_UTC_OFFSET}`).find((iso) => Date.parse(iso) > now);
    if (slot) return { icon: <CalendarClock size={14} />, text: `Next: ${step.label} · ${longDate(slot)} ET by ${channels}` };
  }
  return { icon: <CircleCheck size={14} />, text: "Every Black Friday send has reached them." };
}

export default function BfInbox({ data, threads, now, canEdit, onOptOut, onOpenLead }: {
  data: BlackFridayWorkspace;
  /** From useBfThreads(data), shared with the tab count. */
  threads: Thread[];
  now: number;
  canEdit: boolean;
  onOptOut: (updated: AudienceContact, message: string) => void;
  onOpenLead: (lead: Lead) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("all");
  const [step, setStep] = useState("all");
  const [channel, setChannel] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [picked, setPicked] = useState<string | null>(null);
  const leadParam = params.get("lead");
  useEffect(() => { if (!leadParam) setPicked(null); }, [leadParam]);
  const reset = () => setPage(1);
  const filtering = Boolean(query) || source !== "all" || step !== "all" || channel !== "all" || status !== "all";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return threads.filter((th) => {
      if (q && !`${th.name} ${th.email} ${th.phone}`.toLowerCase().includes(q)) return false;
      if (source !== "all" && th.kind !== source) return false;
      if (step !== "all" && !th.steps.has(step)) return false;
      if (channel === "email" && !th.emails) return false;
      if (channel === "sms" && !th.texts) return false;
      if (status === "failed" && !th.failed) return false;
      if (status === "delivered" && th.failed) return false;
      if (status === "optedOut" && !optedOut(th.contact)) return false;
      if (status === "upcoming" && !(th.contact && isSendable(th.contact) && th.contact.sentSteps.length < SEND_STEPS.length)) return false;
      return true;
    });
  }, [threads, query, source, step, channel, status]);
  const view = paginate(filtered, page, PAGE_SIZE);

  const explicitKey = picked ?? leadParam;
  const selected = (explicitKey ? threads.find((th) => th.key === explicitKey) : null) ?? view.rows[0] ?? null;
  const select = (key: string) => { setPicked(key); router.replace(`${pathname}?tab=conversations&lead=${key}`, { scroll: false }); };
  const close = () => { setPicked(null); router.replace(`${pathname}?tab=conversations`, { scroll: false }); };

  const totals = useMemo(() => ({
    people: threads.length,
    emails: threads.reduce((n, th) => n + th.emails, 0),
    texts: threads.reduce((n, th) => n + th.texts, 0),
    failed: threads.reduce((n, th) => n + th.failed, 0),
    optedOut: data.audience.filter((c) => optedOut(c)).length,
  }), [threads, data.audience]);
  const stepStats = useMemo(() => SEND_STEPS.map((st) => {
    const msgs = threads.flatMap((th) => th.kind === "list" ? th.messages.filter((m) => m.sequenceStep === st.label) : []);
    return { ...st, people: data.audience.filter((c) => c.sentSteps.includes(st.id)).length, emails: msgs.filter((m) => m.channel === "Email").length, texts: msgs.filter((m) => m.channel === "SMS").length };
  }), [threads, data.audience]);

  const stats: [string, number, ReactNode, string?][] = [
    ["People reached", totals.people, <Users key="i" size={16} />],
    ["Emails sent", totals.emails, <Mail key="i" size={16} />],
    ["Texts sent", totals.texts, <MessageSquare key="i" size={16} />],
    ["Opted out", totals.optedOut, <BellOff key="i" size={16} />, "Unsubscribed, or emails / texts stopped"],
    ["Failed", totals.failed, <CircleAlert key="i" size={16} />],
  ];

  const pane = selected ? <ThreadPane thread={selected} now={now || Date.parse(data.generatedAt)} canEdit={canEdit} onOptOut={onOptOut} onOpenLead={onOpenLead} /> : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map(([label, value, icon, hint]) => <CampaignMetricCard key={label} label={label} value={value.toLocaleString()} icon={icon} hint={hint} accent="var(--brand-primary)" />)}
      </div>
      <div className={t.stepStrip}>
        {stepStats.map((st) => (
          <div key={st.id} className={t.stepCard}>
            <div className={t.stepCardTop}><span>{st.label}</span><Tag tone={st.people ? "success" : "muted"}>{st.window}</Tag></div>
            <div className={t.stepCardFigures}>
              <span><b>{st.people.toLocaleString()}</b> people</span>
              <span><Mail size={11} className="inline" /> {st.emails.toLocaleString()}</span>
              <span><MessageSquare size={11} className="inline" /> {st.texts.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      <section className={`${s.panel} overflow-hidden`} aria-label="Conversation filters">
        <div className={s.toolbar}>
          <div className={s.toolbarRow} style={{ "--filters": 4 } as CSSProperties}>
            <SearchField value={query} onChange={(v) => { setQuery(v); reset(); }} placeholder="Search name, email or phone" />
            <FilterSelect label="Source" value={source} onChange={(v) => { setSource(v); reset(); }} options={[{ value: "all", label: "Everyone" }, { value: "list", label: "Hayden's list" }, { value: "website", label: "Website leads" }]} />
            <FilterSelect label="Send" value={step} onChange={(v) => { setStep(v); reset(); }} options={[{ value: "all", label: "Any send" }, ...SEND_STEPS.map((st) => ({ value: st.label, label: st.label })), { value: "Instant reply", label: "Website instant reply" }, { value: "Follow-up", label: "Website follow-up" }]} />
            <FilterSelect label="Channel" value={channel} onChange={(v) => { setChannel(v); reset(); }} options={[{ value: "all", label: "Email + text" }, { value: "email", label: "Got an email" }, { value: "sms", label: "Got a text" }]} />
            <FilterSelect label="Status" value={status} onChange={(v) => { setStatus(v); reset(); }} options={[{ value: "all", label: "Any status" }, { value: "delivered", label: "All delivered" }, { value: "failed", label: "Has a failure" }, { value: "optedOut", label: "Opted out" }, { value: "upcoming", label: "More sends coming" }]} />
          </div>
          <div className={s.toolbarMeta}>
            <span>{filtered.length.toLocaleString()} of {threads.length.toLocaleString()} conversations</span>
            {filtering ? <ClearFilters onClear={() => { setQuery(""); setSource("all"); setStep("all"); setChannel("all"); setStatus("all"); reset(); }} /> : null}
          </div>
        </div>
      </section>

      {view.total ? (
        <div className={t.inbox}>
          <div className={t.list}>
            <div className={t.listScroll}>
              <ul className={t.listItems} aria-label="Conversations">
                {view.rows.map((th) => {
                  const off = optedOut(th.contact);
                  return (
                    <li key={th.key}>
                      <button type="button" className={`${t.row} ${selected?.key === th.key ? t.rowActive : ""}`} aria-current={selected?.key === th.key ? "true" : undefined} onClick={() => select(th.key)}>
                        <Avatar name={th.name} />
                        <span className="min-w-0">
                          <span className={t.rowTop}><span className={t.rowName}>{th.name}</span><span className={t.rowTime}>{relativeTime(th.last, now || Date.parse(data.generatedAt))}</span></span>
                          <span className={t.rowMeta}>
                            <KindTag thread={th} />
                            {th.contact?.unsubscribed ? <Tag tone="danger">Unsubscribed</Tag> : off ? <Tag tone="warning">Partly opted out</Tag> : null}
                            <ChannelMark kind="email" sent={th.emails} failed={th.messages.filter((m) => m.channel === "Email" && m.deliveryStatus === "Failed").length} off={!!th.contact && !th.contact.emailOk} />
                            <ChannelMark kind="sms" sent={th.texts} failed={th.messages.filter((m) => m.channel === "SMS" && m.deliveryStatus === "Failed").length} off={!!th.contact && !th.contact.smsOk} />
                          </span>
                          <span className={`${t.rowPreview} block`}>{th.preview}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className={t.listPager} aria-live="polite">
              <span>{view.from.toLocaleString()}–{view.to.toLocaleString()} of {view.total.toLocaleString()}</span>
              <span>Page {view.page} of {view.pages}</span>
              <span className={t.pagerButtons}>
                <button type="button" aria-label="Previous page" disabled={view.page <= 1} onClick={() => setPage(view.page - 1)}><ChevronLeft size={16} /></button>
                <button type="button" aria-label="Next page" disabled={view.page >= view.pages} onClick={() => setPage(view.page + 1)}><ChevronRight size={16} /></button>
              </span>
            </div>
          </div>
          <div className={t.pane}>{pane}</div>
        </div>
      ) : (
        <section className={s.panel}>
          <EmptyState icon={<Inbox size={22} />} title={threads.length ? "No conversations match" : "No conversations yet"} text={threads.length ? "Try a different search or clear the filters." : "Messages appear here as the Black Friday sends go out."} />
        </section>
      )}

      {explicitKey && pane ? (
        <div className={t.sheet} role="dialog" aria-modal="true" aria-label={`Conversation with ${selected?.name}`}>
          <div className={t.sheetBar}>
            <button type="button" className={s.btn} onClick={close}><ArrowLeft size={15} /> Conversations</button>
          </div>
          <div className={t.pane}>{pane}</div>
        </div>
      ) : null}
    </div>
  );
}

function ThreadPane({ thread, now, canEdit, onOptOut, onOpenLead }: {
  thread: Thread;
  now: number;
  canEdit: boolean;
  onOptOut: (updated: AudienceContact, message: string) => void;
  onOpenLead: (lead: Lead) => void;
}) {
  const c = thread.contact;
  const next = nextFor(thread, now);
  return (
    <>
      <header className={t.paneHead}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={thread.name} />
            <div className="min-w-0">
              <h3 className={`${t.paneTitle} truncate`}>{thread.name}</h3>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <KindTag thread={thread} />
                {c?.unsubscribed ? <Tag tone="danger">Unsubscribed</Tag> : null}
                {c && !c.unsubscribed && !c.emailOk && c.email ? <Tag tone="warning">Emails off</Tag> : null}
                {c && !c.unsubscribed && !c.smsOk && c.phone ? <Tag tone="warning">Texts off</Tag> : null}
                {thread.lead?.status ? <Tag tone="muted">{thread.lead.status}</Tag> : null}
              </div>
            </div>
          </div>
          {thread.lead ? <button type="button" className={s.btn} onClick={() => onOpenLead(thread.lead!)}><ExternalLink size={15} /> Open lead</button> : null}
        </div>
        <div className={t.paneContacts}>
          {thread.email ? <span><Mail size={13} /> {thread.email}</span> : null}
          {thread.phone ? <span><Phone size={13} /> {thread.phone}</span> : null}
          <span><Send size={13} /> {thread.emails} email{thread.emails === 1 ? "" : "s"} · {thread.texts} text{thread.texts === 1 ? "" : "s"}</span>
        </div>
        {c && canEdit && !c.unsubscribed ? <OptOutControls contact={c} onSaved={onOptOut} compact /> : null}
      </header>
      <div className={t.paneScroll}>
        <MessageThread
          messages={thread.messages}
          stepLabel={(m) => stepName(m.sequenceStep)}
          fromName="Harmony Med Spa"
          fromPhone={FROM_PHONE}
          defaultSubject="Harmony Med Spa Black Friday"
        />
      </div>
      <footer className={t.paneFoot}><span className={t.paneFootIcon}>{next.icon}</span><span>{next.text}</span></footer>
    </>
  );
}
