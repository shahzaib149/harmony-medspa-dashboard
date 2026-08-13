# My Harmony MedSpa Dashboard: What I Built and Where I Am

Last verified against the repository: August 12, 2026.

## Contents

1. My product and why I built it
2. What the application is today
3. My architecture and sources of truth
4. Authentication, roles, and security
5. The product areas I built
6. My Google Ads and AI workflow
7. My visual and interaction system
8. Reliability, performance, and testing
9. What is hidden, redirected, legacy, or planned
10. Where I am now
11. How I want another AI to work

## 1. My product and why I built it

I built a private, responsive patient-growth and marketing operations command center for Harmony MedSpa. It brings lead management, automated campaign activity, Google Ads reporting and publishing, clinic metrics, staff access, audit history, and integration health into one application.

The product name shown in the application is **Harmony Growth Command Center**. It is not a generic analytics template. It is an operational dashboard for the Harmony MedSpa team in Sarasota, Florida.

I want the team to answer practical questions without jumping between Airtable, Google Ads, automation logs, and account-management tools:

- How many leads arrived, were contacted, replied, and booked?
- Which new leads still need attention?
- How quickly are leads receiving the first response?
- Which leads are in Speed-to-Lead or 14-Day Nurture?
- Which nurture step is each lead on, and what sends next?
- Are SMS and email messages being delivered or failing?
- Which sources, campaigns, ad groups, ads, and keywords are performing?
- Which responsive search ads are waiting for human review?
- Who changed a lead, campaign, user, metric, or advertising workflow?
- Are Airtable, Supabase, Google, Anthropic, Make.com, and the deployed app configured correctly?

I designed the dashboard for daily operations, not just charts. The important areas include mutations, approvals, enrollment scheduling, failure review, safe deletion, auditability, role enforcement, responsive interactions, and graceful partial outages.

## 2. What the application is today

I built the application with Next.js 16.2.9 App Router, React 19.2.4, TypeScript, Tailwind CSS 4, Recharts, Lucide, Luxon, Papa Parse, Supabase SSR, Airtable REST, Google APIs, Anthropic, and Make.com. It targets Node 22.x.

The main authenticated navigation contains:

- Overview
- Google Ads
- Website Analytics
- Leads
- Campaigns
- Blogs
- Audit Log for admins only
- Settings

I also built a secure staff login, a public `/lead` capture form, a complete but hidden Google Business Profile workspace, and compatibility redirects from older page URLs into the consolidated experiences. The root `/` redirects to `/dashboard`.

## 3. My architecture and sources of truth

I deliberately use different systems for different responsibilities.

### Airtable is my live operational and marketing data store

I currently use Airtable for:

- Leads
- Message Log records
- Nurture Enrollments
- Clinic Metrics
- Google Ads campaign, ad-group, creative, and keyword analytics
- live Google Ads Campaigns and Google Ads Ad Groups inventory
- Google Ad Preview records
- pending ad review packages and publication status
- new structured blog articles and their Draft/Published state

I use `AIRTABLE_LEADS_BASE_ID` for leads, messages, nurture enrollment, campaigns, and clinic metrics. I use `AIRTABLE_BASE_ID` for advertising analytics, live advertising inventory, previews, and pending ads.

The new blog CMS uses a `Blogs` table in the operational Airtable base. Its verified table ID is `tbltyc852o1xnmyEi`. The exact fields are Title, Slug, Status, Primary Keyword, Category, Created At, Updated At, Published At, Created By, Updated By, and CMS Data. `CMS Data` stores the structured blocks, tags, excerpt, SEO fields, links, and CTA as JSON. Airtable is the source of truth for new CMS articles; the public website reads only records whose Status is exactly Published.

The code tolerates known Airtable schema aliases. Read routes usually return safe unconfigured or unavailable states, and writes use Airtable-supported batches. A future AI must not casually rename fields, table names, linked-record relationships, or record IDs.

### Supabase is my identity, authorization, audit, and coordination store

I currently use Supabase for:

- email/password authentication
- `public.profiles` and the admin/editor/viewer roles
- active/inactive staff access
- append-only `public.audit_logs`
- server-only `public.campaign_enrollment_claims` idempotency records

The broad tables in `supabase/migrations/001_initial_schema.sql` describe an earlier or future Supabase-backed model. They do not mean live leads, nurture activity, clinic metrics, or advertising analytics have moved out of Airtable.

