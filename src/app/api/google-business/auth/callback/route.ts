// Step 2 — Google redirects here with ?code=... , exchange it for tokens
import { requireRole } from "@/lib/auth/requireRole";

export async function GET(request: Request) {
  try {
    await requireRole(request, "admin");
  } catch {
    return Response.redirect(new URL("/login?next=/api/google-business/auth/callback", request.url), 302);
  }
  const { searchParams } = new URL(request.url);
  const code  = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return new Response(`<h2>Auth denied: ${error}</h2>`, { headers: { "Content-Type": "text/html" } });
  }
  if (!code) {
    return new Response("<h2>No code returned</h2>", { headers: { "Content-Type": "text/html" } });
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      redirect_uri:  "http://localhost:3000/api/google-business/auth/callback",
      grant_type:    "authorization_code",
    }),
  });
  const tokens = await tokenRes.json() as {
    access_token?: string; refresh_token?: string; scope?: string; error?: string; error_description?: string;
  };

  if (!tokens.access_token) {
    return new Response(
      `<h2>Token exchange failed</h2><pre>${JSON.stringify(tokens, null, 2)}</pre>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  // Use the access token to list accounts + locations
  const headers = { Authorization: `Bearer ${tokens.access_token}` };

  const accountsRes  = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", { headers });
  const accountsData = await accountsRes.json() as { accounts?: { name: string; accountName: string }[]; error?: { message: string } };
  const accounts     = accountsData.accounts ?? [];

  const locationRows = await Promise.all(accounts.map(async (acc) => {
    const locRes  = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${acc.name}/locations?readMask=name,title`,
      { headers }
    );
    const locData = await locRes.json() as { locations?: { name: string; title: string }[] };
    return { account: acc, locations: locData.locations ?? [] };
  }));

  // Build a readable HTML page
  const rows = locationRows.map(({ account, locations }) => {
    const locHtml = locations.length === 0
      ? "<li>(no locations found for this account)</li>"
      : locations.map(l => `
          <li>
            <b>${l.title}</b><br/>
            Location resource: <code>${l.name}</code><br/>
            <small>→ GOOGLE_BUSINESS_LOCATION_ID=<b>${l.name.split("/").slice(-1)[0]}</b></small>
          </li>`).join("");

    return `
      <div style="margin:16px 0;padding:12px;border:1px solid #ccc;border-radius:6px">
        <b>Account:</b> ${account.accountName}<br/>
        <b>Account resource:</b> <code>${account.name}</code><br/>
        <small>→ GOOGLE_BUSINESS_ACCOUNT_ID=<b>${account.name.split("/").slice(-1)[0]}</b></small>
        <ul style="margin-top:8px">${locHtml}</ul>
      </div>`;
  }).join("");

  const refreshSection = tokens.refresh_token
    ? `<div style="background:#d4edda;padding:12px;border-radius:6px;margin-bottom:16px">
        ✅ <b>New GBP Refresh Token:</b><br/>
        <code style="word-break:break-all">${tokens.refresh_token}</code><br/><br/>
        Add this to <b>.env.local</b> as:<br/>
        <code>GOOGLE_BUSINESS_REFRESH_TOKEN=${tokens.refresh_token}</code>
       </div>`
    : `<div style="background:#fff3cd;padding:12px;border-radius:6px;margin-bottom:16px">
        ⚠️ No refresh_token returned — the account may have been previously authorized.
        Revoke access at <a href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a>
        and try again.
       </div>`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>GBP Auth Result</title>
<style>body{font-family:sans-serif;padding:24px;max-width:800px;margin:0 auto}code{background:#f5f5f5;padding:2px 4px;border-radius:3px;font-size:13px}</style>
</head><body>
<h2>✅ Google Business Profile — Authorization Successful</h2>
${refreshSection}
<h3>Your Accounts & Locations</h3>
${rows || "<p>No accounts found.</p>"}
<hr/>
<h3>Next steps — update .env.local</h3>
<pre style="background:#f5f5f5;padding:12px;border-radius:6px">
GOOGLE_BUSINESS_REFRESH_TOKEN=&lt;refresh token above&gt;
GOOGLE_BUSINESS_ACCOUNT_ID=&lt;account number from above&gt;
GOOGLE_BUSINESS_LOCATION_ID=&lt;location number from above&gt;
</pre>
<p>Then restart the dev server.</p>
</body></html>`;

  return new Response(html, { headers: { "Content-Type": "text/html" } });
}
