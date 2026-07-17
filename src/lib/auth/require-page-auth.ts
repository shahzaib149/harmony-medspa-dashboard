import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { hasMinimumRole, isRole, type Profile, type Role } from "@/lib/auth/permissions";

// Server-side page guard (defense-in-depth, independent of the request proxy).
// Runs inside protected Server Component pages so the gate holds in BOTH
// `next dev` (where the Turbopack proxy does not execute) and production, and
// even if the proxy layer is ever bypassed. Verifies the session against the
// Supabase Auth server (getUser), the profile, and is_active before any
// protected markup renders.
export async function requirePageAuth(options?: {
  minimumRole?: Role;
  next?: string;
}): Promise<{ profile: Profile }> {
  // Fail closed when auth is not configured — never render protected pages open.
  if (!isSupabaseConfigured()) redirect("/login");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const nextParam = options?.next ? `?next=${encodeURIComponent(options.next)}` : "";
  if (!user) redirect(`/login${nextParam}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,is_active,last_sign_in_at,created_at,updated_at")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  if (!profile || !profile.is_active || !isRole(profile.role)) {
    redirect("/login?error=inactive");
  }

  if (options?.minimumRole && !hasMinimumRole(profile.role, options.minimumRole)) {
    redirect("/dashboard?error=access-denied");
  }

  return { profile };
}
