# Harmony MedSpa Dashboard - Project Overview

Last updated: July 16, 2026

## What This Project Is

Harmony MedSpa Dashboard is a private growth and operations dashboard for Harmony MedSpa. It combines lead management, campaign enrollment, email and SMS activity, Google Ads reporting, clinic metrics, AI-assisted ad workflows, staff access, audit history, and integration health in one responsive application.

The dashboard is intended to answer practical operational questions:

- How many leads arrived, replied, and booked?
- Which leads still need action?
- Which campaigns are active and where are their leads in the journey?
- Are automated email and SMS messages being delivered?
- Which lead sources and ads are performing?
- Are clinic visits and new-patient totals improving?
- Who changed data or account access, and when?
- Are Airtable, Supabase, Google, Anthropic, and the lead webhook configured correctly?

## Current Architecture

The application uses different systems for different responsibilities.

### Airtable

Airtable is the primary live operational and reporting data source. It currently stores and serves:

- Leads.
- Message Log records.
- Nurture Enrollments.
- Clinic Metrics.
- Google Ads campaign, ad-group, creative, and keyword reporting.
- Pending ad-review and ad-preview records.

`AIRTABLE_LEADS_BASE_ID` is used for lead operations, message history, nurture enrollment, campaigns, and clinic metrics. `AIRTABLE_BASE_ID` is used for Google Ads reporting and pending ads.

### Supabase

Supabase is now an active part of the application rather than only future scaffolding. It provides:

- Email/password authentication.
- Staff profiles and the `admin`, `editor`, and `viewer` roles.
- Server-side role enforcement.
- The `public.audit_logs` activity table.
- Server-only campaign-enrollment idempotency claims.

The broader schema in `supabase/migrations/001_initial_schema.sql` still contains planned database-backed workflows, but active leads, messages, nurture activity, clinic metrics, and Google Ads reporting continue to use Airtable.

### Make.com

The public lead form sends submissions to a Make.com webhook. Make.com is expected to handle downstream automation such as writing Airtable records, notifying staff, and triggering SMS or email workflows.

### Google and Anthropic

Google APIs support Google Ads operations and the partially implemented Google Business Profile area. Anthropic powers AI ad suggestions, quick-ad generation, ad drafting, and Google Business reply/post drafting.

## Tech Stack

- Next.js `16.2.9` with the App Router.
- React `19.2.4`.
- TypeScript.
- Tailwind CSS `4`.
- Supabase JS and Supabase SSR.
- Airtable REST API.
- Google APIs and Google Ads REST endpoints.
- Anthropic SDK.
- Recharts.
- Lucide React.
- Luxon for campaign scheduling and time-zone handling.
- Papa Parse for CSV workflows.
- Node's built-in test runner through `tsx`.

Main package scripts:

```bash
npm run dev
npm run build
npm run start
npm run lint
npm test
```

## Authentication, Roles, and Security

When Supabase is configured, middleware protects the internal dashboard routes and redirects signed-out users to `/login`. A successful login returns the user to the requested route or `/dashboard`.

The current roles are:

- `admin`: full operational access, staff management, settings, and Audit Log access.
- `editor`: view and update operational data, delete leads, manage campaign enrollment, and approve ads.
- `viewer`: read-only dashboard and advertising access.

Route handlers enforce minimum roles on sensitive operations. UI permission gates improve the experience, but server-side checks remain the authority.

Security-related behavior includes:

- Inactive profiles are denied access.
- Admins cannot deactivate, demote, or delete their own account through staff management.
- Supabase service-role credentials are kept server-side.
- Audit Log inserts are server-only; authenticated dashboard users have no direct insert, update, or delete permission on `public.audit_logs`.
- Audit payloads are sanitized, emails are masked, and optional IP hashing uses `AUDIT_IP_HASH_SALT`.
- Login, logout, staff changes, password changes, lead mutations, campaign actions, clinic-metric updates, exports, ad actions, and failures can be audited.

If Supabase public configuration is absent, middleware can render pages in local/demo mode, but protected mutation APIs still require valid authentication and role checks.

## Main Navigation

The current sidebar links to:

- Overview.
- Google Ads.
- Leads.
- Campaigns.
- Audit Log, for admins only.
- Settings.

Google Business Profile remains hidden from the sidebar until its API access is ready. Older direct Message Logs and Nurture pages remain in the codebase, but the primary workflow is now consolidated under Campaigns.

The layout is responsive, includes a mobile navigation drawer, preloads common dashboard data on navigation intent, and supports light, dark, and system theme preferences. Theme preference is stored locally on the device; light is the default.

