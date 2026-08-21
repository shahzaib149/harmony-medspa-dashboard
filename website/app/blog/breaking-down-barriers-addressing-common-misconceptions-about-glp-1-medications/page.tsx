import Image from "next/image";
import Link from "next/link";
import BlogSearchForm from "@/components/blog/BlogSearchForm";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

export default function GlpMedicationMisconceptionsBlogPage() {
  return (
    <main className="blog-page blog-detail-page min-h-[100vh] bg-[#fff] text-[#000]">
      <SiteHeader className="contact-page-header" />

      <section className="blog-hero blog-detail-hero grid [place-items:center] [background:linear-gradient(rgba(0,0,0,0.62),rgba(0,0,0,0.62)),radial-gradient(circle_at_22%_38%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_70%_42%,rgba(255,255,255,0.06),transparent_24%),repeating-linear-gradient(29deg,rgba(255,255,255,0.025)_0_2px,transparent_2px_9px),linear-gradient(135deg,#252525,#101010_52%,#242424)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:font-thin min-h-[341px] py-[48px] px-[24px] text-center [&_h1]:w-[min(100%,1220px)] [&_h1]:text-[length:clamp(42px,3.5vw,58px)] [&_h1]:leading-[1.05] max-[720px]:min-h-[230px]">
        <h1><TypewriterText text="breaking down barriers: addressing common misconceptions about glp-1 medications" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="blog-content blog-detail-content grid gap-[90px] w-[min(100%_-_48px,1300px)] my-0 mx-auto pb-[142px] px-0 [align-items:start] grid-cols-[minmax(0,820px)_390px] pt-[100px] max-[1050px]:grid-cols-[minmax(0,680px)] max-[1050px]:justify-center max-[1050px]:gap-[46px] max-[1050px]:pt-[76px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[46px] max-[720px]:pt-[56px] max-[720px]:pb-[76px] max-[720px]:px-0">
        <article className="blog-article min-w-[0] text-[#4f5966] text-[length:19px] leading-[1.82] [&_p]:mt-0 [&_p]:mb-[18px] [&_p]:mx-0 [&_h2]:mt-[44px] [&_h2]:mb-[17px] [&_h2]:mx-0 [&_h2]:text-[#ebb35a] [&_h2]:text-[length:30px] [&_h2]:leading-[1.08] [&_h2]:font-thin">
          <div className="blog-article-lede grid grid-cols-[minmax(0,1fr)_300px] gap-[28px] [align-items:start] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[22px]">
            <div>
              <p>
                Medical weight loss is transforming lives by providing safe and effective tools to support individuals in
                their weight management journey. Among these innovations, GLP-1 (Glucagon-Like Peptide-1) medications have
                garnered significant attention for their ability to help with weight loss and overall health improvement.
                However, despite their benefits, misconceptions about GLP-1 medications can create unnecessary barriers for
                those who might benefit the most.
              </p>
            </div>
            <div className="blog-article-feature-image relative min-h-[180px] overflow-hidden rounded-[14px] bg-[#eee] [&_img]:object-cover">
              <Image src="/images/blogs/blog-2/10.jpg" alt="GLP-1 medication injection for medical weight loss" fill sizes="300px" priority />
            </div>
          </div>

          <h2><TypewriterText text="Misconception #1: GLP-1 Medications Are A &quot;Quick Fix&quot;" startOnView /></h2>
          <p>
            GLP-1 medications are not a magic solution. They are part of a comprehensive approach to weight loss, often
            paired with healthy lifestyle changes, including diet and exercise. These medications work by mimicking natural
            hormones that regulate appetite and blood sugar, helping to create sustainable, long-term weight loss. At Harmony
            Med Spa, our medical weight loss programs include personalized guidance to ensure you develop habits that support
            your success beyond medication.
          </p>

          <h2><TypewriterText text="Misconception #2: GLP-1 Medications Are Only For People With Diabetes" startOnView /></h2>
          <p>
            While GLP-1 medications were initially developed for diabetes management, they have been FDA-approved for weight
            loss in individuals without diabetes. These medications help reduce appetite, improve insulin sensitivity, and
            promote fat loss, making them a valuable tool for people with a variety of weight loss needs. Our experts assess
            your unique health profile to determine if GLP-1 medications are the right fit for you.
          </p>

          <h2><TypewriterText text="Misconception #3: Medical Weight Loss Isn't Necessary - Diet And Exercise Are Enough" startOnView /></h2>
          <p>
            While diet and exercise are critical for health, they may not be enough for everyone. Factors such as genetics,
            metabolism, and underlying health conditions can make weight loss challenging. Medical weight loss programs
            provide tailored solutions, including GLP-1 medications, to address these unique barriers.
          </p>

          <h2><TypewriterText text="Misconception #4: GLP-1 Medications Have Severe Side Effects" startOnView /></h2>
          <p>
            Like any medication, GLP-1 treatments may have side effects, but these are typically mild and temporary. Common
            side effects include nausea or gastrointestinal discomfort, which often subside as your body adjusts. Working
            with experienced medical professionals, like our team at Harmony Med Spa, ensures that your treatment is closely
            monitored and adjusted as needed for your comfort and safety.
          </p>

          <h2><TypewriterText text="Misconception #5: Once You Stop GLP-1 Medications, The Weight Will Come Back" startOnView /></h2>
          <p>
            Weight management is an ongoing process. While some weight may return without continued lifestyle changes, GLP-1
            medications can provide a foundation for building sustainable habits. We emphasize long-term strategies,
            including nutrition recommendations and activity planning, to help you maintain your results.
          </p>

          <h2><TypewriterText text="Start Your Wellness Journey At Harmony Med Spa Today" startOnView /></h2>
          <p>
            Breaking down the misconceptions surrounding GLP-1 medications and medical weight loss is essential to empower
            individuals to take control of their health. At Harmony Med Spa, we are committed to providing accurate
            information, personalized care, and holistic support to help you achieve your weight loss and wellness goals. By
            combining cutting-edge treatments like GLP-1 medications with sustainable lifestyle changes, you can create a
            pathway to lasting success.
          </p>
          <p>
            To learn more on how GLP-1 medications and medical weight loss can transform your life, schedule a consultation
            at Harmony Med Spa. Contact our office in Sarasota, Florida, by calling (941) 923-8990 to book an appointment
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
