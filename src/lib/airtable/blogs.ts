import "server-only";

import { AIRTABLE_LEADS_BASE_ID, getAirtableApiKey } from "@/lib/airtable/config";
import { blogWordCount, slugifyBlogKeyword, validateBlog } from "@/lib/blogs/seo";
import { BLOG_STATUSES, type BlogContentBlock, type BlogInput, type BlogRecord, type BlogStatus, type BlogSummary } from "@/lib/blogs/types";
import { resilientFetch } from "@/lib/network/resilient-fetch";

const BASE_ID = process.env.AIRTABLE_BLOGS_BASE_ID?.trim() || AIRTABLE_LEADS_BASE_ID;
const TABLE = process.env.AIRTABLE_BLOGS_TABLE_ID?.trim()
  || process.env.AIRTABLE_BLOGS_TABLE_NAME?.trim()
  || "Blogs";
const API_KEY = getAirtableApiKey();
const RETRYABLE = new Set([429, 500, 502, 503, 504]);

type AirtableBlogRecord = {
  id: string;
  createdTime: string;
  fields: Record<string, unknown>;
};

type StoredBlogData = Pick<
  BlogRecord,
  | "tags"
  | "excerpt"
  | "content"
  | "seoTitle"
  | "metaDescription"
  | "relatedServiceUrl"
  | "relatedArticleUrls"
  | "ctaLabel"
  | "ctaUrl"
>;

export class BlogStorageError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "BlogStorageError";
    this.status = status;
  }
}

function stringField(fields: Record<string, unknown>, key: string) {
  const value = fields[key];
  return value === undefined || value === null ? "" : String(value);
}

