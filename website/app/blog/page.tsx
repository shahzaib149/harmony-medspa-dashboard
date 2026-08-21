import Image from "next/image";
import Link from "next/link";
import BlogSearchForm from "@/components/blog/BlogSearchForm";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";
import { listPublishedBlogs } from "@/lib/blogs/airtable";
import { allLegacyBlogPosts } from "@/lib/blogs/legacy-posts";
import { firstPublicBlogImage, imageSourceForSite } from "@/lib/blogs/types";

const posts = [
  {
    title: "Summer-Ready from the Inside Out: How GLP-1 Weight Loss and BHRT Work Together to Help You Look and Feel Your Best",
    image: "/images/blogs/blog-1/1.jpg",
    imageAlt: "GLP-1 weight loss and hormone replacement therapy graphic",
    href: "/blog/summer-ready-glp-1-bhrt",
    excerpt:
      "Beach season in Sarasota, FL often inspires people to focus on how they look in summer clothes, swimsuits, and vacation photos. But for many adults, especially those dealing with midlife hormone changes, feeling truly summer-ready is about more than just losing a few pounds."
  },
  {
    title: "IV Therapy in Sarasota: How IV Drips Support Energy, Hydration, and Recovery",
    image: "/images/blogs/blog-1/2.jpg",
    imageAlt: "Patient receiving IV therapy in a med spa setting",
    href: "/blog/iv-therapy-sarasota-energy-hydration-recovery",
    excerpt:
      "When you feel run down, dehydrated, or slow to bounce back after a busy week, your body may need more targeted support. IV therapy delivers fluids, vitamins, minerals, and nutrients directly into the bloodstream to support hydration, energy, wellness, and recovery. At Harmony Med Spa, IV therapy in Sarasota is personalized around your goals, whether you want immune support, post-workout recovery, skin radiance, or a general wellness boost."
  },
  {
    title: "Benefits of RF Microneedling for Skin Texture and Firmness",
    image: "/images/blogs/blog-1/3.jpg",
    imageAlt: "Secret PRO RF microneedling device and model",
    href: "/blog/benefits-of-rf-microneedling-skin-texture-firmness",
    excerpt:
      "When skin starts to feel less smooth, less firm, or more uneven, many people look for a treatment that supports natural-looking improvement without surgery. At Harmony Med Spa, we offer RF microneedling in Sarasota as an advanced option for improving skin texture, firmness, and overall skin quality."
  },
  {
    title: "How GLP-1 Medications Support Medical Weight Loss Success in Sarasota",
    image: "/images/blogs/blog-1/4.jpg",
    imageAlt: "Woman measuring her waist during a weight loss journey",
    href: "/blog/how-glp-1-medications-support-medical-weight-loss",
    excerpt:
      "For many adults, weight loss is not just about willpower - it is about having the right medical tools, guidance, and support. GLP-1 medications such as Semaglutide and Tirzepatide have become powerful options for patients who want a safe, medically supervised path to sustainable weight loss in Sarasota."
  },
  {
    title: "Alleviate Perimenopause Symptoms with BHRT",
    image: "/images/blogs/blog-1/5.jpg",
    imageAlt: "Women walking outdoors during a wellness session",
    href: "/blog/alleviate-perimenopause-symptoms-with-bhrt",
    excerpt:
      "Perimenopause is a natural stage of life, but that doesn't mean you have to accept uncomfortable symptoms as your new normal. At Harmony Med Spa, we help women in Sarasota regain balance and vitality with Bio-Identical Hormone Replacement Therapy (BHRT). By addressing hormonal changes at their source and supporting your body with advanced nutraceuticals, our comprehensive approach can significantly reduce symptoms and promote long-term wellness."
  },
  {
    title: "The Benefits of Chemical Peels for Acne, Sun Damage, and Aging",
    image: "/images/blogs/blog-1/6.jpg",
    imageAlt: "Client receiving a facial peel treatment",
    href: "/blog/the-benefits-of-chemical-peels-for-acne-sun-damage-and-aging",
    excerpt:
      "Chemical peels are a time-tested, results-driven treatment for improving acne, sun damage, and visible signs of aging. At Harmony Med Spa, our customized chemical peel treatments in Sarasota work by exfoliating damaged outer layers of skin to reveal a smoother, clearer, and more youthful complexion beneath. Whether you're struggling with breakouts, discoloration, or fine lines, understanding how chemical peels work and what to expect can help you achieve optimal results."
  },
  {
    title: "Is Laser Resurfacing Safe for My Skin Type?",
    image: "/images/blogs/blog-1/7.jpg",
    imageAlt: "Laser resurfacing treatment on a patient's face",
    href: "/blog/is-laser-resurfacing-safe-for-my-skin-type",
    excerpt:
      "Laser resurfacing has become one of the most effective ways to improve skin texture, tone, and overall appearance. From reducing fine lines and wrinkles to minimizing scars and pigmentation, this advanced treatment can deliver dramatic results. However, a common and important question many patients ask is: Is laser resurfacing safe for my skin type?"
  },
  {
    title: "Preparing for Your Laser Session: What to Avoid Beforehand",
    image: "/images/blogs/blog-1/8.jpg",
    imageAlt: "Patient wearing eye protection during a laser session",
    href: "/blog/preparing-for-your-laser-session-what-to-avoid-beforehand",
    excerpt:
      "Laser treatments have become one of the most popular options for achieving smoother, more youthful skin. At Harmony Med Spa in Sarasota, our Fractional CO2 laser treatments deliver transformative results by targeting deep layers of the skin to improve tone, texture, and elasticity. To get the best possible outcome, it's essential to properly prepare before your session."
  },
  {
    title: "Micro-Needling + RF: The Power Duo for Accelerated Skin Rejuvenation",
    image: "/images/blogs/blog-3/8.jpg",
    imageAlt: "RF microneedling treatment in progress",
    href: "/blog/micro-needling-rf-accelerated-skin-rejuvenation",
    excerpt:
      "Healthy, youthful-looking skin starts with treatments that work beneath the surface - where real rejuvenation happens. At Harmony Med Spa, we're proud to offer one of the most effective solutions for skin renewal: Micro-Needling combined with Radiofrequency (RF)."
  }
];

