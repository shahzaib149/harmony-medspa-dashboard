// Referrer -> source class mapping for lead attribution. Edit the host lists here;
// no component needs to change. Matching is on the hostname and its parent domains,
// so "l.facebook.com" matches "facebook.com".

export type ReferrerClass = "AI" | "Search" | "Social" | "Direct" | "Other";
/** Leads created before referrer capture existed have no value; never count them as Direct. */
export type LeadSourceClass = ReferrerClass | "Not captured";

export const REFERRER_CLASSES: ReferrerClass[] = ["AI", "Search", "Social", "Direct", "Other"];

const OWN_HOSTS = ["harmonymedspafl.com", "harmony-medspa.vercel.app"];

const AI_HOSTS = [
  "chatgpt.com", "chat.openai.com", "openai.com",
  "perplexity.ai",
  "gemini.google.com", "bard.google.com",
  "copilot.microsoft.com",
  "claude.ai",
  "you.com", "meta.ai", "poe.com", "deepseek.com", "grok.com",
];

const SEARCH_HOSTS = [
  "google.com", "bing.com", "duckduckgo.com", "yahoo.com", "search.yahoo.com",
  "ecosia.org", "search.brave.com", "baidu.com", "yandex.com", "aol.com", "startpage.com",
];
// Google's country domains (google.co.uk, google.com.mx, ...).
const GOOGLE_COUNTRY = /(^|\.)google\.(com?\.)?[a-z]{2,3}$/;

const SOCIAL_HOSTS = [
  "facebook.com", "fb.com", "instagram.com", "t.co", "x.com", "twitter.com",
  "linkedin.com", "lnkd.in", "pinterest.com", "tiktok.com", "youtube.com",
  "reddit.com", "nextdoor.com", "threads.net", "snapchat.com",
];

function hostOf(value: string) {
  const raw = value.trim();
  if (!raw) return "";
  try {
    return new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

const matches = (host: string, list: string[]) => list.some((domain) => host === domain || host.endsWith(`.${domain}`));

function classifyHost(host: string): ReferrerClass | null {
  if (!host) return null;
  if (matches(host, OWN_HOSTS)) return "Direct";
  if (matches(host, AI_HOSTS)) return "AI";
  if (matches(host, SEARCH_HOSTS) || GOOGLE_COUNTRY.test(host)) return "Search";
  if (matches(host, SOCIAL_HOSTS)) return "Social";
  return "Other";
}

/**
 * Classify a lead from its stored `Referrer Source` and `UTM Source`.
 * - Empty referrer: the lead predates capture ("Not captured").
 * - AI tools that strip the referrer often still tag links (utm_source=chatgpt.com),
 *   so an AI UTM source wins.
 * - "direct" or this site's own domain counts as Direct.
 */
export function classifyLeadSource(referrerSource: string, utmSource = ""): LeadSourceClass {
  const referrer = referrerSource.trim();
  if (!referrer) return "Not captured";
  const utmHost = hostOf(utmSource);
  if (utmHost && matches(utmHost, AI_HOSTS)) return "AI";
  if (referrer.toLowerCase() === "direct") return "Direct";
  return classifyHost(hostOf(referrer)) ?? "Other";
}

/** Human-readable source name for breakdowns, e.g. "chatgpt.com". */
export function sourceLabel(referrerSource: string, utmSource = ""): string {
  const utmHost = hostOf(utmSource);
  if (utmHost && matches(utmHost, AI_HOSTS)) return utmHost;
  const referrer = referrerSource.trim();
  if (!referrer) return "Not captured";
  if (referrer.toLowerCase() === "direct") return "Direct";
  return hostOf(referrer) || "Other";
}
