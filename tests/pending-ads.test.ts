import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSerializedDescriptionAssets,
  buildSerializedHeadlineAssets,
  isVerifiedPublishedAd,
  isGoogleAdResourceName,
  normalizePublicationStatus,
  unconfirmedApprovals,
  validatePendingAdPackage,
  WELLNESS_PENDING_AD,
  FEEL_LIKE_YOURSELF_AGAIN_PENDING_AD,
  FINALLY_CARE_YOU_TRUST_PENDING_AD,
} from "../src/lib/google/pending-ads";

test("legacy publication statuses normalize to the workflow contract", () => {
  assert.equal(normalizePublicationStatus("Pending"), "Pending Review");
  assert.equal(normalizePublicationStatus("Approved"), "Pending Review");
  assert.equal(normalizePublicationStatus("processing"), "Publishing");
  assert.equal(normalizePublicationStatus("Published / Created Paused"), "Published");
  assert.equal(normalizePublicationStatus("error"), "Failed");
  assert.equal(normalizePublicationStatus("Rejected"), "Rejected");
});

test("published state requires a PAUSED Google resource", () => {
  const verified = { publication_status: "Published" as const, google_ads_status: "PAUSED", ad_resource_name: "customers/1/adGroupAds/2~3", published_at: "2026-07-22T12:00:00.000Z", published_by: "Admin", publish_error: "" };
  assert.equal(isVerifiedPublishedAd(verified), true);
  assert.equal(isVerifiedPublishedAd({ ...verified, google_ads_status: "" }), false);
  assert.equal(isVerifiedPublishedAd({ ...verified, ad_resource_name: "" }), false);
  assert.equal(isVerifiedPublishedAd({ ...verified, published_at: "" }), false);
  assert.equal(isVerifiedPublishedAd({ ...verified, published_by: "" }), false);
  assert.equal(isVerifiedPublishedAd({ ...verified, publish_error: "Still failed" }), false);
  assert.equal(isGoogleAdResourceName("customers/1/adGroupAds/2~3"), true);
  assert.equal(isGoogleAdResourceName("customers/1/adGroups/2"), false);
});

test("Wellness pending package contains the recovered compliant RSA copy", () => {
  assert.equal(WELLNESS_PENDING_AD.headlines.length, 15);
  assert.equal(WELLNESS_PENDING_AD.descriptions.length, 4);
  assert.equal(WELLNESS_PENDING_AD.adGroupName, "Wellness - Vercel Landing");
  assert.equal(WELLNESS_PENDING_AD.finalUrl, "https://harmony-medspa.vercel.app/landing");
  assert.equal(WELLNESS_PENDING_AD.path1, "Free-Consult");
  assert.equal(WELLNESS_PENDING_AD.path2, "Book-Now");
  assert.equal(WELLNESS_PENDING_AD.headlines[1].text, "Book Your Free Consult");
  assert.equal(WELLNESS_PENDING_AD.descriptions[0].text, "Explore personalized wellness care at Harmony MedSpa. Book a free consultation today.");
  assert.equal(WELLNESS_PENDING_AD.headlines[0].pinnedField, "HEADLINE_1");
  assert.equal(WELLNESS_PENDING_AD.headlines[1].pinnedField, "HEADLINE_2");
  assert.equal(WELLNESS_PENDING_AD.headlines[2].pinnedField, "HEADLINE_3");
  assert.equal(WELLNESS_PENDING_AD.descriptions[0].pinnedField, "DESCRIPTION_1");
});

test("Wellness pending package copy is compliant and only requires factual approvals", () => {
  const errors = validatePendingAdPackage(WELLNESS_PENDING_AD);
  assert.deepEqual(errors, []);
  assert.ok(WELLNESS_PENDING_AD.headlines.every(({ text }) => text.length <= 30));
  assert.ok(WELLNESS_PENDING_AD.descriptions.every(({ text }) => text.length <= 90));
  assert.equal(unconfirmedApprovals(WELLNESS_PENDING_AD).length, 8);
});

