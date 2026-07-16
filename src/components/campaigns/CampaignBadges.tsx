import type { LeadCampaignSummary } from "@/lib/types/campaigns";

function tone(status: string) {
  if (status === "Active")
    return { color: "var(--success-text)", background: "var(--success-bg)", border: "var(--success-border)" };
  if (status === "Completed")
    return {
      color: "var(--info-text)",
      background: "var(--info-bg)",
      border: "var(--info-border)",
    };
  if (status === "Stopped")
    return { color: "var(--danger-text)", background: "var(--danger-bg)", border: "var(--danger-border)" };
  if (status === "Paused")
    return { color: "var(--warning-text)", background: "var(--warning-bg)", border: "var(--warning-border)" };
  return { color: "var(--neutral-text)", background: "var(--neutral-bg)", border: "var(--neutral-border)" };
}

export function CampaignStatusBadge({ status }: { status: string }) {
  const style = tone(status);
  return (
    <span
      className="inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{
        color: style.color,
        borderColor: style.border,
        backgroundColor: style.background,
      }}
    >
      <span className="mr-1.5 size-1.5 rounded-full" style={{ backgroundColor: style.color }} aria-hidden="true" />
      {status}
    </span>
  );
}

export function LeadCampaignBadges({
  campaigns,
}: {
  campaigns: LeadCampaignSummary[];
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {campaigns.length ? (
        campaigns.map((item) => {
          const style = tone(item.status);
          return (
            <span
              key={`${item.slug}-${item.enrollmentId ?? item.status}`}
              className="rounded-full border px-2 py-1 text-[10px]"
              style={{
                color: style.color,
                borderColor: style.border,
                backgroundColor: style.background,
              }}
            >
              {item.campaign} · {item.status}
            </span>
          );
        })
      ) : (
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          No campaign
        </span>
      )}
    </div>
  );
}

export const EnrollmentStatusBadge = CampaignStatusBadge;
