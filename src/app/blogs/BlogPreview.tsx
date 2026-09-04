"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Eye,
  FilePenLine,
  Link2,
  Loader2,
  Send,
} from "lucide-react";
import { useMemo, useState } from "react";
import { blogSiteUrl, validateBlog } from "@/lib/blogs/seo";
import { type BlogContentBlock, type BlogRecord, type BlogTextBlock } from "@/lib/blogs/types";
import BlogImage from "@/app/blogs/BlogImage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Toast } from "@/components/ui/Toast";

function textLines(value: string) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}


function formatArticleDate(value: string | null) {
  if (!value) return "Not published yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}
function PreviewBlock({ block }: { block: BlogContentBlock }) {
  if (block.type === "heading2") return <h2>{block.text}</h2>;
  if (block.type === "heading3") return <h3>{block.text}</h3>;
  if (block.type === "bulleted-list") {
    return <ul>{textLines(block.text).map((line, index) => <li key={`${block.id}-${index}`}>{line}</li>)}</ul>;
  }
  if (block.type === "numbered-list") {
    return <ol>{textLines(block.text).map((line, index) => <li key={`${block.id}-${index}`}>{line}</li>)}</ol>;
  }
  if (block.type === "quote") return <blockquote>{block.text}</blockquote>;
  if (block.type === "image") {
    if (!block.url) return null;
    return (
      <figure>
        <BlogImage url={block.url} alt={block.alt} />
        {block.caption && <figcaption>{block.caption}</figcaption>}
      </figure>
    );
  }
  if (block.type === "faq") {
    const items = block.items.filter((item) => item.question.trim() || item.answer.trim());
    if (!items.length) return null;
    return (
      <section className="blog-preview-faq" aria-labelledby={`faq-${block.id}`}>
        <h2 id={`faq-${block.id}`}>Frequently asked questions</h2>
        <div>
          {items.map((item) => (
            <article key={item.id}>
              <h3>{item.question || "Untitled question"}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    );
  }
  return <p>{block.text}</p>;
}

export default function BlogPreview({
  blog: initialBlog,
  canEdit,
  siteUrl,
}: {
  blog: BlogRecord;
  canEdit: boolean;
  siteUrl?: string;
}) {
  const router = useRouter();
  const [blog, setBlog] = useState(initialBlog);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState<{ variant: "success" | "warning" | "danger"; message: string } | null>(null);
  const publicUrl = `${blogSiteUrl(siteUrl)}/blog/${blog.slug}`;
  const published = blog.status === "Published";
  const publishInput = useMemo(() => ({
    title: blog.title,
    slug: blog.slug,
    status: "Published" as const,
    primaryKeyword: blog.primaryKeyword,
    category: blog.category,
    tags: blog.tags,
    excerpt: blog.excerpt,
    content: blog.content,
    seoTitle: blog.seoTitle,
    metaDescription: blog.metaDescription,
    relatedServiceUrl: blog.relatedServiceUrl,
    relatedArticleUrls: blog.relatedArticleUrls,
    ctaLabel: blog.ctaLabel,
    ctaUrl: blog.ctaUrl,
  }), [blog]);
  const publishValidation = useMemo(() => validateBlog(publishInput), [publishInput]);

  function requestPublish() {
    if (publishValidation.errors.length) {
      setToast({ variant: "danger", message: `This draft needs attention before publishing: ${publishValidation.errors[0]}` });
      return;
    }
    setConfirmPublish(true);
  }

  async function publishArticle() {
    setPublishing(true);
    try {
      const response = await fetch(`/api/airtable/blogs/${blog.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(publishInput),
      });
      const body = await response.json() as { blog?: BlogRecord; error?: string; publicationSync?: { ok: boolean; message?: string } };
      if (!response.ok || !body.blog) throw new Error(body.error || "Article could not be published.");
      setBlog(body.blog);
      setConfirmPublish(false);
      setToast(body.publicationSync && !body.publicationSync.ok
        ? { variant: "warning", message: `Published in Airtable, but the website refresh is pending. ${body.publicationSync.message || "Please check the publishing connection."}` }
        : { variant: "success", message: "Article published and the public website was refreshed." });
      router.refresh();
    } catch (error) {
      setToast({ variant: "danger", message: error instanceof Error ? error.message : "Article could not be published." });
    } finally {
      setPublishing(false);
    }
  }
  const featuredImage = blog.content.find(
    (block): block is Extract<BlogContentBlock, { type: "image" }> => block.type === "image" && Boolean(block.url),
  ) || null;
  const ledeBlock = blog.content.find(
    (block): block is BlogTextBlock => block.type === "paragraph" && Boolean(block.text.trim()),
  ) || null;
  const bodyBlocks = blog.content.filter((block) => block.id !== featuredImage?.id && block.id !== ledeBlock?.id);

  return (
    <div className="blog-studio blog-preview space-y-4">
      <div className="blog-preview-toolbar">
        <Link href="/blogs" className="blog-back-link"><ArrowLeft size={17} /> Blog library</Link>
        <div className="blog-preview-actions">
          {canEdit && !published && (
            <button type="button" className="blog-preview-action" data-action="publish" disabled={publishing} onClick={requestPublish}>
              {publishing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} {publishing ? "Publishing…" : "Publish article"}
            </button>
          )}
          {canEdit && (
            <Link href={`/blogs/${blog.id}/edit`} className="blog-preview-action" data-action="edit">
              <FilePenLine size={16} /> Edit article
            </Link>
          )}
          {published && (
            <a className="blog-preview-action" data-action="published" href={publicUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={16} /> Open published URL
            </a>
          )}
        </div>
      </div>

      <div className="blog-preview-notice" data-status={blog.status.toLowerCase()}>
        <Eye size={17} />
        <div>
          <strong>{published ? "Dashboard preview of the published article" : "Dashboard-only draft preview"}</strong>
          <span>{published ? "Use the published URL to check the live website version." : "This draft is not visible on the public website."}</span>
        </div>
      </div>

      <dl className="blog-preview-dates" aria-label="Article dates">
        <div><dt>Created</dt><dd>{formatArticleDate(blog.createdAt)}</dd></div>
        <div><dt>Last updated</dt><dd>{formatArticleDate(blog.updatedAt)}</dd></div>
        <div data-published={published || undefined}><dt>Published</dt><dd>{formatArticleDate(blog.publishedAt)}</dd></div>
      </dl>

      <div className="blog-preview-url-card">
        <span><Link2 size={15} /> {published ? "Published URL" : "Planned URL"}</span>
        {published ? (
          <a href={publicUrl} target="_blank" rel="noreferrer">{publicUrl}<ExternalLink size={13} /></a>
        ) : (
          <code>{publicUrl}</code>
        )}
      </div>

      <article className="blog-preview-paper blog-preview-paper--simple" aria-label="Lightweight website preview">
        <header className="blog-simple-preview-hero">
          <span>Harmony Med Spa · Blog preview</span>
          <h1>{(blog.title || "Untitled article").toLowerCase()}</h1>
        </header>

        <div className="blog-preview-content">
          {(ledeBlock || featuredImage) && (
            <div className="blog-simple-preview-lede">
              <div>{ledeBlock ? <p>{ledeBlock.text}</p> : blog.excerpt ? <p>{blog.excerpt}</p> : null}</div>
              {featuredImage && (
                <figure>
                  <BlogImage url={featuredImage.url} alt={featuredImage.alt} />
                  {featuredImage.caption && <figcaption>{featuredImage.caption}</figcaption>}
                </figure>
              )}
            </div>
          )}
          {bodyBlocks.length > 0
            ? bodyBlocks.map((block) => <PreviewBlock key={block.id} block={block} />)
            : !ledeBlock && !featuredImage
              ? <p className="blog-preview-empty">No article content has been added yet.</p>
              : null}
        </div>

        {(blog.ctaLabel && blog.ctaUrl) && (
          <footer className="blog-preview-cta">
            <p>Ready to take the next step?</p>
            <a href={blog.ctaUrl} target="_blank" rel="noreferrer">{blog.ctaLabel}<ExternalLink size={14} /></a>
          </footer>
        )}
      </article>

      {toast && <Toast variant={toast.variant} message={toast.message} onClose={() => setToast(null)} />}
      <ConfirmDialog
        open={confirmPublish}
        title="Publish this article?"
        description="This will publish the draft and refresh the public Harmony website."
        confirmLabel="Publish article"
        loading={publishing}
        loadingLabel="Publishing…"
        onCancel={() => setConfirmPublish(false)}
        onConfirm={() => void publishArticle()}
      >
        {publishValidation.warnings.length > 0 ? (
          <div><p className="font-bold">Review these reminders:</p><ul className="mt-2 list-disc space-y-1 pl-5">{publishValidation.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div>
        ) : (
          <p>The article has passed publishing validation and is ready to go live.</p>
        )}
      </ConfirmDialog>
    </div>
  );
}
