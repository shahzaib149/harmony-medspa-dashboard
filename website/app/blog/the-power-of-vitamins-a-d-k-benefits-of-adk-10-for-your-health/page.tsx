import Image from "next/image";
import Link from "next/link";
import BlogSearchForm from "@/components/blog/BlogSearchForm";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

export default function Adk10BenefitsBlogPage() {
  return (
    <main className="blog-page blog-detail-page min-h-[100vh] bg-[#fff] text-[#000]">
      <SiteHeader className="contact-page-header" />

      <section className="blog-hero blog-detail-hero grid [place-items:center] [background:linear-gradient(rgba(0,0,0,0.62),rgba(0,0,0,0.62)),radial-gradient(circle_at_22%_38%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_70%_42%,rgba(255,255,255,0.06),transparent_24%),repeating-linear-gradient(29deg,rgba(255,255,255,0.025)_0_2px,transparent_2px_9px),linear-gradient(135deg,#252525,#101010_52%,#242424)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:font-thin min-h-[341px] py-[48px] px-[24px] text-center [&_h1]:w-[min(100%,1290px)] [&_h1]:text-[length:clamp(42px,3.5vw,58px)] [&_h1]:leading-[1.05] max-[720px]:min-h-[230px]">
        <h1><TypewriterText text="the power of vitamins a, d, & k: benefits of adk-10 for your health" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="blog-content blog-detail-content grid gap-[90px] w-[min(100%_-_48px,1300px)] my-0 mx-auto pb-[142px] px-0 [align-items:start] grid-cols-[minmax(0,820px)_390px] pt-[100px] max-[1050px]:grid-cols-[minmax(0,680px)] max-[1050px]:justify-center max-[1050px]:gap-[46px] max-[1050px]:pt-[76px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[46px] max-[720px]:pt-[56px] max-[720px]:pb-[76px] max-[720px]:px-0">
        <article className="blog-article min-w-[0] text-[#4f5966] text-[length:19px] leading-[1.82] [&_p]:mt-0 [&_p]:mb-[18px] [&_p]:mx-0 [&_h2]:mt-[44px] [&_h2]:mb-[17px] [&_h2]:mx-0 [&_h2]:text-[#ebb35a] [&_h2]:text-[length:30px] [&_h2]:leading-[1.2] [&_h2]:font-thin [&_ul]:mt-0 [&_ul]:mb-[20px] [&_ul]:mr-0 [&_ul]:ml-[26px] [&_ul]:pl-0 [&_ul]:list-disc [&_ul]:list-outside [&_li]:pl-[4px] [&_li]:mb-[6px] [&_li]:leading-[1.65] [&_li::marker]:text-[#5f6670] [&_li::marker]:text-[length:14px]">
          <div className="blog-article-lede grid grid-cols-[minmax(0,1fr)_300px] gap-[28px] [align-items:start] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[22px]">
            <div>
              <p>
                At Harmony Med Spa, we know that health isn&apos;t just about looking good - it&apos;s about feeling your best
                from the inside out. We offer Evexias Nutraceuticals, a high-quality line of supplements designed to support
                optimal wellness. One of our most recommended supplements is ADK-10, a powerhouse blend of Vitamins A, D, and
                K that plays a critical role in bone strength, immune function, and cardiovascular health.
              </p>
            </div>
            <div className="blog-article-feature-image relative min-h-[180px] overflow-hidden rounded-[14px] bg-[#eee] [&_img]:object-cover">
              <Image src="/images/blogs/blog-2/7.jpg" alt="Patient taking ADK-10 vitamins with water" fill sizes="300px" priority />
            </div>
          </div>

          <p>
            If you live in Sarasota, Florida, or the surrounding areas, you know how important it is to maintain your health
            year-round. Whether you&apos;re looking to boost immunity, enhance bone health, or support heart function, ADK-10
            may be the missing piece in your wellness routine.
          </p>

          <h2><TypewriterText text="The Benefits Of ADK-10" startOnView /></h2>
          <p>
            Vitamin A - Known for its role in eye health and immune support, Vitamin A is crucial for maintaining healthy
            skin, reducing inflammation, and supporting proper cell growth. It also works as an antioxidant, protecting the
            body from damage caused by free radicals.
          </p>
          <p>
            Vitamin D - Often called the &quot;sunshine vitamin,&quot; Vitamin D is essential for calcium absorption and bone
            strength. Many people, even in sunny Florida, don&apos;t get enough Vitamin D, leading to potential bone density
            issues and weakened immunity. Supplementing with ADK-10 ensures your body gets the right amount to function
            optimally.
          </p>
          <p>
            Vitamin K - This vitamin plays a crucial role in blood clotting and bone health. It helps regulate calcium in the
            bones and arteries, ensuring that calcium goes where it&apos;s needed - into your bones instead of building up in
            arteries. Combined with Vitamin D, it supports heart health and reduces the risk of arterial calcification.
          </p>

          <h2><TypewriterText text="A Full Line Of Targeted Nutritional Support" startOnView /></h2>
          <p>
            We believe that a well-rounded approach to health requires more than just one supplement. We offer a carefully
            curated selection of Evexias Nutraceuticals, designed to support everything from gut health and metabolism to
            muscle recovery and hormone balance.
          </p>
          <p>Here are a few of our top recommendations:</p>
          <ul>
            <li>
              Active Probiotic - Your gut is the foundation of your health. This probiotic blend helps restore beneficial gut
              bacteria, promoting better digestion, immune function, and nutrient absorption. Whether you struggle with
              bloating, food sensitivities, or weakened immunity, a daily probiotic can make a significant difference.
            </li>
            <li>
              HRT (T) Complete - If you&apos;re undergoing hormone replacement therapy (HRT), balancing your testosterone levels
              is key to maintaining energy, strength, and mental clarity. This supplement provides targeted support to
              optimize hormone levels and overall well-being, helping men and women feel revitalized and perform at their
              best.
            </li>
            <li>
              Berberine Ultra - Often referred to as nature&apos;s Metformin, Berberine is a powerful botanical known for its
              ability to support blood sugar regulation, cardiovascular health, and healthy cholesterol levels. It&apos;s a great
              choice for those looking to manage insulin sensitivity, weight loss, and metabolic function naturally.
            </li>
            <li>
              Creatine Ultra - Creatine isn&apos;t just for athletes. While it&apos;s well known for boosting muscle strength and
              recovery, it also enhances cognitive function, energy levels, and cellular health. Whether you&apos;re hitting the
              gym or just looking for more endurance throughout the day, this supplement helps fuel your body and mind.
            </li>
            <li>
              BPC-157 LPT - Known as the &quot;healing peptide,&quot; BPC-157 is gaining recognition for its ability to promote
              tissue repair, reduce inflammation, and accelerate recovery from injuries. Whether you&apos;re healing from an
              injury, managing chronic pain, or looking to improve overall mobility, this supplement supports faster muscle,
              ligament, and tendon repair.
            </li>
            <li>
              Complete Magnesium - Magnesium is one of the most overlooked yet essential minerals for overall health. It
              plays a vital role in muscle relaxation, nervous system regulation, stress reduction, and energy production. If
              you deal with muscle cramps, poor sleep, or anxiety, ensuring adequate magnesium intake can be a game-changer.
            </li>
          </ul>
          <p>These supplements, combined with a personalized wellness plan, can help you regain energy, balance, and long-term health.</p>

          <h2><TypewriterText text="Your Personalized Approach To Wellness" startOnView /></h2>
          <p>
            Whether you need immune support, metabolic balance, or muscle recovery, we can help you find the right
            combination of nutraceuticals to complement your lifestyle. If you&apos;re in Sarasota, FL, or nearby areas, and
            you&apos;re ready to take charge of your health, Harmony Med Spa is here to guide you. Stop by our office to learn
            how ADK-10 and other targeted supplements can help you feel your best every day.
          </p>
          <p>
            Contact Harmony Med Spa to explore our full range of Evexias Nutraceuticals and find the right plan for your
            needs. Visit our office in Sarasota, Florida, or call (941) 923-8990 to book an appointment today.
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
