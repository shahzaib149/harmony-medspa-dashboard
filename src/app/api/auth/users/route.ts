import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { isRole, type Profile, type Role } from "@/lib/auth/permissions";
import { createServiceClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit/log-audit-event";

type CreateUserBody = {
  email?: string;
  password?: string;
  full_name?: string;
  role?: Role;
};

type UpdateUserBody = {
  id?: string;
  full_name?: string;
  role?: Role;
  is_active?: boolean;
  password?: string;
};

export async function GET(request: Request) {
  try {
    await requireRole(request, "admin");
    const service = createServiceClient();
    const { data, error } = await service
      .from("profiles")
      .select("id,email,full_name,role,is_active,last_sign_in_at,created_at,updated_at")
      .order("created_at", { ascending: false });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ users: data ?? [] });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { profile: actor } = await requireRole(request, "admin");
    const body = await request.json() as CreateUserBody;
    const email = body.email?.trim().toLowerCase();
    const fullName = body.full_name?.trim() ?? "";
    const role = body.role;

    if (!email || !body.password || body.password.length < 8 || !isRole(role)) {
      return Response.json({ error: "Email, password, and role are required" }, { status: 400 });
    }

    const service = createServiceClient();
    const { data: created, error: createError } = await service.auth.admin.createUser({
      email,
      password: body.password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    });

    if (createError || !created.user) {
      await logAuditEvent({ actor, action: "action_failed", category: "users", resource: { type: "user", label: fullName || email }, summary: "User invite could not be completed", metadata: { operation: "user_invited", email }, result: "failed", request });
      return Response.json({ error: createError?.message ?? "Could not create user" }, { status: 500 });
    }

    const { data: profile, error: profileError } = await service
      .from("profiles")
      .upsert({
        id: created.user.id,
        email,
        full_name: fullName,
        role,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .select("id,email,full_name,role,is_active,last_sign_in_at,created_at,updated_at")
      .single<Profile>();

    if (profileError) return Response.json({ error: profileError.message }, { status: 500 });

    await logAuditEvent({ actor, action: "user_invited", category: "users", resource: { type: "user", id: created.user.id, label: fullName || email }, summary: `Invited ${fullName || "a staff member"} as ${role}`, after: { full_name: fullName, email, role, is_active: true }, request });
    return Response.json({ user: profile }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { profile: actor } = await requireRole(request, "admin");
    const body = await request.json() as UpdateUserBody;
    if (!body.id) return Response.json({ error: "id required" }, { status: 400 });
    if (body.id === actor.id && (body.role || body.is_active === false)) {
      return Response.json({ error: "You cannot deactivate or change your own role" }, { status: 400 });
    }
    if (body.role && !isRole(body.role)) {
      return Response.json({ error: "Invalid role" }, { status: 400 });
    }
    if (body.password && body.password.length < 8) {
      return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const service = createServiceClient();
    const { data: beforeProfile } = await service.from("profiles").select("id,email,full_name,role,is_active").eq("id", body.id).maybeSingle<Pick<Profile, "id" | "email" | "full_name" | "role" | "is_active">>();
    if (body.password) {
      const { error: passwordError } = await service.auth.admin.updateUserById(body.id, { password: body.password });
      if (passwordError) return Response.json({ error: passwordError.message }, { status: 500 });
    }

    const updates: Partial<Profile> = { updated_at: new Date().toISOString() };
    if (body.full_name !== undefined) updates.full_name = body.full_name.trim();
    if (body.role !== undefined) updates.role = body.role;
    if (body.is_active !== undefined) updates.is_active = body.is_active;

    const { data: profile, error: updateError } = await service
      .from("profiles")
      .update(updates)
      .eq("id", body.id)
      .select("id,email,full_name,role,is_active,last_sign_in_at,created_at,updated_at")
      .single<Profile>();

    if (updateError) return Response.json({ error: updateError.message }, { status: 500 });

    const action = body.role !== undefined && body.role !== beforeProfile?.role
      ? "user_role_changed"
      : body.is_active !== undefined && body.is_active !== beforeProfile?.is_active
        ? "user_access_changed"
        : "user_updated";
    const before = Object.fromEntries(Object.keys(updates).filter((key) => key !== "updated_at").map((key) => [key, beforeProfile?.[key as keyof typeof beforeProfile] ?? null]));
    const after = Object.fromEntries(Object.keys(updates).filter((key) => key !== "updated_at").map((key) => [key, profile[key as keyof Profile] ?? null]));
    await logAuditEvent({ actor, action, category: "users", resource: { type: "user", id: body.id, label: profile.full_name || profile.email }, summary: action === "user_role_changed" ? `Changed ${profile.full_name || "staff member"}'s role` : action === "user_access_changed" ? `${profile.is_active ? "Activated" : "Deactivated"} ${profile.full_name || "staff member"}` : `Updated ${profile.full_name || "staff member"}`, before, after, metadata: { password_changed: Boolean(body.password) }, request });

    return Response.json({ user: profile });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { profile: actor } = await requireRole(request, "admin");
    const { id } = await request.json() as { id?: string };
    if (!id) return Response.json({ error: "id required" }, { status: 400 });
    if (id === actor.id) return Response.json({ error: "You cannot delete yourself" }, { status: 400 });

    const service = createServiceClient();
    const { data: profile, error: profileError } = await service
      .from("profiles")
      .select("id,email,full_name,role")
      .eq("id", id)
      .maybeSingle<Pick<Profile, "id" | "email" | "full_name" | "role">>();

    if (profileError) return Response.json({ error: profileError.message }, { status: 500 });

    const { error: deleteError } = await service.auth.admin.deleteUser(id);
    if (deleteError) {
      await logAuditEvent({ actor, action: "action_failed", category: "users", resource: { type: "user", id, label: profile?.full_name || profile?.email }, summary: "User removal could not be completed", metadata: { operation: "user_removed" }, result: "failed", request });
      return Response.json({ error: deleteError.message }, { status: 500 });
    }

    await logAuditEvent({ actor, action: "user_removed", category: "users", resource: { type: "user", id, label: profile?.full_name || profile?.email }, summary: `Removed ${profile?.full_name || "a staff member"}`, before: { email: profile?.email ?? null, role: profile?.role ?? null, is_active: true }, request });

    return Response.json({ deleted: true, id });
  } catch (error) {
    return authErrorResponse(error);
  }
}
