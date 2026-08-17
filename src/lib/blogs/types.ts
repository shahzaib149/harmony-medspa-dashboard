export const BLOG_STATUSES = ["Draft", "Published"] as const;
export type BlogStatus = (typeof BLOG_STATUSES)[number];

export const BLOG_BLOCK_TYPES = [
  "paragraph",
  "heading2",
  "heading3",
  "bulleted-list",
  "numbered-list",
  "quote",
  "image",
  "faq",
] as const;
export type BlogBlockType = (typeof BLOG_BLOCK_TYPES)[number];

export type BlogTextBlock = {
  id: string;
  type: Exclude<BlogBlockType, "image" | "faq">;
  text: string;
};

export type BlogImageBlock = {
  id: string;
  type: "image";
  url: string;
  alt: string;
  caption: string;
};

export type BlogFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type BlogFaqBlock = {
  id: string;
  type: "faq";
  items: BlogFaqItem[];
};

export type BlogContentBlock = BlogTextBlock | BlogImageBlock | BlogFaqBlock;

export type BlogRecord = {
  id: string;
  title: string;
  slug: string;
  status: BlogStatus;
  primaryKeyword: string;
  category: string;
  tags: string[];
  excerpt: string;
  content: BlogContentBlock[];
  seoTitle: string;
  metaDescription: string;
  relatedServiceUrl: string;
  relatedArticleUrls: string[];
  ctaLabel: string;
  ctaUrl: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  createdBy: string;
  updatedBy: string;
};

export type BlogInput = Omit<
  BlogRecord,
  "id" | "createdAt" | "updatedAt" | "publishedAt" | "createdBy" | "updatedBy"
>;

export type BlogSummary = Pick<
  BlogRecord,
  | "id"
  | "title"
  | "slug"
  | "status"
  | "primaryKeyword"
  | "category"
  | "updatedAt"
  | "publishedAt"
  | "updatedBy"
> & { wordCount: number };

export type SeoBreadcrumb = { name: string; url: string };

export type BlogTechnicalSeo = {
  canonical: string;
  openGraph: {
    type: "article";
    siteName: "Harmony Med Spa";
    title: string;
    description: string;
    url: string;
    image: string | null;
  };
  breadcrumbs: SeoBreadcrumb[];
  articleSchema: Record<string, unknown>;
  sitemap: {
    included: boolean;
    url: string;
    lastModified: string | null;
  };
};

export function imageSourceForSite(url: string) {
  try {
    const parsed = new URL(url);
    if (
      parsed.hostname === "harmony-medspa.vercel.app" ||
      parsed.hostname === "harmonymedspafl.com" ||
      parsed.hostname === "www.harmonymedspafl.com"
    ) {
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    // Keep the original value when it is not an absolute URL.
  }
  return url;
}
