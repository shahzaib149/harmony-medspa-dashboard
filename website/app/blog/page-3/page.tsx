import Image from "next/image";
import Link from "next/link";
import BlogSearchForm from "@/components/blog/BlogSearchForm";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

const posts = [
  {
    title: "Get Radiant Skin This Holiday Season with Skinbetter's Best-Selling Products",
    image: "/images/blogs/get-radiant-skin/1.jpg",
    imageAlt: "Cyber Skincare Week promotion with radiant skin model",
    href: "/blog/get-radiant-skin-this-holiday-season-with-skinbetters-best-selling-products",
    excerpt:
      "The holiday season is around the corner, and at Harmony Med Spa, we're here to help you shine brighter than ever. Whether you're prepping for festive gatherings, pampering yourself as the year ends, or stocking up during Cyber Skincare Week, now is the perfect time to invest in radiant, holiday-ready skin."
  },
  {
    title: "Who is a Good Candidate for Injectables?",
    image: "/images/blogs/good-candidate-injectables/1.jpg",
    imageAlt: "Patient receiving an injectable aesthetic treatment",
    href: "/blog/who-is-a-good-candidate-for-injectables",
    excerpt:
      "Injectables have revolutionized the cosmetic industry, offering a minimally invasive way to enhance your appearance, smooth wrinkles, and rejuvenate the skin. Whether you're looking to add volume, reduce the appearance of fine lines, or prevent the onset of aging, injectables may be an ideal option for you."
  },
  {
    title: "What is Medical Weight Loss?",
    image: "/images/blogs/blog-3/3.jpg",
    imageAlt: "Woman measuring her waist for medical weight loss",
    href: "/blog/what-is-medical-weight-loss",
    excerpt:
      "Are you struggling to lose weight and keep it off despite your best efforts? You're not alone. Millions of people around the world face similar challenges when it comes to achieving sustainable weight loss. The good news is that there's a solution that can help you reach your goals - medical weight loss."
  },
  {
    title: "What Areas Can Be Treated with Dermal Fillers?",
    image: "/images/blogs/blog-3/4.jpg",
    imageAlt: "Dermal filler injection treatment",
    href: "/blog/what-areas-can-be-treated-with-dermal-fillers",
    excerpt:
      "Dermal fillers have become increasingly popular in the world of aesthetic treatments, offering a non-surgical solution to address a variety of concerns. These versatile injectables can help restore volume, smooth wrinkles, and enhance facial features, providing a natural-looking and rejuvenated appearance. Whether you're looking to plump up your lips, sculpt your cheeks, or minimize the appearance of fine lines, dermal fillers may be the answer you've been seeking."
  },
  {
    title: "Who is a Good Candidate for RF Microneedling?",
    image: "/images/blogs/blog-3/5.jpg",
    imageAlt: "Secret PRO RF microneedling technology",
    href: "/blog/who-is-a-good-candidate-for-rf-microneedling",
    excerpt:
      "RF (radiofrequency) microneedling is a revolutionary cosmetic treatment that combines the power of radiofrequency energy with the precision of microneedling. This innovative technique has gained popularity in recent years due to its ability to address a wide range of skin concerns, from fine lines and wrinkles to acne scars and uneven skin tone."
  },
  {
    title: "What Causes Collagen to Decrease?",
    image: "/images/blogs/blog-3/6.jpg",
    imageAlt: "Secret PRO collagen support treatment graphic",
    href: "/blog/what-causes-collagen-to-decrease",
    excerpt:
      "Collagen, a structural protein, plays a pivotal role in maintaining the integrity and youthful appearance of your skin. It forms an intricate network of fibers that provide strength, elasticity, and support to the skin's structure. Collagen's abundance in the dermis, the skin's middle layer, contributes to a smooth, plump, and radiant complexion. However, as time passes, collagen levels naturally decline, leading to visible signs of aging."
  },
  {
    title: "Benefits of Regular Facials: How They Improve Skin Health and Appearance",
    image: "/images/blogs/blog-3/7.jpg",
    imageAlt: "Facial treatment for skin health and appearance",
    href: "/blog/benefits-of-regular-facials-how-they-improve-skin-health-and-appearance",
    excerpt:
      "Facials are specialized skincare treatments that focus on cleansing, exfoliating, and nourishing the skin on your face. These treatments are designed to address various skin concerns, ranging from dullness and dehydration to acne and signs of aging. Facials can be customized to meet your individual needs, and many spas offer a variety of specialized facials, such as anti-aging, acne-fighting, or brightening treatments."
  },
  {
    title: "Unlocking Radiant Skin: The Science Behind RF Microneedling",
    image: "/images/blogs/blog-3/8.jpg",
    imageAlt: "RF microneedling treatment in progress",
    href: "/blog/micro-needling-rf-accelerated-skin-rejuvenation",
    excerpt:
      "Achieving radiant skin is a goal for many individuals seeking to enhance their appearance and boost their confidence. With the advancements in aesthetic technology, there are various treatments available to address common skin concerns. One such treatment that has gained popularity in recent years is RF Microneedling. This innovative procedure combines the power of radiofrequency energy and microneedling to unlock radiant skin."
  },
  {
    title: "Understanding Semaglutide: How it Works to Aid Weight Loss",
    image: "/images/blogs/blog-3/9.jpg",
    imageAlt: "Semaglutide injection for medical weight loss",
    href: "/blog/understanding-semaglutide-how-it-works-to-aid-weight-loss",
    excerpt:
      "Weight management is a complex and often frustrating journey for many. Amidst the myriad of solutions, medical weight loss has emerged as a promising avenue for those seeking sustainable results. Semaglutide has garnered significant attention due to its efficacy."
  }
];

