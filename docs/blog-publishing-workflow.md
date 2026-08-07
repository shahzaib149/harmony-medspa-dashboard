# Harmony blog publishing workflow

## Source of truth

- Airtable `Blogs` is the source of truth for new CMS articles.
- The dashboard can create and edit Draft or Published records.
- The public website reads only records whose `Status` is exactly `Published`.
- The legacy static blog pages remain available and continue to appear in the blog library.

## Draft import

The reviewed launch package is stored at `content/blog-drafts.json`. It contains five complete articles, all with `status: Draft`.

As of August 7, 2026, all five package articles have already been imported into the current Airtable base and verified as Draft records. The import controls remain available for safe recovery or use in another environment.

After the Airtable table exists, an editor can open `/blogs` and select **Import launch drafts**. The server checks existing slugs, creates only missing records, forces every imported article to Draft, and records the action in the dashboard audit log.

## Manual publication

1. An admin or editor opens a draft in the dashboard.
2. The dashboard validates title, slug, primary keyword, excerpt, SEO fields, content, image URLs, and FAQs.
3. The user manually confirms **Publish article**.
4. Airtable is updated to `Status = Published` and receives `Published At` on first publication.
5. The dashboard calls the public website's authenticated revalidation endpoint.
6. The website purges its published-blog cache, adds the article to `/blog`, serves `/blog/{slug}`, and includes the URL in `sitemap.xml`.

Moving the record back to Draft follows the same revalidation path, causing the dynamic article to return 404 and disappear from the CMS portion of the blog index and sitemap.

## Shared environment variables

Set these on both Vercel projects:

- `AIRTABLE_API_KEY`
- `AIRTABLE_BLOGS_BASE_ID`
- `AIRTABLE_BLOGS_TABLE_ID` (preferred) or `AIRTABLE_BLOGS_TABLE_NAME=Blogs`
- `NEXT_PUBLIC_SITE_URL=https://harmony-medspa.vercel.app`

Set the same strong random value on both projects:

- `BLOG_REVALIDATE_SECRET`

The Airtable token is used only by server-side code. Never expose it with a `NEXT_PUBLIC_` prefix.
