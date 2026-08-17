"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookOpenText,
  Check,
  ChevronRight,
  CircleHelp,
  Code2,
  Eye,
  Heading2,
  Heading3,
  ImagePlus,
  List,
  ListOrdered,
  Loader2,
  MessageSquareQuote,
  Plus,
  Save,
  SearchCheck,
  Send,
  Trash2,
  Type,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Toast } from "@/components/ui/Toast";
import {
  DEFAULT_BLOG_CATEGORIES,
  blogSiteUrl,
  buildBlogTechnicalSeo,
  prepareSeoSuggestions,
  validateBlog,
} from "@/lib/blogs/seo";
import {
  imageSourceForSite,
  type BlogBlockType,
  type BlogContentBlock,
  type BlogInput,
  type BlogRecord,
  type BlogStatus,
} from "@/lib/blogs/types";

type Props = {
  mode: "new" | "edit";
  recordId?: string;
  canEdit: boolean;
  siteUrl?: string;
};

const EMPTY_BLOG: BlogInput = {
  title: "",
  slug: "",
  status: "Draft",
  primaryKeyword: "",
  category: "",
  tags: [],
  excerpt: "",
  content: [
    { id: "intro", type: "paragraph", text: "" },
    {
      id: "faqs",
      type: "faq",
      items: [
        { id: "faq-1", question: "", answer: "" },
        { id: "faq-2", question: "", answer: "" },
        { id: "faq-3", question: "", answer: "" },
      ],
    },
  ],
  seoTitle: "",
  metaDescription: "",
  relatedServiceUrl: "",
  relatedArticleUrls: [],
  ctaLabel: "Book a consultation",
  ctaUrl: "",
};

const BLOCK_OPTIONS: Array<{ type: BlogBlockType; label: string; Icon: typeof Type }> = [
  { type: "paragraph", label: "Paragraph", Icon: Type },
  { type: "heading2", label: "Heading 2", Icon: Heading2 },
  { type: "heading3", label: "Heading 3", Icon: Heading3 },
  { type: "bulleted-list", label: "Bullets", Icon: List },
  { type: "numbered-list", label: "Numbered", Icon: ListOrdered },
  { type: "quote", label: "Quote", Icon: MessageSquareQuote },
  { type: "image", label: "Image", Icon: ImagePlus },
  { type: "faq", label: "Frequently asked questions", Icon: CircleHelp },
];

