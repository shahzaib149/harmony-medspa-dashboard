# Harmony Dashboard Route, Data, Permission, and File Map

Last verified: August 12, 2026.

## Contents

1. Repository structure
2. Page routes
3. API routes by domain
4. Data ownership and schemas
5. Role model
6. Environment variables
7. Important implementation files
8. Verification and maintenance

## 1. Repository structure

```text
src/app/                  Next.js pages and API route handlers
src/components/           Layout, campaign, lead, theme, overview, and UI components
src/contexts/             Client authentication context/provider
src/lib/airtable/         Airtable configuration, mapping, batching, blogs, and pending ads
src/lib/blogs/            Blog types, SEO generation/validation, and public-site revalidation
src/lib/analytics/        Google conversion tracking
src/lib/audit/            Audit types, sanitization, and server inserts
src/lib/auth/             Roles, permissions, page guards, and API guards
src/lib/campaigns/        Registry, aggregation, dates, scheduling, and idempotency
src/lib/google/           Google Ads, GA4, and GBP clients, normalization, OAuth, pending ads
src/lib/leads/            Lead formulas, views, and summary aggregation
src/lib/make/             Dedicated ad-publishing webhook client
src/lib/supabase/         Browser, server, service-role, and middleware clients
supabase/                 Auth setup and migrations
tests/                    TypeScript domain and contract tests
content/                  Reviewed structured blog launch package
scripts/                  Airtable import and pending-ad seed scripts
docs/                     Blog workflow/setup and integration restoration notes
public/                   Logos, login photography, and assets
```

Large interactive clients are separated from small authenticated server page wrappers.

## 2. Page routes

| Route | Current behavior | Access | Main implementation |
|---|---|---|---|
| `/` | Redirects to dashboard | Public redirect | `src/app/page.tsx` |
| `/login` | Staff email/password sign-in | Public | `src/app/login/page.tsx` |
| `/dashboard` | Range-aware Growth Command Center | Viewer+ | `dashboard/page.tsx`, `OverviewClient.tsx`, `overview-data.ts` |
| `/leads` | Live lead workspace | Viewer; writes Editor | `src/app/leads/LeadsClient.tsx` |
| `/campaigns` | Campaign cards and health | Viewer+ | `CampaignsClient.tsx` |
| `/campaigns/[campaignSlug]` | Overview, Leads, Conversations | Viewer; enrollment actions Admin | `CampaignDetailClient.tsx` |
| `/blogs` | Airtable article library and launch-draft import | Viewer; import Editor | `src/app/blogs/BlogsClient.tsx` |
| `/blogs/new` | Structured article and technical SEO editor | Editor | `src/app/blogs/BlogEditor.tsx` |
| `/blogs/[recordId]` | View/edit and manually publish or unpublish | Viewer; writes Editor | `src/app/blogs/BlogEditor.tsx` |
| `/google-ads-analytics` | Full Google Ads workspace | Viewer+ | `GoogleAdsAnalyticsClient.tsx`, `GoogleAdsWorkspace.tsx` |
| `/google-ads-analytics/campaigns` | Shared Campaigns tab | Viewer+ | `WorkspacePage.tsx` |
| `/google-ads-analytics/campaigns/[campaignId]` | Campaign detail/history | Viewer+ | `EntityPage.tsx`, `EntityDetailClient.tsx` |
| `/google-ads-analytics/ad-groups` | Shared Ad Groups tab | Viewer+ | `WorkspacePage.tsx` |
| `/google-ads-analytics/ad-groups/[adGroupId]` | Ad-group detail/history | Viewer+ | `EntityPage.tsx`, `EntityDetailClient.tsx` |
| `/google-ads-analytics/ads` | Shared Ads tab | Viewer+ | `WorkspacePage.tsx` |
| `/google-ads-analytics/ads/[adId]` | Ad detail/history | Viewer+ | `EntityPage.tsx`, `EntityDetailClient.tsx` |
| `/google-ads-analytics/keywords` | Shared Keywords tab | Viewer+ | `WorkspacePage.tsx` |
| `/google-ads-analytics/keywords/[criterionId]` | Keyword detail/history | Viewer+ | `EntityPage.tsx`, `EntityDetailClient.tsx` |
| `/google-ads-analytics/publishing` | Shared Publishing tab | Viewer; publish Admin | `WorkspacePage.tsx` |
| `/google-ads-analytics/ai-suggestions` | Shared AI Suggestions tab | Viewer; generate Editor; publish Admin | `AISuggestionsTab.tsx` |
| `/website-analytics` | GA4 website traffic, engagement, acquisition, content, devices, and lead reporting with hostname filters | Viewer+ | `WebsiteAnalyticsClient.tsx`, `WebsiteAnalyticsCharts.tsx` |
| `/audit-log` | Admin activity viewer | Admin | `AuditLogClient.tsx` |
| `/settings` | Account, password, theme, staff | Viewer; staff Admin | `SettingsClient.tsx` |
| `/lead` | Public consultation form | Public | `src/app/lead/page.tsx` |
| `/google-business` | Implemented GBP workspace, hidden from nav | Viewer+ | `GoogleBusinessClient.tsx` |
| `/google-ads` | Redirect to Google Ads workspace | Redirect | `src/app/google-ads/page.tsx` |
| `/ai-insights` | Redirect to AI Suggestions | Redirect | `src/app/ai-insights/page.tsx` |
| `/nurture` | Redirect to Nurture Overview | Redirect | `src/app/nurture/page.tsx` |
| `/message-log`, `/message-logs` | Redirect to Nurture Conversations | Redirect | corresponding page wrappers |
| `/settings/users` | Redirect to Settings | Redirect | `settings/users/page.tsx` |

