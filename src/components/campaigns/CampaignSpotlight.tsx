"use client";

import Link from "next/link";
import { ArrowRight, CalendarClock, Check, Sparkles } from "lucide-react";
import { BF_DESCRIPTION } from "@/lib/campaigns/card-model";
import { countdown } from "@/lib/campaigns/paginate";
import { BLACK_FRIDAY_NAME, BLACK_FRIDAY_PATH, SEND_STEPS, nextSend, type BlackFridayCampaignSummary } from "@/lib/black-friday/campaign";
import { useCountUp } from "@/lib/campaigns/useCountUp";
import c from "./campaigns.module.css";

const when = (iso: string) => new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", month: "short", day: "numeric", hour: "numeric" }).format(new Date(iso));

function Count({ value }: { value: number }) {
  return <>{Math.round(useCountUp(value)).toLocaleString("en-US")}</>;
}

/** Featured Black Friday card while the campaign is running: send rail, countdown and reach. */
export default function CampaignSpotlight({ data, now }: { data: BlackFridayCampaignSummary; now: number }) {
  const next = nextSend(data.steps, new Date(now));
  const m = data.metrics;
  return (
    <Link href={BLACK_FRIDAY_PATH} prefetch className={`${c.spotlight} ${c.rise}`} aria-label={`Open ${BLACK_FRIDAY_NAME} workspace`}>
      <div>
        <span className={c.spotEyebrow}><Sparkles size={14} /> Featured · {data.status === "Active" ? "Live now" : "Starting soon"}</span>
        <h2 className={`${c.spotTitle} font-serif`}>{BLACK_FRIDAY_NAME}</h2>
        <p className={c.spotText}>{BF_DESCRIPTION}</p>
        <div className={c.spotCountdown}>
          <CalendarClock size={16} />
          {next
            ? <span>Next: {SEND_STEPS.find((s) => s.id === next.step.id)?.label} · {when(next.at)} ET · <b>{countdown(Date.parse(next.at), now)}</b></span>
            : <span>All three sends are done</span>}
        </div>
      </div>

      <div className={c.spotRight}>
        <div className={c.spotSteps}>
          {SEND_STEPS.map((def) => {
            const step = data.steps.find((s) => s.id === def.id);
            const sent = step?.sent ?? 0;
            const eligible = step?.eligible ?? 0;
            const done = step?.state === "Sent" || (eligible > 0 && sent >= eligible);
            const live = !done && (step?.state === "Sending" || step?.state === "Partly sent");
            return (
              <div key={def.id} className={`${c.spotStep} ${live ? c.spotStepLive : ""}`}>
                <div className={c.spotStepTop}>
                  <span>{def.label}</span>
                  <span className={`${c.spotState} ${done ? c.spotStateDone : live ? c.spotStateLive : ""}`}>{done ? <><Check size={10} className="inline" /> Sent</> : live ? "Sending" : def.window}</span>
                </div>
                <p className={c.spotFigure}>{sent.toLocaleString("en-US")}<span>of {eligible.toLocaleString("en-US")}</span></p>
                <div className={c.spotBar}><i style={{ width: `${eligible ? Math.min(100, (sent / eligible) * 100) : 0}%` }} /></div>
              </div>
            );
          })}
        </div>
        <div className={c.spotStats}>
          <div className={c.spotStat}><b><Count value={m.reached} /></b><span>People reached</span></div>
          <div className={c.spotStat}><b><Count value={m.messagesSent} /></b><span>Messages sent</span></div>
          <div className={c.spotStat}><b><Count value={m.websiteLeads} /></b><span>Website leads</span></div>
          <div className={c.spotStat}><b><Count value={m.unsubscribed} /></b><span>Unsubscribed</span></div>
        </div>
        <span className={c.spotCta}>Open workspace <ArrowRight size={15} /></span>
      </div>
    </Link>
  );
}
