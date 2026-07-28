import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";

export async function GET(request: Request) {
  try {
    const { user, profile } = await requireRole(request, "viewer");
    return Response.json({ user, profile });
  } catch (error) {
    return authErrorResponse(error);
  }
}
