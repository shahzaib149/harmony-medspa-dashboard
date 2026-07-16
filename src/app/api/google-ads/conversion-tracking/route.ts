import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { fetchConversionTrackingSummary } from "@/lib/google/ads-client";

export async function GET(request: Request) {
  try {
    await requireRole(request, "viewer");
  } catch (error) {
    return authErrorResponse(error);
  }
  try {
    const summary = await fetchConversionTrackingSummary();
    return Response.json(summary);
  } catch {
    return Response.json({
      configured: false,
      enabledActionCount: 0,
      primaryActionCount: 0,
      actions: [],
      leadUrlVerified: false,
      warning: "Conversion tracking status could not be verified.",
    });
  }
}
