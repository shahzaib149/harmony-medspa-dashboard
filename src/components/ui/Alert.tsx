import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";

export type AlertVariant =
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

const variants = {
  info: {
    Icon: Info,
    color: "var(--info)",
    text: "var(--info-text)",
    background: "var(--info-bg)",
    border: "var(--info-border)",
  },
  success: {
    Icon: CheckCircle2,
    color: "var(--success)",
    text: "var(--success-text)",
    background: "var(--success-bg)",
    border: "var(--success-border)",
  },
  warning: {
    Icon: AlertTriangle,
    color: "var(--warning)",
    text: "var(--warning-text)",
    background: "var(--warning-bg)",
    border: "var(--warning-border)",
  },
  danger: {
    Icon: AlertCircle,
    color: "var(--danger)",
    text: "var(--danger-text)",
    background: "var(--danger-bg)",
    border: "var(--danger-border)",
  },
  neutral: {
    Icon: Info,
    color: "var(--text-secondary)",
    text: "var(--neutral-text)",
    background: "var(--neutral-bg)",
    border: "var(--neutral-border)",
  },
} satisfies Record<
  AlertVariant,
  {
    Icon: typeof Info;
    color: string;
    text: string;
    background: string;
    border: string;
  }
>;

export function Alert({
  variant = "neutral",
  title,
  children,
  action,
  className = "",
  role,
}: {
  variant?: AlertVariant;
  title: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  role?: "alert" | "status";
}) {
  const style = variants[variant];
  const { Icon } = style;

  return (
    <div
      role={role ?? (variant === "danger" ? "alert" : "status")}
      className={`rounded-2xl border p-4 ${className}`}
      style={{
        color: style.text,
        backgroundColor: style.background,
        borderColor: style.border,
      }}
    >
      <div className="flex items-start gap-3">
        <Icon
          aria-hidden="true"
          size={18}
          className="mt-0.5 shrink-0"
          style={{ color: style.color }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold leading-5">{title}</div>
              {children && (
                <div
                  className="mt-1 text-sm leading-6"
                  style={{ color: style.text }}
                >
                  {children}
                </div>
              )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
