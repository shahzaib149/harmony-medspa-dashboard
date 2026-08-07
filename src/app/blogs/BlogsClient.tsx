"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  FileText,
  Loader2,
  PackagePlus,
  PenLine,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { BlogSummary } from "@/lib/blogs/types";

function formatDate(value: string | null) {
  if (!value) return "Not published";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function StatusBadge({ status }: { status: BlogSummary["status"] }) {
  const published = status === "Published";
  return (
    <span className="blog-status-badge" data-status={status.toLowerCase()}>
      <span className="blog-status-dot" aria-hidden="true" />
      {published ? "Published" : "Draft"}
    </span>
  );
}

export default function BlogsClient({ canManage }: { canManage: boolean }) {
  const [blogs, setBlogs] = useState<BlogSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [category, setCategory] = useState("All");
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/airtable/blogs", { cache: "no-store" });
      const body = await response.json() as { blogs?: BlogSummary[]; error?: string };
      if (!response.ok) throw new Error(body.error || "Blog articles could not be loaded.");
      setBlogs(body.blogs || []);
    } catch (event) {
      setError(event instanceof Error ? event.message : "Blog articles could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const importLaunchDrafts = useCallback(async () => {
    if (!window.confirm("Import the five reviewed launch articles as Airtable drafts? Existing slugs will be skipped.")) return;
    setImporting(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/airtable/blogs/import", { method: "POST" });
      const body = await response.json() as { created?: BlogSummary[]; skipped?: string[]; error?: string };
      if (!response.ok) throw new Error(body.error || "Launch drafts could not be imported.");
      setNotice(`Imported ${body.created?.length || 0} drafts${body.skipped?.length ? `; skipped ${body.skipped.length} existing article(s)` : ""}.`);
      await load();
    } catch (event) {
      setError(event instanceof Error ? event.message : "Launch drafts could not be imported.");
    } finally {
      setImporting(false);
    }
  }, [load]);

  const categories = useMemo(
    () => [...new Set(blogs.map((blog) => blog.category).filter(Boolean))].sort(),
    [blogs],
  );
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return blogs.filter((blog) =>
      (status === "All" || blog.status === status)
      && (category === "All" || blog.category === category)
      && (!needle || `${blog.title} ${blog.primaryKeyword} ${blog.category} ${blog.slug}`.toLowerCase().includes(needle)),
    );
  }, [blogs, category, query, status]);

  const counts = {
    all: blogs.length,
    published: blogs.filter((blog) => blog.status === "Published").length,
    drafts: blogs.filter((blog) => blog.status === "Draft").length,
  };

  return (
    <div className="blog-studio blog-library space-y-4 sm:space-y-5">
      <section className="blog-library-hero">
        <div className="blog-library-intro">
          <p className="blog-eyebrow"><BookOpenText size={13} /> Editorial desk</p>
          <h2 className="blog-display-title">Create useful answers. Publish with control.</h2>
          <p className="blog-library-copy">
            Write every article by hand, connect it to a real Harmony service, and let the dashboard handle the repetitive technical SEO.
          </p>
          {canManage && (
            <div className="blog-library-actions">
              <Link href="/blogs/new" className="blog-primary-action"><Plus size={16} /> Create article</Link>
              <button type="button" className="blog-secondary-action" disabled={importing} onClick={() => void importLaunchDrafts()}>
                {importing ? <Loader2 className="animate-spin" size={16} /> : <PackagePlus size={16} />}
                {importing ? "Importing drafts" : "Import launch drafts"}
              </button>
            </div>
          )}
          {notice && <p className="blog-import-notice" role="status">{notice}</p>}
        </div>

        <div className="blog-library-ledger" aria-label="Blog library summary">
          <div className="blog-ledger-cell">
            <span className="blog-ledger-label">Library</span>
            <strong>{counts.all}</strong>
            <small>Total articles</small>
          </div>
          <div className="blog-ledger-cell blog-ledger-cell--live">
            <span className="blog-ledger-label">Live</span>
            <strong>{counts.published}</strong>
            <small>Published</small>
          </div>
          <div className="blog-ledger-cell blog-ledger-cell--draft">
            <span className="blog-ledger-label">In progress</span>
            <strong>{counts.drafts}</strong>
            <small>Drafts</small>
          </div>
          <div className="blog-ledger-note">
            <Sparkles size={16} />
            <span><strong>Technical SEO</strong><small>Prepared, never auto-published</small></span>
          </div>
        </div>
      </section>

      <section className="blog-filter-bar" aria-label="Filter blog articles">
        <div className="blog-filter-heading">
          <span>Article queue</span>
          <small>{visible.length} {visible.length === 1 ? "article" : "articles"}</small>
        </div>
        <label className="blog-search-field">
          <Search aria-hidden="true" size={16} />
          <input
            aria-label="Search blog articles"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, keyword, or slug"
          />
        </label>
        <select aria-label="Blog status" value={status} onChange={(event) => setStatus(event.target.value)} className="blog-filter-select">
          <option>All</option>
          <option>Draft</option>
          <option>Published</option>
        </select>
        <select aria-label="Blog category" value={category} onChange={(event) => setCategory(event.target.value)} className="blog-filter-select blog-filter-select--category">
          <option>All</option>
          {categories.map((item) => <option key={item}>{item}</option>)}
        </select>
      </section>

      {loading ? (
        <div className="blog-queue-shell space-y-0" aria-label="Loading blog articles">
          {[1, 2, 3].map((item) => <div key={item} className="blog-row-skeleton animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="blog-message-state blog-message-state--error">
          <p className="font-bold">The blog library is not ready yet.</p>
          <p>{error}</p>
          <button onClick={() => void load()}>Retry</button>
        </div>
      ) : visible.length === 0 ? (
        <div className="blog-message-state">
          <span className="blog-empty-mark"><PenLine size={23} /></span>
          <p className="blog-eyebrow">{blogs.length ? "No matches" : "Your editorial queue is clear"}</p>
          <h2 className="blog-display-subtitle">{blogs.length ? "Try a different filter." : "Begin with the question patients are already asking."}</h2>
          <p>{blogs.length ? "Change the search, status, or category to see more articles." : "Enter a primary keyword, write the answer manually, then publish when it is ready."}</p>
          {canManage && blogs.length === 0 && (
            <Link href="/blogs/new" className="blog-primary-action"><Plus size={16} /> Create first article</Link>
          )}
        </div>
      ) : (
        <section className="blog-queue-shell" aria-label="Blog article queue">
          <div className="blog-queue-header" aria-hidden="true">
            <span>Article and search intent</span><span>Category</span><span>Status</span><span>Last edited</span><span />
          </div>
          <div className="blog-queue-list">
            {visible.map((blog) => (
              <Link key={blog.id} href={`/blogs/${blog.id}`} className="blog-article-row" data-status={blog.status.toLowerCase()}>
                <span className="blog-row-status-rail" aria-hidden="true" />
                <div className="blog-article-primary">
                  <div className="blog-article-heading">
                    <span className="blog-article-icon"><FileText size={16} /></span>
                    <div className="min-w-0">
                      <h2>{blog.title || "Untitled article"}</h2>
                      <p className="blog-technical-text">/blog/{blog.slug || "untitled"} · {blog.wordCount.toLocaleString()} words</p>
                    </div>
                    <span className="blog-mobile-status"><StatusBadge status={blog.status} /></span>
                  </div>
                  <div className="blog-intent-line">
                    <span>Primary keyword</span>
                    <strong>{blog.primaryKeyword || "Not set"}</strong>
                  </div>
                </div>
                <div className="blog-row-meta" data-label="Category"><span>{blog.category || "Uncategorized"}</span></div>
                <div className="blog-desktop-status"><StatusBadge status={blog.status} /></div>
                <div className="blog-row-meta blog-row-date" data-label="Last edited">
                  <span>{formatDate(blog.updatedAt)}</span>
                  {blog.updatedBy && <small>by {blog.updatedBy}</small>}
                </div>
                <span className="blog-row-open" aria-hidden="true"><ArrowRight size={17} /></span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
