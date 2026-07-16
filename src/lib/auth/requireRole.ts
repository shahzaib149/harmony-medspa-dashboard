import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { getSupabasePublicConfig, isSupabaseConfigured } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/server";
import { hasMinimumRole, isRole, type Profile, type Role } from "@/lib/auth/permissions";

class AuthError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const AUTH_TIMEOUT_MS = 8_000;

async function withAuthTimeout<T>(operation: PromiseLike<T>): Promise<T> {
  return Promise.race([
    Promise.resolve(operation),
    new Promise<never>((_, reject) => setTimeout(() => reject(new AuthError(503, "Authentication service timed out")), AUTH_TIMEOUT_MS)),
  ]);
}

function parseCookieHeader(header: string | null) {
  if (!header) return [];
  return header.split(";").map((part) => {
    const [name, ...rest] = part.trim().split("=");
    return { name, value: rest.join("=") };
  }).filter((cookie) => cookie.name);
}

async function getUserFromBearerToken(request: Request) {
  if (!isSupabaseConfigured()) return null;

  const authorization = request.headers.get("authorization");
  if (!authorization?.toLowerCase().startsWith("bearer ")) return null;

  const token = authorization.slice("bearer ".length).trim();
  if (!token) return null;

  const supabase = createServiceClient();
  const { data, error } = await withAuthTimeout(supabase.auth.getUser(token));
  if (error || !data.user) return null;
  return data.user;
}

export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export async function requireRole(
  request: Request,
  minimumRole: Role
): Promise<{ user: User; profile: Profile }> {
  if (!isSupabaseConfigured()) {
    throw new AuthError(401, "Authentication required");
  }

  const bearerUser = await getUserFromBearerToken(request);
  if (bearerUser) {
    return requireProfileForUser(bearerUser, minimumRole);
  }

  const { url, anonKey } = getSupabasePublicConfig();
  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(request.headers.get("cookie"));
        },
        setAll() {
          // Route handlers that use this helper only need to read the caller session.
        },
      },
    }
  );

  const { data: { user }, error } = await withAuthTimeout(supabase.auth.getUser());
  if (error || !user) throw new AuthError(401, "Authentication required");

  return requireProfileForUser(user, minimumRole);
}

async function requireProfileForUser(user: User, minimumRole: Role): Promise<{ user: User; profile: Profile }> {
  const service = createServiceClient();
  const { data: profile, error: profileError } = await withAuthTimeout(service
    .from("profiles")
    .select("id,email,full_name,role,is_active,last_sign_in_at,created_at,updated_at")
    .eq("id", user.id)
    .maybeSingle<Profile>());

  if (profileError || !profile || !profile.is_active || !isRole(profile.role)) {
    throw new AuthError(403, "Access denied");
  }

  if (!hasMinimumRole(profile.role, minimumRole)) {
    throw new AuthError(403, "Access denied");
  }

  return { user, profile };
}
