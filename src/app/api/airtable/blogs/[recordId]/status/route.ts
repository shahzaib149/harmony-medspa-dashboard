import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { BlogStorageError, setBlogStatus } from "@/lib/airtable/blogs";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { notifyPublicBlogWebsite } from "@/lib/blogs/publication";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TARGETS = { archive: "Archived", restore: "Published", review: "In Review", draft: "Draft" } as const;
type StatusAction = keyof typeof TARGETS;
const LABELS: Record<StatusAction, { done: string; verb: string; audit: string }> = {
  archive: { done: "Archived", verb: "archived", audit: "blog_archived" },
  restore: { done: "Restored", verb: "restored", audit: "blog_restored" },
  review: { done: "Submitted for review:", verb: "submitted for review", audit: "blog_submitted_for_review" },
  draft: { done: "Returned to draft:", verb: "returned to draft", audit: "blog_returned_to_draft" },
};

function actorLabel(actor: { full_name: string | null; email: string | null }) {
  return actor.full_name?.trim() || actor.email || "Dashboard editor";
}

function storageError(error: unknown, fallback: string) {
  if (error instanceof BlogStorageError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  return Response.json(
    { error: error instanceof Error ? error.message : fallback },
    { status: 500 },
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ recordId: string }> },
) {
  let actor;
  try {
    ({ profile: actor } = await requireRole(request, "editor"));
  } catch (error) {
    return authErrorResponse(error);
  }
  const { recordId } = await params;
  const body = await request.json().catch(() => null) as { action?: unknown } | null;
  const action = typeof body?.action === "string" && body.action in TARGETS ? body.action as StatusAction : null;
  if (!action) return Response.json({ error: "Choose archive, restore, review or draft." }, { status: 400 });

  try {
    const { before, after } = await setBlogStatus(recordId, TARGETS[action], actorLabel(actor));
    // Review and draft moves never touch the website (it reads Published only).
    const publicationSync = action === "archive" || action === "restore" ? await notifyPublicBlogWebsite({ slug: after.slug }) : null;
    const audit = await logAuditEvent({
      actor,
      action: LABELS[action].audit,
      category: "blogs",
      resource: { type: "blog", id: after.id, label: after.title },
      summary: `${LABELS[action].done} ${after.title}`,
      before: { slug: before.slug, status: before.status },
      after: { slug: after.slug, status: after.status },
      request,
    });
    return Response.json({ blog: after, publicationSync, requestId: audit.requestId });
  } catch (error) {
    await logAuditEvent({
      actor,
      action: `${LABELS[action].audit}_failed`,
      category: "blogs",
      resource: { type: "blog", id: recordId },
      summary: `Blog article ${action} failed`,
      metadata: { result: "failed" },
      result: "failed",
      request,
    });
    return storageError(error, `Blog article could not be ${LABELS[action].verb}.`);
  }
}
