export const APPROVAL_ITEMS = [
  { key: "free_consultation", label: "Free consultation is a real approved offer." },
  { key: "same_week", label: "Same-week appointments are realistically available." },
  { key: "board_certified", label: "Board-certified provider claim is approved." },
  { key: "five_star", label: "5-star / trust claim is approved or edited." },
  { key: "final_url", label: "Final URL /lead is approved for ad traffic." },
  { key: "conversion_tracking", label: "Conversion tracking on /lead is active or intentionally bypassed." },
  { key: "medical_claims", label: "No medical claim is unsupported." },
  { key: "phone_number", label: "Clinic phone number is not the Mandrill/SMS sending number." },
] as const;

export type ApprovalKey = (typeof APPROVAL_ITEMS)[number]["key"];
export type HeadlinePin = "HEADLINE_1" | "HEADLINE_2" | "HEADLINE_3" | null;
export type DescriptionPin = "DESCRIPTION_1" | "DESCRIPTION_2" | null;

export type ReviewTextAsset<TPin extends string | null> = {
  text: string;
  pinnedField: TPin;
};

export type PendingAdActivity = {
  type: string;
  at: string;
  actor?: string;
  detail?: string;
};

export const PUBLICATION_STATUSES = [
  "Pending Review",
  "Publishing",
  "Published",
  "Failed",
  "Rejected",
] as const;

export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];

export function normalizePublicationStatus(value: unknown): PublicationStatus {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "publishing" || normalized === "processing") return "Publishing";
  if (normalized === "published" || normalized === "published / created paused" || normalized === "created paused") return "Published";
  if (normalized === "failed" || normalized === "error") return "Failed";
  if (normalized === "rejected") return "Rejected";
  return "Pending Review";
}

export function isGoogleAdResourceName(value: string) {
  return /^customers\/[^/]+\/adGroupAds\/[^/]+$/.test(value.trim());
}

export type PendingAdPackage = {
  version: 1;
  internalTitle: string;
  strategyLabel: string;
  campaignName: string;
  campaignId?: string;
  adGroupName: string;
  adGroupId?: string;
  adType: "Responsive Search Ad";
  finalUrl: string;
  path1: string;
  path2: string;
  headlines: Array<ReviewTextAsset<HeadlinePin>>;
  descriptions: Array<ReviewTextAsset<DescriptionPin>>;
  notes: string;
  recommendedKeywords: Array<{ text: string; matchType: "PHRASE" | "EXACT" }>;
  recommendedNegativeKeywords: string[];
  assets: {
    sitelinks: Array<{
      title?: string;
      linkText?: string;
      url?: string | null;
      needsUrl?: boolean;
      description1: string;
      description2: string;
      finalUrls?: string[];
    }>;
    callouts: Array<string | { calloutText: string }>;
    structuredSnippet: { header: string; values: string[] };
    callAsset: { enabled?: boolean; phoneNumber: string | null; warning?: string };
  };
  approvalChecklist: Array<{
    key: ApprovalKey;
    label: string;
    confirmed: boolean;
  }>;
  history: PendingAdActivity[];
  publication?: {
    resourceName: string;
    adId: string;
    status: "PAUSED";
    publishedAt: string;
    publishedBy: string;
  };
};

export function formatHeadlinesForWebhook(headlines: Array<ReviewTextAsset<HeadlinePin>>): Array<{ text: string; pinnedField?: "HEADLINE_1" | "HEADLINE_2" | "HEADLINE_3" }> {
  return (headlines || [])
    .filter((item) => item && typeof item.text === "string" && item.text.trim().length > 0)
    .slice(0, 15)
    .map((item) => {
      const obj: { text: string; pinnedField?: "HEADLINE_1" | "HEADLINE_2" | "HEADLINE_3" } = {
        text: item.text.trim(),
      };
      if (item.pinnedField) {
        obj.pinnedField = item.pinnedField;
      }
      return obj;
    });
}

