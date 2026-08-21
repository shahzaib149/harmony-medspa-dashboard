# Harmony website + dashboard monorepo

This repository contains both Next.js applications:

- `/` is the dashboard application.
- `/website` is the public marketing website.

They remain separate Next.js zones so dashboard authentication, APIs, and dependencies cannot destabilize the public site. The website proxies dashboard routes, APIs, auth callbacks, and assets, keeping visitors on one public domain.

## Local development

Install both apps once with `npm run install:all`. Then run these commands in separate terminals:

```powershell
npm run dev:dashboard
npm run dev:website
```

Open `http://localhost:3001/dashboard`. It is proxied to the dashboard running on port 3000.

## Vercel deployment

Connect this one GitHub repository to two Vercel projects:

1. Dashboard zone: repository root directory `/`.
2. Public website: root directory `website`.

Set `DASHBOARD_ORIGIN=https://<dashboard-project>.vercel.app` on the website project. Set `NEXT_PUBLIC_APP_URL=https://<your-custom-domain>` on the dashboard project so OAuth callbacks use the public domain. Attach the purchased domain only to the website project.

## Verification

Run `npm run build:all`, then verify `/`, `/dashboard`, dashboard login, `/api/blogs/*`, `/api/auth/*`, and `/api/airtable/*` on the final domain.