## Current Pages

### `/`

Redirects to `/dashboard`.

### `/login`

Supabase email/password sign-in for dashboard staff. Sign-in and sign-out activity is recorded in the audit system.

### `/dashboard`

The Growth Command Center is a live, period-aware overview. Supported ranges are:

- Last 7 days.
- Last 30 days.
- Last 90 days.
- This month.

The selected range is stored in the URL. The page refreshes when revisited and when the browser becomes visible, while short-lived client caching reduces unnecessary navigation delays.

The overview includes:

- Total, contacted, replied, and booked lead KPIs.
- Booking conversion and average speed-to-lead.
- Patient-growth trend charts.
- Lead conversion funnel.
- Lead-source performance.
- 14-Day Nurture journey distribution.
- Message delivery health.
- Visits and new-patient totals.
- Google Ads performance.
- Operational activity by day.
- Recent activity.
- Attention signals for delivery failures, disconnected or overdue enrollments, overdue leads, missing contact details, and duplicates.

Each data section handles its own unavailable or empty state so one integration failure does not make the entire overview unusable.

### `/leads`

The Leads page is a live Airtable-backed operational workspace.

It now supports:

- Server-side Airtable filtering and cursor pagination.
- Page sizes of 20, 30, or 50.
- All Leads, Replied, and Booked views.
- Live summary metrics independent of the visible page.
- Search by name, email, or phone.
- Status, source, date, email delivery, SMS delivery, campaign, campaign status, and campaign-step filters.
- Newest/oldest sorting.
- Direct URLs that preserve filters, pagination state, and the selected lead.
- Responsive desktop tables and mobile cards.
- Lead detail, campaign membership, and communication history.
- Inline status changes and replied-state updates.
- Editing name, email, phone, source, message, and notes.
- Manual lead creation.
- CSV import, limited to 500 leads per request and written in Airtable-supported batches.
- Filter-aware CSV export, capped at 10,000 records.
- Duplicate detection using Airtable flags plus normalized email and phone matching.
- Delete-impact checks before removal.
- Clinic Metrics updates for monthly visits and new patients.
- Adding eligible leads to the 14-Day Nurture campaign.

Supported lead statuses are:

- New.
- Contacted.
- Booked.
- Duplicate.
- Failed.
- Not Interested.

When Airtable is not configured, read endpoints return a safe empty/unconfigured response. Mutations require Airtable plus an authenticated editor or admin.

### `/campaigns`

Campaigns is the central automation-management area. It currently defines two live campaigns:

- Speed-to-Lead: automatic immediate email and SMS response for new website leads.
- 14-Day Nurture: manual multi-step follow-up for leads who have not booked or replied.

Campaign cards show status, channels, total leads, active/completed counts, messages sent, campaign-specific metrics, and recent activity.

### `/campaigns/[campaignSlug]`

Campaign detail pages provide Overview, Leads, and Conversations tabs.

The Speed-to-Lead detail view reports processed leads, delivery activity, booked/replied outcomes, and related conversations.

The 14-Day Nurture detail view supports:

- Enrollment metrics and the step funnel.
- Search, status, and current-step filtering.
- Responsive enrollment views.
- Scheduled bulk enrollment of existing leads.
- Creation and enrollment of new leads in the same workflow.
- CSV-based enrollment import.
- Time-zone-aware scheduling in `America/New_York`.
- Duplicate and ineligible-lead handling.
- Safe retry/idempotency claims backed by Supabase, with an in-memory fallback.
- Manual stop actions while retaining reporting history.
- Detection, review, reconnection, or removal of disconnected enrollment records.
- Conversation grouping and message-delivery history.

The nurture sequence steps are:

- Day 1 SMS.
- Day 3 Email.
- Day 5 SMS.
- Day 8 Email.
- Day 12 SMS.

### `/google-ads-analytics`

The Google Ads workspace combines Airtable-backed reporting with live Google Ads actions and AI assistance.

Tabs include:

- Campaigns.
- Ad Groups.
- Creatives.
- Keywords.
- AI Suggestions.
- Pending Review.

Reporting supports 7-, 14-, 30-, and 90-day windows and shows metrics such as spend, impressions, clicks, conversions, CPL, ROAS, status, and synchronization times. Pending ads can be reviewed, and AI tools can generate suggestions and draft ad content.

`/google-ads-analytics/creative-detail` provides creative overview, copy assets, performance signals, and daily performance details for a selected ad.

`/google-ads` redirects to this page, and `/ai-insights` redirects to its AI Suggestions tab.

### `/audit-log`

The Audit Log is an admin-only, Supabase-backed activity viewer.

