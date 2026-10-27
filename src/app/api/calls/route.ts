import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { listCalls } from "@/lib/leads/call-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try { await requireRole(request, "viewer"); } catch (error) { return authErrorResponse(error); }
  try {
    return Response.json({ calls: await listCalls() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Call history is temporarily unavailable." }, { status: 503 });
  }
}
