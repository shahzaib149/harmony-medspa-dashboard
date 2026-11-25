"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ArrowRight, CircleAlert, Clock3, GitBranch, Gift, HeartHandshake, Mail, MessageSquare, RefreshCw, Sparkles, Zap } from "lucide-react";
import { CampaignStatusBadge } from "@/components/campaigns/CampaignBadges";
import { formatCampaignDate } from "@/lib/campaigns/campaign-date";
import { relativeTime } from "@/lib/campaigns/paginate";
import { usd, type CampaignCardModel, type CardIcon } from "@/lib/campaigns/card-model";
import { useCountUp } from "@/lib/campaigns/useCountUp";
import c from "./campaigns.module.css";

const ICONS: Record<CardIcon, ReactNode> = {
  zap: <Zap size={21} />, branch: <GitBranch size={21} />, sparkles: <Sparkles size={21} />, gift: <Gift size={21} />, heart: <HeartHandshake size={21} />,
};

export function LiveBadge() {
  return <span className={c.statusLive}><span className={c.liveDot} aria-hidden="true" /> Active</span>;
}

function Ring({ percent, label }: { percent: number; label: string }) {
  const r = 33;
  const length = 2 * Math.PI * r;
  return (
    <div className={c.ring} role="img" aria-label={`${percent}% ${label}`}>
      <svg viewBox="0 0 78 78" aria-hidden="true">
        <circle cx="39" cy="39" r={r} fill="none" strokeWidth="6" className={c.ringTrack} />
        <circle cx="39" cy="39" r={r} fill="none" strokeWidth="6" className={c.ringValue} strokeDasharray={length} strokeDashoffset={length * (1 - percent / 100)} />
      </svg>
      <span className={c.ringText}><b>{percent}%</b><span>{label}</span></span>
    </div>
  );
}

/** One campaign on /campaigns: accent strip, headline number with progress ring, three stats. */
export default function CampaignCard({ model, index, now }: { model: CampaignCardModel; index: number; now: number }) {
  const counted = useCountUp(model.headline.value);
  const shown = model.headline.format === "usd" ? usd(Math.round(counted)) : Math.round(counted).toLocaleString("en-US");
  const ago = relativeTime(model.lastActivity, now);
  return (
    <Link href={model.href} prefetch className={`${c.card} ${c.rise}`} style={{ "--accent": model.accent, "--i": index } as CSSProperties} aria-label={`Open ${model.name}`}>
      <div className={c.cardHead}>
        <div className="flex min-w-0 gap-3.5">
          <span className={c.cardIcon} aria-hidden="true">{ICONS[model.icon]}</span>
          <div className="min-w-0">
            <h2 className={c.cardName}>{model.name}</h2>
            <p className={c.cardDesc}>{model.description}</p>
          </div>
        </div>
        {model.status === "Active" ? <LiveBadge /> : <CampaignStatusBadge status={model.status} />}
      </div>

      <div className={c.chips}>
        <span className={`${c.chip} ${c.chipAccent}`}>{model.type === "Manual Enrollment" ? "Manual enrollment" : "Automatic"}</span>
        {model.channels.map((ch) => <span key={ch} className={c.chip}>{ch === "SMS" ? <MessageSquare size={11} /> : <Mail size={11} />} {ch === "SMS" ? "Text" : ch}</span>)}
        {model.chips.map((chip) => <span key={chip} className={c.chip}>{chip}</span>)}
      </div>

      <div className={c.headline}>
        <div className="min-w-0">
          <p className={c.headlineValue}>{shown}</p>
          <p className={c.headlineLabel}>{model.headline.label}</p>
        </div>
        <Ring percent={model.ring.percent} label={model.ring.label} />
      </div>

      <div className={c.stats}>
        {model.stats.map(([label, value]) => <div key={label} className={c.stat}><b>{value}</b><span>{label}</span></div>)}
      </div>

      <div className={c.cardFoot}>
        <time dateTime={model.lastActivity || undefined} title={formatCampaignDate(model.lastActivity || null, "No activity yet")}>
          <Clock3 size={13} /> {ago ? `Active ${ago}` : "No activity yet"}
        </time>
        <span className={c.open}>Open campaign <ArrowRight size={14} /></span>
      </div>
    </Link>
  );
}

/** Same shell when a section's numbers didn't load. */
export function FailedCampaignCard({ name, index, onRetry, retrying }: { name: string; index: number; onRetry: () => void; retrying: boolean }) {
  return (
    <div className={`${c.card} ${c.failed} ${c.rise}`} style={{ "--i": index } as CSSProperties}>
      <div className="grid justify-items-center gap-2">
        <span className={c.cardIcon}><CircleAlert size={20} /></span>
        <p className={c.cardName}>{name}</p>
        <p className="text-sm text-[var(--text-muted)]">Couldn&apos;t load this campaign&apos;s numbers.</p>
        <button type="button" className={c.btn} onClick={onRetry} disabled={retrying}><RefreshCw size={14} className={retrying ? "animate-spin" : ""} /> Try again</button>
      </div>
    </div>
  );
}
