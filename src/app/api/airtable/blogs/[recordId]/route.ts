import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { BlogStorageError, getBlog, updateBlog } from "@/lib/airtable/blogs";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { notifyPublicBlogWebsite } from "@/lib/blogs/publication";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ recordId: string }> },
) {
  try {
    await requireRole(request, "viewer");
  } catch (error) {
    return authErrorResponse(error);
  }
  const { recordId } = await params;
  try {
    return Response.json({ blog: await getBlog(recordId) });
  } catch (error) {
    return storageError(error, "Blog article could not be loaded.");
  }
}

export async function PATCH(
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
  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "A valid blog article is required." }, { status: 400 });

  try {
    const { before, after } = await updateBlog(recordId, body, actorLabel(actor));
    const published = before.status !== "Published" && after.status === "Published";
    const unpublished = before.status === "Published" && after.status === "Draft";
    const action = published ? "blog_published" : unpublished ? "blog_unpublished" : "blog_updated";
    const publicationSync = before.status === "Published" || after.status === "Published"
      ? await notifyPublicBlogWebsite({ slug: after.slug, previousSlug: before.slug })
      : { ok: true, skipped: true };
    const audit = await logAuditEvent({
      actor,
      action,
      category: "blogs",
      resource: { type: "blog", id: after.id, label: after.title },
      summary: published
        ? `Published ${after.title}`
        : unpublished
          ? `Unpublished ${after.title}`
          : `Updated ${after.title}`,
      before: {
        title: before.title,
        slug: before.slug,
        status: before.status,
        primary_keyword: before.primaryKeyword,
        category: before.category,
      },
      after: {
        title: after.title,
        slug: after.slug,
        status: after.status,
        primary_keyword: after.primaryKeyword,
        category: after.category,
      },
      request,
    });
    return Response.json({ blog: after, publicationSync, requestId: audit.requestId });
  } catch (error) {
    await logAuditEvent({
      actor,
      action: "blog_update_failed",
      category: "blogs",
      resource: { type: "blog", id: recordId },
      summary: "Blog article update failed",
      metadata: { result: "failed" },
      result: "failed",
      request,
    });
    return storageError(error, "Blog article could not be updated.");
  }
}
