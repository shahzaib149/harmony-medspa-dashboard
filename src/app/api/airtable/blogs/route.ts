import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { createBlog, BlogStorageError, blogSummary, listBlogs } from "@/lib/airtable/blogs";
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

export async function GET(request: Request) {
  try {
    await requireRole(request, "viewer");
  } catch (error) {
    return authErrorResponse(error);
  }

  try {
    const blogs = await listBlogs();
    return Response.json(
      { blogs: blogs.map(blogSummary), count: blogs.length },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    return storageError(error, "Blog articles could not be loaded.");
  }
}

export async function POST(request: Request) {
  let actor;
  try {
    ({ profile: actor } = await requireRole(request, "editor"));
  } catch (error) {
    return authErrorResponse(error);
  }

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "A valid blog article is required." }, { status: 400 });

  try {
    const blog = await createBlog(body, actorLabel(actor));
    const publicationSync = blog.status === "Published"
      ? await notifyPublicBlogWebsite({ slug: blog.slug })
      : { ok: true, skipped: true };
    const audit = await logAuditEvent({
      actor,
      action: blog.status === "Published" ? "blog_published" : "blog_created",
      category: "blogs",
      resource: { type: "blog", id: blog.id, label: blog.title },
      summary: blog.status === "Published" ? `Published ${blog.title}` : `Created draft ${blog.title}`,
      after: {
        title: blog.title,
        slug: blog.slug,
        status: blog.status,
        primary_keyword: blog.primaryKeyword,
        category: blog.category,
      },
      request,
    });
    return Response.json({ blog, publicationSync, requestId: audit.requestId }, { status: 201 });
  } catch (error) {
    await logAuditEvent({
      actor,
      action: "blog_create_failed",
      category: "blogs",
      summary: "Blog article creation failed",
      metadata: { result: "failed" },
      result: "failed",
      request,
    });
    return storageError(error, "Blog article could not be created.");
  }
}
