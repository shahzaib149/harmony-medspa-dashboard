import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";

type Body = { action?: unknown };

export async function POST(request: Request) {
  try {
    const { profile } = await requireRole(request, "viewer");
    const body = await request.json().catch(() => null) as Body | null;
    if (body?.action === "account_password_changed") {
      await logAuditEvent({ actor: profile, action: "setting_updated", category: "settings", resource: { type: "account_security", id: profile.id, label: "Account password" }, summary: "Changed account password", metadata: { setting: "password" }, request });
      return Response.json({ recorded: true });
    }
    return Response.json({ error: "Unsupported audit action" }, { status: 400 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
