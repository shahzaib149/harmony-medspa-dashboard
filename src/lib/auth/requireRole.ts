import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { getSupabasePublicConfig, isSupabaseConfigured } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/server";
import { hasMinimumRole, isRole, type Profile, type Role } from "@/lib/auth/permissions";
import { resilientFetch } from "@/lib/network/resilient-fetch";

class AuthError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const AUTH_TIMEOUT_MS = 8_000;
const AUTH_RETRY_DELAY_MS = 250;

async function withAuthTimeout<T>(operation: PromiseLike<T>): Promise<T> {
  return Promise.race([
    Promise.resolve(operation),
    new Promise<never>((_, reject) => setTimeout(() => reject(new AuthError(503, "Authentication service timed out")), AUTH_TIMEOUT_MS)),
  ]);
}

function isTransientAuthError(error: unknown) {
  if (error instanceof AuthError && error.status === 503) return true;
  const status = Number((error as { status?: unknown } | null)?.status);
  if (status === 0 || status >= 500) return true;
  const message = error instanceof Error
    ? `${error.message} ${String(error.cause ?? "")}`
    : String((error as { message?: unknown } | null)?.message ?? error ?? "");
  return /fetch failed|network|timed? out|eai_again|enotfound|connection/i.test(message);
}

async function getVerifiedUser(
  operation: () => PromiseLike<{ data: { user: User | null }; error: unknown }>,
) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const { data, error } = await withAuthTimeout(operation());
      if (data.user) return data.user;
      if (!isTransientAuthError(error)) return null;
    } catch (error) {
      if (!isTransientAuthError(error)) throw error;
    }
    if (attempt === 0) {
      await new Promise((resolve) => setTimeout(resolve, AUTH_RETRY_DELAY_MS));
    }
  }
  throw new AuthError(
    503,
    "Authentication is temporarily unavailable. Wait a moment and try again.",
  );
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
  return getVerifiedUser(() => supabase.auth.getUser(token));
}

export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

const authSessionCache = new Map<
  string,
  { expiresAt: number; result: { user: User; profile: Profile } }
>();
const AUTH_CACHE_TTL_MS = 20_000; // 20 seconds session cache

export function invalidateAuthSessionCache() {
  authSessionCache.clear();
}

export async function requireRole(
  request: Request,
  minimumRole: Role
): Promise<{ user: User; profile: Profile }> {
  if (!isSupabaseConfigured()) {
    throw new AuthError(401, "Authentication required");
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const authHeader = request.headers.get("authorization") || "";
  const cacheKey = `${authHeader}:${cookieHeader}`;

  if (cacheKey.length > 1) {
    const cached = authSessionCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      if (!hasMinimumRole(cached.result.profile.role, minimumRole)) {
        throw new AuthError(403, "Access denied");
      }
      return cached.result;
    }
  }

  const bearerUser = await getUserFromBearerToken(request);
  if (bearerUser) {
    const result = await requireProfileForUser(bearerUser, minimumRole);
    if (cacheKey.length > 1) {
      authSessionCache.set(cacheKey, {
        expiresAt: Date.now() + AUTH_CACHE_TTL_MS,
        result,
      });
    }
    return result;
  }

  const { url, anonKey } = getSupabasePublicConfig();
  const supabase = createServerClient(
    url,
    anonKey,
    {
      global: { fetch: resilientFetch },
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

  const user = await getVerifiedUser(() => supabase.auth.getUser());
  if (!user) throw new AuthError(401, "Authentication required");

  const result = await requireProfileForUser(user, minimumRole);
  if (cacheKey.length > 1) {
    authSessionCache.set(cacheKey, {
      expiresAt: Date.now() + AUTH_CACHE_TTL_MS,
      result,
    });
  }
  return result;
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
