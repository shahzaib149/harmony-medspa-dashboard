import { authErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { logAuditEvent } from "@/lib/audit/log-audit-event";

const BASE_ID  = process.env.AIRTABLE_BASE_ID ?? "appGumYdPTtL5GW6M";
const TABLE_ID = "tbl8XpPEGCr720IUi";
const API_KEY  = process.env.AIRTABLE_API_KEY!;

export interface PendingAd {
  id: string;
  ad_resource_name: string;
  business_name: string;
  campaign_name: string;
  ad_group_name: string;
  headline1: string;
  headline2: string;
  headline3: string;
  description1: string;
  description2: string;
  path1: string;
  path2: string;
  final_url: string;
  status: string;
  created_at: string;
}

function str(fields: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = fields[k];
    if (v !== undefined && v !== null && v !== "") return String(v);
  }
  return "";
}

export async function GET() {
  if (!API_KEY) {
    return Response.json({ error: "AIRTABLE_API_KEY not configured" }, { status: 500 });
  }

  const params = new URLSearchParams({
    filterByFormula: `{status}="Pending Review"`,
    "sort[0][field]":     "created_at",
    "sort[0][direction]": "desc",
    pageSize: "50",
  });

  const res = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?${params}`,
    {
      headers: { Authorization: `Bearer ${API_KEY}` },
      next: { revalidate: 30 },
    }
  );

  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    let detail = "";
    try {
      const parsed = JSON.parse(raw) as { error?: { message?: string; type?: string } };
      detail = parsed?.error?.message ?? parsed?.error?.type ?? raw.slice(0, 200);
    } catch { detail = raw.slice(0, 200); }
    return Response.json({ error: `Airtable ${res.status}: ${detail}` }, { status: 500 });
  }

  const data = await res.json() as {
    records: Array<{ id: string; createdTime: string; fields: Record<string, unknown> }>;
  };

  const ads: PendingAd[] = data.records.map(r => ({
    id:               r.id,
    ad_resource_name: str(r.fields, "ad_resource_name"),
    business_name:    str(r.fields, "business_name"),
    campaign_name:    str(r.fields, "campaign_name"),
    ad_group_name:    str(r.fields, "ad_group_name"),
    headline1:        str(r.fields, "headline1"),
    headline2:        str(r.fields, "headline2"),
    headline3:        str(r.fields, "headline3"),
    description1:     str(r.fields, "description1"),
    description2:     str(r.fields, "description2"),
    path1:            str(r.fields, "path1"),
    path2:            str(r.fields, "path2"),
    final_url:        str(r.fields, "final_url"),
    status:           str(r.fields, "status"),
    created_at:       str(r.fields, "created_at") || r.createdTime.slice(0, 10),
  }));

  return Response.json({ ads, count: ads.length });
}

export async function PATCH(request: Request) {
  let actor;
  try {
    ({ profile: actor } = await requireRole(request, "editor"));
  } catch (error) {
    return authErrorResponse(error);
  }

  if (!API_KEY) {
    return Response.json({ error: "AIRTABLE_API_KEY not configured" }, { status: 500 });
  }

  const { id, status } = await request.json() as { id?: string; status?: "Approved" | "Rejected" | "Published" };
  if (!id || !status) return Response.json({ error: "id and status required" }, { status: 400 });
  await logAuditEvent({ actor, action: "google_ads_change_requested", category: "google_ads", resource: { type: "pending_ad", id }, summary: `Requested pending ad status change to ${status}`, after: { status }, request });

  const res = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}/${id}`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields: { status } }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    await logAuditEvent({ actor, action: "action_failed", category: "google_ads", resource: { type: "pending_ad", id }, summary: "Pending ad status change failed", metadata: { operation: "google_ads_change_completed", proposed_status: status }, result: "failed", request });
    return Response.json({ error: err?.error?.message ?? `Airtable ${res.status}` }, { status: 500 });
  }

  await logAuditEvent({ actor, action: "google_ads_change_completed", category: "google_ads", resource: { type: "pending_ad", id }, summary: `Changed pending ad status to ${status}`, after: { status }, request });
  return Response.json({ success: true });
}
