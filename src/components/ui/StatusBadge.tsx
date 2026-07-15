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
const toneStyles: Record<Tone, { color: string; background: string }> = {
  success: { color: "var(--healthy)", background: "var(--healthy-soft)" },
  warning: { color: "var(--warning)", background: "var(--warning-soft)" },
  danger: { color: "var(--danger)", background: "var(--danger-soft)" },
  info: {
    color: "var(--focus)",
    background: "color-mix(in srgb, var(--focus) 11%, transparent)",
  },
  neutral: {
    color: "var(--text-secondary)",
    background: "var(--surface-hover)",
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
        borderColor: `color-mix(in srgb, ${style.color} 25%, transparent)`,
      }}
    >
      {label}
    </span>
  );
}
