"use client";

import {
  AlertTriangle,
  Link2,
  Loader2,
  Search,
  Trash2,
  UserRoundSearch,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import {
  ConfirmDialog,
  DestructiveConfirmDialog,
} from "@/components/ui/ConfirmDialog";
import { CampaignStatusBadge } from "@/components/campaigns/CampaignBadges";
import { formatCampaignDate } from "@/lib/campaigns/campaign-date";
import type { NurtureEnrollment } from "@/lib/types/campaigns";
import type { MessageLog } from "@/types/message-log";

type LeadOption = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
};

export type CleanupAction = "review" | "reconnect" | "remove";

type Props = {
  open: boolean;
  enrollments: NurtureEnrollment[];
  messages: MessageLog[];
  canManage: boolean;
  initialEnrollmentId?: string | null;
  initialAction?: CleanupAction;
  onClose: () => void;
  onChanged: (message: string) => Promise<void>;
};

function display(value: string | null | undefined) {
  return value?.trim() || "Not available";
}

function contact(lead: LeadOption) {
  return [lead.email, lead.phone].filter(Boolean).join(" · ") || "No contact details";
}

export default function DisconnectedEnrollmentCleanupModal({
  open,
  enrollments,
  messages,
  canManage,
  initialEnrollmentId,
  initialAction = "review",
  onClose,
  onChanged,
}: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadOption | null>(null);
  const [removeTarget, setRemoveTarget] = useState<NurtureEnrollment | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  const selectedEnrollment = useMemo(
    () => enrollments.find((item) => item.airtableRecordId === selectedId) ?? null,
    [enrollments, selectedId],
  );

  useEffect(() => {
    if (!open) return;
    const initial =
      enrollments.find((item) => item.airtableRecordId === initialEnrollmentId) ??
      enrollments[0] ??
      null;
    setSelectedId(initial?.airtableRecordId ?? null);
    setSearchOpen(initialAction === "reconnect" && canManage);
    setRemoveTarget(initialAction === "remove" && canManage ? initial : null);
    setQuery("");
    setSelectedLead(null);
    setError("");
  }, [canManage, enrollments, initialAction, initialEnrollmentId, open]);

  useEffect(() => {
    if (!open) return;
    trigger.current = document.activeElement as HTMLElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => closeButton.current?.focus(), 0);

    function onKeyDown(event: KeyboardEvent) {
      if (removeTarget || selectedLead) return;
      if (event.key === "Escape" && !working) onClose();
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
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger.current?.focus();
    };
  }, [onClose, open, removeTarget, selectedLead, working]);

  useEffect(() => {
    if (!open || !searchOpen || !canManage) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({
          pageSize: "20",
          page: "1",
          sort: "newest",
        });
        if (query.trim()) params.set("search", query.trim());
        const response = await fetch(`/api/airtable/leads?${params}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const body = (await response.json()) as {
          error?: string;
          leads?: LeadOption[];
        };
        if (!response.ok) throw new Error(body.error || "Leads could not be loaded");
        setLeads(body.leads ?? []);
        setError("");
      } catch (caught) {
        if (controller.signal.aborted) return;
        setLeads([]);
        setError(caught instanceof Error ? caught.message : "Leads could not be loaded");
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [canManage, open, query, searchOpen]);

  function startReconnect(item: NurtureEnrollment) {
    setSelectedId(item.airtableRecordId);
    setSearchOpen(true);
    setSelectedLead(null);
    setError("");
  }

  async function reconnect() {
    if (!selectedEnrollment || !selectedLead) return;
    setWorking(true);
    setError("");
    try {
      const response = await fetch(
        `/api/airtable/nurture-enrollments/${selectedEnrollment.airtableRecordId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "relink", leadRecordId: selectedLead.id }),
        },
      );
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error || "The enrollment could not be reconnected");
      const leadName = selectedLead.name || "the selected Lead";
      setSelectedLead(null);
      setSearchOpen(false);
      await onChanged(`Enrollment reconnected to ${leadName}.`);
      if (enrollments.length <= 1) onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The enrollment could not be reconnected");
    } finally {
      setWorking(false);
    }
  }

  async function remove() {
    if (!removeTarget) return;
    setWorking(true);
    setError("");
    try {
      const response = await fetch(
        `/api/airtable/nurture-enrollments/${removeTarget.airtableRecordId}`,
        { method: "DELETE" },
      );
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error || "The enrollment could not be removed");
      setRemoveTarget(null);
      await onChanged("Disconnected enrollment removed.");
      if (enrollments.length <= 1) onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The enrollment could not be removed");
    } finally {
      setWorking(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-stretch justify-center sm:items-center sm:p-4"
      style={{ backgroundColor: "var(--overlay)" }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !working) onClose();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cleanup-title"
        className="flex h-dvh w-full flex-col border sm:h-auto sm:max-h-[88vh] sm:max-w-5xl sm:rounded-2xl"
        style={{
          backgroundColor: "var(--surface-raised)",
          borderColor: "var(--border-subtle)",
          boxShadow: "var(--shadow-modal)",
        }}
      >
        <header
          className="flex items-start gap-3 border-b px-4 py-4 sm:px-6"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <span
            className="grid size-10 shrink-0 place-items-center rounded-xl"
            style={{ color: "var(--warning)", backgroundColor: "var(--warning-bg)" }}
          >
            <AlertTriangle size={19} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="cleanup-title" className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Disconnected Enrollments
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Review records whose linked Lead is no longer available.
            </p>
          </div>
          <button
            ref={closeButton}
            type="button"
            aria-label="Close cleanup"
            onClick={onClose}
            disabled={working}
            className="grid size-10 shrink-0 place-items-center rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ color: "var(--text-secondary)", outlineColor: "var(--focus)" }}
          >
            <X size={19} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {error && (
            <Alert variant="danger" title="Cleanup action could not be completed" className="mb-4" role="alert">
              {error}
            </Alert>
          )}

          {!canManage && (
            <Alert variant="info" title="Admin access is required" className="mb-4">
              You can review these enrollment details, but only an Admin can reconnect a Lead or remove an enrollment.
            </Alert>
          )}

          {searchOpen && selectedEnrollment ? (
            <section aria-labelledby="lead-selector-title">
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="mb-4 text-sm font-bold"
                style={{ color: "var(--brand-primary)" }}
              >
                ← Back to enrollment review
              </button>
              <div className="mb-4">
                <h3 id="lead-selector-title" className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                  Reconnect Lead
                </h3>
                <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                  Enrollment {selectedEnrollment.airtableRecordId}. Search by name, email, or phone.
                </p>
              </div>
              <label className="relative block">
                <span className="sr-only">Search Leads by name, email, or phone</span>
                <Search
                  className="pointer-events-none absolute left-3 top-3.5"
                  size={17}
                  style={{ color: "var(--text-muted)" }}
                />
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search name, email, or phone"
                  className="h-12 w-full rounded-xl border pl-10 pr-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    color: "var(--text-primary)",
                    backgroundColor: "var(--surface-1)",
                    borderColor: "var(--border-strong)",
                    outlineColor: "var(--focus)",
                  }}
                />
                {searching && (
                  <Loader2
                    className="absolute right-3 top-3.5 animate-spin"
                    size={17}
                    style={{ color: "var(--brand-primary)" }}
                    aria-label="Searching"
                  />
                )}
              </label>
              <div className="mt-4 space-y-2" aria-live="polite">
                {!searching && leads.length === 0 ? (
                  <div
                    className="rounded-2xl border p-8 text-center"
                    style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--surface-2)" }}
                  >
                    <UserRoundSearch className="mx-auto" size={24} style={{ color: "var(--text-muted)" }} />
                    <p className="mt-3 text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      No Leads found
                    </p>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                      Try another name, email, or phone number.
                    </p>
                  </div>
                ) : (
                  leads.map((lead) => (
                    <button
                      key={lead.id}
                      type="button"
                      onClick={() => setSelectedLead(lead)}
                      className="flex min-h-16 w-full items-center gap-3 rounded-xl border p-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{
                        borderColor: "var(--border-subtle)",
                        backgroundColor: "var(--surface-1)",
                        outlineColor: "var(--focus)",
                      }}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                          {lead.name || "Unnamed Lead"}
                        </span>
                        <span className="mt-1 block break-anywhere text-xs" style={{ color: "var(--text-muted)" }}>
                          {contact(lead)}
                        </span>
                      </span>
                      <CampaignStatusBadge status={lead.status || "New"} />
                    </button>
                  ))
                )}
              </div>
            </section>
          ) : enrollments.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                No disconnected enrollments remain
              </p>
              <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                Campaign Leads and summary counts are up to date.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {enrollments.map((item) => {
                const messageCount = messages.filter(
                  (message) =>
                    Boolean(item.linkedLeadId) &&
                    message.recipientLeadId === item.linkedLeadId,
                ).length;
                return (
                  <article
                    key={item.airtableRecordId}
                    className="rounded-2xl border p-4 sm:p-5"
                    style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--surface-2)" }}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                          Lead unavailable
                        </p>
                        <p className="mt-1 break-all font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                          {item.airtableRecordId}
                        </p>
                      </div>
                      <CampaignStatusBadge status={item.status} />
                    </div>
                    <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        ["Enrollment record ID", item.airtableRecordId],
                        ["Campaign", "14-Day Nurture"],
                        ["Status", display(item.status)],
                        ["Current Step", display(item.currentStep)],
                        ["Next Send At", formatCampaignDate(item.nextSendAt)],
                        ["Last Sent At", formatCampaignDate(item.lastSentAt)],
                        ["Created At", formatCampaignDate(item.createdAt)],
                        ["Stop Reason", display(item.stopReason)],
                        ["Notes", display(item.notes)],
                        [
                          "Message Log records",
                          messageCount > 0
                            ? `Yes · ${messageCount} associated record${messageCount === 1 ? "" : "s"}`
                            : "No associated records",
                        ],
                      ].map(([label, value]) => (
                        <div key={label} className="min-w-0">
                          <dt className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                            {label}
                          </dt>
                          <dd className="mt-1 break-words text-sm" style={{ color: "var(--text-secondary)" }}>
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <div className="mt-5 flex flex-col gap-2 border-t pt-4 min-[430px]:flex-row min-[430px]:flex-wrap" style={{ borderColor: "var(--border-subtle)" }}>
                      {canManage && (
                        <>
                          <button
                            type="button"
                            onClick={() => startReconnect(item)}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                            style={{
                              color: "var(--primary-foreground)",
                              backgroundColor: "var(--brand-primary)",
                              outlineColor: "var(--focus)",
                            }}
                          >
                            <Link2 size={16} /> Reconnect Lead
                          </button>
                          <button
                            type="button"
                            onClick={() => setRemoveTarget(item)}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                            style={{
                              color: "var(--danger-text)",
                              backgroundColor: "var(--danger-bg)",
                              borderColor: "var(--danger-border)",
                              outlineColor: "var(--focus)",
                            }}
                          >
                            <Trash2 size={16} /> Remove Enrollment
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={onClose}
                        className="min-h-11 rounded-xl border px-4 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                        style={{
                          color: "var(--text-secondary)",
                          borderColor: "var(--border-strong)",
                          outlineColor: "var(--focus)",
                        }}
                      >
                        Keep for Review
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(selectedLead && selectedEnrollment)}
        title="Relink this enrollment?"
        description="Only the enrollment's linked Lead field will change. Schedule and delivery fields will remain unchanged."
        confirmLabel="Reconnect Lead"
        loading={working}
        loadingLabel="Reconnecting…"
        onCancel={() => setSelectedLead(null)}
        onConfirm={() => void reconnect()}
      >
        <div className="space-y-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider">Enrollment</p>
            <p className="mt-1 break-all font-mono">{selectedEnrollment?.airtableRecordId}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider">New Lead</p>
            <p className="mt-1 font-bold">{selectedLead?.name || "Unnamed Lead"}</p>
            {selectedLead && <p className="mt-1 break-anywhere">{contact(selectedLead)}</p>}
          </div>
        </div>
      </ConfirmDialog>

      <DestructiveConfirmDialog
        open={Boolean(removeTarget)}
        title="Remove this disconnected enrollment?"
        description="This deletes only the disconnected Nurture Enrollment record. It does not delete any Lead or Message Log record."
        confirmLabel="Remove Enrollment"
        loading={working}
        loadingLabel="Removing…"
        onCancel={() => setRemoveTarget(null)}
        onConfirm={() => void remove()}
      >
        <p>
          Enrollment: <b className="break-all font-mono">{removeTarget?.airtableRecordId}</b>
        </p>
      </DestructiveConfirmDialog>
    </div>
  );
}
