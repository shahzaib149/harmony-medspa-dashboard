import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

const promiseSteps = [
  {
    label: "Exfoliate:",
    text: "Our gentle yet effective exfoliation technique removes the outermost layer of dead skin cells, revealing the brighter, fresher layer beneath. This phase preps the skin to absorb the rich nutrients and treatments that follow."
  },
  {
    label: "Infuse:",
    text: "Dive deeper with nutrient-rich serums that penetrate the skin layers, offering deep hydration and nourishment. This infusion aids in correcting skin imperfections, promoting collagen production, and combating signs of aging."
  },
  {
    label: "Oxygenate:",
    text: "A vital phase, oxygenation boosts circulation, stimulating cellular activity and aiding the skin's natural regeneration process. This results in a plump, refreshed, and glowing complexion that breathes health and youthfulness."
  }
];

const treatmentAreas = [
  {
    title: "HANDS",
    text: "Rejuvenate and refresh your hands with the Glo2Facial treatment, targeting signs of aging, sun damage, and uneven skin tone. Restore a youthful appearance and softness to one of the most exposed parts of your body."
  },
  {
    title: "DECOLLETAGE",
    text: "Address fine lines, wrinkles, and sun damage in this delicate chest area. The Glo2Facial revitalizes and nourishes, revealing smoother, brighter, and more youthful skin on the decolletage."
  },
  {
    title: "BUTTOCKS",
    text: "Enhance the smoothness and clarity of the skin on your buttocks with GloFacial. This treatment exfoliates, hydrates, and revitalizes, ensuring a firmer and more youthful appearance."
  },
  {
    title: "BACK",
    text: "Attain a clearer, more radiant back with the Glo2Facial treatment. Ideal for addressing acne, oily skin, or uneven texture, this treatment purifies and enhances the overall health of your back's skin."
  }
];

