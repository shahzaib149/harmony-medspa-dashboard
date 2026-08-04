import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import {
  airtableFetch,
  listRecords,
  mapLead,
  normalizeUsPhone,
  invalidateLeadsBaseCache,
  type AirtableRecord,
} from "@/lib/airtable/leads-base";
import {
  AirtableRequestError,
  activeNurtureLeadIds,
  airtableTransportFailure,
  buildNurtureEnrollmentFields,
  isAirtableRecordId,
  NURTURE_ACTIVE_STATUS,
  NURTURE_FIELDS,
  parseAirtableErrorResponse,
} from "@/lib/airtable/nurture-enrollment";
import { isAirtableConfigured } from "@/lib/airtable/config";
import type {
  BulkEnrollmentRequest,
  BulkEnrollmentResult,
  BulkEnrollmentResultItem,
  BulkEnrollNewLead,
} from "@/lib/types/campaigns";
import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { createServiceClient } from "@/lib/supabase/server";
import { chunkAirtableRecords } from "@/lib/airtable/batch";
import { enrollmentClaimIdentity } from "@/lib/campaigns/enrollment-idempotency";
import { campaignRequiresSmsPermission } from "@/lib/campaigns/registry";
import {
  NURTURE_TIMEZONE,
  NurtureScheduleError,
  validateNurtureSchedulePayload,
} from "@/lib/campaigns/nurture-schedule";

const CAMPAIGN_SLUG = "14-day-nurture";
const LOOKUP_BATCH_SIZE = 15;
const REQUEST_DEADLINE_MS = 45_000;
const CLAIM_TTL_MS = 2 * 60_000;
const blocked = new Set(["Booked", "Duplicate", "Failed", "Not Interested"]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type EnrollmentInput = {
  claimKey: string;
  identityHash: string;
  kind: "existing" | "new";
  leadId?: string;
  rowId?: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  message: string;
  notes: string;
};

type ResolvedInput = EnrollmentInput & { leadId: string; record: AirtableRecord };
type ClaimRecord = {
  idempotency_key: string;
  request_id: string;
  status: "processing" | "completed";
  lead_id: string | null;
  enrollment_id: string | null;
};
type MemoryClaim = ClaimRecord & { expiresAt: number };

const globalClaims = globalThis as typeof globalThis & {
  harmonyEnrollmentClaims?: Map<string, MemoryClaim>;
};
const memoryClaims = globalClaims.harmonyEnrollmentClaims ??= new Map<string, MemoryClaim>();

class EnrollmentTimeoutError extends Error {}

async function withProviderTimeout<T>(operation: PromiseLike<T>, message: string): Promise<T> {
  return Promise.race([
    Promise.resolve(operation),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(message)), 8_000)),
  ]);
}

function normalizeEmail(value: string | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function phoneDigits(value: string | undefined) {
  return (value ?? "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
}

function escapeFormula(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function requestIdFrom(request: Request) {
  const candidate = request.headers.get("x-request-id")?.trim();
  return candidate && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate) ? candidate : randomUUID();
}

function claimIdentity(kind: "existing" | "new", identity: string, scheduledAtUtc: string) {
  return enrollmentClaimIdentity(CAMPAIGN_SLUG, kind, identity, scheduledAtUtc);
}

function item(input: Partial<EnrollmentInput>, reason?: string, retryable?: boolean): BulkEnrollmentResultItem {
  return { leadId: input.leadId, rowId: input.rowId, name: input.name, reason, retryable };
}

function chunks<T>(items: T[], size: number) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, index * size + size),
  );
}

function ensureWithinDeadline(deadline: number) {
  if (Date.now() >= deadline) throw new EnrollmentTimeoutError("Enrollment took too long to complete.");
}

async function listByTerms(table: string, terms: string[], deadline: number) {
  const records: AirtableRecord[] = [];
  for (const batch of chunks([...new Set(terms)], LOOKUP_BATCH_SIZE)) {
    ensureWithinDeadline(deadline);
    const formula = batch.length === 1 ? batch[0] : `OR(${batch.join(",")})`;
    records.push(...await listRecords(table, new URLSearchParams({ filterByFormula: formula })));
  }
  return records;
}

