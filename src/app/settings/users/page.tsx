"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, ChevronDown, Loader2, Plus, RefreshCw, Save, Search, ShieldAlert, UserCog, X } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import type { Profile, Role } from "@/lib/auth/permissions";

const GOLD = "#C9A84C";
const BG = "#0A0A0D";
const PANEL = "#0D0D12";
const CARD = "#111117";
const TEXT = "#F0ECE4";
const MUTED = "#7A7A8A";
const DIM = "#5A5A6A";
const BORDER = "rgba(201,168,76,0.12)";
const BORDER_SOFT = "rgba(255,255,255,0.06)";
const TEAL = "#4ECDC4";

type DrawerMode = "create" | "edit";
type UserForm = {
  id?: string;
  full_name: string;
  email: string;
  role: Role;
  is_active: boolean;
  password: string;
  confirmPassword: string;
};

const emptyForm: UserForm = {
  full_name: "",
  email: "",
  role: "viewer",
  is_active: true,
  password: "",
  confirmPassword: "",
};

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
}

function dateLabel(value: string | null) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function RoleSelect({ value, disabled, onChange }: { value: Role; disabled?: boolean; onChange: (role: Role) => void }) {
  return (
    <label className="relative inline-flex">
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as Role)}
        className="appearance-none rounded-full border px-3 py-1 pr-7 text-[11px] font-bold disabled:cursor-not-allowed disabled:opacity-50"
        style={{ color: GOLD, backgroundColor: "rgba(201,168,76,0.10)", borderColor: "rgba(201,168,76,0.24)" }}
        title={disabled ? "You cannot change your own role" : undefined}
      >
        <option value="admin">Admin</option>
        <option value="editor">Editor</option>
        <option value="viewer">Viewer</option>
      </select>
      <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" style={{ color: GOLD }} />
    </label>
  );
}

function Toggle({ checked, disabled, onChange }: { checked: boolean; disabled?: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative h-6 w-11 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50"
      style={{ backgroundColor: checked ? TEAL : "#2A2A32" }}
      aria-pressed={checked}
      title={disabled ? "You cannot deactivate yourself" : undefined}
    >
      <span className="absolute top-1 h-4 w-4 rounded-full bg-white transition-transform" style={{ left: checked ? 23 : 4 }} />
    </button>
  );
}

function Field({ label, value, type = "text", disabled, onChange }: {
  label: string;
  value: string;
  type?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider" style={{ color: DIM }}>{label}</span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border px-3 text-sm outline-none disabled:opacity-60"
        style={{ backgroundColor: PANEL, borderColor: BORDER, color: TEXT }}
      />
    </label>
  );
}

function UserDrawer({
  mode,
  form,
  saving,
  error,
  isSelf,
  onChange,
  onClose,
  onSave,
}: {
  mode: DrawerMode;
  form: UserForm;
  saving: boolean;
  error: string | null;
  isSelf: boolean;
  onChange: (patch: Partial<UserForm>) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70]">
      <button className="absolute inset-0 bg-black/55" aria-label="Close user panel" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[480px] flex-col border-l" style={{ backgroundColor: "#09090D", borderColor: BORDER }}>
        <div className="flex items-start justify-between gap-4 border-b p-5" style={{ borderColor: BORDER }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: GOLD }}>{mode === "create" ? "Add user" : "Edit user"}</p>
            <h2 className="mt-1 text-xl font-extrabold" style={{ color: TEXT }}>{mode === "create" ? "Create dashboard access" : form.full_name || form.email}</h2>
          </div>
          <button onClick={onClose} className="rounded-xl border p-2" style={{ borderColor: BORDER, color: MUTED, backgroundColor: CARD }} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <Field label="Full name" value={form.full_name} onChange={(full_name) => onChange({ full_name })} />
          <Field label="Email" value={form.email} disabled={mode === "edit"} onChange={(email) => onChange({ email })} />
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider" style={{ color: DIM }}>Role</span>
            <select
              value={form.role}
              disabled={isSelf}
              onChange={(event) => onChange({ role: event.target.value as Role })}
              className="h-11 w-full rounded-xl border px-3 text-sm outline-none disabled:opacity-60"
              style={{ backgroundColor: PANEL, borderColor: BORDER, color: TEXT }}
              title={isSelf ? "You cannot change your own role" : undefined}
            >
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </label>

          {mode === "edit" && (
            <div className="flex items-center justify-between rounded-xl border p-3" style={{ backgroundColor: PANEL, borderColor: BORDER }}>
              <div>
                <p className="text-sm font-bold" style={{ color: TEXT }}>Active user</p>
                <p className="text-xs" style={{ color: MUTED }}>Inactive users cannot access protected dashboard pages.</p>
              </div>
              <Toggle checked={form.is_active} disabled={isSelf} onChange={(is_active) => onChange({ is_active })} />
            </div>
          )}

          <div className="rounded-xl border p-4" style={{ backgroundColor: PANEL, borderColor: BORDER }}>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: GOLD }}>
              {mode === "create" ? "Password" : "Reset password"}
            </p>
            <div className="space-y-3">
              <Field label={mode === "create" ? "Password" : "New password"} type="password" value={form.password} onChange={(password) => onChange({ password })} />
              <Field label="Confirm password" type="password" value={form.confirmPassword} onChange={(confirmPassword) => onChange({ confirmPassword })} />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border p-3 text-sm" style={{ color: "#F87171", backgroundColor: "rgba(248,113,113,0.08)", borderColor: "rgba(248,113,113,0.25)" }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>

        <div className="border-t p-5" style={{ borderColor: BORDER }}>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-extrabold disabled:opacity-60"
            style={{ backgroundColor: GOLD, color: "#0A0A0D" }}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Saving..." : "Save user"}
          </button>
        </div>
      </aside>
    </div>
  );
}

