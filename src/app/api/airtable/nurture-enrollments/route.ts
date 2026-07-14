import { isAirtableConfigured } from "@/lib/airtable/config";
import { campaignData } from "@/lib/campaigns/data";
export const dynamic = "force-dynamic";
export async function GET() {
  if (!isAirtableConfigured()) return Response.json({ enrollments: [], count: 0, configured: false });
  try { const { enrollments } = await campaignData(); return Response.json({ enrollments, count: enrollments.length }); }
  catch { return Response.json({ error: "Could not load nurture enrollments" }, { status: 500 }); }
}
