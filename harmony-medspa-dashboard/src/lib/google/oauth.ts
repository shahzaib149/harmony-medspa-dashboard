import { google } from "googleapis";

export function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_ADS_CLIENT_ID!,
    process.env.GOOGLE_ADS_CLIENT_SECRET!,
    process.env.NEXT_PUBLIC_APP_URL + "/api/auth/google/callback"
  );
}

// Scopes needed for both Google Ads + Business Profile
export const GOOGLE_SCOPES = [
  // Google Ads
  "https://www.googleapis.com/auth/adwords",
  // Google Business Profile
  "https://www.googleapis.com/auth/business.manage",
];

export function getAuthUrl() {
  const oauth2Client = createOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_SCOPES,
  });
}

export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = createOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export function createAuthenticatedClient(refreshToken: string) {
  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });
  return oauth2Client;
}
