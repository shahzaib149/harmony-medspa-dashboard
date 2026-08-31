import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { blogWordCount, validateBlog } from "../src/lib/blogs/seo";
import type { BlogInput } from "../src/lib/blogs/types";

type DraftArticle = BlogInput;

type DraftPackage = {
  schemaVersion: number;
  siteUrl: string;
  articles: DraftArticle[];
};

const draftPackage = JSON.parse(
  readFileSync(new URL("../content/blog-drafts.json", import.meta.url), "utf8"),
) as DraftPackage;

test("launch package contains five unique, publication-ready drafts", () => {
  const launchArticles = draftPackage.articles.filter(
    (article) => article.slug !== "daxxify-upper-face-sarasota",
  );

  assert.equal(draftPackage.schemaVersion, 1);
  assert.equal(draftPackage.siteUrl, "https://www.harmonymedspafl.com");
  assert.equal(launchArticles.length, 5);
  assert.equal(
    new Set(draftPackage.articles.map((article) => article.slug)).size,
    draftPackage.articles.length,
  );

  for (const article of draftPackage.articles) {
    assert.equal(article.status, "Draft");
    const imageBlock = article.content.find((block) => block.type === "image");
    assert.ok(imageBlock, `${article.slug}: missing article image`);
    if (imageBlock?.type === "image") {
      assert.match(
        imageBlock.url,
        /^https:\/\/(?:www\.harmonymedspafl\.com\/images\/blogs\/|[^/]+\.supabase\.co\/storage\/v1\/object\/public\/blog-images\/)/,
      );
      assert.ok(imageBlock.alt.trim());
    }
  }

  for (const article of launchArticles) {
    assert.ok(article.seoTitle.length >= 30 && article.seoTitle.length <= 60);
    assert.ok(article.metaDescription.length >= 120 && article.metaDescription.length <= 160);
    assert.ok(blogWordCount(article.content) >= 600);

    const imageBlock = article.content[0];
    assert.equal(imageBlock.type, "image");

    const faqBlocks = article.content.filter((block) => block.type === "faq");
    assert.equal(faqBlocks.length, 1);
    assert.ok(faqBlocks[0].items.length >= 5);

    const validation = validateBlog(article);
    assert.deepEqual(validation.errors, [], `${article.slug}: ${validation.errors.join("; ")}`);
  }
});