The current Audit Log reads plural `public.audit_logs`. Singular `public.audit_log` in `supabase/auth_full_setup.sql` is legacy.

### Make.com is my external automation layer

I use two different Make.com workflows:

1. The public lead form uses `NEXT_PUBLIC_MAKE_WEBHOOK_URL` to hand new patient inquiries to Speed-to-Lead automation.
2. Google Ads publishing uses server-only `MAKE_PUBLISH_AD_WEBHOOK_URL` to request creation of a paused responsive search ad.

These webhooks must never be merged or used as fallbacks. Sending an ad payload to the lead webhook could create a false patient record and trigger patient communication.

### Google is a reporting source and execution platform

I read much of the normalized reporting data from Airtable. The live Google Ads REST integration provides current workspace inventory and selected write operations, including campaign status and keyword changes.

I also built a Google Business Profile client and routes for reviews, replies, performance insights, and local posts. That area remains hidden until the required API access and correct account/location IDs are configured.

### Anthropic powers my implemented AI features

I use Anthropic for:

- performance-aware responsive search ad suggestions
- quick ads based on a crawl of the Harmony website
- treatment/audience/offer ad drafts
- Google Business review reply drafts
- Google Business post drafts

The environment example lists `OPENAI_API_KEY`, but the current AI route handlers use Anthropic.

## 4. Authentication, roles, and security

I built defense-in-depth authentication:

- Middleware refreshes Supabase sessions for protected route matchers.
- Every protected server page uses `requirePageAuth` or an equivalent server check.
- API routes use `requireRole` and verify the user through Supabase Auth.
- The client AuthProvider is for presentation; it is not the authorization authority.
- Missing Supabase configuration fails closed for protected pages and mutations.
- Inactive profiles are denied access.

My roles are:

- **admin**: full operational access, staff management, Audit Log, campaign enrollment administration, ad publishing, and sensitive Google Ads actions
- **editor**: operational updates, lead deletion, clinic metrics, and selected AI/write features
- **viewer**: read dashboard and advertising data

The exact API handler role is authoritative. UI permission gates are only an experience layer.

I also added security headers, server-only service credentials, hardened profile RLS, append-only audit logs, email/phone masking, audit sanitization, optional IP hashing, transient auth retries, and self-protection so an admin cannot demote, deactivate, or delete their own account through staff management.

I have not deployed a complete strict Content Security Policy. The current CSP only blocks framing. A full CSP must first be tested with Supabase Auth, Google OAuth, charts, fonts, and images.

## 5. The product areas I built

### Overview: `/dashboard`

I built the Overview as the live Growth Command Center. It supports Last 7 Days, Last 30 Days, Last 90 Days, and This Month, with the range stored in the URL.

It includes:

- Total Leads, Contacted, Replied, Booked, Booking Conversion, and Average Speed-to-Lead KPIs
- previous-period comparisons and sparklines
- patient growth trend
- lead conversion funnel
- lead-source performance
- 14-Day Nurture journey distribution
- campaign health for Speed-to-Lead and 14-Day Nurture
- SMS and email delivery health
- visits and new-patient totals
- Google Ads spend, clicks, conversions, CPA/CPL, ROAS, and top performers
- operational activity by day
- recent activity
- current attention signals

Attention signals cover failed SMS/email, disconnected enrollments, overdue nurture steps, new leads not contacted within 15 minutes, missing contact information, and duplicates. Failed SMS review stays current even when the analytics range changes.

Each section has its own empty, unavailable, error, and retry state so one integration failure does not erase the page.

### Leads: `/leads`

I built Leads as a live Airtable operational workspace with:

- cursor pagination and page sizes 20, 30, and 50
- overlapping All Leads, Replied, and Booked views
- full-dataset summaries independent of the visible page
- search by name, email, or phone
- status, source, date, SMS, email, campaign, campaign-status, and nurture-step filters
- newest/oldest sorting
- URL persistence for filters, cursors, page state, view, and selected lead
- desktop tables and mobile cards
- lead detail, communication history, campaign membership, and journey timeline
- status and replied-state updates
- editing core contact fields and notes
- manual lead creation
- CSV import up to 500 rows per request in batches of 10
- filter-aware CSV export capped at 10,000 records
- duplicate detection using Airtable flags plus normalized phone/email
- delete-impact checks against Message Log and Nurture Enrollments
- Clinic Metrics updates
- adding eligible leads to 14-Day Nurture

