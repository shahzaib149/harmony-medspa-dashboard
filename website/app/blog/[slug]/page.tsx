import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import BlogSearchForm from "@/components/blog/BlogSearchForm";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";
import { getPublishedBlogBySlug } from "@/lib/blogs/airtable";
import { firstPublicBlogImage, imageSourceForSite, type PublicBlogBlock } from "@/lib/blogs/types";

export const revalidate = 300;

const DEFAULT_SITE_URL = "https://harmony-medspa.vercel.app";

function siteUrl() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL).origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function lines(text: string) {
  return text.split("\n").map((item) => item.trim()).filter(Boolean);
}

function LegacyHeading({ children }: { children: string }) {
  return <h2><TypewriterText text={children} startOnView /></h2>;
}

function BlogBlock({ block }: { block: PublicBlogBlock }) {
  if (block.type === "image") {
    return (
      <figure className="my-[36px] overflow-hidden rounded-[14px] bg-[#eee]">
        {/* CMS images are stored as stable public URLs; Harmony-hosted URLs resolve to local assets. */}
        <img className="block h-auto w-full object-cover" src={imageSourceForSite(block.url)} alt={block.alt} loading="lazy" />
      </figure>
    );
  }
  if (block.type === "heading2") return <LegacyHeading>{block.text}</LegacyHeading>;
  if (block.type === "heading3") return <h3>{block.text}</h3>;
  if (block.type === "bulleted-list") return <ul>{lines(block.text).map((item) => <li key={item}>{item}</li>)}</ul>;
  if (block.type === "numbered-list") return <ol>{lines(block.text).map((item) => <li key={item}>{item}</li>)}</ol>;
  if (block.type === "quote") return <blockquote><p><em>{block.text}</em></p></blockquote>;
  if (block.type === "faq") {
    if (!block.items.length) return null;
    return (
      <section aria-labelledby={`${block.id}-title`}>
        <h2 id={`${block.id}-title`}><TypewriterText text="Frequently Asked Questions" startOnView /></h2>
        {block.items.map((item, index) => (
          <div key={item.id}>
            <h3>{index + 1}. {item.question}</h3>
            <p>{item.answer}</p>
          </div>
        ))}
      </section>
    );
  }
  return <p>{block.text}</p>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getPublishedBlogBySlug(slug);
  if (!blog) return {};
  const canonical = `${siteUrl()}/blog/${blog.slug}`;
  const image = firstPublicBlogImage(blog);
  return {
    title: blog.seoTitle || blog.title,
    description: blog.metaDescription || blog.excerpt,
    keywords: [blog.primaryKeyword, ...blog.tags].filter(Boolean),
    alternates: { canonical },
    openGraph: {
      type: "article",
      siteName: "Harmony Med Spa",
      title: blog.seoTitle || blog.title,
      description: blog.metaDescription || blog.excerpt,
      url: canonical,
      publishedTime: blog.publishedAt || undefined,
      modifiedTime: blog.updatedAt || undefined,
      images: image ? [{ url: image.url, alt: image.alt }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: blog.seoTitle || blog.title,
      description: blog.metaDescription || blog.excerpt,
      images: image ? [image.url] : undefined,
    },
  };
}

export default async function PublishedBlogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const blog = await getPublishedBlogBySlug(slug);
  if (!blog) notFound();

  const origin = siteUrl();
  const canonical = `${origin}/blog/${blog.slug}`;
  const image = firstPublicBlogImage(blog);
  const firstSectionIndex = blog.content.findIndex((block) => block.type === "heading2" || block.type === "heading3" || block.type === "faq");
  const ledeSource = firstSectionIndex >= 0 ? blog.content.slice(0, firstSectionIndex) : blog.content;
  const ledeBlocks = ledeSource.filter((block) => block.type !== "image");
  const bodyBlocks = (firstSectionIndex >= 0 ? blog.content.slice(firstSectionIndex) : [])
    .filter((block) => block.type !== "image" || block.url !== image?.url);
  const tableOfContents = blog.content.flatMap((block) => {
    if (block.type === "heading2") return [block.text];
    if (block.type === "faq" && block.items.length) return ["Frequently Asked Questions"];
    return [];
  });
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.title,
    description: blog.metaDescription || blog.excerpt,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    publisher: {
      "@type": "Organization",
      name: "Harmony Med Spa",
      url: origin,
      logo: { "@type": "ImageObject", url: `${origin}/images/logo-transparent.png` },
    },
    datePublished: blog.publishedAt || undefined,
    dateModified: blog.updatedAt || undefined,
    image: image?.url || undefined,
    articleSection: blog.category || undefined,
    keywords: [blog.primaryKeyword, ...blog.tags].filter(Boolean).join(", "),
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: origin },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${origin}/blog` },
      { "@type": "ListItem", position: 3, name: blog.title, item: canonical },
    ],
  };

  return (
    <main className="blog-page blog-detail-page min-h-[100vh] bg-[#fff] text-[#000]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }} />
      <SiteHeader className="contact-page-header" />

      <section className="blog-hero blog-detail-hero grid [place-items:center] [background:linear-gradient(rgba(0,0,0,0.62),rgba(0,0,0,0.62)),radial-gradient(circle_at_22%_38%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_70%_42%,rgba(255,255,255,0.06),transparent_24%),repeating-linear-gradient(29deg,rgba(255,255,255,0.025)_0_2px,transparent_2px_9px),linear-gradient(135deg,#252525,#101010_52%,#242424)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:font-thin min-h-[341px] py-[48px] px-[24px] text-center [&_h1]:w-[min(100%,1220px)] [&_h1]:text-[length:clamp(42px,3.25vw,58px)] [&_h1]:leading-[1.05] max-[720px]:min-h-[230px]">
        <h1><TypewriterText text={blog.title.toLowerCase()} letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="blog-content blog-detail-content grid gap-[90px] w-[min(100%_-_48px,1300px)] my-0 mx-auto pb-[142px] px-0 [align-items:start] grid-cols-[minmax(0,820px)_390px] pt-[100px] max-[1050px]:grid-cols-[minmax(0,680px)] max-[1050px]:justify-center max-[1050px]:gap-[46px] max-[1050px]:pt-[76px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[46px] max-[720px]:pt-[56px] max-[720px]:pb-[76px] max-[720px]:px-0">
        <article className="blog-article min-w-[0] text-[#4f5966] text-[length:19px] leading-[1.82] [&_p]:mt-0 [&_p]:mb-[18px] [&_p]:mx-0 [&_h2]:mt-[28px] [&_h2]:mb-[17px] [&_h2]:mx-0 [&_h2]:text-[#ebb35a] [&_h2]:text-[length:30px] [&_h2]:leading-[1.2] [&_h2]:font-thin [&_h3]:mt-[18px] [&_h3]:mb-[2px] [&_h3]:mx-0 [&_h3]:text-[#4f5966] [&_h3]:text-[length:19px] [&_h3]:leading-[1.45] [&_h3]:font-extrabold [&_ul]:mt-0 [&_ul]:mb-[20px] [&_ul]:mr-0 [&_ul]:ml-[28px] [&_ul]:p-0 [&_ul]:list-disc [&_ul]:list-outside [&_ol]:mt-0 [&_ol]:mb-[20px] [&_ol]:mr-0 [&_ol]:ml-[28px] [&_ol]:p-0 [&_ol]:list-decimal [&_ol]:list-outside [&_li]:pl-[4px] [&_li]:leading-[1.65] [&_li::marker]:text-[#5f6670] [&_a]:text-[#e2a719]">
          <div className="blog-article-lede grid grid-cols-[minmax(0,1fr)_300px] gap-[28px] [align-items:start] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[22px]">
            <div>
              {ledeBlocks.length
                ? ledeBlocks.map((block) => <BlogBlock block={block} key={block.id} />)
                : <p>{blog.excerpt}</p>}
            </div>
            {image ? (
              <div className="blog-article-feature-image relative min-h-[212px] overflow-hidden rounded-[14px] bg-[#eee] [&_img]:object-cover">
                <img className="absolute inset-0 h-full w-full object-cover" src={imageSourceForSite(image.url)} alt={image.alt} loading="eager" />
              </div>
            ) : null}
          </div>

          {tableOfContents.length ? (
            <>
              <LegacyHeading>Table Of Contents</LegacyHeading>
              <ul>{tableOfContents.map((item) => <li key={item}>{item}</li>)}</ul>
            </>
          ) : null}

          {bodyBlocks.map((block) => <BlogBlock block={block} key={block.id} />)}

          {blog.relatedServiceUrl || blog.relatedArticleUrls.length ? (
            <section>
              <LegacyHeading>Continue Exploring</LegacyHeading>
              <ul>
                {blog.relatedServiceUrl ? <li><a href={blog.relatedServiceUrl}>View the related Harmony service</a></li> : null}
                {blog.relatedArticleUrls.map((url) => <li key={url}><a href={url}>Read a related Harmony article</a></li>)}
              </ul>
            </section>
          ) : null}

          {blog.ctaLabel && blog.ctaUrl ? (
            <section>
              <LegacyHeading>Ready To Take The Next Step?</LegacyHeading>
              <p><a href={blog.ctaUrl} target={blog.ctaUrl.startsWith(origin) ? undefined : "_blank"} rel={blog.ctaUrl.startsWith(origin) ? undefined : "noopener noreferrer"}>{blog.ctaLabel}</a> with Harmony Med Spa in Sarasota.</p>
            </section>
          ) : null}
        </article>

        <aside className="blog-sidebar grid [align-content:start] gap-[20px] [&_.about-search]:h-[70px] [&_.about-search]:mb-[15px] [&_.about-side-card]:min-h-[269px] [&_.about-side-card]:rounded-[18px] [&_.about-side-card_span]:text-[length:30px] [&_.about-side-card_small]:text-[length:22px] max-[1050px]:grid-cols-[repeat(2,minmax(240px,390px))] max-[1050px]:justify-center max-[1050px]:[&_.about-search]:col-[1_/_-1] max-[720px]:grid-cols-[1fr] max-[720px]:[&_.about-side-card]:min-h-[220px]" aria-label="Blog links">
          <BlogSearchForm />

          <Link className="about-side-card relative grid [place-items:center] min-h-[184px] overflow-hidden rounded-[10px] text-[#fff] text-center isolate before:content-[''] before:absolute before:inset-0 before:z-[-1] before:[background:rgba(0,0,0,0.34)] [&_img]:z-[-2] [&_img]:object-cover [&_img]:[transition:transform_420ms_ease] [&_span]:text-[length:25px] [&_span]:leading-[1.1] [&_span]:font-normal [&_small]:inline-flex [&_small]:min-w-[146px] [&_small]:justify-center [&_small]:mt-[10px] [&_small]:py-[12px] [&_small]:px-[18px] [&_small]:[border-top:1px_solid_var(--gold)] [&_small]:[border-bottom:1px_solid_var(--gold)] [&_small]:text-[length:16px]" href="/services" target="_blank" rel="noopener noreferrer">
            <Image src="/images/blogs/blog-1/img_1.png" alt="" fill sizes="390px" />
            <span>All<br />Services</span>
            <small>Learn More</small>
          </Link>

          <Link className="about-side-card relative grid [place-items:center] min-h-[184px] overflow-hidden rounded-[10px] text-[#fff] text-center isolate before:content-[''] before:absolute before:inset-0 before:z-[-1] before:[background:rgba(0,0,0,0.34)] [&_img]:z-[-2] [&_img]:object-cover [&_img]:[transition:transform_420ms_ease] [&_span]:text-[length:25px] [&_span]:leading-[1.1] [&_span]:font-normal [&_small]:inline-flex [&_small]:min-w-[146px] [&_small]:justify-center [&_small]:mt-[10px] [&_small]:py-[12px] [&_small]:px-[18px] [&_small]:[border-top:1px_solid_var(--gold)] [&_small]:[border-bottom:1px_solid_var(--gold)] [&_small]:text-[length:16px]" href="/contact-us" target="_blank" rel="noopener noreferrer">
            <Image src="/images/blogs/blog-1/Img_2.png" alt="" fill sizes="390px" />
            <span>Keep<br />In Touch</span>
            <small>Contact Us</small>
          </Link>
        </aside>
      </section>

      <SiteFooter />
    </main>
  );
}
