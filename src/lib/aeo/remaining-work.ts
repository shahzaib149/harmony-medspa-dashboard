// AI search programme checklist. Update `done` as items complete.

export type WorkItem = { label: string; detail: string; done: boolean };

export const WORK_ITEMS: WorkItem[] = [
  { label: "Technical foundation", detail: "Site structure that AI crawlers can read", done: true },
  { label: "Structured data", detail: "Clinic, provider, treatments, FAQs and articles", done: true },
  { label: "Canonical tags", detail: "Every page identifies itself correctly", done: true },
  { label: "Sitemap", detail: "82 pages listed", done: true },
  { label: "AI crawler access", detail: "8 AI crawlers explicitly allowed", done: true },
  { label: "Share metadata", detail: "Each page shares its own title and link", done: true },
  { label: "Google Search Console", detail: "Verify the site and submit the sitemap", done: false },
  { label: "Bing Webmaster Tools", detail: "Bing's index feeds ChatGPT search", done: false },
  { label: "Google Business Profile", detail: "Complete services, photos and Q&A", done: false },
  { label: "Review requests", detail: "Automatic request after each visit", done: false },
  { label: "Provider review of medical FAQs", detail: "Three safety answers await Jessica's review", done: false },
  { label: "Answer-first content", detail: "Five priority treatment pages", done: false },
  { label: "Page descriptions", detail: "32 pages still use the sitewide description", done: false },
];
