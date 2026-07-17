import { isAirtableConfigured } from "@/lib/airtable/config";
import { campaignData } from "@/lib/campaigns/data";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try { await requireRole(request, "viewer"); } catch (error) { return authErrorResponse(error); }
  if (!isAirtableConfigured()) return Response.json({ enrollments: [], count: 0, configured: false });
  try { const { enrollments } = await campaignData(); return Response.json({ enrollments, count: enrollments.length }); }
  catch { return Response.json({ error: "Could not load nurture enrollments" }, { status: 500 }); }
}
