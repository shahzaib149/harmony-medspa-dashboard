import Image from "next/image";
import Link from "next/link";
import BlogSearchForm from "@/components/blog/BlogSearchForm";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

export default function GoodCandidateForInjectablesBlogPage() {
  return (
    <main className="blog-page blog-detail-page min-h-[100vh] bg-[#fff] text-[#000]">
      <SiteHeader className="contact-page-header" />

      <section className="blog-hero blog-detail-hero grid [place-items:center] [background:linear-gradient(rgba(0,0,0,0.62),rgba(0,0,0,0.62)),radial-gradient(circle_at_22%_38%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_70%_42%,rgba(255,255,255,0.06),transparent_24%),repeating-linear-gradient(29deg,rgba(255,255,255,0.025)_0_2px,transparent_2px_9px),linear-gradient(135deg,#252525,#101010_52%,#242424)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:font-thin min-h-[341px] py-[48px] px-[24px] text-center [&_h1]:w-[min(100%,1180px)] [&_h1]:text-[length:clamp(42px,3.5vw,58px)] [&_h1]:leading-[1.05] max-[720px]:min-h-[230px]">
        <h1><TypewriterText text="who is a good candidate for injectables?" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="blog-content blog-detail-content grid gap-[90px] w-[min(100%_-_48px,1300px)] my-0 mx-auto pb-[142px] px-0 [align-items:start] grid-cols-[minmax(0,820px)_390px] pt-[100px] max-[1050px]:grid-cols-[minmax(0,680px)] max-[1050px]:justify-center max-[1050px]:gap-[46px] max-[1050px]:pt-[76px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[46px] max-[720px]:pt-[56px] max-[720px]:pb-[76px] max-[720px]:px-0">
        <article className="blog-article min-w-[0] text-[#4f5966] text-[length:19px] leading-[1.82] [&_p]:mt-0 [&_p]:mb-[18px] [&_p]:mx-0 [&_h2]:mt-[44px] [&_h2]:mb-[17px] [&_h2]:mx-0 [&_h2]:text-[#ebb35a] [&_h2]:text-[length:30px] [&_h2]:leading-[1.2] [&_h2]:font-thin [&_ul]:mt-0 [&_ul]:mb-[26px] [&_ul]:mr-0 [&_ul]:ml-[26px] [&_ul]:pl-0 [&_ul]:list-disc [&_ul]:list-outside [&_li]:pl-[4px] [&_li]:mb-[24px] [&_li]:leading-[1.65] [&_li::marker]:text-[#5f6670] [&_li::marker]:text-[length:14px] [&_a]:text-[#e2a719] [&_a]:[transition:color_160ms_ease] hover:[&_a]:text-[#b98210]">
          <div className="blog-article-lede grid grid-cols-[minmax(0,1fr)_300px] gap-[28px] [align-items:start] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[22px]">
            <div>
              <p>
                Injectables have revolutionized the cosmetic industry, offering a minimally invasive way to enhance your
                appearance, smooth wrinkles, and rejuvenate the skin. Whether you&apos;re looking to add volume, reduce the
                appearance of fine lines, or prevent the onset of aging, injectables may be an ideal option for you.
              </p>
            </div>
            <div className="blog-article-feature-image relative min-h-[180px] overflow-hidden rounded-[14px] bg-[#eee] [&_img]:object-cover">
              <Image src="/images/blogs/good-candidate-injectables/1.jpg" alt="Patient receiving an injectable aesthetic treatment" fill sizes="300px" priority />
            </div>
          </div>

          <h2><TypewriterText text="What Are Injectables?" startOnView /></h2>
          <p>
            Injectables refer to non-surgical treatments designed to address a variety of cosmetic concerns. These treatments
            involve the injection of substances, such as neuromodulators or dermal fillers, into the skin to restore volume,
            smooth wrinkles, or improve skin texture. The beauty of injectables lies in their ability to deliver noticeable
            results with minimal downtime.
          </p>

          <h2><TypewriterText text="Types Of Injectables" startOnView /></h2>
          <p>At Harmony Med Spa, we offer a range of advanced injectable treatments to meet different aesthetic needs:</p>
          <ul>
            <li>
              Sculptra Aesthetic: A collagen stimulator that gradually restores volume and helps rebuild the skin&apos;s
              underlying structure, leading to a more youthful appearance over time.
            </li>
            <li>
              Jeuveau: A neuromodulator used to temporarily improve the look of moderate to severe frown lines between the
              eyebrows. Similar to Botox, it works by relaxing the muscles that cause wrinkles.
            </li>
            <li>
              DAXXIFY: A long-lasting alternative to traditional neuromodulators, DAXXIFY offers extended wrinkle-smoothing
              effects, particularly for dynamic lines such as crow&apos;s feet and forehead wrinkles.
            </li>
            <li>
              Dermal Fillers: These injectables are specifically designed to add volume to areas that have lost their
              fullness over time. Dermal fillers can help plump the cheeks, fill in deep lines, smooth wrinkles, and enhance
              the lips, giving you a more youthful and refreshed appearance.
            </li>
          </ul>

          <h2><TypewriterText text="Who Is A Good Candidate?" startOnView /></h2>
          <ul>
            <li>
              Individuals Looking to Reduce Wrinkles and Fine Lines: If you&apos;re starting to notice expression lines around
              your eyes, forehead, or between your brows, neuromodulators like Jeuveau or DAXXIFY may help smooth these lines
              for a refreshed look.
            </li>
            <li>
              People Who Want to Restore Lost Facial Volume: With age, we lose facial volume, which can lead to a sunken or
              tired appearance. Dermal fillers, such as Sculptra Aesthetic, can be used to plump areas like the cheeks or
              lips, restoring a youthful look.
            </li>
            <li>
              Those Seeking Non-Surgical Solutions: Injectables are a great alternative for individuals who want to avoid
              surgical procedures but still desire noticeable improvements in their appearance. These treatments are quick,
              minimally invasive, and involve little to no downtime.
            </li>
            <li>
              Patients Looking for Customizable Treatments: Injectables offer the benefit of customizable treatments tailored
              to your specific aesthetic goals. Whether you&apos;re addressing a single concern or want a full facial
              rejuvenation, injectables can be personalized to meet your needs.
            </li>
            <li>
              Healthy Adults with Realistic Expectations: Good candidates are generally healthy individuals who understand
              what injectables can achieve. While they offer impressive results, it&apos;s important to have realistic
              expectations about the extent of the improvements.
            </li>
          </ul>

          <p>
            Ideal candidates are generally in good overall health, have realistic expectations, and are looking for subtle,
            natural-looking results. During your consultation at Harmony Med Spa, we will evaluate your skin type, concerns,
            and goals to determine the best injectable treatment for you.
          </p>

          <h2><TypewriterText text="Enhance Your Beauty With Injectables At Harmony Med Spa" startOnView /></h2>
          <p>
            At Harmony Med Spa, we believe that every individual&apos;s beauty journey is unique. We tailor each injectable
            treatment to meet your specific needs and desired outcomes. Whether you&apos;re aiming to smooth wrinkles, enhance
            your facial features, or achieve a more youthful look, we create personalized treatment plans that align with
            your aesthetic goals.
          </p>
          <p>
            From your initial consultation to post-treatment care, Harmony Med Spa ensures you feel informed and comfortable
            every step of the way. We are dedicated to providing high-quality, natural-looking results that enhance your
            beauty and boost your confidence.
          </p>
          <p>
            Contact Harmony Med Spa to schedule your consultation and discover how injectables can help you look and feel
            your best. Visit our office in Sarasota, Florida, or call (941) 923-8990 to book an appointment today.
          </p>
          <p>
            <Link href="/good-candidate-injectables.pdf" target="_blank" rel="noopener noreferrer">
              View the injectables candidate PDF
            </Link>
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
