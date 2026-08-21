import Image from "next/image";
import Link from "next/link";
import BlogSearchForm from "@/components/blog/BlogSearchForm";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

export default function WhatCausesCollagenToDecreaseBlogPage() {
  return (
    <main className="blog-page blog-detail-page min-h-[100vh] bg-[#fff] text-[#000]">
      <SiteHeader className="contact-page-header" />

      <section className="blog-hero blog-detail-hero grid [place-items:center] [background:linear-gradient(rgba(0,0,0,0.62),rgba(0,0,0,0.62)),radial-gradient(circle_at_22%_38%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_70%_42%,rgba(255,255,255,0.06),transparent_24%),repeating-linear-gradient(29deg,rgba(255,255,255,0.025)_0_2px,transparent_2px_9px),linear-gradient(135deg,#252525,#101010_52%,#242424)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:font-thin min-h-[341px] py-[48px] px-[24px] text-center [&_h1]:w-[min(100%,1120px)] [&_h1]:text-[length:clamp(42px,3.5vw,58px)] [&_h1]:leading-[1.05] max-[720px]:min-h-[230px]">
        <h1><TypewriterText text="what causes collagen to decrease?" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="blog-content blog-detail-content grid gap-[90px] w-[min(100%_-_48px,1300px)] my-0 mx-auto pb-[142px] px-0 [align-items:start] grid-cols-[minmax(0,820px)_390px] pt-[100px] max-[1050px]:grid-cols-[minmax(0,680px)] max-[1050px]:justify-center max-[1050px]:gap-[46px] max-[1050px]:pt-[76px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[46px] max-[720px]:pt-[56px] max-[720px]:pb-[76px] max-[720px]:px-0">
        <article className="blog-article min-w-[0] text-[#4f5966] text-[length:19px] leading-[1.82] [&_p]:mt-0 [&_p]:mb-[18px] [&_p]:mx-0 [&_h2]:mt-[44px] [&_h2]:mb-[17px] [&_h2]:mx-0 [&_h2]:text-[#ebb35a] [&_h2]:text-[length:30px] [&_h2]:leading-[1.2] [&_h2]:font-thin [&_ul]:mt-0 [&_ul]:mb-[30px] [&_ul]:mr-0 [&_ul]:ml-[26px] [&_ul]:pl-0 [&_ul]:list-disc [&_ul]:list-outside [&_li]:pl-[4px] [&_li]:leading-[1.45] [&_li]:mb-[6px] [&_li::marker]:text-[#5f6670] [&_li::marker]:text-[length:14px] [&_strong]:font-extrabold">
          <div className="blog-article-lede grid grid-cols-[minmax(0,1fr)_300px] gap-[28px] [align-items:start] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[22px]">
            <div>
              <p>
                Collagen, a structural protein, plays a pivotal role in maintaining the integrity and youthful appearance of
                your skin. It forms an intricate network of fibers that provide strength, elasticity, and support to the
                skin&apos;s structure. Collagen&apos;s abundance in the dermis, the skin&apos;s middle layer, contributes to a
                smooth, plump, and radiant complexion. However, as time passes, collagen levels naturally decline, leading to
                visible signs of aging.
              </p>
            </div>
            <div className="blog-article-feature-image relative min-h-[180px] overflow-hidden rounded-[14px] bg-[#eee] [&_img]:object-cover">
              <Image src="/images/blogs/blog-3/6.jpg" alt="Secret PRO collagen support treatment graphic" fill sizes="300px" priority />
            </div>
          </div>

          <h2><TypewriterText text="Factors Leading To Collagen Reduction" startOnView /></h2>
          <p>
            While collagen depletion is an inevitable part of the aging process, several factors can accelerate its decline.
            Understanding these factors can help you take proactive steps to maintain optimal collagen levels and preserve a
            youthful, radiant appearance. Here are some of the key contributors to collagen reduction:
          </p>
          <ul>
            <li><strong>Intrinsic Aging:</strong> As you age, the body&apos;s natural collagen production slows down, leading to a gradual decrease in collagen levels. This process typically begins in your late 20s and accelerates after the age of 40.</li>
            <li><strong>Sun Exposure:</strong> Ultraviolet (UV) radiation from the sun can damage collagen fibers, causing them to break down and become disorganized. Excessive sun exposure is a major contributor to premature skin aging and collagen loss.</li>
            <li><strong>Lifestyle Factors:</strong> Certain lifestyle choices, such as smoking, poor diet, and lack of exercise, can contribute to increased oxidative stress and inflammation, which can accelerate collagen degradation.</li>
            <li><strong>Environmental Pollutants:</strong> Exposure to environmental pollutants, such as air pollution and certain chemicals, can generate free radicals that damage collagen fibers and accelerate their breakdown.</li>
            <li><strong>Hormonal Changes:</strong> Fluctuations in hormones, such as during menopause or pregnancy, can impact collagen production and lead to changes in skin elasticity and firmness.</li>
          </ul>

          <h2><TypewriterText text="Exploring RF Microneedling For Stimulating Collagen Production" startOnView /></h2>
          <p>
            In the quest to combat collagen loss and promote skin rejuvenation, various treatments and techniques have
            emerged. One promising approach is radiofrequency (RF) microneedling, a minimally invasive procedure that combines
            the benefits of microneedling with the power of radiofrequency energy.
          </p>
          <p>
            RF microneedling involves using a device equipped with tiny, insulated needles that penetrate the skin&apos;s
            surface. These needles deliver controlled radiofrequency energy into the dermis layer, creating controlled
            micro-injuries and thermal stimulation.
          </p>
          <p>
            This controlled injury triggers the body&apos;s natural healing response, prompting the production of new collagen
            and elastin fibers. The radiofrequency energy also helps to tighten and contract existing collagen fibers,
            improving skin firmness and elasticity.
          </p>

          <h2><TypewriterText text="Benefits Of RF Microneedling In Collagen Restoration" startOnView /></h2>
          <p>
            RF microneedling offers several advantages in promoting collagen production and restoring a youthful, radiant
            complexion. The micro-injuries created by the needles and the thermal energy from the radiofrequency stimulate
            the body&apos;s natural healing response, triggering the production of new collagen and elastin fibers.
          </p>
          <p>
            As new collagen fibers are formed, the skin&apos;s texture and tone improve, resulting in a smoother, more even
            complexion. The tightening effect of RF microneedling on existing collagen fibers can help minimize the appearance
            of fine lines and wrinkles, contributing to a more youthful appearance. The combination of new collagen production
            and the tightening of existing fibers helps to restore the skin&apos;s elasticity, improving its ability to bounce
            back and maintain a firmer, more lifted appearance.
          </p>
          <p>
            Additionally, RF microneedling is a minimally invasive procedure with relatively short recovery times, making it
            a convenient option for those seeking collagen restoration without extensive downtime.
          </p>

          <h2><TypewriterText text="Prioritizing Collagen For Healthy, Youthful Skin" startOnView /></h2>
          <p>
            By understanding the causes of collagen reduction and exploring innovative treatments like RF microneedling, you
            can take proactive steps to stimulate collagen production and restore a radiant, youthful complexion.
          </p>
          <p>
            By investing in collagen-boosting treatments and adopting a holistic approach to skin care, you can embrace the
            aging process with confidence and grace, while preserving the vibrant, healthy glow of your skin.
          </p>
          <p>
            If you&apos;re concerned about collagen loss and its impact on your skin&apos;s appearance, schedule a consultation
            with our team of skincare professionals. We offer personalized RF microneedling treatments tailored to your unique
            needs, helping you achieve a more youthful, radiant complexion. Visit Harmony Med Spa at our office in Sarasota,
            Florida, or call (941) 923-8990 to book an appointment today.
          </p>
        </article>

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
