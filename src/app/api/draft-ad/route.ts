import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  try {
    const { treatment, audience, offer } = await request.json();

    if (!treatment || !audience || !offer) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const prompt = `You are a Google Ads copywriter for Harmony MedSpa, a premium medical spa. Create high-converting ad copy.

TREATMENT: ${treatment}
TARGET AUDIENCE: ${audience}
OFFER / PROMO: ${offer}

REQUIREMENTS:
- Headlines: EXACTLY 30 characters or fewer each (spaces count). Write 3 headlines.
- Descriptions: EXACTLY 90 characters or fewer each. Write 2 descriptions.
- 1 short CTA (2–4 words, action-first)
- Headlines must be benefit-focused, not just feature-focused
- Use urgency and specificity where possible
- Match the premium, professional tone of a medical spa

Return ONLY this JSON object, no markdown:
{
  "headlines": ["headline1", "headline2", "headline3"],
  "descriptions": ["description1", "description2"],
  "cta": "CTA text"
}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const draft = JSON.parse(text);

    return Response.json(draft);
  } catch (err) {
    console.error("/api/draft-ad error:", err);
    return Response.json({ error: "Failed to generate ad copy" }, { status: 500 });
  }
}