export default function UsersPage() {
  const { role, user, isLoading } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    if (role !== "admin") return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/users", { cache: "no-store" });
      const data = await res.json() as { users?: Profile[]; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Could not load users");
      setUsers(data.users ?? []);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return users;
    return users.filter((item) => [item.full_name, item.email, item.role].some((value) => (value ?? "").toLowerCase().includes(normalized)));
  }, [query, users]);

  function openCreate() {
    setForm(emptyForm);
    setDrawerMode("create");
    setError(null);
  }

  function openEdit(profile: Profile) {
    setForm({
      id: profile.id,
      full_name: profile.full_name ?? "",
      email: profile.email ?? "",
      role: profile.role,
      is_active: profile.is_active,
      password: "",
      confirmPassword: "",
    });
    setDrawerMode("edit");
    setError(null);
  }

  async function saveUser() {
    setSaving(true);
    setError(null);
    try {
      if (drawerMode === "create" && form.password.length < 8) throw new Error("Password must be at least 8 characters");
      if (form.password || form.confirmPassword) {
        if (form.password.length < 8) throw new Error("Password must be at least 8 characters");
        if (form.password !== form.confirmPassword) throw new Error("Passwords do not match");
      }

      const payload = drawerMode === "create"
        ? { email: form.email, password: form.password, full_name: form.full_name, role: form.role }
        : { id: form.id, full_name: form.full_name, role: form.role, is_active: form.is_active, password: form.password || undefined };

      const res = await fetch("/api/auth/users", {
        method: drawerMode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { user?: Profile; error?: string };
      if (!res.ok || data.error || !data.user) throw new Error(data.error ?? "Could not save user");
      setUsers((current) => drawerMode === "create"
        ? [data.user!, ...current]
        : current.map((item) => item.id === data.user!.id ? data.user! : item));
      setDrawerMode(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function quickUpdate(profile: Profile, patch: Partial<Pick<Profile, "role" | "is_active">>) {
    if (profile.id === user?.id && (patch.role || patch.is_active === false)) return;
    const res = await fetch("/api/auth/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: profile.id, ...patch }),
    });
    const data = await res.json() as { user?: Profile; error?: string };
    if (!res.ok || data.error || !data.user) {
      setError(data.error ?? "Could not update user");
      return;
    }
    setUsers((current) => current.map((item) => item.id === data.user!.id ? data.user! : item));
  }

  if (isLoading) {
    return (
      <DashboardLayout title="User Management" subtitle="Dashboard access and roles">
        <div className="flex items-center gap-3 rounded-2xl border p-6" style={{ backgroundColor: CARD, borderColor: BORDER, color: MUTED }}>
          <Loader2 size={18} className="animate-spin" style={{ color: GOLD }} />
          Loading access profile...
        </div>
      </DashboardLayout>
    );
  }

  if (role !== "admin") {
    return (
      <DashboardLayout title="User Management" subtitle="Dashboard access and roles">
        <div className="flex items-start gap-3 rounded-2xl border p-6" style={{ backgroundColor: CARD, borderColor: "rgba(248,113,113,0.25)" }}>
          <ShieldAlert size={20} style={{ color: "#F87171" }} />
          <div>
            <p className="text-sm font-bold" style={{ color: "#F87171" }}>Access denied</p>
            <p className="mt-1 text-sm" style={{ color: MUTED }}>Only admins can manage dashboard users.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="User Management"
      subtitle="Create accounts, reset passwords, and control dashboard roles"
      actions={<button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold" style={{ backgroundColor: GOLD, color: "#0A0A0D" }}><Plus size={15} /> Add user</button>}
    >
      <div className="space-y-5">
        <div className="rounded-2xl border p-3" style={{ backgroundColor: PANEL, borderColor: BORDER }}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users" className="h-11 w-full rounded-xl border pl-10 pr-3 text-sm outline-none" style={{ backgroundColor: CARD, borderColor: BORDER, color: TEXT }} />
            </div>
            <button onClick={load} disabled={loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-bold" style={{ color: GOLD, borderColor: BORDER }}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Refresh
            </button>
          </div>
        </div>

        {error && !drawerMode && (
          <div className="flex items-start gap-2 rounded-xl border p-3 text-sm" style={{ color: "#F87171", backgroundColor: "rgba(248,113,113,0.08)", borderColor: "rgba(248,113,113,0.25)" }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border" style={{ backgroundColor: CARD, borderColor: BORDER }}>
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-20" style={{ color: MUTED }}>
              <Loader2 size={18} className="animate-spin" style={{ color: GOLD }} />
              Loading users...
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full min-w-[980px] border-separate border-spacing-0">
                <thead>
                  <tr style={{ backgroundColor: "#0B0B10" }}>
                    {["Name", "Email", "Role", "Status", "Last sign in", "Created", ""].map((heading) => (
                      <th key={heading} className="border-b px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.09em]" style={{ color: DIM, borderColor: BORDER_SOFT }}>{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((profile) => {
                    const isSelf = profile.id === user?.id;
                    return (
                      <tr key={profile.id} className="cursor-pointer" style={{ backgroundColor: BG }} onClick={() => openEdit(profile)}>
                        <td className="border-b px-4 py-3" style={{ borderColor: BORDER_SOFT }}>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-extrabold" style={{ color: GOLD, backgroundColor: "rgba(201,168,76,0.09)", borderColor: "rgba(201,168,76,0.18)" }}>
                              {initials(profile.full_name || profile.email || "")}
                            </div>
                            <div>
                              <p className="text-sm font-bold" style={{ color: TEXT }}>{profile.full_name || "Unnamed user"}</p>
                              {isSelf && <p className="text-[11px]" style={{ color: TEAL }}>Current session</p>}
                            </div>
                          </div>
                        </td>
                        <td className="border-b px-4 py-3 text-sm" style={{ borderColor: BORDER_SOFT, color: MUTED }}>{profile.email}</td>
                        <td className="border-b px-4 py-3" style={{ borderColor: BORDER_SOFT }} onClick={(event) => event.stopPropagation()}>
                          <RoleSelect value={profile.role} disabled={isSelf} onChange={(nextRole) => void quickUpdate(profile, { role: nextRole })} />
                        </td>
                        <td className="border-b px-4 py-3" style={{ borderColor: BORDER_SOFT }} onClick={(event) => event.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <Toggle checked={profile.is_active} disabled={isSelf} onChange={(is_active) => void quickUpdate(profile, { is_active })} />
                            <span className="text-xs font-bold" style={{ color: profile.is_active ? TEAL : "#F87171" }}>{profile.is_active ? "Active" : "Inactive"}</span>
                          </div>
                        </td>
                        <td className="border-b px-4 py-3 text-xs" style={{ borderColor: BORDER_SOFT, color: MUTED }}>{dateLabel(profile.last_sign_in_at)}</td>
                        <td className="border-b px-4 py-3 text-xs" style={{ borderColor: BORDER_SOFT, color: MUTED }}>{dateLabel(profile.created_at)}</td>
                        <td className="border-b px-4 py-3 text-right" style={{ borderColor: BORDER_SOFT }}>
                          <button className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold" style={{ color: GOLD, borderColor: BORDER }}>
                            <UserCog size={13} /> Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="py-16 text-center text-sm" style={{ color: MUTED }}>No users match this search.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {drawerMode && (
        <UserDrawer
          mode={drawerMode}
          form={form}
          saving={saving}
          error={error}
          isSelf={form.id === user?.id}
          onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
          onClose={() => setDrawerMode(null)}
          onSave={saveUser}
        />
      )}
    </DashboardLayout>
  );
}
