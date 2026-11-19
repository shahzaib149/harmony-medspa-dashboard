# Harmony Med Spa CRM dashboard ("Growth Command Center")

Repo `shahzaib149/harmony-medspa-dashboard`. Live at https://crm.harmonymedspafl.com (Vercel, deploys on push to `main`). Workspace-wide context, rules and restore steps are in [../CLAUDE.md](../CLAUDE.md). Updated 2026-11-19.

Deeper references, dated Aug 27 2026 and partly stale; the code wins:
- `docs/HARMONY_MEDSPA_PROJECT_CONTEXT.md` (untracked, local only)
- `skills/harmony-dashboard-context/` (SKILL.md, references/project-context.md, route-data-map.md)

## What it is
Staff CRM for Harmony Med Spa. It covers:
- Leads (form plus Call Leads tab)
- Overview KPIs
- Campaigns (nurture/reactivation)
- Google Ads workspace
- Website analytics (GA4)
- Blogs CMS, which publishes to the website via Airtable plus revalidate
- AEO report (`/aeo`, read-only)
- Audit log and settings
- Google Business, implemented but hidden

## Stack
- Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, recharts, exceljs, luxon, googleapis, `@anthropic-ai/sdk`
- Supabase: auth, `profiles` roles, `audit_logs`, `campaign_enrollment_claims`. Migrations are in `supabase/migrations`.
- Airtable is the source of truth for everything else.
  - Leads base `appNL010pW9LUpgST`: Leads, Calls `tbl81JwtzjS2wFRLD`, Message Log, Blogs, AEO tables.
  - Google Ads base `appGumYdPTtL5GW6M`.
- Make.com: blueprint copies are in `automation/make/`. They may be stale vs live; the user edits Speed-to-Lead in the UI.

## Commands
```bash
npm install
npm run build -- --webpack          # then preview with launch config "dashboard-prod" (:3001)
npm test                            # tsx --test tests/*.test.ts
npm run lint
npx tsc --noEmit -p tsconfig.json --incremental false   # build ignores type errors; ~8 min
npm run setup:calls-table           # idempotent Airtable Calls table setup
npm run import:blog-drafts
node scripts/google-ads-sync-summary.mjs --last-sync     # read-only Ads/leads/calls summary
```
- Avoid `npm run dev`: it hangs while compiling. Node pins conflict: `.nvmrc` says 22, `.node-version` says 24.18.0. 22 works locally.
- **Deploy:** `git push origin main`. Ask the user first, every time.

## Folder map
- `src/app/`: pages (`leads`, `dashboard`, `campaigns`, `google-ads-analytics`, `website-analytics`, `blogs`, `aeo`, `audit-log`, `settings`, `login`, `unsubscribe`) and `api/`. `/nurture`, `/message-log(s)`, `/google-ads`, `/ai-insights` and `/settings/users` are redirects.
- `src/lib/leads/`: `map-lead.ts` (Airtable to Lead), `classification.ts` (`countsAsRealLead`, based on Lead Type, never the Is Real Lead checkbox), `query.ts` (filter formulas), `view.ts`, `summary.ts`
- `src/lib/google/`:
  - `campaign-registry.ts`: CS2–CS6 campaigns, utm codes, `makeMapped`
  - `ads-airtable.ts`, `ads-aggregate.ts`, `ads-tables.ts`: the Ads workspace reads Airtable only
- `src/lib/overview-data.ts`: Overview KPIs. `src/lib/reactivation/`: dormant patients.
- `src/lib/supabase/middleware.ts` + `middleware.ts`: auth. The `?next=` redirect keeps deep links (`?call=`, `?lead=`).
- `automation/`: Make blueprints, READMEs (`README-daily-call-import.md` holds the Make formula rules) and email templates.
- `content/`: blog batch scripts and reports. Per batch it holds the audit → build → check → link-check → patch scripts and a `*-DRAFT-REPORT.md`.
- `scripts/`, `tests/` (pure domain logic tests; `tests/fixtures/airtable-ad-group-formula.txt` snapshots an Airtable formula), `supabase/`, `docs/`

