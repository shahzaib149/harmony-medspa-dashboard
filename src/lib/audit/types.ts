import type { Profile } from "@/lib/auth/permissions";

export const AUDIT_RESULTS = ["success", "failed"] as const;
export type AuditResult = (typeof AUDIT_RESULTS)[number];

export const AUDIT_CATEGORIES = [
  "authentication",
  "users",
  "leads",
  "campaigns",
  "communications",
  "clinic_metrics",
  "settings",
  "google_ads",
  "exports",
  "integrations",
  "system",
] as const;
export type AuditCategory = (typeof AUDIT_CATEGORIES)[number];

export type AuditActor = Pick<Profile, "id" | "email" | "full_name" | "role"> | null;

export type AuditResource = {
  type?: string | null;
  id?: string | null;
  label?: string | null;
};

export type AuditEventInput = {
  actor: AuditActor;
  action: string;
  category: AuditCategory;
  resource?: AuditResource;
  summary: string;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
  result?: AuditResult;
  request?: Request;
  source?: string;
};

export type AuditLogRecord = {
  id: string;
  created_at: string;
  actor_user_id: string | null;
  actor_name: string | null;
  actor_email_masked: string | null;
  actor_role: string | null;
  action: string;
  category: AuditCategory;
  resource_type: string | null;
  resource_id: string | null;
  resource_label: string | null;
  summary: string;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  result: AuditResult;
  request_id: string | null;
  source: string | null;
  user_agent: string | null;
  ip_hash: string | null;
};