My current operational statuses are New, Contacted, Booked, Duplicate, Failed, and Not Interested.

### Campaigns: `/campaigns`

I consolidated the main automation experience under Campaigns. I register two live campaigns:

1. **Speed-to-Lead**: automatic immediate email and SMS response for new website leads.
2. **14-Day Nurture**: manual multi-step follow-up for leads who have not booked or replied.

Campaign cards show status, channels, totals, active/completed leads, messages sent, campaign-specific metrics, and recent activity.

### Campaign detail: `/campaigns/[campaignSlug]`

I built Overview, Leads, and Conversations tabs.

For Speed-to-Lead, I report processed leads, first-contact performance, delivery activity, replies, bookings, and conversations.

For 14-Day Nurture, I built:

- enrollment KPIs and a step funnel
- search, status, and current-step filters
- responsive enrollment views
- scheduled bulk enrollment of existing leads
- creation and enrollment of new leads in the same flow
- CSV enrollment import
- explicit SMS-permission verification
- New York wall-clock scheduling converted to canonical UTC
- rejection of past, invalid, ambiguous fall-back, and nonexistent spring-forward times
- duplicate, already-enrolled, and ineligible-lead handling
- persistent Supabase idempotency claims with an in-memory fallback
- per-row retry classification so completed rows are not duplicated
- manual stop actions that retain history
- detection, review, reconnection, and removal of disconnected enrollments
- lead-grouped conversations and delivery history

The sequence is Day 1 SMS, Day 3 Email, Day 5 SMS, Day 8 Email, and Day 12 SMS.

### Blogs: `/blogs`

I built an Airtable-backed editorial CMS inside the dashboard. Viewers can browse and inspect articles; admins and editors can create, edit, save drafts, and manually publish or unpublish. The editor supports paragraphs, H2/H3 headings, bulleted and numbered lists, quotes, image blocks, and structured FAQs. Images use stable public HTTP(S) URLs with alt text and optional captions; there is no required featured-image field and no author or medical-reviewer profile system.

Entering a primary keyword prepares editable technical SEO suggestions, while the writer still creates the article and manually confirms publication. The saved package includes slug, SEO title, meta description, canonical preview, Open Graph data, BlogPosting schema, breadcrumbs, sitemap eligibility, related links, and CTA. FAQs remain visible article content and do not generate separate FAQPage schema.

The reviewed launch package is `content/blog-drafts.json`. It contains five evergreen, 1,000-plus-word articles with six FAQs each, permanent images, source URLs, and medical-claim safeguards. All five were imported and verified as Airtable Draft records on August 7, 2026. The import script and authenticated UI importer are idempotent by slug and force Draft status.

The public website is the separate sibling project `D:\HarmonyDashboard\harmony-medspa`, deployed at `https://harmony-medspa.vercel.app`. It keeps all legacy static blog pages and merges new Published Airtable articles into `/blog`. The dynamic `/blog/[slug]` route generates metadata, canonical, Open Graph/Twitter data, BlogPosting and BreadcrumbList JSON-LD, visible article blocks/FAQs, related links, and CTA. Its visual markup deliberately copies the established legacy blog-detail template: typewriter hero and H2 headings, lede image placement, article typography, flat numbered FAQs, image-backed sidebar cards, responsive layout, and standard footer. Do not redesign existing legacy pages or the blog list when changing CMS rendering. Published records enter `sitemap.xml`; Draft records never render publicly.

Manual publish, update, and unpublish actions call the website's authenticated `/api/blogs/revalidate` endpoint. The public site also has a five-minute cache fallback. The dashboard reports a warning rather than a false success when the public refresh is unavailable. Production requires server-side Airtable variables in the website project and the same strong `BLOG_REVALIDATE_SECRET` in both Vercel projects. Content creation and publishing are never automated.

### Google Ads: `/google-ads-analytics`

I built a relational workspace with Overview, Campaigns, Ad Groups, Ads, Keywords, Publishing, and AI Suggestions tabs.

It supports 7-, 14-, 30-, and 90-day windows and combines Airtable reporting snapshots with live Google Ads inventory/actions. It includes mobile cards, desktop tables, bounded page sizes, filters, sorting, URL-backed navigation, nested entity detail routes, history requests, and secondary inventory loading.

