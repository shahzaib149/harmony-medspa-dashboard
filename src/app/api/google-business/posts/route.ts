import { createGBPPost } from "@/lib/google/business-client";
import Anthropic from "@anthropic-ai/sdk";

// GET — AI draft a GBP post
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
Requirements: under 1500 chars, warm professional tone, clear CTA, no hashtags.
Return ONLY the post text.`,
    }],
  });

  const draft = msg.content[0].type === "text" ? msg.content[0].text : "";
  return Response.json({ draft });
}

// POST — publish a post to GBP
export async function POST(request: Request) {
  const { topicType, summary, callToAction } = await request.json();
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
  if (!refreshToken) return Response.json({ error: "Google not connected — missing GOOGLE_ADS_REFRESH_TOKEN" }, { status: 503 });

  try {
    const result = await createGBPPost(
      refreshToken,
      process.env.GOOGLE_BUSINESS_ACCOUNT_ID!,
      process.env.GOOGLE_BUSINESS_LOCATION_ID!,
      { topicType, summary, callToAction }
    );
    return Response.json({ success: true, result });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
