import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const { reviewerName, rating, reviewText } = await request.json();

  const prompt = `You are the owner of Harmony MedSpa responding to a Google review.

Reviewer: ${reviewerName}
Rating: ${rating}/5 stars
Review: "${reviewText}"

Write a professional, warm, personalised response that:
- Thanks them by first name
- Acknowledges the specific thing they mentioned
- If 4-5 stars: express genuine gratitude and invite them back
- If 1-3 stars: apologise sincerely, take ownership, offer to resolve it offline (provide phone/email)
- Never be defensive or make excuses
- Under 150 words
- Sound human, not corporate

Return ONLY the response text, nothing else.`;

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  const reply = msg.content[0].type === "text" ? msg.content[0].text : "";
  return Response.json({ reply });
}
