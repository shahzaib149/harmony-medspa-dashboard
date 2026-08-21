export type PublicBlogStatus = "Draft" | "Published";

export type PublicBlogTextBlock = {
  id: string;
  type: "paragraph" | "heading2" | "heading3" | "bulleted-list" | "numbered-list" | "quote";
  text: string;
};

export type PublicBlogImageBlock = {
  id: string;
  type: "image";
  url: string;
  alt: string;
  caption: string;
};

export type PublicBlogFaqBlock = {
  id: string;
  type: "faq";
  items: Array<{ id: string; question: string; answer: string }>;
};

export type PublicBlogBlock = PublicBlogTextBlock | PublicBlogImageBlock | PublicBlogFaqBlock;

export type PublicBlog = {
  id: string;
  title: string;
  slug: string;
  status: PublicBlogStatus;
  primaryKeyword: string;
  category: string;
  tags: string[];
  excerpt: string;
  content: PublicBlogBlock[];
  seoTitle: string;
  metaDescription: string;
  relatedServiceUrl: string;
  relatedArticleUrls: string[];
  ctaLabel: string;
  ctaUrl: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

export function firstPublicBlogImage(blog: PublicBlog) {
  return blog.content.find(
    (block): block is PublicBlogImageBlock => block.type === "image" && /^https?:\/\//i.test(block.url),
  ) ?? null;
}

export function imageSourceForSite(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "harmony-medspa.vercel.app" || parsed.hostname === "harmonymedspafl.com" || parsed.hostname === "www.harmonymedspafl.com") {
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    // Keep the original value when it is not an absolute URL.
  }
  return url;
}
