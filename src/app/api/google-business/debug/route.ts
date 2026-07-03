export async function GET() {
  // Step 1 — get an access token using the same credentials as gbp-client
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
      grant_type:    "refresh_token",
    }),
  });
  const tokenData = await tokenRes.json() as { access_token?: string; error?: string; error_description?: string };
  if (!tokenData.access_token) {
    return Response.json({ error: `Token failed: ${tokenData.error} — ${tokenData.error_description}` }, { status: 500 });
  }
  const token = tokenData.access_token;
  const headers = { Authorization: `Bearer ${token}` };

  // Step 2 — list accounts
  const accountsRes = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", { headers });
  const accountsData = await accountsRes.json() as { accounts?: { name: string; accountName: string; type: string }[]; error?: { message: string } };

  const accounts = accountsData.accounts ?? [];

  // Step 3 — list locations for each account
  const results = await Promise.all(accounts.map(async (acc) => {
    const locRes = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${acc.name}/locations?readMask=name,title`,
      { headers }
    );
    const locData = await locRes.json() as { locations?: { name: string; title: string }[]; error?: { message: string } };
    return {
      account: { name: acc.name, accountName: acc.accountName, type: acc.type },
      locations: locData.locations ?? [],
      locError: locData.error?.message,
    };
  }));

  // Step 4 — also test the current env var path directly
  const currentAccountId  = process.env.GOOGLE_BUSINESS_ACCOUNT_ID ?? "(not set)";
  const currentLocationId = process.env.GOOGLE_BUSINESS_LOCATION_ID ?? "(not set)";
  const rawAccount  = currentAccountId.replace("accounts/", "");
  const rawLocation = currentLocationId.replace("locations/", "");
  const testPath = `accounts/${rawAccount}/locations/${rawLocation}`;

  const testRes  = await fetch(`https://mybusinessreviews.googleapis.com/v4/${testPath}/reviews?pageSize=1`, { headers });
  const testText = await testRes.text();
  let testResult: unknown;
  try { testResult = JSON.parse(testText); } catch { testResult = testText.slice(0, 300); }

  return Response.json({
    envVars: { currentAccountId, currentLocationId, testPath },
    testReviewsEndpoint: { status: testRes.status, body: testResult },
    discoveredAccountsAndLocations: results,
  }, { status: 200 });
}
