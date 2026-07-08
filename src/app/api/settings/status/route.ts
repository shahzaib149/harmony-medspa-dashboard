type Status = "connected" | "partial" | "missing" | "error";

type IntegrationStatus = {
  id: string;
  name: string;
  status: Status;
  detail: string;
  required: string[];
  configured: string[];
  missing: string[];
  checkedAt: string;
  actionHref?: string;
};

const has = (key: string) => Boolean(process.env[key]);

function baseStatus(
  id: string,
  name: string,
  required: string[],
  detailWhenReady: string,
  actionHref?: string
): IntegrationStatus {
  const configured = required.filter(has);
  const missing = required.filter((key) => !has(key));
  return {
    id,
    name,
    status: missing.length === 0 ? "connected" : configured.length > 0 ? "partial" : "missing",
    detail: missing.length === 0 ? detailWhenReady : `${missing.length} required value${missing.length === 1 ? "" : "s"} missing`,
    required,
    configured,
    missing,
    checkedAt: new Date().toISOString(),
    actionHref,
  };
}

function googleBusinessStatus(): IntegrationStatus {
  const required = [
    "GOOGLE_ADS_CLIENT_ID",
    "GOOGLE_ADS_CLIENT_SECRET",
    "GOOGLE_BUSINESS_ACCOUNT_ID",
    "GOOGLE_BUSINESS_LOCATION_ID",
  ];
  const refreshConfigured = has("GOOGLE_BUSINESS_REFRESH_TOKEN") || has("GOOGLE_ADS_REFRESH_TOKEN");
  const configured = [
    ...required.filter(has),
    ...(refreshConfigured ? ["GOOGLE_BUSINESS_REFRESH_TOKEN or GOOGLE_ADS_REFRESH_TOKEN"] : []),
  ];
  const missing = [
    ...required.filter((key) => !has(key)),
    ...(!refreshConfigured ? ["GOOGLE_BUSINESS_REFRESH_TOKEN or GOOGLE_ADS_REFRESH_TOKEN"] : []),
  ];

  return {
    id: "google-business",
    name: "Google Business Profile",
    status: missing.length === 0 ? "connected" : configured.length > 0 ? "partial" : "missing",
    detail: missing.length === 0 ? "Business account and location configured" : `${missing.length} required value${missing.length === 1 ? "" : "s"} missing`,
    required: [...required, "GOOGLE_BUSINESS_REFRESH_TOKEN or GOOGLE_ADS_REFRESH_TOKEN"],
    configured,
    missing,
    checkedAt: new Date().toISOString(),
    actionHref: "/api/google-business/auth",
  };
}

async function checkAirtable(item: IntegrationStatus): Promise<IntegrationStatus> {
  if (item.status === "missing") return item;
  const baseId = process.env.AIRTABLE_BASE_ID ?? "appNL010pW9LUpgST";
  const apiKey = process.env.AIRTABLE_API_KEY;
  if (!apiKey) return item;

  try {
    const params = new URLSearchParams({ pageSize: "1" });
    const res = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent("Leads")}?${params}`,
      { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
    );
    if (!res.ok) {
      return { ...item, status: "error", detail: `Airtable responded with ${res.status}` };
    }
    return { ...item, status: "connected", detail: "Leads table reachable" };
  } catch (error) {
    return { ...item, status: "error", detail: String(error) };
  }
}

async function checkSupabase(item: IntegrationStatus): Promise<IntegrationStatus> {
  if (item.status === "missing") return item;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return item;

  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/`, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
      cache: "no-store",
    });
    if (!res.ok && res.status !== 404) {
      return { ...item, status: "error", detail: `Supabase REST responded with ${res.status}` };
    }
    return { ...item, status: "connected", detail: "Project URL and anon key accepted" };
  } catch (error) {
    return { ...item, status: "error", detail: String(error) };
  }
}

export async function GET() {
  const items = await Promise.all([
    checkAirtable(baseStatus(
      "airtable",
      "Airtable",
      ["AIRTABLE_API_KEY"],
      "API key configured"
    )),
    Promise.resolve(baseStatus(
      "google-ads",
      "Google Ads",
      [
        "GOOGLE_ADS_CLIENT_ID",
        "GOOGLE_ADS_CLIENT_SECRET",
        "GOOGLE_ADS_DEVELOPER_TOKEN",
        "GOOGLE_ADS_REFRESH_TOKEN",
        "GOOGLE_ADS_CUSTOMER_ID",
      ],
      "OAuth credentials and customer ID configured",
      "/api/auth/google"
    )),
    Promise.resolve(googleBusinessStatus()),
    Promise.resolve(baseStatus(
      "anthropic",
      "Anthropic AI",
      ["ANTHROPIC_API_KEY"],
      "AI generation key configured"
    )),
    checkSupabase(baseStatus(
      "supabase",
      "Supabase",
      ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
      "Database credentials configured"
    )),
    Promise.resolve(baseStatus(
      "lead-form",
      "Lead Form Webhook",
      ["NEXT_PUBLIC_MAKE_WEBHOOK_URL", "NEXT_PUBLIC_PATIENTNOW_BOOKING_URL"],
      "Lead capture and booking URLs configured",
      "/lead"
    )),
  ]);

  const connected = items.filter((item) => item.status === "connected").length;
  const errors = items.filter((item) => item.status === "error").length;

  return Response.json({
    checkedAt: new Date().toISOString(),
    connected,
    total: items.length,
    errors,
    environment: process.env.NODE_ENV ?? "development",
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    integrations: items,
  });
}
