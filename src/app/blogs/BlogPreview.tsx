import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Eye,
  FilePenLine,
  Link2,
} from "lucide-react";
import { blogSiteUrl } from "@/lib/blogs/seo";
import { imageSourceForSite, type BlogContentBlock, type BlogRecord, type BlogTextBlock } from "@/lib/blogs/types";

function textLines(value: string) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageSourceForSite(block.url)} alt={block.alt} />
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
  blog,
  canEdit,
  siteUrl,
}: {
  blog: BlogRecord;
  canEdit: boolean;
  siteUrl?: string;
}) {
  const publicUrl = `${blogSiteUrl(siteUrl)}/blog/${blog.slug}`;
  const published = blog.status === "Published";
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageSourceForSite(featuredImage.url)} alt={featuredImage.alt} />
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
    </div>
  );
}
