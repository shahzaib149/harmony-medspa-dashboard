import { isAirtableConfigured } from "@/lib/airtable/config";
import { campaignDetail } from "@/lib/campaigns/data";
import { getCampaign } from "@/lib/campaigns/registry";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ campaignSlug: string }> }) {
  const { campaignSlug } = await params;
  if (!getCampaign(campaignSlug)) return Response.json({ error: "Campaign not found" }, { status: 404 });
  if (!isAirtableConfigured()) return Response.json({ campaign: { ...getCampaign(campaignSlug), totalLeads: 0, activeLeads: 0, completedLeads: 0, messagesSent: 0, lastActivity: null, metrics: {} }, leads: [], messages: [], configured: false });
  try { return Response.json(await campaignDetail(campaignSlug)); }
  catch { return Response.json({ error: "Could not load campaign" }, { status: 500 }); }
}
