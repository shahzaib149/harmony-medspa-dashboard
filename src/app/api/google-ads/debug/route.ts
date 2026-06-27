export async function GET() {
  const results: Record<string, unknown> = {};

  // Step 1: Check env vars are present (values redacted)
  results.env = {
    GOOGLE_ADS_CLIENT_ID: process.env.GOOGLE_ADS_CLIENT_ID ? `${process.env.GOOGLE_ADS_CLIENT_ID.slice(0, 20)}...` : "MISSING",
    GOOGLE_ADS_CLIENT_SECRET: process.env.GOOGLE_ADS_CLIENT_SECRET ? "present" : "MISSING",
    GOOGLE_ADS_REFRESH_TOKEN: process.env.GOOGLE_ADS_REFRESH_TOKEN ? `${process.env.GOOGLE_ADS_REFRESH_TOKEN.slice(0, 20)}...` : "MISSING",
    GOOGLE_ADS_DEVELOPER_TOKEN: process.env.GOOGLE_ADS_DEVELOPER_TOKEN ? `${process.env.GOOGLE_ADS_DEVELOPER_TOKEN.slice(0, 10)}...` : "MISSING",
    GOOGLE_ADS_CUSTOMER_ID: process.env.GOOGLE_ADS_CUSTOMER_ID ?? "MISSING",
  };

  // Step 2: Exchange refresh token for access token
  let accessToken: string | null = null;
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
        client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
        refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
        grant_type: "refresh_token",
      }),
    });
    const tokenData = await tokenRes.json() as { access_token?: string; error?: string; error_description?: string };
    if (tokenData.access_token) {
      accessToken = tokenData.access_token;
      results.tokenExchange = { success: true, tokenLength: accessToken.length, tokenPrefix: accessToken.slice(0, 10) + "..." };
    } else {
      results.tokenExchange = { success: false, error: tokenData.error, description: tokenData.error_description };
    }
  } catch (e) {
    results.tokenExchange = { success: false, exception: String(e) };
  }

  if (!accessToken) {
    return Response.json({ ...results, stopped: "Token exchange failed — no point testing API" });
  }

  // Step 3: Probe which API version is currently live
  const versions = ["v19", "v20", "v21", "v22", "v23"];
  const versionResults: Record<string, unknown> = {};

  for (const ver of versions) {
    try {
      const r = await fetch(`https://googleads.googleapis.com/${ver}/customers:listAccessibleCustomers`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
        },
      });
      const text = await r.text();
      let parsed: unknown;
      try { parsed = JSON.parse(text); } catch { parsed = text.slice(0, 150); }
      versionResults[ver] = { status: r.status, isJson: r.status !== 404 || text.trim().startsWith("{"), data: parsed };
    } catch (e) {
      versionResults[ver] = { exception: String(e) };
    }
  }
  results.versionProbe = versionResults;

  // Step 4: Get accessible customer IDs and probe each one
  const v21Data = versionResults["v21"] as { status: number; data: { resourceNames?: string[] } };
  const accessibleCustomers: string[] = (v21Data?.data?.resourceNames ?? []).map(
    (rn: string) => rn.replace("customers/", "")
  );

  const searchResults: Record<string, unknown> = {};
  for (const cid of accessibleCustomers) {
    // Try without login-customer-id first
    const r1 = await fetch(`https://googleads.googleapis.com/v21/customers/${cid}/googleAds:search`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: "SELECT customer.id, customer.descriptive_name, customer.manager FROM customer LIMIT 1" }),
    });
    const t1 = await r1.text();
    let d1: unknown; try { d1 = JSON.parse(t1); } catch { d1 = t1.slice(0, 300); }

    // Try with login-customer-id = itself
    const r2 = await fetch(`https://googleads.googleapis.com/v21/customers/${cid}/googleAds:search`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
        "Content-Type": "application/json",
        "login-customer-id": cid,
      },
      body: JSON.stringify({ query: "SELECT customer.id, customer.descriptive_name, customer.manager FROM customer LIMIT 1" }),
    });
    const t2 = await r2.text();
    let d2: unknown; try { d2 = JSON.parse(t2); } catch { d2 = t2.slice(0, 300); }

    searchResults[cid] = {
      withoutLoginId: { status: r1.status, data: d1 },
      withLoginId: { status: r2.status, data: d2 },
    };
  }
  results.customerProbe = searchResults;

  return Response.json(results, { status: 200 });
}
