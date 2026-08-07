# Airtable setup for the Harmony blog CMS

The dashboard stores only newly created blog articles in Airtable. The 29 legacy `.html` articles are not imported or changed by this table.

## Base and table configuration

The current base was verified on August 7, 2026. Its `Blogs` table ID is `tbltyc852o1xnmyEi`, its schema matches this document, and the five launch articles are already stored there as Drafts.

By default, Blogs uses `AIRTABLE_LEADS_BASE_ID` so it can live beside the existing Leads and Nurture tables. To use a different base, set `AIRTABLE_BLOGS_BASE_ID`.

Set either `AIRTABLE_BLOGS_TABLE_ID` to the Airtable table ID or `AIRTABLE_BLOGS_TABLE_NAME=Blogs` to use the table name. The table ID takes priority.

## Required fields

Create a `Blogs` table with these exact fields:

| Field | Airtable type | Notes |
| --- | --- | --- |
| Title | Single line text | Make this the primary field. |
| Slug | Single line text | The dashboard enforces uniqueness. |
| Status | Single select | Options: `Draft`, `Published`. |
| Primary Keyword | Single line text | Drives technical SEO suggestions. |
| Category | Single line text | Keeps categories editable. |
| Created At | Date with time | Written by the dashboard. |
| Updated At | Date with time | Written on every save. |
| Published At | Date with time | Set on first manual publication. |
| Created By | Single line text | Dashboard user name or email. |
| Updated By | Single line text | Dashboard user name or email. |
| CMS Data | Long text | Stores the structured article, SEO fields, links, tags, and CTA as JSON. |

The Airtable token needs record read/write access to this base. The dashboard never creates or changes the Airtable schema automatically.

For a copy-paste Airtable Omni setup request, use `docs/airtable-blogs-omni-prompt.md`.

## Images

There is no required featured image. Editors add image blocks using a stable public `https://` URL, alt text, and an optional caption. The public website uses the first article image for cards and social previews, then uses a Harmony fallback when an article has no images.

The five launch images are permanent website assets under `public/images/blogs/harmony-editorial`. Future computer-upload support is intentionally deferred until permanent public image storage is selected; this avoids temporary Airtable attachment URLs in SEO metadata.

## FAQs

Editors can add an optional structured FAQ block anywhere in the article. Each
block stores manually written question-and-answer pairs in `CMS Data`, supports
reordering, and contributes to the article word count and publishing checks.
The public website should render these questions visibly for readers. The
technical SEO package remains `BlogPosting`; it does not create separate
`FAQPage` rich-result schema.

## Production site URL

Set `NEXT_PUBLIC_SITE_URL` to the public website origin. When the custom domain is connected, update it so canonical URLs, Open Graph data, breadcrumbs, schema, and sitemap previews use the final domain.

Set the same `BLOG_REVALIDATE_SECRET` in the dashboard and website projects. After a manual publish, update, or unpublish, the dashboard calls the website's authenticated revalidation endpoint so the public library and sitemap refresh promptly.