Metrics include spend, impressions, clicks, CTR, conversions, CPA/CPL, ROAS when conversion value exists, budgets, quality score, policy/approval status, and last synchronization time.

### Website Analytics: `/website-analytics`

I built a viewer-protected GA4 reporting workspace that queries the Google Analytics Data API directly with a two-minute server cache. It supports 7-, 14-, 30-, and 90-day windows and preserves the selected range and hostname in the URL.

It reports active and new visitors, sessions, page views, engagement rate, bounce rate, average engagement time, `generate_lead` events, visit-to-lead rate, daily trends, acquisition sources/campaigns, devices, top pages, and tracked web streams.

The hostname selector separates the legacy `www.harmonymedspafl.com` site from `harmony-medspa.vercel.app` even when both send data to the same GA4 property. If separate web streams are used, the workspace also surfaces stream names and IDs. Until the numeric property ID and read-only service-account credentials are configured, the page renders an actionable setup state instead of failing.

### Audit Log: `/audit-log`

I built an admin-only Supabase activity viewer with server pagination, search, detailed filters, summary cards, desktop/mobile layouts, sanitized before/after details, safe metadata, and CSV export capped at 5,000 records.

The audit layer covers authentication, staff management, account events, lead mutations, campaign actions, clinic metrics, exports, advertising actions, integrations, and failures.

### Settings: `/settings`

I changed Settings from a local integration mockup into authenticated account and staff management.

All users can choose Light/Dark/System appearance, view their verified profile and role, update their display name, change their password after current-password verification, and review account dates.

Admins can search, add, edit, activate/deactivate, reset passwords for, and delete staff. Staff identity lives in Supabase Auth and profiles, not browser storage. Theme preference is the intentional local-storage exception.

### Login: `/login`

I built a responsive themed login over a Harmony waiting-room image with email/password sign-in, password visibility, inactive-account messaging, requested-route return, loading/error states, and login auditing.

### Public lead form: `/lead`

I built a public capture page separate from the authenticated shell. It collects name, US phone, email, treatment interest, optional message, UTM values, page URL, and timestamp.

It validates email and US phone format, uses a honeypot, submits an Airtable-shaped payload to the lead Make webhook, fires Google Ads conversion tracking, and redirects to PatientNow booking. It has a separate warm white/gold style.

### Google Business Profile: `/google-business`

I built Reviews, Local Insights, and GBP Posts:

- Reviews show ratings, dates, replies, response rate, and rating distribution. Editors can draft a Claude reply and post it.
- Local Insights show searches, views, calls, directions, website clicks, and photo views.
- GBP Posts generate, edit, and publish Standard, Offer, or Event posts.

I intentionally keep it out of the sidebar until API approval, a dedicated business.manage token, and different account/location IDs are ready. Restoration steps are in `docs/google-business-profile.md`.

## 6. My Google Ads and AI workflow

My AI Suggestions route summarizes selected-period campaigns, creatives, and keywords and asks Anthropic for up to 15 headlines, four descriptions, display paths, target keywords, optimization insights, bid/budget advice, and a top-performer summary. The UI supports review, editing, and promotion into publishing. Browser-stored suggestion history is convenience state, not authoritative data.

I also built an hourly quick-ad generator that audits the public Harmony website and a treatment/audience/offer draft modal.

Pending ad packages live in Airtable and support multiple assets, optional pins, live campaign/ad-group selection, URLs/paths, keywords and negatives, factual approval checklists, notes, phone/call-asset validation, and lifecycle history.

Before publishing, I validate Google RSA limits, required assets, ad-group identity, pin conflicts, phone safety, and factual approvals.

Only admins publish. The dashboard sends an idempotent request to the dedicated Make webhook and requests a **PAUSED** responsive search ad. Publication is verified only with a valid Google resource name, PAUSED status, publication time, publisher, and no error. Retry, return-to-review, fail, and result-acknowledgment flows are audited.

A one-off reconciliation route exists for historically published ads. I treat it as legacy operational code and do not build new workflows around it without a security review.

## 7. My visual and interaction system

I designed the application as a premium medical-spa operations product, not a default SaaS theme.

The visual system uses Inter, occasional serif campaign display type, warm gold accents, restrained teal and blue, off-white/stone light surfaces, graphite dark surfaces, rounded cards, subtle borders, soft elevation, tabular numbers, Lucide icons, and Recharts.

