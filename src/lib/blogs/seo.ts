import type {
  BlogContentBlock,
  BlogInput,
  BlogRecord,
  BlogTechnicalSeo,
} from "@/lib/blogs/types";

export const DEFAULT_BLOG_CATEGORIES = [
  "Skin & Aesthetics",
  "Medical Weight Loss",
  "Injectables",
  "Hormone & Wellness",
  "IV Therapy",
] as const;

const DEFAULT_SITE_URL = "https://harmony-medspa.vercel.app";

export function blogSiteUrl(value?: string) {
  const candidate = value?.trim() || DEFAULT_SITE_URL;
  try {
    const url = new URL(candidate);
    return url.origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export function slugifyBlogKeyword(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

function titleCase(value: string) {
  const lowerWords = new Set(["a", "an", "and", "at", "for", "in", "of", "on", "the", "to", "vs"]);
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word, index) => {
      if (/^[A-Z0-9-]{2,}$/.test(word)) return word;
      const lower = word.toLowerCase();
      if (index > 0 && lowerWords.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

export function prepareSeoSuggestions(primaryKeyword: string) {
  const keyword = primaryKeyword.trim().replace(/\s+/g, " ");
  const displayKeyword = titleCase(keyword);
  const longTitle = `${displayKeyword}: What to Know | Harmony Med Spa`;
  const seoTitle = longTitle.length <= 60
    ? longTitle
    : `${displayKeyword} | Harmony Med Spa`.slice(0, 60).trim();
  const metaDescription = keyword
    ? `Learn about ${keyword}, what to expect, and helpful care guidance from Harmony Med Spa in Sarasota, Florida.`.slice(0, 160)
    : "";
  return {
    slug: slugifyBlogKeyword(keyword),
    seoTitle,
    metaDescription,
  };
}

export function blogWordCount(content: BlogContentBlock[]) {
  return content.reduce((total, block) => {
    if (block.type === "image") return total;
    if (block.type === "faq") {
      return total + block.items.reduce((faqTotal, item) => (
        faqTotal + `${item.question} ${item.answer}`.trim().split(/\s+/).filter(Boolean).length
      ), 0);
    }
    return total + block.text.trim().split(/\s+/).filter(Boolean).length;
  }, 0);
}

export function firstBlogImage(content: BlogContentBlock[]) {
  return content.find(
    (block): block is Extract<BlogContentBlock, { type: "image" }> =>
      block.type === "image" && /^https?:\/\//i.test(block.url),
  ) ?? null;
}

type TechnicalSeoInput = Pick<
  BlogRecord,
  | "title"
  | "slug"
  | "status"
  | "excerpt"
  | "content"
  | "seoTitle"
  | "metaDescription"
  | "category"
  | "publishedAt"
  | "updatedAt"
>;

export function buildBlogTechnicalSeo(
  blog: TechnicalSeoInput,
  configuredSiteUrl?: string,
): BlogTechnicalSeo {
  const siteUrl = blogSiteUrl(configuredSiteUrl);
  const canonical = `${siteUrl}/blog/${blog.slug}`;
  const blogIndex = `${siteUrl}/blog`;
  const image = firstBlogImage(blog.content);
  const title = blog.seoTitle || blog.title;
  const description = blog.metaDescription || blog.excerpt;
  const breadcrumbs = [
    { name: "Home", url: siteUrl },
    { name: "Blog", url: blogIndex },
    ...(blog.category
      ? [{ name: blog.category, url: `${blogIndex}?category=${encodeURIComponent(blog.category)}` }]
      : []),
    { name: blog.title || "Article", url: canonical },
  ];
  const articleSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.title,
    description,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    publisher: {
      "@type": "Organization",
      name: "Harmony Med Spa",
      url: siteUrl,
    },
    dateModified: blog.updatedAt || undefined,
    datePublished: blog.publishedAt || undefined,
    image: image?.url || undefined,
  };
  Object.keys(articleSchema).forEach((key) => {
    if (articleSchema[key] === undefined || articleSchema[key] === "") delete articleSchema[key];
  });

  return {
    canonical,
    openGraph: {
      type: "article",
      siteName: "Harmony Med Spa",
      title,
      description,
      url: canonical,
      image: image?.url || null,
    },
    breadcrumbs,
    articleSchema,
    sitemap: {
      included: blog.status === "Published",
      url: canonical,
      lastModified: blog.status === "Published" ? blog.updatedAt || blog.publishedAt : null,
    },
  };
}

export function validateBlog(input: BlogInput) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const wordCount = blogWordCount(input.content);
  const readableBlocks = input.content.filter(
    (block) => block.type === "faq"
      ? block.items.some((item) => item.question.trim() && item.answer.trim())
      : block.type !== "image" && block.text.trim(),
  );

  if (!input.primaryKeyword.trim()) errors.push("Add a primary keyword.");
  if (!input.title.trim()) errors.push("Add an article title.");
  if (!input.slug.trim()) errors.push("Add a URL slug.");
  if (input.slug && slugifyBlogKeyword(input.slug) !== input.slug) {
    errors.push("Use a lowercase, hyphenated URL slug.");
  }
  if (!input.excerpt.trim()) errors.push("Add a short article excerpt.");
  if (!input.seoTitle.trim()) errors.push("Add an SEO title.");
  if (!input.metaDescription.trim()) errors.push("Add a meta description.");
  if (readableBlocks.length === 0) errors.push("Write the article before publishing.");

  if (input.seoTitle.length > 60) warnings.push("SEO title is longer than 60 characters.");
  if (input.seoTitle.length > 0 && input.seoTitle.length < 30) warnings.push("SEO title is shorter than 30 characters.");
  if (input.metaDescription.length > 160) warnings.push("Meta description is longer than 160 characters.");
  if (input.metaDescription.length > 0 && input.metaDescription.length < 120) warnings.push("Meta description is shorter than 120 characters.");
  if (!input.category.trim()) warnings.push("No category is selected.");
  if (!input.relatedServiceUrl.trim()) warnings.push("No related service page is linked.");
  if (!input.ctaLabel.trim() || !input.ctaUrl.trim()) warnings.push("No complete call to action is set.");
  if (wordCount < 500) warnings.push(`Article currently has ${wordCount} words; consider expanding it.`);
  for (const image of input.content.filter(
    (block): block is Extract<BlogContentBlock, { type: "image" }> => block.type === "image",
  )) {
    if (!image.alt.trim()) warnings.push("An article image is missing alt text.");
    if (image.url && !/^https?:\/\//i.test(image.url)) errors.push("Article image URLs must start with http:// or https://.");
  }
  for (const faq of input.content.filter(
    (block): block is Extract<BlogContentBlock, { type: "faq" }> => block.type === "faq",
  )) {
    const incomplete = faq.items.some((item) => Boolean(item.question.trim()) !== Boolean(item.answer.trim()));
    const complete = faq.items.filter((item) => item.question.trim() && item.answer.trim());
    const normalizedQuestions = complete.map((item) => item.question.trim().toLowerCase());
    if (incomplete) errors.push("Complete every FAQ question and answer before publishing.");
    if (complete.length === 0) warnings.push("The FAQ section is empty.");
    if (complete.length > 0 && complete.length < 3) warnings.push("The FAQ section has fewer than 3 complete questions.");
    if (complete.length > 6) warnings.push("The FAQ section has more than 6 questions; keep only the most useful ones.");
    if (new Set(normalizedQuestions).size !== normalizedQuestions.length) warnings.push("The FAQ section contains a repeated question.");
  }

  return { errors, warnings, wordCount };
}
