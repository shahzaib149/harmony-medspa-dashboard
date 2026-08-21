import Image from "next/image";
import Link from "next/link";
import BlogSearchForm from "@/components/blog/BlogSearchForm";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

export default function BenefitsOfRfMicroneedlingBlogPage() {
  return (
    <main className="blog-page blog-detail-page min-h-[100vh] bg-[#fff] text-[#000]">
      <SiteHeader className="contact-page-header" />

      <section className="blog-hero blog-detail-hero grid [place-items:center] [background:linear-gradient(rgba(0,0,0,0.62),rgba(0,0,0,0.62)),radial-gradient(circle_at_22%_38%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_70%_42%,rgba(255,255,255,0.06),transparent_24%),repeating-linear-gradient(29deg,rgba(255,255,255,0.025)_0_2px,transparent_2px_9px),linear-gradient(135deg,#252525,#101010_52%,#242424)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:font-thin min-h-[341px] py-[48px] px-[24px] text-center [&_h1]:w-[min(100%,1120px)] [&_h1]:text-[length:clamp(42px,3.25vw,58px)] [&_h1]:leading-[1.08] max-[720px]:min-h-[230px]">
        <h1><TypewriterText text="benefits of rf microneedling" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="blog-content blog-detail-content grid gap-[90px] w-[min(100%_-_48px,1300px)] my-0 mx-auto pb-[142px] px-0 [align-items:start] grid-cols-[minmax(0,820px)_390px] pt-[100px] max-[1050px]:grid-cols-[minmax(0,680px)] max-[1050px]:justify-center max-[1050px]:gap-[46px] max-[1050px]:pt-[76px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[46px] max-[720px]:pt-[56px] max-[720px]:pb-[76px] max-[720px]:px-0">
        <article className="blog-article min-w-[0] text-[#4f5966] text-[length:19px] leading-[1.82] [&_p]:mt-0 [&_p]:mb-[18px] [&_p]:mx-0 [&_h2]:mt-[36px] [&_h2]:mb-[17px] [&_h2]:mx-0 [&_h2]:text-[#ebb35a] [&_h2]:text-[length:30px] [&_h2]:leading-[1.2] [&_h2]:font-thin [&_h3]:mt-[18px] [&_h3]:mb-[2px] [&_h3]:mx-0 [&_h3]:text-[#4f5966] [&_h3]:text-[length:19px] [&_h3]:leading-[1.45] [&_h3]:font-extrabold [&_ul]:mt-0 [&_ul]:mb-[20px] [&_ul]:mr-0 [&_ul]:ml-[28px] [&_ul]:p-0 [&_li]:pl-[4px] [&_li]:leading-[1.65]">
          <div className="blog-article-lede grid grid-cols-[minmax(0,1fr)_300px] gap-[28px] [align-items:start] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[22px]">
            <div>
              <p>
                When skin starts to feel less smooth, less firm, or more uneven, many people look for a treatment that supports
                natural-looking improvement without surgery. At Harmony Med Spa, we offer RF microneedling in Sarasota as an advanced
                option for improving skin texture, firmness, and overall skin quality.
              </p>
            </div>
            <div className="blog-article-feature-image relative min-h-[200px] overflow-hidden rounded-[14px] bg-[#eee] [&_img]:object-cover">
              <Image src="/images/blogs/blog-1/3.jpg" alt="Secret PRO RF microneedling device and model" fill sizes="300px" priority />
            </div>
          </div>

          <h2><TypewriterText text="Table Of Contents" startOnView /></h2>
          <ul>
            <li>What Is RF Microneedling?</li>
            <li>How It Improves Skin Texture</li>
            <li>Why It Helps With Firmness</li>
            <li>Who May Benefit From Treatment</li>
            <li>FAQs About RF Microneedling</li>
          </ul>

          <h2><TypewriterText text="What Is RF Microneedling?" startOnView /></h2>
          <p>
            RF microneedling combines tiny sterile needles with radiofrequency energy. The needles create controlled micro-injuries in the
            skin, while the radiofrequency energy reaches deeper layers to stimulate collagen and elastin production. Together, these effects
            help support smoother, firmer-looking skin. For patients considering RF microneedling in Sarasota, this treatment stands out because
            it addresses both surface-level concerns and deeper skin support in one session.
          </p>

          <div className="my-[36px] grid grid-cols-[minmax(0,1fr)_300px] items-center gap-[42px] max-[780px]:grid-cols-[1fr]">
            <section>
              <h2><TypewriterText text="How It Improves Skin Texture" startOnView /></h2>
              <p>
                One of the main benefits of RF microneedling is improving uneven skin texture. It can help soften the appearance of rough skin,
                enlarged pores, acne scars, and fine lines. As collagen rebuilds over time, the skin often looks smoother, fresher, and more
                refined.
              </p>
              <p>
                At Harmony Med Spa, many patients choose RF microneedling in Sarasota because they want visible improvement without a surgical
                procedure or an artificial look.
              </p>
            </section>
            <Image
              className="w-full h-auto max-[780px]:max-w-[380px]"
              src="/images/blogs/rf-microneedling/handpiece.png"
              alt="Secret PRO RF microneedling handpiece"
              width={1080}
              height={1080}
            />
          </div>

          <h2><TypewriterText text="Why It Helps With Firmness" startOnView /></h2>
          <p>
            Skin firmness naturally changes with age as collagen and elastin decline. RF microneedling helps by delivering controlled heat
            beneath the skin&apos;s surface, which encourages tissue remodeling and tighter-looking skin.
          </p>
          <p>
            This makes it a strong option for patients with mild skin laxity who want non-surgical skin rejuvenation. It is often used to improve
            not only texture, but also the overall feel and structure of the skin.
          </p>

          <h2><TypewriterText text="Who May Benefit From Treatment" startOnView /></h2>
          <p>RF microneedling may be a good option for patients in Sarasota who want to address several concerns at once, such as:</p>
          <ul>
            <li>Uneven skin texture</li>
            <li>Fine lines</li>
            <li>Acne scars</li>
            <li>Enlarged pores</li>
            <li>Mild skin laxity</li>
            <li>Dull-looking skin</li>
          </ul>
          <p>Because every patient&apos;s skin is different, treatment should be tailored to individual goals, skin condition, and comfort level.</p>

          <div className="my-[34px] grid grid-cols-[minmax(0,1fr)_280px] items-center gap-[42px] max-[780px]:grid-cols-[1fr]">
            <section>
              <h2><TypewriterText text="FAQs About RF Microneedling" startOnView /></h2>
              <h3>1. What Does RF Microneedling Help Improve?</h3>
              <p>RF microneedling is commonly used to improve skin texture, fine lines, acne scars, enlarged pores, and mild skin laxity.</p>
              <h3>2. How Soon Will I Notice Results?</h3>
              <p>
                Some patients notice early skin improvement relatively soon, but collagen remodeling takes time. Results usually continue to
                develop gradually over the following weeks.
              </p>
            </section>
            <Image
              className="w-full h-auto max-[780px]:max-w-[320px]"
              src="/images/blogs/rf-microneedling/model.png"
              alt="Woman with refreshed skin after RF microneedling"
              width={1080}
              height={1080}
            />
          </div>

          <h3>3. Is RF Microneedling Good For Firmness?</h3>
          <p>
            Yes, RF microneedling is often chosen to support firmer-looking skin because it stimulates collagen and delivers radiofrequency
            energy below the surface.
          </p>
          <h3>4. How Many Treatments Are Usually Recommended?</h3>
          <p>
            The number of treatments depends on your skin concerns and goals. Many patients benefit from a series of sessions for the best
            results.
          </p>
          <h3>5. Is There Downtime After RF Microneedling?</h3>
          <p>
            Downtime is usually limited, but mild redness and sensitivity can happen after treatment. Your provider will explain what to expect
            based on your treatment plan.
          </p>

          <div className="mt-[50px] grid grid-cols-[minmax(0,1fr)_300px] items-center gap-[54px] max-[780px]:grid-cols-[1fr]">
            <section>
              <h2><TypewriterText text="Refresh Your Skin With Confidence At Harmony Med Spa" startOnView /></h2>
              <p>
                If you are looking for a non-surgical way to improve skin texture and firmness, RF microneedling may be the right fit for your
                goals. At Harmony Med Spa, we create personalized treatment plans to help our Sarasota patients achieve smoother, firmer, and
                healthier-looking skin with advanced aesthetic care.
              </p>
              <p>
                Contact Harmony Med Spa to schedule your RF microneedling consultation today. Call our Sarasota, FL office at (941) 923-8990 or
                visit us online to book your appointment.
              </p>
            </section>
            <div className="grid justify-items-center gap-[24px]">
              <Image
                className="w-[min(300px,100%)] h-auto"
                src="/images/blogs/rf-microneedling/secret-pro-logo.png"
                alt="Secret PRO logo"
                width={1080}
                height={1080}
              />
            </div>
          </div>
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
