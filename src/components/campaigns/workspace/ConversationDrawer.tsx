"use client";

import { useState } from "react";
import { ChevronDown, Mail, MessageSquare, X } from "lucide-react";
import { CampaignStatusBadge } from "@/components/campaigns/CampaignBadges";
import type { Conversation } from "@/components/campaigns/CampaignConversationTable";
import { formatCampaignDate } from "@/lib/campaigns/campaign-date";

/** Right-hand drawer with one lead's campaign messages; each card expands to the full body. */
export default function ConversationDrawer({
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
