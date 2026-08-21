import Image from "next/image";
import Link from "next/link";
import BlogSearchForm from "@/components/blog/BlogSearchForm";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

const posts = [
  {
    title: "Post-Summer Skin Recovery: Treating Sun Damage with Laser & The Perfect Derma Peel",
    image: "/images/blogs/blog-2/1.jpg",
    imageAlt: "Laser treatment for post-summer skin recovery",
    href: "/blog/post-summer-skin-recovery-treating-sun-damage-with-laser-the-perfect-derma-peel",
    excerpt:
      "Spending time in the sun is one of the best parts of summer, but too much exposure can take a toll on your skin. Even with sunscreen, UV rays can accelerate signs of aging, create uneven pigmentation, and leave your complexion looking dull or tired."
  },
  {
    title: "Unlock the Benefits of Thermal Treatments for Skin Rejuvenation",
    image: "/images/blogs/blog-2/2.jpg",
    imageAlt: "Thermal skin rejuvenation treatment",
    href: "/blog/unlock-the-benefits-of-thermal-treatments-for-skin-rejuvenation",
    excerpt:
      "In the world of modern aesthetics, advanced thermal treatments are transforming the way we care for our skin. We offer a curated selection of thermal-based skin rejuvenation procedures designed to restore youthful vitality, improve skin texture, and promote collagen production."
  },
  {
    title: "How Jeuveau Fits Into Your Anti-Aging Skincare Routine",
    image: "/images/blogs/blog-2/3.jpg",
    imageAlt: "Woman reviewing her anti-aging skincare routine",
    href: "/blog/How-Jeuveau-Fits-Into-Your-Anti-Aging-Skincare-Routine",
    excerpt:
      "When it comes to aging gracefully, a consistent skincare routine is only part of the equation. While high-quality products can improve skin tone and texture, they often fall short in addressing deeper expression lines caused by repetitive facial movements."
  },
  {
    title: "The Collagen Comeback: How Sculptra Rebuilds Your Skin from Within",
    image: "/images/blogs/blog-2/4.jpg",
    imageAlt: "Sculptra injectable consultation",
    href: "/blog/the-collagen-comeback-how-sculptra-rebuilds-your-skin-from-within",
    excerpt:
      "As the years pass, subtle changes in our skin begin to appear. Fine lines become more noticeable, cheeks lose volume, and the smooth texture we once had starts to diminish. At Harmony Med Spa, we provide a solution that addresses more than just the surface. Sculptra is a specialized injectable treatment designed to work deep within the skin, stimulating your body's natural collagen production."
  },
  {
    title: "Restore Confidence After Weight Loss: How Dermal Fillers Help Rebuild Volume",
    image: "/images/blogs/blog-2/5.jpg",
    imageAlt: "Dermal filler treatment to restore facial volume",
    href: "/blog/restore-confidence-after-weight-loss-how-dermal-fillers-help-rebuild-volume",
    excerpt:
      "Losing weight is an incredible achievement, one that reflects dedication and commitment to better health. However, for many people, dramatic weight loss can result in an unintended consequence such as volume loss in the face. Hollow cheeks, sagging skin, and a tired appearance are common post-weight-loss concerns that may affect your self-confidence."
  },
  {
    title: "Unlocking the Power of Nutraceuticals: Why HRT-Complete T & E Are Essential for Optimized BHRT",
    image: "/images/blogs/blog-2/6.jpg",
    imageAlt: "Woman taking wellness supplements at home",
    href: "/blog/unlocking-the-power-of-nutraceuticals-why-hrt-complete-t-e-are-essential-for-optimized-bhrt",
    excerpt:
      "Not all supplements are created equal, and not all hormone therapies deliver the same results. At Harmony Med Spa, we believe in using only the highest-quality, medically backed solutions to support your health. We offer HRT-Complete T & E, not as ordinary supplements, but as nutraceuticals. These advanced formulations are designed to support and enhance your body's ability to process and utilize hormones as part of a comprehensive bio-identical hormone replacement therapy (BHRT) plan."
  },
  {
    title: "The Power of Vitamins A, D, & K: Benefits of ADK-10 for Your Health",
    image: "/images/blogs/blog-2/7.jpg",
    imageAlt: "Patient taking vitamins with water",
    href: "/blog/the-power-of-vitamins-a-d-k-benefits-of-adk-10-for-your-health",
    excerpt:
      "At Harmony Med Spa, we know that health isn't just about looking good - it's about feeling your best from the inside out. We offer Evexias Nutraceuticals, a high-quality line of supplements designed to support optimal wellness. One of our most recommended supplements is ADK-10, a powerhouse blend of Vitamins A, D, and K that plays a critical role in bone strength, immune function, and cardiovascular health."
  },
  {
    title: "Feel the Love This Valentine's Day: Reignite Your Passion with Hormone Replacement Therapy",
    image: "/images/blogs/blog-2/8.jpg",
    imageAlt: "Couple sitting together outdoors",
    href: "/blog/feel-the-love-this-valentines-day-reignite-your-passion-with-hormone-replacement-therapy",
    excerpt:
      "Valentine's Day is a time to celebrate love, connection, and intimacy. But if you've been feeling a lack of energy, reduced libido, or a shift in mood that's affecting your relationships, it might not just be stress or aging - it could be a hormonal imbalance. Hormone Replacement Therapy (HRT) is a proven solution that helps restore balance, increase energy, and enhance your quality of life."
  },
  {
    title: "Unlocking Radiant Skin: What is RF Micro-Needling and How It Transforms Your Complexion",
    image: "/images/blogs/blog-2/9.jpg",
    imageAlt: "Secret PRO RF micro-needling handpiece",
    href: "/blog/unlocking-radiant-skin-what-is-rf-micro-needling-and-how-it-transforms-your-complexion",
    excerpt:
      "Are you looking for a way to revitalize your skin and restore a youthful, radiant glow? RF (Radiofrequency) Micro-Needling may be the answer. This innovative treatment combines the power of micro-needling and radiofrequency energy, creating a transformative skin rejuvenation method that works below the skin's surface for lasting results."
  },
  {
    title: "Breaking Down Barriers: Addressing Common Misconceptions About GLP-1 Medications",
    image: "/images/blogs/blog-2/10.jpg",
    imageAlt: "GLP-1 medication injection for medical weight loss",
    href: "/blog/breaking-down-barriers-addressing-common-misconceptions-about-glp-1-medications",
    excerpt:
      "Medical weight loss is transforming lives by providing safe and effective tools to support individuals in their weight management journey. Among these innovations, GLP-1 medications have garnered significant attention for their ability to help with weight loss and overall health improvement. However, despite their benefits, misconceptions about GLP-1 medications can create unnecessary barriers for those who might benefit the most."
  }
];

