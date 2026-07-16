type BadgeVariant =
  | "live"
  | "pending"
  | "paused"
  | "booked"
  | "lost"
  | "new"
  | "contacted"
  | "nurture"
  | "not_contacted"
  | "sms_sent"
  | "email_sent"
  | "replied"
  | "converted"
  | "expired"
  | "scheduled"
  | "sent"
  | "opened"
  | "active"
  | "connected"
  | "disconnected"
  | "urgent"
  | "high"
  | "medium"
  | "low";
type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const tones: Record<BadgeVariant, Tone> = {
  live: "success",
  pending: "warning",
  paused: "neutral",
  booked: "success",
  lost: "danger",
  new: "info",
  contacted: "success",
  nurture: "info",
  not_contacted: "neutral",
  sms_sent: "info",
  email_sent: "info",
  replied: "success",
  converted: "success",
  expired: "danger",
  scheduled: "info",
  sent: "info",
  opened: "warning",
  active: "success",
  connected: "success",
  disconnected: "danger",
  urgent: "danger",
  high: "warning",
  medium: "warning",
  low: "info",
};
const variantLabels: Partial<Record<BadgeVariant, string>> = {
  live: "Live",
  not_contacted: "Not contacted",
  sms_sent: "SMS sent",
  email_sent: "Email sent",
  disconnected: "Disconnected",
};
const toneStyles: Record<
  Tone,
  { color: string; background: string; border: string }
> = {
  success: { color: "var(--success-text)", background: "var(--success-bg)", border: "var(--success-border)" },
  warning: { color: "var(--warning-text)", background: "var(--warning-bg)", border: "var(--warning-border)" },
  danger: { color: "var(--danger-text)", background: "var(--danger-bg)", border: "var(--danger-border)" },
  info: {
    color: "var(--info-text)",
    background: "var(--info-bg)",
    border: "var(--info-border)",
  },
  neutral: {
    color: "var(--neutral-text)",
    background: "var(--neutral-bg)",
    border: "var(--neutral-border)",
  },
};

interface StatusBadgeProps {
  variant: BadgeVariant;
  size?: "sm" | "md";
}
export default function StatusBadge({
  variant,
  size = "sm",
}: StatusBadgeProps) {
  const label =
    variantLabels[variant] ??
    variant.charAt(0).toUpperCase() + variant.slice(1).replaceAll("_", " ");
  const style = toneStyles[tones[variant] ?? "neutral"];
  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"}`}
      style={{
        color: style.color,
        backgroundColor: style.background,
        borderColor: style.border,
      }}
    >
      <span
        className="mr-1.5 size-1.5 rounded-full"
        style={{ backgroundColor: style.color }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
