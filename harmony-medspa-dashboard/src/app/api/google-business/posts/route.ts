import { createGBPPost } from "@/lib/google/business-client";
import { createServiceClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

async function getRefreshToken(): Promise<string | null> {
  const supabase = await createServiceClient();
  const { data } = await supabase.from("settings").select("value").eq("key", "google_tokens").single();
  return (data?.value as { refresh_token?: string })?.refresh_token ?? null;
}

// AI-draft a GBP post
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "OFFER";
  const topic = searchParams.get("topic") ?? "Summer special";

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    messages: [{
      role: "user",
      content: `Write a Google Business Profile post for Harmony MedSpa.
Type: ${type}
Topic: ${topic}
Requirements:
- Under 1500 characters
- Warm, professional medical spa tone
- Include a clear call to action
- No hashtags
Return ONLY the post text, nothing else.`,
    }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  return Response.json({ draft: text });
}

export async function POST(request: Request) {
  const { topicType, summary, callToAction } = await request.json();
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    return Response.json({ error: "Google not connected" }, { status: 503 });
  }

  const accountId = process.env.GOOGLE_BUSINESS_ACCOUNT_ID!;
  const locationId = process.env.GOOGLE_BUSINESS_LOCATION_ID!;

  try {
    const result = await createGBPPost(refreshToken, accountId, locationId, {
      topicType,
      summary,
      callToAction,
    });
    return Response.json({ success: true, result });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
