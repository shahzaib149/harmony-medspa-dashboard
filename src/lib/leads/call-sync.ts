import "server-only";
import { fetchAccountTimeZone, fetchCallDetails } from "@/lib/google/ads-client";
import { CALL_FIELDS } from "./call-records";
import { attachGoogleCalls, createCalls, invalidateCallsCache, listExistingCalls } from "./call-store";
import { googleCallTime, planCallSync, type IncomingCall } from "./call-sync-plan";

export type CallSyncResult = {
  dryRun: boolean;
  fetched: number;
  skipped: number;
  created: string[];
  linked: string[];
  unchanged: number;
};

export function googleAdsCallsConfigured() {
  return ["GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET", "GOOGLE_ADS_DEVELOPER_TOKEN", "GOOGLE_ADS_REFRESH_TOKEN", "GOOGLE_ADS_CUSTOMER_ID"]
    .every((key) => Boolean(process.env[key]?.trim()));
}

/** Imports Google Ads call details into the Calls table. A dry run reports the plan without writing. */
export async function syncGoogleAdsCalls({ dryRun }: { dryRun: boolean }): Promise<CallSyncResult> {
  const [timeZone, details, existing] = await Promise.all([fetchAccountTimeZone(), fetchCallDetails(), listExistingCalls()]);
  const incoming: IncomingCall[] = [];
  for (const detail of details) {
    const occurredAt = googleCallTime(detail.startCallDateTime, timeZone);
    if (!detail.resourceName || !occurredAt) continue;
    incoming.push({
      googleCall: detail.resourceName,
      occurredAt,
      durationSeconds: detail.durationSeconds,
      missed: detail.status === "MISSED",
      areaCode: detail.areaCode,
      countryCode: detail.countryCode,
      campaignId: detail.campaignId,
      campaignName: detail.campaignName,
    });
  }

  const plan = planCallSync(existing, incoming, new Date().toISOString());
  if (!dryRun && (plan.create.length || plan.link.length)) {
    await attachGoogleCalls(plan.link);
    await createCalls(plan.create);
    invalidateCallsCache();
  }
  return {
    dryRun,
    fetched: details.length,
    skipped: details.length - incoming.length,
    created: plan.create.map((fields) => String(fields[CALL_FIELDS.id])),
    linked: plan.link.map((link) => link.id),
    unchanged: plan.unchanged,
  };
}
