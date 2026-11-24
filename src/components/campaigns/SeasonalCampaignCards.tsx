"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Gift, Sparkles } from "lucide-react";
import { CampaignStatusBadge } from "@/components/campaigns/CampaignBadges";
import { formatCampaignDate } from "@/lib/campaigns/campaign-date";
import { BLACK_FRIDAY_NAME, BLACK_FRIDAY_PATH, type BlackFridayCampaignSummary } from "@/lib/black-friday/campaign";
import { GIFT_CARDS_NAME, GIFT_CARDS_PATH, type GiftCardCampaignSummary } from "@/lib/gift-cards/campaign";

const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n % 1 ? 2 : 0 });

/** Card shell shared by the Black Friday and Gift Card campaigns (matches ReactivationCampaignCard). */
function Card({ href, icon, name, description, status, tags, stats, lastActivity }: {
  href: string; icon: ReactNode; name: string; description: string; status: string;
  tags: string[]; stats: [string, ReactNode][]; lastActivity: string;
}) {
  return (
    <Link
      href={href}
      prefetch
      className="group block rounded-2xl border p-4 transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] sm:p-5"
      style={{ background: "var(--surface-1)", borderColor: "color-mix(in srgb, var(--brand-primary) 24%, var(--border-subtle))", color: "var(--text-primary)" }}
    >
      <article>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">{icon}</div>
            <div className="min-w-0">
              <h2 className="text-base font-bold sm:text-lg">{name}</h2>
              <p className="mt-1 line-clamp-2 text-sm leading-5 text-[var(--text-muted)]">{description}</p>
            </div>
          </div>
          <CampaignStatusBadge status={status} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-[var(--text-muted)]">
          {tags.map((tag) => <span key={tag} className="rounded-full bg-[var(--surface-2)] px-2 py-1">{tag}</span>)}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map(([label, value]) => (
            <div key={label} className="rounded-xl bg-[var(--surface-2)] px-3 py-2.5">
              <p className="font-bold tabular-nums">{value}</p>
              <p className="text-[10px] text-[var(--text-muted)]">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-3">
          <p className="text-xs text-[var(--text-muted)]">Last activity: {formatCampaignDate(lastActivity || null, "No activity yet")}</p>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--brand-primary)]">
            Open campaign <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </article>
    </Link>
  );
}

function matches(name: string, description: string, state: string, query: string, status: string, type: string) {
  return `${name} ${description}`.toLowerCase().includes(query.toLowerCase()) && (type === "All" || type === "Automatic") && (status === "All" || status === state);
}

const BF_DESCRIPTION = "Hayden's members and patients: early access Nov 23–26, sale Nov 27–30, plus website Black Friday leads.";
const GIFT_DESCRIPTION = "Website gift card requests. Buy $100+ Nov 27–30 and get 10% back.";

export function BlackFridayCampaignCard({ data, query, status, type }: { data: BlackFridayCampaignSummary | null; query: string; status: string; type: string }) {
  const state = data?.status ?? "Active";
  if (!matches(BLACK_FRIDAY_NAME, BF_DESCRIPTION, state, query, status, type)) return null;
  const early = data?.steps.find((step) => step.id === "Members Early Access");
  return (
    <Card
      href={BLACK_FRIDAY_PATH}
      icon={<Sparkles size={20} />}
      name={BLACK_FRIDAY_NAME}
      description={BF_DESCRIPTION}
      status={state}
      tags={["Automatic", "Email", "SMS"]}
      stats={[
        ["Contacts", data?.metrics.contacts ?? 0],
        ["Members", data?.metrics.members ?? 0],
        ["Early access sent", early ? `${early.sent}/${early.eligible}` : 0],
        ["Messages", data?.metrics.messagesSent ?? 0],
      ]}
      lastActivity={data?.lastActivity ?? ""}
    />
  );
}

export function GiftCardCampaignCard({ data, query, status, type }: { data: GiftCardCampaignSummary | null; query: string; status: string; type: string }) {
  const state = data?.status ?? "Active";
  if (!matches(GIFT_CARDS_NAME, GIFT_DESCRIPTION, state, query, status, type)) return null;
  return (
    <Card
      href={GIFT_CARDS_PATH}
      icon={<Gift size={20} />}
      name={GIFT_CARDS_NAME}
      description={GIFT_DESCRIPTION}
      status={state}
      tags={["Automatic", "Email", data?.bonus === "Live" ? "Bonus live" : data?.bonus === "Upcoming" ? "Bonus Nov 27–30" : "Bonus ended"]}
      stats={[
        ["Requests", data?.metrics.requests ?? 0],
        ["Open", data?.metrics.open ?? 0],
        ["Requested", usd(data?.metrics.amountRequested ?? 0)],
        ["Confirmations", data?.metrics.confirmations ?? 0],
      ]}
      lastActivity={data?.lastActivity ?? ""}
    />
  );
}
