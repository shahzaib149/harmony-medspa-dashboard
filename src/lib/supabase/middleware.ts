import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const protectedRoutePattern = /^\/(dashboard|leads|campaigns|nurture|message-logs|google-ads-analytics|website-analytics|ai-insights|settings|audit-log|google-business)(\/.*)?$/;

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies.getAll().some((cookie) => (
    cookie.name.startsWith("sb-") && cookie.name.includes("auth-token") && cookie.value.length > 10
  ));
}

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;
  const isProtected = protectedRoutePattern.test(pathname);

  // If Supabase is not configured, redirect protected routes to login
  if (!isSupabaseConfigured()) {
    if (isProtected) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

  // If visiting a protected route without any auth cookies, redirect to login
  if (isProtected && !hasSupabaseAuthCookie(request)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Never redirect from /login in middleware to avoid infinite redirect loops
  // if a stale or invalid cookie is present in the user's browser.
  return response;
}
