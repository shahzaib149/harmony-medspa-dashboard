import { getAuthUrl } from "@/lib/google/oauth";
import { redirect } from "next/navigation";

export async function GET() {
  const url = getAuthUrl();
  redirect(url);
}
