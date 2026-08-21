import type { MetadataRoute } from "next";
import { listPublishedBlogs } from "@/lib/blogs/airtable";

const DEFAULT_SITE_URL = "https://harmony-medspa.vercel.app";
const staticPaths = [
  "", "/about-us", "/before-and-afters", "/blog", "/book-now", "/contact-us", "/facials",
  "/facials-and-peels", "/hair-restoration", "/iv-therapy", "/membership", "/peptide-therapy",
  "/services", "/shop", "/skincare", "/wellness",
];

const legacyBlogSlugs = [
  "alleviate-perimenopause-symptoms-with-bhrt",
  "benefits-of-regular-facials-how-they-improve-skin-health-and-appearance",
  "benefits-of-rf-microneedling-skin-texture-firmness",
  "breaking-down-barriers-addressing-common-misconceptions-about-glp-1-medications",
  "feel-the-love-this-valentines-day-reignite-your-passion-with-hormone-replacement-therapy",
  "get-radiant-skin-this-holiday-season-with-skinbetters-best-selling-products",
  "how-glp-1-medications-support-medical-weight-loss",
  "How-Jeuveau-Fits-Into-Your-Anti-Aging-Skincare-Routine",
  "is-laser-resurfacing-safe-for-my-skin-type",
  "iv-therapy-sarasota-energy-hydration-recovery",
  "micro-needling-rf-accelerated-skin-rejuvenation",
  "post-summer-skin-recovery-treating-sun-damage-with-laser-the-perfect-derma-peel",
  "preparing-for-your-laser-session-what-to-avoid-beforehand",
  "restore-confidence-after-weight-loss-how-dermal-fillers-help-rebuild-volume",
  "summer-ready-glp-1-bhrt",
  "the-benefits-of-chemical-peels-for-acne-sun-damage-and-aging",
  "the-collagen-comeback-how-sculptra-rebuilds-your-skin-from-within",
  "the-power-of-vitamins-a-d-k-benefits-of-adk-10-for-your-health",
  "understanding-semaglutide-how-it-works-to-aid-weight-loss",
  "unlocking-radiant-skin-what-is-rf-micro-needling-and-how-it-transforms-your-complexion",
  "unlocking-the-power-of-nutraceuticals-why-hrt-complete-t-e-are-essential-for-optimized-bhrt",
  "unlock-the-benefits-of-thermal-treatments-for-skin-rejuvenation",
  "what-areas-can-be-treated-with-dermal-fillers",
  "what-causes-collagen-to-decrease",
  "what-is-medical-weight-loss",
  "who-is-a-good-candidate-for-injectables",
  "who-is-a-good-candidate-for-rf-microneedling",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL;
  const published = await listPublishedBlogs();
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    ...staticPaths.map((path) => ({ url: `${siteUrl}${path}`, lastModified: now, changeFrequency: path === "/blog" ? "weekly" as const : "monthly" as const })),
    ...legacyBlogSlugs.map((slug) => ({ url: `${siteUrl}/blog/${slug}`, changeFrequency: "monthly" as const })),
    ...published.map((blog) => ({
      url: `${siteUrl}/blog/${blog.slug}`,
      lastModified: blog.updatedAt || blog.publishedAt || now,
      changeFrequency: "monthly" as const,
    })),
  ];
  return Array.from(new Map(entries.map((entry) => [entry.url, entry])).values());
}
