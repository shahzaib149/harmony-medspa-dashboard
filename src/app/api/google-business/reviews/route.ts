import { fetchReviews, replyToReview } from "@/lib/google/business-client";
import { createServiceClient } from "@/lib/supabase/server";

async function getRefreshToken(): Promise<string | null> {
  const supabase = await createServiceClient();
  const { data } = await supabase.from("settings").select("value").eq("key", "google_tokens").single();
  return (data?.value as { refresh_token?: string })?.refresh_token ?? null;
}

export async function GET() {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return Response.json({ error: "Google not connected", reviews: [] });

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
  const refreshToken = await getRefreshToken();
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
