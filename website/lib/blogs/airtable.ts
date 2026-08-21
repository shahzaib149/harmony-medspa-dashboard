import type { PublicBlog, PublicBlogBlock, PublicBlogStatus } from "@/lib/blogs/types";

const BLOG_CACHE_TAG = "published-blogs";
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

type AirtableRecord = {
  id: string;
  createdTime: string;
  fields: Record<string, unknown>;
};

type StoredBlogData = Pick<
  PublicBlog,
  "tags" | "excerpt" | "content" | "seoTitle" | "metaDescription" | "relatedServiceUrl" | "relatedArticleUrls" | "ctaLabel" | "ctaUrl"
>;

function config() {
  return {
    token: process.env.AIRTABLE_API_KEY?.trim() || "",
    baseId: process.env.AIRTABLE_BLOGS_BASE_ID?.trim()
      || process.env.AIRTABLE_LEADS_BASE_ID?.trim()
      || process.env.AIRTABLE_BASE_ID?.trim()
      || "",
    table: process.env.AIRTABLE_BLOGS_TABLE_ID?.trim()
      || process.env.AIRTABLE_BLOGS_TABLE_NAME?.trim()
      || "Blogs",
  };
}

function text(fields: Record<string, unknown>, key: string) {
  const value = fields[key];
  return value === undefined || value === null ? "" : String(value);
}

function safeUrl(value: unknown) {
  if (typeof value !== "string") return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function cleanBlocks(value: unknown): PublicBlogBlock[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 200).flatMap((entry, index): PublicBlogBlock[] => {
    if (!entry || typeof entry !== "object") return [];
    const item = entry as Record<string, unknown>;
    const id = typeof item.id === "string" && item.id.trim() ? item.id.trim() : `block-${index + 1}`;
    if (item.type === "image") {
      const url = safeUrl(item.url);
      if (!url) return [];
      return [{
        id,
        type: "image",
        url,
        alt: typeof item.alt === "string" ? item.alt.trim().slice(0, 300) : "",
        caption: typeof item.caption === "string" ? item.caption.trim().slice(0, 500) : "",
      }];
    }
    if (item.type === "faq") {
      const rawItems = Array.isArray(item.items) ? item.items : [];
      return [{
        id,
        type: "faq",
        items: rawItems.slice(0, 12).flatMap((raw, itemIndex) => {
          if (!raw || typeof raw !== "object") return [];
          const faq = raw as Record<string, unknown>;
          const question = typeof faq.question === "string" ? faq.question.trim() : "";
          const answer = typeof faq.answer === "string" ? faq.answer.trim() : "";
          if (!question || !answer) return [];
          return [{
            id: typeof faq.id === "string" && faq.id.trim() ? faq.id.trim() : `${id}-question-${itemIndex + 1}`,
            question,
            answer,
          }];
        }),
      }];
    }
    if (!["paragraph", "heading2", "heading3", "bulleted-list", "numbered-list", "quote"].includes(String(item.type))) return [];
    const blockText = typeof item.text === "string" ? item.text.trim() : "";
    if (!blockText) return [];
    return [{ id, type: item.type as PublicBlogTextBlockType, text: blockText }];
  });
}

type PublicBlogTextBlockType = Extract<PublicBlogBlock, { text: string }>["type"];

function parseStoredData(fields: Record<string, unknown>): Partial<StoredBlogData> {
  try {
    return JSON.parse(text(fields, "CMS Data")) as Partial<StoredBlogData>;
  } catch {
    return {};
  }
}

function mapRecord(record: AirtableRecord): PublicBlog | null {
  const stored = parseStoredData(record.fields);
  const status: PublicBlogStatus = text(record.fields, "Status") === "Published" ? "Published" : "Draft";
  const slug = text(record.fields, "Slug").trim();
  const title = text(record.fields, "Title").trim();
  if (status !== "Published" || !slug || !title) return null;
  return {
    id: record.id,
    title,
    slug,
    status,
    primaryKeyword: text(record.fields, "Primary Keyword"),
    category: text(record.fields, "Category"),
    tags: Array.isArray(stored.tags) ? stored.tags.map(String) : [],
    excerpt: typeof stored.excerpt === "string" ? stored.excerpt : "",
    content: cleanBlocks(stored.content),
    seoTitle: typeof stored.seoTitle === "string" ? stored.seoTitle : title,
    metaDescription: typeof stored.metaDescription === "string" ? stored.metaDescription : "",
    relatedServiceUrl: safeUrl(stored.relatedServiceUrl),
    relatedArticleUrls: Array.isArray(stored.relatedArticleUrls) ? stored.relatedArticleUrls.map(safeUrl).filter(Boolean) : [],
    ctaLabel: typeof stored.ctaLabel === "string" ? stored.ctaLabel : "",
    ctaUrl: safeUrl(stored.ctaUrl),
    createdAt: text(record.fields, "Created At") || record.createdTime,
    updatedAt: text(record.fields, "Updated At") || record.createdTime,
    publishedAt: text(record.fields, "Published At") || null,
  };
}

async function airtablePage(offset = "") {
  const { token, baseId, table } = config();
  if (!token || !baseId) return { records: [] as AirtableRecord[], offset: "" };
  const params = new URLSearchParams({
    pageSize: "100",
    filterByFormula: "AND({Status}='Published',{Slug}!='')",
  });
  params.append("sort[0][field]", "Published At");
  params.append("sort[0][direction]", "desc");
  if (offset) params.set("offset", offset);
  const endpoint = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}?${params}`;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300, tags: [BLOG_CACHE_TAG] },
    });
    if (response.ok) return response.json() as Promise<{ records: AirtableRecord[]; offset?: string }>;
    if (!RETRYABLE_STATUSES.has(response.status) || attempt === 2) {
      console.error(`Published blog fetch failed with Airtable status ${response.status}.`);
      return { records: [], offset: "" };
    }
    await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
  }
  return { records: [], offset: "" };
}

export async function listPublishedBlogs() {
  const records: AirtableRecord[] = [];
  let offset = "";
  do {
    const page = await airtablePage(offset);
    records.push(...page.records);
    offset = page.offset || "";
  } while (offset);
  return records.flatMap((record) => {
    const blog = mapRecord(record);
    return blog ? [blog] : [];
  });
}

export async function getPublishedBlogBySlug(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  const blogs = await listPublishedBlogs();
  return blogs.find((blog) => blog.slug === slug) ?? null;
}

export { BLOG_CACHE_TAG };
