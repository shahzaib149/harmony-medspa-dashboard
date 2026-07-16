import { POST as bulkEnroll } from "../bulk-enroll/route";
import type { NurtureSchedulePayload } from "@/lib/campaigns/nurture-schedule";

type Row = {
  rowId: string;
  name: string;
  email?: string;
  phone?: string;
  message?: string;
  source?: string;
  notes?: string;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as ({
    rows?: Row[];
    selectedRowIds?: string[];
  } & Partial<NurtureSchedulePayload>) | null;

  if (!body || !Array.isArray(body.rows) || !Array.isArray(body.selectedRowIds)) {
    return Response.json({
      success: false,
      code: "INVALID_CSV_REQUEST",
      message: "CSV import request is invalid",
      retryable: false,
      requestId: request.headers.get("x-request-id") ?? undefined,
    }, { status: 400 });
  }

  const selected = new Set(body.selectedRowIds);
  const rows = body.rows.filter((row) => selected.has(row.rowId));
  const bulkRequest = new Request(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify({
      leadIds: [],
      newLeads: rows,
      scheduledAtUtc: body.scheduledAtUtc,
      scheduledTimezone: body.scheduledTimezone,
      scheduledLocalDate: body.scheduledLocalDate,
      scheduledLocalTime: body.scheduledLocalTime,
      enrollmentNote: "Enrolled through Harmony Dashboard CSV Import",
    }),
  });
  return bulkEnroll(bulkRequest);
}
