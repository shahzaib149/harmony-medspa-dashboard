import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

const benefits = [
  "Alleviates symptoms of menopause, including hot flashes, mood swings, and insomnia",
  "Improves libido and sexual function",
  "Enhances energy levels and vitality",
  "Supports weight management and metabolism",
  "Boosts mental clarity and cognitive function",
  "Promotes overall well-being and quality of life"
];

export default function HormoneReplacementTherapyPage() {
  return (
    <main className="hormone-replacement-therapy-page min-h-[100vh] bg-[#fff] text-[#000]">
      <SiteHeader className="team-header" servicesHref="/#services" contactHref="/#contact" />

      <section className="service-detail-hero grid [place-items:center] min-h-[320px] [background:linear-gradient(rgba(0,0,0,0.64),rgba(0,0,0,0.64)),radial-gradient(circle_at_28%_32%,rgba(255,255,255,0.08),transparent_22%),radial-gradient(circle_at_72%_46%,rgba(255,255,255,0.07),transparent_26%),repeating-linear-gradient(18deg,rgba(255,255,255,0.022)_0_2px,transparent_2px_8px),linear-gradient(135deg,#292929,#111_54%,#262626)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:text-[length:clamp(38px,4vw,58px)] [&_h1]:leading-[1.05] [&_h1]:font-thin max-[720px]:min-h-[230px] max-[720px]:px-[20px] max-[720px]:text-center">
        <h1><TypewriterText text="hormone replacement therapy" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="grid grid-cols-[minmax(0,820px)_390px] gap-[78px] w-[min(100%_-_48px,1280px)] my-0 mx-auto pt-[92px] pb-[126px] px-0 max-[1050px]:grid-cols-[minmax(0,820px)] max-[1050px]:justify-center max-[1050px]:gap-[48px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:pt-[58px] max-[720px]:pb-[86px]">
        <article className="min-w-0 text-[length:20px] leading-[1.45] font-normal max-[720px]:text-[length:17px]">
          <section className="grid grid-cols-[300px_minmax(0,1fr)] gap-[30px] items-start mb-[48px] max-[760px]:grid-cols-[1fr]">
            <Image
              className="h-auto w-full rounded-[16px]"
              src="/images/services/hormone-replacement-therapy/hero.jpg"
              alt="Hormone Replacement Therapy at Harmony Med Spa"
              width={700}
              height={520}
              priority
            />
            <div>
              <h2 className="mt-[18px] mb-[22px] text-[#ebb35a] text-[length:29px] leading-[1.1] font-thin max-[720px]:mt-0 max-[720px]:text-[length:25px]"><TypewriterText text="Hormone Replacement Therapy (HRT) At Harmony Med Spa In Sarasota, FL: Reclaim Your Vitality" startOnView /></h2>
              <p className="m-0">
                Are you seeking relief from hormonal imbalances or looking to restore your overall well-being in Sarasota, FL? Discover the
                transformative benefits of Hormone Replacement Therapy (HRT) at Harmony Med Spa!
              </p>
            </div>
          </section>

          <section className="mb-[48px]">
            <h2 className="mt-0 mb-[24px] text-[#ebb35a] text-[length:27px] leading-[1.12] font-thin max-[720px]:text-[length:24px]"><TypewriterText text="What Is Hormone Replacement Therapy?" startOnView /></h2>
            <p className="m-0 max-w-[840px]">
              Hormone Replacement Therapy, or HRT, is a personalized treatment approach aimed at replenishing hormone levels in the body to
              alleviate symptoms of hormonal imbalances. At Harmony Med Spa, our experienced practitioners work closely with you to develop a
              tailored HRT plan designed to optimize your health and vitality.
            </p>
          </section>

          <section className="mb-[48px]">
            <h2 className="mt-0 mb-[24px] text-[#ebb35a] text-[length:27px] leading-[1.12] font-thin max-[720px]:text-[length:24px]"><TypewriterText text="Areas Of Treatment:" startOnView /></h2>
            <p className="m-0 max-w-[840px]">
              Our Hormone Replacement Therapy services encompass a wide range of hormonal imbalances affecting both men and women. Whether
              you&apos;re experiencing symptoms of menopause, andropause, thyroid disorders, or other hormonal issues, our team is here to
              provide comprehensive care and support.
            </p>
          </section>

          <section className="mb-[54px]">
            <h2 className="mt-0 mb-[20px] text-[#ebb35a] text-[length:27px] leading-[1.12] font-thin max-[720px]:text-[length:24px]"><TypewriterText text="Benefits Of Hormone Replacement Therapy:" startOnView /></h2>
            <ul className="mt-0 mb-0 pl-[30px]">
              {benefits.map((benefit) => (
                <li className="mb-[6px]" key={benefit}>{benefit}</li>
              ))}
            </ul>
          </section>

          <video
            className="mb-[24px] block w-full max-w-[808px] bg-[#16245e]"
            controls
            preload="metadata"
            src="/images/services/hormone-replacement-therapy/evexipel-video.mp4"
          />

          <section className="mb-[48px]">
            <h2 className="mt-0 mb-[24px] text-[#ebb35a] text-[length:27px] leading-[1.12] font-thin max-[720px]:text-[length:24px]"><TypewriterText text="Does It Hurt?" startOnView /></h2>
            <p className="m-0 max-w-[840px] text-[#4f5b68]">
              Hormone Replacement Therapy is typically administered through various methods, such as oral medications, patches, creams, or
              injections. The treatment process is generally painless, and our team ensures your comfort and safety throughout the procedure.
            </p>
          </section>

          <section className="mb-[48px]">
            <h2 className="mt-0 mb-[24px] text-[#ebb35a] text-[length:27px] leading-[1.12] font-thin max-[720px]:text-[length:24px]"><TypewriterText text="Call Us Today To Schedule Your Consultation:" startOnView /></h2>
            <p className="mt-0 mb-[28px] max-w-[840px] text-[#4f5b68]">
              Ready to take control of your hormonal health and vitality with Hormone Replacement Therapy at Harmony Med Spa? Contact us
              today to book your consultation and embark on your journey towards feeling your best self.
            </p>
            <p className="m-0 max-w-[840px] text-[#4f5b68]">
              Don&apos;t let hormonal imbalances hold you back - call now and let us help you reclaim your vitality!
            </p>
          </section>

          <Image
            className="h-auto w-[min(290px,100%)]"
            src="/images/services/hormone-replacement-therapy/evexipel-logo.png"
            alt="Certified EvexiPEL provider"
            width={360}
            height={360}
          />
        </article>

        <aside className="grid [align-content:start] gap-[35px] pt-[16px] [&_.about-side-card]:min-h-[269px] [&_.about-side-card]:rounded-[18px] [&_.about-side-card_span]:text-[length:30px] [&_.about-side-card_small]:text-[length:22px] max-[1050px]:grid-cols-[repeat(2,minmax(240px,390px))] max-[1050px]:justify-center max-[720px]:grid-cols-[1fr] max-[720px]:gap-[22px] max-[720px]:[&_.about-side-card]:min-h-[220px]" aria-label="Hormone Replacement Therapy links">
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
