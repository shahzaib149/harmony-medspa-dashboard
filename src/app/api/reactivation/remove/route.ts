import { revalidatePath } from "next/cache";
import { requireRole, authErrorResponse } from "@/lib/auth/requireRole";
import { removeEnrollments, errorResponse } from "@/lib/reactivation/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Removes patients from the campaign by deleting their Reactivation Enrollments records.
export async function POST(request: Request) {
  try { await requireRole(request, "editor"); } catch (error) { return authErrorResponse(error); }
  let ids: unknown;
  try { ids = (await request.json())?.enrollmentIds; } catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }
  if (!Array.isArray(ids) || !ids.every((id) => typeof id === "string")) return Response.json({ error: "Invalid enrollment IDs." }, { status: 400 });
  try {
    const result = await removeEnrollments(ids as string[]);
    revalidatePath("/dashboard/dormant-patients"); revalidatePath("/campaigns"); revalidatePath("/campaigns/patient-reactivation");
    return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return errorResponse(error); }
}
