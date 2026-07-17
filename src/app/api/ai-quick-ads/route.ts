import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";

export const revalidate = 3600; // re-generate at most once per hour

export async function GET(request: Request) {
  try { await requireRole(request, "viewer"); } catch (error) { return authErrorResponse(error); }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  // ── 1. Fetch the live website ──────────────────────────────────────────────
  let siteContext = "";
  try {
    const html = await fetch("https://www.harmonymedspafl.com/", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; HarmonyDashboard/1.0)" },
      signal: AbortSignal.timeout(8000),
    }).then(r => r.text());

    siteContext = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 4500);
  } catch {
    siteContext =
      "Harmony MedSpa in Sarasota, FL — luxury medical spa. Services: Botox, dermal fillers, " +
      "lip fillers, Sculptra, Semaglutide & Tirzepatide weight loss, microneedling, chemical peels, " +
      "hydrafacials, laser treatments, IV therapy. Free consultations. Board-certified providers.";
  }

  // ── 2. Build the prompt ────────────────────────────────────────────────────
  const prompt = `You are a senior Google Ads strategist. You have just audited the following website content for Harmony MedSpa (Sarasota, FL):

WEBSITE CONTENT:
${siteContext}

Based on this deep audit of their actual site — their services, language, USPs, and target audience — generate exactly 3 high-converting Google Responsive Search Ads. Each ad must target a different high-value service or audience segment found on the site.

Return ONLY a raw JSON array (no markdown, no explanation):
[
  {
    "headline1": "max 30 chars",
    "headline2": "max 30 chars",
    "headline3": "max 30 chars",
    "description": "max 90 chars — compelling, specific, with a clear CTA",
    "path1": "max 15 chars",
    "path2": "max 15 chars",
    "focus": "the service/segment this ad targets",
    "insight": "one sentence: why this ad angle will perform well based on the site audit"
  },
  { ... },
  { ... }
]

STRICT RULES:
- headline1/2/3: hard max 30 characters each — count every character
- description: hard max 90 characters
- path1/path2: short slugs, max 15 chars each (e.g. "weight-loss", "sarasota")
- Focus on 3 DIFFERENT high-value segments: e.g. injectables, weight loss, skin/wellness (pick based on site content)
- Use specific details found on the actual site (treatments named, pricing hints, location, USPs)
- Include a local Sarasota angle in at least one ad
- Use urgency or social proof where natural`;

  // ── 3. Call Claude ─────────────────────────────────────────────────────────
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1200,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic ${res.status}: ${err.slice(0, 200)}`);
    }

    const data = await res.json();
    const raw = data.content?.[0]?.text ?? "[]";
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    const ads = JSON.parse(cleaned);
    return Response.json({ ads, generated: new Date().toISOString() });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
