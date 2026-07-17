import { NextRequest } from "next/server";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";

type CampaignRow = {
  campaignName: string;
  cost: number;
  clicks: number;
  impressions: number;
  roas: number;
  conversions: number;
};
type CreativeRow = {
  adName: string;
  clicks: number;
  roas: number;
  ctrPct: number;
};
type KeywordRow = {
  keywordText: string;
  matchType: string;
  clicks: number;
  ctrPct: number;
  roas: number;
};

export async function POST(req: NextRequest) {
  try { await requireRole(req, "editor"); } catch (error) { return authErrorResponse(error); }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY not configured on server" },
      { status: 500 },
    );
  }

  const body = await req.json();
  const {
    campaigns = [],
    creatives = [],
    keywords = [],
    days = 30,
  } = body as {
    campaigns: CampaignRow[];
    creatives: CreativeRow[];
    keywords: KeywordRow[];
    days: number;
  };

  const totalSpend = campaigns.reduce((s, c) => s + c.cost, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalImpr = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalConv = campaigns.reduce((s, c) => s + c.conversions, 0);
  const avgRoas =
    totalSpend > 0
      ? campaigns.reduce((s, c) => s + c.roas * c.cost, 0) / totalSpend
      : 0;
  const avgCtr = totalImpr > 0 ? (totalClicks / totalImpr) * 100 : 0;

  const topCampaigns = [...campaigns]
    .sort((a, b) => b.roas - a.roas)
    .slice(0, 3);
  const topCreatives = [...creatives]
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);
  const topKeywords = [...keywords]
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  const prompt = `You are a Google Ads expert for Harmony MedSpa in Sarasota, FL — a luxury medical spa offering Botox, dermal fillers, weight loss treatments (Semaglutide/Tirzepatide), and advanced skin care.

Analyze the following ${days}-day Google Ads performance data and generate a fully optimized Responsive Search Ad plus strategic recommendations.

PERFORMANCE SUMMARY (Last ${days} days):
- Total Spend: $${totalSpend.toFixed(2)}
- Total Clicks: ${totalClicks.toLocaleString()}
- Total Conversions: ${Math.round(totalConv)}
- Average ROAS: ${avgRoas.toFixed(2)}x
- Average CTR: ${avgCtr.toFixed(2)}%

TOP CAMPAIGNS BY ROAS:
${topCampaigns.map((c) => `- ${c.campaignName}: ROAS ${c.roas.toFixed(2)}x, Spend $${c.cost.toFixed(2)}, Clicks ${c.clicks}`).join("\n") || "- No campaign data"}

TOP PERFORMING ADS BY CLICKS:
${topCreatives.map((c) => `- "${c.adName}": ${c.clicks} clicks, ROAS ${c.roas.toFixed(2)}x, CTR ${c.ctrPct.toFixed(2)}%`).join("\n") || "- No creative data"}

TOP KEYWORDS:
${topKeywords.map((k) => `- "${k.keywordText}" [${k.matchType}]: ${k.clicks} clicks, CTR ${k.ctrPct.toFixed(2)}%, ROAS ${k.roas.toFixed(2)}x`).join("\n") || "- No keyword data"}

Generate a complete Google Responsive Search Ad and strategic recommendations. Return ONLY a raw JSON object — no markdown fences, no explanation, just the JSON:
{
  "headlines": ["headline1", "headline2", ..., "headline15"],
  "descriptions": ["desc1", "desc2", "desc3", "desc4"],
  "displayPath": ["path1", "path2"],
  "targetKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "insights": ["insight1", "insight2", "insight3"],
  "bidRecommendation": "Specific bid and budget recommendation based on the data",
  "topPerformerSummary": "1-2 sentence summary of what's working and where the biggest opportunity is"
}

STRICT RULES:
- Every headline: MAXIMUM 30 characters (count carefully — this is a hard Google limit)
- Every description: MAXIMUM 90 characters
- Headlines: mix benefit-focused, urgency, location ("Sarasota"), treatment-specific, social proof, CTAs
- Descriptions: complete sentences, compelling, specific to MedSpa treatments
- displayPath: two short words/phrases like ["medspa", "sarasota"] — max 15 chars each
- targetKeywords: 5 high-intent keyword phrases NOT already in the top keywords above
- insights: 3 specific, data-driven actions to improve performance (reference actual numbers from the data)
- bidRecommendation: concrete advice (raise/lower bids on which campaigns, budget reallocation)`;

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
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic API ${res.status}: ${err.slice(0, 300)}`);
    }

    const data = await res.json();
    const raw = data.content?.[0]?.text ?? "{}";

    // Strip any accidental markdown fences
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();
    const parsed: unknown = JSON.parse(cleaned);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Anthropic returned an invalid suggestion payload");
    }

    return Response.json({ success: true, ...parsed });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
