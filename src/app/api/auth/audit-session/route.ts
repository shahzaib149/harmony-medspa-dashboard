import { after } from "next/server";
import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { createServiceClient } from "@/lib/supabase/server";

async function record(request: Request, action: "user_logged_in" | "user_logged_out") {
  try {
    const { profile } = await requireRole(request, "viewer");
    after(async () => {
      if (action === "user_logged_in") {
        await createServiceClient().from("profiles").update({ last_sign_in_at: new Date().toISOString() }).eq("id", profile.id);
      }
      await logAuditEvent({
        actor: profile,
        action,
        category: "authentication",
        resource: { type: "session", id: profile.id, label: profile.full_name || "Staff session" },
        summary: action === "user_logged_in" ? "Signed in to the Harmony Dashboard" : "Signed out of the Harmony Dashboard",
        metadata: { auth_provider: "supabase_password" },
        request,
      });
    });
    return Response.json({ recorded: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  return record(request, "user_logged_in");
}

export async function DELETE(request: Request) {
  return record(request, "user_logged_out");
}