async function activeEnrollmentLeadIds(deadline: number) {
  ensureWithinDeadline(deadline);
  const params = new URLSearchParams({ filterByFormula: `{${NURTURE_FIELDS.status}}='${NURTURE_ACTIVE_STATUS}'` });
  params.append("fields[]", NURTURE_FIELDS.lead);
  const records = await listRecords("Nurture Enrollments", params);
  return activeNurtureLeadIds(records);
}

function normalizeNewInputs(inputs: BulkEnrollNewLead[], scheduledAtUtc: string, result: BulkEnrollmentResult) {
  const normalized: EnrollmentInput[] = [];
  const seenEmails = new Set<string>();
  const seenPhones = new Set<string>();

  for (const raw of inputs) {
    const rowId = "rowId" in raw && typeof raw.rowId === "string" ? raw.rowId : undefined;
    const name = raw.name?.trim() ?? "";
    const email = normalizeEmail(raw.email);
    const phone = normalizeUsPhone(raw.phone ?? "") ?? "";
    const phoneKey = phoneDigits(phone);
    const invalid = !name
      ? "Name is required"
      : !email || !phone
        ? "Email and phone are required for the complete nurture sequence"
        : !emailPattern.test(email)
          ? "Email is invalid"
          : "";
    if (invalid) {
      result.failed.push({ rowId, name: name || raw.name, reason: invalid, retryable: false });
      result.summary.invalid += 1;
      continue;
    }
    if (seenEmails.has(email) || seenPhones.has(phoneKey)) {
      result.skipped.push({ rowId, name, reason: "Duplicate row in this submission" });
      result.summary.duplicatesSkipped += 1;
      continue;
    }
    seenEmails.add(email);
    seenPhones.add(phoneKey);
    const claim = claimIdentity("new", email || phoneKey, scheduledAtUtc);
    normalized.push({
      ...claim,
      kind: "new",
      rowId,
      name,
      email,
      phone,
      source: raw.source?.trim() || "Manual Campaign Entry",
      message: raw.message?.trim() || "",
      notes: raw.notes?.trim() || "",
    });
  }
  return normalized;
}

async function acquireClaims(inputs: EnrollmentInput[], requestId: string, scheduledAtUtc: string) {
  if (!inputs.length) return { owned: [] as EnrollmentInput[], existing: new Map<string, ClaimRecord>() };
  const service = createServiceClient();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CLAIM_TTL_MS).toISOString();
  const rows = inputs.map((input) => ({
    idempotency_key: input.claimKey,
    campaign_slug: CAMPAIGN_SLUG,
    identity_hash: input.identityHash,
    scheduled_at: scheduledAtUtc,
    request_id: requestId,
    status: "processing",
    expires_at: expiresAt,
    updated_at: now.toISOString(),
  }));
  const { error: insertError } = await withProviderTimeout(service
    .from("campaign_enrollment_claims")
    .upsert(rows, { onConflict: "idempotency_key", ignoreDuplicates: true }), "Enrollment idempotency storage timed out.");
  if (insertError) return acquireMemoryClaims(inputs, requestId);
  const { data, error } = await withProviderTimeout(service
    .from("campaign_enrollment_claims")
    .select("idempotency_key,request_id,status,lead_id,enrollment_id")
    .in("idempotency_key", inputs.map((input) => input.claimKey)), "Enrollment idempotency lookup timed out.");
  if (error) return acquireMemoryClaims(inputs, requestId);
  const existing = new Map((data as ClaimRecord[] | null)?.map((claim) => [claim.idempotency_key, claim]) ?? []);
  return { owned: inputs.filter((input) => existing.get(input.claimKey)?.request_id === requestId), existing };
}