function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanUrl(value: unknown) {
  const text = cleanText(value, 2_000);
  if (!text) return "";
  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function cleanContent(value: unknown): BlogContentBlock[] {
  if (!Array.isArray(value)) return [];
  const content: BlogContentBlock[] = [];
  value.slice(0, 200).forEach((item, index) => {
    if (!item || typeof item !== "object") return;
    const block = item as Record<string, unknown>;
    const id = cleanText(block.id, 100) || `block-${index + 1}`;
    if (block.type === "image") {
      content.push({
        id,
        type: "image" as const,
        url: cleanUrl(block.url),
        alt: cleanText(block.alt, 300),
        caption: cleanText(block.caption, 500),
      });
      return;
    }
    if (block.type === "faq") {
      const rawItems = Array.isArray(block.items) ? block.items : [];
      content.push({
        id,
        type: "faq",
        items: rawItems.slice(0, 12).flatMap((rawItem, itemIndex) => {
          if (!rawItem || typeof rawItem !== "object") return [];
          const faqItem = rawItem as Record<string, unknown>;
          return [{
            id: cleanText(faqItem.id, 100) || `${id}-question-${itemIndex + 1}`,
            question: cleanText(faqItem.question, 500),
            answer: cleanText(faqItem.answer, 10_000),
          }];
        }),
      });
      return;
    }
    if (!["paragraph", "heading2", "heading3", "bulleted-list", "numbered-list", "quote"].includes(String(block.type))) return;
    content.push({
      id,
      type: block.type as Exclude<BlogContentBlock["type"], "image" | "faq">,
      text: cleanText(block.text, 50_000),
    });
  });
  return content;
}

export function normalizeBlogInput(value: unknown): BlogInput {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const status = BLOG_STATUSES.includes(input.status as BlogStatus) ? input.status as BlogStatus : "Draft";
  return {
    title: cleanText(input.title, 200),
    slug: slugifyBlogKeyword(cleanText(input.slug, 100)),
    status,
    primaryKeyword: cleanText(input.primaryKeyword, 200),
    category: cleanText(input.category, 100),
    tags: Array.isArray(input.tags)
      ? input.tags.map((tag) => cleanText(tag, 80)).filter(Boolean).slice(0, 25)
      : [],
    excerpt: cleanText(input.excerpt, 600),
    content: cleanContent(input.content),
    seoTitle: cleanText(input.seoTitle, 200),
    metaDescription: cleanText(input.metaDescription, 500),
    relatedServiceUrl: cleanUrl(input.relatedServiceUrl),
    relatedArticleUrls: Array.isArray(input.relatedArticleUrls)
      ? input.relatedArticleUrls.map(cleanUrl).filter(Boolean).slice(0, 20)
      : [],
    ctaLabel: cleanText(input.ctaLabel, 100),
    ctaUrl: cleanUrl(input.ctaUrl),
  };
}

function parseStoredData(fields: Record<string, unknown>): Partial<StoredBlogData> {
  try {
    return JSON.parse(stringField(fields, "CMS Data")) as Partial<StoredBlogData>;
  } catch {
    return {};
  }
}

export function mapBlogRecord(record: AirtableBlogRecord): BlogRecord {
  const stored = parseStoredData(record.fields);
  const statusValue = stringField(record.fields, "Status");
  const status: BlogStatus = statusValue === "Published" ? "Published" : "Draft";
  return {
    id: record.id,
    title: stringField(record.fields, "Title"),
    slug: stringField(record.fields, "Slug"),
    status,
    primaryKeyword: stringField(record.fields, "Primary Keyword"),
    category: stringField(record.fields, "Category"),
    tags: Array.isArray(stored.tags) ? stored.tags.map(String) : [],
    excerpt: typeof stored.excerpt === "string" ? stored.excerpt : "",
    content: cleanContent(stored.content),
    seoTitle: typeof stored.seoTitle === "string" ? stored.seoTitle : "",
    metaDescription: typeof stored.metaDescription === "string" ? stored.metaDescription : "",
    relatedServiceUrl: typeof stored.relatedServiceUrl === "string" ? stored.relatedServiceUrl : "",
    relatedArticleUrls: Array.isArray(stored.relatedArticleUrls) ? stored.relatedArticleUrls.map(String) : [],
    ctaLabel: typeof stored.ctaLabel === "string" ? stored.ctaLabel : "",
    ctaUrl: typeof stored.ctaUrl === "string" ? stored.ctaUrl : "",
    createdAt: stringField(record.fields, "Created At") || record.createdTime,
    updatedAt: stringField(record.fields, "Updated At") || record.createdTime,
    publishedAt: stringField(record.fields, "Published At") || null,
    createdBy: stringField(record.fields, "Created By"),
    updatedBy: stringField(record.fields, "Updated By"),
  };
}

function storedData(input: BlogInput): StoredBlogData {
  return {
    tags: input.tags,
    excerpt: input.excerpt,
    content: input.content,
    seoTitle: input.seoTitle,
    metaDescription: input.metaDescription,
    relatedServiceUrl: input.relatedServiceUrl,
    relatedArticleUrls: input.relatedArticleUrls,
    ctaLabel: input.ctaLabel,
    ctaUrl: input.ctaUrl,
  };
}

function fieldsForBlog(input: BlogInput, timestamps: {
  createdAt?: string;
  publishedAt: string | null;
  updatedAt: string;
  createdBy?: string;
  updatedBy: string;
}) {
  return {
    Title: input.title,
    Slug: input.slug,
    Status: input.status,
    "Primary Keyword": input.primaryKeyword,
    Category: input.category,
    ...(timestamps.createdAt ? { "Created At": timestamps.createdAt } : {}),
    "Updated At": timestamps.updatedAt,
    "Published At": timestamps.publishedAt,
    ...(timestamps.createdBy ? { "Created By": timestamps.createdBy } : {}),
    "Updated By": timestamps.updatedBy,
    "CMS Data": JSON.stringify(storedData(input)),
  };
}

function assertConfigured() {
  if (!API_KEY) throw new BlogStorageError(500, "Airtable is not configured for the blog CMS.");
}

async function blogFetch(path: string, init: RequestInit = {}) {
  assertConfigured();
  const method = (init.method || "GET").toUpperCase();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await resilientFetch(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}${path}`,
      {
        ...init,
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          ...init.headers,
        },
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!RETRYABLE.has(response.status) || attempt === 2 || method !== "GET") return response;
    await response.body?.cancel().catch(() => undefined);
    await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
  }
  throw new BlogStorageError(502, "Airtable could not be reached.");
}

async function checked(response: Response) {
  if (response.ok) return response;
  const body = await response.json().catch(() => null) as { error?: { message?: string; type?: string } } | null;
  const detail = body?.error?.message || body?.error?.type;
  const setupHint = response.status === 404 || /unknown field|not found/i.test(detail || "")
    ? " Check the Blogs table and field setup in docs/airtable-blogs-setup.md."
    : "";
  throw new BlogStorageError(response.status, `${detail || `Airtable request failed (${response.status}).`}${setupHint}`);
}

export async function listBlogs(): Promise<BlogRecord[]> {
  const records: AirtableBlogRecord[] = [];
  let offset = "";
  do {
    const params = new URLSearchParams({ pageSize: "100" });
    if (offset) params.set("offset", offset);
    const response = await checked(await blogFetch(`?${params}`));
    const data = await response.json() as { records: AirtableBlogRecord[]; offset?: string };
    records.push(...data.records);
    offset = data.offset || "";
  } while (offset);
  return records.map(mapBlogRecord).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function getBlog(id: string) {
  if (!/^rec[a-zA-Z0-9]+$/.test(id)) throw new BlogStorageError(400, "Invalid blog record ID.");
  const response = await checked(await blogFetch(`/${encodeURIComponent(id)}`));
  return mapBlogRecord(await response.json() as AirtableBlogRecord);
}

function assertPublishable(input: BlogInput) {
  if (input.status !== "Published") return;
  const { errors } = validateBlog(input);
  if (errors.length) throw new BlogStorageError(400, errors.join(" "));
}

async function assertUniqueSlug(slug: string, exceptId?: string) {
  const existing = await listBlogs();
  if (existing.some((blog) => blog.id !== exceptId && blog.slug.toLowerCase() === slug.toLowerCase())) {
    throw new BlogStorageError(409, "That URL slug is already used by another article.");
  }
}

export async function createBlog(raw: unknown, actor: string) {
  const input = normalizeBlogInput(raw);
  if (!input.title) throw new BlogStorageError(400, "Article title is required.");
  if (!input.slug) throw new BlogStorageError(400, "URL slug is required.");
  assertPublishable(input);
  await assertUniqueSlug(input.slug);
  const now = new Date().toISOString();
  const response = await checked(await blogFetch("?typecast=true", {
    method: "POST",
    body: JSON.stringify({
      fields: fieldsForBlog(input, {
        createdAt: now,
        publishedAt: input.status === "Published" ? now : null,
        updatedAt: now,
        createdBy: actor,
        updatedBy: actor,
      }),
    }),
  }));
  return mapBlogRecord(await response.json() as AirtableBlogRecord);
}

export async function updateBlog(id: string, raw: unknown, actor: string) {
  const before = await getBlog(id);
  const input = normalizeBlogInput(raw);
  if (!input.title) throw new BlogStorageError(400, "Article title is required.");
  if (!input.slug) throw new BlogStorageError(400, "URL slug is required.");
  if (before.publishedAt && input.slug !== before.slug) {
    throw new BlogStorageError(409, "Published article URLs are locked until redirect support is added to the public website.");
  }
  assertPublishable(input);
  await assertUniqueSlug(input.slug, id);
  const now = new Date().toISOString();
  const publishedAt = before.publishedAt || (input.status === "Published" ? now : null);
  const response = await checked(await blogFetch(`/${encodeURIComponent(id)}?typecast=true`, {
    method: "PATCH",
    body: JSON.stringify({
      fields: fieldsForBlog(input, {
        publishedAt,
        updatedAt: now,
        updatedBy: actor,
      }),
    }),
  }));
  return { before, after: mapBlogRecord(await response.json() as AirtableBlogRecord) };
}

export function blogSummary(blog: BlogRecord): BlogSummary {
  return {
    id: blog.id,
    title: blog.title,
    slug: blog.slug,
    status: blog.status,
    primaryKeyword: blog.primaryKeyword,
    category: blog.category,
    updatedAt: blog.updatedAt,
    publishedAt: blog.publishedAt,
    updatedBy: blog.updatedBy,
    wordCount: blogWordCount(blog.content),
  };
}
