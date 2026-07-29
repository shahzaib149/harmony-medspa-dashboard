import type { BulkEnrollmentResult, BulkEnrollmentResultItem } from "@/lib/types/campaigns";

export function enrollmentDisplayCounts(result: BulkEnrollmentResult) {
  return {
    enrolled: result.enrolled.length,
    skipped: result.skipped.length,
    failed: result.failed.length,
    newLeadsCreated: result.summary.newLeadsCreated,
    existingLeads: result.summary.existingLeads,
    duplicatesSkipped: result.summary.duplicatesSkipped,
    alreadyEnrolled: result.summary.alreadyEnrolled,
  };
}

export function retryableEnrollmentFailures(failed: BulkEnrollmentResultItem[]) {
  return failed.filter((item) => item.retryable === true);
}
