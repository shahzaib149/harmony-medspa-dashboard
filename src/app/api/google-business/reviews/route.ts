import { fetchReviews, replyToReview } from "@/lib/google/gbp-client";

export async function GET() {
  try {
    const data = await fetchReviews();
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: String(err), reviews: [], averageRating: 0, totalReviewCount: 0 }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { reviewId, comment } = await request.json();
  try {
    const result = await replyToReview(reviewId, comment);
    return Response.json({ success: true, result });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