function acquireMemoryClaims(inputs: EnrollmentInput[], requestId: string) {
  const now = Date.now();
  for (const [key, claim] of memoryClaims) {
    if (claim.status === "processing" && claim.expiresAt <= now) memoryClaims.delete(key);
  }
  for (const input of inputs) {
    if (!memoryClaims.has(input.claimKey)) {
      memoryClaims.set(input.claimKey, {
        idempotency_key: input.claimKey,
        request_id: requestId,
        status: "processing",
        lead_id: input.leadId ?? null,
        enrollment_id: null,
        expiresAt: now + CLAIM_TTL_MS,
      });
    }
  }
  const existing = new Map(inputs.flatMap((input) => {
    const claim = memoryClaims.get(input.claimKey);
    return claim ? [[input.claimKey, claim] as const] : [];
  }));
  return { owned: inputs.filter((input) => existing.get(input.claimKey)?.request_id === requestId), existing };
}

function settleMemoryClaims(
  requestId: string,
  completed: Array<{ input: EnrollmentInput; leadId: string; enrollmentId?: string }>,
  releaseKeys: string[],
) {
  completed.forEach(({ input, leadId, enrollmentId }) => {
    memoryClaims.set(input.claimKey, {
      idempotency_key: input.claimKey,
      request_id: requestId,
      status: "completed",
      lead_id: leadId,
      enrollment_id: enrollmentId ?? null,
      expiresAt: Date.now() + 30 * 86400_000,
    });
  });
  releaseKeys.forEach((key) => {
    if (memoryClaims.get(key)?.request_id === requestId) memoryClaims.delete(key);
  });
}

async function settleClaims(
  requestId: string,
  scheduledAtUtc: string,
  completed: Array<{ input: EnrollmentInput; leadId: string; enrollmentId?: string }>,
  releaseKeys: string[],
) {
  const service = createServiceClient();
  try {
    if (completed.length) {
      const { error } = await withProviderTimeout(service.from("campaign_enrollment_claims").upsert(
        completed.map(({ input, leadId, enrollmentId }) => ({
          idempotency_key: input.claimKey,
          campaign_slug: CAMPAIGN_SLUG,
          identity_hash: input.identityHash,
          scheduled_at: scheduledAtUtc,
          request_id: requestId,
          status: "completed",
          lead_id: leadId,
          enrollment_id: enrollmentId ?? null,
          expires_at: new Date(Date.now() + 30 * 86400_000).toISOString(),
          updated_at: new Date().toISOString(),
        })),
        { onConflict: "idempotency_key" },
      ), "Enrollment idempotency finalization timed out.");
      if (error) throw error;
    }
    if (releaseKeys.length) {
      const { error } = await withProviderTimeout(service
        .from("campaign_enrollment_claims")
        .delete()
        .eq("request_id", requestId)
        .in("idempotency_key", [...new Set(releaseKeys)]), "Enrollment idempotency cleanup timed out.");
      if (error) throw error;
    }
  } catch {
    settleMemoryClaims(requestId, completed, releaseKeys);
  }
}

async function batchWrite(
  method: "POST" | "PATCH",
  table: string,
  records: Array<{ fields: Record<string, unknown>; id?: string }>,
  deadline: number,
) {
  ensureWithinDeadline(deadline);
  const response = await airtableFetch(encodeURIComponent(table), {
    method,
    body: JSON.stringify({ records, typecast: false }),
  });
  if (!response.ok) throw new AirtableRequestError(await parseAirtableErrorResponse(response));
  return response.json() as Promise<{ records: AirtableRecord[] }>;
}

function operationFailure(error: unknown, fallback: string) {
  if (error instanceof AirtableRequestError) {
    return {
      code: error.airtable.code,
      message: error.airtable.message,
      details: error.airtable.details,
      reason: error.airtable.details,
      retryable: error.airtable.retryable,
    };
  }
  const transportFailure = airtableTransportFailure(error);
  if (transportFailure) return transportFailure;
  return {
    code: "ENROLLMENT_FAILED",
    message: fallback,
    details: fallback,
    reason: error instanceof Error ? error.message : fallback,
    retryable: true,
  };
}

