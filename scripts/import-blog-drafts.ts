import { readFile } from "node:fs/promises";
import path from "node:path";
import { loadEnvConfig } from "@next/env";

type BlogArticle = Record<string, unknown> & {
  title: string;
  slug: string;
  primaryKeyword: string;
  category: string;
  tags: string[];
  excerpt: string;
  content: unknown[];
  seoTitle: string;
  metaDescription: string;
  relatedServiceUrl: string;
  relatedArticleUrls: string[];
  ctaLabel: string;
  ctaUrl: string;
};

type DraftPackage = { schemaVersion: number; articles: BlogArticle[] };

function cmsData(article: BlogArticle) {
  return {
    tags: article.tags,
    excerpt: article.excerpt,
    content: article.content,
    seoTitle: article.seoTitle,
    metaDescription: article.metaDescription,
    relatedServiceUrl: article.relatedServiceUrl,
    relatedArticleUrls: article.relatedArticleUrls,
    ctaLabel: article.ctaLabel,
    ctaUrl: article.ctaUrl,
  };
}

async function main() {
  loadEnvConfig(process.cwd());
  const token = process.env.AIRTABLE_API_KEY?.trim();
  const baseId = process.env.AIRTABLE_BLOGS_BASE_ID?.trim()
    || process.env.AIRTABLE_LEADS_BASE_ID?.trim()
    || process.env.AIRTABLE_BASE_ID?.trim();
  const table = process.env.AIRTABLE_BLOGS_TABLE_ID?.trim()
    || process.env.AIRTABLE_BLOGS_TABLE_NAME?.trim()
    || "Blogs";
  if (!token || !baseId) throw new Error("Airtable is not configured in .env.local.");

  const file = await readFile(path.join(process.cwd(), "content", "blog-drafts.json"), "utf8");
  const draftPackage = JSON.parse(file) as DraftPackage;
  if (draftPackage.schemaVersion !== 1 || !Array.isArray(draftPackage.articles)) {
    throw new Error("content/blog-drafts.json is not a supported draft package.");
  }

  const endpoint = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const existingSlugs = new Set<string>();
  let offset = "";
  do {
    const params = new URLSearchParams({ pageSize: "100", "fields[]": "Slug" });
    if (offset) params.set("offset", offset);
    const response = await fetch(`${endpoint}?${params}`, { headers });
    if (!response.ok) throw new Error(`Airtable read failed (${response.status}): ${await response.text()}`);
    const page = await response.json() as { records: Array<{ fields: { Slug?: string } }>; offset?: string };
    page.records.forEach((record) => {
      if (record.fields.Slug) existingSlugs.add(record.fields.Slug.toLowerCase());
    });
    offset = page.offset || "";
  } while (offset);

  const now = new Date().toISOString();
  const pending = draftPackage.articles.filter((article) => !existingSlugs.has(article.slug.toLowerCase()));
  if (!pending.length) {
    console.log("No records created; every launch-draft slug already exists.");
    return;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      typecast: true,
      records: pending.map((article) => ({
        fields: {
          Title: article.title,
          Slug: article.slug,
          Status: "Draft",
          "Primary Keyword": article.primaryKeyword,
          Category: article.category,
          "Created At": now,
          "Updated At": now,
          "Published At": null,
          "Created By": "Codex launch import",
          "Updated By": "Codex launch import",
          "CMS Data": JSON.stringify(cmsData(article)),
        },
      })),
    }),
  });
  if (!response.ok) throw new Error(`Airtable create failed (${response.status}): ${await response.text()}`);
  const result = await response.json() as { records: Array<{ id: string; fields: { Slug?: string; Status?: string } }> };
  result.records.forEach((record) => console.log(`${record.id} ${record.fields.Status}: ${record.fields.Slug}`));
  console.log(`Created ${result.records.length} Airtable drafts; skipped ${draftPackage.articles.length - pending.length} existing slug(s).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
