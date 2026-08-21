import Image from "next/image";
import Link from "next/link";
import BlogSearchForm from "@/components/blog/BlogSearchForm";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

export default function GlpMedicationWeightLossPage() {
  return (
    <main className="blog-page blog-detail-page min-h-[100vh] bg-[#fff] text-[#000]">
      <SiteHeader className="contact-page-header" />

      <section className="blog-hero blog-detail-hero grid [place-items:center] [background:linear-gradient(rgba(0,0,0,0.62),rgba(0,0,0,0.62)),radial-gradient(circle_at_22%_38%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_70%_42%,rgba(255,255,255,0.06),transparent_24%),repeating-linear-gradient(29deg,rgba(255,255,255,0.025)_0_2px,transparent_2px_9px),linear-gradient(135deg,#252525,#101010_52%,#242424)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:font-thin min-h-[341px] py-[48px] px-[24px] text-center [&_h1]:w-[min(100%,1290px)] [&_h1]:text-[length:clamp(42px,3.25vw,58px)] [&_h1]:leading-[1.05] max-[720px]:min-h-[230px]">
        <h1><TypewriterText text="how glp-1 medications support medical weight loss" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="blog-content blog-detail-content grid gap-[90px] w-[min(100%_-_48px,1300px)] my-0 mx-auto pb-[142px] px-0 [align-items:start] grid-cols-[minmax(0,820px)_390px] pt-[100px] max-[1050px]:grid-cols-[minmax(0,680px)] max-[1050px]:justify-center max-[1050px]:gap-[46px] max-[1050px]:pt-[76px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[46px] max-[720px]:pt-[56px] max-[720px]:pb-[76px] max-[720px]:px-0">
        <article className="blog-article min-w-[0] text-[#4f5966] text-[length:19px] leading-[1.82] [&_p]:mt-0 [&_p]:mb-[18px] [&_p]:mx-0 [&_h2]:mt-[28px] [&_h2]:mb-[17px] [&_h2]:mx-0 [&_h2]:text-[#ebb35a] [&_h2]:text-[length:30px] [&_h2]:leading-[1.2] [&_h2]:font-extrabold [&_h3]:mt-[27px] [&_h3]:mb-[8px] [&_h3]:mx-0 [&_h3]:text-[#4f5966] [&_h3]:text-[length:19px] [&_h3]:leading-[1.45] [&_h3]:font-extrabold [&_ul]:mt-0 [&_ul]:mb-[20px] [&_ul]:mr-0 [&_ul]:ml-[28px] [&_ul]:p-0 [&_li]:pl-[4px] [&_li]:leading-[1.55]">
          <div className="blog-article-lede grid grid-cols-[minmax(0,1fr)_300px] gap-[28px] [align-items:start] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[22px]">
            <div>
              <p>
                For many adults, weight loss is not just about willpower - it is about having the right medical tools, guidance, and support.
                GLP-1 medications such as Semaglutide and Tirzepatide have become powerful options for patients who want a safe, medically
                supervised path to sustainable weight loss in Sarasota.
              </p>
              <p>
                At Harmony Med Spa, our GLP-1 medical weight loss program is designed to do more than help you lose weight - it is built to
                help you change your relationship with food, feel more in control of your appetite, and create habits that support long-term
                results.
              </p>
            </div>
            <div className="blog-article-feature-image relative min-h-[200px] overflow-hidden rounded-[14px] bg-[#eee] [&_img]:object-cover">
              <Image src="/images/blogs/blog-2/4.jpg" alt="Woman measuring her waist during a weight loss journey" fill sizes="300px" />
            </div>
          </div>

          <h2><TypewriterText text="Table of Contents" startOnView /></h2>
          <ul>
            <li>Understanding GLP-1 Medications for Weight Loss</li>
            <li>How GLP-1 Medications Help You Lose Weight and Keep It Off</li>
            <li>Why Choose a Medically Supervised GLP-1 Weight Loss Program</li>
            <li>What to Expect from GLP-1 Treatment at Harmony Med Spa</li>
            <li>Frequently Asked Questions About GLP-1 Weight Loss</li>
          </ul>

          <h2><TypewriterText text="Understanding GLP-1 Medications for Weight Loss" startOnView /></h2>
          <p>
            GLP-1 (glucagon-like peptide-1) medications are prescription drugs that mimic a natural hormone involved in appetite, digestion,
            and blood sugar regulation. They work by activating GLP-1 receptors in the brain and digestive system, which helps slow how quickly
            the stomach empties, enhance feelings of fullness, and reduce overall food intake.
          </p>
          <p>
            At Harmony Med Spa, GLP-1 medications such as Semaglutide and Tirzepatide are used as part of a structured medical weight loss plan,
            not as a shortcut or "quick fix." These medications are most effective when combined with nutrition support, realistic lifestyle
            changes, and ongoing follow-up with a provider who understands your health history and goals.
          </p>

          <h2><TypewriterText text="How GLP-1 Medications Help You Lose Weight and Keep It Off" startOnView /></h2>
          <p>
            One of the toughest parts of weight loss is staying consistent when hunger, cravings, and plateaus show up. GLP-1 medications help
            remove some of those barriers by supporting appetite control and satiety so that healthy choices feel more sustainable day to day.
          </p>
          <p>Patients in GLP-1 programs often report that treatment helps them:</p>
          <ul>
            <li>Feel comfortably full with smaller portions</li>
            <li>Experience fewer intense cravings and "mindless" snacking</li>
            <li>Focus more easily on balanced meals and regular eating patterns</li>
            <li>Build momentum with a structured plan and accountability</li>
          </ul>
          <p>
            Clinical studies have shown that GLP-1 receptor agonists can lead to meaningful weight loss for many individuals with overweight or
            obesity when combined with lifestyle changes, though results vary and no specific outcome is guaranteed. Our goal is to use these
            medications as a tool to help you create healthier, more maintainable habits - not as the only answer.
          </p>

          <h2><TypewriterText text="Why Choose a Medically Supervised GLP-1 Weight Loss Program" startOnView /></h2>
          <p>
            Because GLP-1 medications affect appetite, digestion, and blood sugar, medical supervision is essential. Every patient&apos;s health
            history, current medications, and weight-loss timeline are different, and your plan should reflect that.
          </p>
          <p>At Harmony Med Spa in Sarasota, your GLP-1 weight loss program may include:</p>
          <ul>
            <li>A detailed initial evaluation to review your medical history, medications, and goals</li>
            <li>Personalized dosing and titration of Semaglutide or Tirzepatide</li>
            <li>Regular check-ins to monitor progress, side effects, and body changes</li>
            <li>Optional wellness support such as B-12, MICC, or Bio-Boost injections to complement your plan</li>
            <li>Education around nutrition, hydration, protein intake, and sustainable routines</li>
          </ul>

          <h2><TypewriterText text="What to Expect from GLP-1 Treatment at Harmony Med Spa" startOnView /></h2>
          <p>
            Your GLP-1 treatment journey begins with a consultation to determine whether medical weight loss is appropriate for you. Your provider
            will review your symptoms, health background, current medications, and goals before recommending a plan.
          </p>
          <p>
            If GLP-1 treatment is a good fit, your care plan may include regular follow-up visits, dose adjustments, and practical guidance to help
            you build habits that support long-term progress. The goal is steady support, not pressure or one-size-fits-all dieting.
          </p>

          <h2><TypewriterText text="Frequently Asked Questions About GLP-1 Weight Loss" startOnView /></h2>
          <h3>1. Who may benefit from GLP-1 medications for weight loss?</h3>
          <p>
            Adults who struggle with appetite control, frequent cravings, weight-loss plateaus, or long-term weight management may be candidates
            for GLP-1 therapy, depending on their health history, current medications, and provider evaluation.
          </p>
          <h3>2. Are GLP-1 medications enough on their own?</h3>
          <p>
            GLP-1 medications work best as part of a comprehensive medical weight loss plan that also includes nutrition guidance, movement, and
            regular follow-up, rather than being used as a stand-alone solution.
          </p>
          <h3>3. How quickly will I see results?</h3>
          <p>
            Results vary by person. Many patients notice appetite changes and fewer cravings within the first few weeks, with more noticeable
            weight-loss progress developing over several months when medication and healthy habits work together.
          </p>
          <h3>4. Why is medical supervision important with GLP-1 treatment?</h3>
          <p>
            Supervision ensures that the medication and dose are appropriate for your health needs, that side effects are monitored and managed,
            and that your plan can be adjusted to support both safety and results.
          </p>
          <h3>5. Can GLP-1 medications support long-term weight loss success?</h3>
          <p>
            GLP-1 medications can be a powerful part of a long-term strategy when combined with consistency, accountability, and sustainable
            routines; however, no medication can replace healthy lifestyle habits, and individual results will always vary.
          </p>
          <h3>6. Are GLP-1 medications the same as insulin?</h3>
          <p>
            No. GLP-1 medications help your body release insulin more effectively in response to meals and slow digestion, but they are not insulin
            and do not replace insulin therapy for patients who need it.
          </p>

          <h2><TypewriterText text="Start Your GLP-1 Medical Weight Loss Journey in Sarasota" startOnView /></h2>
          <p>
            If you are ready to explore a more guided, medically supported approach to weight loss, our team at Harmony Med Spa is here to help.
            Our GLP-1 medical weight loss program in Sarasota combines advanced medications like Semaglutide and Tirzepatide with compassionate,
            personalized care so you do not have to navigate your journey alone.
          </p>
          <p>
            Schedule a consultation at Harmony Med Spa to learn whether GLP-1 treatment is right for you. Call our Sarasota, FL office at
            (941) 923-8990 or visit us online to book your appointment and take the next step toward feeling more confident, energized, and in
            control of your health.
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
