---
name: harmony-dashboard-context
description: Understand, explain, maintain, and extend the Harmony MedSpa Growth Command Center and its Airtable-backed blog publishing connection to the public Harmony website. Use when working in the harmony-medspa-dashboard repository; onboarding an AI with no project history; describing what has been built and what remains; changing pages, components, APIs, Airtable mappings, blog CMS or SEO publishing workflows, Supabase auth/RBAC/audit behavior, Google Ads or Google Business integrations, Make.com workflows, AI features, responsive design, themes, tests, or deployment configuration.
---

# Harmony Dashboard Context

Treat this skill as the project-specific operating manual for the Harmony MedSpa dashboard.

## Start every task

1. Read [project-context.md](references/project-context.md) for the first-person product history, architecture, current state, and design intent.
2. Read [route-data-map.md](references/route-data-map.md) when the task touches a page, API route, database table, integration, permission, or specific source file.
3. Inspect the current repository before editing. Treat source code as authoritative when it differs from older prose such as `content.md`, `FUTURE_PAGES.md`, or integration notes.
4. Preserve unrelated user changes and never expose `.env.local` values or service credentials.

## Preserve these system boundaries

- Keep Airtable as the live source of truth for leads, Message Log records, nurture enrollments, clinic metrics, new CMS blog articles, Google Ads reporting, live campaign/ad-group inventory, and pending ad reviews unless the user explicitly authorizes a migration.
- Keep Supabase as the source of truth for authentication, `profiles`, roles, active/inactive access, `audit_logs`, and `campaign_enrollment_claims`.
- Keep the two Make.com webhooks separate. `NEXT_PUBLIC_MAKE_WEBHOOK_URL` is only for public lead capture. `MAKE_PUBLISH_AD_WEBHOOK_URL` is only for publishing paused Google responsive search ads.
- Treat server-side `requirePageAuth` and `requireRole` checks as the authorization authority. Client permission gates are presentation only.
- Keep campaign scheduling anchored to `America/New_York`, validate UTC round trips, and preserve DST ambiguity/nonexistent-time rejection.
- Preserve Airtable batch limits, cursor pagination, idempotency claims, safe retry behavior, and sanitized audit logging.
- Publish new responsive search ads as `PAUSED`, never enabled by default.

## Follow the established implementation style

- Use Next.js App Router server page wrappers with client components for interactive workspaces.
- Reuse `DashboardLayout`, CSS variables from `src/app/globals.css`, existing UI primitives, responsive mobile-card/desktop-table patterns, and light/dark/system themes.
- Preserve URL-backed filters, tabs, date ranges, pagination, and selected entities when the current page supports them.
- Provide section-level loading, empty, unavailable, error, and retry states so one integration failure does not blank the whole dashboard.
- Add or update tests for pure domain logic, authorization coverage, normalization, scheduling, batching, and responsive contracts.
- Run `npm test`, `npm run lint`, and `npm run build` in proportion to the change.

## Distinguish current from future work

- Treat Overview, Leads, Campaigns, Blogs, Google Ads, Settings, Audit Log, login, and the public lead form as current product areas.
- Treat Google Business Profile as implemented but intentionally hidden until API access and correct account/location configuration are ready.
- Treat `/nurture`, `/message-log`, `/message-logs`, `/google-ads`, `/ai-insights`, and `/settings/users` as compatibility redirects, not independent primary experiences.
- Treat dormant-patient reactivation, rebooking reminders, referrals, broader Supabase operational storage, and a standalone cross-funnel AI insights center as planned/scaffolded unless current code proves otherwise.

## Explain the project in the owner's voice

When asked for a handoff, project brief, prompt, or explanation for another AI:

- Write in first person, using “I built,” “I use,” “I want,” and “I am currently.”
- Explain business purpose before technical structure.
- State what is live, hidden, redirected, legacy, scaffolded, or planned.
- Include source-of-truth boundaries, roles, integrations, safety constraints, verification commands, and the most relevant file paths.
- Do not claim a feature is live merely because a schema, type, mock, or future-page prompt exists.

## Update this skill

After material architecture or product-state changes, update the relevant reference instead of duplicating details in this file. Refresh the verification date and validate the folder with the skill-creator `quick_validate.py` script.
