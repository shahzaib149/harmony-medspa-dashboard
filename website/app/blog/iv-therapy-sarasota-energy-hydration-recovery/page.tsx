import Image from "next/image";
import Link from "next/link";
import BlogSearchForm from "@/components/blog/BlogSearchForm";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

export default function IvTherapyBlogPage() {
  return (
    <main className="blog-page blog-detail-page min-h-[100vh] bg-[#fff] text-[#000]">
      <SiteHeader className="contact-page-header" />

      <section className="blog-hero blog-detail-hero grid [place-items:center] [background:linear-gradient(rgba(0,0,0,0.62),rgba(0,0,0,0.62)),radial-gradient(circle_at_22%_38%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_70%_42%,rgba(255,255,255,0.06),transparent_24%),repeating-linear-gradient(29deg,rgba(255,255,255,0.025)_0_2px,transparent_2px_9px),linear-gradient(135deg,#252525,#101010_52%,#242424)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:font-thin min-h-[341px] py-[48px] px-[24px] text-center [&_h1]:w-[min(100%,1220px)] [&_h1]:text-[length:clamp(42px,3.25vw,58px)] [&_h1]:leading-[1.05] max-[720px]:min-h-[230px]">
        <h1><TypewriterText text="iv therapy in sarasota: how iv drips support energy, hydration, and recovery" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="blog-content blog-detail-content grid gap-[90px] w-[min(100%_-_48px,1300px)] my-0 mx-auto pb-[142px] px-0 [align-items:start] grid-cols-[minmax(0,820px)_390px] pt-[100px] max-[1050px]:grid-cols-[minmax(0,680px)] max-[1050px]:justify-center max-[1050px]:gap-[46px] max-[1050px]:pt-[76px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[46px] max-[720px]:pt-[56px] max-[720px]:pb-[76px] max-[720px]:px-0">
        <article className="blog-article min-w-[0] text-[#4f5966] text-[length:19px] leading-[1.82] [&_p]:mt-0 [&_p]:mb-[18px] [&_p]:mx-0 [&_h2]:mt-[28px] [&_h2]:mb-[17px] [&_h2]:mx-0 [&_h2]:text-[#ebb35a] [&_h2]:text-[length:30px] [&_h2]:leading-[1.2] [&_h2]:font-thin [&_h3]:mt-[18px] [&_h3]:mb-[2px] [&_h3]:mx-0 [&_h3]:text-[#4f5966] [&_h3]:text-[length:19px] [&_h3]:leading-[1.45] [&_h3]:font-extrabold [&_ul]:mt-0 [&_ul]:mb-[20px] [&_ul]:mr-0 [&_ul]:ml-[28px] [&_ul]:p-0 [&_li]:pl-[4px] [&_li]:leading-[1.65] [&_a]:text-[#e2a719]">
          <div className="blog-article-lede grid grid-cols-[minmax(0,1fr)_300px] gap-[28px] [align-items:start] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[22px]">
            <div>
              <p>
                When you feel run down, dehydrated, or slow to bounce back after a busy week, your body may need more targeted support.
                <Link href="/iv-therapy"> IV therapy</Link> delivers fluids, vitamins, minerals, and nutrients directly into the bloodstream
                to support hydration, energy, wellness, and recovery.
              </p>
              <p>
                At Harmony Med Spa, IV therapy in Sarasota is personalized around your goals, whether you want immune support, post-workout
                recovery, skin radiance, or a general wellness boost.
              </p>
            </div>
            <div className="blog-article-feature-image relative min-h-[212px] overflow-hidden rounded-[14px] bg-[#eee] [&_img]:object-cover">
              <Image src="/images/blogs/blog-1/2.jpg" alt="Patient receiving IV therapy in Sarasota" fill sizes="300px" />
            </div>
          </div>

          <h2><TypewriterText text="Table Of Contents" startOnView /></h2>
          <ul>
            <li>What Is IV Therapy?</li>
            <li>Benefits of IV Therapy for Energy</li>
            <li>IV Therapy for Recovery and Hydration</li>
            <li>IV Therapy Options at Harmony Med Spa</li>
            <li>What To Expect During IV Therapy in Sarasota</li>
            <li>Who May Benefit From IV Therapy?</li>
            <li>About the Providers</li>
            <li>FAQs About IV Therapy in Sarasota</li>
          </ul>

          <h2><TypewriterText text="What Is IV Therapy?" startOnView /></h2>
          <p>
            <Link href="/iv-therapy">IV therapy</Link> uses an intravenous drip to deliver a customized blend of hydration and nutrients directly
            into your bloodstream. Because the ingredients bypass the digestive system, they can be absorbed efficiently and may support wellness
            goals more directly than oral supplements alone.
          </p>
          <p>
            IV therapy in Sarasota at Harmony Med Spa is a convenient option during periods of stress, travel, fatigue, exercise, or recovery.
            Treatment options can be tailored to support immune wellness, post-workout recovery, skin radiance, and general hydration so your drip
            aligns with your goals and health history.
          </p>

          <h2><TypewriterText text="Benefits Of IV Therapy For Energy" startOnView /></h2>
          <p>
            Low energy can be connected to dehydration, nutrient depletion, stress, poor sleep, or a demanding schedule. IV therapy may help support
            energy by replenishing fluids and nutrients that play a role in hydration, metabolism, and normal cellular function.
          </p>
          <p>
            IV therapy may be considered by active adults, busy professionals, or patients who feel physically drained after travel, demanding
            workweeks, or exercise. The right IV blend should always be selected based on your goals, symptoms, and medical history after a
            professional consultation.
          </p>

          <h2><TypewriterText text="IV Therapy For Recovery And Hydration" startOnView /></h2>
          <p>
            Recovery matters not only after intense workouts, but also after travel, illness, long workdays, or periods of high stress. IV therapy
            can help replenish hydration and provide nutrients that support the body&apos;s natural recovery processes and general wellness.
          </p>
          <p>Patients may consider IV therapy in Sarasota for support with:</p>
          <ul>
            <li>Hydration after travel, exercise, or busy schedules</li>
            <li>Immune support during seasonal changes</li>
            <li>Muscle recovery after physical activity</li>
            <li>Fatigue related to stress or dehydration</li>
            <li>Skin radiance and antioxidant support</li>
            <li>General wellness and nutrient replenishment</li>
          </ul>

          <h2><TypewriterText text="IV Therapy Options At Harmony Med Spa" startOnView /></h2>
          <p>
            Harmony Med Spa offers IV therapy as part of its wellness services in Sarasota. Treatment options can be customized to emphasize immune
            support, performance and recovery, or skin and cellular health, depending on your concerns.
          </p>
          <p>Examples include drips designed to support:</p>
          <ul>
            <li>Immune wellness with vitamin-rich blends</li>
            <li>Hydration and performance for active patients</li>
            <li>Skin radiance and antioxidant support</li>
          </ul>
          <p>All IV recommendations are made after reviewing your health history, medications, and goals so your plan is tailored to you.</p>

          <h2><TypewriterText text="What To Expect During IV Therapy In Sarasota" startOnView /></h2>
          <p>
            Most IV therapy sessions are simple and comfortable. During your visit, the team reviews your goals and health history, confirms that
            treatment is appropriate, places the IV drip, and monitors you while the nutrients are delivered gradually.
          </p>
          <p>
            Many IV therapy sessions take about 30 to 60 minutes once the drip begins. Some patients report feeling more hydrated, clear-headed, or
            energized within hours, while other benefits may develop over the next day depending on hydration level, lifestyle, and the IV selected.
          </p>

          <h2><TypewriterText text="Who May Benefit From IV Therapy?" startOnView /></h2>
          <p>
            IV therapy may be a good option for patients who want added support for energy, hydration, immune wellness, workout recovery, or skin
            radiance. It may also be helpful before or after travel, during demanding seasons, or when you feel depleted and want targeted wellness
            support.
          </p>
          <p>
            Because IV therapy is still a medical treatment, it is important to receive care from trained professionals who review your health
            history, medications, and goals before treatment. IV therapy should not replace medical evaluation for severe, unexplained, or
            persistent symptoms.
          </p>

          <h2><TypewriterText text="About The Providers" startOnView /></h2>
          <p>
            At Harmony Med Spa, IV therapy services are supported by a trained wellness team in Sarasota. Jessica Simone, AGNP-C, is the owner and a
            board-certified nurse practitioner of aesthetic and integrative medicine, and Tylah Balian serves as a Certified IV Technician, helping
            support a smooth, patient-centered treatment experience.
          </p>

          <h2><TypewriterText text="FAQs About IV Therapy In Sarasota" startOnView /></h2>
          <h3>1. What does IV therapy help with?</h3>
          <p>
            IV therapy may help support hydration, energy, immune wellness, exercise recovery, skin radiance, and nutrient replenishment. The best
            option depends on your goals, symptoms, and health history.
          </p>
          <h3>2. How long does IV therapy take?</h3>
          <p>
            Most IV therapy appointments take about 30 to 60 minutes once the drip begins, although total visit time may vary based on consultation
            and treatment type.
          </p>
          <h3>3. Is IV therapy good for low energy?</h3>
          <p>
            IV therapy may help support energy when fatigue is related to dehydration, nutrient depletion, stress, or a demanding lifestyle.
            Persistent or unexplained fatigue should still be medically evaluated.
          </p>
          <h3>4. Can IV therapy help after a workout?</h3>
          <p>
            Certain IV therapy options may support hydration, electrolyte replenishment, and muscle recovery after physical activity. This is one
            reason many patients explore IV therapy as part of a broader recovery routine.
          </p>
          <h3>5. How often should I get IV therapy?</h3>
          <p>
            The right frequency depends on your wellness goals, lifestyle, health history, and provider recommendations. Some patients schedule IV
            therapy occasionally, while others make it part of a regular wellness routine.
          </p>
          <p>
            Ready to explore <Link href="/iv-therapy">IV therapy</Link> in Sarasota for hydration, energy, and recovery support? Call Harmony Med
            Spa at (941) 923-8990 or <Link href="/">visit the website</Link> to book your consultation.
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
