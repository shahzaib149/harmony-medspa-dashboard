import { GET as getLeadPage, type Lead } from "../route";
import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { allLeadExportParams, leadExportPageRequest } from "@/lib/leads/export";
import { organizedLeadCsv, organizedLeadRows } from "@/lib/leads/organized-export";
import { DateTime } from "luxon";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  let actor;
  try { ({ profile: actor } = await requireRole(request, "editor")); } catch (error) { return authErrorResponse(error); }
  const format = new URL(request.url).searchParams.get("format") ?? "csv";
  if (format !== "csv" && format !== "xlsx") return Response.json({ error: "Unsupported export format" }, { status: 400 });
  const leads: Lead[] = [];
  let cursor: string | null = null;
  let page = 1;
  const seen = new Set<string>();
  try {
    do {
      const params = allLeadExportParams();
      params.set("page", String(page));
      if (cursor) params.set("cursor", cursor);
      const response = await getLeadPage(leadExportPageRequest(request, params));
      const body = await response.json() as { leads?: Lead[]; nextCursor?: string | null; error?: string; configured?: boolean };
      if (!response.ok || body.error) throw new Error(body.error || "Lead export could not be prepared");
      if (body.configured === false) throw new Error("Lead storage is not configured");
      if (!Array.isArray(body.leads)) throw new Error("Lead storage returned invalid data");
      leads.push(...body.leads);
      cursor = body.nextCursor ?? null;
      page += 1;
      if (cursor && seen.has(cursor)) throw new Error("Lead pagination did not advance");
      if (cursor) seen.add(cursor);
    } while (cursor);

    const today = DateTime.now().setZone("America/New_York").toISODate()!;
    const rows = organizedLeadRows(leads);
    const data = format === "csv" ? organizedLeadCsv(rows) : new Uint8Array(await (await import("@/lib/leads/export-workbook")).leadExportWorkbook(rows));
    await logAuditEvent({ actor, action: "leads_exported", category: "exports", resource: { type: "lead_export", label: `All Leads ${format.toUpperCase()}` }, summary: `Exported ${rows.length} lead records and call events to ${format.toUpperCase()}`, metadata: { exported_rows: rows.length, scope: "all_history", format }, request });
    return new Response(data, { headers: { "Content-Type": format === "csv" ? "text/csv; charset=utf-8" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="harmony-all-leads-${today}.${format}"`, "Cache-Control": "no-store" } });
  } catch {
    await logAuditEvent({ actor, action: "action_failed", category: "exports", resource: { type: "lead_export", label: `All Leads ${format.toUpperCase()}` }, summary: "All leads export failed", metadata: { operation: "leads_exported", format }, result: "failed", request });
    return Response.json({ error: "Lead export could not be prepared" }, { status: 500 });
  }
}
