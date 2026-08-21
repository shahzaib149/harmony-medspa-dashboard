# Harmony Med Spa Website

Marketing website for [Harmony Med Spa](https://harmonymedspafl.com), a medical spa and wellness center in Sarasota, Florida. Built with Next.js (App Router), React, and TypeScript.

## Getting Started

```bash
npm install
npm run dev      # start the dev server at http://localhost:3000
npm run build    # production build
npm start        # serve the production build
```

## Project Structure

```
app/                  Routes only (App Router). Each folder is a page.
components/
  layout/             SiteHeader, SiteFooter, nav dropdowns (shared chrome)
  home/               Homepage sections (hero carousel, services grid, providers)
  forms/              ContactForm, MembershipForm (submit to the Make.com webhook)
  team/               Team listing + provider bio modal
  ui/                 Small reusable widgets (typewriter text, payment calculator)
lib/
  constants.ts        Single source of truth: address, phones, booking URL, webhook URL
  data/               Structured content (providers, before/after galleries)
public/images/        Optimized site images served by the app
Images/               Raw source assets (not used by the app)
```

Import shared code with the `@/` alias, e.g. `import SiteHeader from "@/components/layout/SiteHeader"`.

## Key Integrations

- **Online booking** — every "Book Now" CTA links to PatientNow (`ONLINE_BOOKING_URL` in `lib/constants.ts`).
- **Lead capture** — contact and membership forms POST JSON to a Make.com webhook (`CONTACT_WEBHOOK_URL` in `lib/constants.ts`), including UTM parameters and page URL.

## Conventions

- Pages in `app/` compose shared components; the site header/footer live in `components/layout/` — do not copy header/footer markup into pages.
- Business facts (address, phone, hours, external URLs) belong in `lib/constants.ts`, never hardcoded in pages.
- All styling lives in `app/globals.css` using plain CSS classes.
