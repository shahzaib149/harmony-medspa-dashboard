import Image from "next/image";
import Link from "next/link";
import BlogSearchForm from "@/components/blog/BlogSearchForm";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

export default function GetRadiantSkinSkinbetterBlogPage() {
  return (
    <main className="blog-page blog-detail-page min-h-[100vh] bg-[#fff] text-[#000]">
      <SiteHeader className="contact-page-header" />

      <section className="blog-hero blog-detail-hero grid [place-items:center] [background:linear-gradient(rgba(0,0,0,0.62),rgba(0,0,0,0.62)),radial-gradient(circle_at_22%_38%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_70%_42%,rgba(255,255,255,0.06),transparent_24%),repeating-linear-gradient(29deg,rgba(255,255,255,0.025)_0_2px,transparent_2px_9px),linear-gradient(135deg,#252525,#101010_52%,#242424)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:font-thin min-h-[341px] py-[48px] px-[24px] text-center [&_h1]:w-[min(100%,1180px)] [&_h1]:text-[length:clamp(40px,3.4vw,58px)] [&_h1]:leading-[1.05] max-[720px]:min-h-[230px]">
        <h1><TypewriterText text="get radiant skin this holiday season with skinbetter's best-selling products" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="blog-content blog-detail-content grid gap-[90px] w-[min(100%_-_48px,1300px)] my-0 mx-auto pb-[142px] px-0 [align-items:start] grid-cols-[minmax(0,820px)_390px] pt-[100px] max-[1050px]:grid-cols-[minmax(0,680px)] max-[1050px]:justify-center max-[1050px]:gap-[46px] max-[1050px]:pt-[76px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[46px] max-[720px]:pt-[56px] max-[720px]:pb-[76px] max-[720px]:px-0">
        <article className="blog-article min-w-[0] text-[#4f5966] text-[length:19px] leading-[1.82] [&_p]:mt-0 [&_p]:mb-[18px] [&_p]:mx-0 [&_h2]:mt-[44px] [&_h2]:mb-[17px] [&_h2]:mx-0 [&_h2]:text-[#ebb35a] [&_h2]:text-[length:30px] [&_h2]:leading-[1.2] [&_h2]:font-thin [&_a]:text-[#e2a719] [&_a]:[transition:color_160ms_ease] hover:[&_a]:text-[#b98210]">
          <div className="blog-article-lede grid grid-cols-[minmax(0,1fr)_300px] gap-[28px] [align-items:start] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[22px]">
            <div>
              <p>
                The holiday season is around the corner, and at Harmony Med Spa, we&apos;re here to help you shine brighter
                than ever! Whether it&apos;s prepping for festive gatherings, pampering yourself as the year ends, or finding the
                perfect gift set, now is the perfect time to invest in skin. Skinbetter Science, a line of science-backed
                skincare products renowned for their results and quality. As the holiday rush approaches, it&apos;s essential to
                start prepping your skin now for that luminous, holiday-ready look!
              </p>
            </div>
            <div className="blog-article-feature-image relative min-h-[190px] overflow-hidden rounded-[14px] bg-[#eee] [&_img]:object-cover">
              <Image src="/images/blogs/get-radiant-skin/1.jpg" alt="Cyber Skincare Week promotion with radiant skin model" fill sizes="300px" priority />
            </div>
          </div>

          <p>
            And here&apos;s the best part - our Cyber Skincare Week is right around the corner! This is the perfect opportunity
            to stock up on Skinbetter Science&apos;s best-sellers with incredible savings.
          </p>

          <h2><TypewriterText text="Why Choose Skinbetter Science?" startOnView /></h2>
          <p>
            Skinbetter Science products are rooted in rigorous research and clinical-grade ingredients, making them a top
            choice among dermatologists and skincare experts. The brand&apos;s focus on simplicity, effectiveness, and innovative
            formulations ensures your skin is nourished and protected, delivering radiant, long-lasting results. Here are
            some of Skinbetter&apos;s star products we highly recommend for a holiday glow.
          </p>

          <div className="relative my-[6px] mx-auto h-[360px] w-[min(100%,360px)] overflow-hidden bg-[#eef3f7] max-[720px]:h-[300px] max-[720px]:w-[min(100%,300px)] [&_img]:object-cover">
            <Image src="/images/blogs/get-radiant-skin/2.jpg" alt="Skinbetter Science best-selling skincare products" fill sizes="(max-width: 720px) 300px, 360px" />
          </div>

          <h2><TypewriterText text="Refining Foam Cleanser" startOnView /></h2>
          <p>
            The Refining Foam Cleanser is a gentle yet powerful cleanser designed to deeply purify your skin without
            compromising its natural moisture balance. Its luxurious foam lathers to effectively remove makeup, dirt, and
            impurities, leaving your skin feeling fresh, soft, and rejuvenated. This cleanser is perfect for prepping your
            skin in the morning and cleansing away the day at night, allowing other skincare products to absorb more
            effectively. It&apos;s ideal for all skin types, making it a must-have first step in any skincare regimen to achieve a
            smooth, glowing complexion.
          </p>

          <div className="relative my-[6px] mx-auto h-[360px] w-[min(100%,360px)] overflow-hidden bg-[#eef3f7] max-[720px]:h-[300px] max-[720px]:w-[min(100%,300px)] [&_img]:object-cover">
            <Image src="/images/blogs/get-radiant-skin/3.jpg" alt="Skinbetter Science cleanser serum cream and peel pads" fill sizes="(max-width: 720px) 300px, 360px" />
          </div>

          <h2><TypewriterText text="Mystro Active Balance Serum" startOnView /></h2>
          <p>
            The Mystro Active Balance Serum is a cutting-edge serum that targets signs of aging and supports a balanced,
            healthy skin barrier. Formulated with a blend of advanced active ingredients, this serum works to improve skin
            elasticity, texture, and tone, while also providing hydration and protection from environmental stressors. The
            Mystro Active Balance Serum is ideal for anyone looking to combat signs of aging or maintain a youthful glow, as
            it helps the skin remain resilient and radiant.
          </p>

          <h2><TypewriterText text="AlphaRet Exfoliating Peel Pads" startOnView /></h2>
          <p>
            The AlphaRet Exfoliating Peel Pads are an innovative, easy-to-use solution for exfoliation that provides the
            benefits of a peel without the typical irritation. Each pad is saturated with a blend of retinoid and alpha
            hydroxy acids to gently but effectively remove dead skin cells, smooth texture, and reduce the appearance of fine
            lines. With regular use, these pads reveal a brighter, more even skin tone and a soft, refined finish. Perfect
            for those looking to enhance their skin&apos;s glow, the AlphaRet Exfoliating Peel Pads are a powerful addition to
            any routine, giving you salon-level results at home.
          </p>

          <h2><TypewriterText text="Alto Defense Serum" startOnView /></h2>
          <p>
            This powerhouse antioxidant serum provides a much-needed boost to tired, stressed skin by neutralizing free
            radicals and environmental damage. Packed with a blend of powerful antioxidants, the Alto Defense Serum is known
            to improve skin texture, reduce redness, and create a healthier-looking complexion - perfect for keeping your
            skin bright all season long.
          </p>

          <h2><TypewriterText text="AlphaRet Overnight Cream" startOnView /></h2>
          <p>
            AlphaRet Overnight Cream is a game-changer for those looking to improve fine lines, wrinkles, and overall skin
            tone. This innovative product combines retinoids and alpha hydroxy acids in a unique formula that delivers
            results without the typical irritation. The overnight cream encourages cell turnover, revealing smooth,
            even-toned skin by morning. Let it work its magic while you sleep and wake up with holiday-ready skin.
          </p>

          <h2><TypewriterText text="Even Tone Correcting Serum" startOnView /></h2>
          <p>
            For those who struggle with uneven skin tone or hyperpigmentation, the Even Tone Correcting Serum is a must-have.
            This serum targets dark spots, discoloration, and dullness, working hard to bring a radiant, even glow to your
            complexion. It&apos;s perfect for achieving that natural, luminous look without heavy makeup, so you can look
            effortlessly flawless during holiday celebrations.
          </p>

          <h2><TypewriterText text="Trio Rebalancing Moisture Treatment" startOnView /></h2>
          <p>
            Dry, dehydrated skin doesn&apos;t stand a chance against the Trio Rebalancing Moisture Treatment. This deeply
            hydrating formula supports your skin&apos;s moisture barrier, leaving it plump, soft, and ready to face the colder
            holiday season. With its rich, lightweight texture, the Trio Rebalancing Moisture Treatment gives you that
            holiday glow while keeping your skin feeling comfortable and nourished.
          </p>

          <h2><TypewriterText text="Cyber Skincare Week Is Live - Shop Now At Harmony Med Spa!" startOnView /></h2>
          <p>
            We know skincare is an investment, and that&apos;s why we&apos;re excited to announce our Cyber Skincare Week is here!
            This special event is the perfect time to try Skinbetter Science&apos;s top products at an incredible value. Mark
            your calendar and be prepared to stock up on your favorites or even try something new from this award-winning
            line.
          </p>
          <p>
            Give yourself or someone else the gift of radiant, holiday-ready skin with Skinbetter Science, and let Harmony
            Med Spa help you look and feel your best. Visit our office in Sarasota, Florida, or call (941) 923-8990 to book
            an appointment today.
          </p>
          <p>
            <Link href="/get-radiant-skin-skinbetter-products.pdf" target="_blank" rel="noopener noreferrer">
              View the Skinbetter holiday product PDF
            </Link>
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