export default function Glo2FacialsPage() {
  return (
    <main className="glo2facials-page min-h-[100vh] bg-[#fff] text-[#050505]">
      <SiteHeader className="team-header" servicesHref="/#services" contactHref="/#contact" />

      <section className="service-detail-hero grid [place-items:center] min-h-[320px] [background:linear-gradient(rgba(0,0,0,0.62),rgba(0,0,0,0.62)),radial-gradient(circle_at_28%_32%,rgba(255,255,255,0.08),transparent_22%),radial-gradient(circle_at_72%_46%,rgba(255,255,255,0.07),transparent_26%),repeating-linear-gradient(18deg,rgba(255,255,255,0.022)_0_2px,transparent_2px_8px),linear-gradient(135deg,#292929,#111_54%,#262626)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:text-[length:clamp(44px,4vw,60px)] [&_h1]:leading-[1.05] [&_h1]:font-thin max-[720px]:min-h-[230px] max-[720px]:px-[20px] max-[720px]:text-center">
        <h1><TypewriterText text="glo2facials" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="grid grid-cols-[minmax(0,820px)_390px] gap-[78px] w-[min(100%_-_48px,1280px)] my-0 mx-auto pt-[92px] pb-[126px] px-0 max-[1050px]:grid-cols-[minmax(0,820px)] max-[1050px]:justify-center max-[1050px]:gap-[48px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:pt-[58px] max-[720px]:pb-[86px]">
        <article className="min-w-0 text-[length:20px] leading-[1.45] font-normal max-[720px]:text-[length:17px]">
          <section className="mb-[28px]">
            <h2 className="mt-0 mb-[18px] text-[#ebb35a] text-[length:29px] leading-[1.12] font-thin max-[720px]:text-[length:25px]"><TypewriterText text="Glo2Facial Treatment Menu" startOnView /></h2>
            <h3 className="mt-0 mb-[24px] text-[#ebb35a] text-[length:25px] leading-[1.18] font-thin max-[720px]:text-[length:22px]">THE GLO2FACIAL (45 MINS)</h3>
            <p className="mt-0 mb-[28px] max-w-[840px]">
              Dive into a rejuvenating journey tailored for those seeking the ultimate skin revival. The Glo2Facial, with its 45-minute luxurious treatment, seamlessly blends three distinctive processes, ensuring your skin reaps the benefits of each, all in one session.
            </p>
          </section>

          <Image
            className="w-full h-auto rounded-[16px] mb-[54px]"
            src="/images/services/glo2facials/1.jfif"
            alt="Glo2Facial treatment mask at Harmony Med Spa"
            width={1000}
            height={650}
            priority
          />

          <section className="mb-[48px]">
            <h2 className="mt-0 mb-[24px] text-[#ebb35a] text-[length:29px] leading-[1.12] font-thin max-[720px]:text-[length:25px]"><TypewriterText text="THE 3-IN-1 PROMISE:" startOnView /></h2>
            <p className="mt-0 mb-[28px] max-w-[840px]">
              The &quot;3-in-1 Promise&quot; of the GloFacial encapsulates a holistic approach to skin rejuvenation, combining the essential steps of exfoliation, infusion, and oxygenation. This trifecta ensures deep skin renewal, offering a complete revitalization experience that addresses skin imperfections, promotes hydration, and stimulates natural regeneration all in one transformative session.
            </p>
            {promiseSteps.map((step) => (
              <p className="mt-0 mb-[28px] max-w-[840px]" key={step.label}>
                <strong>{step.label}</strong> {step.text}
              </p>
            ))}
          </section>

          <Image
            className="w-full h-auto rounded-[16px] mb-[54px]"
            src="/images/services/glo2facials/2.jfif"
            alt="Glo2Facial body treatment"
            width={1000}
            height={650}
          />

          <section className="mb-[54px]">
            <h2 className="mt-0 mb-[24px] text-[#ebb35a] text-[length:29px] leading-[1.12] font-thin max-[720px]:text-[length:25px]"><TypewriterText text="Additional Treatment Areas:" startOnView /></h2>
            {treatmentAreas.map((area) => (
              <div className="mb-[28px]" key={area.title}>
                <h3 className="mt-0 mb-[6px] text-[#050505] text-[length:20px] leading-[1.2] font-bold">{area.title}</h3>
                <p className="m-0 max-w-[840px]">{area.text}</p>
              </div>
            ))}
          </section>

          <section className="mb-[42px]">
            <h2 className="mt-0 mb-[24px] text-[#ebb35a] text-[length:29px] leading-[1.12] font-thin max-[720px]:text-[length:25px]"><TypewriterText text="TREATMENT ADD-ONS:" startOnView /></h2>
            <p className="mt-0 mb-[28px] max-w-[840px]">Dermaplane</p>
            <Image
              className="w-full h-auto rounded-[16px]"
              src="/images/services/glo2facials/1.jfif"
              alt="Glo2Facial add-on treatment"
              width={1000}
              height={650}
            />
          </section>

          <section className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-[40px] max-w-[640px] mb-[32px] max-[640px]:grid-cols-[1fr] max-[640px]:gap-[18px]">
            <div>
              <h2 className="mt-0 mb-[4px] text-[#ebb35a] text-[length:25px] leading-[1.12] font-thin"><TypewriterText text="6 Month Package" startOnView /></h2>
              <p className="m-0 text-[length:18px] leading-[1.1] text-[#4b5663]">6 Glo2Facials, 10% off Skincare Products</p>
            </div>
            <div>
              <h2 className="mt-0 mb-[4px] text-[#ebb35a] text-[length:25px] leading-[1.12] font-thin"><TypewriterText text="12 Month Package" startOnView /></h2>
              <p className="m-0 text-[length:18px] leading-[1.1] text-[#4b5663]">12 Glo2Facials, 10% off Skincare Products</p>
            </div>
          </section>

          <Link className="inline-flex min-w-[214px] justify-center py-[14px] px-[24px] [border-top:1px_solid_var(--gold)] [border-bottom:1px_solid_var(--gold)] text-[#050505] text-[length:18px]" href="https://mailchi.mp/harmonymedspafl.com/vip-club-opt-in" target="_blank" rel="noopener noreferrer">
            Join Our VIP Club!
          </Link>
        </article>

        <aside className="grid [align-content:start] gap-[35px] pt-[16px] [&_.about-side-card]:min-h-[269px] [&_.about-side-card]:rounded-[18px] [&_.about-side-card_span]:text-[length:30px] [&_.about-side-card_small]:text-[length:22px] max-[1050px]:grid-cols-[repeat(2,minmax(240px,390px))] max-[1050px]:justify-center max-[720px]:grid-cols-[1fr] max-[720px]:gap-[22px] max-[720px]:[&_.about-side-card]:min-h-[220px]" aria-label="Glo2Facials links">
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
