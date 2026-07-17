import { getAuthUrl } from "@/lib/google/oauth";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";

export async function GET(request: Request) {
  try {
    await requireRole(request, "admin");
  } catch {
    redirect("/login?next=/api/auth/google");
  }
  const url = getAuthUrl();
  redirect(url);
}