Middleware includes protected and compatibility routes. Protected server pages also guard themselves independently.

## 3. API routes by domain

### Overview

- `GET /api/overview?range=7d|30d|90d|month` — Viewer; combines Airtable operations/reporting with permitted Supabase activity.

### Leads and clinic metrics

- `GET /api/airtable/leads` — Viewer; filter, sort, cursor pagination.
- `POST /api/airtable/leads` — Editor; create or batch import.
- `PATCH /api/airtable/leads` — Editor; allowed field/status/replied updates.
- `DELETE /api/airtable/leads` — Editor; direct audited delete.
- `GET /api/airtable/leads/summary` — Viewer; full filtered summary.
- `GET /api/airtable/leads/export` — Editor; CSV up to 10,000.
- `GET /api/airtable/leads/[id]/messages` — Viewer; lead timeline.
- `GET /api/airtable/leads/[id]/delete-impact` — Editor; linked impact.
- `DELETE /api/airtable/leads/[id]` — Editor; coordinated delete.
- `GET /api/airtable/clinic-metrics` — Viewer.
- `POST /api/airtable/clinic-metrics` — Editor; monthly upsert.

### Campaigns, nurture, and messages

- `GET /api/airtable/campaigns` — Viewer; aggregate registered campaigns.
- `GET /api/airtable/campaigns/[campaignSlug]` — Viewer; detail, members, messages.
- `GET /api/airtable/nurture-enrollments` — Viewer.
- `POST /api/airtable/nurture-enrollments/bulk-enroll` — Admin; SMS permission, schedule, eligibility, batching, idempotency.
- `POST /api/airtable/nurture-enrollments/import` — compatibility wrapper; inspect delegated authorization.
- `PATCH|DELETE /api/airtable/nurture-enrollments/[recordId]` — Admin; stop, reconnect, update, remove.
- `GET /api/airtable/nurture` — Viewer; older standalone contract.
- `GET /api/airtable/nurture/[id]/messages` — Viewer; older detail contract.
- `GET /api/airtable/message-logs` — Viewer; filterable deliveries.
- `PATCH /api/airtable/message-logs` — Admin; review/acknowledgment state.
- `GET /api/airtable/message-log` — compatibility re-export; verify the underlying guard.

### Authentication, staff, and audit

- `POST /api/auth/login` — Public credential endpoint with profile checks.
- `GET /api/auth/session` — Viewer; verified user/profile.
- `POST|DELETE /api/auth/audit-session` — Viewer; login/logout activity.
- `GET|POST|PATCH|DELETE /api/auth/users` — Admin; staff management.
- `GET /api/auth/google` and callback — Admin; older Google OAuth/settings flow.
- `POST /api/audit-actions` — Viewer; sanitized account/security events.
- `GET /api/audit-logs` — Admin; summaries, filters, pagination, CSV.
- `GET /api/audit-logs/[id]` — Admin; sanitized detail.

