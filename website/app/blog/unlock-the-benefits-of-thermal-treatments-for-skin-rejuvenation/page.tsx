import Image from "next/image";
import Link from "next/link";
import BlogSearchForm from "@/components/blog/BlogSearchForm";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

export default function ThermalTreatmentsSkinRejuvenationBlogPage() {
  return (
    <main className="blog-page blog-detail-page min-h-[100vh] bg-[#fff] text-[#000]">
      <SiteHeader className="contact-page-header" />

      <section className="blog-hero blog-detail-hero grid [place-items:center] [background:linear-gradient(rgba(0,0,0,0.62),rgba(0,0,0,0.62)),radial-gradient(circle_at_22%_38%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_70%_42%,rgba(255,255,255,0.06),transparent_24%),repeating-linear-gradient(29deg,rgba(255,255,255,0.025)_0_2px,transparent_2px_9px),linear-gradient(135deg,#252525,#101010_52%,#242424)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:font-thin min-h-[341px] py-[48px] px-[24px] text-center [&_h1]:w-[min(100%,1290px)] [&_h1]:text-[length:clamp(42px,3.5vw,58px)] [&_h1]:leading-[1.05] max-[720px]:min-h-[230px]">
        <h1><TypewriterText text="unlock the benefits of thermal treatments for skin rejuvenation" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="blog-content blog-detail-content grid gap-[90px] w-[min(100%_-_48px,1300px)] my-0 mx-auto pb-[142px] px-0 [align-items:start] grid-cols-[minmax(0,820px)_390px] pt-[100px] max-[1050px]:grid-cols-[minmax(0,680px)] max-[1050px]:justify-center max-[1050px]:gap-[46px] max-[1050px]:pt-[76px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[46px] max-[720px]:pt-[56px] max-[720px]:pb-[76px] max-[720px]:px-0">
        <article className="blog-article min-w-[0] text-[#4f5966] text-[length:19px] leading-[1.82] [&_p]:mt-0 [&_p]:mb-[18px] [&_p]:mx-0 [&_h2]:mt-[44px] [&_h2]:mb-[17px] [&_h2]:mx-0 [&_h2]:text-[#ebb35a] [&_h2]:text-[length:30px] [&_h2]:leading-[1.2] [&_h2]:font-thin [&_ul]:mt-0 [&_ul]:mb-[20px] [&_ul]:mr-0 [&_ul]:ml-[22px] [&_ul]:p-0 [&_li]:pl-[4px] [&_li]:leading-[1.65]">
          <div className="blog-article-lede grid grid-cols-[minmax(0,1fr)_300px] gap-[28px] [align-items:start] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[22px]">
            <div>
              <p>
                In the world of modern aesthetics, advanced thermal treatments are transforming the way we care for our skin. We offer a curated
                selection of thermal-based skin rejuvenation procedures designed to restore youthful vitality, improve skin texture, and promote
                collagen production. Whether you&apos;re seeking smoother skin, improved tone, or a refreshed glow, our treatments deliver
                noticeable results with minimal downtime.
              </p>
            </div>
            <div className="blog-article-feature-image relative min-h-[200px] overflow-hidden rounded-[14px] bg-[#eee] [&_img]:object-cover">
              <Image src="/images/blogs/blog-2/2.jpg" alt="Thermal skin rejuvenation treatment" fill sizes="300px" priority />
            </div>
          </div>

          <h2><TypewriterText text="Thermal Rejuvenation At Harmony Med Spa" startOnView /></h2>
          <p>
            At Harmony Med Spa, we tailor each treatment plan to your unique skin type and goals. We use leading technology and follow strict
            safety protocols to ensure optimal results with every session. Whether you&apos;re new to aesthetic treatments or looking to enhance
            your current skincare regimen, our thermal skin rejuvenation options offer a powerful way to renew your confidence from the inside out.
          </p>

          <h2><TypewriterText text="Intense Pulsed Light (IPL) Therapy" startOnView /></h2>
          <p>
            For patients looking to target discoloration and enhance overall skin tone without invasive procedures, IPL (Intense Pulsed Light)
            therapy is an excellent solution. IPL uses multiple wavelengths of light energy to gently heat the skin and treat:
          </p>
          <ul>
            <li>Sun spots and age spots</li>
            <li>Rosacea and redness</li>
            <li>Broken capillaries</li>
            <li>Uneven pigmentation and dullness</li>
          </ul>
          <p>
            The thermal energy delivered during IPL treatments stimulates collagen production and breaks down unwanted pigment beneath the
            skin&apos;s surface. Most patients experience a noticeable improvement in skin clarity and brightness after just a few sessions. IPL is
            safe for many skin types and is a great option for those seeking a clearer, more radiant complexion with no downtime.
          </p>

          <h2><TypewriterText text="RF Microneedling" startOnView /></h2>
          <p>
            Radiofrequency (RF) microneedling combines the collagen-boosting effects of microneedling with the added power of thermal energy. Tiny
            needles penetrate the skin while delivering controlled RF heat to the deeper layers. This dual-action treatment promotes:
          </p>
          <ul>
            <li>Tighter, firmer skin</li>
            <li>Reduced appearance of fine lines</li>
            <li>Improvement in acne scarring and texture</li>
            <li>Enhanced skin elasticity</li>
          </ul>
          <p>
            RF microneedling is highly customizable and offers impressive results with minimal downtime, making it an excellent option for those
            looking to refresh their appearance without invasive surgery.
          </p>

          <h2><TypewriterText text="CO2 Laser Treatments" startOnView /></h2>
          <p>
            CO2 (carbon dioxide) laser resurfacing is one of the most effective thermal treatments for addressing a wide range of skin concerns,
            including:
          </p>
          <ul>
            <li>Fine lines and wrinkles</li>
            <li>Sun damage and age spots</li>
            <li>Acne scars and surgical scars</li>
            <li>Uneven texture and large pores</li>
          </ul>
          <p>
            This fractional laser works by creating microscopic injuries in the skin&apos;s surface while simultaneously stimulating collagen
            production deep within the dermis. As your skin heals, you&apos;ll notice a smoother, tighter, and more even-toned complexion. Results
            are long-lasting, and most patients see significant improvement after just one session.
          </p>

          <h2><TypewriterText text="Reveal Healthier, Younger-Looking Skin" startOnView /></h2>
          <p>
            Thermal treatments like IPL, RF microneedling, and CO2 laser resurfacing offer powerful, science-backed solutions to revitalize your
            skin from the inside out. Whether you want to smooth fine lines, improve skin tone, or restore your natural glow, these advanced
            therapies can help you achieve noticeable, long-lasting results.
          </p>
          <p>
            Schedule a consultation at Harmony Med Spa to find out which thermal treatment is right for you. Visit our office in Sarasota,
            Florida, or call (941) 923-8990 to book an appointment today.
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