const ARTICLE_BLOCK_OPTIONS = BLOCK_OPTIONS.filter(({ type }) => type !== "faq");

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `block-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function makeBlock(type: BlogBlockType): BlogContentBlock {
  if (type === "image") return { id: newId(), type, url: "", alt: "", caption: "" };
  if (type === "faq") return {
    id: newId(),
    type,
    items: [{ id: newId(), question: "", answer: "" }],
  };
  return { id: newId(), type, text: "" };
}

function withFaqSection(content: BlogContentBlock[]): BlogContentBlock[] {
  if (content.some((block) => block.type === "faq")) return content;
  return [
    ...content,
    {
      id: newId(),
      type: "faq",
      items: [
        { id: newId(), question: "", answer: "" },
        { id: newId(), question: "", answer: "" },
        { id: newId(), question: "", answer: "" },
      ],
    },
  ];
}

function recordToInput(record: BlogRecord): BlogInput {
  return {
    title: record.title,
    slug: record.slug,
    status: record.status,
    primaryKeyword: record.primaryKeyword,
    category: record.category,
    tags: record.tags,
    excerpt: record.excerpt,
    content: withFaqSection(record.content.length ? record.content : [{ id: "intro", type: "paragraph", text: "" }]),
    seoTitle: record.seoTitle,
    metaDescription: record.metaDescription,
    relatedServiceUrl: record.relatedServiceUrl,
    relatedArticleUrls: record.relatedArticleUrls,
    ctaLabel: record.ctaLabel,
    ctaUrl: record.ctaUrl,
  };
}

function FieldLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <span className="mb-1.5 block text-xs font-extrabold" style={{ color: "var(--text-secondary)" }}>
      {children}{optional && <span className="ml-1 font-medium" style={{ color: "var(--text-muted)" }}>(optional)</span>}
    </span>
  );
}

function Panel({
  eyebrow,
  title,
  description,
  className = "",
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`blog-editor-panel ${className}`.trim()}>
      <header className="blog-panel-header">
        {eyebrow && <p className="blog-eyebrow">{eyebrow}</p>}
        <h2 className="blog-panel-title">{title}</h2>
        {description && <p className="blog-panel-description">{description}</p>}
      </header>
      <div className="blog-panel-body">{children}</div>
    </section>
  );
}

function EditorialRunway({ blog, wordCount }: { blog: BlogInput; wordCount: number }) {
  const stages = [
    {
      label: "Brief",
      detail: "Keyword, title, excerpt",
      complete: Boolean(blog.primaryKeyword.trim() && blog.title.trim() && blog.excerpt.trim()),
    },
    {
      label: "Write",
      detail: "Manual article draft",
      complete: wordCount > 0,
    },
    {
      label: "Optimize",
      detail: "SEO fields and URL",
      complete: Boolean(blog.seoTitle.trim() && blog.metaDescription.trim() && blog.slug.trim()),
    },
    {
      label: "Publish",
      detail: "Manual confirmation",
      complete: blog.status === "Published",
    },
  ];
  const current = stages.findIndex((stage) => !stage.complete);

  return (
    <nav className="blog-editorial-runway" aria-label="Article workflow">
      <ol>
        {stages.map((stage, index) => {
          const state = stage.complete ? "complete" : index === current ? "current" : "upcoming";
          return (
            <li key={stage.label} data-state={state} aria-current={state === "current" ? "step" : undefined}>
              <span className="blog-runway-marker" aria-hidden="true">{stage.complete ? <Check size={14} /> : String(index + 1).padStart(2, "0")}</span>
              <span className="blog-runway-copy"><strong>{stage.label}</strong><small>{stage.detail}</small></span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function ContentBlockEditor({
  block,
  index,
  total,
  disabled,
  onChange,
  onMove,
  onRemove,
}: {
  block: BlogContentBlock;
  index: number;
  total: number;
  disabled: boolean;
  onChange: (block: BlogContentBlock) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  const option = BLOCK_OPTIONS.find((item) => item.type === block.type) || BLOCK_OPTIONS[0];
  const { Icon } = option;

  function updateFaqItem(itemIndex: number, field: "question" | "answer", value: string) {
    if (block.type !== "faq") return;
    onChange({
      ...block,
      items: block.items.map((item, position) => position === itemIndex ? { ...item, [field]: value } : item),
    });
  }

  function moveFaqItem(itemIndex: number, direction: -1 | 1) {
    if (block.type !== "faq") return;
    const target = itemIndex + direction;
    if (target < 0 || target >= block.items.length) return;
    const items = [...block.items];
    [items[itemIndex], items[target]] = [items[target], items[itemIndex]];
    onChange({ ...block, items });
  }

  function removeFaqItem(itemIndex: number) {
    if (block.type !== "faq") return;
    const items = block.items.filter((_, position) => position !== itemIndex);
    onChange({
      ...block,
      items: items.length ? items : [{ id: newId(), question: "", answer: "" }],
    });
  }

  return (
    <article className="blog-content-block" data-type={block.type}>
      <div className="blog-content-block-header">
        <div className="flex min-w-0 items-center gap-2">
          <span className="blog-content-block-icon">
            <Icon size={15} />
          </span>
          <div className="min-w-0">
            <p className="blog-content-block-title">{option.label}</p>
            <p className="blog-content-block-order">{block.type === "faq" ? "AEO / GEO answer section" : `Section ${String(index + 1).padStart(2, "0")}`}</p>
          </div>
        </div>
        {!disabled && block.type !== "faq" && (
          <div className="blog-content-block-actions">
            <button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Move section ${index + 1} up`}><ArrowUp size={15} /></button>
            <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} aria-label={`Move section ${index + 1} down`}><ArrowDown size={15} /></button>
            <button type="button" onClick={onRemove} aria-label={`Remove section ${index + 1}`} data-action="remove"><Trash2 size={15} /></button>
          </div>
        )}
      </div>

      {block.type === "faq" ? (
        <div className="blog-faq-builder">
          <div className="blog-faq-intro">
            <div><strong>Questions patients actually ask</strong><span>Write concise, direct answers. Three to six questions is a useful target.</span></div>
            <span>{block.items.filter((item) => item.question.trim() && item.answer.trim()).length} complete</span>
          </div>
          <div className="blog-faq-list">
            {block.items.map((item, itemIndex) => (
              <section key={item.id} className="blog-faq-item">
                <header>
                  <span>Question {String(itemIndex + 1).padStart(2, "0")}</span>
                  {!disabled && (
                    <div>
                      <button type="button" onClick={() => moveFaqItem(itemIndex, -1)} disabled={itemIndex === 0} aria-label={`Move FAQ question ${itemIndex + 1} up`}><ArrowUp size={14} /></button>
                      <button type="button" onClick={() => moveFaqItem(itemIndex, 1)} disabled={itemIndex === block.items.length - 1} aria-label={`Move FAQ question ${itemIndex + 1} down`}><ArrowDown size={14} /></button>
                      <button type="button" onClick={() => removeFaqItem(itemIndex)} aria-label={`Remove FAQ question ${itemIndex + 1}`} data-action="remove"><Trash2 size={14} /></button>
                    </div>
                  )}
                </header>
                <label>
                  <FieldLabel>Question</FieldLabel>
                  <input disabled={disabled} value={item.question} onChange={(event) => updateFaqItem(itemIndex, "question", event.target.value)} placeholder="Example: How long should I avoid exercise after Botox?" className="h-11 w-full rounded-xl border px-3 text-sm" />
                </label>
                <label>
                  <FieldLabel>Answer</FieldLabel>
                  <textarea disabled={disabled} value={item.answer} onChange={(event) => updateFaqItem(itemIndex, "answer", event.target.value)} rows={4} placeholder="Write a direct, useful answer manually..." className="w-full resize-y rounded-xl border px-3 py-3 text-sm leading-6" />
                </label>
              </section>
            ))}
          </div>
          {!disabled && (
            <button
              type="button"
              className="blog-add-faq"
              disabled={block.items.length >= 12}
              onClick={() => onChange({ ...block, items: [...block.items, { id: newId(), question: "", answer: "" }] })}
            >
              <Plus size={15} /> Add question
            </button>
          )}
          <p className="blog-faq-note">FAQs remain visible article content for readers and answer engines. The CMS does not create separate FAQ rich-result schema.</p>
        </div>
      ) : block.type === "image" ? (
        <div className="blog-image-block-grid">
          <div className="blog-image-block-fields">
            <label>
              <FieldLabel>Public image URL</FieldLabel>
              <input disabled={disabled} type="url" value={block.url} onChange={(event) => onChange({ ...block, url: event.target.value })} placeholder="https://..." className="h-11 w-full rounded-xl border px-3 text-sm" />
            </label>
            <label>
              <FieldLabel>Image alt text</FieldLabel>
              <input disabled={disabled} value={block.alt} onChange={(event) => onChange({ ...block, alt: event.target.value })} placeholder="Describe the image clearly" className="h-11 w-full rounded-xl border px-3 text-sm" />
            </label>
            <label>
              <FieldLabel optional>Caption</FieldLabel>
              <input disabled={disabled} value={block.caption} onChange={(event) => onChange({ ...block, caption: event.target.value })} placeholder="Optional image caption" className="h-11 w-full rounded-xl border px-3 text-sm" />
            </label>
          </div>
          <div className="blog-image-preview">
            {Boolean(block.url) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageSourceForSite(block.url)} alt={block.alt || "Article image preview"} />
            ) : (
              <span><ImagePlus size={22} /><small>Image preview</small></span>
            )}
          </div>
          <p className="blog-image-note">
            No featured image is required. The first article image can support cards and social sharing later.
          </p>
        </div>
      ) : (
        <label className="blog-block-textarea">
          <span className="sr-only">{option.label} content</span>
          <textarea
            disabled={disabled}
            value={block.text}
            onChange={(event) => onChange({ ...block, text: event.target.value })}
            rows={block.type === "paragraph" ? 6 : block.type.includes("list") ? 5 : 3}
            placeholder={block.type.includes("list") ? "Enter one item per line" : block.type === "paragraph" ? "Write this section manually..." : `Enter ${option.label.toLowerCase()}`}
            className="w-full resize-y rounded-xl border px-3 py-3 text-sm leading-7"
          />
        </label>
      )}
    </article>
  );
}

