"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  children?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  children,
  onConfirm,
  onCancel,
}: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    trigger.current = document.activeElement as HTMLElement;
    cancel.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onCancel();
      if (event.key !== "Tab" || !panel.current) return;
      const focusable = [
        ...panel.current.querySelectorAll<HTMLElement>(
          "button:not([disabled]),[href],input:not([disabled]),select:not([disabled])",
        ),
      ];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      trigger.current?.focus();
    };
  }, [loading, onCancel, open]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center p-0 sm:items-center sm:p-4"
      style={{ backgroundColor: "var(--overlay)" }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onCancel();
      }}
    >
      <div
        ref={panel}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
        className="w-full max-w-lg rounded-t-2xl border p-5 sm:rounded-2xl"
        style={{
          backgroundColor: "var(--surface-raised)",
          borderColor: destructive
            ? "color-mix(in srgb, var(--danger) 38%, var(--border-subtle))"
            : "color-mix(in srgb, var(--brand-primary) 32%, var(--border-subtle))",
          boxShadow: "var(--shadow-modal)",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="rounded-xl p-2"
            style={{
              color: destructive ? "var(--danger)" : "var(--brand-primary)",
              backgroundColor: destructive
                ? "var(--danger-soft)"
                : "var(--brand-primary-soft)",
            }}
          >
            <AlertTriangle size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="confirm-title"
              className="text-lg font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {title}
            </h2>
            <p
              id="confirm-description"
              className="mt-2 text-sm leading-6"
              style={{ color: "var(--text-muted)" }}
            >
              {description}
            </p>
          </div>
          <button
            aria-label="Close"
            disabled={loading}
            onClick={onCancel}
            className="grid size-10 place-items-center rounded-xl"
            style={{ color: "var(--text-muted)" }}
          >
            <X size={18} />
          </button>
        </div>
        {children && (
          <div
            className="mt-4 rounded-xl border p-4 text-sm"
            style={{
              backgroundColor: "var(--surface-2)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-secondary)",
            }}
          >
            {children}
          </div>
        )}
        <div className="mt-5 flex flex-col-reverse gap-2 min-[380px]:flex-row min-[380px]:justify-end">
          <button
            ref={cancel}
            disabled={loading}
            onClick={onCancel}
            className="min-h-11 rounded-xl border px-4 py-2.5 text-sm font-bold"
            style={{
              borderColor: "var(--border-subtle)",
              color: "var(--text-secondary)",
            }}
          >
            {cancelLabel}
          </button>
          <button
            disabled={loading}
            onClick={onConfirm}
            className="min-h-11 rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-50"
            style={{
              backgroundColor: destructive
                ? "var(--danger)"
                : "var(--brand-primary)",
              color: "var(--primary-foreground)",
            }}
          >
            {loading ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DestructiveConfirmDialog(props: Omit<Props, "destructive">) {
  return <ConfirmDialog {...props} destructive />;
}
export const BulkActionConfirmDialog = ConfirmDialog;
