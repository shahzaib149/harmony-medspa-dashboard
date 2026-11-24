"use client";

import { useState } from "react";
import { LeadDetailsModal } from "@/components/leads/LeadUi";
import { Toast } from "@/components/ui/Toast";
import { useAuth } from "@/contexts/AuthContext";
import type { Lead } from "@/lib/leads/map-lead";
import type { LeadType } from "@/lib/leads/classification";

const authHeaders = async (): Promise<HeadersInit> => ({ "Content-Type": "application/json" });

/**
 * The Leads page's lead popup, opened from a campaign workspace. Status, edits, Hayden
 * notification and reclassification work exactly as on Leads; deleting stays on Leads.
 */
export default function CampaignLeadModal({ lead, onClose, onUpdated }: {
  lead: Lead | null;
  onClose: () => void;
  /** Called with the saved lead so the workspace can update its row. */
  onUpdated: (lead: Lead) => void;
}) {
  const { can } = useAuth();
  const canUpdate = can("update:leads");
  const [notifying, setNotifying] = useState(false);
  const [notified, setNotified] = useState<Set<string>>(new Set());
  const [reclassifying, setReclassifying] = useState(false);
  const [toast, setToast] = useState<{ variant: "success" | "danger"; message: string } | null>(null);

  async function notify(target: Lead) {
    if (!canUpdate || notifying) return;
    setNotifying(true);
    try {
      const response = await fetch(`/api/airtable/leads/${target.id}/notify-hayden`, {
        method: "POST", credentials: "same-origin", headers: await authHeaders(),
        body: JSON.stringify({ notificationId: crypto.randomUUID() }),
      });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok || data.error) throw new Error(data.error || "Couldn’t notify Hayden. Try again.");
      setNotified((current) => new Set(current).add(target.id));
      setToast({ variant: "success", message: `Hayden notified about ${target.name || "this lead"}.` });
    } catch (error) {
      setToast({ variant: "danger", message: error instanceof Error ? error.message : "Couldn’t notify Hayden. Try again." });
    } finally {
      setNotifying(false);
    }
  }

  async function reclassify(target: Lead, leadType: LeadType) {
    if (!canUpdate || reclassifying) return;
    setReclassifying(true);
    try {
      const response = await fetch(`/api/airtable/leads/${target.id}/classification`, {
        method: "POST", credentials: "same-origin", headers: await authHeaders(), body: JSON.stringify({ leadType }),
      });
      const data = await response.json().catch(() => ({})) as { error?: string; lead?: Lead; stopError?: string | null };
      if (!response.ok || data.error || !data.lead) throw new Error(data.error || "Couldn’t change the classification. Try again.");
      onUpdated(data.lead);
      setToast(data.stopError
        ? { variant: "danger", message: `Classification saved, but nurture could not be stopped: ${data.stopError}` }
        : { variant: "success", message: `Marked as ${leadType}.` });
    } catch (error) {
      setToast({ variant: "danger", message: error instanceof Error ? error.message : "Couldn’t change the classification. Try again." });
    } finally {
      setReclassifying(false);
    }
  }

  return (
    <>
      <LeadDetailsModal
        lead={lead}
        duplicate={Boolean(lead?.duplicate)}
        onClose={onClose}
        onStatusChange={onUpdated}
        canUpdate={canUpdate}
        canDelete={false}
        onDelete={() => undefined}
        getAuthHeaders={authHeaders}
        onLeadUpdate={(updated) => { onUpdated(updated); setToast({ variant: "success", message: "Lead updated" }); }}
        onNotify={(target) => void notify(target)}
        notifying={notifying}
        notified={lead ? notified.has(lead.id) : false}
        onReclassify={(target, leadType) => void reclassify(target, leadType)}
        reclassifying={reclassifying}
      />
      {toast ? <Toast variant={toast.variant} message={toast.message} onClose={() => setToast(null)} /> : null}
    </>
  );
}
