"use client";

import Link from "next/link";
import { ArrowRight, HeartHandshake } from "lucide-react";
import { DEFAULT_CAMPAIGN } from "@/lib/reactivation/model";
import { REACTIVATION_PATH, type ReactivationCampaignData } from "@/lib/reactivation/campaign";
import { formatCampaignDate } from "@/lib/campaigns/campaign-date";
import { CampaignStatusBadge } from "@/components/campaigns/CampaignBadges";

export type ReactivationCampaignSummary = Pick<
  ReactivationCampaignData,
  "campaign" | "metrics" | "paused" | "lastActivity" | "generatedAt"
>;

export default function ReactivationCampaignCard({
  query,
  status,
  type,
  data,
}: {
  query: string;
  status: string;
  type: string;
  data: ReactivationCampaignSummary | null;
}) {
  const state = data?.metrics.active ? "Active" : data?.paused ? "Paused" : "Idle";
  const matches =
    DEFAULT_CAMPAIGN.toLowerCase().includes(query.toLowerCase()) &&
    (type === "All" || type === "Manual Enrollment") &&
    (status === "All" || status === state);
  if (!matches) return null;

  const metrics = data?.metrics;
  return (
    <Link
      href={REACTIVATION_PATH}
      prefetch
      className="group block rounded-2xl border p-4 transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] sm:p-5"
      style={{
        background: "var(--surface-1)",
        borderColor: "color-mix(in srgb, var(--brand-primary) 24%, var(--border-subtle))",
        color: "var(--text-primary)",
      }}
    >
      <article>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
              <HeartHandshake size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold sm:text-lg">{DEFAULT_CAMPAIGN}</h2>
              <p className="mt-1 line-clamp-2 text-sm leading-5 text-[var(--text-muted)]">
                Three-step email follow-up for returning patients.
              </p>
            </div>
          </div>
          <CampaignStatusBadge status={state} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-[var(--text-muted)]">
          <span className="rounded-full bg-[var(--surface-2)] px-2 py-1">Manual Enrollment</span>
          <span className="rounded-full bg-[var(--surface-2)] px-2 py-1">Email</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["Patients", metrics?.total ?? 0],
            ["Active", metrics?.active ?? 0],
            ["Completed", metrics?.completed ?? 0],
            ["Emails sent", metrics?.email ?? 0],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-[var(--surface-2)] px-3 py-2.5">
              <p className="font-bold tabular-nums">{value}</p>
              <p className="text-[10px] text-[var(--text-muted)]">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-3">
          <p className="text-xs text-[var(--text-muted)]">
            Last activity: {formatCampaignDate(data?.lastActivity || null, "No activity yet")}
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--brand-primary)]">
            Open campaign <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </article>
    </Link>
  );
}
