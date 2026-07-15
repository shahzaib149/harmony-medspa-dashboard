"use client";

import { ArrowUpRight, Mail, MessageSquare } from "lucide-react";
import type { MessageLog } from "@/types/message-log";

type LeadLike = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status?: string;
  currentStep?: string;
};
export type Conversation = {
  leadId: string;
  lead: LeadLike | null;
  messages: MessageLog[];
  sms: number;
  email: number;
  failed: number;
  lastActivity: string;
  lastPreview: string;
};

export function groupConversations(
  messages: MessageLog[],
  leads: LeadLike[],
): Conversation[] {
  const map = new Map<string, Conversation>();
  const leadMap = new Map(leads.map((lead) => [lead.id, lead]));
  for (const message of messages) {
    const key = message.recipientLeadId ?? `orphan:${message.id}`;
    const current = map.get(key) ?? {
      leadId: key,
      lead: message.recipientLeadId
        ? (leadMap.get(message.recipientLeadId) ?? null)
        : null,
      messages: [],
      sms: 0,
      email: 0,
      failed: 0,
      lastActivity: message.sentAt ?? message.createdTime,
      lastPreview: "",
    };
    current.messages.push(message);
    if (message.channel === "SMS") current.sms++;
    if (message.channel === "Email") current.email++;
    if (message.deliveryStatus === "Failed") current.failed++;
    const time = message.sentAt ?? message.createdTime;
    if (Date.parse(time) > Date.parse(current.lastActivity)) {
      current.lastActivity = time;
      current.lastPreview = message.messageBody;
    }
    if (!current.lastPreview) current.lastPreview = message.messageBody;
    map.set(key, current);
  }
  return [...map.values()].sort(
    (a, b) => Date.parse(b.lastActivity) - Date.parse(a.lastActivity),
  );
}

function health(item: Conversation) {
  if (!item.messages.length) return ["No messages yet", "var(--text-muted)"];
  if (item.failed === 0) return ["Healthy", "var(--healthy)"];
  if (item.failed < item.messages.length) return ["Partial failure", "var(--warning)"];
  return ["Needs attention", "var(--danger)"];
}

export default function CampaignConversationTable({
  conversations,
  onOpen,
}: {
  conversations: Conversation[];
  onOpen: (item: Conversation) => void;
}) {
  if (!conversations.length)
    return (
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-6 py-14 text-center">
        <MessageSquare className="mx-auto text-[var(--brand-primary)]" />
        <h3 className="mt-4 font-serif text-xl text-[var(--text-primary)]">
          No campaign conversations yet
        </h3>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Messages will appear here after Make.com sends the first campaign
          communication.
        </p>
      </div>
    );

  return (
    <>
      <div className="grid gap-3 md:hidden">
        {conversations.map((item) => {
          const [label, color] = health(item);
          return (
            <button
              key={item.leadId}
              type="button"
              onClick={() => onOpen(item)}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[var(--text-primary)]">
                    {item.lead?.name ?? "Deleted or unavailable lead"}
                  </p>
                  <p className="mt-1 break-anywhere text-xs text-[var(--text-muted)]">
                    {item.lead?.email ||
                      item.lead?.phone ||
                      "Contact unavailable"}
                  </p>
                </div>
                <ArrowUpRight size={17} className="shrink-0 text-[var(--brand-primary)]" />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-[var(--surface-2)] p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Messages
                  </p>
                  <p className="mt-1 font-bold text-[var(--text-primary)]">
                    {item.messages.length} total
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
                    <MessageSquare size={11} className="inline" /> {item.sms}{" "}
                    SMS · <Mail size={11} className="inline" /> {item.email}{" "}
                    Email
                  </p>
                </div>
                <div className="rounded-xl bg-[var(--surface-2)] p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Delivery
                  </p>
                  <p className="mt-1 text-xs font-bold" style={{ color }}>
                    {label}
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                    {item.lead?.currentStep || item.lead?.status || "No step"}
                  </p>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 break-anywhere text-xs leading-5 text-[var(--text-secondary)]">
                {item.lastPreview || "No message preview"}
              </p>
              <p className="mt-2 text-[10px] text-[var(--text-muted)]">
                {new Date(item.lastActivity).toLocaleString()}
              </p>
            </button>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl bg-[var(--surface-1)] md:block">
        <table className="w-full min-w-[1380px] text-left text-sm xl:min-w-[1280px]">
          <thead className="bg-[var(--surface-2)] text-[var(--text-muted)]">
            <tr>
              {[
                "Lead",
                "Contact",
                "Campaign Status",
                "Sequence Progress",
                "Total",
                "SMS",
                "Email",
                "Delivery Health",
                "Last Message",
                "Last Activity",
                "",
              ].map((label) => (
                <th
                  key={label}
                  className={`px-4 py-4 text-[10px] font-bold uppercase tracking-[.08em] ${label === "Lead" ? "min-w-32" : ""} ${label === "Contact" ? "min-w-56" : ""} ${label === "Campaign Status" ? "min-w-40" : ""} ${label === "Sequence Progress" ? "min-w-44" : ""} ${label === "Delivery Health" ? "min-w-40" : ""} ${label === "Last Message" ? "min-w-64" : ""} ${label === "Last Activity" ? "min-w-52" : ""}`}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {conversations.map((item) => {
              const [label, color] = health(item);
              return (
                <tr
                  key={item.leadId}
                  tabIndex={0}
                  onClick={() => onOpen(item)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onOpen(item);
                    }
                  }}
                  className="cursor-pointer border-t border-[var(--border-subtle)] transition hover:bg-[var(--surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"
                >
                  <td className="px-4 py-4 font-bold text-[var(--text-primary)]">
                    {item.lead?.name ?? "Deleted or unavailable lead"}
                  </td>
                  <td className="break-anywhere px-4 py-4 text-[var(--text-muted)]">
                    {item.lead?.email || item.lead?.phone || "—"}
                  </td>
                  <td className="px-4 py-4 text-[var(--text-secondary)]">
                    {item.lead?.status || "Unavailable"}
                  </td>
                  <td className="px-4 py-4 text-[var(--text-secondary)]">
                    {item.lead?.currentStep || "—"}
                  </td>
                  <td className="px-4 py-4 font-bold text-[var(--text-primary)]">
                    {item.messages.length}
                  </td>
                  <td className="px-4 py-4 text-[var(--text-secondary)]">{item.sms}</td>
                  <td className="px-4 py-4 text-[var(--text-secondary)]">{item.email}</td>
                  <td className="px-4 py-4">
                    <span
                      className="rounded-full px-2 py-1 font-bold"
                      style={{
                        color,
                        backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
                      }}
                    >
                      {label}
                    </span>
                  </td>
                  <td className="max-w-64 truncate px-4 py-4 text-[var(--text-muted)]">
                    {item.lastPreview || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-[var(--text-muted)]">
                    {new Date(item.lastActivity).toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-[var(--brand-primary)]">
                    <ArrowUpRight size={15} />
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
