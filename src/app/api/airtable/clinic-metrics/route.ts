import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { airtableFetch, listRecords, safeAirtableError, textField } from "@/lib/airtable/leads-base";
import { isAirtableConfigured } from "@/lib/airtable/config";

const TABLE = process.env.AIRTABLE_CLINIC_METRICS_TABLE_ID?.trim() || "Clinic Metrics";
type Metric = { id: string; month: string; totalVisits: number; newPatients: number; updatedAt: string | null; updatedBy: string | null };
function map(record: { id: string; createdTime: string; fields: Record<string, unknown> }): Metric { return { id: record.id, month: textField(record.fields, "Month"), totalVisits: Number(record.fields["Total Visits"]), newPatients: Number(record.fields["New Patients"]), updatedAt: textField(record.fields, "Updated At") || null, updatedBy: textField(record.fields, "Updated By") || null }; }
function validMonth(value: string) { return /^\d{4}-(0[1-9]|1[0-2])$/.test(value); }
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try { await requireRole(request, "viewer"); } catch (error) { return authErrorResponse(error); }
  if (!isAirtableConfigured()) return Response.json({ metrics: [], configured: false, error: "Airtable is not configured" }, { status: 503 });
  try {
    const metrics = (await listRecords(TABLE)).map(map).filter((item) => validMonth(item.month)).sort((a, b) => a.month.localeCompare(b.month));
    return Response.json({ metrics, latest: metrics.at(-1) ?? null });
  } catch (error) {
    return Response.json({ error: `Clinic Metrics could not be loaded. Confirm the table and fields exist. ${error instanceof Error ? error.message : ""}`.trim() }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let actor;
  try { ({ profile: actor } = await requireRole(request, "editor")); } catch (error) { return authErrorResponse(error); }
  const body = await request.json().catch(() => null) as { month?: unknown; totalVisits?: unknown; newPatients?: unknown; updatedBy?: unknown } | null;
  if (!body || typeof body.month !== "string" || !validMonth(body.month)) return Response.json({ error: "Month must use YYYY-MM format" }, { status: 400 });
  const totalVisits = Number(body.totalVisits), newPatients = Number(body.newPatients);
  if (!Number.isInteger(totalVisits) || totalVisits < 0 || !Number.isInteger(newPatients) || newPatients < 0) return Response.json({ error: "Visits and new patients must be non-negative whole numbers" }, { status: 400 });
  try {
    const existing = (await listRecords(TABLE)).find((record) => textField(record.fields, "Month") === body.month);
    const before = existing ? { month: body.month, total_visits: Number(existing.fields["Total Visits"]), new_patients: Number(existing.fields["New Patients"]) } : null;
    const fields = { Month: body.month, "Total Visits": totalVisits, "New Patients": newPatients, "Updated At": new Date().toISOString(), "Updated By": typeof body.updatedBy === "string" ? body.updatedBy : "Harmony Dashboard" };
    const response = await airtableFetch(existing ? `${encodeURIComponent(TABLE)}/${existing.id}` : encodeURIComponent(TABLE), { method: existing ? "PATCH" : "POST", body: JSON.stringify({ fields, typecast: true }) });
    if (!response.ok) {
      await logAuditEvent({ actor, action: "action_failed", category: "clinic_metrics", resource: { type: "clinic_month", id: body.month, label: body.month }, summary: "Clinic metrics update could not be completed", metadata: { operation: "clinic_metrics_updated" }, result: "failed", request });
      return Response.json({ error: `Clinic Metrics could not be saved. ${safeAirtableError(response.status)}` }, { status: 502 });
    }
    const metric = map(await response.json());
    await logAuditEvent({ actor, action: "clinic_metrics_updated", category: "clinic_metrics", resource: { type: "clinic_month", id: body.month, label: body.month }, summary: `Updated clinic metrics for ${body.month}`, before, after: { month: body.month, total_visits: totalVisits, new_patients: newPatients }, request });
    return Response.json({ metric }, { status: existing ? 200 : 201 });
  } catch {
    await logAuditEvent({ actor, action: "action_failed", category: "clinic_metrics", resource: { type: "clinic_month", id: body.month, label: body.month }, summary: "Clinic metrics update could not be completed", metadata: { operation: "clinic_metrics_updated" }, result: "failed", request });
    return Response.json({ error: "Clinic Metrics could not be saved. Confirm the Airtable table and fields are configured." }, { status: 500 });
  }
}