test("Feel Like Yourself Again RSA package is valid and unpinned", () => {
  const errors = validatePendingAdPackage(FEEL_LIKE_YOURSELF_AGAIN_PENDING_AD);
  assert.deepEqual(errors, []);
  assert.equal(FEEL_LIKE_YOURSELF_AGAIN_PENDING_AD.headlines.length, 15);
  assert.equal(FEEL_LIKE_YOURSELF_AGAIN_PENDING_AD.descriptions.length, 4);
  assert.equal(FEEL_LIKE_YOURSELF_AGAIN_PENDING_AD.adGroupName, "Med Spa Sarasota");
  assert.equal(FEEL_LIKE_YOURSELF_AGAIN_PENDING_AD.adGroupId, "200264220913");
  assert.equal(FEEL_LIKE_YOURSELF_AGAIN_PENDING_AD.finalUrl, "https://harmony-medspa.vercel.app/landing");
  assert.equal(FEEL_LIKE_YOURSELF_AGAIN_PENDING_AD.path1, "Free-Consult");
  assert.equal(FEEL_LIKE_YOURSELF_AGAIN_PENDING_AD.path2, "Sarasota");
  assert.ok(FEEL_LIKE_YOURSELF_AGAIN_PENDING_AD.headlines.every((h) => h.pinnedField === null));
  assert.ok(FEEL_LIKE_YOURSELF_AGAIN_PENDING_AD.descriptions.every((d) => d.pinnedField === null));
  assert.ok(FEEL_LIKE_YOURSELF_AGAIN_PENDING_AD.headlines.every(({ text }) => text.length <= 30));
  assert.ok(FEEL_LIKE_YOURSELF_AGAIN_PENDING_AD.descriptions.every(({ text }) => text.length <= 90));
  assert.equal(unconfirmedApprovals(FEEL_LIKE_YOURSELF_AGAIN_PENDING_AD).length, 8);
});

test("Finally Care You Trust RSA package is valid and unpinned", () => {
  const errors = validatePendingAdPackage(FINALLY_CARE_YOU_TRUST_PENDING_AD);
  assert.deepEqual(errors, []);
  assert.equal(FINALLY_CARE_YOU_TRUST_PENDING_AD.headlines.length, 15);
  assert.equal(FINALLY_CARE_YOU_TRUST_PENDING_AD.descriptions.length, 4);
  assert.equal(FINALLY_CARE_YOU_TRUST_PENDING_AD.adGroupName, "Med Spa Sarasota");
  assert.equal(FINALLY_CARE_YOU_TRUST_PENDING_AD.adGroupId, "200264220913");
  assert.equal(FINALLY_CARE_YOU_TRUST_PENDING_AD.finalUrl, "https://harmony-medspa.vercel.app/landing");
  assert.equal(FINALLY_CARE_YOU_TRUST_PENDING_AD.path1, "Med-Spa");
  assert.equal(FINALLY_CARE_YOU_TRUST_PENDING_AD.path2, "Sarasota");
  assert.ok(FINALLY_CARE_YOU_TRUST_PENDING_AD.headlines.every((h) => h.pinnedField === null));
  assert.ok(FINALLY_CARE_YOU_TRUST_PENDING_AD.descriptions.every((d) => d.pinnedField === null));
  assert.ok(FINALLY_CARE_YOU_TRUST_PENDING_AD.headlines.every(({ text }) => text.length <= 30));
  assert.ok(FINALLY_CARE_YOU_TRUST_PENDING_AD.descriptions.every(({ text }) => text.length <= 90));
  assert.equal(unconfirmedApprovals(FINALLY_CARE_YOU_TRUST_PENDING_AD).length, 8);
});

test("a valid clinic number can be saved for later call asset setup", () => {
  const review = structuredClone(WELLNESS_PENDING_AD);
  review.assets.callAsset.phoneNumber = "(941) 555-0123";
  const errors = validatePendingAdPackage(review);
  assert.equal(errors.some((error) => error.includes("phone number") || error.includes("call asset")), false);
});

test("Mandrill number can never pass call asset validation", () => {
  const review = structuredClone(WELLNESS_PENDING_AD);
  review.assets.callAsset.phoneNumber = "(863) 862-0501";
  assert.ok(validatePendingAdPackage(review).some((error) => error.includes("Mandrill/SMS")));
});

test("invalid clinic phone numbers are rejected", () => {
  const review = structuredClone(WELLNESS_PENDING_AD);
  review.assets.callAsset.phoneNumber = "555-123";
  assert.ok(validatePendingAdPackage(review).some((error) => error.includes("10-digit US number")));
});

test("unpinned headlines and descriptions omit the pinnedField key entirely in serialized JSON", () => {
  const headlines = [
    { text: "Pinned Headline", pinnedField: "HEADLINE_1" as const },
    { text: "Unpinned Headline", pinnedField: null },
  ];
  const descriptions = [
    { text: "Pinned Description", pinnedField: "DESCRIPTION_1" as const },
    { text: "Unpinned Description", pinnedField: null },
  ];

  const headlineJson = buildSerializedHeadlineAssets(headlines);
  const parsedHeadlines = JSON.parse(headlineJson);
  assert.equal(parsedHeadlines[0].pinnedField, "HEADLINE_1");
  assert.equal("pinnedField" in parsedHeadlines[1], false);

  const descJson = buildSerializedDescriptionAssets(descriptions);
  const parsedDescs = JSON.parse(descJson);
  assert.equal(parsedDescs[0].pinnedField, "DESCRIPTION_1");
  assert.equal("pinnedField" in parsedDescs[1], false);
});

