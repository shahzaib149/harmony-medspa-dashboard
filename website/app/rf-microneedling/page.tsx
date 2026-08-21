import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

const sections = [
  {
    title: "What Is RF Micro-Needling?",
    body:
      "RF Micro-Needling, also known as Radiofrequency Micro-Needling, is a non-invasive cosmetic procedure that combines the benefits of traditional micro-needling with radiofrequency energy. This innovative treatment stimulates collagen production and promotes skin tightening, resulting in improved texture and firmness."
  },
  {
    title: "Areas Of Treatment",
    body:
      "At Harmony Med Spa, we offer RF Micro-Needling treatments for various areas of the body, including the face, neck, decolletage, hands, and more. Whether you're looking to reduce fine lines and wrinkles, minimize acne scars, or tighten loose skin, RF Micro-Needling can address your specific concerns."
  },
  {
    title: "Does It Hurt?",
    body:
      "Many clients describe the sensation during RF Micro-Needling as mild discomfort, similar to a light prickling or heat sensation. However, we prioritize your comfort and use numbing cream to minimize any discomfort during the treatment."
  },
  {
    title: "Call Us Today To Book An Appointment",
    body:
      "Ready to experience the transformative benefits of RF Micro-Needling at Harmony Med Spa? Contact us today to schedule your consultation and take the first step towards achieving radiant, youthful-looking skin.\n\nDon't wait - call now and let us help you love the skin you're in!"
  }
];

const benefits = [
  "Stimulates collagen production",
  "Improves skin texture and tone",
  "Reduces the appearance of fine lines and wrinkles",
  "Minimizes acne scars and other types of scarring",
  "Tightens loose or sagging skin",
  "Enhances overall skin firmness and elasticity"
];

