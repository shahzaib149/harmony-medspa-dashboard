import { fetchReviews, replyToReview } from "@/lib/google/gbp-client";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";

export async function GET(request: Request) {
  try { await requireRole(request, "viewer"); } catch (error) { return authErrorResponse(error); }
  try {
    const data = await fetchReviews();
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: String(err), reviews: [], averageRating: 0, totalReviewCount: 0 }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try { await requireRole(request, "editor"); } catch (error) { return authErrorResponse(error); }
  const { reviewId, comment } = await request.json();
  try {
    const result = await replyToReview(reviewId, comment);
    return Response.json({ success: true, result });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
