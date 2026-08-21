import Image from "next/image";
import Link from "next/link";
import BlogSearchForm from "@/components/blog/BlogSearchForm";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

export default function SummerReadyGlpBhrtPage() {
  return (
    <main className="blog-page blog-detail-page min-h-[100vh] bg-[#fff] text-[#000]">
      <SiteHeader className="contact-page-header" />

      <section className="blog-hero blog-detail-hero grid [place-items:center] [background:linear-gradient(rgba(0,0,0,0.62),rgba(0,0,0,0.62)),radial-gradient(circle_at_22%_38%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_70%_42%,rgba(255,255,255,0.06),transparent_24%),repeating-linear-gradient(29deg,rgba(255,255,255,0.025)_0_2px,transparent_2px_9px),linear-gradient(135deg,#252525,#101010_52%,#242424)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:font-thin min-h-[341px] py-[48px] px-[24px] text-center [&_h1]:w-[min(100%,1290px)] [&_h1]:text-[length:clamp(42px,3.25vw,58px)] [&_h1]:leading-[1.05] max-[720px]:min-h-[230px]">
        <h1><TypewriterText text="summer-ready from the inside out: how glp-1 weight loss and bhrt work together to help you look and feel your best" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="blog-content blog-detail-content grid gap-[90px] w-[min(100%_-_48px,1300px)] my-0 mx-auto pb-[142px] px-0 [align-items:start] grid-cols-[minmax(0,820px)_390px] pt-[100px] max-[1050px]:grid-cols-[minmax(0,680px)] max-[1050px]:justify-center max-[1050px]:gap-[46px] max-[1050px]:pt-[76px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[46px] max-[720px]:pt-[56px] max-[720px]:pb-[76px] max-[720px]:px-0">
        <article className="blog-article min-w-[0] text-[#4f5966] text-[length:19px] leading-[1.82] [&_p]:mt-0 [&_p]:mb-[18px] [&_p]:mx-0 [&_h2]:mt-[28px] [&_h2]:mb-[17px] [&_h2]:mx-0 [&_h2]:text-[#ebb35a] [&_h2]:text-[length:30px] [&_h2]:leading-[1.2] [&_h2]:font-thin [&_h3]:mt-[27px] [&_h3]:mb-[16px] [&_h3]:mx-0 [&_h3]:text-[#e2a719] [&_h3]:text-[length:30px] [&_h3]:leading-[1.15] [&_h3]:font-extrabold [&_ul]:mt-0 [&_ul]:mb-[20px] [&_ul]:mr-0 [&_ul]:ml-[28px] [&_ul]:p-0 [&_li]:pl-[4px] [&_li]:leading-[1.55]">
          <div className="blog-article-lede grid grid-cols-[minmax(0,1fr)_300px] gap-[28px] [align-items:start] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[22px]">
            <div>
              <p>
                Beach season in Sarasota, FL often inspires people to focus on how they look in summer clothes, swimsuits, and vacation photos. But for many adults, especially those dealing with midlife hormone changes, feeling truly summer-ready is about more than just losing a few pounds. Fatigue, poor sleep, stubborn weight gain, brain fog, and low motivation can make it harder to feel confident and energized even when you are trying to make healthy choices.
              </p>
              <p>
                At Harmony Med Spa, medically supervised weight loss and hormone optimization can work together to support a more complete summer wellness plan. GLP-1 medications such as Semaglutide and Tirzepatide help regulate appetite and support weight loss, while Bio-Identical Hormone Replacement Therapy, or BHRT, may help address hormonal symptoms that can affect energy, mood, sleep, and metabolism.
              </p>
            </div>
            <div className="blog-article-feature-image relative min-h-[228px] overflow-hidden rounded-[14px] bg-[#0aa785] before:absolute before:inset-0 before:z-[1] before:content-[''] before:[background:linear-gradient(90deg,rgba(0,0,0,0.05)_0_48%,rgba(0,167,133,0.92)_48%_100%)] [&_img]:object-cover [&_span]:absolute [&_span]:right-[16px] [&_span]:bottom-[17px] [&_span]:z-[2] [&_span]:w-[130px] [&_span]:text-[#fff] [&_span]:text-[length:15px] [&_span]:leading-[1.02] [&_span]:uppercase [&_strong]:inline-block [&_strong]:my-[12px] [&_strong]:mx-0 [&_strong]:text-[length:28px] [&_strong]:leading-[1]">
              <Image src="/images/services/wellness/hormonereplacement_thumbnail_1.jpg" alt="" fill sizes="300px" />
              <span>Bio-Identical<br />Hormone Replacement Therapy<br /><strong>+</strong><br />GLP-1</span>
            </div>
          </div>

          <p>
            Together, these treatments may offer a more personalized strategy for looking and feeling your best this summer. Instead of chasing a quick fix, this approach can help support body confidence, energy, sleep, and consistency so patients can enjoy beach days, boating weekends, and active summer plans with more ease.
          </p>

          <h2><TypewriterText text="Table Of Contents" startOnView /></h2>
          <ul>
            <li>Why Summer Goals Can Feel Harder in Midlife</li>
            <li>How GLP-1 Supports Summer Weight-Loss Goals</li>
            <li>How BHRT Supports Energy, Mood, and Metabolism</li>
            <li>Why GLP-1 and BHRT Can Be a Powerful Summer Combination</li>
            <li>What to Expect Before Starting Treatment</li>
            <li>FAQs About GLP-1 and BHRT</li>
            <li>Schedule a Summer Wellness Consultation in Sarasota, FL</li>
          </ul>

          <h2><TypewriterText text="Why Summer Goals Can Feel Harder In Midlife" startOnView /></h2>
          <p>
            For many women and men, summer can bring extra motivation to focus on health and appearance. At the same time, hormonal changes can make progress feel frustrating. Patients may notice stubborn weight gain, increased belly fat, lower energy, disrupted sleep, irritability, brain fog, and decreased libido, all of which can affect confidence and make it harder to stay consistent with nutrition, movement, and self-care routines.
          </p>
          <p>
            This is one reason a standard diet-only approach often feels disappointing. If appetite is difficult to control or hormones are contributing to fatigue and poor recovery, it is much harder to stay on track. A more personalized plan can help address both the metabolic and hormonal factors that influence how patients look and feel during the summer months.
          </p>

          <h2><TypewriterText text="How GLP-1 Supports Summer Weight-Loss Goals" startOnView /></h2>
          <p>
            GLP-1 medications such as Semaglutide and Tirzepatide are designed to support medical weight loss by helping regulate appetite and food intake. These medications mimic the effects of GLP-1, a hormone involved in hunger regulation, which can help patients feel fuller sooner and reduce cravings.
          </p>
          <p>
            For patients who have struggled with repeated dieting, GLP-1 support can make it easier to build sustainable habits. The goal is not only to lose weight, but to create a plan that supports long-term health, steady progress, and confidence in daily life.
          </p>

          <h2><TypewriterText text="How BHRT Supports Energy, Mood, And Metabolism" startOnView /></h2>
          <p>
            Hormone imbalance can affect much more than mood. Low or fluctuating hormone levels may contribute to fatigue, sleep disruption, hot flashes, changes in body composition, and reduced motivation. BHRT is designed to help restore hormone balance using bio-identical hormones that are carefully evaluated for each patient.
          </p>
          <p>
            When hormones are better supported, some patients may find it easier to sleep, recover, maintain energy, and stay consistent with healthy habits. That support can be especially valuable when combined with a medically supervised weight-loss plan.
          </p>

          <h2><TypewriterText text="Why GLP-1 And BHRT Can Be A Powerful Summer Combination" startOnView /></h2>
          <p>
            GLP-1 medications and BHRT address different parts of the wellness picture. GLP-1 support can help with appetite and weight-management challenges, while BHRT may help address hormone-related symptoms that interfere with energy, sleep, mood, and metabolism. A medically supervised approach can help uncover whether both metabolic support and hormone optimization should be part of the plan.
          </p>

          <h2><TypewriterText text="What To Expect Before Starting Treatment" startOnView /></h2>
          <p>
            Before recommending GLP-1 medications, BHRT, or a combination of the two, the team at Harmony Med Spa will review your goals, symptoms, health history, and treatment priorities. Medical weight loss visits include an exam and ongoing progress monitoring, while BHRT planning may include hormone-focused evaluation and discussion of personalized treatment options.
          </p>
          <p>
            This step is important because not every patient needs the same treatment path. Some patients may benefit most from GLP-1 support, while others may discover that hormone imbalance is playing a major role in how they feel. For some, the most effective plan may involve both.
          </p>

          <h2><TypewriterText text="FAQs About GLP-1 And BHRT" startOnView /></h2>
          <h3>Can I Do GLP-1 And BHRT At The Same Time?</h3>
          <p>
            Possibly. Some patients may be candidates for both treatments when weight concerns and hormone-related symptoms are happening at the same time. The best way to know is through a consultation and individualized assessment at Harmony Med Spa.
          </p>
          <h3>Is This Combination Only For Women?</h3>
          <p>
            No. BHRT can support both women and men, and GLP-1 medications are also used across eligible adult patients in medically supervised weight-loss programs. The right plan depends on symptoms, health status, and treatment goals.
          </p>
          <h3>Will BHRT Help Me Lose Weight On Its Own?</h3>
          <p>
            BHRT is not simply a weight-loss treatment. Its main role is to help address hormone-related symptoms such as fatigue, sleep disruption, mood changes, and other imbalances that may affect overall wellness and make healthy habits harder to maintain.
          </p>
          <h3>How Long Does It Take To Notice Results?</h3>
          <p>
            Timing varies by patient and by treatment. GLP-1 progress typically develops over time with consistent follow-up, while BHRT improvements may be noticed in areas such as energy, sleep, or mood on an individual timeline. During your consultation, Harmony Med Spa can explain what may be realistic for your goals.
          </p>
          <h3>How Do I Know If I Am A Good Candidate?</h3>
          <p>
            If you are struggling with stubborn weight, appetite control, fatigue, sleep changes, brain fog, low motivation, or other signs of possible hormone imbalance, an evaluation can help determine which treatment options make sense. A personalized consultation is the best place to start.
          </p>

          <h2><TypewriterText text="Schedule A Summer Wellness Consultation In Sarasota, FL" startOnView /></h2>
          <p>
            Getting summer-ready is not only about fitting into different clothes. It is also about feeling energized, balanced, and comfortable in your own body. At Harmony Med Spa, GLP-1 medical weight loss and BHRT can be part of a personalized strategy to help patients approach summer with more confidence and support.
          </p>
          <p>
            To learn whether GLP-1, BHRT, or a combination approach may be right for you, schedule a consultation with Harmony Med Spa in Sarasota, FL by calling 941-923-8990 today.
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
