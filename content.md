# Harmony MedSpa Dashboard - Project Overview

## What This Project Is

Harmony MedSpa Dashboard is a private growth and operations dashboard for Harmony MedSpa. It brings together lead management, Google Ads performance, Airtable-backed marketing data, AI ad support, pending ad approvals, and integration health checks into one internal web app.

The goal of the project is to help the clinic and marketing team understand what is happening across their growth systems without jumping between Airtable, Google Ads, Google Business Profile, Make.com, Supabase, and separate lead forms.

In simple terms, this app is a command center for:

- Tracking medspa leads.
- Reviewing Google Ads performance.
- Managing incoming lead form submissions.
- Checking whether external integrations are connected.
- Reviewing AI-generated ad ideas.
- Approving pending ads created by automation.
- Supporting future automations such as nurture, rebooking, referrals, and patient reactivation.

## Business Purpose

The dashboard is built for a medspa business that depends on fast lead response, paid ads, local reputation, and automated follow-up.

The main business problems it is designed to solve are:

- Staff need to see new leads quickly.
- Marketing needs to know which Google Ads campaigns, ad groups, creatives, and keywords are performing.
- The business needs visibility into whether lead automation is working.
- The clinic needs a simple settings area to confirm API keys and integrations are healthy.
- Generated ads and AI suggestions need a place to be reviewed before being used.
- Future growth workflows need a foundation, including no-book nurture, dormant patient reactivation, rebooking reminders, and referral tracking.

## Tech Stack

The project is a Next.js application using the App Router.

Core technologies:

- Next.js `16.2.9`
- React `19.2.4`
- TypeScript
- Tailwind CSS `4`
- Recharts for charts
- Lucide React for icons
- Airtable API for live marketing and lead data
- Google APIs for Google Ads and Google Business Profile
- Anthropic API for AI-generated content
- Supabase for planned database-backed workflows
- Make.com webhook for public lead form submissions

Main package scripts:

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Current Application Pages

### `/`

The root page redirects users into the dashboard experience.

### `/dashboard`

The Overview dashboard gives a high-level snapshot of business and automation performance.

It includes:

- Monthly visits.
- New patients.
- Total leads.
- Average speed-to-lead.
- Booked lead conversion rate.
- Lead source breakdown chart.
- Visits vs new patients chart.
- Active automation status.
- AI insight preview.

Some overview data currently uses mock data from `src/lib/mock-data.ts`.

### `/google-ads-analytics`

This is the main Google Ads analytics area. It reads Airtable-backed Google Ads reporting data through `/api/airtable`.

It includes tabs for:

- Campaigns.
- Ad Groups.
- Creatives.
- Keywords.
- AI Suggestions.
- Pending Review.

The page supports date windows such as 7, 14, 30, and 90 days. It calculates campaign-level summary metrics including spend, clicks, conversions, ROAS, and latest sync dates.

The Airtable tables used by this area include:

- `Google Ads Campaign Analytics`
- `Google Ads Ad Group Analytics`
- `Google Ads Ad Creative Analytics`
- `Google Ads Keyword Performance`
- `Google Ad Preview`

### `/google-ads-analytics/creative-detail`

This page shows detail for an individual creative/ad. It pulls creative performance and ad copy data from Airtable so users can inspect headlines, descriptions, URLs, and related ad details.

### `/leads`

The Leads page is a live Airtable-backed lead management interface.

It shows:

- Lead list.
- Status filtering.
- Date filtering.
- Sent/not-sent filtering.
- Search.
- Lead stats.
- Last received lead indicator.
- Lead detail slide-over.
- Duplicate detection.
- Email and SMS status.
- Status update actions.

Lead statuses include:

- New
- Contacted
- Booked
- Duplicate
- Failed
- Not Interested

Lead data comes from the Airtable `Leads` table through `/api/airtable/leads`.

### `/lead`

This is the public lead capture form. It is designed for ad traffic or website traffic.

It collects:

- Name.
- Phone.
- Email.
- Treatment interest.
- Message.
- UTM source.
- UTM campaign.
- UTM medium.
- Page URL.

On submit, it posts the lead payload to `NEXT_PUBLIC_MAKE_WEBHOOK_URL` if configured. After successful submission, the user is redirected to the PatientNow booking URL.

It includes validation for email and US phone numbers, plus a honeypot field to silently discard bot submissions.

### `/settings`

The Settings page is an internal admin page for operational configuration and integration health.

It includes:

- System health summary.
- Integration status cards.
- App URL display.
- Security status.
- Clinic profile fields.
- Staff/account access list.
- Staff invite UI.
- Automation toggles.

Settings for staff, clinic profile, and automations are stored in browser `localStorage` for now. Integration health is checked server-side through `/api/settings/status`.