### Blogs

- `GET /api/airtable/blogs` - Viewer; list Airtable blog summaries.
- `POST /api/airtable/blogs` - Editor; create a Draft or manually confirmed Published article.
- `GET /api/airtable/blogs/[recordId]` - Viewer; load the full structured article.
- `PATCH /api/airtable/blogs/[recordId]` - Editor; update, publish, or unpublish and notify the public website when needed.
- `POST /api/airtable/blogs/import` - Editor; import only missing launch-package slugs and force Draft status.

### Google Ads reporting and live actions

- `GET /api/airtable?table=campaigns|ad-groups|creatives|keywords|ad-preview&days=N` — Viewer; normalized reporting.
- `GET /api/airtable/google-ads-campaigns` — Viewer; live campaign inventory.
- `GET /api/airtable/ad-groups?campaignId=...` — Viewer; live ad groups joined to campaigns.
- `GET /api/google-ads/workspace` — Viewer; live entity workspace.
- `GET /api/google-ads/history` — Viewer; entity history.
- `GET /api/google-ads/conversion-tracking` — Viewer.
- `POST /api/google-ads/campaigns` — currently Viewer; inspect the action before changing permissions.
- `POST /api/google-ads/campaign-status` — Editor.
- `POST /api/google-ads/keywords` — Admin.
- `POST /api/google-ads/pending-recommendations` — Admin.

### Google Analytics reporting

- `GET /api/google-analytics/overview?days=7|14|30|90&hostname=...` - Viewer; live GA4 Data API reporting with a two-minute server cache and optional hostname isolation.
- The route returns a safe `GA4_NOT_CONFIGURED` state until the numeric property ID and read-only service-account credentials are configured.

### Pending ads, approval, and publishing

- `GET /api/airtable/pending-ads` — Viewer; pending-only.
- `POST /api/airtable/pending-ads` — Viewer; audit review-open event.
- `PATCH /api/airtable/pending-ads` — Admin; update or reject package.
- `GET /api/airtable/ad-reviews` — Viewer; pending/published/failed/all.
- `PATCH /api/airtable/ad-reviews` — Admin; publish, retry, fail, return pending, acknowledge.
- `POST /api/google-ads/publish-via-make` — Admin; paused-RSA request.
- `POST /api/admin/reconcile-published-ads` — legacy one-off; security-review before use.

### AI

- `POST /api/ai-suggestions` — Editor; performance-aware RSA and advice through Anthropic.
- `GET /api/ai-quick-ads` — Viewer; website-audited concepts, hourly revalidation.
- `POST /api/draft-ad` — Editor; treatment/audience/offer draft.

### Google Business Profile

- `GET /api/google-business/auth` and callback — Admin; business.manage OAuth/discovery.
- `GET /api/google-business/reviews` — Viewer.
- `POST /api/google-business/reviews` — Editor; reply.
- `GET /api/google-business/insights` — Viewer.
- `POST /api/google-business/draft-reply` — Editor; Anthropic.
- `GET /api/google-business/posts` — Editor; draft.
- `POST /api/google-business/posts` — Editor; publish.

### Integration health

- `GET /api/settings/status` — Viewer; configuration/connectivity without secret values.

## 4. Data ownership and schemas

### Airtable operational base: `AIRTABLE_LEADS_BASE_ID`

| Table | Purpose | Important relationships |
|---|---|---|
| `Leads` | Patient inquiry source of truth | contact, source, status, replied, delivery, UTM, linked nurture fields |
| `Message Log` | Communication and delivery history | Recipient Lead, Channel, Sequence, Step, status, provider/error/review fields |
| `Nurture Enrollments` | 14-Day Nurture state | Lead link, status, step, next/last send, stop fields |
| `Clinic Metrics` | Monthly clinic totals | Month, Total Visits, New Patients, Updated At |
| `Blogs` / `tbltyc852o1xnmyEi` | New CMS articles | exact Status `Draft`/`Published`; structured JSON in CMS Data |