function recordFailure(result: BulkEnrollmentResult, failure: ReturnType<typeof operationFailure>) {
  result.code ??= failure.code;
  result.message ??= failure.message;
  result.error ??= { code: failure.code, message: failure.message, details: failure.details };
  result.retryable = Boolean(result.retryable || failure.retryable);
}

function logAirtableFailure(error: unknown, context: {
  requestId: string;
  table: string;
  fieldNames: string[];
  leadRecordIds: string[];
  nextSendAt?: string;
}) {
  if (!(error instanceof AirtableRequestError)) return;
  console.error("[nurture-enrollment] Airtable request rejected", {
    requestId: context.requestId,
    airtableStatus: error.airtable.status,
    airtableErrorType: error.airtable.type || "unknown",
    airtableErrorMessage: error.airtable.providerMessage || "No provider message returned",
    table: context.table,
    fieldNames: context.fieldNames,
    leadRecordIds: context.leadRecordIds,
    nextSendAt: context.nextSendAt,
  });
}

function auditResult(actor: Awaited<ReturnType<typeof requireRole>>["profile"], request: Request, result: BulkEnrollmentResult) {
  after(async () => {
    await logAuditEvent({
      actor,
      action: result.summary.enrollmentsCreated ? "campaign_enrollment_started" : "action_failed",
      category: "campaigns",
      resource: { type: "campaign", id: CAMPAIGN_SLUG, label: "14-Day Nurture" },
      summary: result.summary.enrollmentsCreated
        ? `Started nurture enrollment for ${result.summary.enrollmentsCreated} leads`
        : "Nurture enrollment did not create any enrollments",
      metadata: {
        total_rows: result.summary.selected,
        existing_leads: result.summary.existingLeads,
        created_leads: result.summary.newLeadsCreated,
        created_enrollments: result.summary.enrollmentsCreated,
        duplicates_skipped: result.summary.duplicatesSkipped,
        already_enrolled: result.summary.alreadyEnrolled,
        invalid_rows: result.summary.invalid,
        failed_rows: result.summary.failed,
      },
      result: result.summary.enrollmentsCreated || !result.summary.failed ? "success" : "failed",
      request,
    });
  });
}

