import assert from "node:assert/strict";
import test from "node:test";
import {
  unconfirmedApprovals,
  validatePendingAdPackage,
  WELLNESS_PENDING_AD,
} from "../src/lib/google/pending-ads";

test("Wellness pending package contains the full requested RSA copy", () => {
  assert.equal(WELLNESS_PENDING_AD.headlines.length, 15);
  assert.equal(WELLNESS_PENDING_AD.descriptions.length, 4);
  assert.equal(WELLNESS_PENDING_AD.finalUrl, "https://www.harmonymedspafl.com/lead");
  assert.equal(WELLNESS_PENDING_AD.path1, "Free-Consult");
  assert.equal(WELLNESS_PENDING_AD.path2, "Book-Now");
  assert.equal(WELLNESS_PENDING_AD.headlines[0].pinnedField, "HEADLINE_1");
  assert.equal(WELLNESS_PENDING_AD.headlines[1].pinnedField, "HEADLINE_2");
  assert.equal(WELLNESS_PENDING_AD.headlines[2].pinnedField, "HEADLINE_2");
  assert.equal(WELLNESS_PENDING_AD.descriptions[0].pinnedField, "DESCRIPTION_1");
});

test("Wellness pending package uses professional copy within Google Ads limits", () => {
  const errors = validatePendingAdPackage(WELLNESS_PENDING_AD);
  assert.deepEqual(errors, []);
  assert.ok(WELLNESS_PENDING_AD.headlines.every(({ text }) => text.length <= 30));
  assert.ok(WELLNESS_PENDING_AD.descriptions.every(({ text }) => text.length <= 90));
  assert.equal(unconfirmedApprovals(WELLNESS_PENDING_AD).length, 8);
});

test("a valid clinic number can be saved for later call asset setup", () => {
  const review = structuredClone(WELLNESS_PENDING_AD);
  review.assets.callAsset.phoneNumber = "(941) 555-0123";
  assert.deepEqual(validatePendingAdPackage(review), []);
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
