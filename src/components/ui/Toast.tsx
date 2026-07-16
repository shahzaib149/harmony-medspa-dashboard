"use client";

import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import type { AlertVariant } from "./Alert";

const toastStyles = {
  success: {
    Icon: CheckCircle2,
    color: "var(--success-text)",
    background: "var(--success-bg)",
    border: "var(--success-border)",
  },
  warning: {
    Icon: AlertTriangle,
    color: "var(--warning-text)",
    background: "var(--warning-bg)",
    border: "var(--warning-border)",
  },
  danger: {
    Icon: AlertCircle,
    color: "var(--danger-text)",
    background: "var(--danger-bg)",
    border: "var(--danger-border)",
  },
  info: {
    Icon: Info,
    color: "var(--info-text)",
    background: "var(--info-bg)",
    border: "var(--info-border)",
  },
} as const;

export function Toast({
  variant,
  message,
  onClose,
}: {
  variant: Exclude<AlertVariant, "neutral">;
  message: string;
  onClose: () => void;
}) {
  const style = toastStyles[variant];
  const { Icon } = style;
  return (
    <div
      role={variant === "danger" ? "alert" : "status"}
      className="fixed inset-x-4 top-4 z-[110] mx-auto flex max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-bold sm:inset-x-auto sm:right-5 sm:top-5 sm:mx-0"
      style={{
        color: style.color,
        backgroundColor: style.background,
        borderColor: style.border,
        boxShadow: "var(--shadow-modal)",
      }}
    >
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1 leading-5">{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="grid size-8 shrink-0 place-items-center rounded-lg"
        aria-label="Dismiss notification"
      >
        <X size={15} />
      </button>
    </div>
  );
}
