"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle, ChevronDown, Loader2, Plus, RefreshCw,
  Save, Search, ShieldAlert, UserCog, X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Profile, Role } from "@/lib/auth/permissions";

const GOLD        = "#C9A84C";
const PANEL       = "#0D0D12";
const CARD        = "#111117";
const TEXT        = "#F0ECE4";
const MUTED       = "#7A7A8A";
const DIM         = "#5A5A6A";
const BORDER      = "rgba(201,168,76,0.12)";
const BORDER_SOFT = "rgba(255,255,255,0.06)";
const TEAL        = "#2DD4BF";
const RED         = "#F87171";

type DrawerMode = "create" | "edit";
type StaffForm  = {
  id?:             string;
  full_name:       string;
  email:           string;
  role:            Role;
  is_active:       boolean;
  password:        string;
  confirmPassword: string;
};

const emptyForm: StaffForm = {
  full_name: "", email: "", role: "viewer",
  is_active: true, password: "", confirmPassword: "",
};

const ROLE_COLOR: Record<Role, string> = {
  admin:  GOLD,
  editor: TEAL,
  viewer: MUTED,
};

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(p => p[0]).join("").toUpperCase() || "?";
}
function dateLabel(v: string | null) {
  if (!v) return "Never";
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ── Role pill / select ── */
function RolePill({ role }: { role: Role }) {
  const color = ROLE_COLOR[role] ?? MUTED;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold capitalize"
      style={{ color, backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {role}
    </span>
  );
}

function RoleSelect({ value, disabled, onChange }: {
  value: Role; disabled?: boolean; onChange: (r: Role) => void;
}) {
  return (
    <label className="relative">
      <select value={value} disabled={disabled}
        onChange={e => onChange(e.target.value as Role)}
        className="appearance-none rounded-full border pl-2.5 pr-6 py-1 text-[11px] font-bold capitalize disabled:cursor-not-allowed disabled:opacity-50"
        style={{ color: ROLE_COLOR[value], backgroundColor: `${ROLE_COLOR[value]}12`, borderColor: `${ROLE_COLOR[value]}30` }}>
        <option value="admin">admin</option>
        <option value="editor">editor</option>
        <option value="viewer">viewer</option>
      </select>
      <ChevronDown size={10} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2"
        style={{ color: ROLE_COLOR[value] }} />
    </label>
  );
}

/* ── Active toggle ── */
function Toggle({ checked, disabled, onChange }: {
  checked: boolean; disabled?: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button type="button" disabled={disabled} onClick={() => onChange(!checked)}
      className="relative h-6 w-11 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50"
      style={{ backgroundColor: checked ? TEAL : "#2A2A32" }} aria-pressed={checked}>
      <span className="absolute top-1 h-4 w-4 rounded-full bg-white transition-transform"
        style={{ left: checked ? 23 : 4 }} />
    </button>
  );
}

/* ── Form field ── */
function Field({ label, value, type = "text", disabled, onChange }: {
  label: string; value: string; type?: string; disabled?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.09em]" style={{ color: DIM }}>{label}</span>
      <input type={type} value={value} disabled={disabled}
        onChange={e => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border px-3 text-sm outline-none disabled:opacity-50"
        style={{ backgroundColor: PANEL, borderColor: BORDER, color: TEXT }} />
    </label>
  );
}

/* ── Add / Edit drawer ── */
function StaffDrawer({ mode, form, saving, error, isSelf, onChange, onClose, onSave }: {
  mode: DrawerMode; form: StaffForm; saving: boolean; error: string | null;
  isSelf: boolean; onChange: (p: Partial<StaffForm>) => void;
  onClose: () => void; onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70]">
      <button className="absolute inset-0 bg-black/55" onClick={onClose} aria-label="Close" />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[460px] flex-col border-l"
        style={{ backgroundColor: "#09090D", borderColor: BORDER, boxShadow: "-24px 0 80px rgba(0,0,0,0.5)" }}>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b p-5 flex-shrink-0" style={{ borderColor: BORDER }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] mb-1" style={{ color: GOLD }}>
              {mode === "create" ? "Add Staff Member" : "Edit Staff Member"}
            </p>
            <h2 className="text-lg font-extrabold" style={{ color: TEXT }}>
              {mode === "create" ? "Create dashboard access" : form.full_name || form.email}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-xl border p-2"
            style={{ borderColor: BORDER, color: MUTED, backgroundColor: CARD }}>
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <Field label="Full Name" value={form.full_name} onChange={v => onChange({ full_name: v })} />
          <Field label="Email" value={form.email} type="email" disabled={mode === "edit"} onChange={v => onChange({ email: v })} />

          {/* Role */}
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.09em]" style={{ color: DIM }}>Role</span>
            <select value={form.role} disabled={isSelf}
              onChange={e => onChange({ role: e.target.value as Role })}
              className="h-11 w-full rounded-xl border px-3 text-sm outline-none disabled:opacity-50"
              style={{ backgroundColor: PANEL, borderColor: BORDER, color: TEXT }}>
              <option value="admin">Admin — full access</option>
              <option value="editor">Editor — can update leads and content</option>
              <option value="viewer">Viewer — read only</option>
            </select>
          </label>

          {/* Active toggle (edit only) */}
          {mode === "edit" && (
            <div className="flex items-center justify-between rounded-xl border p-4"
              style={{ backgroundColor: PANEL, borderColor: BORDER }}>
              <div>
                <p className="text-sm font-bold mb-0.5" style={{ color: TEXT }}>Active account</p>
                <p className="text-xs" style={{ color: MUTED }}>Inactive staff cannot log in.</p>
              </div>
              <Toggle checked={form.is_active} disabled={isSelf} onChange={v => onChange({ is_active: v })} />
            </div>
          )}

          {/* Password */}
          <div className="rounded-xl border p-4" style={{ backgroundColor: PANEL, borderColor: BORDER }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.09em] mb-3" style={{ color: GOLD }}>
              {mode === "create" ? "Set Password" : "Reset Password"}
            </p>
            <div className="space-y-3">
              <Field label={mode === "create" ? "Password" : "New Password"} type="password"
                value={form.password} onChange={v => onChange({ password: v })} />
              <Field label="Confirm Password" type="password"
                value={form.confirmPassword} onChange={v => onChange({ confirmPassword: v })} />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border p-3 text-sm"
              style={{ color: RED, backgroundColor: "rgba(248,113,113,0.08)", borderColor: "rgba(248,113,113,0.25)" }}>
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" /> {error}
            </div>
          )}
        </div>

        <div className="border-t p-5 flex-shrink-0" style={{ borderColor: BORDER }}>
          <button onClick={onSave} disabled={saving}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold disabled:opacity-60"
            style={{ backgroundColor: GOLD, color: "#0A0A0D" }}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? "Saving…" : mode === "create" ? "Add Staff Member" : "Save Changes"}
          </button>
        </div>
      </aside>
    </div>
  );
}

