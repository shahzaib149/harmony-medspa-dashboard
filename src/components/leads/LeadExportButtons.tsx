"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { downloadLeadExport } from "@/lib/leads/download-export";

export default function LeadExportButtons() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function download(format: "csv" | "xlsx") {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try { await downloadLeadExport(format); setMessage("All available history downloaded."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Export failed"); }
    finally { setBusy(false); }
  }
  return <div className="flex flex-wrap items-center gap-2">
    {(["csv", "xlsx"] as const).map((format) => <button key={format} type="button" disabled={busy} onClick={() => void download(format)} title="All sources and dates, regardless of page filters" className="flex min-h-10 items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 text-xs font-semibold text-[var(--text-primary)] disabled:opacity-50"><Download size={14} />{busy ? "Preparing…" : format === "csv" ? "Export CSV" : "Export Excel (source tabs)"}</button>)}
    <span className="text-xs text-[var(--text-muted)]">Every saved lead + all calls, including missed calls</span>
    {message && <span role="status" className="w-full text-xs text-[var(--text-primary)]">{message}</span>}
  </div>;
}
