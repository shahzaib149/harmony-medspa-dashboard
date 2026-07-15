import { GET as getLeadPage, type Lead } from "../route";
import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";

export const dynamic = "force-dynamic";

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  let actor;
  try { ({ profile: actor } = await requireRole(request, "editor")); } catch (error) { return authErrorResponse(error); }
  const incoming = new URL(request.url);
  const baseParams = new URLSearchParams(incoming.searchParams);
  baseParams.delete("cursor");
  baseParams.delete("page");
  baseParams.delete("pageSize");
  baseParams.set("pageSize", "50");
  const leads: Lead[] = [];
  let cursor: string | null = null;
  let page = 1;
  try {
    do {
      const params = new URLSearchParams(baseParams);
      params.set("page", String(page));
      if (cursor) params.set("cursor", cursor);
      const response = await getLeadPage(new Request(`${incoming.origin}/api/airtable/leads?${params}`));
      const body = await response.json() as { leads?: Lead[]; nextCursor?: string | null; error?: string };
      if (!response.ok || body.error) throw new Error(body.error || "Lead export could not be prepared");
      leads.push(...(body.leads ?? []));
      cursor = body.nextCursor ?? null;
      page += 1;
      if (leads.length >= 10_000) cursor = null;
    } while (cursor);

    const headers = ["Name", "Phone", "Email", "Message", "Source", "Status", "Replied", "Lead Created At"];
    const rows = leads.map((lead) => [lead.name, lead.phone, lead.email, lead.message, lead.source, lead.status, lead.replied ? "Yes" : "No", lead.createdAt]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    await logAuditEvent({ actor, action: "leads_exported", category: "exports", resource: { type: "lead_export", label: "Leads CSV" }, summary: `Exported ${leads.length} leads to CSV`, metadata: { exported_rows: leads.length, filters_applied: Array.from(baseParams.keys()).filter((key) => key !== "pageSize") }, request });
    return new Response(`\uFEFF${csv}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="harmony-leads-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" } });
  } catch {
    await logAuditEvent({ actor, action: "action_failed", category: "exports", resource: { type: "lead_export", label: "Leads CSV" }, summary: "Leads CSV export failed", metadata: { operation: "leads_exported" }, result: "failed", request });
    return Response.json({ error: "Lead export could not be prepared" }, { status: 500 });
  }
}