/* ═══════════════════════════════ MAIN ═══════════════════════════════ */
export default function SettingsClient() {
  const { role, user, isLoading } = useAuth();
  const [staff, setStaff]         = useState<Profile[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<DrawerMode | null>(null);
  const [form, setForm]           = useState<StaffForm>(emptyForm);
  const [query, setQuery]         = useState("");

  const load = useCallback(async () => {
    if (role !== "admin") return;
    setLoading(true); setError(null);
    try {
      const res  = await fetch("/api/auth/users", { cache: "no-store" });
      const data = await res.json() as { users?: Profile[]; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Could not load staff");
      setStaff(data.users ?? []);
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  }, [role]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter(s => [s.full_name, s.email, s.role].some(v => (v ?? "").toLowerCase().includes(q)));
  }, [query, staff]);

  function openCreate() { setForm(emptyForm); setDrawerMode("create"); setError(null); }
  function openEdit(p: Profile) {
    setForm({ id: p.id, full_name: p.full_name ?? "", email: p.email ?? "", role: p.role,
              is_active: p.is_active, password: "", confirmPassword: "" });
    setDrawerMode("edit"); setError(null);
  }

  async function saveStaff() {
    setSaving(true); setError(null);
    try {
      if (drawerMode === "create" && form.password.length < 8) throw new Error("Password must be at least 8 characters");
      if (form.password || form.confirmPassword) {
        if (form.password.length < 8)              throw new Error("Password must be at least 8 characters");
        if (form.password !== form.confirmPassword) throw new Error("Passwords do not match");
      }
      const payload = drawerMode === "create"
        ? { email: form.email, password: form.password, full_name: form.full_name, role: form.role }
        : { id: form.id, full_name: form.full_name, role: form.role, is_active: form.is_active, password: form.password || undefined };

      const res  = await fetch("/api/auth/users", {
        method: drawerMode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { user?: Profile; error?: string };
      if (!res.ok || data.error || !data.user) throw new Error(data.error ?? "Could not save");
      setStaff(cur => drawerMode === "create"
        ? [data.user!, ...cur]
        : cur.map(s => s.id === data.user!.id ? data.user! : s));
      setDrawerMode(null);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setSaving(false); }
  }

  async function quickUpdate(p: Profile, patch: Partial<Pick<Profile, "role" | "is_active">>) {
    if (p.id === user?.id && (patch.role || patch.is_active === false)) return;
    const res  = await fetch("/api/auth/users", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, ...patch }),
    });
    const data = await res.json() as { user?: Profile; error?: string };
    if (!res.ok || !data.user) { setError(data.error ?? "Could not update"); return; }
    setStaff(cur => cur.map(s => s.id === data.user!.id ? data.user! : s));
  }

  /* ── Access denied ── */
  if (isLoading) return (
    <div className="flex items-center gap-3 rounded-2xl border p-8" style={{ backgroundColor: CARD, borderColor: BORDER, color: MUTED }}>
      <Loader2 size={18} className="animate-spin" style={{ color: GOLD }} /> Loading…
    </div>
  );

  if (role !== "admin") return (
    <div className="flex items-start gap-3 rounded-2xl border p-6"
      style={{ backgroundColor: CARD, borderColor: "rgba(248,113,113,0.25)" }}>
      <ShieldAlert size={20} style={{ color: RED }} />
      <div>
        <p className="text-sm font-bold mb-1" style={{ color: RED }}>Access denied</p>
        <p className="text-sm" style={{ color: MUTED }}>Only admins can manage staff accounts.</p>
      </div>
    </div>
  );

  const active   = staff.filter(s => s.is_active).length;
  const admins   = staff.filter(s => s.role === "admin").length;

  return (
    <div className="space-y-5">

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: MUTED }} />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search staff by name, email or role…"
            className="h-10 w-full rounded-xl border pl-9 pr-3 text-sm outline-none"
            style={{ backgroundColor: CARD, borderColor: BORDER, color: TEXT }} />
        </div>

        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold"
          style={{ borderColor: BORDER, color: MUTED, backgroundColor: CARD }}>
          {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          Refresh
        </button>

        <button onClick={openCreate}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold"
          style={{ backgroundColor: GOLD, color: "#0A0A0D" }}>
          <Plus size={14} /> Add Staff
        </button>
      </div>

      {/* ── Summary pills ── */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: `${staff.length} total`,  color: MUTED  },
          { label: `${active} active`,        color: TEAL   },
          { label: `${admins} admin${admins !== 1 ? "s" : ""}`, color: GOLD },
        ].map(p => (
          <span key={p.label} className="rounded-full border px-3 py-1 text-[11px] font-semibold"
            style={{ color: p.color, backgroundColor: `${p.color}10`, borderColor: `${p.color}25` }}>
            {p.label}
          </span>
        ))}
      </div>

      {/* ── Error ── */}
      {error && !drawerMode && (
        <div className="flex items-center gap-2 rounded-xl border p-3 text-sm"
          style={{ color: RED, backgroundColor: "rgba(248,113,113,0.08)", borderColor: "rgba(248,113,113,0.25)" }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* ── Staff table ── */}
      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: CARD, borderColor: BORDER }}>
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20" style={{ color: MUTED }}>
            <Loader2 size={18} className="animate-spin" style={{ color: GOLD }} /> Loading staff…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-separate border-spacing-0">
              <thead>
                <tr style={{ backgroundColor: "#0B0B10" }}>
                  {["Staff Member", "Role", "Status", "Last Sign In", "Added", ""].map(h => (
                    <th key={h} className="border-b px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.09em]"
                      style={{ color: DIM, borderColor: BORDER_SOFT }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const isSelf = p.id === user?.id;
                  return (
                    <tr key={p.id} onClick={() => openEdit(p)}
                      className="cursor-pointer transition-colors"
                      style={{ backgroundColor: "transparent" }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = "#161620"}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>

                      {/* Name */}
                      <td className="border-b px-4 py-3" style={{ borderColor: BORDER_SOFT }}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold flex-shrink-0"
                            style={{ backgroundColor: "rgba(201,168,76,0.08)", color: GOLD, border: "1px solid rgba(201,168,76,0.18)" }}>
                            {initials(p.full_name || p.email || "")}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate" style={{ color: TEXT }}>{p.full_name || "—"}</p>
                            <p className="text-[11px] truncate" style={{ color: MUTED }}>{p.email}</p>
                            {isSelf && <p className="text-[10px] font-bold" style={{ color: TEAL }}>You</p>}
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="border-b px-4 py-3" style={{ borderColor: BORDER_SOFT }}
                        onClick={e => e.stopPropagation()}>
                        <RoleSelect value={p.role} disabled={isSelf}
                          onChange={r => void quickUpdate(p, { role: r })} />
                      </td>

                      {/* Active toggle */}
                      <td className="border-b px-4 py-3" style={{ borderColor: BORDER_SOFT }}
                        onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Toggle checked={p.is_active} disabled={isSelf}
                            onChange={v => void quickUpdate(p, { is_active: v })} />
                          <span className="text-xs font-semibold"
                            style={{ color: p.is_active ? TEAL : RED }}>
                            {p.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>

                      {/* Last sign in */}
                      <td className="border-b px-4 py-3 text-xs" style={{ borderColor: BORDER_SOFT, color: MUTED }}>
                        {dateLabel(p.last_sign_in_at)}
                      </td>

                      {/* Created */}
                      <td className="border-b px-4 py-3 text-xs" style={{ borderColor: BORDER_SOFT, color: DIM }}>
                        {dateLabel(p.created_at)}
                      </td>

                      {/* Edit button */}
                      <td className="border-b px-4 py-3 text-right" style={{ borderColor: BORDER_SOFT }}>
                        <button className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold"
                          style={{ color: GOLD, borderColor: "rgba(201,168,76,0.2)", backgroundColor: "rgba(201,168,76,0.05)" }}>
                          <UserCog size={12} /> Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && !loading && (
              <div className="py-16 text-center text-sm" style={{ color: MUTED }}>
                {query ? "No staff match this search." : "No staff members yet. Add one to get started."}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Drawer ── */}
      {drawerMode && (
        <StaffDrawer
          mode={drawerMode} form={form} saving={saving} error={error}
          isSelf={form.id === user?.id}
          onChange={p => setForm(c => ({ ...c, ...p }))}
          onClose={() => setDrawerMode(null)}
          onSave={saveStaff}
        />
      )}
    </div>
  );
}
