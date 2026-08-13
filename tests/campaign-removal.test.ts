import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const routeSource = readFileSync(
  "src/app/api/airtable/nurture-enrollments/[recordId]/route.ts",
  "utf8",
);
const clientSource = readFileSync(
  "src/app/campaigns/[campaignSlug]/CampaignDetailClient.tsx",
  "utf8",
);

test("campaign enrollment removal is admin-only and accepts connected enrollments", () => {
  const deleteHandler = routeSource.slice(routeSource.indexOf("export async function DELETE"));

  assert.match(deleteHandler, /requireRole\(request, "admin"\)/);
  assert.doesNotMatch(deleteHandler, /Connected enrollments cannot be removed/);
  assert.match(deleteHandler, /method: "DELETE"/);
  assert.match(deleteHandler, /action: "campaign_enrollment_removed"/);
});

test("campaign leads expose a confirmed removal action without deleting history", () => {
  assert.match(clientSource, /canRemove=\{role === "admin"\}/);
  assert.match(clientSource, /> Remove from Campaign/);
  assert.match(clientSource, /confirmLabel="Remove from campaign"/);
  assert.match(clientSource, /The Lead and all existing communication history will remain available/);
  assert.match(clientSource, /The Lead can be enrolled again later/);
});
