import Image from "next/image";
import Link from "next/link";
import BlogSearchForm from "@/components/blog/BlogSearchForm";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

export default function SculptraCollagenComebackBlogPage() {
  return (
    <main className="blog-page blog-detail-page min-h-[100vh] bg-[#fff] text-[#000]">
      <SiteHeader className="contact-page-header" />

      <section className="blog-hero blog-detail-hero grid [place-items:center] [background:linear-gradient(rgba(0,0,0,0.62),rgba(0,0,0,0.62)),radial-gradient(circle_at_22%_38%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_70%_42%,rgba(255,255,255,0.06),transparent_24%),repeating-linear-gradient(29deg,rgba(255,255,255,0.025)_0_2px,transparent_2px_9px),linear-gradient(135deg,#252525,#101010_52%,#242424)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:font-thin min-h-[341px] py-[48px] px-[24px] text-center [&_h1]:w-[min(100%,1290px)] [&_h1]:text-[length:clamp(42px,3.5vw,58px)] [&_h1]:leading-[1.05] max-[720px]:min-h-[230px]">
        <h1><TypewriterText text="the collagen comeback: how sculptra rebuilds your skin from within" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="blog-content blog-detail-content grid gap-[90px] w-[min(100%_-_48px,1300px)] my-0 mx-auto pb-[142px] px-0 [align-items:start] grid-cols-[minmax(0,820px)_390px] pt-[100px] max-[1050px]:grid-cols-[minmax(0,680px)] max-[1050px]:justify-center max-[1050px]:gap-[46px] max-[1050px]:pt-[76px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[46px] max-[720px]:pt-[56px] max-[720px]:pb-[76px] max-[720px]:px-0">
        <article className="blog-article min-w-[0] text-[#4f5966] text-[length:19px] leading-[1.82] [&_p]:mt-0 [&_p]:mb-[18px] [&_p]:mx-0 [&_h2]:mt-[44px] [&_h2]:mb-[17px] [&_h2]:mx-0 [&_h2]:text-[#ebb35a] [&_h2]:text-[length:30px] [&_h2]:leading-[1.2] [&_h2]:font-thin [&_ul]:mt-0 [&_ul]:mb-[20px] [&_ul]:mr-0 [&_ul]:ml-[22px] [&_ul]:p-0 [&_li]:pl-[4px] [&_li]:leading-[1.65]">
          <div className="blog-article-lede grid grid-cols-[minmax(0,1fr)_300px] gap-[28px] [align-items:start] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[22px]">
            <div>
              <p>
                As the years pass, subtle changes in our skin begin to appear. Fine lines become more noticeable, cheeks lose
                volume, and the smooth texture we once had starts to diminish. At Harmony Med Spa, we provide a solution that
                addresses more than just the surface. Sculptra is a specialized injectable treatment designed to work deep
                within the skin, stimulating your body&apos;s natural collagen production.
              </p>
            </div>
            <div className="blog-article-feature-image relative min-h-[200px] overflow-hidden rounded-[14px] bg-[#eee] [&_img]:object-cover">
              <Image src="/images/blogs/blog-2/4.jpg" alt="Sculptra injectable consultation" fill sizes="300px" priority />
            </div>
          </div>

          <h2><TypewriterText text="Understanding Collagen Loss And Aging Skin" startOnView /></h2>
          <p>
            Collagen is the scaffolding beneath the surface of your skin. It provides the structure that keeps skin looking
            plump, tight, and resilient. However, after your 20s, your natural collagen production declines steadily each
            year. This loss contributes to common signs of aging such as:
          </p>
          <ul>
            <li>Fine lines and wrinkles</li>
            <li>Thinning or sagging skin</li>
            <li>Loss of facial volume</li>
            <li>Changes in skin texture</li>
          </ul>
          <p>
            Traditional fillers may offer temporary volume, but they don&apos;t address the root of the problem - collagen
            depletion. That&apos;s where Sculptra stands out.
          </p>

          <h2><TypewriterText text="What Is Sculptra And What Sets It Apart?" startOnView /></h2>
          <p>
            Sculptra is the first and original FDA-approved facial injectable made from poly-L-lactic acid (PLLA-SCA), a
            biocompatible compound that works with your body to rebuild collagen. Rather than filling in wrinkles immediately,
            Sculptra stimulates your body to produce new collagen over time. This regenerative approach creates gradual and
            natural looking results, restoring volume and firmness where it has been lost and improving overall skin quality
            without an overfilled or artificial appearance.
          </p>

          <h2><TypewriterText text="How Sculptra Works" startOnView /></h2>
          <p>
            Sculptra is typically administered in a series of treatments spaced several weeks apart. As the PLLA microparticles
            are absorbed into the skin, they trigger the body&apos;s natural collagen production processes. While results are
            not instant, they are long-lasting.
          </p>
          <p>
            You may begin to see improvement in your skin&apos;s texture and firmness as early as one month after treatment.
            With continued collagen regeneration, full results develop gradually and can last up to two years or more.
          </p>

          <h2><TypewriterText text="The Benefits Of Sculptra For Skin Rejuvenation" startOnView /></h2>
          <p>
            Sculptra is an excellent choice for individuals looking for a more holistic, long-term approach to facial
            rejuvenation. Key benefits include:
          </p>
          <ul>
            <li>Gradual, natural-looking enhancement</li>
            <li>Improved skin texture and elasticity</li>
            <li>Reduction in fine lines and deep wrinkles</li>
            <li>Restoration of youthful facial contours</li>
            <li>Long-lasting results (up to two years)</li>
          </ul>
          <p>
            Because Sculptra enhances your skin&apos;s foundation rather than simply masking signs of aging, the results tend
            to look more authentic and age-appropriate.
          </p>

          <h2><TypewriterText text="Rediscover Your Glow From Within" startOnView /></h2>
          <p>
            At Harmony Med Spa, your skin health and confidence are our top priorities. Our experienced providers tailor each
            Sculptra treatment to your unique facial anatomy and goals, ensuring a personalized, natural result. We take a
            collaborative, consultation-first approach to ensure that every client feels informed, empowered, and excited
            about their journey.
          </p>
          <p>
            Schedule your consultation with Harmony Med Spa and discover how Sculptra can help you turn back the clock in a
            natural and beautiful way. Visit our office in Sarasota, Florida, or call (941) 923-8990 to book an appointment today.
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
