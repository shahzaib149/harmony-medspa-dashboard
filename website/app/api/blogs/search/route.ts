import { listPublishedBlogs } from "@/lib/blogs/airtable";
import { allLegacyBlogPosts } from "@/lib/blogs/legacy-posts";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("search")?.trim().slice(0, 100).toLowerCase() || "";
  if (!query) return Response.json({ results: [] });

  const publishedBlogs = await listPublishedBlogs();
  const posts = [
    ...allLegacyBlogPosts,
    ...publishedBlogs.map((blog) => ({
      title: blog.title,
      href: `/blog/${blog.slug}`,
      excerpt: blog.excerpt,
      imageAlt: "",
    })),
  ];
  const unique = [...new Map(posts.map((post) => [post.href.toLowerCase(), post])).values()];
  const results = unique
    .filter((post) => `${post.title} ${post.excerpt} ${post.imageAlt} ${post.href}`.toLowerCase().includes(query))
    .slice(0, 8)
    .map(({ title, href }) => ({ title, href }));

  return Response.json(
    { results },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
  );
}
