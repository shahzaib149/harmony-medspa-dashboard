"use client";

import Link from "next/link";
import {
  Archive,
  ArchiveRestore,
  ArrowRight,
  BookOpenText,
  Check,
  ChevronDown,
  ExternalLink,
  FilePenLine,
  FileText,
  MoreHorizontal,
  PenLine,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Toast } from "@/components/ui/Toast";
import { blogSiteUrl } from "@/lib/blogs/seo";
import type { BlogSummary } from "@/lib/blogs/types";
import { useBlogLifecycle, type BlogLifecycleTarget } from "./useBlogLifecycle";

const STATUS_FILTERS = ["Active", "Published", "Draft", "Archived", "All"] as const;

function matchesStatus(filter: string, status: BlogSummary["status"]) {
  if (filter === "All") return true;
  if (filter === "Active") return status !== "Archived";
  return status === filter;
}

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
  return (
    <span className="blog-status-badge" data-status={status.toLowerCase()}>
      <span className="blog-status-dot" aria-hidden="true" />
      {status}
    </span>
  );
}

function RowActions({ blog, canDelete, publicUrl, onRequest }: {
  blog: BlogSummary;
  canDelete: boolean;
  publicUrl: string;
  onRequest: (action: "archive" | "restore" | "delete", target: BlogLifecycleTarget) => void;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const placeMenu = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = 228;
    const openAbove = window.innerHeight - rect.bottom < 240 && rect.top > 240;
    setPosition({
      position: "fixed",
      zIndex: 100,
      width,
      left: Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12)),
      top: openAbove ? "auto" : rect.bottom + 6,
      bottom: openAbove ? window.innerHeight - rect.top + 6 : "auto",
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
    const closeOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    };
    const closeOnKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const close = () => setOpen(false);
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", closeOnKey);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("keydown", closeOnKey);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  const choose = (action: "archive" | "restore" | "delete") => {
    setOpen(false);
    onRequest(action, { id: blog.id, title: blog.title, slug: blog.slug, status: blog.status });
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="blog-row-menu-trigger"
        aria-label={`Actions for ${blog.title || "untitled article"}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => { if (!open) placeMenu(); setOpen((current) => !current); }}
      >
        <MoreHorizontal size={17} />
      </button>
      {open && createPortal(
        <div ref={menuRef} className="blog-row-menu" style={position} role="menu" aria-label="Article actions">
          <Link role="menuitem" href={`/blogs/${blog.id}/edit`} className="blog-row-menu-item"><FilePenLine size={15} /><span>Edit article</span></Link>
          {blog.status === "Published" && (
            <a role="menuitem" href={publicUrl} target="_blank" rel="noreferrer" className="blog-row-menu-item"><ExternalLink size={15} /><span>View on website</span></a>
          )}
          {blog.status === "Published" && (
            <button role="menuitem" type="button" className="blog-row-menu-item" onClick={() => choose("archive")}>
              <Archive size={15} /><span>Archive<small>Hide from website, keep here</small></span>
            </button>
          )}
          {blog.status === "Archived" && (
            <button role="menuitem" type="button" className="blog-row-menu-item" onClick={() => choose("restore")}>
              <ArchiveRestore size={15} /><span>Restore and publish<small>Live again at the same URL</small></span>
            </button>
          )}
          {canDelete && (
            <>
              <span className="blog-row-menu-divider" role="separator" />
              <button role="menuitem" type="button" className="blog-row-menu-item" data-tone="danger" onClick={() => choose("delete")}>
                <Trash2 size={15} /><span>Delete permanently<small>Cannot be undone</small></span>
              </button>
            </>
          )}
        </div>,
        document.body,
      )}
    </>
  );
}

function CategoryFilter({ value, options, counts, onChange }: {
  value: string;
  options: string[];
  counts: Record<string, number>;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const items = ["All", ...options];

  const placeMenu = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.max(rect.width, 272);
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const openAbove = spaceBelow < 340 && spaceAbove > spaceBelow;
    const available = Math.max(180, (openAbove ? spaceAbove : spaceBelow) - 8);
    setPosition({
      position: "fixed",
      zIndex: 100,
      left: Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12)),
      right: "auto",
      width,
      maxHeight: Math.min(420, available),
      top: openAbove ? "auto" : rect.bottom + 8,
      bottom: openAbove ? window.innerHeight - rect.top + 8 : "auto",
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    };
    const closeOnScroll = () => setOpen(false);
    document.addEventListener("mousedown", closeOutside);
    window.addEventListener("resize", placeMenu);
    window.addEventListener("scroll", closeOnScroll, true);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      window.removeEventListener("resize", placeMenu);
      window.removeEventListener("scroll", closeOnScroll, true);
    };
  }, [open, placeMenu]);

  return (
    <div className="blog-category-filter" ref={rootRef}>
      <button ref={triggerRef} type="button" className="blog-category-trigger" aria-label="Blog category" aria-haspopup="listbox" aria-expanded={open} onClick={() => { if (!open) placeMenu(); setOpen((current) => !current); }} onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}>
        <span className="blog-category-trigger-copy"><strong>{value === "All" ? "All categories" : value}</strong></span>
        <span className="blog-category-trigger-meta"><b>{counts[value] ?? 0}</b><ChevronDown size={15} aria-hidden="true" /></span>
      </button>
      {open && createPortal(
        <div ref={menuRef} className="blog-category-menu" style={position} role="listbox" aria-label="Filter by blog category">
          <div className="blog-category-menu-heading"><span>Category</span><span>Articles</span></div>
          {items.map((item) => {
            const selected = item === value;
            return (
              <button type="button" role="option" aria-selected={selected} className="blog-category-option" data-selected={selected || undefined} key={item} onClick={() => { onChange(item); setOpen(false); }}>
                <span><i aria-hidden="true">{selected ? <Check size={13} /> : null}</i>{item === "All" ? "All categories" : item}</span>
                <b>{counts[item] ?? 0}</b>
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
}
export default function BlogsClient({ canManage, canDelete, siteUrl }: { canManage: boolean; canDelete: boolean; siteUrl?: string }) {
  const [blogs, setBlogs] = useState<BlogSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("Active");
  const [category, setCategory] = useState("All");
  const [toast, setToast] = useState<{ variant: "success" | "warning" | "danger"; message: string } | null>(null);
  const lifecycle = useBlogLifecycle({
    onToast: setToast,
    onChanged: (blog) => setBlogs((current) => current.map((item) => item.id === blog.id
      ? { ...item, status: blog.status, updatedAt: blog.updatedAt, updatedBy: blog.updatedBy, publishedAt: blog.publishedAt }
      : item)),
    onDeleted: (id) => setBlogs((current) => current.filter((item) => item.id !== id)),
  });
  const publicBase = blogSiteUrl(siteUrl);

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

  const categories = useMemo(
    () => [...new Set(blogs.map((blog) => blog.category).filter(Boolean))].sort(),
    [blogs],
  );
  const categoryCounts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matching = blogs.filter((blog) =>
      matchesStatus(status, blog.status)
      && (!needle || `${blog.title} ${blog.primaryKeyword} ${blog.category} ${blog.slug}`.toLowerCase().includes(needle)),
    );
    return matching.reduce<Record<string, number>>((totals, blog) => {
      totals.All = (totals.All || 0) + 1;
      const item = blog.category || "Uncategorized";
      totals[item] = (totals[item] || 0) + 1;
      return totals;
    }, { All: 0 });
  }, [blogs, query, status]);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return blogs.filter((blog) =>
      matchesStatus(status, blog.status)
      && (category === "All" || blog.category === category)
      && (!needle || `${blog.title} ${blog.primaryKeyword} ${blog.category} ${blog.slug}`.toLowerCase().includes(needle)),
    );
  }, [blogs, category, query, status]);

  const counts = {
    active: blogs.filter((blog) => blog.status !== "Archived").length,
    published: blogs.filter((blog) => blog.status === "Published").length,
    drafts: blogs.filter((blog) => blog.status === "Draft").length,
    archived: blogs.filter((blog) => blog.status === "Archived").length,
  };
  const archiveEmpty = status === "Archived" && !query.trim() && category === "All";

  return (
    <div className="blog-studio blog-library space-y-4 sm:space-y-5">
      {toast && <Toast variant={toast.variant} message={toast.message} onClose={() => setToast(null)} />}
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
            </div>
          )}
        </div>

        <div className="blog-library-ledger" aria-label="Blog library summary">
          <div className="blog-ledger-cell">
            <span className="blog-ledger-label">Library</span>
            <strong>{counts.active}</strong>
            {counts.archived ? (
              <button type="button" className="blog-ledger-archived" onClick={() => setStatus("Archived")}>
                Active · {counts.archived} archived
              </button>
            ) : <small>Active articles</small>}
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
          {STATUS_FILTERS.map((item) => (
            <option key={item} value={item}>
              {item === "Active" ? "Live + drafts" : item === "All" ? "All, incl. archived" : item}
            </option>
          ))}
        </select>
        <CategoryFilter value={category} options={categories} counts={categoryCounts} onChange={setCategory} />
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
          <p className="blog-eyebrow">{archiveEmpty ? "Archive is empty" : blogs.length ? "No matches" : "Your editorial queue is clear"}</p>
          <h2 className="blog-display-subtitle">{archiveEmpty ? "No archived articles." : blogs.length ? "Try a different filter." : "Begin with the question patients are already asking."}</h2>
          <p>{archiveEmpty ? "Archived articles are hidden from the website and kept here so they can be restored." : blogs.length ? "Change the search, status, or category to see more articles." : "Enter a primary keyword, write the answer manually, then publish when it is ready."}</p>
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
              <div key={blog.id} className="blog-article-item" data-actions={canManage || undefined}>
              <Link href={`/blogs/${blog.id}`} className="blog-article-row" data-status={blog.status.toLowerCase()}>
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
              {canManage && (
                <RowActions
                  blog={blog}
                  canDelete={canDelete}
                  publicUrl={`${publicBase}/blog/${blog.slug}`}
                  onRequest={lifecycle.request}
                />
              )}
              </div>
            ))}
          </div>
        </section>
      )}
      {lifecycle.dialog}
    </div>
  );
}