export const revalidate = 300;

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ search?: string | string[] }> }) {
  const requestedSearch = (await searchParams).search;
  const query = (Array.isArray(requestedSearch) ? requestedSearch[0] : requestedSearch || "").trim();
  const normalizedQuery = query.toLowerCase();
  const publishedBlogs = await listPublishedBlogs();
  const legacySlugs = new Set(allLegacyBlogPosts.map((post) => post.href.replace(/^\/blog\//, "").toLowerCase()));
  const cmsPosts = publishedBlogs
    .filter((blog) => !legacySlugs.has(blog.slug.toLowerCase()))
    .map((blog) => {
      const image = firstPublicBlogImage(blog);
      return {
        title: blog.title,
        image: image ? imageSourceForSite(image.url) : "/images/logo.jpg",
        imageAlt: image?.alt || `${blog.title} at Harmony Med Spa`,
        href: `/blog/${blog.slug}`,
        excerpt: blog.excerpt,
      };
    });
  const searchablePosts = [...new Map(
    [...allLegacyBlogPosts, ...cmsPosts].map((post) => [post.href.toLowerCase(), post]),
  ).values()];
  const visiblePosts = normalizedQuery
    ? searchablePosts.filter((post) => `${post.title} ${post.excerpt} ${post.imageAlt} ${post.href}`.toLowerCase().includes(normalizedQuery))
    : [...cmsPosts, ...posts];

  return (
    <main className="blog-page min-h-[100vh] bg-[#fff] text-[#000]">
      <SiteHeader className="contact-page-header" />

      <section className="blog-hero grid [place-items:center] min-h-[341px] [background:linear-gradient(rgba(0,0,0,0.62),rgba(0,0,0,0.62)),radial-gradient(circle_at_22%_38%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_70%_42%,rgba(255,255,255,0.06),transparent_24%),repeating-linear-gradient(29deg,rgba(255,255,255,0.025)_0_2px,transparent_2px_9px),linear-gradient(135deg,#252525,#101010_52%,#242424)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:text-[length:clamp(44px,3.5vw,58px)] [&_h1]:leading-[1] [&_h1]:font-thin max-[720px]:min-h-[230px]">
        <h1><TypewriterText text="blog list" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="blog-content grid grid-cols-[minmax(0,810px)_390px] gap-[90px] w-[min(100%_-_48px,1300px)] my-0 mx-auto pt-[72px] pb-[126px] px-0 max-[1050px]:grid-cols-[minmax(0,680px)] max-[1050px]:justify-center max-[1050px]:gap-[46px] max-[1050px]:pt-[64px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[46px] max-[720px]:pt-[46px] max-[720px]:pb-[76px] max-[720px]:px-0">
        <div className="blog-main min-w-[0]">
          <div className="blog-post-list grid">
            {visiblePosts.map((post) => (
              <article className="blog-post grid grid-cols-[202px_minmax(0,1fr)] gap-[42px] py-[36px] px-0 [border-bottom:1px_solid_#e9e9e9] first:pt-0 max-[720px]:grid-cols-[1fr] max-[720px]:gap-[18px]" key={post.title}>
                <div className="blog-post-image relative h-[144px] mt-[4px] overflow-hidden bg-[#eee] max-[720px]:w-[min(100%,320px)]">
                  <Image src={post.image} alt={post.imageAlt} fill sizes="(max-width: 720px) 320px, 202px" className="object-cover" />
                </div>
                <div className="blog-post-copy [&_h3]:mt-0 [&_h3]:mb-[12px] [&_h3]:mx-0 [&_h3]:text-[#e9ad1d] [&_h3]:text-[length:23px] [&_h3]:leading-[1.02] [&_h3]:font-bold [&_p]:m-0 [&_p]:text-[#4f5966] [&_p]:text-[length:20px] [&_p]:leading-[1.75] [&_p]:font-normal max-[720px]:[&_h3]:text-[length:22px] max-[720px]:[&_p]:text-[length:16px] max-[720px]:[&_p]:leading-[1.65]">
                  <h3>{post.title}</h3>
                  <p>{post.excerpt}</p>
                  <Link className="blog-read-more inline-flex justify-center min-w-[151px] mt-[24px] py-[16px] px-[18px] [border-top:1px_solid_var(--gold)] [border-bottom:1px_solid_var(--gold)] text-[#000] text-[length:18px] leading-[1] [transition:color_160ms_ease,border-color_160ms_ease,transform_160ms_ease] hover:text-[#b98210] hover:border-[color:#b98210] hover:[transform:translateX(4px)] focus-visible:text-[#b98210] focus-visible:border-[color:#b98210] focus-visible:[transform:translateX(4px)] max-[720px]:text-[length:18px]" href={post.href ?? "#"}>
                    Read More
                  </Link>
                </div>
              </article>
            ))}
            {normalizedQuery && visiblePosts.length === 0 ? (
              <div className="py-[36px] text-[#4f5966] text-[length:19px] leading-[1.75]">
                <h2 className="m-0 text-[#e9ad1d] text-[length:24px] font-bold">No articles found</h2>
                <p className="mt-[12px] mb-0">Try a broader treatment, concern, or wellness keyword.</p>
              </div>
            ) : null}
          </div>

          {!normalizedQuery ? (
            <nav className="blog-pagination flex mt-[72px] [&_a]:grid [&_a]:[place-items:center] [&_a]:w-[34px] [&_a]:h-[40px] [&_a]:[border:1px_solid_#ddd] [&_a]:[border-right:0] [&_a]:bg-[#fff] [&_a]:text-[#344356] [&_a]:text-[length:18px] [&_a]:font-normal [&_span]:grid [&_span]:[place-items:center] [&_span]:w-[34px] [&_span]:h-[40px] [&_span]:[border:1px_solid_#ddd] [&_span]:[border-right:0] [&_span]:text-[length:18px] [&_a:first-child]:rounded-[4px_0_0_4px] [&_span:first-child]:rounded-[4px_0_0_4px] [&_span]:border-[color:#000] [&_span]:bg-[#000] [&_span]:text-[#fff] [&_span]:font-bold [&_a:last-child]:[border-right:1px_solid_#ddd] [&_a:last-child]:rounded-[0_4px_4px_0] [&_span:last-child]:[border-right:1px_solid_#ddd] [&_span:last-child]:rounded-[0_4px_4px_0]" aria-label="Blog pages">
              <span aria-current="page">1</span>
              <Link href="/blog/page-2" aria-label="Page 2">2</Link>
              <Link href="/blog/page-3" aria-label="Page 3">3</Link>
            </nav>
          ) : null}
        </div>

        <aside className="blog-sidebar grid [align-content:start] gap-[20px] [&_.about-search]:h-[70px] [&_.about-search]:mb-[15px] [&_.about-side-card]:min-h-[269px] [&_.about-side-card]:rounded-[18px] [&_.about-side-card_span]:text-[length:30px] [&_.about-side-card_small]:text-[length:22px] max-[1050px]:grid-cols-[repeat(2,minmax(240px,390px))] max-[1050px]:justify-center max-[1050px]:[&_.about-search]:col-[1_/_-1] max-[720px]:grid-cols-[1fr] max-[720px]:[&_.about-side-card]:min-h-[220px]" aria-label="Blog links">
          <BlogSearchForm defaultValue={query} />

          <Link className="about-side-card relative grid [place-items:center] min-h-[184px] overflow-hidden rounded-[10px] text-[#fff] text-center isolate before:content-[''] before:absolute before:inset-0 before:z-[-1] before:[background:rgba(0,0,0,0.34)] [&_img]:z-[-2] [&_img]:object-cover [&_img]:[transition:transform_420ms_ease] [&_span]:text-[length:25px] [&_span]:leading-[1.1] [&_span]:font-normal [&_small]:inline-flex [&_small]:min-w-[146px] [&_small]:justify-center [&_small]:mt-[10px] [&_small]:py-[12px] [&_small]:px-[18px] [&_small]:[border-top:1px_solid_var(--gold)] [&_small]:[border-bottom:1px_solid_var(--gold)] [&_small]:text-[length:16px]" href="/services" target="_blank" rel="noopener noreferrer">
            <Image src="/images/blogs/blog-1/img_1.png" alt="" fill sizes="390px" />
            <span>
              All
              <br />
              Services
            </span>
            <small>Learn More</small>
          </Link>

          <Link className="about-side-card relative grid [place-items:center] min-h-[184px] overflow-hidden rounded-[10px] text-[#fff] text-center isolate before:content-[''] before:absolute before:inset-0 before:z-[-1] before:[background:rgba(0,0,0,0.34)] [&_img]:z-[-2] [&_img]:object-cover [&_img]:[transition:transform_420ms_ease] [&_span]:text-[length:25px] [&_span]:leading-[1.1] [&_span]:font-normal [&_small]:inline-flex [&_small]:min-w-[146px] [&_small]:justify-center [&_small]:mt-[10px] [&_small]:py-[12px] [&_small]:px-[18px] [&_small]:[border-top:1px_solid_var(--gold)] [&_small]:[border-bottom:1px_solid_var(--gold)] [&_small]:text-[length:16px]" href="/contact-us" target="_blank" rel="noopener noreferrer">
            <Image src="/images/blogs/blog-1/Img_2.png" alt="" fill sizes="390px" />
            <span>
              Keep
              <br />
              In Touch
            </span>
            <small>Contact Us</small>
          </Link>
        </aside>
      </section>

      <SiteFooter />
    </main>
  );
}