export function formatDescriptionsForWebhook(descriptions: Array<ReviewTextAsset<DescriptionPin>>): Array<{ text: string; pinnedField?: "DESCRIPTION_1" | "DESCRIPTION_2" }> {
  return (descriptions || [])
    .filter((item) => item && typeof item.text === "string" && item.text.trim().length > 0)
    .slice(0, 4)
    .map((item) => {
      const obj: { text: string; pinnedField?: "DESCRIPTION_1" | "DESCRIPTION_2" } = {
        text: item.text.trim(),
      };
      if (item.pinnedField) {
        obj.pinnedField = item.pinnedField;
      }
      return obj;
    });
}

export function formatAssetsForWebhook(assets: Partial<PendingAdPackage["assets"]>) {
  return {
    sitelinks: assets?.sitelinks ?? [],
    callouts: assets?.callouts ?? [],
    structuredSnippet: assets?.structuredSnippet ?? { header: "Services", values: [] },
    callAsset: assets?.callAsset ?? { enabled: false, phoneNumber: null },
  };
}

export function buildSerializedHeadlineAssets(headlines: Array<ReviewTextAsset<HeadlinePin>>): string {
  return JSON.stringify(formatHeadlinesForWebhook(headlines));
}

export function buildSerializedDescriptionAssets(descriptions: Array<ReviewTextAsset<DescriptionPin>>): string {
  return JSON.stringify(formatDescriptionsForWebhook(descriptions));
}

export type PublishAdWebhookPayload = {
  event: string;
  action: string;
  idempotencyKey: string;
  requestedStatus: string;
  source: string;
  sentAt: string;
  publishRequestedAt: string;
  publishedBy: string;
  airtableBaseId: string;
  airtableTableId: string;
  publicationStatusField: string;
  googleAdsStatusField: string;
  googleResourceNameField: string;
  publishedAtField: string;
  publishedByField: string;
  publishErrorField: string;
  idempotencyKeyField: string;
  lastStatusSyncField: string;
  pendingAdId: string;
  businessName: string;
  campaignId: string;
  campaignName: string;
  adGroupId: string;
  adGroupName: string;
  adType: string;
  finalUrl: string;
  path1: string;
  path2: string;
  headlineAssetsJson: string;
  descriptionAssetsJson: string;
  allHeadlines: string[];
  headlineAssets: Array<ReviewTextAsset<HeadlinePin>>;
  allDescriptions: string[];
  descriptionAssets: Array<ReviewTextAsset<DescriptionPin>>;
  strategyLabel: string;
  notes: string;
  recommendedKeywords: Array<{ text: string; matchType: "PHRASE" | "EXACT" }>;
  recommendedNegativeKeywords: string[];
  assets: PendingAdPackage["assets"];
  approvalChecklist: Array<{ key: ApprovalKey; label: string; confirmed: boolean }>;
  history: PendingAdActivity[];
  pendingAd: PendingAd;
  reviewPackage: PendingAdPackage;
};

export type PendingAd = {
  id: string;
  ad_resource_name: string;
  business_name: string;
  campaign_name: string;
  ad_group_name: string;
  headline1: string;
  headline2: string;
  headline3: string;
  description1: string;
  description2: string;
  path1: string;
  path2: string;
  final_url: string;
  status: PublicationStatus;
  publication_status: PublicationStatus;
  google_ads_status: string;
  publish_requested_at: string;
  published_at: string;
  published_by: string;
  publish_error: string;
  idempotency_key: string;
  last_status_sync: string;
  created_at: string;
  reviewPackage: PendingAdPackage;
};

export function isVerifiedPublishedAd(ad: Pick<PendingAd, "publication_status" | "google_ads_status" | "ad_resource_name" | "published_at" | "published_by" | "publish_error">) {
  return ad.publication_status === "Published"
    && ad.google_ads_status.trim().toUpperCase() === "PAUSED"
    && isGoogleAdResourceName(ad.ad_resource_name)
    && Boolean(ad.published_at.trim())
    && Boolean(ad.published_by.trim())
    && !ad.publish_error.trim();
}

