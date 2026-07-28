import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isRole, type Profile } from "@/lib/auth/permissions";
import { getSupabasePublicConfig, isSupabaseConfigured } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/server";
import { resilientFetch } from "@/lib/network/resilient-fetch";

type PendingCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

function withCookies(response: NextResponse, cookies: PendingCookie[]) {
  cookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  return response;
}

function safeNext(value: unknown) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/dashboard";
}

export async function POST(request: NextRequest) {
  const requestOrigin = request.headers.get("origin");
  if (requestOrigin && requestOrigin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid sign-in request." }, { status: 403 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Authentication is not configured." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    email?: unknown;
    password?: unknown;
    next?: unknown;
  } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const cookiesToSet: PendingCookie[] = [];
  const { url, anonKey } = getSupabasePublicConfig();
  const supabase = createServerClient(url, anonKey, {
    global: { fetch: resilientFetch },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies) {
        cookiesToSet.push(...cookies);
      },
    },
  });

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      const status = error?.status === 429 ? 429 : 401;
      const message = status === 429
        ? "Too many sign-in attempts. Wait a minute and try again."
        : "Invalid email or password. Check your details and try again.";
      return withCookies(NextResponse.json({ error: message }, { status }), cookiesToSet);
    }

    const { data: profile, error: profileError } = await createServiceClient()
      .from("profiles")
      .select("id,email,full_name,role,is_active,last_sign_in_at,created_at,updated_at")
      .eq("id", data.user.id)
      .maybeSingle<Profile>();

    if (profileError || !profile || !profile.is_active || !isRole(profile.role)) {
      await supabase.auth.signOut();
      return withCookies(
        NextResponse.json(
          { error: "This account is inactive or does not have dashboard access." },
          { status: 403 },
        ),
        cookiesToSet,
      );
    }

    return withCookies(
      NextResponse.json({ success: true, redirectTo: safeNext(body?.next) }),
      cookiesToSet,
    );
  } catch {
    return withCookies(
      NextResponse.json(
        { error: "The authentication service could not be reached. Try again." },
        { status: 503 },
      ),
      cookiesToSet,
    );
  }
}
