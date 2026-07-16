import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import {
  airtableFetch,
  linkedIds,
  safeAirtableError,
  textField,
  type AirtableRecord,
} from "@/lib/airtable/leads-base";
import { logAuditEvent } from "@/lib/audit/log-audit-event";

const ENROLLMENTS_TABLE = encodeURIComponent("Nurture Enrollments");
const LEADS_TABLE = encodeURIComponent("Leads");
const RECORD_ID = /^rec[a-zA-Z0-9]+$/;

type UpdateBody = {
  action?: string;
  status?: string;
  leadRecordId?: string;
};

async function getEnrollment(recordId: string) {
  const response = await airtableFetch(`${ENROLLMENTS_TABLE}/${recordId}`);
  if (!response.ok) {
    return {
      record: null,
      response: Response.json(
        { error: safeAirtableError(response.status) },
        { status: response.status === 404 ? 404 : 502 },
      ),
    };
  }
  return { record: (await response.json()) as AirtableRecord, response: null };
}

async function connectionState(record: AirtableRecord) {
  const previousLeadIds = linkedIds(record.fields.Lead);
  if (previousLeadIds.length === 0) {
    return { disconnected: true, previousLeadIds, error: null };
  }

  for (const leadId of previousLeadIds) {
    const leadResponse = await airtableFetch(
      `${LEADS_TABLE}/${encodeURIComponent(leadId)}`,
    );
    if (leadResponse.ok) {
      return { disconnected: false, previousLeadIds, error: null };
    }
    if (leadResponse.status !== 404) {
      return {
        disconnected: false,
        previousLeadIds,
        error: Response.json(
          { error: "The linked Lead could not be verified. Try again." },
          { status: 502 },
        ),
      };
    }
  }
  return { disconnected: true, previousLeadIds, error: null };
}