const MANDRILL_NUMBERS = new Set(["8638620501", "18638620501"]);

function digits(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

export function makeApprovalChecklist() {
  return APPROVAL_ITEMS.map((item) => ({ ...item, confirmed: false }));
}

export function createLegacyReviewPackage(input: {
  businessName: string;
  campaignName: string;
  adGroupName: string;
  finalUrl: string;
  path1: string;
  path2: string;
  headlines: string[];
  descriptions: string[];
}): PendingAdPackage {
  return {
    version: 1,
    internalTitle: input.businessName || "Pending responsive search ad",
    strategyLabel: "Legacy pending ad",
    campaignName: input.campaignName,
    adGroupName: input.adGroupName,
    adType: "Responsive Search Ad",
    finalUrl: input.finalUrl,
    path1: input.path1,
    path2: input.path2,
    headlines: input.headlines.filter(Boolean).map((text) => ({ text, pinnedField: null })),
    descriptions: input.descriptions.filter(Boolean).map((text) => ({ text, pinnedField: null })),
    notes: "Imported from the existing pending-ad fields. Complete the review checklist before publishing.",
    recommendedKeywords: [],
    recommendedNegativeKeywords: [],
    assets: {
      sitelinks: [],
      callouts: [],
      structuredSnippet: { header: "Services", values: [] },
      callAsset: {
        enabled: false,
        phoneNumber: null,
        warning: "Clinic front-desk number required before adding call asset.",
      },
    },
    approvalChecklist: makeApprovalChecklist(),
    history: [],
  };
}

export function parseReviewPackage(value: unknown): PendingAdPackage | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<PendingAdPackage>;
  if (
    candidate.version !== 1 ||
    typeof candidate.internalTitle !== "string" ||
    typeof candidate.campaignName !== "string" ||
    typeof candidate.adGroupName !== "string" ||
    !Array.isArray(candidate.headlines) ||
    !Array.isArray(candidate.descriptions) ||
    !Array.isArray(candidate.approvalChecklist)
  ) return null;
  return candidate as PendingAdPackage;
}

export function reviewPackageFromJson(value: string) {
  if (!value) return null;
  try {
    return parseReviewPackage(JSON.parse(value));
  } catch {
    return null;
  }
}

