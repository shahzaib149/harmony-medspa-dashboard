import { readFile } from "node:fs/promises";
import path from "node:path";
import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { BlogStorageError, createBlog, listBlogs } from "@/lib/airtable/blogs";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DraftPackage = {
  schemaVersion: number;
  articles: unknown[];
};

function actorLabel(actor: { full_name: string | null; email: string | null }) {
  return actor.full_name?.trim() || actor.email || "Dashboard editor";
}

export async function POST(request: Request) {
  let actor;
  try {
    ({ profile: actor } = await requireRole(request, "editor"));
  } catch (error) {
    return authErrorResponse(error);
  }

  try {
    const file = await readFile(path.join(process.cwd(), "content", "blog-drafts.json"), "utf8");
    const draftPackage = JSON.parse(file) as DraftPackage;
    if (draftPackage.schemaVersion !== 1 || !Array.isArray(draftPackage.articles)) {
      return Response.json({ error: "The launch draft package is invalid." }, { status: 500 });
    }

    const existing = await listBlogs();
    const knownSlugs = new Set(existing.map((blog) => blog.slug.toLowerCase()));
    const created = [];
    const skipped: string[] = [];
    for (const article of draftPackage.articles) {
      const value = article && typeof article === "object" ? article as Record<string, unknown> : {};
      const slug = typeof value.slug === "string" ? value.slug.toLowerCase() : "";
      if (!slug || knownSlugs.has(slug)) {
        skipped.push(slug || "missing-slug");
        continue;
      }
      const blog = await createBlog({ ...value, status: "Draft" }, actorLabel(actor));
      created.push(blog);
      knownSlugs.add(blog.slug.toLowerCase());
    }

    const audit = await logAuditEvent({
      actor,
      action: "blog_launch_drafts_imported",
      category: "blogs",
      summary: `Imported ${created.length} launch blog drafts`,
      metadata: { created_slugs: created.map((blog) => blog.slug), skipped_slugs: skipped },
      request,
    });
    return Response.json({ created, skipped, requestId: audit.requestId });
  } catch (error) {
    const status = error instanceof BlogStorageError ? error.status : 500;
    return Response.json({ error: error instanceof Error ? error.message : "Launch drafts could not be imported." }, { status });
  }
}
