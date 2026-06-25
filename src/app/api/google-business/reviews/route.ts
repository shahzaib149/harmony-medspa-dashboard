import { fetchReviews, replyToReview } from "@/lib/google/business-client";

export async function GET() {
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
  if (!refreshToken) return Response.json({ error: "Google not connected — missing GOOGLE_ADS_REFRESH_TOKEN", reviews: [] });

  try {
    const reviews = await fetchReviews(
      refreshToken,
      process.env.GOOGLE_BUSINESS_ACCOUNT_ID!,
      process.env.GOOGLE_BUSINESS_LOCATION_ID!
    );
    return Response.json({ reviews });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { reviewId, comment } = await request.json();
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
  if (!refreshToken) return Response.json({ error: "Google not connected" }, { status: 503 });

  try {
    const result = await replyToReview(
      refreshToken,
      process.env.GOOGLE_BUSINESS_ACCOUNT_ID!,
      process.env.GOOGLE_BUSINESS_LOCATION_ID!,
      reviewId,
      comment
    );
    return Response.json({ success: true, result });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
