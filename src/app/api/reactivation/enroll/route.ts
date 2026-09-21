import { revalidatePath } from "next/cache";
import { requireRole, authErrorResponse } from "@/lib/auth/requireRole";
import { enrollSchema } from "@/lib/reactivation/model";
import { enrollPatients, errorResponse, invalidateReactivationCampaignCache } from "@/lib/reactivation/server";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
export async function POST(request: Request) {
  try { await requireRole(request,"editor"); } catch (error) { return authErrorResponse(error); }
  let input;
  try { input = enrollSchema.parse(await request.json()); } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Invalid request." },{ status:400 }); }
  try {
    const result = await enrollPatients(input);
    invalidateReactivationCampaignCache();
    revalidatePath("/dashboard/dormant-patients"); revalidatePath("/campaigns");
    return Response.json(result,{ headers: { "Cache-Control":"private, no-store" } });
  } catch(error) { return errorResponse(error); }
}
