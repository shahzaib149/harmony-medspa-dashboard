import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { maskEmail, sanitizeAuditData } from "@/lib/audit/sanitize";
import type { AuditEventInput } from "@/lib/audit/types";

const AUDIT_TIMEOUT_MS = 5_000;

function requestId(request?: Request) {
  return request?.headers.get("x-request-id")?.slice(0, 128) || randomUUID();
}

function hashIp(request?: Request) {
  const salt = process.env.AUDIT_IP_HASH_SALT?.trim();
  if (!request || !salt) return null;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip")?.trim();
  return ip ? createHash("sha256").update(`${salt}:${ip}`).digest("hex") : null;
}

export async function logAuditEvent(input: AuditEventInput): Promise<{ requestId: string; logged: boolean }> {
  const id = requestId(input.request);
  try {
    const service = createServiceClient();
    const insert = service.from("audit_logs").insert({
      actor_user_id: input.actor?.id ?? null,
      actor_name: input.actor?.full_name?.trim() || null,
      actor_email_masked: maskEmail(input.actor?.email),
      actor_role: input.actor?.role ?? null,
      action: input.action,
      category: input.category,
      resource_type: input.resource?.type ?? null,
      resource_id: input.resource?.id ?? null,
      resource_label: input.resource?.label ?? null,
      summary: input.summary,
      before_data: sanitizeAuditData(input.before),
      after_data: sanitizeAuditData(input.after),
      metadata: sanitizeAuditData(input.metadata),
      result: input.result ?? "success",
      request_id: id,
      source: input.source ?? "dashboard",
      user_agent: input.request?.headers.get("user-agent")?.slice(0, 500) ?? null,
      ip_hash: hashIp(input.request),
    });
    const { error } = await Promise.race([
      insert,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Audit insert timed out")), AUDIT_TIMEOUT_MS)),
    ]);
    if (error) throw error;
    return { requestId: id, logged: true };
  } catch (error) {
    // Audit storage must never change the outcome of the primary business action.
    console.error("[audit] event insert failed", {
      requestId: id,
      action: input.action,
      category: input.category,
      error: error instanceof Error ? error.message : "Unknown audit error",
    });
    return { requestId: id, logged: false };
  }
}
