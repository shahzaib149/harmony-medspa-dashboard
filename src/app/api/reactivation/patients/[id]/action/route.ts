import { revalidatePath } from "next/cache";
import { requireRole, authErrorResponse } from "@/lib/auth/requireRole";
import { applyPatientAction, errorResponse, invalidateReactivationCampaignCache, type PatientAction } from "@/lib/reactivation/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
const ACTIONS = new Set<PatientAction>(["replied", "booked", "opted-out"]);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try { await requireRole(request, "editor"); } catch (error) { return authErrorResponse(error); }
  let action: unknown;
  try { action = (await request.json())?.action; } catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }
  if (typeof action !== "string" || !ACTIONS.has(action as PatientAction)) return Response.json({ error: "Unknown patient action." }, { status: 400 });
  try {
    const result = await applyPatientAction((await context.params).id, action as PatientAction);
    invalidateReactivationCampaignCache();
    revalidatePath("/dashboard/dormant-patients"); revalidatePath("/campaigns"); revalidatePath("/campaigns/patient-reactivation");
    return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return errorResponse(error); }
}
