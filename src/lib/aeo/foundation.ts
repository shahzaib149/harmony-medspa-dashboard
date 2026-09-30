// Phase 1 (AI search foundation) results for harmonymedspafl.com.
// Source: verified against the live site and the website repository on
// 29 Sep 2026 when the work shipped (website main @ 19032ea). Static on purpose:
// these describe completed work and are not re-measured. Figures are as of that
// date; the sitemap grows as blog posts are published.

export const FOUNDATION_LIVE_SINCE = "2026-09-29";

export type FoundationMetric = {
  id: string;
  value: string;
  /** Optional "before" value shown struck through next to the result. */
  before?: string;
  label: string;
  /** Plain-English reason it matters, for a non-technical reader. */
  why: string;
};

/** The two results that carry the report. */
export const HEADLINE_METRICS: FoundationMetric[] = [
  {
    id: "sitemap",
    value: "82",
    before: "15",
    label: "pages listed in the sitemap",
    why: "The sitemap is the list search engines and AI crawlers use to find pages. Every treatment page and the provider page are now on it.",
  },
  {
    id: "canonicals",
    value: "32",
    label: "pages no longer marked as copies of the homepage",
    why: "These pages told search engines they were duplicates of the homepage, so they were unlikely to be indexed or cited on their own. Each now identifies itself.",
  },
];

export const SUPPORTING_METRICS: FoundationMetric[] = [
  {
    id: "schema-types",
    value: "7",
    label: "types of structured data",
    why: "Machine-readable facts about the clinic, Jessica Simone, AGNP-C, each treatment, FAQs and articles.",
  },
  {
    id: "validator-errors",
    value: "0",
    label: "errors in Google and Schema.org tests",
    why: "Both official validators read the structured data without a single error.",
  },
  {
    id: "ai-crawlers",
    value: "8",
    label: "AI crawlers explicitly allowed",
    why: "ChatGPT, Perplexity, Claude, Gemini and Apple's crawlers are named and welcome in robots.txt.",
  },
  {
    id: "share-metadata",
    value: "82",
    label: "pages with their own share title and link",
    why: "Links shared or quoted anywhere now show the right page, not the homepage.",
  },
  {
    id: "bugs-fixed",
    value: "2",
    label: "live site faults fixed",
    why: "A redirect loop that made the Jeuveau article unreachable, and a duplicate hormone therapy article.",
  },
];

export const FOUNDATION_SCOPE = {
  does: "Makes every page of harmonymedspafl.com easy for AI systems to find, read and cite, with the clinic's name, address, provider and treatments stated as facts.",
  doesNot: "It does not by itself make AI tools recommend Harmony. Mentions depend on reviews, the Google Business Profile and the content on each page.",
} as const;
