import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isRole, type Profile } from "@/lib/auth/permissions";

const protectedRoutePattern = /^\/(dashboard|leads|message-logs|google-ads-analytics|settings|google-business)(\/.*)?$/;

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies.getAll().some((cookie) => (
    cookie.name.startsWith("sb-") && cookie.name.includes("auth-token")
  ));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;
  const isProtected = protectedRoutePattern.test(pathname);
  const isLogin = pathname === "/login";
  const hasAuthCookie = hasSupabaseAuthCookie(request);

  if (!hasAuthCookie) {
    if (isProtected) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    if (isProtected) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,is_active,last_sign_in_at,created_at,updated_at")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  if (!profile?.is_active) {
    if (isProtected) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("error", "inactive");
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

  if (isLogin) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname.startsWith("/settings/users") && profile.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-harmony-user-id", user.id);
  requestHeaders.set("x-harmony-user-email", user.email ?? profile.email ?? "");
  if (isRole(profile.role)) requestHeaders.set("x-harmony-role", profile.role);

  response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  return response;
}
