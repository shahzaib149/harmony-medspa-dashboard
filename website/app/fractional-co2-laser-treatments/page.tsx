import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

const targetAreas = [
  "Face: Address wrinkles, lines, and pigmentation irregularities.",
  "Neck: Tighten loose skin and reduce wrinkles.",
  "Chest: Improve skin tone and texture, reducing the appearance of sun damage.",
  "Hands: Smooth out fine lines and age spots for younger-looking hands."
];

const benefits = [
  {
    label: "Reduces Signs of Aging:",
    text: "Fractional CO2 laser treatments effectively diminish fine lines, wrinkles, and age spots, restoring a more youthful appearance."
  },
  {
    label: "Improves Skin Texture:",
    text: "By promoting collagen production, Fractional CO2 laser treatments smooth out rough skin texture and minimize acne scars."
  },
  {
    label: "Evens Skin Tone:",
    text: "Uneven pigmentation and sun damage are effectively treated, resulting in a more balanced complexion."
  },
  {
    label: "Boosts Confidence:",
    text: "With rejuvenated skin, clients experience renewed confidence and a more positive self-image."
  }
];

export default function FractionalCo2LaserTreatmentsPage() {
  return (
    <main className="fractional-co2-page min-h-[100vh] bg-[#fff] text-[#000]">
      <SiteHeader className="team-header" servicesHref="/#services" contactHref="/#contact" />

      <section className="service-detail-hero grid [place-items:center] min-h-[320px] [background:linear-gradient(rgba(0,0,0,0.64),rgba(0,0,0,0.64)),radial-gradient(circle_at_28%_32%,rgba(255,255,255,0.08),transparent_22%),radial-gradient(circle_at_72%_46%,rgba(255,255,255,0.07),transparent_26%),repeating-linear-gradient(18deg,rgba(255,255,255,0.022)_0_2px,transparent_2px_8px),linear-gradient(135deg,#292929,#111_54%,#262626)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:text-[length:clamp(38px,4vw,58px)] [&_h1]:leading-[1.05] [&_h1]:font-thin max-[720px]:min-h-[230px] max-[720px]:px-[20px] max-[720px]:text-center">
        <h1><TypewriterText text="fractional co2 laser treatments" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="grid grid-cols-[minmax(0,820px)_390px] gap-[78px] w-[min(100%_-_48px,1280px)] my-0 mx-auto pt-[92px] pb-[126px] px-0 max-[1050px]:grid-cols-[minmax(0,820px)] max-[1050px]:justify-center max-[1050px]:gap-[48px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:pt-[58px] max-[720px]:pb-[86px]">
        <article className="min-w-0 text-[length:20px] leading-[1.45] font-normal max-[720px]:text-[length:17px]">
          <div className="grid justify-items:center mb-[42px] overflow-hidden">
            <Image
              className="h-auto w-[min(760px,100%)]"
              src="/images/services/fractional-co2-laser-treatments/secret-pro.png"
              alt="Secret PRO fractional CO2 laser treatment device"
              width={1200}
              height={800}
              priority
            />
          </div>

          <h2 className="mt-0 mb-[22px] text-[#ebb35a] text-[length:29px] leading-[1.1] font-thin max-[720px]:text-[length:25px]"><TypewriterText text="Rejuvenate Your Skin With Fractional CO2 Laser Treatments At Harmony Med Spa In Sarasota, FL" startOnView /></h2>
          <p className="mt-0 mb-[56px] max-w-[840px]">
            Designed to rejuvenate and revitalize your skin, CO2 laser treatments are a powerful solution for various skincare concerns.
          </p>

          <section className="mb-[48px]">
            <h2 className="mt-0 mb-[24px] text-[#ebb35a] text-[length:27px] leading-[1.12] font-thin max-[720px]:text-[length:24px]"><TypewriterText text="Understanding Fractional CO2 Laser Treatments:" startOnView /></h2>
            <p className="m-0 max-w-[840px]">
              Fractional CO2 laser treatments involve using a high-powered laser to precisely remove layers of damaged skin, stimulating
              collagen production and revealing healthier, smoother skin underneath. This advanced treatment is effective for addressing a
              wide range of concerns, including fine lines, wrinkles, acne scars, sun damage, and uneven skin texture.
            </p>
          </section>

          <section className="mb-[48px]">
            <h2 className="mt-0 mb-[20px] text-[#ebb35a] text-[length:27px] leading-[1.12] font-thin max-[720px]:text-[length:24px]"><TypewriterText text="Target Areas:" startOnView /></h2>
            <p className="mt-0 mb-[8px] max-w-[840px]">
              Fractional CO2 laser treatments can be applied to various areas of the face and body, including:
            </p>
            <ul className="mt-0 mb-0 pl-[30px]">
              {targetAreas.map((area) => (
                <li key={area}>{area}</li>
              ))}
            </ul>
          </section>

          <section className="mb-[48px]">
            <h2 className="mt-0 mb-[20px] text-[#ebb35a] text-[length:27px] leading-[1.12] font-thin max-[720px]:text-[length:24px]"><TypewriterText text="Benefits Of Treatment:" startOnView /></h2>
            <ul className="mt-0 mb-0 pl-[30px]">
              {benefits.map((benefit) => (
                <li key={benefit.label}>
                  <strong>{benefit.label}</strong> {benefit.text}
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-[48px]">
            <h2 className="mt-0 mb-[24px] text-[#ebb35a] text-[length:27px] leading-[1.12] font-thin max-[720px]:text-[length:24px]"><TypewriterText text="Results:" startOnView /></h2>
            <p className="m-0 max-w-[840px]">
              Results from Fractional CO2 laser treatments are typically visible within a few weeks after treatment and continue to improve
              over several months. Clients can expect smoother, firmer skin with reduced wrinkles and a more youthful glow. For optimal
              results, a series of treatments may be recommended, depending on individual skincare needs.
            </p>
          </section>

          <section>
            <h2 className="mt-0 mb-[24px] text-[#ebb35a] text-[length:27px] leading-[1.12] font-thin max-[720px]:text-[length:24px]"><TypewriterText text="Experience The Transformation:" startOnView /></h2>
            <p className="m-0 max-w-[840px]">
              Ready to rejuvenate your skin and rediscover your youthful glow? Schedule your consultation with our expert team at Harmony
              Med Spa today. Discover the transformative power of Fractional CO2 laser treatments and take the first step towards healthier,
              more radiant skin. Contact us now to book your appointment and experience the harmony of beauty and wellness at Harmony Med Spa
              in Sarasota, FL.
            </p>
          </section>
        </article>

        <aside className="grid [align-content:start] gap-[35px] pt-[16px] [&_.about-side-card]:min-h-[269px] [&_.about-side-card]:rounded-[18px] [&_.about-side-card_span]:text-[length:30px] [&_.about-side-card_small]:text-[length:22px] max-[1050px]:grid-cols-[repeat(2,minmax(240px,390px))] max-[1050px]:justify-center max-[720px]:grid-cols-[1fr] max-[720px]:gap-[22px] max-[720px]:[&_.about-side-card]:min-h-[220px]" aria-label="Fractional CO2 laser links">
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
