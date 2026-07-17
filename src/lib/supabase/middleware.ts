import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig, isSupabaseConfigured } from "@/lib/supabase/config";

const protectedRoutePattern = /^\/(dashboard|leads|campaigns|nurture|message-logs|google-ads-analytics|ai-insights|settings|audit-log|google-business)(\/.*)?$/;

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

  const pathnameForConfigCheck = request.nextUrl.pathname;

  if (!isSupabaseConfigured()) {
    // No Supabase credentials configured — fail closed on protected routes
    // instead of rendering the dashboard open to anyone.
    if (protectedRoutePattern.test(pathnameForConfigCheck)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("next", pathnameForConfigCheck);
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

  const { url, anonKey } = getSupabasePublicConfig();

  const supabase = createServerClient(
    url,
    anonKey,
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

  if (isLogin) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}