export default function BlogEditor({ mode, recordId, canEdit, siteUrl }: Props) {
  const router = useRouter();
  const [blog, setBlog] = useState<BlogInput>(EMPTY_BLOG);
  const [record, setRecord] = useState<BlogRecord | null>(null);
  const [original, setOriginal] = useState(JSON.stringify(EMPTY_BLOG));
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [issues, setIssues] = useState<string[]>([]);
  const [confirmAction, setConfirmAction] = useState<"publish" | "unpublish" | null>(null);
  const [toast, setToast] = useState<{ variant: "success" | "danger" | "warning" | "info"; message: string } | null>(null);
  const previousSuggestions = useRef({ slug: "", seoTitle: "", metaDescription: "" });
  const configuredSiteUrl = blogSiteUrl(siteUrl);
  const dirty = JSON.stringify(blog) !== original;
  const urlLocked = Boolean(record?.publishedAt);

  const load = useCallback(async () => {
    if (mode !== "edit" || !recordId) return;
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch(`/api/airtable/blogs/${recordId}`, { cache: "no-store" });
      const body = await response.json() as {
        blog?: BlogRecord;
        error?: string;
      };
      if (!response.ok || !body.blog) throw new Error(body.error || "Blog article could not be loaded.");
      const input = recordToInput(body.blog);
      setRecord(body.blog);
      setBlog(input);
      setOriginal(JSON.stringify(input));
      previousSuggestions.current = {
        slug: input.slug,
        seoTitle: input.seoTitle,
        metaDescription: input.metaDescription,
      };
    } catch (event) {
      setLoadError(event instanceof Error ? event.message : "Blog article could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [mode, recordId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const validation = useMemo(() => validateBlog(blog), [blog]);
  const technicalSeo = useMemo(() => buildBlogTechnicalSeo({
    ...blog,
    publishedAt: record?.publishedAt || null,
    updatedAt: record?.updatedAt || "",
  }, configuredSiteUrl), [blog, configuredSiteUrl, record]);

  function patch<K extends keyof BlogInput>(key: K, value: BlogInput[K]) {
    setBlog((current) => ({ ...current, [key]: value }));
  }

  function prepareSeo(force = false) {
    if (!blog.primaryKeyword.trim()) {
      setToast({ variant: "warning", message: "Enter the primary keyword first." });
      return;
    }
    const next = prepareSeoSuggestions(blog.primaryKeyword);
    const previous = previousSuggestions.current;
    setBlog((current) => ({
      ...current,
      slug: urlLocked ? current.slug : force || !current.slug || current.slug === previous.slug ? next.slug : current.slug,
      seoTitle: force || !current.seoTitle || current.seoTitle === previous.seoTitle ? next.seoTitle : current.seoTitle,
      metaDescription: force || !current.metaDescription || current.metaDescription === previous.metaDescription ? next.metaDescription : current.metaDescription,
    }));
    previousSuggestions.current = next;
    setToast({ variant: "info", message: force ? "Technical SEO suggestions refreshed." : "Technical SEO prepared from the primary keyword." });
  }

  function updateBlock(index: number, next: BlogContentBlock) {
    patch("content", blog.content.map((block, position) => position === index ? next : block));
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= blog.content.length) return;
    if (blog.content[index]?.type === "faq" || blog.content[target]?.type === "faq") return;
    const next = [...blog.content];
    [next[index], next[target]] = [next[target], next[index]];
    patch("content", next);
  }

  function removeBlock(index: number) {
    if (blog.content[index]?.type === "faq") return;
    const next = blog.content.filter((_, position) => position !== index);
    patch("content", next.some((block) => block.type !== "faq") ? next : [makeBlock("paragraph"), ...next]);
  }

  function addArticleBlock(type: BlogBlockType) {
    const faqIndex = blog.content.findIndex((block) => block.type === "faq");
    if (faqIndex === -1) {
      patch("content", [...blog.content, makeBlock(type)]);
      return;
    }
    patch("content", [
      ...blog.content.slice(0, faqIndex),
      makeBlock(type),
      ...blog.content.slice(faqIndex),
    ]);
  }

  async function save(status: BlogStatus) {
    const payload = { ...blog, status };
    if (status === "Published") {
      const result = validateBlog(payload);
      if (result.errors.length) {
        setIssues(result.errors);
        setConfirmAction(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    } else if (!payload.title.trim() || !payload.slug.trim()) {
      setIssues([!payload.title.trim() ? "Add an article title before saving." : "Add a URL slug before saving."]);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSaving(true);
    setIssues([]);
    try {
      const endpoint = mode === "edit" && recordId ? `/api/airtable/blogs/${recordId}` : "/api/airtable/blogs";
      const response = await fetch(endpoint, {
        method: mode === "edit" && recordId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json() as {
        blog?: BlogRecord;
        error?: string;
        publicationSync?: { ok: boolean; skipped?: boolean; message?: string };
      };
      if (!response.ok || !body.blog) throw new Error(body.error || "Blog article could not be saved.");
      const input = recordToInput(body.blog);
      setRecord(body.blog);
      setBlog(input);
      setOriginal(JSON.stringify(input));
      setConfirmAction(null);
      const publicSyncFailed = body.publicationSync && !body.publicationSync.ok;
      setToast(publicSyncFailed
        ? {
            variant: "warning",
            message: `${status === "Published" ? "Published in Airtable" : "Saved as a draft"}, but the public website refresh is pending. ${body.publicationSync?.message || "Check the website publishing configuration."}`,
          }
        : {
            variant: "success",
            message: status === "Published" ? "Article published and the public website was refreshed." : "Draft saved to Airtable.",
          });
      if (mode === "new") router.replace(`/blogs/${body.blog.id}`);
      router.refresh();
    } catch (event) {
      setConfirmAction(null);
      setToast({ variant: "danger", message: event instanceof Error ? event.message : "Blog article could not be saved." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="grid min-h-[50vh] place-items-center"><div className="text-center"><Loader2 className="mx-auto animate-spin" size={28} style={{ color: "var(--brand-primary)" }} /><p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>Loading article...</p></div></div>;
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border p-6 text-center" style={{ backgroundColor: "var(--danger-bg)", borderColor: "var(--danger-border)", color: "var(--danger-text)" }}>
        <p className="font-bold">Article could not be opened.</p><p className="mt-2 text-sm">{loadError}</p>
        <button type="button" onClick={() => void load()} className="mt-4 min-h-11 rounded-xl border px-4 text-sm font-bold" style={{ borderColor: "var(--danger-border)" }}>Retry</button>
      </div>
    );
  }

  return (
    <div className="blog-studio blog-editor space-y-4">
      {toast && <Toast variant={toast.variant} message={toast.message} onClose={() => setToast(null)} />}
      <div className="blog-editor-toolbar">
        <div className="blog-editor-toolbar-links">
          <Link href="/blogs" className="blog-back-link"><ArrowLeft size={17} /> Blog library</Link>
          {mode === "edit" && recordId && (
            <Link href={`/blogs/${recordId}`} className="blog-editor-preview-link"><Eye size={16} /> Preview</Link>
          )}
        </div>
        <div className="blog-editor-toolbar-meta">
          {dirty && <span className="blog-unsaved-badge">Unsaved changes</span>}
          <span className="blog-word-count">{validation.wordCount.toLocaleString()} words</span>
        </div>
      </div>

      <section className="blog-document-heading">
        <div className="min-w-0">
          <p className="blog-eyebrow">{mode === "new" ? "New article" : "Editorial workspace"}</p>
          <h2 className="blog-display-title">{blog.title.trim() || "Untitled article"}</h2>
          <p className="blog-document-intent">
            {blog.primaryKeyword.trim() ? <><span>Primary keyword</span><strong>{blog.primaryKeyword}</strong></> : "Begin with the search question this article will answer."}
          </p>
        </div>
        <div className="blog-document-meta">
          <span className="blog-status-badge" data-status={blog.status.toLowerCase()}><span className="blog-status-dot" aria-hidden="true" />{blog.status}</span>
          <code>/blog/{blog.slug || "untitled"}</code>
        </div>
      </section>

      <EditorialRunway blog={blog} wordCount={validation.wordCount} />

      {!canEdit && (
        <div className="rounded-xl border p-4 text-sm" style={{ backgroundColor: "var(--info-bg)", borderColor: "var(--info-border)", color: "var(--info-text)" }}>
          You have read-only access. Editors and administrators can save and publish.
        </div>
      )}

      {issues.length > 0 && (
        <div role="alert" className="rounded-xl border p-4" style={{ backgroundColor: "var(--danger-bg)", borderColor: "var(--danger-border)", color: "var(--danger-text)" }}>
          <div className="flex gap-3"><AlertTriangle className="mt-0.5 shrink-0" size={18} /><div><p className="font-bold">Finish these items first</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{issues.map((issue) => <li key={issue}>{issue}</li>)}</ul></div></div>
        </div>
      )}

      <div className="blog-editor-grid">
        <div className="blog-editor-main">
          <Panel eyebrow="Brief" title="Search intent and article brief" description="Set the question, reader-facing title, and editorial context before writing." className="blog-strategy-panel">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2">
                <FieldLabel>Primary keyword</FieldLabel>
                <div className="blog-keyword-control">
                  <span className="blog-keyword-icon"><SearchCheck size={17} /></span>
                  <input disabled={!canEdit} value={blog.primaryKeyword} onChange={(event) => patch("primaryKeyword", event.target.value)} onBlur={() => prepareSeo(false)} placeholder="Example: Botox aftercare" />
                  <button disabled={!canEdit || !blog.primaryKeyword.trim()} type="button" onClick={() => prepareSeo(true)}><SearchCheck size={16} /> Prepare SEO</button>
                </div>
                <p className="blog-field-note">This prepares technical fields only. The article remains entirely manual.</p>
              </label>
              <label className="md:col-span-2">
                <FieldLabel>Article title</FieldLabel>
                <input disabled={!canEdit} value={blog.title} onChange={(event) => patch("title", event.target.value)} placeholder="Write the reader-facing article title" className="blog-title-field" />
              </label>
              <label>
                <FieldLabel>Category</FieldLabel>
                <input disabled={!canEdit} list="blog-categories" value={blog.category} onChange={(event) => patch("category", event.target.value)} placeholder="Choose or enter a category" className="h-11 w-full rounded-xl border px-3 text-sm" />
                <datalist id="blog-categories">{DEFAULT_BLOG_CATEGORIES.map((item) => <option key={item} value={item} />)}</datalist>
              </label>
              <label>
                <FieldLabel optional>Tags</FieldLabel>
                <input disabled={!canEdit} value={blog.tags.join(", ")} onChange={(event) => patch("tags", event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean))} placeholder="Botox, Aftercare, Sarasota" className="h-11 w-full rounded-xl border px-3 text-sm" />
              </label>
              <label className="md:col-span-2">
                <FieldLabel>Excerpt</FieldLabel>
                <textarea disabled={!canEdit} value={blog.excerpt} onChange={(event) => patch("excerpt", event.target.value)} rows={3} maxLength={600} placeholder="A concise summary for the blog library and search previews" className="w-full rounded-xl border px-3 py-2.5 text-sm leading-6" />
                <span className="mt-1 block text-right text-[10px]" style={{ color: "var(--text-muted)" }}>{blog.excerpt.length}/600</span>
              </label>
            </div>
          </Panel>

          <Panel eyebrow="Write" title="Manual article draft" description="Compose a clear, semantic article. Add optional images where they genuinely help the reader." className="blog-draft-panel">
            <div className="blog-content-outline">
              {blog.content.map((block, index) => (
                <ContentBlockEditor key={block.id} block={block} index={index} total={blog.content.length} disabled={!canEdit} onChange={(next) => updateBlock(index, next)} onMove={(direction) => moveBlock(index, direction)} onRemove={() => removeBlock(index)} />
              ))}
            </div>
            {canEdit && (
              <div className="blog-add-block-dock">
                <p>Add a section</p>
                <div>
                  {ARTICLE_BLOCK_OPTIONS.map(({ type, label, Icon }) => (
                    <button key={type} type="button" onClick={() => addArticleBlock(type)}><Icon size={14} /> {label}</button>
                  ))}
                </div>
              </div>
            )}
          </Panel>

          <Panel eyebrow="Convert" title="Service path and next step" description="Connect the educational answer to the most relevant Harmony service and action." className="blog-conversion-panel">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2"><FieldLabel>Related service URL</FieldLabel><input disabled={!canEdit} type="url" value={blog.relatedServiceUrl} onChange={(event) => patch("relatedServiceUrl", event.target.value)} placeholder="https://... or the future public service URL" className="h-11 w-full rounded-xl border px-3 text-sm" /></label>
              <label className="md:col-span-2"><FieldLabel optional>Related article URLs</FieldLabel><textarea disabled={!canEdit} value={blog.relatedArticleUrls.join("\n")} onChange={(event) => patch("relatedArticleUrls", event.target.value.split("\n").map((url) => url.trim()).filter(Boolean))} rows={3} placeholder="One full URL per line" className="w-full rounded-xl border px-3 py-2.5 text-sm" /></label>
              <label><FieldLabel>CTA label</FieldLabel><input disabled={!canEdit} value={blog.ctaLabel} onChange={(event) => patch("ctaLabel", event.target.value)} placeholder="Book a consultation" className="h-11 w-full rounded-xl border px-3 text-sm" /></label>
              <label><FieldLabel>CTA URL</FieldLabel><input disabled={!canEdit} type="url" value={blog.ctaUrl} onChange={(event) => patch("ctaUrl", event.target.value)} placeholder="https://..." className="h-11 w-full rounded-xl border px-3 text-sm" /></label>
            </div>
          </Panel>
        </div>

        <aside className="blog-editor-rail">
          <Panel eyebrow="Publish" title="Publication control" className="blog-publish-panel">
            <div className="flex items-center justify-between gap-3"><span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>Current status</span><span className="rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase" style={{ color: blog.status === "Published" ? "var(--success-text)" : "var(--warning-text)", backgroundColor: blog.status === "Published" ? "var(--success-bg)" : "var(--warning-bg)", borderColor: blog.status === "Published" ? "var(--success-border)" : "var(--warning-border)" }}>{blog.status}</span></div>
            {canEdit && (
              <div className="blog-publish-actions">
                <button disabled={saving || !dirty} type="button" onClick={() => void save(blog.status)} data-action="save">{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save changes</button>
                {blog.status === "Published" ? (
                  <button disabled={saving} type="button" onClick={() => setConfirmAction("unpublish")} data-action="unpublish">Move to draft</button>
                ) : (
                  <button disabled={saving} type="button" onClick={() => { const next = validateBlog({ ...blog, status: "Published" }); if (next.errors.length) { setIssues(next.errors); window.scrollTo({ top: 0, behavior: "smooth" }); } else setConfirmAction("publish"); }} data-action="publish"><Send size={16} /> Publish manually</button>
                )}
              </div>
            )}
            <p className="mt-3 text-[11px] leading-5" style={{ color: "var(--text-muted)" }}>Nothing publishes automatically. An editor or administrator must click Publish and confirm.</p>
          </Panel>

          <Panel eyebrow="Optimize" title="Technical SEO dossier" description="Prepared from the primary keyword and article fields." className="blog-seo-panel">
            <div className="space-y-4">
              <label><FieldLabel>SEO title</FieldLabel><input disabled={!canEdit} value={blog.seoTitle} onChange={(event) => patch("seoTitle", event.target.value)} className="h-11 w-full rounded-xl border px-3 text-sm" /><span className="mt-1 block text-right text-[10px]" style={{ color: blog.seoTitle.length > 60 ? "var(--warning-text)" : "var(--text-muted)" }}>{blog.seoTitle.length}/60</span></label>
              <label><FieldLabel>Meta description</FieldLabel><textarea disabled={!canEdit} value={blog.metaDescription} onChange={(event) => patch("metaDescription", event.target.value)} rows={4} className="w-full rounded-xl border px-3 py-2.5 text-sm leading-5" /><span className="mt-1 block text-right text-[10px]" style={{ color: blog.metaDescription.length > 160 ? "var(--warning-text)" : "var(--text-muted)" }}>{blog.metaDescription.length}/160</span></label>
              <label><FieldLabel>Slug</FieldLabel><div className="flex h-11 min-w-0 items-center rounded-xl border px-3" style={{ borderColor: "var(--border-subtle)", backgroundColor: urlLocked ? "var(--disabled-bg)" : "var(--input-bg)" }}><span className="shrink-0 text-xs" style={{ color: "var(--text-muted)" }}>/blog/</span><input disabled={!canEdit || urlLocked} value={blog.slug} onChange={(event) => patch("slug", event.target.value)} className="min-w-0 flex-1 border-0 bg-transparent px-1 text-sm shadow-none" /></div>{urlLocked && <span className="mt-1 block text-[10px] leading-4" style={{ color: "var(--warning-text)" }}>URL locked after first publication. Redirect support will be added with the public website.</span>}</label>
            </div>

            <div className="mt-5 border-t pt-4" style={{ borderColor: "var(--border-subtle)" }}>
              <p className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Automatic output</p>
              <div className="mt-3 space-y-2">
                {["Canonical URL", "Open Graph", "Article schema", "Breadcrumbs", blog.status === "Published" ? "Sitemap entry active" : "Sitemap entry on publish"].map((item) => <div key={item} className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}><Check size={14} style={{ color: "var(--success)" }} /> {item}</div>)}
              </div>
              <div className="mt-4 rounded-xl border p-3" style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border-subtle)" }}><p className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Canonical preview</p><p className="mt-1 break-all text-[11px] leading-5" style={{ color: "var(--text-secondary)" }}>{technicalSeo.canonical}</p></div>
              <details className="mt-3 rounded-xl border" style={{ borderColor: "var(--border-subtle)" }}>
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-3 text-xs font-bold" style={{ color: "var(--text-secondary)" }}><span className="inline-flex items-center gap-2"><Code2 size={14} /> View article schema</span><ChevronRight size={14} /></summary>
                <pre className="max-h-64 overflow-auto border-t p-3 text-[10px] leading-5" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>{JSON.stringify(technicalSeo.articleSchema, null, 2)}</pre>
              </details>
              <div className="mt-3 text-[11px] leading-5" style={{ color: "var(--text-muted)" }}><p className="font-bold" style={{ color: "var(--text-secondary)" }}>Breadcrumbs</p><p className="mt-1">{technicalSeo.breadcrumbs.map((item) => item.name).join(" → ")}</p></div>
            </div>
          </Panel>

          {validation.warnings.length > 0 && (
            <Panel eyebrow="Review" title="SEO reminders" className="blog-reminders-panel">
              <ul className="space-y-2 text-xs leading-5" style={{ color: "var(--warning-text)" }}>{validation.warnings.map((warning) => <li key={warning} className="flex gap-2"><AlertTriangle className="mt-0.5 shrink-0" size={13} /> {warning}</li>)}</ul>
            </Panel>
          )}

          <div className="blog-manual-note">
            <BookOpenText size={16} /><p><strong>Manual content only.</strong> The CMS handles repetitive technical SEO, not article generation or automatic publishing.</p>
          </div>
        </aside>
      </div>

      {canEdit && (
        <div className="blog-mobile-action-dock" role="group" aria-label="Article actions">
          <div>
            <span>{dirty ? "Unsaved changes" : "All changes saved"}</span>
            <small>{validation.wordCount.toLocaleString()} words · {blog.status}</small>
          </div>
          <button disabled={saving || !dirty} type="button" onClick={() => void save(blog.status)} data-action="save" aria-label="Save changes">
            {saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
          </button>
          {blog.status === "Published" ? (
            <button disabled={saving} type="button" onClick={() => setConfirmAction("unpublish")} data-action="secondary">Draft</button>
          ) : (
            <button disabled={saving} type="button" onClick={() => { const next = validateBlog({ ...blog, status: "Published" }); if (next.errors.length) { setIssues(next.errors); window.scrollTo({ top: 0, behavior: "smooth" }); } else setConfirmAction("publish"); }} data-action="primary">Publish</button>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmAction !== null}
        title={confirmAction === "publish" ? "Publish this article?" : "Move this article back to draft?"}
        description={confirmAction === "publish" ? "This is the manual publishing step. The CMS will mark the Airtable record as published and prepare it for the future public website." : "The public website will exclude this article after the website integration is completed."}
        confirmLabel={confirmAction === "publish" ? "Publish article" : "Move to draft"}
        loading={saving}
        loadingLabel="Saving..."
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => void save(confirmAction === "publish" ? "Published" : "Draft")}
      >
        {confirmAction === "publish" && validation.warnings.length > 0 ? (
          <div><p className="font-bold">You can publish with these reminders:</p><ul className="mt-2 list-disc space-y-1 pl-5">{validation.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div>
        ) : (
          <p>{confirmAction === "publish" ? "Nothing is generated or published until you confirm." : "The article and its Airtable history will be preserved."}</p>
        )}
      </ConfirmDialog>
    </div>
  );
}
