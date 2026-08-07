import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildBlogTechnicalSeo,
  prepareSeoSuggestions,
  slugifyBlogKeyword,
  validateBlog,
} from "../src/lib/blogs/seo";
import type { BlogInput } from "../src/lib/blogs/types";

function article(overrides: Partial<BlogInput> = {}): BlogInput {
  return {
    title: "Botox Aftercare: What to Know",
    slug: "botox-aftercare",
    status: "Draft",
    primaryKeyword: "Botox aftercare",
    category: "Injectables",
    tags: ["Botox", "Aftercare"],
    excerpt: "Practical aftercare guidance for patients considering Botox in Sarasota.",
    content: [{ id: "one", type: "paragraph", text: "Helpful guidance ".repeat(260) }],
    seoTitle: "Botox Aftercare: What to Know | Harmony Med Spa",
    metaDescription: "Learn about Botox aftercare, what to expect, and helpful care guidance from Harmony Med Spa in Sarasota, Florida.",
    relatedServiceUrl: "https://harmony-medspa.vercel.app/services/botox",
    relatedArticleUrls: [],
    ctaLabel: "Book a consultation",
    ctaUrl: "https://harmony-medspa.vercel.app/contact",
    ...overrides,
  };
}

test("primary keyword prepares editable SEO suggestions", () => {
  assert.deepEqual(prepareSeoSuggestions("Botox aftercare"), {
    slug: "botox-aftercare",
    seoTitle: "Botox Aftercare: What to Know | Harmony Med Spa",
    metaDescription: "Learn about Botox aftercare, what to expect, and helpful care guidance from Harmony Med Spa in Sarasota, Florida.",
  });
  assert.equal(slugifyBlogKeyword("RF Microneedling & Skin Care"), "rf-microneedling-and-skin-care");
});

test("technical SEO package follows manual publication state", () => {
  const draft = article();
  const draftSeo = buildBlogTechnicalSeo({ ...draft, publishedAt: null, updatedAt: "2026-08-07T10:00:00.000Z" });
  assert.equal(draftSeo.canonical, "https://harmony-medspa.vercel.app/blog/botox-aftercare");
  assert.equal(draftSeo.sitemap.included, false);
  assert.equal(draftSeo.openGraph.type, "article");
  assert.equal(draftSeo.articleSchema["@type"], "BlogPosting");
  assert.equal("author" in draftSeo.articleSchema, false);

  const publishedSeo = buildBlogTechnicalSeo({ ...draft, status: "Published", publishedAt: "2026-08-07T09:00:00.000Z", updatedAt: "2026-08-07T10:00:00.000Z" });
  assert.equal(publishedSeo.sitemap.included, true);
  assert.equal(publishedSeo.articleSchema.datePublished, "2026-08-07T09:00:00.000Z");
});

test("publishing validation reports missing content and SEO reminders", () => {
  const valid = validateBlog(article());
  assert.deepEqual(valid.errors, []);
  assert.ok(valid.wordCount >= 500);

  const incomplete = validateBlog(article({ content: [{ id: "empty", type: "paragraph", text: "" }], relatedServiceUrl: "", ctaUrl: "" }));
  assert.ok(incomplete.errors.includes("Write the article before publishing."));
  assert.ok(incomplete.warnings.includes("No related service page is linked."));
});

test("FAQs are manual structured content included in word count and validation", () => {
  const withFaq = article({
    content: [
      { id: "body", type: "paragraph", text: "Helpful guidance ".repeat(250) },
      {
        id: "faqs",
        type: "faq",
        items: [
          { id: "q1", question: "Can I exercise after Botox?", answer: "Follow the aftercare instructions provided by your treating professional." },
          { id: "q2", question: "Can I touch the treatment area?", answer: "Avoid unnecessary pressure and follow the guidance given at your appointment." },
          { id: "q3", question: "When should I contact the clinic?", answer: "Contact the clinic whenever you have a concern about your recovery or symptoms." },
        ],
      },
    ],
  });
  const validation = validateBlog(withFaq);
  assert.deepEqual(validation.errors, []);
  assert.ok(validation.wordCount > 500);
  assert.equal(validation.warnings.some((warning) => warning.includes("fewer than 3")), false);

  const incompleteFaq = validateBlog(article({
    content: [{ id: "faqs", type: "faq", items: [{ id: "q1", question: "Can I exercise?", answer: "" }] }],
  }));
  assert.ok(incompleteFaq.errors.includes("Complete every FAQ question and answer before publishing."));
});

test("FAQs remain article content without separate FAQPage schema", () => {
  const input = article({
    content: [{
      id: "faqs",
      type: "faq",
      items: [{ id: "q1", question: "How long does treatment take?", answer: "Appointment times vary by treatment and consultation needs." }],
    }],
  });
  const seo = buildBlogTechnicalSeo({ ...input, publishedAt: null, updatedAt: "2026-08-07T10:00:00.000Z" });
  assert.equal(seo.articleSchema["@type"], "BlogPosting");
  assert.equal(JSON.stringify(seo.articleSchema).includes("FAQPage"), false);
});