It provides:

- Server pagination with page sizes of 25, 50, or 100.
- Search across actor, action, resource, and summary.
- Date, user, role, category, action, result, and resource-type filters.
- Today, authentication, lead-change, and failed-action summaries.
- A separate detail request for sanitized before/after data and metadata.
- CSV export of up to 5,000 matching entries.

The active table is `public.audit_logs` from `supabase/migrations/002_audit_logs.sql`. The singular `public.audit_log` in `supabase/auth_full_setup.sql` is legacy setup schema and is not the table read by the current Audit Log page.

### `/settings`

Settings now focuses on authenticated account and staff management.

All users can:

- Choose light, dark, or system appearance.
- View their profile and role.
- Update their display name.
- Change their password.
- Review account creation and last-sign-in information.

Admins can also:

- Search and review staff accounts.
- Add staff with an initial password and role.
- Edit display name and role.
- Activate or deactivate access.
- Reset a staff member's password.
- Delete staff accounts.

Staff accounts and profiles are managed through Supabase Auth and `public.profiles`, not browser `localStorage`.

### `/lead`

This is the public lead-capture form used by ad or website traffic. It collects contact details, treatment interest, message text, UTM values, and page URL.

The form validates email and US phone numbers and includes a honeypot field for bots. It posts to `NEXT_PUBLIC_MAKE_WEBHOOK_URL`, then redirects successful submissions to `NEXT_PUBLIC_PATIENTNOW_BOOKING_URL`.

### Supporting and Hidden Pages

- `/message-logs` still provides the standalone Airtable-backed delivery-log interface.
- `/nurture` still provides the earlier standalone nurture view.
- `/message-log` redirects to the 14-Day Nurture Conversations tab.
- `/settings/users` redirects to `/settings`.
- `/google-business` exists but is hidden from navigation pending API readiness.

## Important API Areas

### Overview

- `GET /api/overview`: builds the live overview response for `7d`, `30d`, `90d`, or `month`.

### Leads and Clinic Metrics

- `GET /api/airtable/leads`: filtered, sorted, cursor-paginated leads.
- `POST /api/airtable/leads`: create one lead or import a CSV batch.
- `PATCH /api/airtable/leads`: update lead fields, status, or replied state.
- `DELETE /api/airtable/leads`: delete a lead.
- `GET /api/airtable/leads/summary`: full filtered summary and view counts.
- `GET /api/airtable/leads/export`: filtered CSV export.
- `GET /api/airtable/leads/[id]/messages`: communication timeline for one lead.
- `GET /api/airtable/leads/[id]/delete-impact`: linked-record checks before deletion.
- `DELETE /api/airtable/leads/[id]`: coordinated lead deletion.
- `GET|POST /api/airtable/clinic-metrics`: read or upsert monthly clinic totals.

### Campaigns and Messages

- `GET /api/airtable/campaigns`: campaign summaries.
- `GET /api/airtable/campaigns/[campaignSlug]`: campaign detail, leads, and messages.
- `GET /api/airtable/nurture-enrollments`: enrollment records.
- `POST /api/airtable/nurture-enrollments/bulk-enroll`: validated, scheduled, idempotent enrollment.
- `POST /api/airtable/nurture-enrollments/import`: enrollment import.
- `PATCH|DELETE /api/airtable/nurture-enrollments/[recordId]`: stop, reconnect, update, or remove enrollments.
- `GET /api/airtable/message-logs`: filtered message-delivery records.

### Authentication and Audit

- `GET|POST|PATCH|DELETE /api/auth/users`: admin staff management.
- `POST|DELETE /api/auth/audit-session`: login and logout activity.
- `POST /api/audit-actions`: account-security audit events.
- `GET /api/audit-logs`: admin-only list, summary, filtering, pagination, and CSV export.
- `GET /api/audit-logs/[id]`: sanitized event detail.

### Google Ads and AI

- `/api/airtable?table=campaigns|ad-groups|creatives|keywords|ad-preview`.
- `/api/airtable/pending-ads`.
- `/api/google-ads/campaigns`.
- `/api/google-ads/keywords`.
- `/api/google-ads/campaign-status`.
- `/api/google-ads/create-ad`.
- `/api/google-ads/sync`.
- `/api/ai-suggestions`.
- `/api/ai-quick-ads`.
- `/api/draft-ad`.

### Integration Health and Google Business

- `GET /api/settings/status`: reports configuration and connectivity without returning secrets.
- Google Business routes cover OAuth, reviews, insights, posts, reply drafting, and diagnostics. See `docs/google-business-profile.md`.

