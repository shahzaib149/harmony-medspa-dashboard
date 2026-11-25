"use client";

import { Fragment, type ReactNode } from "react";
import { AlertCircle, CheckCheck, Clock3, Mail, MessageSquare } from "lucide-react";
import type { MessageLog } from "@/types/message-log";
import t from "./thread.module.css";

const when = (iso: string) => new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
const day = (iso: string) => new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "long", month: "long", day: "numeric" }).format(new Date(iso));
const at = (m: MessageLog) => m.sentAt ?? m.createdTime;

/** Email bodies from the sends start with "Subject: …"; split it off for the card header. */
export function splitSubject(body: string): { subject: string; body: string } {
  const hit = body.match(/^Subject:\s*(.+)\n+/);
  return hit ? { subject: hit[1].trim(), body: body.slice(hit[0].length) } : { subject: "", body };
}

/** Plain text with clickable http(s) links. */
function Linkified({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s)]+)/g);
  return <>{parts.map((part, i) => (/^https?:\/\//.test(part)
    ? <a key={i} href={part} target="_blank" rel="noreferrer" className={t.link}>{part.replace(/^https?:\/\/(www\.)?/, "")}</a>
    : <Fragment key={i}>{part}</Fragment>))}</>;
}

function Status({ message }: { message: MessageLog }) {
  if (message.deliveryStatus === "Failed") return <span className={`${t.status} ${t.statusFailed}`}><AlertCircle size={12} /> Failed</span>;
  if (message.deliveryStatus === "Pending") return <span className={`${t.status} ${t.statusPending}`}><Clock3 size={12} /> Pending</span>;
  return <span className={`${t.status} ${t.statusSent}`}><CheckCheck size={12} /> Sent</span>;
}

/**
 * One person's messages, oldest first, grouped under a divider per step. Emails render as
 * mail cards (subject, from / to, body); texts as outgoing bubbles.
 */
export function MessageThread({ messages, stepLabel, fromName, fromPhone, defaultSubject, empty }: {
  messages: MessageLog[];
  stepLabel: (m: MessageLog) => string;
  fromName: string;
  fromPhone: string;
  defaultSubject: string;
  empty?: ReactNode;
}) {
  if (!messages.length) return <>{empty}</>;
  const ordered = [...messages].sort((a, b) => Date.parse(at(a)) - Date.parse(at(b)) || (a.channel === "Email" ? -1 : 1));
  return (
    <ol className={t.thread}>
      {ordered.map((m, i) => {
        const step = stepLabel(m);
        const divider = i === 0 || stepLabel(ordered[i - 1]) !== step
          ? <li className={t.divider}><span>{step}</span><span className={t.dividerDate}>{day(at(m))}</span></li>
          : null;
        if (m.channel === "SMS") {
          return (
            <Fragment key={m.id}>
              {divider}
              <li className={t.smsRow}>
                <div className={t.smsMeta}><MessageSquare size={12} /> Text from {fromPhone}{m.recipientLeadPhone ? ` to ${m.recipientLeadPhone}` : ""}</div>
                <div className={`${t.bubble} ${m.deliveryStatus === "Failed" ? t.bubbleFailed : ""}`}><Linkified text={m.messageBody} /></div>
                <div className={t.smsFoot}><time dateTime={at(m)}>{when(at(m))}</time><Status message={m} /></div>
                {m.errorReason ? <p className={t.error}>{m.errorReason}</p> : null}
              </li>
            </Fragment>
          );
        }
        const { subject, body } = splitSubject(m.messageBody);
        return (
          <Fragment key={m.id}>
            {divider}
            <li className={`${t.mail} ${m.deliveryStatus === "Failed" ? t.mailFailed : ""}`}>
              <header className={t.mailHead}>
                <span className={t.mailIcon}><Mail size={15} /></span>
                <div className="min-w-0 flex-1">
                  <p className={t.mailSubject}>{subject || defaultSubject}</p>
                  <p className={t.mailMeta}>From {fromName}{m.recipientLeadEmail ? <> · to <span className="break-all">{m.recipientLeadEmail}</span></> : null}</p>
                </div>
                <div className={t.mailSide}><time dateTime={at(m)}>{when(at(m))}</time><Status message={m} /></div>
              </header>
              <div className={t.mailBody}><Linkified text={body.trim()} /></div>
              {m.errorReason ? <p className={t.error}>{m.errorReason}</p> : null}
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
