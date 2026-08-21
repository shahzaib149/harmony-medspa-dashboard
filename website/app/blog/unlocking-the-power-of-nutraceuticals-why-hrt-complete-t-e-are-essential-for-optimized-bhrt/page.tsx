import Image from "next/image";
import Link from "next/link";
import BlogSearchForm from "@/components/blog/BlogSearchForm";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

export default function HrtCompleteNutraceuticalsBlogPage() {
  return (
    <main className="blog-page blog-detail-page min-h-[100vh] bg-[#fff] text-[#000]">
      <SiteHeader className="contact-page-header" />

      <section className="blog-hero blog-detail-hero grid [place-items:center] [background:linear-gradient(rgba(0,0,0,0.62),rgba(0,0,0,0.62)),radial-gradient(circle_at_22%_38%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_70%_42%,rgba(255,255,255,0.06),transparent_24%),repeating-linear-gradient(29deg,rgba(255,255,255,0.025)_0_2px,transparent_2px_9px),linear-gradient(135deg,#252525,#101010_52%,#242424)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:font-thin min-h-[341px] py-[48px] px-[24px] text-center [&_h1]:w-[min(100%,1290px)] [&_h1]:text-[length:clamp(42px,3.5vw,58px)] [&_h1]:leading-[1.05] max-[720px]:min-h-[230px]">
        <h1><TypewriterText text="unlocking the power of nutraceuticals: why hrt-complete t & e are essential for optimized bhrt" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="blog-content blog-detail-content grid gap-[90px] w-[min(100%_-_48px,1300px)] my-0 mx-auto pb-[142px] px-0 [align-items:start] grid-cols-[minmax(0,820px)_390px] pt-[100px] max-[1050px]:grid-cols-[minmax(0,680px)] max-[1050px]:justify-center max-[1050px]:gap-[46px] max-[1050px]:pt-[76px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[46px] max-[720px]:pt-[56px] max-[720px]:pb-[76px] max-[720px]:px-0">
        <article className="blog-article min-w-[0] text-[#4f5966] text-[length:19px] leading-[1.82] [&_p]:mt-0 [&_p]:mb-[18px] [&_p]:mx-0 [&_h2]:mt-[44px] [&_h2]:mb-[17px] [&_h2]:mx-0 [&_h2]:text-[#ebb35a] [&_h2]:text-[length:30px] [&_h2]:leading-[1.2] [&_h2]:font-thin [&_ul]:mt-0 [&_ul]:mb-[20px] [&_ul]:mr-0 [&_ul]:ml-[22px] [&_ul]:p-0 [&_li]:pl-[4px] [&_li]:leading-[1.65]">
          <div className="blog-article-lede grid grid-cols-[minmax(0,1fr)_300px] gap-[28px] [align-items:start] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[22px]">
            <div>
              <p>
                Not all supplements are created equal, and not all hormone therapies deliver the same results. At Harmony Med
                Spa, we believe in using only the highest-quality, medically backed solutions to support your health. We offer
                HRT-Complete T &amp; E, not as ordinary supplements, but as nutraceuticals. These advanced formulations are
                designed to support and enhance your body&apos;s ability to process and utilize hormones as part of a
                comprehensive bio-identical hormone replacement therapy (BHRT) plan. Backed by the patented EVEXIPEL process
                from EVEXIAS Health Solutions, HRT-Complete plays a vital role in optimizing hormone balance and improving
                long-term wellness at the cellular level.
              </p>
            </div>
            <div className="blog-article-feature-image relative min-h-[180px] overflow-hidden rounded-[14px] bg-[#eee] [&_img]:object-cover">
              <Image src="/images/blogs/blog-2/6.jpg" alt="Woman taking wellness supplements at home" fill sizes="300px" priority />
            </div>
          </div>

          <Link
            className="inline-flex items-center justify-center min-w-[202px] mt-[18px] mb-[14px] py-[14px] px-[18px] [border-top:1px_solid_var(--gold)] [border-bottom:1px_solid_var(--gold)] text-[#000] text-[length:18px] leading-[1] [transition:color_160ms_ease,border-color_160ms_ease,transform_160ms_ease] hover:text-[#b98210] hover:border-[color:#b98210] hover:[transform:translateX(4px)] focus-visible:text-[#b98210] focus-visible:border-[color:#b98210] focus-visible:[transform:translateX(4px)]"
            href="/hrt-complete-nutraceuticals.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            View HRT PDF
          </Link>

          <h2><TypewriterText text="What Are Nutraceuticals?" startOnView /></h2>
          <p>
            Unlike over-the-counter supplements you might find on a shelf, nutraceuticals are formulated using rigorous
            scientific research and medical insight. They contain high-quality, bioavailable ingredients specifically selected
            for their ability to support and optimize biological processes. HRT-Complete T and E are FDA-approved, patented
            formulations from EVEXIAS Health Solutions are designed to help the body process and use hormones efficiently.
          </p>
          <p>
            HRT-Complete T &amp; E nutraceuticals are crafted to help your body metabolize hormones efficiently, eliminating
            harmful byproducts while enhancing the beneficial pathways associated with estrogen and testosterone. This is
            crucial for:
          </p>
          <ul>
            <li>Breast and prostate health</li>
            <li>Disease prevention</li>
            <li>Healthy aging</li>
            <li>Improved detoxification pathways</li>
            <li>Mitochondrial function</li>
            <li>Fat and cholesterol metabolism</li>
            <li>Insulin sensitivity</li>
          </ul>
          <p>HRT-Complete lays the biochemical foundation that helps you get the most out of your BHRT regimen.</p>

          <h2><TypewriterText text="The Role Of BHRT + EVEXIPEL" startOnView /></h2>
          <p>
            At Harmony Med Spa, we specialize in Bio-Identical Hormone Replacement Therapy (BHRT) using the EVEXIPEL method,
            a patented and FDA-approved pellet therapy system developed by EVEXIAS. When combined with HRT-Complete
            nutraceuticals, this approach delivers predictable, lasting hormone balance with fewer fluctuations. Together,
            BHRT and HRT-Complete offer a comprehensive, individualized path to restoring your health, energy, and well-being.
          </p>

          <h2><TypewriterText text="Benefits Of Pairing BHRT With HRT-Complete Nutraceuticals" startOnView /></h2>
          <p>When supported by HRT-Complete, BHRT can help:</p>
          <ul>
            <li>Boost energy and stamina</li>
            <li>Improve mood and mental clarity</li>
            <li>Support libido and sexual wellness</li>
            <li>Reduce symptoms like hot flashes and night sweats</li>
            <li>Enhance muscle tone and decrease fat accumulation</li>
            <li>Support cardiovascular, cognitive, and bone health</li>
          </ul>

          <h2><TypewriterText text="Schedule Your Consultation Today" startOnView /></h2>
          <p>
            At Harmony Med Spa, we don&apos;t believe in one-size-fits-all solutions. With personalized testing, expert
            guidance, and the highest quality nutraceutical support, we can help you unlock the full benefits of hormone
            optimization - safely and effectively.
          </p>
          <p>
            If you&apos;re ready to take the first step toward balanced hormones and revitalized health, schedule your
            consultation with Harmony Med Spa to learn more about how HRT-Complete and our customized BHRT programs can help
            you feel like yourself again. Visit our office in Sarasota, Florida, or call (941) 923-8990 to book an appointment
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
