import { fetchInsights } from "@/lib/google/gbp-client";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";

export async function GET(request: Request) {
  try { await requireRole(request, "viewer"); } catch (error) { return authErrorResponse(error); }
  const { searchParams } = new URL(request.url);
  const days = Number(searchParams.get("days") ?? 30);
  try {
    const data = await fetchInsights(days);
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
