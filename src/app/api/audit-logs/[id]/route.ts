import { sanitizeAuditData } from "@/lib/audit/sanitize";
import type { AuditLogRecord } from "@/lib/audit/types";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(request, "admin");
  } catch (error) {
    return authErrorResponse(error);
  }

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return Response.json({ error: "Invalid audit event ID" }, { status: 400 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("audit_logs")
    .select("id,created_at,actor_user_id,actor_name,actor_email_masked,actor_role,action,category,resource_type,resource_id,resource_label,summary,before_data,after_data,metadata,result,request_id,source,user_agent,ip_hash")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return Response.json({ error: "Audit activity details could not be loaded" }, { status: 500 });
  }
  if (!data) return Response.json({ error: "Audit activity was not found" }, { status: 404 });

  const item = {
    ...data,
    before_data: sanitizeAuditData(data.before_data),
    after_data: sanitizeAuditData(data.after_data),
    metadata: sanitizeAuditData(data.metadata),
  } as AuditLogRecord;

  return Response.json({ item }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
