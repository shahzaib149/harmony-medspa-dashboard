# Harmony blog dashboard design prompt

Redesign the existing Harmony Med Spa blog dashboard as a focused editorial
workspace for administrators and editors. Its single job is to move a manually
written article from a primary keyword to a confident, manual publication.

Preserve every existing workflow and data contract. Do not add content
generation, automatic publishing, authors, medical reviewers, or a required
featured image. Technical SEO preparation remains the automation boundary.

## Visual direction

Create an "editorial desk" that feels native to Harmony: clinically calm,
precise, quietly premium, and operational rather than decorative. Avoid a
generic SaaS card grid, an over-styled luxury landing page, glassmorphism,
excessive gradients, and ornamental animation.

Use this compact token direction:

- Porcelain — `#F5F6F3`: workspace background
- Ink — `#1A1D1F`: primary editorial text
- Slate — `#4F595F`: supporting information
- Antique gold — `#8A651E`: Harmony actions and editorial emphasis
- Treatment teal — `#1E766F`: completed and healthy states
- Paper — `#FFFFFF`: focused writing surfaces

Keep these colors mapped to the dashboard's existing light/dark design tokens.
Use an editorial display stack (`Iowan Old Style`, `Palatino Linotype`,
`Georgia`) for important article and workspace titles, the existing system sans
stack for controls and body copy, and a restrained monospace stack for URLs,
schema, counts, and technical labels.

## Signature element

Use one memorable structural element: a four-stage editorial runway — Brief,
Write, Optimize, Publish. It is not decoration; each stage reflects a real
completion state derived from the article. Keep everything around it quiet.

## Library structure

- Open with an editorial-desk introduction and a compact library ledger.
- Treat filters as one coherent toolbar.
- Present articles as a legible editorial queue, with title and keyword taking
  priority over system metadata.
- Make Draft and Published unmistakable without relying on color alone.
- Provide a purposeful empty state and clear primary creation action.
- On mobile, turn each article row into a comfortable card with no horizontal
  scrolling and keep all tap targets at least 44px.

## Editor structure

- Show the editorial runway before the form.
- Make the primary keyword the clear starting point and explain the automation
  boundary in one sentence.
- Separate Brief, Article draft, Conversion path, Publish, and Technical SEO
  into a natural hierarchy.
- Keep the writing column generous and the publish/SEO rail sticky only on wide
  screens.
- Treat content blocks like a composed article outline, not unrelated cards.
- Include a structured, manually written FAQ block with reorderable questions
  and answers; keep it part of the visible article rather than promising FAQ
  rich-result schema.
- On mobile, keep save/publish actions reachable in a bottom action dock without
  covering content or safe-area controls.
- Use restrained hover/focus feedback and respect reduced-motion preferences.

The result should feel more professional and visually authored, but never more
complicated to operate.