function enrollmentAuditData(record: AirtableRecord) {
  return {
    lead_record_ids: linkedIds(record.fields.Lead),
    status: textField(record.fields, "Status") || null,
    current_step: textField(record.fields, "Current Step") || null,
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ recordId: string }> },
) {
  const body = (await request.json().catch(() => null)) as UpdateBody | null;
  if (!body) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  let actor;
  try {
    ({ profile: actor } = await requireRole(
      request,
      body.action === "relink" ? "admin" : "editor",
    ));
  } catch (error) {
    return authErrorResponse(error);
  }

  const { recordId } = await params;
  if (!RECORD_ID.test(recordId)) {
    return Response.json({ error: "Invalid enrollment ID" }, { status: 400 });
  }

  const existing = await getEnrollment(recordId);
  if (!existing.record) return existing.response;
  const record = existing.record;

  if (body.action === "relink") {
    const leadRecordId = body.leadRecordId?.trim() ?? "";
    if (!RECORD_ID.test(leadRecordId)) {
      return Response.json({ error: "Select a valid Lead" }, { status: 400 });
    }

    const connection = await connectionState(record);
    if (connection.error) return connection.error;
    if (!connection.disconnected) {
      return Response.json(
        { error: "This enrollment is already connected to an available Lead." },
        { status: 409 },
      );
    }

    const leadResponse = await airtableFetch(
      `${LEADS_TABLE}/${encodeURIComponent(leadRecordId)}`,
    );
    if (!leadResponse.ok) {
      return Response.json(
        {
          error:
            leadResponse.status === 404
              ? "The selected Lead is no longer available."
              : safeAirtableError(leadResponse.status),
        },
        { status: leadResponse.status === 404 ? 404 : 502 },
      );
    }
    const lead = (await leadResponse.json()) as AirtableRecord;

    const response = await airtableFetch(`${ENROLLMENTS_TABLE}/${recordId}`, {
      method: "PATCH",
      body: JSON.stringify({ fields: { Lead: [leadRecordId] } }),
    });
    if (!response.ok) {
      await logAuditEvent({
        actor,
        action: "action_failed",
        category: "campaigns",
        resource: { type: "nurture_enrollment", id: recordId },
        summary: "Disconnected enrollment could not be reconnected",
        before: { lead_record_ids: connection.previousLeadIds },
        metadata: {
          operation: "orphan_enrollment_relinked",
          campaign: "14-day-nurture",
        },
        result: "failed",
        request,
      });
      return Response.json(
        { error: safeAirtableError(response.status) },
        { status: 502 },
      );
    }

    await logAuditEvent({
      actor,
      action: "orphan_enrollment_relinked",
      category: "campaigns",
      resource: { type: "nurture_enrollment", id: recordId },
      summary: "Reconnected a nurture enrollment to an available Lead",
      before: { lead_record_ids: connection.previousLeadIds },
      after: { lead_record_ids: [leadRecordId] },
      metadata: { campaign: "14-day-nurture" },
      result: "success",
      request,
    });

    return Response.json({
      success: true,
      enrollment: await response.json(),
      lead: {
        id: lead.id,
        name: textField(lead.fields, "Name") || "Selected Lead",
        email: textField(lead.fields, "Email"),
        phone: textField(lead.fields, "Phone"),
      },
    });
  }

  const fields =
    body.action === "stop"
      ? {
          Status: "Stopped",
          "Stop Reason": "Manual",
          "Stopped At Step": record.fields["Current Step"] ?? null,
        }
      : body.status === "Active" ||
          body.status === "Stopped" ||
          body.status === "Completed"
        ? { Status: body.status }
        : null;
  if (!fields) {
    return Response.json({ error: "Unsupported update" }, { status: 400 });
  }

  const response = await airtableFetch(`${ENROLLMENTS_TABLE}/${recordId}`, {
    method: "PATCH",
    body: JSON.stringify({ fields }),
  });
  if (!response.ok) {
    await logAuditEvent({
      actor,
      action: "action_failed",
      category: "campaigns",
      resource: { type: "nurture_enrollment", id: recordId },
      summary: "Campaign enrollment update could not be completed",
      metadata: {
        operation:
          body.action === "stop"
            ? "campaign_enrollment_stopped"
            : "campaign_step_changed",
      },
      result: "failed",
      request,
    });
    return Response.json(
      { error: safeAirtableError(response.status) },
      { status: 502 },
    );
  }

  await logAuditEvent({
    actor,
    action:
      body.action === "stop"
        ? "campaign_enrollment_stopped"
        : "campaign_step_changed",
    category: "campaigns",
    resource: { type: "nurture_enrollment", id: recordId },
    summary:
      body.action === "stop"
        ? "Stopped nurture enrollment"
        : "Changed nurture enrollment status",
    before: {
      status: record.fields.Status ?? null,
      current_step: record.fields["Current Step"] ?? null,
    },
    after: { status: fields.Status },
    request,
  });
  return Response.json({ success: true, enrollment: await response.json() });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ recordId: string }> },
) {
  let actor;
  try {
    ({ profile: actor } = await requireRole(request, "admin"));
  } catch (error) {
    return authErrorResponse(error);
  }

  const { recordId } = await params;
  if (!RECORD_ID.test(recordId)) {
    return Response.json({ error: "Invalid enrollment ID" }, { status: 400 });
  }

  const existing = await getEnrollment(recordId);
  if (!existing.record) return existing.response;
  const record = existing.record;
  const connection = await connectionState(record);
  if (connection.error) return connection.error;
  if (!connection.disconnected) {
    return Response.json(
      { error: "Connected enrollments cannot be removed by this workflow." },
      { status: 409 },
    );
  }

  const response = await airtableFetch(`${ENROLLMENTS_TABLE}/${recordId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    await logAuditEvent({
      actor,
      action: "action_failed",
      category: "campaigns",
      resource: { type: "nurture_enrollment", id: recordId },
      summary: "Disconnected enrollment could not be removed",
      before: enrollmentAuditData(record),
      metadata: {
        operation: "orphan_enrollment_deleted",
        campaign: "14-day-nurture",
      },
      result: "failed",
      request,
    });
    return Response.json(
      { error: safeAirtableError(response.status) },
      { status: 502 },
    );
  }

  await logAuditEvent({
    actor,
    action: "orphan_enrollment_deleted",
    category: "campaigns",
    resource: { type: "nurture_enrollment", id: recordId },
    summary: "Removed a disconnected nurture enrollment",
    before: enrollmentAuditData(record),
    after: { deleted: true },
    metadata: { campaign: "14-day-nurture" },
    result: "success",
    request,
  });

  return Response.json({ success: true, enrollment: await response.json() });
}
