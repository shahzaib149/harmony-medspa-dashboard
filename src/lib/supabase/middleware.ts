import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const protectedRoutePattern = /^\/(dashboard|leads|campaigns|nurture|message-logs|google-ads-analytics|ai-insights|settings|audit-log|google-business)(\/.*)?$/;

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies.getAll().some((cookie) => (
    cookie.name.startsWith("sb-") && cookie.name.includes("auth-token")
  ));
}

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
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

  if (isLogin) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}
