import { fetchInsights } from "@/lib/google/gbp-client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = Number(searchParams.get("days") ?? 30);
  try {
    const data = await fetchInsights(days);
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
