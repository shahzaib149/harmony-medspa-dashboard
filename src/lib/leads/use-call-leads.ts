"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { countsAsRealLead } from "./classification";
import { callMarker, type CallRecord } from "./call-records";

type ExistingLead = { message?: string; notes?: string; leadType?: string; isRealLead?: boolean };
type LinkedLead = { text: string; real: boolean };

export type CallLeadsData = {
  /** null while loading. */
  calls: CallRecord[] | null;
  loadError: string;
  /** True until the saved Call Leads have been checked for call markers. */
  checking: boolean;
  /** Calls that already have a lead record ("Add details" was used). */
  addedIds: Set<string>;
  /** Calls whose saved lead was later marked as not a lead (a subset of addedIds). */
  notALeadIds: Set<string>;
  markAdded: (id: string) => void;
  reload: () => Promise<void>;
};

/**
 * Loads the Calls table and the saved "Call Leads" leads once, so the Leads page
 * tab badge, KPI cards and the call table all agree on which calls still need details.
 */
export function useCallLeads(): CallLeadsData {
  const [calls, setCalls] = useState<CallRecord[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [linkedLeads, setLinkedLeads] = useState<LinkedLead[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [checking, setChecking] = useState(true);

  const loadAddedCalls = useCallback(async () => {
    try {
      const items: ExistingLead[] = [];
      let cursor: string | null = null;
      do {
        // view=all: the API defaults to Real Leads only, which would hide a call
        // lead later marked "Not a lead" and offer Add details for its call again.
        const params = new URLSearchParams({ source: "Call Leads", view: "all", pageSize: "50" });
        if (cursor) params.set("cursor", cursor);
        const response = await fetch("/api/airtable/leads?" + params, {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!response.ok) return;
        const body = await response.json() as { items?: ExistingLead[]; nextCursor?: string | null };
        items.push(...body.items ?? []);
        cursor = body.nextCursor ?? null;
      } while (cursor);
      setLinkedLeads(items.map((lead) => ({
        text: (lead.message ?? "") + "\n" + (lead.notes ?? ""),
        real: countsAsRealLead({ leadType: lead.leadType ?? "", isRealLead: lead.isRealLead }),
      })));
    } finally {
      setChecking(false);
    }
  }, []);

  const loadCalls = useCallback(async () => {
    setLoadError("");
    try {
      const response = await fetch("/api/calls", { cache: "no-store", credentials: "same-origin" });
      const body = await response.json().catch(() => ({})) as { calls?: CallRecord[]; error?: string };
      if (!response.ok || !Array.isArray(body.calls)) throw new Error(body.error || "Call history is temporarily unavailable.");
      setCalls(body.calls);
    } catch (event) {
      setLoadError(event instanceof Error ? event.message : "Call history is temporarily unavailable.");
    }
  }, []);

  useEffect(() => {
    void loadAddedCalls();
    void loadCalls();
  }, [loadAddedCalls, loadCalls]);

  const { addedIds, notALeadIds } = useMemo(() => {
    const added = new Set(savedIds);
    const notALead = new Set<string>();
    for (const call of calls ?? []) {
      const leads = linkedLeads.filter((lead) => lead.text.includes(callMarker(call.id)));
      if (!leads.length) continue;
      added.add(call.id);
      // Saved in this session means it was just added as a lead.
      if (!savedIds.has(call.id) && leads.every((lead) => !lead.real)) notALead.add(call.id);
    }
    return { addedIds: added, notALeadIds: notALead };
  }, [calls, linkedLeads, savedIds]);

  const markAdded = useCallback((id: string) => setSavedIds((current) => new Set(current).add(id)), []);
  const reload = useCallback(async () => {
    await Promise.all([loadCalls(), loadAddedCalls()]);
  }, [loadAddedCalls, loadCalls]);

  return { calls, loadError, checking, addedIds, notALeadIds, markAdded, reload };
}
