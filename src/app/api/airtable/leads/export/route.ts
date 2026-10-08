import { GET as getLeadPage, type Lead } from "../route";
import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { csvCell, leadExportPageRequest } from "@/lib/leads/export";

export const dynamic = "force-dynamic";

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
      const response = await getLeadPage(leadExportPageRequest(request, params));
      const body = await response.json() as { leads?: Lead[]; nextCursor?: string | null; error?: string; configured?: boolean };
      if (!response.ok || body.error) throw new Error(body.error || "Lead export could not be prepared");
      if (body.configured === false) throw new Error("Lead storage is not configured");
      leads.push(...(body.leads ?? []));
      cursor = body.nextCursor ?? null;
      page += 1;
      if (leads.length >= 10_000) cursor = null;
    } while (cursor);

    const headers = ["Lead ID", "Name", "Phone", "Email", "Message", "Notes", "Source", "Status", "Replied", "Lead Created At", "Last Contacted At", "Lead Type", "Is Real Lead", "AI Tags", "Classification Method", "Treatment Interest", "Email Sent Status", "SMS Sent Status", "Campaigns", "UTM Source", "UTM Campaign", "UTM Medium", "UTM Ad Group", "UTM Term", "UTM Content", "GCLID", "GBRAID", "WBRAID", "Landing URL", "Page URL"];
    const rows = leads.map((lead) => [lead.id, lead.name, lead.phone, lead.email, lead.message, lead.notes, lead.source, lead.status, lead.replied ? "Yes" : "No", lead.createdAt, lead.lastContactedAt, lead.leadType, lead.isRealLead ? "Yes" : "No", lead.aiTags.join("; "), lead.classificationMethod, lead.treatment, lead.emailSentStatus, lead.smsSentStatus, lead.campaigns.map((campaign) => `${campaign.campaign}: ${campaign.status}`).join("; "), lead.utmSource, lead.utmCampaign, lead.utmMedium, lead.utmAdGroup, lead.utmTerm, lead.utmContent, lead.gclid, lead.gbraid, lead.wbraid, lead.landingUrl, lead.pageUrl]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    await logAuditEvent({ actor, action: "leads_exported", category: "exports", resource: { type: "lead_export", label: "Leads CSV" }, summary: `Exported ${leads.length} leads to CSV`, metadata: { exported_rows: leads.length, filters_applied: Array.from(baseParams.keys()).filter((key) => key !== "pageSize") }, request });
    return new Response(`\uFEFF${csv}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="harmony-leads-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" } });
  } catch {
    await logAuditEvent({ actor, action: "action_failed", category: "exports", resource: { type: "lead_export", label: "Leads CSV" }, summary: "Leads CSV export failed", metadata: { operation: "leads_exported" }, result: "failed", request });
    return Response.json({ error: "Lead export could not be prepared" }, { status: 500 });
  }
}