## Rules
- **Work only on `main`.** Never create or suggest a branch. Commit only your own files. Leave the uncommitted blueprint/README edits and the `*.tmp` files alone.
- Server-side `requirePageAuth` / `requireRole` is the authority; client gates are cosmetic.
- Keep the two Make webhooks separate:
  - `NEXT_PUBLIC_MAKE_WEBHOOK_URL` is for leads.
  - `MAKE_PUBLISH_AD_WEBHOOK_URL` is for ads.
- New ads are published PAUSED.
- Campaign times are anchored to America/New_York.
- No silent fallbacks: the Overview shows a section error if the Calls read fails.
- `/aeo` is a read-only client report. No data-entry UI and no process words like "imported" or "synced". Use a quiet light design.
- Never rename Call IDs; leads link to calls via `[Call lead: <id>]`.
- `/api/calls/sync` (admin or `CRON_SECRET`) is never run by Claude. Do a dry run first.

## Status
- Production `2c47773` (Nov 18). Local `main` is 4 commits behind: run `git pull --ff-only` before working.
- The remote branch `claude/tender-sagan-1cbs0u` has 1 unmerged commit, "Archive November 2026 blog draft batch". Whether it is still wanted is unknown; ask me.
- Known gaps:
  - `map-lead.ts` ignores Offer Code.
  - `AddLeadsToCampaignModal` uses the unreliable Is Real Lead checkbox.
  - The lead PATCH uses `typecast: true`, so new Status text creates Airtable options.
  - There is a hard-coded bypass secret in `api/admin/reconcile-published-ads`.

## Gotchas
- **Hydration:** `useAuth` returns the signed-out server snapshot while hydrating. Keep role-gated UI consistent with that.
- `.next/dev/types/routes.d.ts` can corrupt when two dev servers run. Fix it with `next typegen`.
- `html { overflow-x: clip }` hides overflow from `scrollWidth`. Measure the elements themselves.
- The Google Ads API returns 403 locally: it is disabled in GCP project 715756478631. v21 is dead; use v23.

## Env vars (names only)
- **From `.env.example`:**
  - Airtable: `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `AIRTABLE_LEADS_BASE_ID`, `AIRTABLE_BLOGS_BASE_ID`, `AIRTABLE_BLOGS_TABLE_ID`, `AIRTABLE_BLOGS_TABLE_NAME`, `AIRTABLE_CALLS_TABLE_ID`
  - AI: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`
  - Secrets: `BLOG_REVALIDATE_SECRET`, `CRON_SECRET`
  - GA4: `GA4_PROPERTY_ID`, `GA4_SERVICE_ACCOUNT_EMAIL`, `GA4_SERVICE_ACCOUNT_PRIVATE_KEY`
  - Google Ads: `GOOGLE_ADS_API_VERSION`, `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_CUSTOMER_ID`, `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_MCC_ID`, `GOOGLE_ADS_REFRESH_TOKEN`
  - Google Business: `GOOGLE_BUSINESS_ACCOUNT_ID`, `GOOGLE_BUSINESS_LOCATION_ID`
  - Mailchimp: `MAILCHIMP_API_KEY`, `MAILCHIMP_SERVER_PREFIX`
  - Make: `MAKE_NOTIFY_HAYDEN_WEBHOOK_URL`, `MAKE_WEBHOOK_SECRET`, `NEXT_PUBLIC_MAKE_WEBHOOK_URL`
  - Public URLs and IDs: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID`, `NEXT_PUBLIC_GOOGLE_ADS_LEAD_SEND_TO`, `NEXT_PUBLIC_PATIENTNOW_BOOKING_URL`
  - Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - Reactivation: `REACTIVATION_UNSUBSCRIBE_BASE_URL`, `REACTIVATION_UNSUBSCRIBE_SECRET`
- **Only in the local `.env.local`:** `MAKE_PUBLISH_AD_WEBHOOK_URL`, `AIRTABLE_PATIENTS_TABLE_ID`, `AIRTABLE_REACTIVATION_ENROLLMENTS_TABLE_ID`
- **Not set locally:** `CRON_SECRET`, `MAKE_WEBHOOK_SECRET`, `AIRTABLE_CALLS_TABLE_ID`, `AIRTABLE_BLOGS_*`