export default function BlogPageThree() {
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
            <Link href="/blog/page-2" aria-label="Page 2">2</Link>
            <span aria-current="page">3</span>
          </nav>
        </div>

        <aside className="blog-sidebar grid [align-content:start] gap-[20px] [&_.about-search]:h-[70px] [&_.about-search]:mb-[15px] [&_.about-side-card]:min-h-[269px] [&_.about-side-card]:rounded-[18px] [&_.about-side-card_span]:text-[length:30px] [&_.about-side-card_small]:text-[length:22px] max-[1050px]:grid-cols-[repeat(2,minmax(240px,390px))] max-[1050px]:justify-center max-[1050px]:[&_.about-search]:col-[1_/_-1] max-[720px]:grid-cols-[1fr] max-[720px]:[&_.about-side-card]:min-h-[220px]" aria-label="Blog links">
          <BlogSearchForm />

          <Link className="about-side-card relative grid [place-items:center] min-h-[184px] overflow-hidden rounded-[10px] text-[#fff] text-center isolate before:content-[''] before:absolute before:inset-0 before:z-[-1] before:[background:rgba(0,0,0,0.34)] [&_img]:z-[-2] [&_img]:object-cover [&_img]:[transition:transform_420ms_ease] [&_span]:text-[length:25px] [&_span]:leading-[1.1] [&_span]:font-normal [&_small]:inline-flex [&_small]:min-w-[146px] [&_small]:justify-center [&_small]:mt-[10px] [&_small]:py-[12px] [&_small]:px-[18px] [&_small]:[border-top:1px_solid_var(--gold)] [&_small]:[border-bottom:1px_solid_var(--gold)] [&_small]:text-[length:16px]" href="/services" target="_blank" rel="noopener noreferrer">
            <Image src="/images/blogs/blog-3/img_1.png" alt="" fill sizes="390px" />
            <span>
              All
              <br />
              Services
            </span>
            <small>Learn More</small>
          </Link>

          <Link className="about-side-card relative grid [place-items:center] min-h-[184px] overflow-hidden rounded-[10px] text-[#fff] text-center isolate before:content-[''] before:absolute before:inset-0 before:z-[-1] before:[background:rgba(0,0,0,0.34)] [&_img]:z-[-2] [&_img]:object-cover [&_img]:[transition:transform_420ms_ease] [&_span]:text-[length:25px] [&_span]:leading-[1.1] [&_span]:font-normal [&_small]:inline-flex [&_small]:min-w-[146px] [&_small]:justify-center [&_small]:mt-[10px] [&_small]:py-[12px] [&_small]:px-[18px] [&_small]:[border-top:1px_solid_var(--gold)] [&_small]:[border-bottom:1px_solid_var(--gold)] [&_small]:text-[length:16px]" href="/contact-us" target="_blank" rel="noopener noreferrer">
            <Image src="/images/blogs/blog-3/Img_2.png" alt="" fill sizes="390px" />
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