export default function BlogPageTwo() {
  return (
    <main className="blog-page min-h-[100vh] bg-[#fff] text-[#000]">
      <SiteHeader className="contact-page-header" />

      <section className="blog-hero grid [place-items:center] min-h-[341px] [background:linear-gradient(rgba(0,0,0,0.62),rgba(0,0,0,0.62)),radial-gradient(circle_at_22%_38%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_70%_42%,rgba(255,255,255,0.06),transparent_24%),repeating-linear-gradient(29deg,rgba(255,255,255,0.025)_0_2px,transparent_2px_9px),linear-gradient(135deg,#252525,#101010_52%,#242424)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:text-[length:clamp(44px,3.5vw,58px)] [&_h1]:leading-[1] [&_h1]:font-thin max-[720px]:min-h-[230px]">
        <h1><TypewriterText text="blog list" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="blog-content grid grid-cols-[minmax(0,820px)_390px] gap-[90px] w-[min(100%_-_48px,1300px)] my-0 mx-auto pt-[108px] pb-[142px] px-0 max-[1050px]:grid-cols-[minmax(0,680px)] max-[1050px]:justify-center max-[1050px]:gap-[46px] max-[1050px]:pt-[76px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[46px] max-[720px]:pt-[56px] max-[720px]:pb-[76px] max-[720px]:px-0">
        <div className="blog-main min-w-[0]">
          <div className="blog-intro mb-[42px] text-[#4f5966] text-[length:19px] leading-[1.5] [&_h2]:mt-0 [&_h2]:mb-[22px] [&_h2]:mx-0 [&_h2]:text-[#ebb35a] [&_h2]:text-[length:25px] [&_h2]:leading-[1.2] [&_h2]:font-thin [&_p]:m-0">
            <h2><TypewriterText text="Harmony Med Spa Blog" startOnView /></h2>
            <p>Learn more about med spa care in our blog!</p>
          </div>

          <div className="blog-post-list grid">
            {posts.map((post) => (
              <article className="blog-post grid grid-cols-[205px_minmax(0,1fr)] gap-[40px] py-[36px] px-0 [border-bottom:1px_solid_#e4e4e4] first:pt-0 max-[720px]:grid-cols-[1fr] max-[720px]:gap-[18px]" key={post.title}>
                <div className="blog-post-image relative h-[136px] mt-[4px] overflow-hidden bg-[#eee] max-[720px]:w-[min(100%,320px)]">
                  <Image src={post.image} alt={post.imageAlt} fill sizes="(max-width: 720px) 320px, 205px" className="object-cover" />
                </div>
                <div className="blog-post-copy [&_h3]:mt-0 [&_h3]:mb-[11px] [&_h3]:mx-0 [&_h3]:text-[#e2a719] [&_h3]:text-[length:24px] [&_h3]:leading-[1.02] [&_h3]:font-bold [&_p]:m-0 [&_p]:text-[#4f5966] [&_p]:text-[length:19px] [&_p]:leading-[1.82] [&_p]:font-normal max-[720px]:[&_h3]:text-[length:22px] max-[720px]:[&_p]:text-[length:16px] max-[720px]:[&_p]:leading-[1.65]">
                  <h3>{post.title}</h3>
                  <p>{post.excerpt}</p>
                  <Link className="blog-read-more inline-flex justify-center min-w-[160px] mt-[24px] py-[14px] px-[18px] [border-top:1px_solid_var(--gold)] [border-bottom:1px_solid_var(--gold)] text-[#000] text-[length:21px] leading-[1] [transition:color_160ms_ease,border-color_160ms_ease,transform_160ms_ease] hover:text-[#b98210] hover:border-[color:#b98210] hover:[transform:translateX(4px)] focus-visible:text-[#b98210] focus-visible:border-[color:#b98210] focus-visible:[transform:translateX(4px)] max-[720px]:text-[length:18px]" href={post.href ?? "#"}>
                    Read More
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <nav className="blog-pagination flex mt-[72px] [&_a]:grid [&_a]:[place-items:center] [&_a]:w-[34px] [&_a]:h-[40px] [&_a]:[border:1px_solid_#ddd] [&_a]:[border-right:0] [&_a]:bg-[#fff] [&_a]:text-[#344356] [&_a]:text-[length:18px] [&_a]:font-normal [&_span]:grid [&_span]:[place-items:center] [&_span]:w-[34px] [&_span]:h-[40px] [&_span]:[border:1px_solid_#ddd] [&_span]:[border-right:0] [&_span]:text-[length:18px] [&_a:first-child]:rounded-[4px_0_0_4px] [&_span:first-child]:rounded-[4px_0_0_4px] [&_span]:border-[color:#000] [&_span]:bg-[#000] [&_span]:text-[#fff] [&_span]:font-bold [&_a:last-child]:[border-right:1px_solid_#ddd] [&_a:last-child]:rounded-[0_4px_4px_0] [&_span:last-child]:[border-right:1px_solid_#ddd] [&_span:last-child]:rounded-[0_4px_4px_0]" aria-label="Blog pages">
            <Link href="/blog" aria-label="Page 1">1</Link>
            <span aria-current="page">2</span>
            <Link href="/blog/page-3" aria-label="Page 3">3</Link>
          </nav>
        </div>

        <aside className="blog-sidebar grid [align-content:start] gap-[20px] [&_.about-search]:h-[70px] [&_.about-search]:mb-[15px] [&_.about-side-card]:min-h-[269px] [&_.about-side-card]:rounded-[18px] [&_.about-side-card_span]:text-[length:30px] [&_.about-side-card_small]:text-[length:22px] max-[1050px]:grid-cols-[repeat(2,minmax(240px,390px))] max-[1050px]:justify-center max-[1050px]:[&_.about-search]:col-[1_/_-1] max-[720px]:grid-cols-[1fr] max-[720px]:[&_.about-side-card]:min-h-[220px]" aria-label="Blog links">
          <BlogSearchForm />

          <Link className="about-side-card relative grid [place-items:center] min-h-[184px] overflow-hidden rounded-[10px] text-[#fff] text-center isolate before:content-[''] before:absolute before:inset-0 before:z-[-1] before:[background:rgba(0,0,0,0.34)] [&_img]:z-[-2] [&_img]:object-cover [&_img]:[transition:transform_420ms_ease] [&_span]:text-[length:25px] [&_span]:leading-[1.1] [&_span]:font-normal [&_small]:inline-flex [&_small]:min-w-[146px] [&_small]:justify-center [&_small]:mt-[10px] [&_small]:py-[12px] [&_small]:px-[18px] [&_small]:[border-top:1px_solid_var(--gold)] [&_small]:[border-bottom:1px_solid_var(--gold)] [&_small]:text-[length:16px]" href="/services" target="_blank" rel="noopener noreferrer">
            <Image src="/images/blogs/blog-2/img_1.png" alt="" fill sizes="390px" />
            <span>
              All
              <br />
              Services
            </span>
            <small>Learn More</small>
          </Link>

          <Link className="about-side-card relative grid [place-items:center] min-h-[184px] overflow-hidden rounded-[10px] text-[#fff] text-center isolate before:content-[''] before:absolute before:inset-0 before:z-[-1] before:[background:rgba(0,0,0,0.34)] [&_img]:z-[-2] [&_img]:object-cover [&_img]:[transition:transform_420ms_ease] [&_span]:text-[length:25px] [&_span]:leading-[1.1] [&_span]:font-normal [&_small]:inline-flex [&_small]:min-w-[146px] [&_small]:justify-center [&_small]:mt-[10px] [&_small]:py-[12px] [&_small]:px-[18px] [&_small]:[border-top:1px_solid_var(--gold)] [&_small]:[border-bottom:1px_solid_var(--gold)] [&_small]:text-[length:16px]" href="/contact-us" target="_blank" rel="noopener noreferrer">
            <Image src="/images/blogs/blog-2/Img_2.png" alt="" fill sizes="390px" />
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
