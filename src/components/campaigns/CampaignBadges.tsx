import type { LeadCampaignSummary } from "@/lib/types/campaigns";

function tone(status: string) {
  if (status === "Active")
    return { color: "var(--healthy)", background: "var(--healthy-soft)" };
  if (status === "Completed")
    return {
      color: "var(--focus)",
      background: "color-mix(in srgb, var(--focus) 10%, transparent)",
    };
  if (status === "Stopped")
    return { color: "var(--danger)", background: "var(--danger-soft)" };
  if (status === "Paused")
    return { color: "var(--warning)", background: "var(--warning-soft)" };
  return { color: "var(--text-muted)", background: "var(--surface-hover)" };
}

export function CampaignStatusBadge({ status }: { status: string }) {
  const style = tone(status);
  return (
    <span
      className="inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{
        color: style.color,
        borderColor: `color-mix(in srgb, ${style.color} 28%, transparent)`,
        backgroundColor: style.background,
      }}
    >
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
                borderColor: `color-mix(in srgb, ${style.color} 24%, transparent)`,
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
