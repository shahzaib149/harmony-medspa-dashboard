"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { BlogRecord, BlogStatus } from "@/lib/blogs/types";

export type BlogLifecycleTarget = { id: string; title: string; slug: string; status: BlogStatus };
type PendingAction = "archive" | "restore" | "delete";
type ToastMessage = { variant: "success" | "warning" | "danger"; message: string };
type PublicationSync = { ok: boolean; skipped?: boolean; message?: string };

const DELETE_PHRASE = "DELETE";

function syncWarning(sync: PublicationSync | undefined, done: string) {
  if (!sync || sync.ok) return null;
  return `${done} in Airtable, but the public website refresh is pending. ${sync.message || "Check the website publishing configuration."}`;
}

// Archive, restore and delete share one confirmation flow across the library,
// preview and editor so the rules and copy never drift apart.
export function useBlogLifecycle({
  onChanged,
  onDeleted,
  onToast,
}: {
  onChanged?: (blog: BlogRecord) => void;
  onDeleted?: (id: string) => void;
  onToast: (toast: ToastMessage) => void;
}) {
  const [pending, setPending] = useState<{ action: PendingAction; target: BlogLifecycleTarget } | null>(null);
  const [phrase, setPhrase] = useState("");
  const [busy, setBusy] = useState(false);

  function request(action: PendingAction, target: BlogLifecycleTarget) {
    setPhrase("");
    setPending({ action, target });
  }

  async function confirm() {
    if (!pending) return;
    const { action, target } = pending;
    setBusy(true);
    try {
      const response = action === "delete"
        ? await fetch(`/api/airtable/blogs/${target.id}`, { method: "DELETE" })
        : await fetch(`/api/airtable/blogs/${target.id}/status`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action }),
          });
      const body = await response.json().catch(() => ({})) as {
        blog?: BlogRecord;
        error?: string;
        publicationSync?: PublicationSync;
      };
      if (!response.ok) throw new Error(body.error || `The article could not be ${action === "delete" ? "deleted" : `${action}d`}.`);
      setPending(null);
      if (action === "delete") {
        onDeleted?.(target.id);
        onToast(syncWarning(body.publicationSync, "Deleted")
          ? { variant: "warning", message: syncWarning(body.publicationSync, "Deleted")! }
          : { variant: "success", message: `“${target.title}” was deleted.` });
        return;
      }
      if (body.blog) onChanged?.(body.blog);
      const done = action === "archive" ? "Archived" : "Restored";
      const warning = syncWarning(body.publicationSync, done);
      onToast(warning
        ? { variant: "warning", message: warning }
        : {
            variant: "success",
            message: action === "archive"
              ? "Article archived and removed from the public website."
              : "Article restored and live on the public website again.",
          });
    } catch (error) {
      onToast({ variant: "danger", message: error instanceof Error ? error.message : "The article could not be updated." });
    } finally {
      setBusy(false);
    }
  }

  const target = pending?.target;
  const title = target?.title || "Untitled article";
  const wasLive = target?.status === "Published";
  const copy = !pending ? null : pending.action === "archive"
    ? {
        title: `Archive “${title}”?`,
        description: "It comes off the public website and the sitemap right away. The article stays in the dashboard under Archived, and you can restore it to the same URL whenever you need it.",
        confirmLabel: "Archive article",
        destructive: false,
      }
    : pending.action === "restore"
      ? {
          title: `Restore “${title}”?`,
          description: `The article is republished and goes live again at /blog/${target?.slug}.`,
          confirmLabel: "Restore and publish",
          destructive: false,
        }
      : {
          title: `Delete “${title}” permanently?`,
          description: wasLive
            ? "This takes the article off the public website and deletes its Airtable record. It cannot be undone from the dashboard. Archive it instead if you might want it back."
            : "This deletes the article and its Airtable record. It cannot be undone from the dashboard.",
          confirmLabel: "Delete permanently",
          destructive: true,
        };

  const dialog = (
    <ConfirmDialog
      open={Boolean(pending && copy)}
      title={copy?.title || ""}
      description={copy?.description || ""}
      confirmLabel={copy?.confirmLabel || ""}
      destructive={copy?.destructive}
      confirmDisabled={pending?.action === "delete" && phrase.trim() !== DELETE_PHRASE}
      loading={busy}
      loadingLabel={pending?.action === "delete" ? "Deleting…" : "Saving…"}
      onCancel={() => setPending(null)}
      onConfirm={() => void confirm()}
    >
      {pending?.action === "delete" ? (
        <label className="grid gap-2">
          <span>Type <strong>{DELETE_PHRASE}</strong> to confirm.</span>
          <input
            value={phrase}
            onChange={(event) => setPhrase(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            aria-label={`Type ${DELETE_PHRASE} to confirm`}
            className="h-11 w-full rounded-xl border px-3 text-sm"
          />
        </label>
      ) : pending?.action === "archive" ? (
        <p>The URL stays reserved, so restoring brings back the same link and SEO history.</p>
      ) : undefined}
    </ConfirmDialog>
  );

  return { request, dialog, busy };
}
