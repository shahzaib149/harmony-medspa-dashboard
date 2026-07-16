import { logAuditEvent } from "@/lib/audit/log-audit-event";
import { sanitizeAuditData } from "@/lib/audit/sanitize";
import { AUDIT_CATEGORIES, AUDIT_RESULTS, type AuditCategory, type AuditLogRecord } from "@/lib/audit/types";
import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const PAGE_SIZES = new Set([25, 50, 100]);

function clean(value: string | null, max = 100) {
  return value?.trim().slice(0, max) || null;
}

function safeSearch(value: string) {
  return value.replace(/[,%()]/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
}

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : typeof value === "string" ? value : JSON.stringify(value);
  return `"${text.replace(/"/g, '""')}"`;
}

type QueryOptions = {
  search: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  user: string | null;
  role: string | null;
  category: string | null;
  action: string | null;
  result: string | null;
  resourceType: string | null;
};

function applyFilters<T extends { eq: (column: string, value: string) => T; gte: (column: string, value: string) => T; lte: (column: string, value: string) => T; or: (filters: string) => T }>(query: T, options: QueryOptions) {
  let next = query;
  if (options.search) {
    const term = safeSearch(options.search);
    if (term) next = next.or(`actor_name.ilike.%${term}%,action.ilike.%${term}%,resource_label.ilike.%${term}%,summary.ilike.%${term}%`);
  }
  if (options.dateFrom) next = next.gte("created_at", `${options.dateFrom}T00:00:00.000Z`);
  if (options.dateTo) next = next.lte("created_at", `${options.dateTo}T23:59:59.999Z`);
  if (options.user) next = next.eq("actor_user_id", options.user);
  if (options.role) next = next.eq("actor_role", options.role);
  if (options.category) next = next.eq("category", options.category);
  if (options.action) next = next.eq("action", options.action);
  if (options.result) next = next.eq("result", options.result);
  if (options.resourceType) next = next.eq("resource_type", options.resourceType);
  return next;
}

async function exactCount(column?: string, value?: string, since?: string) {
  const service = createServiceClient();
  let query = service.from("audit_logs").select("id", { count: "exact", head: true });
  if (column && value) query = query.eq(column, value);
  if (since) query = query.gte("created_at", since);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

async function safeExactCount(column?: string, value?: string, since?: string) {
  try {
    return await exactCount(column, value, since);
  } catch {
    return 0;
  }
}

export async function GET(request: Request) {
  let auth: Awaited<ReturnType<typeof requireRole>>;
  try {
    auth = await requireRole(request, "admin");
  } catch (error) {
    return authErrorResponse(error);
  }

  const url = new URL(request.url);
  const requestedSize = Number(url.searchParams.get("pageSize") || 25);
  const pageSize = PAGE_SIZES.has(requestedSize) ? requestedSize : 25;
  const page = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const format = url.searchParams.get("format");
  const options: QueryOptions = {
    search: clean(url.searchParams.get("search")),
    dateFrom: clean(url.searchParams.get("dateFrom"), 10),
    dateTo: clean(url.searchParams.get("dateTo"), 10),
    user: clean(url.searchParams.get("user"), 64),
    role: clean(url.searchParams.get("role"), 20),
    category: clean(url.searchParams.get("category"), 40),
    action: clean(url.searchParams.get("action"), 80),
    result: clean(url.searchParams.get("result"), 20),
    resourceType: clean(url.searchParams.get("resourceType"), 80),
  };

  if (options.category && !AUDIT_CATEGORIES.includes(options.category as AuditCategory)) return Response.json({ error: "Invalid category" }, { status: 400 });
  if (options.result && !AUDIT_RESULTS.includes(options.result as "success" | "failed")) return Response.json({ error: "Invalid result" }, { status: 400 });
  if (options.role && !["admin", "editor", "viewer"].includes(options.role)) return Response.json({ error: "Invalid role" }, { status: 400 });

  const service = createServiceClient();
  const limit = format === "csv" ? 5000 : pageSize;
  const from = format === "csv" ? 0 : (page - 1) * pageSize;
  const to = from + limit - 1;
  const listColumns = format === "csv"
    ? "id,created_at,actor_user_id,actor_name,actor_email_masked,actor_role,action,category,resource_type,resource_id,resource_label,summary,before_data,after_data,metadata,result,request_id,source,user_agent,ip_hash"
    : "id,created_at,actor_user_id,actor_name,actor_email_masked,actor_role,action,category,resource_type,resource_id,resource_label,summary,result,request_id,source";
  let query = service
    .from("audit_logs")
    .select(listColumns, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  query = applyFilters(query, options);
  if (format === "csv") {
    const { data, error } = await query;
    if (error) return Response.json({ error: "Audit activity could not be loaded" }, { status: 500 });
    const rows = (data ?? []) as unknown as AuditLogRecord[];
    const items = rows.map((item) => ({
      ...item,
      before_data: sanitizeAuditData(item.before_data),
      after_data: sanitizeAuditData(item.after_data),
      metadata: sanitizeAuditData(item.metadata),
    })) as AuditLogRecord[];
    const header = ["Time", "Actor", "Role", "Action", "Category", "Resource", "Result", "Summary", "Request ID"];
    const csvRows = items.map((item) => [item.created_at, item.actor_name || item.actor_email_masked || "System", item.actor_role, item.action, item.category, item.resource_label || item.resource_id, item.result, item.summary, item.request_id]);
    const csv = [header, ...csvRows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    await logAuditEvent({ actor: auth.profile, action: "audit_logs_exported", category: "exports", summary: `Exported ${items.length} audit activities`, metadata: { exported_rows: items.length, filters: options }, request });
    return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="harmony-audit-log-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" } });
  }

  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);
  const [listResult, today, access, leadChanges, failed, profilesResult] = await Promise.all([
    query,
    safeExactCount(undefined, undefined, startOfToday.toISOString()),
    safeExactCount("category", "authentication"),
    safeExactCount("category", "leads"),
    safeExactCount("result", "failed"),
    service.from("profiles").select("id,full_name,email,role").eq("is_active", true).order("full_name"),
  ]);
  const { data, count, error } = listResult;
  if (error) return Response.json({ error: "Audit activity could not be loaded" }, { status: 500 });
  const rows = (data ?? []) as unknown as AuditLogRecord[];
  const items = rows.map((item) => ({
    ...item,
    before_data: null,
    after_data: null,
    metadata: null,
    user_agent: null,
    ip_hash: null,
  })) as AuditLogRecord[];
  const profiles = profilesResult.data;

  return Response.json({
    items,
    page,
    pageSize,
    total: count ?? 0,
    visibleFrom: items.length ? from + 1 : 0,
    visibleTo: from + items.length,
    hasPreviousPage: page > 1,
    hasNextPage: from + items.length < (count ?? 0),
    summary: { today, access, leadChanges, failed },
    users: (profiles ?? []).map((profile) => ({ id: profile.id, name: profile.full_name || profile.email || "Staff member", role: profile.role })),
  }, { headers: { "Cache-Control": "no-store" } });
}
