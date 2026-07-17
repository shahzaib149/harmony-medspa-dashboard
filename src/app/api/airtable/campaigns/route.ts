import { isAirtableConfigured } from "@/lib/airtable/config";
import { campaignData, summarizeCampaigns } from "@/lib/campaigns/data";
import { CAMPAIGNS } from "@/lib/campaigns/registry";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try { await requireRole(request, "viewer"); } catch (error) { return authErrorResponse(error); }
  if (!isAirtableConfigured()) return Response.json({ campaigns: CAMPAIGNS.map((item) => ({ ...item, totalLeads: 0, activeLeads: 0, completedLeads: 0, messagesSent: 0, lastActivity: null, metrics: {} })), configured: false });
  try { const campaigns = summarizeCampaigns(await campaignData()); return Response.json({ campaigns }); }
  catch { return Response.json({ error: "Could not load campaign data" }, { status: 500 }); }
}
