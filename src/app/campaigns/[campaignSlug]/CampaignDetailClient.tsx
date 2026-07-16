"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  ChevronDown,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { CampaignStatusBadge } from "@/components/campaigns/CampaignBadges";
import PatientJourneyRail from "@/components/campaigns/PatientJourneyRail";
import CampaignConversationTable, {
  groupConversations,
  type Conversation,
} from "@/components/campaigns/CampaignConversationTable";
import { DestructiveConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Alert } from "@/components/ui/Alert";
import { Toast } from "@/components/ui/Toast";
import CompactJourneyProgress from "@/components/campaigns/CompactJourneyProgress";
import DisconnectedEnrollmentCleanupModal, {
  type CleanupAction,
} from "@/components/campaigns/DisconnectedEnrollmentCleanupModal";
import {
  formatCampaignDate,
  isCampaignDateToday,
} from "@/lib/campaigns/campaign-date";
import {
  campaignDeliveryFor,
  displayedNextTouch,
  sentStepsForLead,
} from "@/lib/campaigns/campaign-display";
import type { CampaignSummary, NurtureEnrollment } from "@/lib/types/campaigns";
import type { MessageLog } from "@/types/message-log";

const AddLeadsToCampaignModal = dynamic(() => import("@/components/campaigns/AddLeadsToCampaignModal"));

type SpeedLead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  createdAt: string;
  lastContactedAt: string | null;
  emailSentStatus: string;
  smsSentStatus: string;
  replied: boolean;
};
type Data = {
  campaign: CampaignSummary;
  leads: Array<NurtureEnrollment | SpeedLead>;
  messages: MessageLog[];
};
const MUTED = "var(--text-muted)",
  PANEL = "var(--surface-1)",
  GOLD = "var(--brand-primary)";
const REFERENCE_NOW = Date.now();