export function validatePendingAdPackage(review: PendingAdPackage) {
  const errors: string[] = [];
  const headlinePins = new Set<HeadlinePin>([null, "HEADLINE_1", "HEADLINE_2", "HEADLINE_3"]);
  const descriptionPins = new Set<DescriptionPin>([null, "DESCRIPTION_1", "DESCRIPTION_2"]);

  if (!review.internalTitle.trim()) errors.push("Ad name is required.");
  if (!review.campaignName.trim()) errors.push("Campaign is required.");
  if (!review.adGroupName.trim()) errors.push("Ad group is required.");

  if (!review.adGroupId || !review.adGroupId.trim()) {
    errors.push("Ad group ID is required.");
  } else if (!/^\d+$/.test(review.adGroupId.trim())) {
    errors.push("Ad group ID must be a numeric string (e.g. 198124172545).");
  }

  try {
    const url = new URL(review.finalUrl);
    if (url.protocol !== "https:") errors.push("Final URL must use HTTPS.");
  } catch {
    errors.push("Final URL is invalid.");
  }

  if (review.path1.length > 15 || review.path2.length > 15) {
    errors.push("Display paths must be 15 characters or fewer.");
  }

  const nonEmptyHeadlines = review.headlines.filter((h) => h.text.trim());
  if (nonEmptyHeadlines.length < 3 || nonEmptyHeadlines.length > 15) {
    errors.push("Responsive search ads require 3 to 15 non-empty headlines.");
  }

  const nonEmptyDescriptions = review.descriptions.filter((d) => d.text.trim());
  if (nonEmptyDescriptions.length < 2 || nonEmptyDescriptions.length > 4) {
    errors.push("Responsive search ads require 2 to 4 non-empty descriptions.");
  }

  const pinnedHeadlines = new Set<string>();
  review.headlines.forEach((asset, index) => {
    if (!asset.text.trim()) return;
    if (asset.text.length > 30) {
      errors.push(`Headline ${index + 1} exceeds 30 characters.`);
    }
    if (!headlinePins.has(asset.pinnedField)) {
      errors.push(`Headline ${index + 1} has an unsupported pin position.`);
    }
    if (asset.pinnedField) {
      if (pinnedHeadlines.has(asset.pinnedField)) {
        errors.push(`Multiple headlines are pinned to position ${asset.pinnedField.replace("HEADLINE_", "H")}.`);
      } else {
        pinnedHeadlines.add(asset.pinnedField);
      }
    }
  });

  const pinnedDescriptions = new Set<string>();
  review.descriptions.forEach((asset, index) => {
    if (!asset.text.trim()) return;
    if (asset.text.length > 90) {
      errors.push(`Description ${index + 1} exceeds 90 characters.`);
    }
    if (!descriptionPins.has(asset.pinnedField)) {
      errors.push(`Description ${index + 1} has an unsupported pin position.`);
    }
    if (asset.pinnedField) {
      if (pinnedDescriptions.has(asset.pinnedField)) {
        errors.push(`Multiple descriptions are pinned to position ${asset.pinnedField.replace("DESCRIPTION_", "D")}.`);
      } else {
        pinnedDescriptions.add(asset.pinnedField);
      }
    }
  });

  if (review.assets.callAsset.enabled) {
    errors.push("Call asset publishing is not enabled for this workflow.");
  }
  const callAssetDigits = digits(review.assets.callAsset.phoneNumber);
  if (callAssetDigits) {
    if (MANDRILL_NUMBERS.has(callAssetDigits)) {
      errors.push("The Mandrill/SMS automation number cannot be used as a call asset.");
    } else if (!/^\d{10}$/.test(callAssetDigits) && !/^1\d{10}$/.test(callAssetDigits)) {
      errors.push("Clinic phone number must be a valid 10-digit US number.");
    }
  }

  return errors;
}

export function unconfirmedApprovals(review: PendingAdPackage) {
  const byKey = new Map(review.approvalChecklist.map((item) => [item.key, item.confirmed]));
  return APPROVAL_ITEMS.filter((item) => !byKey.get(item.key));
}

export function warningCount(review: PendingAdPackage) {
  return validatePendingAdPackage(review).length + unconfirmedApprovals(review).length;
}

