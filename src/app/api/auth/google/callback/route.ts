import { exchangeCodeForTokens } from "@/lib/google/oauth";
import { createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";

export async function GET(request: Request) {
  try {
    await requireRole(request, "admin");
  } catch {
    redirect("/login?next=/api/auth/google/callback");
  }
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    redirect("/settings?google_error=" + (error ?? "no_code"));
  }

  try {
    const tokens = await exchangeCodeForTokens(code!);
    const supabase = await createServiceClient();

    await supabase.from("settings").upsert({
      key: "google_tokens",
      value: {
        refresh_token: tokens.refresh_token,
        access_token: tokens.access_token,
        expiry_date: tokens.expiry_date,
        connected_at: new Date().toISOString(),
      },
    });

    redirect("/settings?google_connected=true");
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    redirect("/settings?google_error=token_exchange_failed");
  }
}
