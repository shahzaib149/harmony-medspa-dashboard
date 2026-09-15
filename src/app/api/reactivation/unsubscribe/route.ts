import { applyPatientAction } from "@/lib/reactivation/server";
import { verifyUnsubscribe } from "@/lib/reactivation/unsubscribe";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Public endpoint: the signed token is the authorization. GET only reports whether a
// link is valid, for the Harmony website unsubscribe page; it never changes data.
export function GET(request: Request) {
  const url = new URL(request.url);
  return Response.json({ valid: verifyUnsubscribe(url.searchParams.get("p"), url.searchParams.get("t")) }, { headers: { "Cache-Control": "no-store" } });
}

// POST opts the patient out: the website confirmation, a legacy form, or a one-click request.
export async function POST(request: Request) {
  const url = new URL(request.url);
  let patientId: unknown = url.searchParams.get("p");
  let token: unknown = url.searchParams.get("t");
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data")) {
    const form = await request.formData().catch(() => null);
    patientId = form?.get("p") ?? patientId;
    token = form?.get("t") ?? token;
  }
  const fromForm = request.headers.get("accept")?.includes("text/html");
  if (!verifyUnsubscribe(patientId, token)) {
    return fromForm
      ? Response.redirect(new URL("/unsubscribe?status=invalid", url.origin), 303)
      : Response.json({ error: "This unsubscribe link is not valid." }, { status: 400 });
  }
  try {
    await applyPatientAction(patientId, "opted-out");
  } catch {
    return fromForm
      ? Response.redirect(new URL(`/unsubscribe?status=error&p=${patientId}&t=${token}`, url.origin), 303)
      : Response.json({ error: "Could not update preferences. Please try again." }, { status: 503 });
  }
  return fromForm
    ? Response.redirect(new URL("/unsubscribe?status=done", url.origin), 303)
    : Response.json({ unsubscribed: true });
}
