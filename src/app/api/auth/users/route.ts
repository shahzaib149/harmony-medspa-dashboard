import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { isRole, type Profile, type Role } from "@/lib/auth/permissions";
import { createServiceClient } from "@/lib/supabase/server";

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

async function writeAudit(
  actorId: string,
  action: string,
  targetId: string,
  metadata: Record<string, unknown> = {}
) {
  const service = createServiceClient();
  await service.from("audit_log").insert({
    actor_id: actorId,
    action,
    target_type: "user",
    target_id: targetId,
    metadata,
  });
}

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
    const { user: actor } = await requireRole(request, "admin");
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

    await writeAudit(actor.id, "user.created", created.user.id, { email, role });
    return Response.json({ user: profile }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { user: actor } = await requireRole(request, "admin");
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

    await writeAudit(actor.id, "user.updated", body.id, {
      changed: Object.keys(updates),
      password_reset: Boolean(body.password),
    });

    return Response.json({ user: profile });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { user: actor } = await requireRole(request, "admin");
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

    await writeAudit(actor.id, "user.deleted", id, {
      email: profile?.email ?? null,
      role: profile?.role ?? null,
    });

    const { error: deleteError } = await service.auth.admin.deleteUser(id);
    if (deleteError) return Response.json({ error: deleteError.message }, { status: 500 });

    return Response.json({ deleted: true, id });
  } catch (error) {
    return authErrorResponse(error);
  }
}
