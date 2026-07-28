import assert from "node:assert/strict";
import test from "node:test";
import {
  isVerifiedPublishedAd,
  isGoogleAdResourceName,
  normalizePublicationStatus,
  unconfirmedApprovals,
  validatePendingAdPackage,
  WELLNESS_PENDING_AD,
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
  assert.equal(WELLNESS_PENDING_AD.headlines[2].pinnedField, "HEADLINE_2");
  assert.equal(WELLNESS_PENDING_AD.descriptions[0].pinnedField, "DESCRIPTION_1");
});

test("Wellness pending package copy is compliant and only requires factual approvals", () => {
  const errors = validatePendingAdPackage(WELLNESS_PENDING_AD);
  assert.deepEqual(errors, []);
  assert.ok(WELLNESS_PENDING_AD.headlines.every(({ text }) => text.length <= 30));
  assert.ok(WELLNESS_PENDING_AD.descriptions.every(({ text }) => text.length <= 90));
  assert.equal(unconfirmedApprovals(WELLNESS_PENDING_AD).length, 8);
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
