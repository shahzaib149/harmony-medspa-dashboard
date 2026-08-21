import Image from "next/image";
import Link from "next/link";
import BlogSearchForm from "@/components/blog/BlogSearchForm";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

export default function PreparingForLaserSessionBlogPage() {
  return (
    <main className="blog-page blog-detail-page min-h-[100vh] bg-[#fff] text-[#000]">
      <SiteHeader className="contact-page-header" />

      <section className="blog-hero blog-detail-hero grid [place-items:center] [background:linear-gradient(rgba(0,0,0,0.62),rgba(0,0,0,0.62)),radial-gradient(circle_at_22%_38%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_70%_42%,rgba(255,255,255,0.06),transparent_24%),repeating-linear-gradient(29deg,rgba(255,255,255,0.025)_0_2px,transparent_2px_9px),linear-gradient(135deg,#252525,#101010_52%,#242424)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:font-thin min-h-[341px] py-[48px] px-[24px] text-center [&_h1]:w-[min(100%,1290px)] [&_h1]:text-[length:clamp(42px,3.5vw,58px)] [&_h1]:leading-[1.05] max-[720px]:min-h-[230px]">
        <h1><TypewriterText text="preparing for your laser session: what to avoid beforehand" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="blog-content blog-detail-content grid gap-[90px] w-[min(100%_-_48px,1300px)] my-0 mx-auto pb-[142px] px-0 [align-items:start] grid-cols-[minmax(0,820px)_390px] pt-[100px] max-[1050px]:grid-cols-[minmax(0,680px)] max-[1050px]:justify-center max-[1050px]:gap-[46px] max-[1050px]:pt-[76px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[46px] max-[720px]:pt-[56px] max-[720px]:pb-[76px] max-[720px]:px-0">
        <article className="blog-article min-w-[0] text-[#4f5966] text-[length:19px] leading-[1.82] [&_p]:mt-0 [&_p]:mb-[18px] [&_p]:mx-0 [&_h2]:mt-[34px] [&_h2]:mb-[17px] [&_h2]:mx-0 [&_h2]:text-[#ebb35a] [&_h2]:text-[length:30px] [&_h2]:leading-[1.2] [&_h2]:font-thin [&_h3]:mt-[18px] [&_h3]:mb-[2px] [&_h3]:mx-0 [&_h3]:text-[#4f5966] [&_h3]:text-[length:19px] [&_h3]:leading-[1.45] [&_h3]:font-normal [&_ol]:mt-0 [&_ol]:mb-[26px] [&_ol]:mr-0 [&_ol]:ml-[24px] [&_ol]:p-0 [&_li]:pl-[22px] [&_li]:leading-[1.65] [&_a]:text-[#e2a719]">
          <div className="blog-article-lede grid grid-cols-[minmax(0,1fr)_300px] gap-[28px] [align-items:start] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[22px]">
            <div>
              <p>
                Laser treatments have become one of the most popular options for achieving smoother, more youthful skin. At Harmony Med Spa in
                Sarasota, our Fractional CO2 laser treatments deliver transformative results by targeting deep layers of the skin to improve tone,
                texture, and elasticity. To get the best possible outcome, it&apos;s essential to properly prepare before your session.
              </p>
            </div>
            <div className="blog-article-feature-image relative min-h-[204px] overflow-hidden rounded-[14px] bg-[#eee] [&_img]:object-cover">
              <Image src="/images/blogs/blog-1/8.jpg" alt="Patient wearing eye protection during a laser session" fill sizes="300px" priority />
            </div>
          </div>

          <h2><TypewriterText text="Table Of Contents" startOnView /></h2>
          <ol>
            <li>Understanding Fractional CO2 Laser Treatments</li>
            <li>Why Preparation Matters</li>
            <li>What to Avoid Before Your Laser Session</li>
            <li>What to Expect During Your Visit</li>
            <li>Frequently Asked SEO Questions</li>
          </ol>

          <h2><TypewriterText text="Understanding Fractional CO2 Laser Treatments" startOnView /></h2>
          <p>
            Fractional CO2 laser therapy works by creating microscopic channels in the skin that stimulate collagen production and encourage
            natural healing. This process helps reduce fine lines, sun damage, acne scars, and uneven pigmentation - making it a cornerstone of
            skin rejuvenation in Sarasota. Because the treatment is so effective, proper preparation ensures your skin is in optimal condition to
            respond and heal beautifully.
          </p>

          <h2><TypewriterText text="Why Preparation Matters" startOnView /></h2>
          <p>
            Your pre-treatment care directly affects how your skin reacts to the laser and how quickly it recovers. Avoiding certain activities,
            products, and habits reduces your risk of irritation, inflammation, or unwanted pigmentation.
          </p>

          <h2><TypewriterText text="What To Avoid Before Your Laser Session" startOnView /></h2>
          <p>
            For at least two weeks before treatment, avoid direct sun exposure, tanning beds, and self-tanners. Sunburned or tanned skin is more
            prone to side effects like hyperpigmentation and delayed healing. Always wear sunscreen and protective clothing when outdoors.
          </p>
          <p>
            Discontinue use of retinoids, glycolic acids, and exfoliating scrubs at least 5 - 7 days before your session. These ingredients make
            your skin more sensitive and can lead to irritation during treatment.
          </p>
          <p>
            Avoid any hair removal methods or aggressive exfoliating treatments within one week of your laser appointment. These can leave the skin
            more vulnerable to discomfort or damage from the laser.
          </p>
          <p>
            On the day of your session, arrive with clean, product-free skin. Skip heavy makeup, perfumes, or lotions, as these can interfere with
            the laser and affect the precision of your treatment.
          </p>

          <h2><TypewriterText text="What To Expect During Your Visit" startOnView /></h2>
          <p>
            We will assess your skin, discuss your goals, and customize your laser settings for optimal results. During your visit, we&apos;ll also
            outline a personalized treatment plan based on your skin&apos;s condition and desired outcome. Some patients achieve their goals after a
            single session, while others benefit from a series of treatments spaced several weeks apart for more dramatic results.
          </p>
          <p>
            Fractional CO2 laser treatments typically require minimal downtime, and our team will provide detailed aftercare instructions to help
            you heal comfortably and achieve long-lasting rejuvenation. We&apos;ll also schedule follow-up sessions to monitor your progress,
            adjust your treatment plan if needed, and ensure that your skin continues to improve with each visit.
          </p>

          <h2><TypewriterText text="Frequently Asked Questions" startOnView /></h2>
          <h3>1. How long should I avoid the sun before my laser session?</h3>
          <p>At least two weeks before treatment, minimize direct sun exposure and wear SPF 30+ daily.</p>
          <h3>2. Can I use my regular skincare routine before a laser treatment?</h3>
          <p>Avoid active ingredients like retinol, AHAs, and BHAs for about a week prior.</p>
          <h3>3. What&apos;s the downtime after Fractional CO2 laser treatment?</h3>
          <p>Most clients experience mild redness and peeling for a few days, with full recovery in about a week.</p>
          <h3>4. How many sessions will I need for optimal results?</h3>
          <p>Many patients see significant improvement after one treatment, though a series may be recommended for deeper concerns.</p>
          <h3>5. Is laser skin rejuvenation safe for all skin types?</h3>
          <p>Yes, but your provider will evaluate your skin tone and type to customize your treatment safely and effectively.</p>

          <h2><TypewriterText text="Discover How Fractional CO2 Laser Treatments Can Refresh Your Look" startOnView /></h2>
          <p>
            For personalized Fractional CO2 laser treatments and advanced skin rejuvenation in Sarasota, schedule your consultation with Harmony
            Med Spa. Call (941) 923-8990 to <a href="https://na02.patientnow.com/a/HARMONYMEDSPA/OnlineBooking.aspx" target="_blank" rel="noopener noreferrer">book</a> an appointment today.
          </p>
        </article>

        <aside className="blog-sidebar grid [align-content:start] gap-[20px] [&_.about-search]:h-[70px] [&_.about-search]:mb-[15px] [&_.about-side-card]:min-h-[269px] [&_.about-side-card]:rounded-[18px] [&_.about-side-card_span]:text-[length:30px] [&_.about-side-card_small]:text-[length:22px] max-[1050px]:grid-cols-[repeat(2,minmax(240px,390px))] max-[1050px]:justify-center max-[1050px]:[&_.about-search]:col-[1_/_-1] max-[720px]:grid-cols-[1fr] max-[720px]:[&_.about-side-card]:min-h-[220px]" aria-label="Blog links">
          <BlogSearchForm />

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