export default function CampaignDetailClient({ slug }: { slug: string }) {
  const { role } = useAuth();
  const router = useRouter(),
    searchParams = useSearchParams(),
    rawTab = searchParams.get("tab");
  const tab =
    rawTab === "leads"
      ? "leads"
      : rawTab === "conversations" ||
          rawTab === "message-history" ||
          rawTab === "messages"
        ? "conversations"
        : "overview";
  const [data, setData] = useState<Data | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [addOpen, setAddOpen] = useState(false),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState("All"),
    [step, setStep] = useState("All"),
    [stopTarget, setStopTarget] = useState<NurtureEnrollment | null>(null),
    [stopping, setStopping] = useState(false),
    [conversation, setConversation] = useState<Conversation | null>(null),
    [cleanup, setCleanup] = useState<{
      open: boolean;
      enrollmentId: string | null;
      action: CleanupAction;
    }>({ open: false, enrollmentId: null, action: "review" }),
    [cleanupToast, setCleanupToast] = useState("");
  const load = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
      setError("");
    }
    try {
      const response = await fetch(`/api/airtable/campaigns/${slug}`, {
        cache: "no-store",
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setData(body);
      return true;
    } catch (event) {
      if (showLoading) setError(event instanceof Error ? event.message : "Could not load campaign");
      return false;
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [slug]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (rawTab === "message-history" || rawTab === "messages")
      router.replace(`/campaigns/${slug}?tab=conversations`, { scroll: false });
  }, [rawTab, router, slug]);
  useEffect(() => {
    if (!cleanupToast) return;
    const timeout = window.setTimeout(() => setCleanupToast(""), 5_000);
    return () => window.clearTimeout(timeout);
  }, [cleanupToast]);
  const visible = useMemo(
    () =>
      data?.leads.filter((item) => {
        const nurture = "airtableRecordId" in item,
          lead = nurture ? item.lead : item,
          itemStatus = nurture ? item.status : item.status,
          itemStep = nurture ? item.currentStep : "",
          haystack =
            `${lead?.name ?? ""} ${lead?.email ?? ""} ${lead?.phone ?? ""}`.toLowerCase();
        return (
          (status === "All" || itemStatus === status) &&
          (step === "All" || itemStep === step) &&
          haystack.includes(query.toLowerCase())
        );
      }) ?? [],
    [data, query, status, step],
  );
  const disconnectedEnrollments = useMemo(
    () =>
      data?.leads.filter(
        (item): item is NurtureEnrollment =>
          "airtableRecordId" in item && !item.lead,
      ) ?? [],
    [data],
  );
  async function stopNurture() {
    if (!stopTarget) return;
    setStopping(true);
    const target = stopTarget;
    const response = await fetch(
      `/api/airtable/nurture-enrollments/${target.airtableRecordId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" }),
      },
    );
    setStopping(false);
    if (response.ok) {
      setData((current) =>
        current
          ? {
              ...current,
              leads: current.leads.map((item) =>
                "airtableRecordId" in item &&
                item.airtableRecordId === target.airtableRecordId
                  ? {
                      ...item,
                      status: "Stopped",
                      stopReason: "Manual",
                      stoppedAtStep: item.currentStep,
                    }
                  : item,
              ),
            }
          : current,
      );
      setStopTarget(null);
      window.setTimeout(() => void load(), 0);
    } else
      setError(
        `Could not stop nurture for ${target.lead?.name ?? "this Lead"}. Try again.`,
      );
  }
  if (loading)
    return (
      <div className="space-y-4 p-8">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-28 animate-pulse rounded-xl bg-white/5"
          />
        ))}
      </div>
    );
  if (error || !data)
    return (
      <div className="p-8 text-center text-red-300">
        <p>{error || "Campaign not found"}</p>
        <button onClick={() => void load()} className="mt-3 rounded-lg border px-4 py-2">
          Retry
        </button>
      </div>
    );
  const c = data.campaign,
    nurture = c.slug === "14-day-nurture",
    failed = data.messages.filter(
      (message) => message.deliveryStatus === "Failed",
    ).length;
  const metrics = nurture
    ? [
        ["Total enrolled", c.totalLeads],
        ["Active", c.activeLeads],
        ["Completed", c.completedLeads],
        ["Stopped", c.metrics.stopped],
        ["Due today", c.metrics.dueToday],
        ["Messages sent", c.messagesSent],
        ["Failed messages", failed],
      ]
    : [
        ["Total Leads processed", c.totalLeads],
        ["Email sent", c.metrics.emailSent],
        ["SMS sent", c.metrics.smsSent],
        ["Failed messages", failed],
        ["Booked Leads", c.metrics.bookedLeads],
        [
          "Replied Leads",
          data.leads.filter((item) => "replied" in item && item.replied).length,
        ],
        ["Last activity", formatCampaignDate(c.lastActivity)],
      ];
  const conversationLeads = data.leads.flatMap((item) =>
    "airtableRecordId" in item
      ? item.lead
        ? [
            {
              id: item.lead.id,
              name: item.lead.name,
              email: item.lead.email,
              phone: item.lead.phone,
              status: item.status,
              currentStep: item.currentStep,
            },
          ]
        : []
      : [
          {
            id: item.id,
            name: item.name,
            email: item.email,
            phone: item.phone,
            status: item.status,
          },
        ],
  );
  const conversations = groupConversations(data.messages, conversationLeads),
    sms = data.messages.filter((message) => message.channel === "SMS").length,
    email = data.messages.filter(
      (message) => message.channel === "Email",
    ).length;
  return (
    <div className="space-y-5">
      <Link
        href="/campaigns"
        className="inline-flex items-center gap-2 text-sm text-[#C9A84C]"
      >
        <ArrowLeft size={15} />
        Back to Campaigns
      </Link>
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="min-w-0 font-serif text-2xl leading-tight text-[#F0ECE4] sm:text-3xl">
            {c.name}
          </h1>
          <CampaignStatusBadge status={c.status} />
          <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-[#B8B8C2]">
            {c.type}
          </span>
        </div>
        <p className="mt-2 text-sm text-[#9292A0]">{c.description}</p>
        <p className="mt-2 text-xs text-[#9292A0]">
          Channels: {c.channels.join(" + ")} · Last activity:{" "}
          {formatCampaignDate(c.lastActivity)}
        </p>
      </header>
      <nav
        className="sticky top-[64px] z-20 -mx-1 flex overflow-x-auto border-b border-white/10 px-1 md:static md:bg-transparent"
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--background) 96%, transparent)",
        }}
        aria-label="Campaign sections"
      >
        {[
          ["overview", "Overview"],
          ["leads", "Leads"],
          ["conversations", "Conversations"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() =>
              router.replace(`/campaigns/${slug}?tab=${key}`, { scroll: false })
            }
            className="min-h-11 shrink-0 border-b-2 px-4 py-3 text-sm font-bold"
            style={{
              color: tab === key ? GOLD : MUTED,
              borderColor: tab === key ? GOLD : "transparent",
            }}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab === "overview" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {metrics.map(([label, value]) => (
              <div
                key={String(label)}
                className="rounded-xl border p-4"
                style={{
                  background: PANEL,
                  borderColor: "rgba(201,168,76,.14)",
                }}
              >
                <p className="text-xl font-bold text-[#F0ECE4]">
                  {String(value ?? 0)}
                </p>
                <p className="text-xs text-[#9292A0]">{label}</p>
              </div>
            ))}
          </div>
          {nurture && (
            <PatientJourneyRail
              enrollments={data.leads.filter(
                (item): item is NurtureEnrollment => "airtableRecordId" in item,
              )}
            />
          )}
          <CommunicationOverview messages={data.messages} />
        </div>
      )}
      {tab === "leads" && (
        <CampaignLeadsPanel
          allItems={data.leads}
          visible={visible}
          messages={data.messages}
          nurture={nurture}
          query={query}
          status={status}
          step={step}
          stopping={stopping}
          canAdd={role === "admin"}
          canManageCleanup={role === "admin"}
          onQuery={setQuery}
          onStatus={setStatus}
          onStep={setStep}
          onAdd={() => setAddOpen(true)}
          onStop={setStopTarget}
          onOpenCleanup={(enrollmentId = null, action = "review") =>
            setCleanup({ open: true, enrollmentId, action })
          }
          onClear={() => {
            setQuery("");
            setStatus("All");
            setStep("All");
          }}
        />
      )}
      {tab === "conversations" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[#C9A84C]/15 bg-[#111117] p-4 sm:grid-cols-3 sm:gap-3 sm:p-5 lg:grid-cols-6">
            {[
              ["Conversations", conversations.length],
              ["Messages", data.messages.length],
              ["SMS", sms],
              ["Email", email],
              ["Failed / rejected", failed],
              ["Most recent", formatCampaignDate(c.lastActivity)],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="min-w-0 rounded-xl bg-white/[.025] p-3 lg:bg-transparent lg:p-0"
              >
                <p className="text-lg font-bold text-[#F0ECE4]">
                  {String(value)}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-[#9292A0]">
                  {label}
                </p>
              </div>
            ))}
          </div>
          <CommunicationOverview messages={data.messages} />
          <CampaignConversationTable
            conversations={conversations}
            onOpen={setConversation}
          />
        </div>
      )}
      <AddLeadsToCampaignModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onComplete={() => void load(false)}
      />
      <DisconnectedEnrollmentCleanupModal
        open={cleanup.open}
        enrollments={disconnectedEnrollments}
        messages={data.messages}
        canManage={role === "admin"}
        initialEnrollmentId={cleanup.enrollmentId}
        initialAction={cleanup.action}
        onClose={() =>
          setCleanup({ open: false, enrollmentId: null, action: "review" })
        }
        onChanged={async (message) => {
          setCleanup((current) => ({
            ...current,
            enrollmentId: null,
            action: "review",
          }));
          const refreshed = await load(false);
          if (!refreshed) {
            throw new Error(
              "The enrollment was updated, but Campaign Leads could not be refreshed. Refresh this page before continuing.",
            );
          }
          setCleanupToast(message);
        }}
      />
      <DestructiveConfirmDialog
        open={Boolean(stopTarget)}
        title={`Stop nurture for ${stopTarget?.lead?.name ?? "this Lead"}?`}
        description="Future nurture messages will stop. The enrollment and communication history will remain available for reporting."
        confirmLabel="Stop nurture"
        loading={stopping}
        onCancel={() => setStopTarget(null)}
        onConfirm={() => void stopNurture()}
      >
        <p>
          Current step: <b>{stopTarget?.currentStep || "Not available"}</b>
        </p>
      </DestructiveConfirmDialog>
      {conversation && (
        <ConversationDrawer
          conversation={conversation}
          onClose={() => setConversation(null)}
        />
      )}
      {cleanupToast && (
        <Toast
          variant="success"
          message={cleanupToast}
          onClose={() => setCleanupToast("")}
        />
      )}
    </div>
  );
}

function CampaignLeadsPanel(props: {
  allItems: Array<NurtureEnrollment | SpeedLead>;
  visible: Array<NurtureEnrollment | SpeedLead>;
  messages: MessageLog[];
  nurture: boolean;
  query: string;
  status: string;
  step: string;
  stopping: boolean;
  canAdd: boolean;
  canManageCleanup: boolean;
  onQuery: (v: string) => void;
  onStatus: (v: string) => void;
  onStep: (v: string) => void;
  onAdd: () => void;
  onStop: (item: NurtureEnrollment) => void;
  onOpenCleanup: (
    enrollmentId?: string | null,
    action?: CleanupAction,
  ) => void;
  onClear: () => void;
}) {
  const enrollments = props.allItems.filter(
      (item): item is NurtureEnrollment => "airtableRecordId" in item,
    ),
    disconnected = enrollments.filter((item) => !item.lead),
    valid = enrollments.filter((item) => item.lead),
    due = valid.filter(
      (item) =>
        item.status === "Active" &&
        item.nextSendAt &&
        isCampaignDateToday(item.nextSendAt, REFERENCE_NOW),
    ).length,
    needsAttention = valid.filter(
      (item) => campaignDeliveryFor(props.messages, item.linkedLeadId).failed > 0,
    ).length;
  if (!props.nurture) return <LeadTable items={props.visible} />;
  const visibleValid = props.visible.filter(
    (item): item is NurtureEnrollment =>
      "airtableRecordId" in item && Boolean(item.lead),
  );
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-[#C9A84C]/15 bg-[#111117] p-3 sm:grid-cols-5 sm:gap-0 sm:divide-x sm:divide-white/10 sm:px-2 sm:py-3">
        {[
          ["Active", valid.filter((item) => item.status === "Active").length],
          ["Due Today", due],
          [
            "Completed",
            valid.filter((item) => item.status === "Completed").length,
          ],
          ["Stopped", valid.filter((item) => item.status === "Stopped").length],
          ["Needs Attention", needsAttention],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className={`rounded-lg bg-white/[.025] px-3 py-2 text-center sm:rounded-none sm:bg-transparent sm:py-0 ${label === "Needs Attention" ? "col-span-2 sm:col-span-1" : ""}`}
          >
            <p className="text-lg font-bold text-[#F0ECE4]">{value}</p>
            <p className="text-[9px] uppercase tracking-wider text-[#9292A0]">
              {label}
            </p>
          </div>
        ))}
      </div>
      {disconnected.length > 0 && (
        <Alert
          variant="warning"
          title={
            disconnected.length === 1
              ? "1 enrollment is no longer connected to a Lead."
              : `${disconnected.length} enrollments are no longer connected to Leads.`
          }
          action={
            <button
              onClick={() => props.onOpenCleanup()}
              className="min-h-10 rounded-xl border px-3 text-xs font-bold"
              style={{
                color: "var(--warning-text)",
                borderColor: "var(--warning-border)",
                backgroundColor: "var(--surface-1)",
              }}
            >
              Review cleanup
            </button>
          }
        >
          The enrollment cannot continue because its linked Lead record is
          unavailable.
        </Alert>
      )}
      {disconnected.length > 0 && (
        <DisconnectedEnrollmentRows
          items={disconnected}
          canManage={props.canManageCleanup}
          onOpen={props.onOpenCleanup}
        />
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <Search className="absolute left-3 top-3" size={15} color={MUTED} />
          <input
            value={props.query}
            onChange={(event) => props.onQuery(event.target.value)}
            placeholder="Search name, email, or phone"
            className="h-11 w-full rounded-xl border border-white/10 bg-transparent pl-9 pr-3 text-white"
          />
        </label>
        <select
          aria-label="Enrollment status"
          value={props.status}
          onChange={(event) => props.onStatus(event.target.value)}
          className="h-11 w-full rounded-xl border border-white/10 bg-[#101016] px-3 text-white sm:w-auto"
        >
          <option value="All">All Statuses</option>
          {["Active", "Stopped", "Completed"].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <select
          aria-label="Current step"
          value={props.step}
          onChange={(event) => props.onStep(event.target.value)}
          className="h-11 w-full rounded-xl border border-white/10 bg-[#101016] px-3 text-white sm:w-auto"
        >
          <option value="All">All Steps</option>
          {[
            "Day 1 SMS",
            "Day 3 Email",
            "Day 5 SMS",
            "Day 8 Email",
            "Day 12 SMS",
          ].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        {props.canAdd && <button onClick={props.onAdd} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#C9A84C] px-4 py-2 text-sm font-bold text-black"><Plus size={16} />Add Leads</button>}
      </div>
      {valid.length === 0 && disconnected.length === 0 ? (
        <EmptyLeads onAdd={props.canAdd ? props.onAdd : undefined} />
      ) : visibleValid.length === 0 ? (
        <div className="rounded-xl border border-white/10 p-10 text-center">
          <h3 className="font-serif text-xl text-white">
            {disconnected.length && valid.length === 0
              ? "Enrollment records need attention"
              : "No Leads match these filters"}
          </h3>
          <p className="mt-2 text-sm text-[#9292A0]">
            {disconnected.length && valid.length === 0
              ? "Enrollment records exist, but they are not linked to available Leads."
              : "Clear filters to return to the full campaign list."}
          </p>
          {valid.length > 0 && (
            <button
              onClick={props.onClear}
              className="mt-4 text-sm font-bold text-[#C9A84C]"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <NurtureOperationalTable
          items={visibleValid}
          messages={props.messages}
          stopping={props.stopping}
          onStop={props.onStop}
        />
      )}
    </div>
  );
}

function DisconnectedEnrollmentRows({
  items,
  canManage,
  onOpen,
}: {
  items: NurtureEnrollment[];
  canManage: boolean;
  onOpen: (enrollmentId?: string | null, action?: CleanupAction) => void;
}) {
  const [menu, setMenu] = useState<string | null>(null);
  return (
    <section
      aria-label="Disconnected Enrollments"
      className="rounded-2xl border"
      style={{
        borderColor: "var(--warning-border)",
        backgroundColor: "var(--surface-1)",
      }}
    >
      <div
        className="border-b px-4 py-3"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
          Disconnected Enrollments
        </h3>
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          Lead-dependent actions are unavailable until a Lead is reconnected.
        </p>
      </div>
      <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
        {items.map((item) => (
          <div
            key={item.airtableRecordId}
            className="relative flex items-center gap-3 px-4 py-3"
          >
            <button
              type="button"
              onClick={() => onOpen(item.airtableRecordId, "review")}
              className="min-w-0 flex-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ outlineColor: "var(--focus)" }}
            >
              <span className="block text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                Lead unavailable
              </span>
              <span className="mt-1 block truncate text-xs" style={{ color: "var(--text-muted)" }}>
                {item.airtableRecordId} · {item.currentStep || "Step unavailable"} · {item.status}
              </span>
            </button>
            <button
              type="button"
              aria-label={`Actions for enrollment ${item.airtableRecordId}`}
              aria-expanded={menu === item.airtableRecordId}
              onClick={() =>
                setMenu(menu === item.airtableRecordId ? null : item.airtableRecordId)
              }
              className="grid size-10 shrink-0 place-items-center rounded-xl border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                color: "var(--text-secondary)",
                borderColor: "var(--border-subtle)",
                outlineColor: "var(--focus)",
              }}
            >
              <MoreHorizontal size={18} />
            </button>
            {menu === item.airtableRecordId && (
              <div
                className="absolute right-4 top-12 z-30 w-56 rounded-xl border p-1"
                style={{
                  color: "var(--text-primary)",
                  backgroundColor: "var(--surface-raised)",
                  borderColor: "var(--border-subtle)",
                  boxShadow: "var(--shadow-modal)",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenu(null);
                    onOpen(item.airtableRecordId, "review");
                  }}
                  className="min-h-11 w-full rounded-lg px-3 text-left text-xs font-bold hover:bg-[var(--surface-hover)]"
                >
                  Review enrollment
                </button>
                {canManage && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setMenu(null);
                        onOpen(item.airtableRecordId, "reconnect");
                      }}
                      className="min-h-11 w-full rounded-lg px-3 text-left text-xs font-bold hover:bg-[var(--surface-hover)]"
                      style={{ color: "var(--brand-primary)" }}
                    >
                      Reconnect Lead
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenu(null);
                        onOpen(item.airtableRecordId, "remove");
                      }}
                      className="min-h-11 w-full rounded-lg px-3 text-left text-xs font-bold hover:bg-[var(--danger-bg)]"
                      style={{ color: "var(--danger-text)" }}
                    >
                      Remove Enrollment
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function NurtureOperationalTable({
  items,
  messages,
  stopping,
  onStop,
}: {
  items: NurtureEnrollment[];
  messages: MessageLog[];
  stopping: boolean;
  onStop: (item: NurtureEnrollment) => void;
}) {
  const router = useRouter(),
    [menu, setMenu] = useState<string | null>(null);
  function open(item: NurtureEnrollment) {
    if (item.lead) router.push(`/leads?lead=${item.lead.id}`);
  }
  return (
    <>
      <div className="grid gap-3 md:hidden">
        {items.map((item) => {
          const health = campaignDeliveryFor(messages, item.linkedLeadId);
          const last = health.lastActivity || item.lastSentAt || item.createdAt;
          return (
            <article
              key={item.airtableRecordId}
              onClick={() => open(item)}
              className="relative rounded-2xl border border-white/10 bg-[#111117] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">
                    {item.lead!.name}
                  </p>
                  <p className="mt-1 break-anywhere text-xs text-[#9292A0]">
                    {item.lead!.email || item.lead!.phone}
                  </p>
                </div>
                <div onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    aria-label={`Actions for ${item.lead!.name}`}
                    onClick={() =>
                      setMenu(
                        menu === item.airtableRecordId
                          ? null
                          : item.airtableRecordId,
                      )
                    }
                    className="grid size-10 place-items-center rounded-xl border border-white/10 text-[#9292A0]"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {menu === item.airtableRecordId && (
                    <div className="absolute right-4 top-14 z-20 w-48 rounded-xl border border-[#C9A84C]/15 bg-[#0A0A0D] p-1 shadow-xl">
                      <button
                        onClick={() => open(item)}
                        className="min-h-11 w-full rounded-lg px-3 text-left text-xs text-white"
                      >
                        View Lead
                      </button>
                      <button
                        onClick={() =>
                          router.push(
                            `/campaigns/14-day-nurture?tab=conversations&lead=${item.lead!.id}`,
                          )
                        }
                        className="min-h-11 w-full rounded-lg px-3 text-left text-xs text-white"
                      >
                        Open Conversation
                      </button>
                      {item.status === "Active" && (
                        <button
                          disabled={stopping}
                          onClick={() => onStop(item)}
                          className="min-h-11 w-full rounded-lg px-3 text-left text-xs text-[#F58A91]"
                        >
                          Stop Nurture
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <CampaignStatusBadge status={item.status} />
                {item.lead!.replied && (
                  <span className="rounded-full bg-[#4ECDC4]/10 px-2 py-1 text-[10px] text-[#4ECDC4]">
                    Replied
                  </span>
                )}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-white/[.03] p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#7F8997]">
                    Journey progress
                  </p>
                  <div className="mt-2">
                    <CompactJourneyProgress
                      currentStep={item.currentStep}
                      status={item.status}
                      sentSteps={sentStepsForLead(messages, item.linkedLeadId)}
                    />
                  </div>
                </div>
                <div className="rounded-xl bg-white/[.03] p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#7F8997]">
                    Next touch
                  </p>
                  <div className="mt-2 text-xs">
                    <NextTouch item={item} />
                  </div>
                </div>
                <div className="rounded-xl bg-white/[.03] p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#7F8997]">
                    Delivery health
                  </p>
                  <p
                    className="mt-2 text-xs font-bold"
                    style={{ color: health.color }}
                  >
                    {health.label}
                  </p>
                  <p className="mt-1 text-[10px] text-[#9292A0]">
                    {health.sent} sent
                    {health.failed ? ` · ${health.failed} failed` : ""}
                  </p>
                </div>
                <div className="rounded-xl bg-white/[.03] p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#7F8997]">
                    Last activity
                  </p>
                  <p className="mt-2 text-xs text-[#B8B8C2]">
                    {relative(last)}
                  </p>
                  <p className="mt-1 text-[10px] text-[#9292A0]">
                    {formatCampaignDate(last)}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <div className="hidden overflow-x-auto rounded-xl border border-white/10 md:block">
        <table className="w-full min-w-[1080px] text-left text-xs">
          <thead className="bg-[#0D0D12] text-[#858592]">
            <tr>
              {[
                "Lead",
                "Journey Progress",
                "Next Touch",
                "Delivery Health",
                "Campaign Status",
                "Last Activity",
                "Actions",
              ].map((label) => (
                <th key={label} className="p-3 uppercase tracking-wider">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const health = campaignDeliveryFor(messages, item.linkedLeadId),
                last = health.lastActivity || item.lastSentAt || item.createdAt;
              return (
                <tr
                  key={item.airtableRecordId}
                  tabIndex={0}
                  onClick={() => open(item)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") open(item);
                  }}
                  className="cursor-pointer border-t border-white/5 transition-colors hover:bg-white/[.025] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C9A84C]"
                >
                  <td className="p-3">
                    <p className="font-bold text-white">{item.lead!.name}</p>
                    <p className="mt-1 text-[11px] text-[#9292A0]">
                      {item.lead!.email || item.lead!.phone}
                    </p>
                    <div className="mt-2 flex gap-1">
                      <CampaignStatusBadge status={item.lead!.status} />
                      {item.lead!.replied && (
                        <span className="rounded-full bg-[#4ECDC4]/10 px-2 py-1 text-[10px] text-[#4ECDC4]">
                          Replied
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <CompactJourneyProgress
                      currentStep={item.currentStep}
                      status={item.status}
                      sentSteps={sentStepsForLead(messages, item.linkedLeadId)}
                    />
                  </td>
                  <td className="p-3">
                    <NextTouch item={item} />
                  </td>
                  <td className="p-3">
                    <p className="font-bold" style={{ color: health.color }}>
                      {health.label}
                    </p>
                    <p className="mt-1 text-[10px] text-[#9292A0]">
                      {health.sent} sent
                      {health.failed ? ` · ${health.failed} failed` : ""}
                      {health.lastChannel ? ` · ${health.lastChannel}` : ""}
                    </p>
                  </td>
                  <td className="p-3">
                    <CampaignStatusBadge status={item.status} />
                    {item.status === "Stopped" && (
                      <p className="mt-1 text-[10px] text-[#9292A0]">
                        {item.stopReason || "Reason unavailable"}
                      </p>
                    )}
                  </td>
                  <td className="p-3 text-[#B8B8C2]">
                    <span title={formatCampaignDate(last)}>
                      {relative(last)}
                    </span>
                    <p className="mt-1 text-[10px] text-[#9292A0]">
                      {formatCampaignDate(last)}
                    </p>
                  </td>
                  <td
                    className="relative p-3"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button
                      aria-label={`Actions for ${item.lead!.name}`}
                      onClick={() =>
                        setMenu(
                          menu === item.airtableRecordId
                            ? null
                            : item.airtableRecordId,
                        )
                      }
                      className="rounded-lg p-2 text-[#9292A0] hover:bg-white/5"
                    >
                      <MoreHorizontal size={17} />
                    </button>
                    {menu === item.airtableRecordId && (
                      <div className="absolute right-3 top-11 z-20 w-44 rounded-xl border border-[#C9A84C]/15 bg-[#0A0A0D] p-1 shadow-xl">
                        <button
                          onClick={() => open(item)}
                          className="block w-full rounded-lg px-3 py-2 text-left text-xs text-white"
                        >
                          View Lead
                        </button>
                        <button
                          onClick={() =>
                            router.push(
                              `/campaigns/14-day-nurture?tab=conversations&lead=${item.lead!.id}`,
                            )
                          }
                          className="block w-full rounded-lg px-3 py-2 text-left text-xs text-white"
                        >
                          Open Conversation
                        </button>
                        {item.status === "Active" && (
                          <button
                            disabled={stopping}
                            onClick={() => onStop(item)}
                            className="block w-full rounded-lg px-3 py-2 text-left text-xs text-[#F58A91]"
                          >
                            Stop Nurture
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
function NextTouch({ item }: { item: NurtureEnrollment }) {
  if (item.status === "Completed")
    return <p className="font-bold text-[#4ECDC4]">Completed</p>;
  if (item.status === "Stopped")
    return <p className="text-[#9292A0]">No future messages</p>;
  return (
    <div>
      <p className="font-bold text-white">{displayedNextTouch(item.currentStep)}</p>
      <p
        className={`mt-1 text-[10px] ${item.nextSendAt && Date.parse(item.nextSendAt) < REFERENCE_NOW ? "text-amber-300" : "text-[#9292A0]"}`}
      >
        {relative(item.nextSendAt)}
      </p>
      <p className="mt-1 text-[#B8B8C2]">
        {formatCampaignDate(item.nextSendAt)}
      </p>
    </div>
  );
}
function relative(value: string | null | undefined) {
  if (!value) return "No activity";
  const diff = Date.parse(value) - REFERENCE_NOW,
    abs = Math.abs(diff),
    hours = Math.round(abs / 3600000),
    days = Math.round(abs / 86400000);
  if (abs < 3600000)
    return diff < 0
      ? `Overdue by ${Math.max(1, Math.round(abs / 60000))} min`
      : `In ${Math.max(1, Math.round(abs / 60000))} min`;
  const amount =
    abs >= 86400000
      ? `${Math.max(1, days)} day${days === 1 ? "" : "s"}`
      : `${Math.max(1, hours)} hour${hours === 1 ? "" : "s"}`;
  return diff < 0 ? `Overdue by ${amount}` : `In ${amount}`;
}
function EmptyLeads({ onAdd }: { onAdd?: () => void }) {
  return (
    <div className="rounded-xl border border-white/10 p-12 text-center">
      <h3 className="font-serif text-xl text-white">
        No Leads in this campaign yet
      </h3>
      <p className="mt-2 text-sm text-[#9292A0]">
        Add eligible Leads to begin the 14-Day Nurture sequence.
      </p>
      {onAdd && <button
        onClick={onAdd}
        className="mt-5 rounded-xl bg-[#C9A84C] px-4 py-2 text-sm font-bold text-black"
      >
        Add Leads
      </button>}
    </div>
  );
}
function LeadTable({ items }: { items: Array<NurtureEnrollment | SpeedLead> }) {
  const speedLeads = items.filter(
    (item): item is SpeedLead => !("airtableRecordId" in item),
  );
  return (
    <>
      <div className="grid gap-3 md:hidden">
        {speedLeads.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-white/10 bg-[#111117] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">
                  {item.name}
                </p>
                <p className="mt-1 break-anywhere text-xs text-[#9292A0]">
                  {item.email || item.phone}
                </p>
              </div>
              <CampaignStatusBadge status={item.status} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                ["Source", item.source || "—"],
                ["Email", item.emailSentStatus || "—"],
                ["SMS", item.smsSentStatus || "—"],
                ["Replied", item.replied ? "Yes" : "No"],
                ["Created", formatCampaignDate(item.createdAt)],
                ["Last contacted", formatCampaignDate(item.lastContactedAt)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="min-w-0 rounded-xl bg-white/[.03] p-3"
                >
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#7F8997]">
                    {label}
                  </p>
                  <p className="mt-1 break-anywhere text-xs text-[#F0ECE4]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-xl border border-white/10 md:block">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead className="bg-white/5 text-[#858592]">
            <tr>
              {[
                "Lead",
                "Contact",
                "Lead Status",
                "Source",
                "Email Status",
                "SMS Status",
                "Replied",
                "Created",
                "Last Contacted",
              ].map((label) => (
                <th className="p-3" key={label}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) =>
              "airtableRecordId" in item ? null : (
                <tr key={item.id} className="border-t border-white/5">
                  <td className="p-3 font-bold text-white">{item.name}</td>
                  <td className="p-3 text-[#B8B8C2]">
                    {item.email || item.phone}
                  </td>
                  <td className="p-3">
                    <CampaignStatusBadge status={item.status} />
                  </td>
                  <td className="p-3 text-[#B8B8C2]">{item.source}</td>
                  <td className="p-3 text-[#B8B8C2]">
                    {item.emailSentStatus || "—"}
                  </td>
                  <td className="p-3 text-[#B8B8C2]">
                    {item.smsSentStatus || "—"}
                  </td>
                  <td className="p-3 text-[#B8B8C2]">
                    {item.replied ? "Yes" : "No"}
                  </td>
                  <td className="p-3 text-[#B8B8C2]">
                    {formatCampaignDate(item.createdAt)}
                  </td>
                  <td className="p-3 text-[#B8B8C2]">
                    {formatCampaignDate(item.lastContactedAt)}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
function CommunicationOverview({ messages }: { messages: MessageLog[] }) {
  const sent = messages.filter((item) => item.deliveryStatus === "Sent").length,
    failed = messages.filter((item) => item.deliveryStatus === "Failed").length,
    sms = messages.filter((item) => item.channel === "SMS").length,
    email = messages.filter((item) => item.channel === "Email").length,
    total = Math.max(messages.length, 1);
  return (
    <div className="grid gap-3 md:grid-cols-[1.5fr_1fr]">
      <div className="rounded-2xl border border-white/5 bg-[#111117] p-5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#C9A84C]">
          Delivery health
        </p>
        <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-white/5">
          <span
            style={{ width: `${(sent / total) * 100}%`, background: "#4ECDC4" }}
          />
          <span
            style={{
              width: `${(failed / total) * 100}%`,
              background: "#C9555D",
            }}
          />
        </div>
        <div className="mt-3 flex gap-5 text-xs text-[#9292A0]">
          <span>Sent {sent}</span>
          <span>Failed {failed}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/5 bg-[#111117] p-4 text-[#B8B8C2]">
          <MessageSquare size={16} />
          <p className="mt-3 text-xl font-bold text-white">{sms}</p>
          <p className="text-xs">SMS</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-[#111117] p-4 text-[#B8B8C2]">
          <Mail size={16} />
          <p className="mt-3 text-xl font-bold text-white">{email}</p>
          <p className="text-xs">Email</p>
        </div>
      </div>
    </div>
  );
}
function ConversationDrawer({
  conversation,
  onClose,
}: {
  conversation: Conversation;
  onClose: () => void;
}) {
  const [openMessage, setOpenMessage] = useState<string | null>(null);
  return (
    <div
      className="fixed inset-0 z-[90] bg-black/60"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Communication with ${conversation.lead?.name ?? "Lead"}`}
        className="absolute right-0 top-0 h-full w-full overflow-y-auto border-l border-[#C9A84C]/20 bg-[#0D0D12] p-5 shadow-2xl sm:max-w-[680px]"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#C9A84C]">
              Communication
            </p>
            <h2 className="mt-1 font-serif text-2xl text-[#F0ECE4]">
              {conversation.lead?.name ?? "Deleted or unavailable Lead"}
            </h2>
            <p className="mt-1 text-sm text-[#9292A0]">
              {conversation.lead?.email ||
                conversation.lead?.phone ||
                "Contact unavailable"}
            </p>
          </div>
          <button aria-label="Close communication drawer" onClick={onClose}>
            <X className="text-[#9292A0]" />
          </button>
        </div>
        <div className="mt-6 space-y-3">
          {conversation.messages
            .slice()
            .sort(
              (a, b) =>
                Date.parse(a.sentAt ?? a.createdTime) -
                Date.parse(b.sentAt ?? b.createdTime),
            )
            .map((message) => {
              const open = openMessage === message.id;
              return (
                <article
                  key={message.id}
                  className="overflow-hidden rounded-2xl border bg-[#111117] transition-colors"
                  style={{
                    borderColor: open
                      ? "rgba(201,168,76,.28)"
                      : "rgba(255,255,255,.06)",
                  }}
                >
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={`message-${message.id}`}
                    onClick={() =>
                      setOpenMessage((current) =>
                        current === message.id ? null : message.id,
                      )
                    }
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="flex min-w-0 items-center gap-2 text-sm font-bold text-[#F0ECE4]">
                        {message.channel === "SMS" ? (
                          <MessageSquare size={15} />
                        ) : (
                          <Mail size={15} />
                        )}
                        <span className="truncate">
                          {message.sequence}
                          {message.sequenceStep
                            ? ` · ${message.sequenceStep}`
                            : ""}
                        </span>
                      </p>
                      <span className="flex shrink-0 items-center gap-3">
                        <CampaignStatusBadge status={message.deliveryStatus} />
                        <ChevronDown
                          size={16}
                          className="text-[#9292A0] transition-transform duration-300"
                          style={{
                            transform: open ? "rotate(180deg)" : "rotate(0deg)",
                          }}
                        />
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#B8B8C2]">
                      {message.messageBody || "No message body was recorded."}
                    </p>
                    <p className="mt-3 text-xs text-[#7F8997]">
                      {formatCampaignDate(message.sentAt)}
                    </p>
                  </button>
                  <div
                    id={`message-${message.id}`}
                    className="grid transition-[grid-template-rows] duration-300 ease-out"
                    style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t border-white/5 px-4 pb-4 pt-4">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#C9A84C]">
                          Full message
                        </p>
                        <p className="whitespace-pre-wrap break-words text-sm leading-7 text-[var(--text-primary)]">
                          {message.messageBody ||
                            "No message body was recorded."}
                        </p>
                        <div className="mt-4 rounded-xl bg-black/20 p-3 text-xs leading-5 text-[#7F8997]">
                          <p>Channel: {message.channel}</p>
                          <p>Sent: {formatCampaignDate(message.sentAt)}</p>
                          {message.mandrillMessageId && (
                            <p className="break-all">
                              Mandrill: {message.mandrillMessageId}
                            </p>
                          )}
                          {message.errorReason && (
                            <p className="text-[#F58A91]">
                              {message.errorReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
        </div>
      </aside>
    </div>
  );
}
