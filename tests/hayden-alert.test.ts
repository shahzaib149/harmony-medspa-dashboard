import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { automaticHaydenAlert } from "../src/lib/leads/hayden-alert";

const lead = (over: Partial<{ leadType: string; classificationMethod: string; classifiedAt: string }>) => ({
  leadType: "Real Lead", classificationMethod: "AI", classifiedAt: "2026-11-17T21:04:00.000Z", ...over,
});

test("automatic alert follows the Speed-to-Lead rule: Real Lead, Unclear, Existing Patient", () => {
  assert.deepEqual(automaticHaydenAlert(lead({})), { at: "2026-11-17T21:04:00.000Z", leadType: "Real Lead" });
  assert.ok(automaticHaydenAlert(lead({ leadType: "Unclear", classificationMethod: "Fallback" })));
  assert.ok(automaticHaydenAlert(lead({ leadType: "Existing Patient", classificationMethod: "Rule" })));
  for (const leadType of ["Solicitor", "Spam", "Job Seeker", "Appointment Change", ""]) assert.equal(automaticHaydenAlert(lead({ leadType })), null);
});

test("no automatic alert without a Speed-to-Lead classification", () => {
  assert.equal(automaticHaydenAlert(lead({ classifiedAt: "" })), null); // manual entries, call leads
  assert.equal(automaticHaydenAlert(lead({ classificationMethod: "Manual" })), null); // staff override
  assert.equal(automaticHaydenAlert(lead({ classificationMethod: "" })), null);
  assert.equal(automaticHaydenAlert(lead({ classifiedAt: "2026-09-20T10:00:00.000Z" })), null); // before the alert step
});

test("the profile shows the Hayden entry and the history route is viewer-protected", () => {
  // The lead details modal moved to the shared LeadUi module (used by Leads and campaign workspaces).
  const client = readFileSync("src/components/leads/LeadUi.tsx", "utf8");
  assert.match(client, /<HaydenNotificationActivity lead=\{lead\}/);
  const route = readFileSync("src/app/api/airtable/leads/[id]/notify-hayden/route.ts", "utf8");
  assert.match(route, /export async function GET[\s\S]*requireRole\(request, "viewer"\)[\s\S]*lead_shared_with_hayden/);
});
