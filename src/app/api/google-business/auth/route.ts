// Step 1 — redirect user to Google's consent screen with GBP scope
import { requireRole } from "@/lib/auth/requireRole";

export async function GET(request: Request) {
  try {
    await requireRole(request, "admin");
  } catch {
    return Response.redirect(new URL("/login?next=/api/google-business/auth", request.url), 302);
  }
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  if (!clientId) {
    return Response.json({ error: "GOOGLE_ADS_CLIENT_ID not set" }, { status: 500 });
  }

  const appOrigin = (process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin).replace(/\/$/, "");
  const redirectUri = `${appOrigin}/api/google-business/auth/callback`;

  const scopes = [
    "https://www.googleapis.com/auth/business.manage",
  ].join(" ");

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: "code",
    scope:         scopes,
    access_type:   "offline",
    prompt:        "consent",   // force refresh_token to be returned
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  return Response.redirect(url, 302);
}
