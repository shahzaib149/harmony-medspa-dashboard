export const NURTURE_FIELDS = {
  lead: "Lead",
  status: "Status",
  currentStep: "Current Step",
  nextSendAt: "Next Send At",
  notes: "Notes",
} as const;

export const NURTURE_ACTIVE_STATUS = "Active" as const;
export const NURTURE_FIRST_STEP = "Day 1 SMS" as const;

export type AirtableNurtureEnrollmentFields = {
  [NURTURE_FIELDS.lead]: [string];
  [NURTURE_FIELDS.status]: typeof NURTURE_ACTIVE_STATUS;
  [NURTURE_FIELDS.currentStep]: typeof NURTURE_FIRST_STEP;
  [NURTURE_FIELDS.nextSendAt]: string;
  [NURTURE_FIELDS.notes]?: string;
};

export type AirtableErrorCode =
  | "AIRTABLE_AUTH_ERROR"
  | "AIRTABLE_RATE_LIMITED"
  | "AIRTABLE_VALIDATION_ERROR"
  | "AIRTABLE_REQUEST_FAILED";

export interface ParsedAirtableError {
  status: number;
  type: string;
  providerMessage: string;
  code: AirtableErrorCode;
  message: string;
  details: string;
  retryable: boolean;
}

export interface AirtableTransportFailure {
  code: "AIRTABLE_TIMEOUT";
  message: string;
  details: string;
  reason: string;
  retryable: true;
}

const AIRTABLE_RECORD_ID = /^rec[a-zA-Z0-9]{14}$/;

export function isAirtableRecordId(value: unknown): value is string {
  return typeof value === "string" && AIRTABLE_RECORD_ID.test(value);
}

export function activeNurtureLeadIds(records: Array<{ fields: Record<string, unknown> }>) {
  return new Set(records.flatMap((record) => {
    const value = record.fields[NURTURE_FIELDS.lead];
    return Array.isArray(value) ? value.filter(isAirtableRecordId) : [];
  }));
}

function validUtcInstant(value: string) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
    Number.isFinite(Date.parse(value));
}

export function removeEmptyOptionalAirtableFields<T extends Record<string, unknown>>(fields: T): T {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) =>
      value !== undefined && value !== null && value !== "" &&
      (!Array.isArray(value) || value.length > 0),
    ),
  ) as T;
}

export function buildNurtureEnrollmentFields(input: {
  leadRecordId: string;
  nextSendAt: string;
  notes?: string;
}): AirtableNurtureEnrollmentFields {
  if (!isAirtableRecordId(input.leadRecordId)) {
    throw new Error("The linked Lead record ID is invalid.");
  }
  if (!validUtcInstant(input.nextSendAt)) {
    throw new Error("Next Send At must be a valid UTC datetime.");
  }

  return removeEmptyOptionalAirtableFields({
    [NURTURE_FIELDS.lead]: [input.leadRecordId],
    [NURTURE_FIELDS.status]: NURTURE_ACTIVE_STATUS,
    [NURTURE_FIELDS.currentStep]: NURTURE_FIRST_STEP,
    [NURTURE_FIELDS.nextSendAt]: input.nextSendAt,
    [NURTURE_FIELDS.notes]: input.notes?.trim(),
  }) as AirtableNurtureEnrollmentFields;
}

function sanitizeProviderMessage(value: string) {
  return value
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/[A-Za-z0-9_-]{32,}/g, "[redacted]")
    .replace(/\brec[a-zA-Z0-9]{14}\b/g, "[linked record]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\+?\d[\d\s().-]{8,}\d/g, "[phone]")
    .slice(0, 500);
}

function safeValidationDetail(providerMessage: string) {
  const message = sanitizeProviderMessage(providerMessage);
  if (/Created At/i.test(message)) return "Field 'Created At' is read-only and cannot accept a value.";
  if (/\bLead\b/i.test(message)) return "The linked Lead record was invalid.";
  if (/Next Send At|date.?time|date value/i.test(message)) return "Next Send At contains an invalid date value.";
  if (/Current Step/i.test(message)) return "Current Step contains an unsupported option.";
  if (/\bStatus\b/i.test(message)) return "Status contains an unsupported option.";
  return "One or more enrollment fields did not match the Airtable schema.";
}

export async function parseAirtableErrorResponse(response: Response): Promise<ParsedAirtableError> {
  const rawBody = await response.text().catch(() => "");
  let type = "";
  let providerMessage = "";
  try {
    const parsed = JSON.parse(rawBody) as { error?: string | { type?: string; message?: string } };
    if (typeof parsed.error === "string") {
      providerMessage = parsed.error;
    } else {
      type = parsed.error?.type ?? "";
      providerMessage = parsed.error?.message ?? "";
    }
  } catch {
    providerMessage = rawBody;
  }

  if (response.status === 401 || response.status === 403) {
    return {
      status: response.status,
      type,
      providerMessage: sanitizeProviderMessage(providerMessage),
      code: "AIRTABLE_AUTH_ERROR",
      message: "Airtable access is not authorized.",
      details: "The configured Airtable token or base permissions need attention.",
      retryable: false,
    };
  }
  if (response.status === 422) {
    return {
      status: response.status,
      type,
      providerMessage: sanitizeProviderMessage(providerMessage),
      code: "AIRTABLE_VALIDATION_ERROR",
      message: "Airtable rejected the enrollment record.",
      details: safeValidationDetail(providerMessage),
      retryable: false,
    };
  }
  if (response.status === 429) {
    return {
      status: response.status,
      type,
      providerMessage: sanitizeProviderMessage(providerMessage),
      code: "AIRTABLE_RATE_LIMITED",
      message: "Airtable is temporarily rate limited.",
      details: "Wait briefly, then retry the failed rows.",
      retryable: true,
    };
  }
  return {
    status: response.status,
    type,
    providerMessage: sanitizeProviderMessage(providerMessage),
    code: "AIRTABLE_REQUEST_FAILED",
    message: "Airtable could not create the enrollment record.",
    details: "The Airtable request failed. Retry the failed rows.",
    retryable: response.status >= 500,
  };
}

export class AirtableRequestError extends Error {
  constructor(readonly airtable: ParsedAirtableError) {
    super(airtable.details);
    this.name = "AirtableRequestError";
  }
}

export function airtableTransportFailure(error: unknown): AirtableTransportFailure | null {
  if (!(error instanceof DOMException) || !["TimeoutError", "AbortError"].includes(error.name)) {
    return null;
  }
  return {
    code: "AIRTABLE_TIMEOUT",
    message: "Airtable took too long to respond.",
    details: "Retry the failed rows; completed rows will not be duplicated.",
    reason: "Airtable took too long to respond.",
    retryable: true,
  };
}
