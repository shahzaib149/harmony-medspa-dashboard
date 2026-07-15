"use client";

import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type Metric = {
  month: string;
  totalVisits: number;
  newPatients: number;
};

function monthNow() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
  })
    .format(new Date())
    .slice(0, 7);
}

export default function UpdateClinicMetricsModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (metric: Metric) => void;
}) {
  const [month, setMonth] = useState(monthNow());
  const [visits, setVisits] = useState("");
  const [patients, setPatients] = useState("");
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (!open) return;
    void fetch("/api/airtable/clinic-metrics", {
      cache: "no-store",
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        setMetrics(body.metrics ?? []);
      })
      .catch((event) =>
        setError(
          event instanceof Error ? event.message : "Clinic Metrics could not be loaded",
        ),
      );
  }, [open]);

  useEffect(() => {
    const existing = metrics.find((item) => item.month === month);
    setVisits(existing ? String(existing.totalVisits) : "");
    setPatients(existing ? String(existing.newPatients) : "");
  }, [metrics, month]);

  if (!open) return null;

  const total = Number(visits);
  const newPatients = Number(patients);
  const valid =
    month && Number.isInteger(total) && total >= 0 && Number.isInteger(newPatients) && newPatients >= 0;
  const unusual = valid && newPatients > total;

  async function save() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/airtable/clinic-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, totalVisits: total, newPatients }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      onSaved(body.metric);
      onClose();
    } catch (event) {
      setError(
        event instanceof Error ? event.message : "Clinic Metrics could not be saved",
      );
    } finally {
      setSaving(false);
      setConfirm(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="metrics-title"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5"
      >
        <h2
          id="metrics-title"
          className="font-serif text-2xl text-[var(--text-primary)]"
        >
          Update monthly clinic metrics
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <label>
            <span className="text-xs font-bold text-[var(--text-secondary)]">
              Month
            </span>
            <input
              type="month"
              required
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 text-[var(--text-primary)]"
            />
          </label>
          <label>
            <span className="text-xs font-bold text-[var(--text-secondary)]">
              Total Visits
            </span>
            <input
              type="number"
              min="0"
              step="1"
              value={visits}
              onChange={(event) => setVisits(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 text-[var(--text-primary)]"
            />
          </label>
          <label>
            <span className="text-xs font-bold text-[var(--text-secondary)]">
              New Patients
            </span>
            <input
              type="number"
              min="0"
              step="1"
              value={patients}
              onChange={(event) => setPatients(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 text-[var(--text-primary)]"
            />
          </label>
        </div>
        {unusual && (
          <p className="mt-3 text-sm text-[var(--warning)]">
            New Patients exceeds Total Visits. Confirm these values before
            saving.
          </p>
        )}
        {error && (
          <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-sm text-[var(--text-secondary)]"
          >
            Cancel
          </button>
          <button
            disabled={!valid || saving}
            onClick={() => (unusual ? setConfirm(true) : void save())}
            className="rounded-xl bg-[var(--brand-primary)] px-4 py-2 text-sm font-bold text-[var(--primary-foreground)] disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save metrics"}
          </button>
        </div>
      </div>
      <ConfirmDialog
        open={confirm}
        title="Save unusual clinic metrics?"
        description="New Patients is greater than Total Visits for this month. Save only if both values are correct."
        confirmLabel="Save metrics"
        loading={saving}
        onCancel={() => setConfirm(false)}
        onConfirm={() => void save()}
      />
    </div>
  );
}