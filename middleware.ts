import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard/:path*",
    "/dashboard",
    "/leads/:path*",
    "/leads",
    "/campaigns/:path*",
    "/campaigns",
    "/nurture/:path*",
    "/nurture",
    "/message-logs/:path*",
    "/message-logs",
    "/message-log",
    "/google-ads-analytics/:path*",
    "/google-ads-analytics",
    "/google-ads/:path*",
    "/google-ads",
    "/ai-insights/:path*",
    "/ai-insights",
    "/settings/:path*",
    "/settings",
    "/audit-log/:path*",
    "/audit-log",
    "/google-business/:path*",
    "/google-business",
  ],
};
