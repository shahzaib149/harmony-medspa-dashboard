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

export type PendingAdPackage = {
  version: 1;
  internalTitle: string;
  strategyLabel: string;
  campaignName: string;
  adGroupName: string;
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
      title: string;
      url: string | null;
      needsUrl: boolean;
      description1: string;
      description2: string;
    }>;
    callouts: string[];
    structuredSnippet: { header: string; values: string[] };
    callAsset: { enabled: false; phoneNumber: string | null; warning: string };
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
  status: string;
  created_at: string;
  reviewPackage: PendingAdPackage;
};

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
  try {
    const url = new URL(review.finalUrl);
    if (url.protocol !== "https:") errors.push("Final URL must use HTTPS.");
  } catch {
    errors.push("Final URL is invalid.");
  }
  if (review.path1.length > 15 || review.path2.length > 15) {
    errors.push("Display paths must be 15 characters or fewer.");
  }
  if (review.headlines.length < 3 || review.headlines.length > 15) {
    errors.push("Responsive search ads require 3 to 15 headlines.");
  }
  if (review.descriptions.length < 2 || review.descriptions.length > 4) {
    errors.push("Responsive search ads require 2 to 4 descriptions.");
  }
  review.headlines.forEach((asset, index) => {
    if (!asset.text.trim()) errors.push(`Headline ${index + 1} is empty.`);
    if (asset.text.length > 30) errors.push(`Headline ${index + 1} exceeds 30 characters.`);
    if (!headlinePins.has(asset.pinnedField)) errors.push(`Headline ${index + 1} has an unsupported pin position.`);
  });
  review.descriptions.forEach((asset, index) => {
    if (!asset.text.trim()) errors.push(`Description ${index + 1} is empty.`);
    if (asset.text.length > 90) errors.push(`Description ${index + 1} exceeds 90 characters.`);
    if (!descriptionPins.has(asset.pinnedField)) errors.push(`Description ${index + 1} has an unsupported pin position.`);
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
  adGroupName: "Wellness",
  adType: "Responsive Search Ad",
  finalUrl: "https://www.harmonymedspafl.com/lead",
  path1: "Free-Consult",
  path2: "Book-Now",
  headlines: [
    { text: "Free Wellness Consultation", pinnedField: "HEADLINE_1" },
    { text: "Book Your Free Consult Today", pinnedField: "HEADLINE_2" },
    { text: "Harmony MedSpa Sarasota", pinnedField: "HEADLINE_2" },
    { text: "Feel Like Yourself Again", pinnedField: null },
    { text: "Tired of Feeling Tired?", pinnedField: null },
    { text: "Medical Weight Loss Programs", pinnedField: null },
    { text: "Hormone Therapy That Works", pinnedField: null },
    { text: "Get Your Energy Back", pinnedField: null },
    { text: "Board-Certified Providers", pinnedField: null },
    { text: "Sarasota's 5-Star Med Spa", pinnedField: null },
    { text: "Personalized Plans, Real Results", pinnedField: null },
    { text: "New Patients Welcome", pinnedField: null },
    { text: "Same-Week Appointments", pinnedField: null },
    { text: "Start Your Transformation", pinnedField: null },
    { text: "Text or Call — Fast Response", pinnedField: null },
  ],
  descriptions: [
    { text: "Claim your free wellness consultation at Harmony MedSpa. Weight loss, hormone therapy & personalized care in Sarasota. Book online in 60 seconds.", pinnedField: "DESCRIPTION_1" },
    { text: "Feeling off, tired, or stuck? Our board-certified team builds a plan around your body and goals. Book your free consult — we respond fast.", pinnedField: null },
    { text: "Sarasota trusts Harmony MedSpa for medical weight loss, BHRT & wellness. New patients welcome. Book today, feel the difference.", pinnedField: null },
    { text: "Real providers, real results. Get a personalized wellness plan at your free consultation. Text, call, or book online now.", pinnedField: null },
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