## Environment Variables

Use a Next.js-recognized local file such as `.env.local`. Never commit real credentials.

### Airtable

```bash
AIRTABLE_API_KEY=
AIRTABLE_LEADS_BASE_ID=
AIRTABLE_BASE_ID=
AIRTABLE_CLINIC_METRICS_TABLE_ID=
```

`AIRTABLE_CLINIC_METRICS_TABLE_ID` is optional and defaults to `Clinic Metrics`.

### Supabase and Audit

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AUDIT_IP_HASH_SALT=
```

`AUDIT_IP_HASH_SALT` is optional but recommended when request IP hashes should be recorded consistently.

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

`GOOGLE_ADS_MCC_ID` is optional. `GOOGLE_ADS_API_VERSION` has a code default.

### Google Business Profile

```bash
GOOGLE_BUSINESS_ACCOUNT_ID=
GOOGLE_BUSINESS_LOCATION_ID=
GOOGLE_BUSINESS_REFRESH_TOKEN=
```

Google Business can fall back to `GOOGLE_ADS_REFRESH_TOKEN` when its dedicated refresh token is absent.

### AI

```bash
ANTHROPIC_API_KEY=
```

### App and Public Lead Form

```bash
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_MAKE_WEBHOOK_URL=
NEXT_PUBLIC_PATIENTNOW_BOOKING_URL=
```

Restart the development server after changing server-side environment variables.

## Supabase Setup Files

- `supabase/auth_full_setup.sql`: profiles, profile triggers, role helpers, legacy audit table, and related RLS setup.
- `supabase/migrations/001_initial_schema.sql`: broader planned operational schema.
- `supabase/migrations/002_audit_logs.sql`: current append-only Audit Log table and admin read policy.
- `supabase/migrations/003_campaign_enrollment_claims.sql`: server-only enrollment idempotency records.

Apply the relevant SQL to the intended Supabase project before using authentication, staff management, Audit Log, or persistent enrollment retry protection.

## Local Development and Verification

Install and run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Verification commands:

```bash
npm test
npm run lint
npm run build
```

The test suite currently covers:

- Airtable batch sizing.
- Campaign enrollment idempotency.
- Nurture schedule and time-zone validation.
- Campaign display helpers.
- Lead view membership.
- Lead summary aggregation and duplicate counting.

## Project Structure

```text
src/app                 App Router pages and route handlers
src/components          Shared layout, campaign, lead, theme, and UI components
src/contexts            Supabase authentication context/provider
src/lib/airtable        Airtable clients, batching, mapping, and configuration
src/lib/audit           Audit event logging, typing, and sanitization
src/lib/auth            Roles, permissions, and server authorization
src/lib/campaigns       Campaign registry, data aggregation, scheduling, idempotency
src/lib/leads           Lead query, view, and summary helpers
src/lib/supabase        Browser, server, middleware, and configuration clients
docs                    Integration notes
supabase                SQL setup and migrations
tests                   Node/TypeScript tests
public                  Static assets
```

## Current Operational Notes

- Airtable remains the source of truth for live leads, messages, nurture enrollments, clinic metrics, and reporting tables.
- Supabase is the source of truth for authentication profiles, current audit records, and persistent campaign-enrollment claims.
- The application uses `public.audit_logs`; do not confuse it with the legacy singular `public.audit_log` table.
- Read-only Airtable routes generally degrade to empty/unconfigured responses in local development.
- Operational writes require real Airtable configuration and an authenticated editor or admin.
- Audit Log and staff administration require an admin.
- Google Business is implemented but intentionally hidden from the primary navigation.
- Theme preference is the only important dashboard preference stored in browser `localStorage`.
- The dashboard is designed for desktop and mobile layouts.
- Local environment changes require restarting `next dev`.
- Follow the installed Next.js documentation under `node_modules/next/dist/docs/` when changing framework-specific conventions.
- Do not commit `.env.local`, downloaded environment files, API keys, OAuth tokens, or Supabase service-role credentials.

## Future Areas

`FUTURE_PAGES.md` describes additional or partially scaffolded workflows, including:

- Dormant-patient reactivation.
- Rebooking reminders.
- Referral campaigns.
- Expanded Supabase-backed operational data.
- Broader AI insight workflows.

## Summary

Harmony MedSpa Dashboard is now a secured, responsive operations platform rather than only a reporting prototype. Airtable supplies the live clinic and marketing records, Supabase provides identity, role enforcement, audit history, and enrollment coordination, and the UI unifies lead handling, campaign journeys, communications, advertising analysis, clinic metrics, and staff administration.