export const WELLNESS_PENDING_AD: PendingAdPackage = {
  version: 1,
  internalTitle: "Wellness Free Consultation RSA",
  strategyLabel: "Free Consult + Emotional Hook + Local Trust",
  campaignName: "Wellness & Aesthetic - Roya",
  campaignId: "24080482948",
  adGroupName: "Wellness - Vercel Landing",
  adGroupId: "198124172545",
  adType: "Responsive Search Ad",
  finalUrl: "https://harmony-medspa.vercel.app/landing",
  path1: "Free-Consult",
  path2: "Book-Now",
  headlines: [
    { text: "Free Wellness Consultation", pinnedField: "HEADLINE_1" },
    { text: "Book Your Free Consult", pinnedField: "HEADLINE_2" },
    { text: "Harmony MedSpa Sarasota", pinnedField: "HEADLINE_3" },
    { text: "Feel Like Yourself Again", pinnedField: null },
    { text: "Personalized Wellness Care", pinnedField: null },
    { text: "Medical Weight Loss", pinnedField: null },
    { text: "Hormone Therapy Options", pinnedField: null },
    { text: "Restore Your Everyday Energy", pinnedField: null },
    { text: "Experienced Medical Team", pinnedField: null },
    { text: "Sarasota Wellness Experts", pinnedField: null },
    { text: "Care Built Around Your Goals", pinnedField: null },
    { text: "New Patients Welcome", pinnedField: null },
    { text: "Convenient Appointments", pinnedField: null },
    { text: "Start Your Wellness Journey", pinnedField: null },
    { text: "Book Online in 60 Seconds", pinnedField: null },
  ],
  descriptions: [
    { text: "Explore personalized wellness care at Harmony MedSpa. Book a free consultation today.", pinnedField: "DESCRIPTION_1" },
    { text: "Discuss weight loss and hormone therapy options with our Sarasota medical team.", pinnedField: null },
    { text: "Get a plan tailored to your goals, lifestyle, and health needs. New patients are welcome.", pinnedField: null },
    { text: "Take the next step with attentive, personalized care. Book online in about 60 seconds.", pinnedField: null },
  ],
  notes: "AI-generated concept for admin review. Copy with claims or offers must be confirmed before creating the paused ad.",
  recommendedKeywords: [
    ...[
      "medical weight loss sarasota",
      "weight loss clinic sarasota",
      "hormone therapy sarasota",
      "hormone replacement therapy sarasota",
      "bhrt sarasota",
      "weight loss doctor near me",
      "wellness clinic sarasota",
      "semaglutide sarasota",
      "med spa weight loss",
      "testosterone therapy sarasota",
    ].map((text) => ({ text, matchType: "PHRASE" as const })),
    ...[
      "harmony med spa",
      "harmony medspa sarasota",
      "medical weight loss near me",
      "hormone therapy near me",
      "weight loss clinic near me",
    ].map((text) => ({ text, matchType: "EXACT" as const })),
  ],
  recommendedNegativeKeywords: [
    "jobs", "hiring", "salary", "career", "school", "training", "certification", "course",
    "diy", "free samples", "cheap", "reddit", "reviews of", "law suit", "lawsuit", "side effects",
  ],
  assets: {
    sitelinks: [
      {
        title: "Book Free Consultation",
        url: "https://www.harmonymedspafl.com/lead",
        needsUrl: false,
        description1: "Takes 60 seconds",
        description2: "We respond same day",
      },
      {
        title: "Weight Loss Programs",
        url: "https://www.harmonymedspafl.com/services/medical-weight-loss.html",
        needsUrl: false,
        description1: "Semaglutide & medical plans",
        description2: "Doctor supervised",
      },
      {
        title: "Hormone Therapy",
        url: "https://www.harmonymedspafl.com/services/hormone-replacement-therapy.html",
        needsUrl: false,
        description1: "BHRT for men & women",
        description2: "Feel balanced again",
      },
      {
        title: "Meet Our Providers",
        url: "https://www.harmonymedspafl.com/our-team.html",
        needsUrl: false,
        description1: "Board-certified team",
        description2: "Trusted in Sarasota",
      },
    ],
    callouts: ["Free Consultation", "Fast Response", "Personalized Plans", "New Patients Welcome", "Board-Certified"],
    structuredSnippet: {
      header: "Services",
      values: ["Weight Loss", "Hormone Therapy", "BHRT", "Wellness Plans"],
    },
    callAsset: {
      enabled: false,
      phoneNumber: null,
      warning: "Clinic front-desk number required before adding call asset.",
    },
  },
  approvalChecklist: makeApprovalChecklist(),
  history: [
    {
      type: "pending_ad_created",
      at: "2026-07-16T00:00:00.000Z",
      actor: "AI ad workflow",
      detail: "Wellness RSA package created for admin review.",
    },
  ],
};