### `/google-business`

The Google Business Profile page exists in the codebase, but it is currently hidden from the sidebar until Google Business Profile API access is fully ready.

It supports:

- Review listing.
- Average rating display.
- Review reply drafting.
- Posting review replies.
- Local insights.
- GBP post draft generation.
- GBP post publishing.

More details are documented in `docs/google-business-profile.md`.

## Main API Routes

### Airtable Routes

`/api/airtable`

Fetches Google Ads analytics records from Airtable. It supports table query values such as:

- `campaigns`
- `ad-groups`
- `creatives`
- `keywords`
- `ad-preview`

The route maps Airtable fields into frontend-friendly objects and calculates grouped summaries where needed.

`/api/airtable/leads`

Fetches and updates live leads from the Airtable `Leads` table.

Supported methods:

- `GET` fetches leads.
- `PATCH` updates a lead status.

This route uses `AIRTABLE_LEADS_BASE_ID`, falling back to the known Leads base if the env var is missing.

`/api/airtable/pending-ads`

Fetches pending ads from Airtable for review. It filters records where `status` is `Pending Review`.

### Settings Route

`/api/settings/status`

Checks whether key integrations are configured and reachable.

It checks:

- Airtable.
- Google Ads.
- Google Business Profile.
- Anthropic AI.
- Supabase.
- Lead form webhook.

This endpoint does not expose secret values. It only reports which required variables are configured, missing, connected, or failing.

### Google Ads Routes

The project contains API routes for Google Ads authentication, campaigns, keywords, campaign status, ad creation, debugging, and sync.

Important routes include:

- `/api/auth/google`
- `/api/auth/google/callback`
- `/api/google-ads/campaigns`
- `/api/google-ads/keywords`
- `/api/google-ads/campaign-status`
- `/api/google-ads/create-ad`
- `/api/google-ads/sync`
- `/api/google-ads/debug`

These routes use Google Ads credentials and refresh tokens from environment variables.

### Google Business Profile Routes

The project contains routes for Google Business Profile auth, reviews, insights, posts, reply drafting, and debugging.

Important routes include:

- `/api/google-business/auth`
- `/api/google-business/auth/callback`
- `/api/google-business/reviews`
- `/api/google-business/insights`
- `/api/google-business/posts`
- `/api/google-business/draft-reply`
- `/api/google-business/debug`

Some Google Business Profile features depend on API access and the correct account/location IDs.

### AI Routes

The project uses the Anthropic API for AI-powered content support.

Important routes include:

- `/api/ai-suggestions`
- `/api/ai-quick-ads`
- `/api/draft-ad`
- `/api/google-business/draft-reply`
- `/api/google-business/posts`

These routes require `ANTHROPIC_API_KEY`.

## Important Data Sources

### Airtable

Airtable is currently the most important live data source in the app.

It stores:

- Leads.
- Google Ads campaign analytics.
- Google Ads ad group analytics.
- Google Ads creative analytics.
- Google Ads keyword performance.
- Pending ad review records.
- Ad preview/copy records.

There are separate Airtable bases in use:

- `AIRTABLE_LEADS_BASE_ID` is used for the Leads table.
- `AIRTABLE_BASE_ID` is used for Google Ads analytics and pending ads.

This separation matters because a single Airtable API key may have access to one base but not another. A `403` from Airtable usually means the key does not have access to the base/table being requested, not necessarily that the key format is wrong.

### Make.com

The public lead form submits to a Make.com webhook if `NEXT_PUBLIC_MAKE_WEBHOOK_URL` is configured.

Make.com is expected to receive the lead payload and handle downstream automation such as:

- Creating/updating Airtable records.
- Sending staff alerts.
- Triggering SMS or email flows.
- Updating delivery status fields.

### Google Ads

Google Ads is used for live campaign-related functionality and/or syncing ad performance into Airtable.

The dashboard currently displays performance primarily through Airtable-backed reporting tables.

### Google Business Profile

Google Business Profile is planned or partially implemented for:

- Reviews.
- Local insights.
- Review replies.
- GBP posts.

The sidebar hides this section until GBP API access is ready.

### Supabase

Supabase is scaffolded for future or expanded workflows. The migration file includes tables for:

- Leads.
- Lead touches.
- Google Ads snapshots.
- Dormant patients.
- Nurture enrollments.
- Rebooking reminders.
- Referrals.
- AI insights.
- Settings.

At the moment, several active workflows use Airtable instead of Supabase.

## Environment Variables

The app expects these environment variables depending on which features are enabled.

### Airtable

```bash
AIRTABLE_API_KEY=
AIRTABLE_LEADS_BASE_ID=
AIRTABLE_BASE_ID=
```

