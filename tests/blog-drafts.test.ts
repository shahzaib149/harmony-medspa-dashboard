import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { blogWordCount, validateBlog } from "../src/lib/blogs/seo";
import type { BlogInput } from "../src/lib/blogs/types";

type DraftArticle = BlogInput & {
  secondaryKeywords: string[];
  searchIntent: string;
  image: { url: string; alt: string; caption: string };
  sourceUrls: string[];
};

type DraftPackage = {
  schemaVersion: number;
  siteUrl: string;
  articles: DraftArticle[];
};

const draftPackage = JSON.parse(
  readFileSync(new URL("../content/blog-drafts.json", import.meta.url), "utf8"),
) as DraftPackage;

test("launch package contains five unique, publication-ready drafts", () => {
  assert.equal(draftPackage.schemaVersion, 1);
  assert.equal(draftPackage.siteUrl, "https://harmony-medspa.vercel.app");
  assert.equal(draftPackage.articles.length, 5);
  assert.equal(new Set(draftPackage.articles.map((article) => article.slug)).size, 5);

  for (const article of draftPackage.articles) {
    assert.equal(article.status, "Draft");
    assert.match(article.image.url, /^https:\/\/harmony-medspa\.vercel\.app\/images\/blogs\//);
    assert.ok(article.image.alt.trim());
    assert.ok(article.secondaryKeywords.length >= 3);
    assert.ok(article.sourceUrls.length >= 1);
    assert.ok(article.seoTitle.length >= 30 && article.seoTitle.length <= 60);
    assert.ok(article.metaDescription.length >= 120 && article.metaDescription.length <= 160);
    assert.ok(blogWordCount(article.content) >= 1000);

    const imageBlock = article.content[0];
    assert.equal(imageBlock.type, "image");
    if (imageBlock.type === "image") assert.equal(imageBlock.url, article.image.url);

    const faqBlocks = article.content.filter((block) => block.type === "faq");
    assert.equal(faqBlocks.length, 1);
    assert.equal(faqBlocks[0].items.length, 6);

    const validation = validateBlog(article);
    assert.deepEqual(validation.errors, [], `${article.slug}: ${validation.errors.join("; ")}`);
  }
});