The canonical tokens are in `src/app/globals.css`. Light is the default. Light, Dark, and System preferences use the key `harmony-dashboard-theme`.

I built a fixed 240px desktop sidebar, mobile drawer, sticky header, safe-area support, focus restoration, Escape-to-close behavior, reduced motion, mobile cards for dense data, and desktop tables with local rather than page-level horizontal scrolling.

Some older large components still use hard-coded dark colors. Global CSS contains compatibility overrides. New changes should move those components toward semantic variables rather than add more overrides.

## 8. Reliability, performance, and testing

I added short-lived client caching, navigation-intent preloading, explicit refresh events, and Overview refresh on revisit/visibility. Resilient network helpers handle transient failures and timeouts. Airtable writes respect ten-record batches. Large workflows return structured partial results.

The tests cover:

- API authorization coverage
- Airtable batching and enrollment idempotency
- New York dates and DST-safe scheduling
- campaign progress logic
- lead views, summaries, and duplicates
- Google Ads normalization, IDs, inventory merging, and responsive contracts
- GA4 normalization, hostname separation, rate calculations, and responsive route contracts
- conversion tracking
- pending-ad limits, pinning, approvals, phone rules, and webhook separation
- blog SEO generation, FAQ validation, draft-package integrity, authorization, and manual publication state

My standard verification is:

```bash
npm test
npm run lint
npm run build
```

## 9. What is hidden, redirected, legacy, or planned

### Hidden but implemented

- Google Business Profile is built but absent from navigation.

### Compatibility redirects

- `/google-ads` → `/google-ads-analytics`
- `/ai-insights` → Google Ads AI Suggestions
- `/nurture` → 14-Day Nurture Overview
- `/message-log` and `/message-logs` → 14-Day Nurture Conversations
- `/settings/users` → `/settings`

Older standalone Message Logs and Nurture components remain, but their page URLs are no longer independent primary experiences.

### Legacy/cautionary areas

- Singular `public.audit_log` is legacy; current code uses plural `audit_logs`.
- The broad initial Supabase migration is not the current operational source for most pages.
- `src/lib/mock-data.ts` and generic UI types preserve earlier/scaffolded concepts.
- `frontend-design.skill` is a packaged binary artifact, not this project context.
- The one-off ad reconciliation route contains historical assumptions.
- `content.md` and `FUTURE_PAGES.md` are useful history, but code wins when they disagree.

### Planned/scaffolded areas

- dormant-patient reactivation
- rebooking reminders
- referrals and rewards
- a broader cross-funnel AI Insights center
- expanded clinic/integration configuration
- a deliberate future migration of more operations from Airtable to Supabase

## 10. Where I am now

I am past the prototype stage. The core dashboard has real authentication, roles, live Airtable operations, campaign management, a manual blog CMS connected to the public website, Google Ads reporting and publishing, a GA4 Website Analytics workspace ready for credentials, staff administration, audit history, responsive layouts, themes, and tests.

My current work is production hardening and integration completion:

- keep Airtable mappings and automation aligned with code
- finish and verify deployment environment configuration
- configure the website's Airtable variables and the shared blog revalidation secret in Vercel before the first production publication
- maintain security and audit coverage
- reduce hard-coded legacy styles
- verify paused-ad publishing end to end through Make and Google result fields
- restore Google Business only after API/OAuth/account configuration
- decide deliberately where future workflows should live
- keep documentation synchronized with actual routes

## 11. How I want another AI to work

I want another AI to inspect the actual page wrapper, client, API route, supporting libraries, and tests before editing. I do not want it to rebuild from future prompts or assume every Supabase table is live.

I want it to preserve these principles:

- server authorization is mandatory
- secrets stay server-side
- Airtable and Supabase have different current ownership
- lead submission and ad publishing use different webhooks
- new ads are paused and require human approval
- campaign times are New York times with UTC storage
- direct URLs preserve operational state
- dense desktop tables need usable mobile equivalents
- one integration failure should not destroy unrelated sections
- audit events must be sanitized and useful
- changes need loading, empty, error, unavailable, permission, and success states
- tests should protect fragile business rules

When explaining this project, write in first person and clearly label what I built, what is hidden, what redirects, what is legacy, and what comes next.