export default function RfMicroneedlingPage() {
  return (
    <main className="rf-microneedling-page min-h-[100vh] bg-[#fff] text-[#000]">
      <SiteHeader className="team-header" servicesHref="/#services" contactHref="/#contact" />

      <section className="service-detail-hero grid [place-items:center] min-h-[320px] [background:linear-gradient(rgba(0,0,0,0.64),rgba(0,0,0,0.64)),radial-gradient(circle_at_28%_32%,rgba(255,255,255,0.08),transparent_22%),radial-gradient(circle_at_72%_46%,rgba(255,255,255,0.07),transparent_26%),repeating-linear-gradient(18deg,rgba(255,255,255,0.022)_0_2px,transparent_2px_8px),linear-gradient(135deg,#292929,#111_54%,#262626)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:text-[length:clamp(38px,4vw,58px)] [&_h1]:leading-[1.05] [&_h1]:font-thin max-[720px]:min-h-[230px] max-[720px]:px-[20px] max-[720px]:text-center">
        <h1><TypewriterText text="radio frequency microneedling" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="rf-detail-content grid grid-cols-[minmax(0,820px)_390px] gap-[78px] w-[min(100%_-_48px,1280px)] my-0 mx-auto pt-[92px] pb-[126px] px-0 max-[1050px]:grid-cols-[minmax(0,820px)] max-[1050px]:justify-center max-[1050px]:gap-[48px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:pt-[58px] max-[720px]:pb-[86px]">
        <article className="rf-detail-main min-w-0 text-[length:20px] leading-[1.45] font-normal max-[720px]:text-[length:17px]">
          <div className="grid justify-items:center mb-[42px]">
            <Image
              className="h-auto w-[min(720px,100%)]"
              src="/images/services/rf-microneedling/device.png"
              alt="Secret PRO radio frequency microneedling device"
              width={1200}
              height={800}
              priority
            />
          </div>

          <h2 className="mt-0 mb-[22px] text-[#ebb35a] text-[length:29px] leading-[1.1] font-thin max-[720px]:text-[length:25px]"><TypewriterText text="RF Micro-Needling At Harmony Med Spa In Sarasota, FL: Renew Your Skin" startOnView /></h2>
          <p className="mt-0 mb-[56px] max-w-[810px]">
            Are you looking for a rejuvenating skincare treatment in Sarasota, FL? Look no further than Harmony Med Spa! Our RF
            Micro-Needling service is designed to help you achieve smoother, tighter, and more youthful-looking skin.
          </p>

          <div className="grid grid-cols-[minmax(0,1fr)_300px] items-start gap-[62px] mb-[48px] max-[780px]:grid-cols-[1fr] max-[780px]:gap-[28px]">
            <section>
              <h2 className="mt-0 mb-[24px] text-[#ebb35a] text-[length:27px] leading-[1.12] font-thin max-[720px]:text-[length:24px]">{sections[0].title}</h2>
              <p className="m-0">{sections[0].body}</p>
            </section>
            <Image
              className="w-full h-auto rounded-[14px] max-[780px]:max-w-[340px]"
              src="/images/services/rf-microneedling/rf-microneedling.jpg"
              alt="RF microneedling treatment near the eye"
              width={600}
              height={600}
            />
          </div>

          <section className="mb-[48px]">
            <h2 className="mt-0 mb-[24px] text-[#ebb35a] text-[length:27px] leading-[1.12] font-thin max-[720px]:text-[length:24px]">{sections[1].title}</h2>
            <p className="m-0 max-w-[810px]">{sections[1].body}</p>
          </section>

          <section className="mb-[70px]">
            <h2 className="mt-0 mb-[20px] text-[#ebb35a] text-[length:27px] leading-[1.12] font-thin max-[720px]:text-[length:24px]"><TypewriterText text="Benefits Of RF Micro-Needling:" startOnView /></h2>
            <ul className="mt-0 mb-0 pl-[30px]">
              {benefits.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
          </section>

          <Image
            className="w-[min(820px,100%)] h-auto mb-[78px]"
            src="/images/services/rf-microneedling/handpiece.png"
            alt="Secret PRO RF microneedling handpiece"
            width={1200}
            height={800}
          />

          {sections.slice(2).map((section) => (
            <section className="mb-[46px] last:mb-0" key={section.title}>
              <h2 className="mt-0 mb-[24px] text-[#ebb35a] text-[length:27px] leading-[1.12] font-thin max-[720px]:text-[length:24px]">{section.title}</h2>
              {section.body.split("\n\n").map((paragraph) => (
                <p className="mt-0 mb-[28px] max-w-[840px] last:mb-0" key={paragraph}>
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </article>

        <aside className="rf-detail-sidebar grid [align-content:start] gap-[35px] pt-[16px] [&_.about-side-card]:min-h-[269px] [&_.about-side-card]:rounded-[18px] [&_.about-side-card_span]:text-[length:30px] [&_.about-side-card_small]:text-[length:22px] max-[1050px]:grid-cols-[repeat(2,minmax(240px,390px))] max-[1050px]:justify-center max-[720px]:grid-cols-[1fr] max-[720px]:gap-[22px] max-[720px]:[&_.about-side-card]:min-h-[220px]" aria-label="RF microneedling links">
          <label className="about-search flex items-center h-[70px] mb-0 py-0 pr-[24px] pl-[30px] [border:1px_solid_#c8d2dd] rounded-[8px] text-[var(--gold)] bg-[#fff] [&_input]:min-w-[0] [&_input]:flex-1 [&_input]:border-0 [&_input]:[outline:0] [&_input]:text-[#344356] [&_input]:bg-[transparent] [&_input]:[font:inherit] [&_input::placeholder]:text-[#425263] [&_input::placeholder]:opacity-[0.9] max-[1050px]:col-[1_/_-1]">
            <span className="sr-only">Search keyword</span>
            <input type="search" placeholder="Enter search keyword" />
            <Search size={22} />
          </label>

          <Link className="about-side-card relative grid [place-items:center] overflow-hidden text-[#fff] text-center isolate before:content-[''] before:absolute before:inset-0 before:z-[-1] before:[background:rgba(0,0,0,0.36)] [&_img]:z-[-2] [&_img]:object-cover [&_img]:[transition:transform_420ms_ease] [&_span]:text-[length:25px] [&_span]:leading-[1.1] [&_span]:font-normal [&_small]:inline-flex [&_small]:min-w-[146px] [&_small]:justify-center [&_small]:mt-[10px] [&_small]:py-[12px] [&_small]:px-[18px] [&_small]:[border-top:1px_solid_var(--gold)] [&_small]:[border-bottom:1px_solid_var(--gold)] [&_small]:text-[length:16px]" href="/services">
            <Image src="/images/about-us/img_1.png" alt="" fill sizes="390px" />
            <span>All<br />Services</span>
            <small>Learn More</small>
          </Link>

          <Link className="about-side-card relative grid [place-items:center] overflow-hidden text-[#fff] text-center isolate before:content-[''] before:absolute before:inset-0 before:z-[-1] before:[background:rgba(0,0,0,0.36)] [&_img]:z-[-2] [&_img]:object-cover [&_img]:[transition:transform_420ms_ease] [&_span]:text-[length:25px] [&_span]:leading-[1.1] [&_span]:font-normal [&_small]:inline-flex [&_small]:min-w-[146px] [&_small]:justify-center [&_small]:mt-[10px] [&_small]:py-[12px] [&_small]:px-[18px] [&_small]:[border-top:1px_solid_var(--gold)] [&_small]:[border-bottom:1px_solid_var(--gold)] [&_small]:text-[length:16px]" href="/contact-us">
            <Image src="/images/about-us/Img_2.png" alt="" fill sizes="390px" />
            <span>Keep<br />In Touch</span>
            <small>Contact Us</small>
          </Link>
        </aside>
      </section>

      <SiteFooter address="linked-name" copyright="plain" />
    </main>
  );
}
