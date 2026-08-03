import { resilientFetch } from "@/lib/network/resilient-fetch";

/**
 * The Make.com webhook that creates a paused responsive search ad.
 *
 * SAFETY: We read ONLY MAKE_PUBLISH_AD_WEBHOOK_URL.
 * DO NOT add NEXT_PUBLIC_MAKE_WEBHOOK_URL as a fallback — that variable
 * is the System 1 speed-to-lead webhook for the /lead capture form.
 * Posting a publish payload there would create false lead records in
 * Airtable and trigger patient SMS sequences.
 */
export function publishAdWebhookUrl(): string {
  const url = process.env.MAKE_PUBLISH_AD_WEBHOOK_URL?.trim();
  if (!url) {
    throw new Error(
      "MAKE_PUBLISH_AD_WEBHOOK_URL is not configured. " +
      "Add it to .env.local (never use the lead-capture webhook as a fallback).",
    );
  }
  return url;
}

export async function postPublishAdToMake(payload: Record<string, unknown>) {
  const url = publishAdWebhookUrl(); // throws immediately if not configured

  console.log("[make] posting to webhook:", url);
  console.log("[make] payload pendingAdId:", payload.pendingAdId, "idempotencyKey:", payload.idempotencyKey);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/plain, */*",
  };

  if (process.env.MAKE_WEBHOOK_SECRET?.trim()) {
    headers["x-harmony-webhook-secret"] = process.env.MAKE_WEBHOOK_SECRET.trim();
  }

  let response: Response;
  try {
    response = await resilientFetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch (error) {
    console.error("[make] fetch failed:", error);
    throw new Error("The Make publishing workflow could not be reached.", { cause: error });
  }

  console.log("[make] webhook response status:", response.status);

  if (response.status < 200 || response.status >= 300) {
    const text = await response.text().catch(() => "");
    console.error("[make] webhook rejected:", response.status, text);
    throw new Error(
      `The Make publishing workflow rejected the request (HTTP ${response.status}).`,
    );
  }

  return { status: response.status };
}
