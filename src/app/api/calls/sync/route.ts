import { createHash, timingSafeEqual } from "node:crypto";
import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { googleAdsCallsConfigured, syncGoogleAdsCalls } from "@/lib/leads/call-sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

// A scheduler (Vercel Cron or a Make HTTP module) sends `Authorization: Bearer <CRON_SECRET>`.
function hasSchedulerSecret(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const header = request.headers.get("authorization") ?? "";
  if (!secret || secret.length < 32 || !header.startsWith("Bearer ")) return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(header.slice(7).trim()), digest(secret));
}

async function sync(request: Request) {
  let actor = null;
  if (!hasSchedulerSecret(request)) {
    try { ({ profile: actor } = await requireRole(request, "admin")); } catch (error) { return authErrorResponse(error); }
  }
  if (!googleAdsCallsConfigured()) {
    return Response.json({ error: "Google Ads credentials are not configured." }, { status: 503 });
  }
  const dryRun = new URL(request.url).searchParams.get("dryRun") === "1";
  const resource = { type: "calls", label: "Google Ads call import" };
  try {
    const result = await syncGoogleAdsCalls({ dryRun });
    if (!dryRun && (result.created.length || result.linked.length)) {
      await logAuditEvent({ actor, action: "calls_imported", category: "integrations", resource, summary: `Imported ${result.created.length} Google Ads calls and linked ${result.linked.length}`, metadata: { created: result.created.length, linked: result.linked.length, fetched: result.fetched }, request, source: actor ? undefined : "scheduler" });
    }
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    await logAuditEvent({ actor, action: "action_failed", category: "integrations", resource, summary: "Google Ads call import failed", metadata: { operation: "calls_imported", dryRun }, result: "failed", request, source: actor ? undefined : "scheduler" });
    const message = error instanceof Error ? error.message : "";
    return Response.json({ error: "Google Ads call import failed.", detail: message.slice(0, 300) }, { status: 502 });
  }
}

export async function GET(request: Request) { return sync(request); }
export async function POST(request: Request) { return sync(request); }
