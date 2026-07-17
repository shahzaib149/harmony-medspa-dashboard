import Anthropic from "@anthropic-ai/sdk";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  try { await requireRole(request, "editor"); } catch (error) { return authErrorResponse(error); }
  const { reviewerName, rating, reviewText } = await request.json();

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    messages: [{
      role: "user",
      content: `You are the owner of Harmony MedSpa responding to a Google review.

Reviewer: ${reviewerName}
Rating: ${rating}/5 stars
Review: "${reviewText}"

Write a professional, warm, personalised response that:
- Thanks them by first name
- Acknowledges the specific thing they mentioned
- If 4–5 stars: genuine gratitude, invite them back
- If 1–3 stars: sincere apology, take ownership, offer to resolve offline
- Never defensive, under 150 words, sounds human

Return ONLY the response text.`,
    }],
  });

  const reply = msg.content[0].type === "text" ? msg.content[0].text : "";
  return Response.json({ reply });
}
