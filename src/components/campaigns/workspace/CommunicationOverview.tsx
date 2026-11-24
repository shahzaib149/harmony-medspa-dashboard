"use client";

import { Mail, MessageSquare } from "lucide-react";
import type { MessageLog } from "@/types/message-log";

/** Delivery health bar plus SMS and Email totals for a set of campaign messages. */
export function CommunicationOverview({ messages }: { messages: MessageLog[] }) {
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
