import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/leads/:path*",
    "/message-logs/:path*",
    "/google-ads-analytics/:path*",
    "/settings/:path*",
    "/google-business/:path*",
  ],
};
