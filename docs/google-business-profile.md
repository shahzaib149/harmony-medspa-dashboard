# Google Business Profile — Restoration Guide

All code is already written and saved. This page is **hidden from the sidebar** until you
get GBP API access. To restore it, follow the steps below.

---

## What was built

A full **Google Business Profile** management page at `/google-business` with three tabs:

| Tab | What it does |
|---|---|
| **Reviews** | Lists all reviews with star ratings, date, owner reply status. AI Draft Reply button generates a reply via Claude, then you can post it directly. Shows rating breakdown histogram + response rate. |
| **Local Insights** | Search visibility (direct searches, discovery searches, Maps views, Search views) and customer actions (phone calls, direction requests, website clicks) — all from the GBP Performance API. |
| **GBP Posts** | AI-generate a Google Business post (Standard / Offer / Event) by entering a topic, edit the draft, then publish directly to your GBP listing. |

KPI cards at the top: Avg Rating, Total Views, Searches, Phone Calls.

---

## Files (all preserved, nothing deleted)

```
src/
  app/
    google-business/
      page.tsx                          ← Page wrapper using DashboardLayout
      GoogleBusinessClient.tsx          ← Full UI client component (all 3 tabs)
    api/
      google-business/
        reviews/route.ts                ← GET reviews, POST reply
        insights/route.ts               ← GET performance insights
        posts/route.ts                  ← GET AI draft, POST publish
        draft-reply/route.ts            ← POST AI draft reply via Claude
        auth/route.ts                   ← OAuth flow helper
        debug/route.ts                  ← Debug endpoint to find correct account/location IDs
  lib/
    google/
      gbp-client.ts                     ← Main GBP API client (reviews + insights + posts)
      business-client.ts                ← Secondary client using googleapis npm package
```

---

## APIs used (all updated to current endpoints)

| Feature | API endpoint |
|---|---|
| Reviews (fetch) | `GET https://mybusinessreviews.googleapis.com/v4/{name}/reviews` |
| Reviews (reply) | `PUT https://mybusinessreviews.googleapis.com/v4/{name}/reviews/{id}/reply` |
| Insights | `GET https://businessprofileperformance.googleapis.com/v1/locations/{id}:fetchMultiDailyMetricsTimeSeries` |
| Posts | `POST https://mybusiness.googleapis.com/v4/{name}/localPosts` |

> The old `mybusiness.googleapis.com/v4` endpoints for reviews and insights were **shut down by Google**.
> The code already uses the new endpoints above.

---

## Environment variables required

Add these to `.env.local` and also to Vercel environment variables:

```env
# Google OAuth credentials (same app as Google Ads)
GOOGLE_ADS_CLIENT_ID=your_client_id
GOOGLE_ADS_CLIENT_SECRET=your_client_secret

# GBP needs its own refresh token scoped to business.manage
# Use the /api/google-business/auth route to generate one (see Auth section below)
GOOGLE_BUSINESS_REFRESH_TOKEN=your_gbp_refresh_token

# GBP account and location IDs
# Run /api/google-business/debug after auth to find the correct values
GOOGLE_BUSINESS_ACCOUNT_ID=accounts/XXXXXXXXXXXXXXXXXX
GOOGLE_BUSINESS_LOCATION_ID=locations/XXXXXXXXXXXXXXXXXX
```

> **Important:** `GOOGLE_BUSINESS_ACCOUNT_ID` and `GOOGLE_BUSINESS_LOCATION_ID` must have
> **different** ID numbers. If they show the same number, the IDs are misconfigured.
> Use the debug endpoint to find the correct values.

---

## Google Cloud Console — APIs to enable

Go to [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Enable:

- **My Business Account Management API**
- **My Business Business Information API**
- **My Business Reviews API** (`mybusinessreviews.googleapis.com`)
- **Business Profile Performance API** (`businessprofileperformance.googleapis.com`)
- **My Business Notifications API** (optional)

OAuth scopes needed:
```
https://www.googleapis.com/auth/business.manage
```

---

## Auth setup (getting the refresh token)

The GBP API requires its **own OAuth refresh token** scoped to `business.manage`.
The Google Ads refresh token will NOT work for GBP.

1. Make sure the OAuth app in Google Cloud Console has `business.manage` scope added
2. Visit `/api/google-business/auth` in the browser — it redirects to Google consent
3. After approval it returns a `refresh_token`
4. Copy that token into `.env.local` as `GOOGLE_BUSINESS_REFRESH_TOKEN`

---

## Finding the correct Account ID and Location ID

After setting up auth, visit:

```
http://localhost:3000/api/google-business/debug
```

This returns JSON like:
```json
{
  "discoveredAccountsAndLocations": [
    {
      "account": { "name": "accounts/123456789", "accountName": "Harmony MedSpa" },
      "locations": [
        { "name": "accounts/123456789/locations/987654321", "title": "Harmony MedSpa" }
      ]
    }
  ]
}
```

Set in `.env.local`:
```env
GOOGLE_BUSINESS_ACCOUNT_ID=accounts/123456789
GOOGLE_BUSINESS_LOCATION_ID=locations/987654321
```

> The two numbers (account vs location) will be **different**.

---

## Steps to restore the nav link

Open `src/components/layout/Sidebar.tsx` and restore the commented-out nav item:

```tsx
import { LayoutDashboard, TrendingUp, MapPin, X } from "lucide-react";

const navItems = [
  { href: "/dashboard",             label: "Overview",        icon: LayoutDashboard },
  { href: "/google-ads-analytics",  label: "Google Ads",      icon: TrendingUp },
  { href: "/google-business",       label: "Google Business", icon: MapPin },   // ← add this back
];
```

That's all — the page, API routes, and client are already there and will work immediately
once the env vars are set and the APIs are enabled.

---

## Known issue (was being fixed when hidden)

The `GOOGLE_BUSINESS_LOCATION_ID` env var was set to the same number as `GOOGLE_BUSINESS_ACCOUNT_ID`,
causing a 404 from the Reviews API. The debug endpoint at `/api/google-business/debug` was
built specifically to diagnose this — run it first after restoring auth.
