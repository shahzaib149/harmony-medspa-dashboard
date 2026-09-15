import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Unsubscribe now lives on the Harmony website. Links from earlier emails are forwarded there.
export default async function UnsubscribeRedirect({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const key of ["p", "t"]) {
    const value = params[key];
    if (typeof value === "string") query.set(key, value);
  }
  const base = (process.env.REACTIVATION_UNSUBSCRIBE_BASE_URL || "https://www.harmonymedspafl.com").replace(/\/$/, "");
  redirect(`${base}/unsubscribe${query.size ? `?${query}` : ""}`);
}