`src/lib/airtable/leads-base.ts` owns shared reads/mapping/cache. `src/lib/overview-data.ts` performs the cross-table overview aggregation.

### Airtable advertising base: `AIRTABLE_BASE_ID`

| Table | Purpose |
|---|---|
| `Google Ads Campaign Analytics` | campaign snapshots |
| `Google Ads Ad Group Analytics` | ad-group snapshots |
| `Google Ads Ad Creative Analytics` | ad/creative snapshots |
| `Google Ads Keyword Performance` | keyword snapshots |
| `Google Ad Preview` / `tblsokwqKQuj3rFSB` | ad-copy lookup |
| `Google Ads Campaigns` | live selectable campaign inventory |
| `Google Ads Ad Groups` | live linked ad-group inventory |
| pending ads / `tbl8XpPEGCr720IUi` | review and publication lifecycle |

The generic reporting route accepts field aliases and recomputes ratio metrics after aggregation. Canonical entity identity must use Google IDs/resource names, not display names.

### Supabase active tables

| Table | Purpose |
|---|---|
| `public.profiles` | role and active access for auth identities |
| `public.audit_logs` | append-only sanitized activity |
| `public.campaign_enrollment_claims` | server-only retry/idempotency coordination |

### Supabase planned or legacy tables

The initial migration includes `leads`, `lead_touches`, `dormant_patients`, `nurture_enrollments`, `rebooking_reminders`, `referrals`, `ai_insights`, and `settings`. These are not the current live source for the corresponding pages.

`public.audit_log` is legacy. Do not point the current Audit Log page at it.

## 5. Role model

| Capability | Viewer | Editor | Admin |
|---|:---:|:---:|:---:|
| View dashboard, leads, campaigns, ads, own settings | Yes | Yes | Yes |
| Create/update/delete leads | No | Yes | Yes |
| Update clinic metrics | No | Yes | Yes |
| View CMS blogs | Yes | Yes | Yes |
| Create/edit/publish CMS blogs | No | Yes | Yes |
| Generate selected AI drafts | Route-specific | Yes | Yes |
| Bulk-enroll/repair nurture | No | No | Yes |
| Publish/retry pending ads | No | No | Yes |
| Add live keywords/negatives | No | No | Yes |
| Manage staff | No | No | Yes |
| View/export Audit Log | No | No | Yes |

Always inspect the handler's `requireRole`; this table is a product summary.

## 6. Environment variables

Never print `.env.local` when a presence check is enough.

### Core

- `NEXT_PUBLIC_APP_URL`
- `NODE_ENV`

### Airtable

- `AIRTABLE_API_KEY`
- `AIRTABLE_LEADS_BASE_ID`
- `AIRTABLE_BASE_ID`
- `AIRTABLE_CLINIC_METRICS_TABLE_ID` (optional)
- `AIRTABLE_BLOGS_BASE_ID` (optional; falls back to the leads base)
- `AIRTABLE_BLOGS_TABLE_ID` (preferred) or `AIRTABLE_BLOGS_TABLE_NAME=Blogs`
- `NEXT_PUBLIC_SITE_URL`
- `BLOG_REVALIDATE_SECRET` (must match the website project)

### Supabase and audit

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AUDIT_IP_HASH_SALT` (optional)

### Google Ads

- `GOOGLE_ADS_API_VERSION`
- `GOOGLE_ADS_CLIENT_ID`
- `GOOGLE_ADS_CLIENT_SECRET`
- `GOOGLE_ADS_DEVELOPER_TOKEN`
- `GOOGLE_ADS_REFRESH_TOKEN`
- `GOOGLE_ADS_CUSTOMER_ID`
- `GOOGLE_ADS_MCC_ID` (optional)

### Google Analytics Data API

- `GA4_PROPERTY_ID` - numeric GA4 property ID, not the `G-` measurement ID
- `GA4_SERVICE_ACCOUNT_EMAIL` - read-only service-account email added as a GA4 property Viewer
- `GA4_SERVICE_ACCOUNT_PRIVATE_KEY` - server-only JSON key private key with escaped newlines supported

### Google Business

- `GOOGLE_BUSINESS_REFRESH_TOKEN`
- `GOOGLE_BUSINESS_ACCOUNT_ID`
- `GOOGLE_BUSINESS_LOCATION_ID`

Account and location must be different entities. Prefer the dedicated GBP token even though a client contains a Google Ads token fallback.

### AI

- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY` is documented but not the current implementation path

