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

const variantStyles: Record<BadgeVariant, string> = {
  live: "bg-green-50 text-green-700 border border-green-200",
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  paused: "bg-gray-100 text-gray-600 border border-gray-200",
  booked: "bg-teal-50 text-teal-700 border border-teal-200",
  lost: "bg-red-50 text-red-700 border border-red-200",
  new: "bg-blue-50 text-blue-700 border border-blue-200",
  contacted: "bg-green-50 text-green-700 border border-green-200",
  nurture: "bg-purple-50 text-purple-700 border border-purple-200",
  not_contacted: "bg-gray-100 text-gray-600 border border-gray-200",
  sms_sent: "bg-blue-50 text-blue-700 border border-blue-200",
  email_sent: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  replied: "bg-green-50 text-green-700 border border-green-200",
  converted: "bg-green-50 text-green-700 border border-green-200",
  expired: "bg-red-50 text-red-700 border border-red-200",
  scheduled: "bg-blue-50 text-blue-700 border border-blue-200",
  sent: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  opened: "bg-amber-50 text-amber-700 border border-amber-200",
  active: "bg-green-50 text-green-700 border border-green-200",
  connected: "bg-green-50 text-green-700 border border-green-200",
  disconnected: "bg-red-50 text-red-700 border border-red-200",
  urgent: "bg-red-100 text-red-700 border border-red-300",
  high: "bg-orange-50 text-orange-700 border border-orange-200",
  medium: "bg-amber-50 text-amber-700 border border-amber-200",
  low: "bg-blue-50 text-blue-700 border border-blue-200",
};

const variantLabels: Partial<Record<BadgeVariant, string>> = {
  live: "Live",
  not_contacted: "Not Contacted",
  sms_sent: "SMS Sent",
  email_sent: "Email Sent",
  disconnected: "Disconnected",
};

interface StatusBadgeProps {
  variant: BadgeVariant;
  size?: "sm" | "md";
}

export default function StatusBadge({ variant, size = "sm" }: StatusBadgeProps) {
  const label =
    variantLabels[variant] ??
    variant.charAt(0).toUpperCase() + variant.slice(1);

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium capitalize ${
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      } ${variantStyles[variant] ?? "bg-gray-100 text-gray-600"}`}
    >
      {label}
    </span>
  );
}
