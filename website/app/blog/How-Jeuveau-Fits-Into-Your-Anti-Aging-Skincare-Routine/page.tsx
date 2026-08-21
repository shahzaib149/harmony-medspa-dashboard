import Image from "next/image";
import Link from "next/link";
import BlogSearchForm from "@/components/blog/BlogSearchForm";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

export default function JeuveauSkincareRoutineBlogPage() {
  return (
    <main className="blog-page blog-detail-page min-h-[100vh] bg-[#fff] text-[#000]">
      <SiteHeader className="contact-page-header" />

      <section className="blog-hero blog-detail-hero grid [place-items:center] [background:linear-gradient(rgba(0,0,0,0.62),rgba(0,0,0,0.62)),radial-gradient(circle_at_22%_38%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_70%_42%,rgba(255,255,255,0.06),transparent_24%),repeating-linear-gradient(29deg,rgba(255,255,255,0.025)_0_2px,transparent_2px_9px),linear-gradient(135deg,#252525,#101010_52%,#242424)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:font-thin min-h-[341px] py-[48px] px-[24px] text-center [&_h1]:w-[min(100%,1290px)] [&_h1]:text-[length:clamp(42px,3.5vw,58px)] [&_h1]:leading-[1.05] max-[720px]:min-h-[230px]">
        <h1><TypewriterText text="how jeuveau fits into your anti-aging skincare routine" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="blog-content blog-detail-content grid gap-[90px] w-[min(100%_-_48px,1300px)] my-0 mx-auto pb-[142px] px-0 [align-items:start] grid-cols-[minmax(0,820px)_390px] pt-[100px] max-[1050px]:grid-cols-[minmax(0,680px)] max-[1050px]:justify-center max-[1050px]:gap-[46px] max-[1050px]:pt-[76px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[46px] max-[720px]:pt-[56px] max-[720px]:pb-[76px] max-[720px]:px-0">
        <article className="blog-article min-w-[0] text-[#4f5966] text-[length:19px] leading-[1.82] [&_p]:mt-0 [&_p]:mb-[18px] [&_p]:mx-0 [&_h2]:mt-[44px] [&_h2]:mb-[17px] [&_h2]:mx-0 [&_h2]:text-[#ebb35a] [&_h2]:text-[length:30px] [&_h2]:leading-[1.2] [&_h2]:font-thin [&_ul]:mt-0 [&_ul]:mb-[20px] [&_ul]:mr-0 [&_ul]:ml-[22px] [&_ul]:p-0 [&_li]:pl-[4px] [&_li]:leading-[1.65]">
          <div className="blog-article-lede grid grid-cols-[minmax(0,1fr)_300px] gap-[28px] [align-items:start] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[22px]">
            <div>
              <p>
                When it comes to aging gracefully, a consistent skincare routine is only part of the equation. While high-quality products
                can improve skin tone and texture, they often fall short in addressing deeper expression lines caused by repetitive facial
                movements. That&apos;s where Jeuveau<sup>&reg;</sup> comes in. Whether you&apos;re new to injectables or looking to refine
                your existing routine, Jeuveau<sup>&reg;</sup> can be a seamless and effective addition to your anti-aging strategy.
              </p>
            </div>
            <div className="blog-article-feature-image relative min-h-[200px] overflow-hidden rounded-[14px] bg-[#eee] [&_img]:object-cover">
              <Image src="/images/blogs/blog-2/3.jpg" alt="Woman reviewing her anti-aging skincare routine" fill sizes="300px" priority />
            </div>
          </div>

          <h2><TypewriterText text="What Is Jeuveau?" startOnView /></h2>
          <p>
            Jeuveau<sup>&reg;</sup> is an FDA-approved neurotoxin similar to Botox<sup>&reg;</sup>, created specifically for aesthetic
            purposes. It targets the muscles responsible for expression lines, which are the creases that form over time from repeated facial
            movements such as frowning, squinting, or raising your eyebrows. Once injected, Jeuveau<sup>&reg;</sup> blocks the nerve signals
            to these muscles, helping reduce their activity and soften the appearance of lines and wrinkles.
          </p>

          <h2><TypewriterText text="Fast-Acting Results" startOnView /></h2>
          <p>
            Most people begin to see visible improvements within a few days of treatment, with full results appearing in about 7-10 days. It
            is a quick way to refresh your look without the downtime associated with more invasive procedures.
          </p>

          <h2><TypewriterText text="Complements Your Current Skincare Products" startOnView /></h2>
          <p>
            Topical products can improve skin texture, tone, and hydration, but they cannot reach the muscle activity beneath the skin.
            Jeuveau<sup>&reg;</sup> works at a deeper level, making it an ideal complement to your existing anti-aging regimen.
          </p>

          <h2><TypewriterText text="Preventative Aging" startOnView /></h2>
          <p>
            In addition to smoothing existing lines, Jeuveau<sup>&reg;</sup> can also help prevent deeper wrinkles from forming over time.
            By limiting repetitive facial movements, it reduces the chances of new lines becoming permanent.
          </p>

          <h2><TypewriterText text="Natural Looking Enhancements" startOnView /></h2>
          <p>
            When administered by our professionals, Jeuveau<sup>&reg;</sup> offers subtle and natural results. You will look more rested and
            youthful without drastically altering your appearance. The goal is to enhance your features rather than change them, so you still
            look like yourself, just more refreshed. With precise placement and the right dosage, Jeuveau<sup>&reg;</sup> delivers results that
            are smooth and balanced, never frozen or overdone.
          </p>

          <h2><TypewriterText text="How To Incorporate Jeuveau Into Your Routine" startOnView /></h2>
          <p>The best way to include Jeuveau<sup>&reg;</sup> in your anti-aging plan is to pair it with a consistent skincare routine that includes:</p>
          <ul>
            <li>Sunscreen: Protects your skin and prolongs the effects of injectables.</li>
            <li>Retinoids: Boosts cell turnover and smooths skin texture.</li>
            <li>Moisturizers: Keeps your skin barrier strong and hydrated.</li>
            <li>Antioxidants: Fights free radicals that accelerate aging.</li>
          </ul>
          <p>
            Jeuveau<sup>&reg;</sup> injections can be scheduled every 3-4 months depending on your goals and how your body metabolizes the
            product. Regular treatments help maintain a smooth and refreshed appearance year-round.
          </p>

          <h2><TypewriterText text="Ready To Enhance Your Skincare Routine With Jeuveau?" startOnView /></h2>
          <p>
            Jeuveau<sup>&reg;</sup> is more than just a wrinkle reducer, it is a strategic addition to your overall skincare and anti-aging
            plan. By targeting the source of dynamic wrinkles, it offers results that creams and serums simply cannot achieve on their own.
            When combined with high-quality skincare and healthy lifestyle habits, Jeuveau<sup>&reg;</sup> can help you age gracefully and
            confidently.
          </p>
          <p>
            Contact Harmony Med Spa to schedule your consultation and discover what Jeuveau<sup>&reg;</sup> can do for you. Visit our office
            in Sarasota, Florida, or call (941) 923-8990 to book an appointment today.
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
