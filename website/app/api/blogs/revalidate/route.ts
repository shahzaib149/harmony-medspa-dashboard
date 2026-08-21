import { revalidatePath, revalidateTag } from "next/cache";
import { BLOG_CACHE_TAG } from "@/lib/blogs/airtable";

export const runtime = "nodejs";

function validSlug(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export async function POST(request: Request) {
  const expected = process.env.BLOG_REVALIDATE_SECRET?.trim();
  const provided = request.headers.get("x-blog-revalidate-secret")?.trim();
  if (!expected || !provided || provided !== expected) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as { slug?: unknown; previousSlug?: unknown } | null;
  if (!body || !validSlug(body.slug)) {
    return Response.json({ error: "A valid blog slug is required." }, { status: 400 });
  }

  revalidateTag(BLOG_CACHE_TAG, "max");
  revalidatePath("/blog");
  revalidatePath(`/blog/${body.slug}`);
  if (validSlug(body.previousSlug) && body.previousSlug !== body.slug) {
    revalidatePath(`/blog/${body.previousSlug}`);
  }

  return Response.json({ revalidated: true, slug: body.slug });
}
