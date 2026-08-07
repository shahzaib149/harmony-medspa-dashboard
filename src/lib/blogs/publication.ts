type PublicBlogSyncInput = {
  slug: string;
  previousSlug?: string;
};

export type PublicBlogSyncResult = {
  ok: boolean;
  skipped?: boolean;
  message?: string;
};

export async function notifyPublicBlogWebsite(input: PublicBlogSyncInput): Promise<PublicBlogSyncResult> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const secret = process.env.BLOG_REVALIDATE_SECRET?.trim();
  if (!siteUrl || !secret) {
    return { ok: false, skipped: true, message: "Public blog revalidation is not configured." };
  }

  try {
    const response = await fetch(`${new URL(siteUrl).origin}/api/blogs/revalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-blog-revalidate-secret": secret,
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      return { ok: false, message: `Public website revalidation returned ${response.status}.` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Public website revalidation failed." };
  }
}
