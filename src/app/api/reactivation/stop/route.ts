import { revalidatePath } from "next/cache";
import { requireRole, authErrorResponse } from "@/lib/auth/requireRole";
import { stopEnrollment, errorResponse } from "@/lib/reactivation/server";
export const maxDuration = 300;
export async function POST(request: Request) {
  try { await requireRole(request,"editor"); } catch (error) { return authErrorResponse(error); }
  let id: unknown;
  try { id = (await request.json())?.enrollmentId; } catch { return Response.json({error:"Invalid request."},{status:400}); }
  if (typeof id !== "string" || !/^rec\w{14}$/.test(id)) return Response.json({error:"Invalid enrollment ID."},{status:400});
  try {
    await stopEnrollment(id);
    revalidatePath("/dashboard/dormant-patients"); revalidatePath("/campaigns");
    return Response.json({ stopped:true });
  } catch(error) { return errorResponse(error); }
}