export const FEEL_LIKE_YOURSELF_AGAIN_PENDING_AD: PendingAdPackage = {
  version: 1,
  internalTitle: "Feel Like Yourself Again RSA",
  strategyLabel: "Emotional Transformation + Free Consult + Local Trust",
  campaignName: "Website new",
  campaignId: "24080482948",
  adGroupName: "Med Spa Sarasota",
  adGroupId: "200264220913",
  adType: "Responsive Search Ad",
  finalUrl: "https://harmony-medspa.vercel.app/landing",
  path1: "Free-Consult",
  path2: "Sarasota",
  headlines: [
    { text: "Feel Like Yourself Again", pinnedField: null },
    { text: "At Home In Your Own Skin", pinnedField: null },
    { text: "Med Spa Sarasota", pinnedField: null },
    { text: "Free Consultation Sarasota", pinnedField: null },
    { text: "Look Natural, Feel Better", pinnedField: null },
    { text: "Natural Results, Real Care", pinnedField: null },
    { text: "Harmony Med Spa Sarasota", pinnedField: null },
    { text: "Your Goals Come First", pinnedField: null },
    { text: "Book Your Free Consult", pinnedField: null },
    { text: "Confidence Starts Here", pinnedField: null },
    { text: "Care Built Around You", pinnedField: null },
    { text: "Board-Certified NP Care", pinnedField: null },
    { text: "For Men and Women", pinnedField: null },
    { text: "No Rush, No Pressure", pinnedField: null },
    { text: "Request Your Visit Today", pinnedField: null },
  ],
  descriptions: [
    { text: "Feel like yourself again with natural-looking care from our Sarasota medical team.", pinnedField: null },
    { text: "Book a free consultation and talk through your goals with our Sarasota providers.", pinnedField: null },
    { text: "Personalized aesthetic and wellness care for men and women of all ages in Sarasota.", pinnedField: null },
    { text: "Request your visit online in about a minute. New patients welcome at Harmony.", pinnedField: null },
  ],
  notes: "Emotional Transformation RSA concept created for admin review. Confirm copy and factual claims before publishing.",
  recommendedKeywords: [
    ...[
      "medical spa sarasota",
      "med spa sarasota",
      "best med spa sarasota",
    ].map((text) => ({ text, matchType: "PHRASE" as const })),
    ...[
      "harmony med spa",
      "harmony medspa sarasota",
    ].map((text) => ({ text, matchType: "EXACT" as const })),
  ],
  recommendedNegativeKeywords: [
    "jobs", "hiring", "salary", "career", "school", "training", "cheap", "diy",
  ],
  assets: {
    sitelinks: [
      {
        title: "Book Free Consultation",
        url: "https://www.harmonymedspafl.com/lead",
        needsUrl: false,
        description1: "Takes 60 seconds",
        description2: "We respond same day",
      },
      {
        title: "Aesthetic Treatments",
        url: "https://www.harmonymedspafl.com/",
        needsUrl: false,
        description1: "Botox, fillers & lasers",
        description2: "Natural-looking results",
      },
      {
        title: "Meet Our Providers",
        url: "https://www.harmonymedspafl.com/our-team.html",
        needsUrl: false,
        description1: "Board-certified NP team",
        description2: "Trusted in Sarasota",
      },
    ],
    callouts: ["Free Consultation", "Board-Certified NP", "Natural Results", "New Patients Welcome"],
    structuredSnippet: {
      header: "Services",
      values: ["Botox & Fillers", "Skin Rejuvenation", "Laser Treatments", "Wellness Care"],
    },
    callAsset: {
      enabled: false,
      phoneNumber: null,
      warning: "Clinic front-desk number required before adding call asset.",
    },
  },
  approvalChecklist: makeApprovalChecklist(),
  history: [
    {
      type: "pending_ad_created",
      at: "2026-07-31T00:00:00.000Z",
      actor: "AI ad workflow",
      detail: "Feel Like Yourself Again RSA package created for admin review.",
    },
  ],
};