function responseStatus(result: BulkEnrollmentResult) {
  if (result.summary.enrollmentsCreated) return 201;
  if (result.code === "AIRTABLE_AUTH_ERROR") return 502;
  if (result.code === "AIRTABLE_TIMEOUT") return 504;
  if (result.code === "AIRTABLE_RATE_LIMITED" || result.code === "AIRTABLE_REQUEST_FAILED") return 503;
  if (result.summary.failed) return 422;
  return 200;
}

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  let actor;
  try {
    ({ profile: actor } = await requireRole(request, "admin"));
  } catch (error) {
    return authErrorResponse(error);
  }
  if (!isAirtableConfigured()) {
    return Response.json({ success: false, code: "AIRTABLE_UNAVAILABLE", message: "Airtable is not configured", retryable: true, requestId }, { status: 503 });
  }

  const body = await request.json().catch(() => null) as (BulkEnrollmentRequest & { enrollmentNote?: string }) | null;
  if (!body || !Array.isArray(body.leadIds) || !Array.isArray(body.newLeads)) {
    return Response.json({ success: false, code: "INVALID_REQUEST", message: "Invalid enrollment request", retryable: false, requestId }, { status: 400 });
  }
  if (campaignRequiresSmsPermission(CAMPAIGN_SLUG) && body.smsPermissionVerified !== true) {
    return Response.json({
      success: false,
      code: "SMS_PERMISSION_REQUIRED",
      message: "Verify SMS permission for all selected Leads before enrolling them.",
      retryable: false,
      requestId,
    }, { status: 400 });
  }
  if (body.scheduledTimezone !== NURTURE_TIMEZONE) {
    return Response.json({ success: false, code: "INVALID_SCHEDULE", message: "The nurture campaign timezone must be America/New_York", retryable: false, requestId }, { status: 400 });
  }

  let schedule;
  try {
    schedule = validateNurtureSchedulePayload(body, { requireFuture: true });
  } catch (error) {
    return Response.json({
      success: false,
      code: "INVALID_SCHEDULE",
      message: error instanceof NurtureScheduleError ? error.message : "The enrollment schedule is invalid.",
      retryable: false,
      requestId,
    }, { status: 400 });
  }

  const selectedCount = body.leadIds.length + body.newLeads.length;
  if (selectedCount > 500) {
    return Response.json({ success: false, code: "BATCH_TOO_LARGE", message: "Enrollment is limited to 500 leads", retryable: false, requestId }, { status: 400 });
  }

  const result: BulkEnrollmentResult = {
    success: false,
    partial: false,
    requestId,
    summary: {
      selected: selectedCount,
      existingLeads: 0,
      newLeadsCreated: 0,
      enrollmentsCreated: 0,
      duplicatesSkipped: 0,
      alreadyEnrolled: 0,
      invalid: 0,
      failed: 0,
    },
    enrolled: [],
    skipped: [],
    failed: [],
  };
  const deadline = Date.now() + REQUEST_DEADLINE_MS;
  const releaseKeys: string[] = [];
  let claimedKeys: string[] = [];
  const completedClaims: Array<{ input: EnrollmentInput; leadId: string; enrollmentId?: string }> = [];

  try {
    const existingInputs: EnrollmentInput[] = [];
    const seenLeadIds = new Set<string>();
    for (const leadId of body.leadIds) {
      if (!isAirtableRecordId(leadId)) {
        result.failed.push({ leadId, reason: "Lead ID is invalid", retryable: false });
        result.summary.invalid += 1;
      } else if (seenLeadIds.has(leadId)) {
        result.skipped.push({ leadId, reason: "Duplicate Lead in this submission" });
        result.summary.duplicatesSkipped += 1;
      } else {
        seenLeadIds.add(leadId);
        const claim = claimIdentity("existing", leadId, schedule.scheduledAtUtc);
        existingInputs.push({ ...claim, kind: "existing", leadId, name: "", email: "", phone: "", source: "", message: "", notes: "" });
      }
    }
    const newInputs = normalizeNewInputs(body.newLeads, schedule.scheduledAtUtc, result);
    const prepared = [...existingInputs, ...newInputs];
    const { owned, existing: claims } = await acquireClaims(prepared, requestId, schedule.scheduledAtUtc);
    claimedKeys = owned.map((input) => input.claimKey);
    const ownedKeys = new Set(owned.map((input) => input.claimKey));
    for (const input of prepared) {
      if (ownedKeys.has(input.claimKey)) continue;
      const claim = claims.get(input.claimKey);
      result.skipped.push(item(input, claim?.status === "completed" ? "Already processed for this schedule" : "Enrollment is already processing", true));
      result.summary.alreadyEnrolled += claim?.status === "completed" ? 1 : 0;
    }

    const lookupTerms = owned.flatMap((input) => {
      if (input.kind === "existing") return [`RECORD_ID()='${escapeFormula(input.leadId!)}'`];
      return [`OR(LOWER({Email}&'')='${escapeFormula(input.email)}',{Phone}='${escapeFormula(input.phone)}')`];
    });
    const leadRecords = lookupTerms.length ? await listByTerms("Leads", lookupTerms, deadline) : [];
    const byId = new Map(leadRecords.map((record) => [record.id, record]));
    const byEmail = new Map<string, AirtableRecord>();
    const byPhone = new Map<string, AirtableRecord>();
    leadRecords.forEach((record) => {
      const email = normalizeEmail(String(record.fields.Email ?? ""));
      const phone = phoneDigits(String(record.fields.Phone ?? ""));
      if (email) byEmail.set(email, record);
      if (phone) byPhone.set(phone, record);
    });

    const resolved: ResolvedInput[] = [];
    const createInputs: EnrollmentInput[] = [];
    for (const input of owned) {
      const record = input.kind === "existing"
        ? byId.get(input.leadId!)
        : byEmail.get(input.email) ?? byPhone.get(phoneDigits(input.phone));
      if (!record) {
        if (input.kind === "existing") {
          result.failed.push(item(input, "Lead does not exist", false));
          result.summary.invalid += 1;
          releaseKeys.push(input.claimKey);
        } else {
          createInputs.push(input);
        }
        continue;
      }
      const lead = mapLead(record);
      input.name = lead.name;
      input.email = normalizeEmail(lead.email);
      input.phone = normalizeUsPhone(lead.phone) ?? "";
      input.leadId = record.id;
      result.summary.existingLeads += 1;
      const reason = blocked.has(lead.status)
        ? lead.status
        : lead.replied
          ? "Replied"
          : !input.email || !emailPattern.test(input.email) || !input.phone
            ? "Valid email and US phone are required"
            : "";
      if (reason) {
        result.skipped.push(item(input, reason));
        releaseKeys.push(input.claimKey);
      } else {
        resolved.push({ ...input, leadId: record.id, record });
      }
    }

    for (const batch of chunkAirtableRecords(createInputs)) {
      try {
        const leadRecordsToCreate = batch.map((input) => {
          const fields: Record<string, unknown> = {
            Name: input.name,
            Email: input.email,
            Phone: input.phone,
            Status: "Contacted",
            Source: input.source,
            "Lead Created At": new Date().toISOString(),
            Replied: false,
          };
          if (input.message) fields.Message = input.message;
          if (input.notes) fields.Notes = input.notes;
          return { fields };
        });
        const created = await batchWrite("POST", "Leads", leadRecordsToCreate, deadline);
        created.records.forEach((record, index) => {
          const input = batch[index];
          if (!input) return;
          input.leadId = record.id;
          resolved.push({ ...input, leadId: record.id, record });
          result.summary.newLeadsCreated += 1;
        });
        batch.slice(created.records.length).forEach((input) => {
          result.failed.push(item(input, "Airtable did not return the created Lead record", true));
          releaseKeys.push(input.claimKey);
        });
      } catch (error) {
        const failure = operationFailure(error, "Lead creation failed");
        recordFailure(result, failure);
        logAirtableFailure(error, {
          requestId,
          table: "Leads",
          fieldNames: ["Name", "Email", "Phone", "Status", "Source", "Lead Created At", "Replied", "Message", "Notes"],
          leadRecordIds: [],
        });
        batch.forEach((input) => {
          result.failed.push(item(input, failure.reason, failure.retryable));
          releaseKeys.push(input.claimKey);
        });
      }
    }

    // Airtable formulas stringify linked records as their primary display values,
    // not record IDs. Read active links and compare their canonical IDs in code.
    const activeIds = resolved.length ? await activeEnrollmentLeadIds(deadline) : new Set<string>();
    const eligible = resolved.filter((input) => {
      if (!activeIds.has(input.leadId)) return true;
      result.skipped.push(item(input, "Already active in nurture"));
      result.summary.alreadyEnrolled += 1;
      completedClaims.push({ input, leadId: input.leadId });
      return false;
    });

    const updateInputs = eligible.filter((input) => mapLead(input.record).status !== "Contacted");
    const updateFailures = new Set<string>();
    for (const batch of chunkAirtableRecords(updateInputs)) {
      try {
        await batchWrite("PATCH", "Leads", batch.map((input) => ({ id: input.leadId, fields: { Status: "Contacted" } })), deadline);
      } catch (error) {
        const failure = operationFailure(error, "Lead update failed");
        recordFailure(result, failure);
        logAirtableFailure(error, {
          requestId,
          table: "Leads",
          fieldNames: ["Status"],
          leadRecordIds: batch.map((input) => input.leadId),
        });
        batch.forEach((input) => {
          updateFailures.add(input.claimKey);
          result.failed.push(item(input, failure.reason, failure.retryable));
          releaseKeys.push(input.claimKey);
        });
      }
    }

    const readyForEnrollment = eligible.filter((input) => !updateFailures.has(input.claimKey));
    const latestActiveIds = readyForEnrollment.length ? await activeEnrollmentLeadIds(deadline) : new Set<string>();
    const enrollmentInputs = readyForEnrollment.filter((input) => {
      if (!latestActiveIds.has(input.leadId)) return true;
      result.skipped.push(item(input, "Already active in nurture"));
      result.summary.alreadyEnrolled += 1;
      completedClaims.push({ input, leadId: input.leadId });
      return false;
    });
    for (const batch of chunkAirtableRecords(enrollmentInputs)) {
      try {
        const records = batch.map((input) => ({
          fields: buildNurtureEnrollmentFields({
            leadRecordId: input.leadId,
            nextSendAt: schedule.scheduledAtUtc,
            notes: body.enrollmentNote || "Manually enrolled from Harmony dashboard",
          }),
        }));
        const created = await batchWrite("POST", "Nurture Enrollments", records, deadline);
        created.records.forEach((record, index) => {
          const input = batch[index];
          if (!input) return;
          result.enrolled.push({ leadId: input.leadId, rowId: input.rowId, name: input.name, enrollmentId: record.id });
          completedClaims.push({ input, leadId: input.leadId, enrollmentId: record.id });
        });
        batch.slice(created.records.length).forEach((input) => {
          result.failed.push(item(input, "Airtable did not return the created enrollment record", true));
          releaseKeys.push(input.claimKey);
        });
      } catch (error) {
        const failure = operationFailure(error, "Enrollment creation failed");
        recordFailure(result, failure);
        logAirtableFailure(error, {
          requestId,
          table: "Nurture Enrollments",
          fieldNames: Object.values(NURTURE_FIELDS),
          leadRecordIds: batch.map((input) => input.leadId),
          nextSendAt: schedule.scheduledAtUtc,
        });
        batch.forEach((input) => {
          result.failed.push(item(input, failure.reason, failure.retryable));
          releaseKeys.push(input.claimKey);
        });
      }
    }

    result.summary.enrollmentsCreated = result.enrolled.length;
    result.summary.failed = result.failed.length;
    result.success = result.failed.length === 0;
    result.partial = result.enrolled.length > 0 && result.failed.length > 0;
    if (result.enrolled.length > 0) invalidateLeadsBaseCache();
    await settleClaims(requestId, schedule.scheduledAtUtc, completedClaims, releaseKeys);
    auditResult(actor, request, result);
    return Response.json(result, { status: responseStatus(result), headers: { "Cache-Control": "no-store", "X-Request-Id": requestId } });
  } catch (error) {
    const completedKeys = new Set(completedClaims.map(({ input }) => input.claimKey));
    const keysToRelease = [...new Set([...releaseKeys, ...claimedKeys.filter((key) => !completedKeys.has(key))])];
    await settleClaims(requestId, schedule.scheduledAtUtc, completedClaims, keysToRelease).catch(() => undefined);
    const timeout = error instanceof EnrollmentTimeoutError || (error instanceof DOMException && error.name === "TimeoutError");
    const failure = timeout
      ? {
          code: "AIRTABLE_TIMEOUT",
          message: "Enrollment took too long to complete.",
          details: "Retry the failed rows; completed rows will not be duplicated.",
          reason: "Enrollment took too long to complete.",
          retryable: true,
        }
      : operationFailure(error, "Could not complete enrollment");
    recordFailure(result, failure);
    logAirtableFailure(error, {
      requestId,
      table: "Nurture Enrollments",
      fieldNames: Object.values(NURTURE_FIELDS),
      leadRecordIds: [],
      nextSendAt: schedule.scheduledAtUtc,
    });
    result.summary.failed = result.failed.length;
    auditResult(actor, request, result);
    return Response.json(result, { status: responseStatus(result), headers: { "Cache-Control": "no-store", "X-Request-Id": requestId } });
  }
}