test("validation blocks fewer than 3 headlines or fewer than 2 descriptions", () => {
  const review = structuredClone(WELLNESS_PENDING_AD);
  review.headlines = [
    { text: "Headline 1", pinnedField: null },
    { text: "Headline 2", pinnedField: null },
  ];
  const errors = validatePendingAdPackage(review);
  assert.ok(errors.some((e) => e.includes("3 to 15 non-empty headlines")));

  const review2 = structuredClone(WELLNESS_PENDING_AD);
  review2.descriptions = [{ text: "Desc 1", pinnedField: null }];
  const errors2 = validatePendingAdPackage(review2);
  assert.ok(errors2.some((e) => e.includes("2 to 4 non-empty descriptions")));
});

test("validation blocks character limit violations on headlines, descriptions, and paths", () => {
  const review = structuredClone(WELLNESS_PENDING_AD);
  review.headlines[0].text = "This headline text is definitely way too long for Google Ads limit";
  review.descriptions[0].text = "This description is super long and exceeds the 90 character limit imposed by Google Ads for responsive search ad descriptions and should fail validation.";
  review.path1 = "ThisPathIsWayTooLongForDisplay";

  const errors = validatePendingAdPackage(review);
  assert.ok(errors.some((e) => e.includes("exceeds 30 characters")));
  assert.ok(errors.some((e) => e.includes("exceeds 90 characters")));
  assert.ok(errors.some((e) => e.includes("Display paths must be 15 characters or fewer")));
});

test("validation blocks missing or non-numeric adGroupId", () => {
  const reviewMissing = structuredClone(WELLNESS_PENDING_AD);
  delete reviewMissing.adGroupId;
  assert.ok(validatePendingAdPackage(reviewMissing).some((e) => e.includes("Ad group ID is required")));

  const reviewInvalid = structuredClone(WELLNESS_PENDING_AD);
  reviewInvalid.adGroupId = "abc-invalid";
  assert.ok(validatePendingAdPackage(reviewInvalid).some((e) => e.includes("must be a numeric string")));
});

test("validation blocks two headlines pinned to the same position", () => {
  const review = structuredClone(WELLNESS_PENDING_AD);
  review.headlines[0] = { text: "Headline 1", pinnedField: "HEADLINE_1" };
  review.headlines[1] = { text: "Headline 2", pinnedField: "HEADLINE_1" };

  const errors = validatePendingAdPackage(review);
  assert.ok(errors.some((e) => e.includes("Multiple headlines are pinned to position H1")));
});

test("publish is blocked when approvals are unconfirmed", () => {
  const unconfirmed = unconfirmedApprovals(WELLNESS_PENDING_AD);
  assert.ok(unconfirmed.length > 0, "Default package should have unconfirmed approvals");
  assert.equal(unconfirmed.length, 8);
});

test("publish is allowed when all approvals are confirmed in review package", () => {
  const review = structuredClone(WELLNESS_PENDING_AD);
  review.approvalChecklist = review.approvalChecklist.map((item) => ({ ...item, confirmed: true }));
  const unconfirmed = unconfirmedApprovals(review);
  assert.equal(unconfirmed.length, 0, "Confirmed package should have 0 unconfirmed approvals");
  assert.equal(validatePendingAdPackage(review).length, 0);
});

test("publishAdWebhookUrl throws when MAKE_PUBLISH_AD_WEBHOOK_URL is unset and does not fall back to NEXT_PUBLIC_MAKE_WEBHOOK_URL", async () => {
  const { publishAdWebhookUrl } = await import("../src/lib/make/publish-ad");
  const originalPublishUrl = process.env.MAKE_PUBLISH_AD_WEBHOOK_URL;
  const originalLeadUrl = process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL;

  try {
    delete process.env.MAKE_PUBLISH_AD_WEBHOOK_URL;
    process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL = "https://hook.us2.make.com/dangerous-lead-webhook";

    assert.throws(
      () => publishAdWebhookUrl(),
      /MAKE_PUBLISH_AD_WEBHOOK_URL is not configured/,
      "Must throw when MAKE_PUBLISH_AD_WEBHOOK_URL is missing, refusing to fall back to lead webhook"
    );
  } finally {
    process.env.MAKE_PUBLISH_AD_WEBHOOK_URL = originalPublishUrl;
    process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL = originalLeadUrl;
  }
});
