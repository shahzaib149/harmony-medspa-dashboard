# Medical Weight Loss Landing Page — Build Prompt

Design and build a high-converting, mobile-first landing page for Harmony Med Spa's medically supervised weight-loss program in Sarasota, Florida.

## The job

The page has one primary job: move a high-intent paid-search visitor from uncertainty to a consultation request. It should answer three questions immediately: Is this medical care? Who will care for me? What happens after I submit?

## Audience and voice

Write for Sarasota adults who have tried to manage their weight and are evaluating professional help. They may be curious about GLP-1 medication, but they do not want a sales pitch or a one-size-fits-all promise. Use calm, specific, medically responsible language. Never promise a result, imply medication is right for everyone, use fake scarcity, or call the consultation free.

## Visual thesis

“Clinical precision without clinical coldness.” Match Harmony's black, white, and brass identity, but avoid a generic cream-and-serif med-spa template. Use a crisp porcelain field, deep carbon panels, restrained brass accents, editorial image crops, and compact utility typography. The signature device is a thin brass care-path line that connects the real patient sequence: Evaluate → Personalize → Monitor.

## Page architecture

1. A slim, premium header with the Harmony mark, phone number, and one consultation CTA.
2. An asymmetric hero: an editorial provider consultation image carries the emotional thesis; a clean conversion form remains visible above the fold on desktop.
3. A compact trust rail: board-certified NP care, Sarasota location, and ongoing follow-up.
4. A plain-language explanation of how medically supervised care differs from a template program.
5. The three-stage care pathway, using the brass progress trace as structure rather than decoration.
6. A provider feature for Jessica Simone, AGNP-C, using the real site portrait and verified credentials.
7. A concise list of what an individualized program may include, with appropriate qualification.
8. A real, relevant patient testimonial and an individual-results disclaimer.
9. Three useful medical weight-loss articles already published on the site.
10. Focused FAQs, a final consultation CTA, a minimal local footer, and a mobile sticky action bar.

## Conversion and engineering requirements

- Keep the existing Make.com webhook through `CONTACT_WEBHOOK_URL`.
- Preserve attribution fields, including both `utm_ad_group` and legacy `utm_adgroup` spellings.
- Fire the Google Ads lead conversion once and only after a successful webhook response.
- Keep name and phone required; keep email and preferred callback time optional.
- Provide clear validation, loading, success, and failure states.
- Use semantic landmarks, visible focus styles, meaningful alt text, and reduced-motion support.
- Use existing website imagery and content; do not invent outcomes, credentials, ratings, prices, or program inclusions.
- Make the page excellent at 360px, 768px, 1440px, and wide desktop sizes.

## Final self-check

Remove anything that looks like a reusable landing-page kit: floating blobs, generic icon grids, oversized fake statistics, repetitive rounded cards, empty slogans, or decorative animation. Every section must either build trust, explain the care, answer an objection, or move the visitor toward contact.
