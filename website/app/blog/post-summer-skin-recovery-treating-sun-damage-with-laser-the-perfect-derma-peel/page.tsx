import Image from "next/image";
import Link from "next/link";
import BlogSearchForm from "@/components/blog/BlogSearchForm";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

export default function PostSummerSkinRecoveryDermaPeelBlogPage() {
  return (
    <main className="blog-page blog-detail-page min-h-[100vh] bg-[#fff] text-[#000]">
      <SiteHeader className="contact-page-header" />

      <section className="blog-hero blog-detail-hero grid [place-items:center] [background:linear-gradient(rgba(0,0,0,0.62),rgba(0,0,0,0.62)),radial-gradient(circle_at_22%_38%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_70%_42%,rgba(255,255,255,0.06),transparent_24%),repeating-linear-gradient(29deg,rgba(255,255,255,0.025)_0_2px,transparent_2px_9px),linear-gradient(135deg,#252525,#101010_52%,#242424)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:font-thin min-h-[341px] py-[48px] px-[24px] text-center [&_h1]:w-[min(100%,1290px)] [&_h1]:text-[length:clamp(42px,3.5vw,58px)] [&_h1]:leading-[1.05] max-[720px]:min-h-[230px]">
        <h1><TypewriterText text="post-summer skin recovery: treating sun damage with laser & the perfect derma peel" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="blog-content blog-detail-content grid gap-[90px] w-[min(100%_-_48px,1300px)] my-0 mx-auto pb-[142px] px-0 [align-items:start] grid-cols-[minmax(0,820px)_390px] pt-[100px] max-[1050px]:grid-cols-[minmax(0,680px)] max-[1050px]:justify-center max-[1050px]:gap-[46px] max-[1050px]:pt-[76px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[46px] max-[720px]:pt-[56px] max-[720px]:pb-[76px] max-[720px]:px-0">
        <article className="blog-article min-w-[0] text-[#4f5966] text-[length:19px] leading-[1.82] [&_p]:mt-0 [&_p]:mb-[18px] [&_p]:mx-0 [&_h2]:mt-[44px] [&_h2]:mb-[17px] [&_h2]:mx-0 [&_h2]:text-[#ebb35a] [&_h2]:text-[length:30px] [&_h2]:leading-[1.2] [&_h2]:font-thin [&_h3]:mt-[18px] [&_h3]:mb-[2px] [&_h3]:mx-0 [&_h3]:text-[#4f5966] [&_h3]:text-[length:19px] [&_h3]:leading-[1.45] [&_h3]:font-normal [&_ul]:mt-0 [&_ul]:mb-[20px] [&_ul]:mr-0 [&_ul]:ml-[22px] [&_ul]:p-0 [&_li]:pl-[4px] [&_li]:leading-[1.65]">
          <div className="blog-article-lede grid grid-cols-[minmax(0,1fr)_300px] gap-[28px] [align-items:start] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[22px]">
            <div>
              <p>
                Spending time in the sun is one of the best parts of summer, but too much exposure can take a toll on your skin. Even with
                sunscreen, UV rays can accelerate signs of aging, create uneven pigmentation, and leave your complexion looking dull or tired.
                The good news is that your skin can bounce back with the right care. At Harmony Med Spa, advanced treatments like Fractional CO2
                Laser and the Perfect Derma Peel for sun damage are designed to target sun damage, restore skin health, and bring back a more
                youthful glow.
              </p>
            </div>
            <div className="blog-article-feature-image relative min-h-[204px] overflow-hidden rounded-[14px] bg-[#eee] [&_img]:object-cover">
              <Image src="/images/blogs/blog-2/1.jpg" alt="Fractional CO2 laser treatment for post-summer skin recovery" fill sizes="300px" priority />
            </div>
          </div>

          <h2><TypewriterText text="What Does Sun Damage Look Like?" startOnView /></h2>
          <p>Sun damage, also called photoaging, develops gradually and may show up as:</p>
          <ul>
            <li>Uneven skin tone and hyperpigmentation (dark spots)</li>
            <li>Fine lines and wrinkles</li>
            <li>Rough, leathery texture</li>
            <li>Enlarged pores</li>
            <li>Loss of firmness and elasticity</li>
            <li>Redness or broken capillaries</li>
          </ul>
          <p>Addressing these issues promptly can help prevent them from worsening over time.</p>

          <h2><TypewriterText text="Fractional CO2 Laser Treatment" startOnView /></h2>
          <p>
            Fractional CO2 laser treatment uses targeted beams of light to create micro-injuries in the skin&apos;s deeper layers. This process
            stimulates the body&apos;s natural healing response, encouraging the production of fresh collagen and elastin.
          </p>
          <p>Benefits:</p>
          <ul>
            <li>Reduces fine lines and wrinkles</li>
            <li>Improves skin tone and texture</li>
            <li>Lightens sun spots and pigmentation</li>
            <li>Tightens sagging skin</li>
            <li>Promotes long-lasting rejuvenation</li>
          </ul>
          <p>Because it works at a deeper level, Fractional CO2 is especially effective for moderate to severe sun damage.</p>

          <h2><TypewriterText text="The Perfect Derma Peel" startOnView /></h2>
          <p>
            For patients concerned about discoloration, dark spots, acne, or overall skin tone, The Perfect Derma Peel is an excellent option.
            This medical-grade, medium-depth peel is safe and effective for all skin types and ethnicities. Its unique formula delivers noticeable
            improvements for aging skin, hyperpigmentation, melasma, and acne.
          </p>
          <p>
            The process itself is quick (typically around 15 minutes) and requires only a few days of visible peeling, usually lasting two to four
            days. Within a week, patients begin to see brighter, smoother, and healthier-looking skin.
          </p>
          <p>
            What makes this peel stand out is its inclusion of Glutathione, a powerful antioxidant that decreases with age and environmental
            stress. By working at the cellular level, Glutathione helps combat free radical damage, brighten the complexion, and slow the
            skin&apos;s natural aging process. With regular treatments, The Perfect Derma Peel can also help prevent future fine lines, wrinkles,
            and uneven pigmentation.
          </p>

          <h2><TypewriterText text="Restore And Renew At Harmony Med Spa" startOnView /></h2>
          <p>
            Post-summer skin recovery is about more than repairing sun damage - it&apos;s about giving your skin the care it needs to look
            refreshed and healthy year-round. With advanced treatments like Fractional CO2 Laser and The Perfect Derma Peel, we offer effective
            solutions to restore radiance and maintain youthful, glowing skin.
          </p>
          <p>
            Ready to refresh your skin after summer? Schedule a consultation with Harmony Med Spa in Sarasota, Florida, to learn how our
            treatments can help you achieve smoother, brighter, and more radiant skin. Call us today at (941) 923-8990 to book your appointment
            today.
          </p>
        </article>

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
