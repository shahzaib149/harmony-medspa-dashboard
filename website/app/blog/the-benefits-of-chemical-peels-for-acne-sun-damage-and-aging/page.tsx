import Image from "next/image";
import Link from "next/link";
import BlogSearchForm from "@/components/blog/BlogSearchForm";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

export default function ChemicalPeelsBenefitsBlogPage() {
  return (
    <main className="blog-page blog-detail-page min-h-[100vh] bg-[#fff] text-[#000]">
      <SiteHeader className="contact-page-header" />

      <section className="blog-hero blog-detail-hero grid [place-items:center] [background:linear-gradient(rgba(0,0,0,0.62),rgba(0,0,0,0.62)),radial-gradient(circle_at_22%_38%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_70%_42%,rgba(255,255,255,0.06),transparent_24%),repeating-linear-gradient(29deg,rgba(255,255,255,0.025)_0_2px,transparent_2px_9px),linear-gradient(135deg,#252525,#101010_52%,#242424)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:font-thin min-h-[341px] py-[48px] px-[24px] text-center [&_h1]:w-[min(100%,1290px)] [&_h1]:text-[length:clamp(42px,3.5vw,58px)] [&_h1]:leading-[1.05] max-[720px]:min-h-[230px]">
        <h1><TypewriterText text="the benefits of chemical peels for acne, sun damage, and aging" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="blog-content blog-detail-content grid gap-[90px] w-[min(100%_-_48px,1300px)] my-0 mx-auto pb-[142px] px-0 [align-items:start] grid-cols-[minmax(0,820px)_390px] pt-[100px] max-[1050px]:grid-cols-[minmax(0,680px)] max-[1050px]:justify-center max-[1050px]:gap-[46px] max-[1050px]:pt-[76px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[46px] max-[720px]:pt-[56px] max-[720px]:pb-[76px] max-[720px]:px-0">
        <article className="blog-article min-w-[0] text-[#4f5966] text-[length:19px] leading-[1.82] [&_p]:mt-0 [&_p]:mb-[18px] [&_p]:mx-0 [&_h2]:mt-[34px] [&_h2]:mb-[17px] [&_h2]:mx-0 [&_h2]:text-[#ebb35a] [&_h2]:text-[length:30px] [&_h2]:leading-[1.2] [&_h2]:font-thin [&_h3]:mt-[18px] [&_h3]:mb-[2px] [&_h3]:mx-0 [&_h3]:text-[#4f5966] [&_h3]:text-[length:19px] [&_h3]:leading-[1.45] [&_h3]:font-normal [&_ol]:mt-0 [&_ol]:mb-[26px] [&_ol]:mr-0 [&_ol]:ml-[24px] [&_ol]:p-0 [&_ul]:mt-0 [&_ul]:mb-[20px] [&_ul]:mr-0 [&_ul]:ml-[28px] [&_ul]:p-0 [&_li]:pl-[4px] [&_li]:leading-[1.65]">
          <div className="blog-article-lede grid grid-cols-[minmax(0,1fr)_300px] gap-[28px] [align-items:start] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[22px]">
            <div>
              <p>
                Chemical peels are a time-tested, results-driven treatment for improving acne, sun damage, and visible signs of aging. At Harmony
                Med Spa, our customized chemical peel treatments in Sarasota work by exfoliating damaged outer layers of skin to reveal a
                smoother, clearer, and more youthful complexion beneath. Whether you&apos;re struggling with breakouts, discoloration, or fine
                lines, understanding how chemical peels work and what to expect can help you achieve optimal results.
              </p>
            </div>
            <div className="blog-article-feature-image relative min-h-[200px] overflow-hidden rounded-[14px] bg-[#eee] [&_img]:object-cover">
              <Image src="/images/blogs/blog-1/6.jpg" alt="Client receiving a facial chemical peel treatment" fill sizes="300px" priority />
            </div>
          </div>

          <h2><TypewriterText text="Table Of Contents" startOnView /></h2>
          <ol>
            <li>Understanding Chemical Peels</li>
            <li>How Chemical Peels Improve Acne, Sun Damage, and Aging</li>
            <li>Types of Chemical Peels and Their Benefits</li>
            <li>What to Expect During and After Treatment</li>
            <li>Frequently Asked Questions</li>
          </ol>

          <h2><TypewriterText text="Understanding Chemical Peels" startOnView /></h2>
          <p>
            Chemical peels use carefully formulated solutions to exfoliate the skin at varying depths. By removing damaged surface cells, peels
            stimulate cell turnover and collagen production, which are essential for healthy, radiant skin. Depending on your skin type and
            concerns, treatments can range from light peels with minimal downtime to more advanced options that target deeper imperfections.
          </p>

          <h2><TypewriterText text="How Chemical Peels Improve Acne, Sun Damage, And Aging" startOnView /></h2>
          <p>
            Chemical peels address multiple skin concerns at once, making them a versatile option for skin rejuvenation. For acne-prone skin,
            peels help unclog pores, reduce excess oil, and minimize acne-causing bacteria. Over time, this leads to fewer breakouts and smoother
            texture, while also helping fade post-acne marks.
          </p>
          <p>
            Sun damage, including dark spots and uneven pigmentation, responds well to chemical exfoliation. Peels break down clusters of pigment
            caused by UV exposure, revealing a more even skin tone and brighter complexion.
          </p>
          <p>
            When it comes to aging, chemical peels soften fine lines, improve skin texture, and encourage collagen renewal. Regular treatments can
            restore firmness and reduce the dullness that often accompanies aging skin.
          </p>

          <h2><TypewriterText text="Types Of Chemical Peels And Their Benefits" startOnView /></h2>
          <p>
            Chemical peels are customized based on your goals and skin condition. Light peels gently exfoliate the outer layer of skin and are
            ideal for mild acne, dullness, and early signs of aging. These treatments require little to no downtime and can be performed regularly.
          </p>
          <p>
            Medium-depth peels penetrate deeper to treat moderate sun damage, pigmentation, and fine lines. They provide more noticeable results
            with a short recovery period.
          </p>
          <p>
            Deeper peels target advanced signs of aging, stubborn discoloration, and acne scarring. These are typically performed less frequently
            and require a longer healing time but deliver dramatic skin improvements.
          </p>

          <h2><TypewriterText text="What To Expect During And After Treatment" startOnView /></h2>
          <p>
            During your visit, we&apos;ll evaluate your skin, discuss your concerns, and select the most effective peel for your needs. The
            treatment itself is typically quick, with mild tingling or warmth during application.
          </p>
          <p>
            After your peel, you may experience redness, dryness, or peeling as your skin renews itself. Proper aftercare, including hydration
            and sun protection, is essential to support healing and protect your results. Many clients notice brighter, clearer skin within days,
            with continued improvement over the following weeks.
          </p>

          <h2><TypewriterText text="Frequently Asked Questions" startOnView /></h2>
          <h3>1. Are chemical peels safe for all skin types?</h3>
          <p>
            Chemical peels can be safe and effective for most skin types when properly customized and performed by a qualified provider. Your
            provider will determine which peel depths and formulations are appropriate for your skin tone, medical history, and concerns.
          </p>
          <h3>2. How many treatments will I need?</h3>
          <p>Some clients see results after one peel, while others benefit from a series for optimal improvement.</p>
          <h3>3. Is there downtime after a chemical peel?</h3>
          <p>
            Downtime depends on the depth of the peel. Light peels have little downtime, while deeper peels may require several days of recovery.
          </p>
          <h3>4. Can chemical peels help with acne scars?</h3>
          <p>Yes, medium and deeper peels can improve the appearance of acne scarring over time.</p>
          <h3>5. How should I care for my skin after a peel?</h3>
          <p>Avoid sun exposure, use gentle skincare products, and apply sunscreen daily to protect healing skin.</p>

          <h2><TypewriterText text="Reveal Healthier, More Radiant Skin With Chemical Peels" startOnView /></h2>
          <p>
            If you&apos;re ready to improve acne, sun damage, or signs of aging, chemical peels in Sarasota may be the solution you&apos;ve been
            looking for. Schedule a personalized consultation at Harmony Med Spa to discover the best treatment plan for your skin. Call (941)
            923-8990 to book your appointment and take the first step toward a smoother, brighter complexion.
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