export const FINALLY_CARE_YOU_TRUST_PENDING_AD: PendingAdPackage = {
  version: 1,
  internalTitle: "Finally Care You Trust RSA",
  strategyLabel: "Trust + No-Pressure Positioning + Free Consult",
  campaignName: "Website new",
  campaignId: "24080482948",
  adGroupName: "Med Spa Sarasota",
  adGroupId: "200264220913",
  adType: "Responsive Search Ad",
  finalUrl: "https://harmony-medspa.vercel.app/landing",
  path1: "Med-Spa",
  path2: "Sarasota",
  headlines: [
    { text: "Finally, Care You Trust", pinnedField: null },
    { text: "Honest Answers, No Sales", pinnedField: null },
    { text: "Medical Spa Sarasota", pinnedField: null },
    { text: "Free Consult, No Pressure", pinnedField: null },
    { text: "We Explain Everything", pinnedField: null },
    { text: "Talk To A Real Provider", pinnedField: null },
    { text: "Ask Us Anything First", pinnedField: null },
    { text: "Sarasota Med Spa Team", pinnedField: null },
    { text: "Full-Service Med Spa", pinnedField: null },
    { text: "Book A Free Consult", pinnedField: null },
    { text: "Trusted By Sarasota Patients", pinnedField: null },
    { text: "Skin, Body & Wellness", pinnedField: null },
    { text: "Start With Questions", pinnedField: null },
    { text: "Request Your Consult", pinnedField: null },
    { text: "Natural, Not Overdone", pinnedField: null },
  ],
  descriptions: [
    { text: "We explain everything honestly and never pressure you. Book a free consultation today.", pinnedField: null },
    { text: "Talk with a board-certified nurse practitioner about what you actually need.", pinnedField: null },
    { text: "Skin, body and wellness care in one Sarasota clinic. Ask us anything, no obligation.", pinnedField: null },
    { text: "Request your free consultation online in about a minute. Trusted by Sarasota patients.", pinnedField: null },
  ],
  notes: "Trust + No-Pressure Positioning RSA concept created for admin review. Confirm copy and factual claims before publishing.",
  recommendedKeywords: [
    ...[
      "medical spa sarasota",
      "med spa sarasota fl",
      "trusted med spa sarasota",
    ].map((text) => ({ text, matchType: "PHRASE" as const })),
    ...[
      "harmony med spa",
      "harmony medspa sarasota",
    ].map((text) => ({ text, matchType: "EXACT" as const })),
  ],
  recommendedNegativeKeywords: [
    "jobs", "hiring", "salary", "career", "school", "training", "cheap", "diy",
  ],
  assets: {
    sitelinks: [
      {
        title: "Book Free Consultation",
        url: "https://www.harmonymedspafl.com/lead",
        needsUrl: false,
        description1: "Takes 60 seconds",
        description2: "We respond same day",
      },
      {
        title: "Aesthetic Treatments",
        url: "https://www.harmonymedspafl.com/",
        needsUrl: false,
        description1: "Botox, fillers & lasers",
        description2: "Natural-looking results",
      },
      {
        title: "Meet Our Providers",
        url: "https://www.harmonymedspafl.com/our-team.html",
        needsUrl: false,
        description1: "Board-certified NP team",
        description2: "Trusted in Sarasota",
      },
    ],
    callouts: ["Free Consultation", "Board-Certified NP", "No Sales Pressure", "Trusted Care"],
    structuredSnippet: {
      header: "Services",
      values: ["Botox & Fillers", "Skin Rejuvenation", "Laser Treatments", "Wellness Care"],
    },
    callAsset: {
      enabled: false,
      phoneNumber: null,
      warning: "Clinic front-desk number required before adding call asset.",
    },
  },
  approvalChecklist: makeApprovalChecklist(),
  history: [
    {
      type: "pending_ad_created",
      at: "2026-07-31T00:00:00.000Z",
      actor: "AI ad workflow",
      detail: "Finally Care You Trust RSA package created for admin review.",
    },
  ],
};