### Google Ads

```bash
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_REFRESH_TOKEN=
GOOGLE_ADS_CUSTOMER_ID=
GOOGLE_ADS_MCC_ID=
GOOGLE_ADS_API_VERSION=
```

### Google Business Profile

```bash
GOOGLE_BUSINESS_ACCOUNT_ID=
GOOGLE_BUSINESS_LOCATION_ID=
GOOGLE_BUSINESS_REFRESH_TOKEN=
```

If `GOOGLE_BUSINESS_REFRESH_TOKEN` is not configured, some code can use `GOOGLE_ADS_REFRESH_TOKEN` as a fallback.

### Anthropic AI

```bash
ANTHROPIC_API_KEY=
```

### Supabase

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Public App and Lead Form

```bash
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_MAKE_WEBHOOK_URL=
NEXT_PUBLIC_PATIENTNOW_BOOKING_URL=
```

## Local Development

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Open:

```bash
http://localhost:3000
```

Run lint:

```bash
npm run lint
```

Build for production:

```bash
npm run build
```

Start production build:

```bash
npm run start
```

## Project Structure

Important folders:

```text
src/app
```

Contains App Router pages and API routes.

```text
src/components
```

Contains shared UI and layout components.

```text
src/lib
```

Contains integration clients, shared types, mock data, and helper code.

```text
docs
```

Contains supporting integration notes.

```text
supabase/migrations
```

Contains SQL schema for planned Supabase-backed data.

```text
public
```

Contains static assets such as Harmony logo files.

## Main Layout and Navigation

The app uses a dashboard layout with a dark luxury visual style.

The sidebar currently links to:

- Overview
- Google Ads
- Leads
- Settings

Google Business Profile is present in code but hidden from navigation until API access is granted.

The visual direction uses:

- Dark background.
- Gold accents.
- Teal highlights.
- Compact operational dashboard panels.
- Lucide icons.
- Recharts for analytics visuals.

## How Lead Flow Works

1. A visitor opens `/lead`.
2. The form captures contact information, treatment interest, and UTM values.
3. The form posts to the Make.com webhook.
4. Make.com handles automation and writes/updates Airtable.
5. The internal `/leads` page reads live records from Airtable.
6. Staff can view, filter, and update lead statuses.
7. Email/SMS status fields show whether follow-up automation has run.

## How Google Ads Reporting Works

1. Google Ads performance data is synced into Airtable.
2. `/api/airtable` reads the relevant Airtable reporting tables.
3. The API route normalizes fields and aggregates campaign/ad group/keyword data.
4. `/google-ads-analytics` displays the results in tabs.
5. AI Suggestions and Pending Review sit inside the same Google Ads workflow.

## How Settings Health Checks Work

The Settings page calls `/api/settings/status`.

The endpoint checks if required environment variables are present and, where possible, makes lightweight API calls to verify access.

For Airtable, it checks the Leads table using `AIRTABLE_LEADS_BASE_ID`.

For Supabase, it checks whether the Supabase REST endpoint can be reached with the configured anon key.

For Google Ads and Google Business Profile, it checks whether the required OAuth and account/location values are configured.

## Current Known Notes

- Airtable is the active source for leads and Google Ads analytics.
- Supabase schema exists, but not every active page currently reads from Supabase.
- Settings profile/staff/automation values are currently stored in browser localStorage.
- Google Business Profile code exists, but the nav item is hidden until API access is ready.
- Some dashboard overview data still comes from mock data.
- The project is using Next.js `16.2.9`; follow the local Next docs under `node_modules/next/dist/docs/` before changing Next-specific conventions.
- Do not commit `.env.local` or real API secrets.

## Future Feature Areas

`FUTURE_PAGES.md` describes additional pages and workflows that can be restored or expanded later.

Planned or partially scaffolded areas include:

- Dormant patient reactivation.
- No-book nurture sequence.
- Rebooking engine.
- Referral engine.
- More Supabase-backed operational data.
- Expanded AI insights.

## Who This Project Is For

Primary users:

- Clinic owner.
- Front desk team.
- Marketing manager.
- Agency/operator managing ads and automation.

The app is meant to be practical and operational. It should help the team answer questions like:

- How many leads came in recently?
- Which leads still need follow-up?
- Are SMS and email automations running?
- Which ads are spending and converting?
- Which creatives or keywords need attention?
- Are our API integrations healthy?
- What generated ads need approval?

## Summary

Harmony MedSpa Dashboard is an internal growth operations system. It connects marketing data, lead workflows, automation status, and AI-assisted ad operations into one Next.js dashboard. Its current strongest live integrations are Airtable, Make.com, Google Ads, and Anthropic AI, with Supabase and Google Business Profile prepared for deeper future use.

