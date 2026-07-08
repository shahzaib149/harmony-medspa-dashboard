export type Role = "admin" | "editor" | "viewer";

export type PermissionAction =
  | "view:leads"
  | "update:leads"
  | "delete:leads"
  | "view:ads"
  | "approve:ads"
  | "view:settings"
  | "manage:users"
  | "toggle:automations";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role;
  is_active: boolean;
  last_sign_in_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const roleRank: Record<Role, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
};

const permissions: Record<Role, PermissionAction[]> = {
  admin: [
    "view:leads",
    "update:leads",
    "delete:leads",
    "view:ads",
    "approve:ads",
    "view:settings",
    "manage:users",
    "toggle:automations",
  ],
  editor: ["view:leads", "update:leads", "delete:leads", "view:ads", "approve:ads"],
  viewer: ["view:leads", "view:ads"],
};

export function isRole(value: unknown): value is Role {
  return value === "admin" || value === "editor" || value === "viewer";
}

export function hasMinimumRole(role: Role | null | undefined, minimumRole: Role) {
  if (!role) return false;
  return roleRank[role] >= roleRank[minimumRole];
}

export function can(role: Role | null | undefined, action: string) {
  if (!role) return false;
  return permissions[role].includes(action as PermissionAction);
}

export function formatRole(role: Role | null | undefined) {
  if (!role) return "";
  return role.charAt(0).toUpperCase() + role.slice(1);
}
