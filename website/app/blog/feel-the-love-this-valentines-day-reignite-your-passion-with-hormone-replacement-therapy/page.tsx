import Image from "next/image";
import Link from "next/link";
import BlogSearchForm from "@/components/blog/BlogSearchForm";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

export default function HormoneReplacementValentinesBlogPage() {
  return (
    <main className="blog-page blog-detail-page min-h-[100vh] bg-[#fff] text-[#000]">
      <SiteHeader className="contact-page-header" />

      <section className="blog-hero blog-detail-hero grid [place-items:center] [background:linear-gradient(rgba(0,0,0,0.62),rgba(0,0,0,0.62)),radial-gradient(circle_at_22%_38%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_70%_42%,rgba(255,255,255,0.06),transparent_24%),repeating-linear-gradient(29deg,rgba(255,255,255,0.025)_0_2px,transparent_2px_9px),linear-gradient(135deg,#252525,#101010_52%,#242424)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:font-thin min-h-[341px] py-[48px] px-[24px] text-center [&_h1]:w-[min(100%,1120px)] [&_h1]:text-[length:clamp(42px,3.5vw,58px)] [&_h1]:leading-[1.05] max-[720px]:min-h-[230px]">
        <h1><TypewriterText text="feel the love this valentine's day: reignite your passion with hormone replacement therapy" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="blog-content blog-detail-content grid gap-[90px] w-[min(100%_-_48px,1300px)] my-0 mx-auto pb-[142px] px-0 [align-items:start] grid-cols-[minmax(0,820px)_390px] pt-[100px] max-[1050px]:grid-cols-[minmax(0,680px)] max-[1050px]:justify-center max-[1050px]:gap-[46px] max-[1050px]:pt-[76px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[46px] max-[720px]:pt-[56px] max-[720px]:pb-[76px] max-[720px]:px-0">
        <article className="blog-article min-w-[0] text-[#4f5966] text-[length:19px] leading-[1.82] [&_p]:mt-0 [&_p]:mb-[18px] [&_p]:mx-0 [&_h2]:mt-[44px] [&_h2]:mb-[17px] [&_h2]:mx-0 [&_h2]:text-[#ebb35a] [&_h2]:text-[length:30px] [&_h2]:leading-[1.08] [&_h2]:font-thin [&_ul]:mt-0 [&_ul]:mb-[28px] [&_ul]:mr-0 [&_ul]:ml-[26px] [&_ul]:pl-0 [&_ul]:list-disc [&_ul]:list-outside [&_li]:pl-[4px] [&_li]:mb-[4px] [&_li]:leading-[1.65] [&_li::marker]:text-[#5f6670] [&_li::marker]:text-[length:14px]">
          <div className="blog-article-lede grid grid-cols-[minmax(0,1fr)_300px] gap-[28px] [align-items:start] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[22px]">
            <div>
              <p>
                Valentine&apos;s Day is a time to celebrate love, connection, and intimacy. But if you&apos;ve been feeling a
                lack of energy, reduced libido, or a shift in mood that&apos;s affecting your relationships, it might not just
                be stress or aging - it could be a hormonal imbalance. At Harmony Med Spa, we understand that optimal
                hormone levels play a vital role in your overall well-being, including your passion and intimacy. Hormone
                Replacement Therapy (HRT) is a proven solution that helps restore balance, increase energy, and enhance your
                quality of life - just in time to help you feel your best this Valentine&apos;s Day.
              </p>
            </div>
            <div className="blog-article-feature-image relative min-h-[180px] overflow-hidden rounded-[14px] bg-[#eee] [&_img]:object-cover">
              <Image src="/images/blogs/blog-2/8.jpg" alt="Couple enjoying time together outdoors" fill sizes="300px" priority />
            </div>
          </div>

          <h2><TypewriterText text="How Hormone Imbalance Affects Your Passion And Well-Being" startOnView /></h2>
          <p>
            As we age, hormone levels naturally decline, leading to a variety of symptoms that impact both physical and
            emotional health. Men and women alike can experience:
          </p>
          <ul>
            <li>Decreased libido and sexual dysfunction</li>
            <li>Fatigue and lack of motivation</li>
            <li>Mood swings, anxiety, and depression</li>
            <li>Difficulty maintaining muscle tone and weight</li>
            <li>Sleep disturbances</li>
          </ul>
          <p>
            These symptoms can put a strain on relationships and diminish the spark that once felt effortless. But the good
            news is that hormone replacement therapy can help restore balance, allowing you to feel vibrant, confident, and
            passionate once again.
          </p>

          <h2><TypewriterText text="What Is Hormone Replacement Therapy?" startOnView /></h2>
          <p>
            Hormone Replacement Therapy (HRT) is a medical treatment designed to restore and balance hormone levels that
            naturally decline due to aging, stress, or medical conditions. It involves supplementing key hormones such as
            estrogen, progesterone, and testosterone to alleviate symptoms caused by hormonal imbalances. HRT is commonly
            used to address menopause in women, andropause (low testosterone) in men, and other conditions that lead to
            fatigue, mood swings, low libido, weight gain, and cognitive changes. By replenishing hormone levels, HRT helps
            individuals regain energy, improve mental clarity, enhance intimacy, and support overall well-being, making it a
            powerful tool for restoring vitality and quality of life.
          </p>

          <h2><TypewriterText text="The Benefits Of Hormone Replacement Therapy" startOnView /></h2>
          <p>
            HRT is a personalized treatment designed to replenish declining hormone levels and improve overall well-being. At
            Harmony Med Spa, we offer customized hormone therapy for both men and women to help:
          </p>
          <ul>
            <li>Boost libido and enhance intimacy - Reignite the connection with your partner by restoring your natural drive.</li>
            <li>Increase energy levels - Say goodbye to constant fatigue and enjoy more vitality throughout your day.</li>
            <li>Improve mood and mental clarity - Feel more like yourself with balanced emotions and improved cognitive function.</li>
            <li>Support weight management and muscle tone - Achieve a healthier body composition with regulated metabolism.</li>
            <li>Enhance sleep quality - Enjoy restful sleep and wake up feeling refreshed.</li>
          </ul>
          <p>
            By addressing hormonal imbalances, you can embrace a renewed sense of passion and confidence, making this
            Valentine&apos;s Day one to remember.
          </p>

          <h2><TypewriterText text="Start Your Journey To A More Vibrant You At Harmony Med Spa" startOnView /></h2>
          <p>
            If you&apos;ve noticed changes in your energy, mood, or intimacy, don&apos;t let another Valentine&apos;s Day pass by
            without feeling your best. Hormone Replacement Therapy can help you reclaim your vitality and reconnect with the
            things that bring you joy. At Harmony Med Spa, we specialize in personalized HRT plans tailored to your specific
            needs. We will guide you through the process, ensuring safe and effective results that enhance your well-being.
          </p>
          <p>
            This Valentine&apos;s Day, give yourself the gift of balance, energy, and passion. Schedule a consultation with
            Harmony Med Spa and take the first step toward a revitalized you with Hormone Replacement Therapy. Visit our
            office in Sarasota, Florida, or call (941) 923-8990 to book an appointment today.
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
