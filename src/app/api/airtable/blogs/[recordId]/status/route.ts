import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { BlogStorageError, setBlogStatus } from "@/lib/airtable/blogs";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { notifyPublicBlogWebsite } from "@/lib/blogs/publication";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TARGETS = { archive: "Archived", restore: "Published" } as const;

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
  const action = body?.action === "archive" || body?.action === "restore" ? body.action : null;
  if (!action) return Response.json({ error: "Choose archive or restore." }, { status: 400 });

  try {
    const { before, after } = await setBlogStatus(recordId, TARGETS[action], actorLabel(actor));
    const publicationSync = await notifyPublicBlogWebsite({ slug: after.slug });
    const audit = await logAuditEvent({
      actor,
      action: action === "archive" ? "blog_archived" : "blog_restored",
      category: "blogs",
      resource: { type: "blog", id: after.id, label: after.title },
      summary: `${action === "archive" ? "Archived" : "Restored"} ${after.title}`,
      before: { slug: before.slug, status: before.status },
      after: { slug: after.slug, status: after.status },
      request,
    });
    return Response.json({ blog: after, publicationSync, requestId: audit.requestId });
  } catch (error) {
    await logAuditEvent({
      actor,
      action: action === "archive" ? "blog_archive_failed" : "blog_restore_failed",
      category: "blogs",
      resource: { type: "blog", id: recordId },
      summary: `Blog article ${action} failed`,
      metadata: { result: "failed" },
      result: "failed",
      request,
    });
    return storageError(error, `Blog article could not be ${action === "archive" ? "archived" : "restored"}.`);
  }
}