### Make.com

- `NEXT_PUBLIC_MAKE_WEBHOOK_URL` — public lead capture only
- `MAKE_PUBLISH_AD_WEBHOOK_URL` — paused-ad publishing only
- `MAKE_WEBHOOK_SECRET` — optional server signature header

### Lead form and conversion tracking

- `NEXT_PUBLIC_PATIENTNOW_BOOKING_URL`
- `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID`
- `NEXT_PUBLIC_GOOGLE_ADS_LEAD_SEND_TO`

Restart Next.js after server-variable changes.

## 7. Important implementation files

### Shell and theme

- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/components/layout/DashboardLayout.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/theme/*`
- `src/lib/theme-preference.ts`

### Auth

- `middleware.ts`
- `src/contexts/AuthProvider.tsx`
- `src/lib/auth/permissions.ts`
- `src/lib/auth/require-page-auth.ts`
- `src/lib/auth/requireRole.ts`
- `src/lib/supabase/*`

### Overview and leads

- `src/app/dashboard/OverviewClient.tsx`
- `src/lib/overview-data.ts`
- `src/lib/overview-types.ts`
- `src/app/leads/LeadsClient.tsx`
- `src/app/api/airtable/leads/**`
- `src/lib/leads/*`
- `src/lib/airtable/leads-base.ts`

### Campaigns

- `src/lib/campaigns/registry.ts`
- `src/lib/campaigns/data.ts`
- `src/lib/campaigns/nurture-schedule.ts`
- `src/app/campaigns/**`
- `src/components/campaigns/**`
- `src/app/api/airtable/nurture-enrollments/**`

### Blogs

- `src/app/blogs/**`
- `src/app/api/airtable/blogs/**`
- `src/lib/airtable/blogs.ts`
- `src/lib/blogs/**`
- `content/blog-drafts.json`
- `scripts/import-blog-drafts.ts`
- `docs/airtable-blogs-setup.md`
- `docs/blog-publishing-workflow.md`

### Google Ads and pending ads

- `src/app/google-ads-analytics/**`
- `src/lib/google/ads-client.ts`
- `src/lib/google/ads-normalization.ts`
- `src/lib/google/pending-ads.ts`
- `src/lib/airtable/pending-ads.ts`
- `src/app/api/google-ads/**`
- `src/lib/make/publish-ad.ts`

### Website Analytics

- `src/app/website-analytics/**`
- `src/app/api/google-analytics/overview/route.ts`
- `src/lib/google/analytics-client.ts`
- `src/lib/google/analytics-normalization.ts`
- `src/lib/google/analytics-types.ts`

### Audit, settings, lead form, GBP

- `src/app/audit-log/**`
- `src/app/api/audit-logs/**`
- `src/lib/audit/**`
- `src/app/settings/SettingsClient.tsx`
- `src/app/api/auth/users/route.ts`
- `src/app/lead/page.tsx`
- `src/lib/analytics/gtag.ts`
- `src/app/google-business/**`
- `src/app/api/google-business/**`
- `src/lib/google/gbp-client.ts`
- `docs/google-business-profile.md`

## 8. Verification and maintenance

Before a material change:

1. Inspect `git status --short` and preserve unrelated work.
2. Read the page wrapper, client, API route, supporting library, and nearest tests.
3. Search every use of changed Airtable fields, environment variables, roles, URLs, or tables.
4. Check mobile and desktop contracts.
5. Verify direct URL state for filters, tabs, and pagination.
6. Verify loading, empty, partial-unavailable, error, retry, permission, and success states.
7. Add sanitized audit events for important mutations and failures.
8. Run targeted tests, then `npm test`, `npm run lint`, and `npm run build` as warranted.

When Next.js behavior is uncertain, inspect the installed docs under `node_modules/next/dist/docs/`.
