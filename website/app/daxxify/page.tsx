import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

const studyPoints = [
  "There were no serious treatment-related side effects in clinical trials for DAXXIFY(TM).",
  "The active ingredient in DAXXIFY(TM) is botulinum toxin type A, an ingredient used in frown line treatments for more than 20 years.",
  "96% of people treated with DAXXIFY(TM) were satisfied with their results."
];

export default function DaxxifyPage() {
  return (
    <main className="daxxify-page min-h-[100vh] bg-[#fff] text-[#4b5663]">
      <SiteHeader className="team-header" servicesHref="/#services" contactHref="/#contact" />

      <section className="service-detail-hero grid [place-items:center] min-h-[320px] [background:linear-gradient(rgba(0,0,0,0.62),rgba(0,0,0,0.62)),radial-gradient(circle_at_28%_32%,rgba(255,255,255,0.08),transparent_22%),radial-gradient(circle_at_72%_46%,rgba(255,255,255,0.07),transparent_26%),repeating-linear-gradient(18deg,rgba(255,255,255,0.022)_0_2px,transparent_2px_8px),linear-gradient(135deg,#292929,#111_54%,#262626)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:text-[length:clamp(44px,4vw,60px)] [&_h1]:leading-[1.05] [&_h1]:font-thin max-[720px]:min-h-[230px] max-[720px]:px-[20px] max-[720px]:text-center">
        <h1><TypewriterText text="daxxify" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="grid grid-cols-[minmax(0,820px)_390px] gap-[78px] w-[min(100%_-_48px,1280px)] my-0 mx-auto pt-[92px] pb-[126px] px-0 max-[1050px]:grid-cols-[minmax(0,820px)] max-[1050px]:justify-center max-[1050px]:gap-[48px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:pt-[58px] max-[720px]:pb-[86px]">
        <article className="min-w-0 text-[length:20px] leading-[1.45] font-normal max-[720px]:text-[length:17px]">
          <Image
            className="w-full h-auto rounded-[16px] mb-[70px]"
            src="/images/services/daxxify/daxxify-img.jfif"
            alt="Daxxify treatment at Harmony Med Spa"
            width={1000}
            height={653}
            priority
          />

          <div className="pt-[54px] mb-[46px] [border-top:1px_solid_#d9d9d9]">
            <Image
              className="w-[min(760px,100%)] h-auto"
              src="/images/services/daxxify/logo.png"
              alt="Daxxify daxinotulinumtoxinA-lanm injection"
              width={1046}
              height={340}
            />
          </div>

          <p className="mt-0 mb-[62px] max-w-[820px]">
            We&apos;re pleased to introduce DAXXIFY(TM)-the only long-lasting, peptide-powered frown line treatment. We&apos;re one of the first exclusive providers to offer this innovative treatment. Call our office today to book your appointment and visit <a className="text-[var(--gold)]" href="https://www.daxxify.com" target="_blank" rel="noopener noreferrer">DAXXIFY.com</a> to learn more.
          </p>

          <section className="mb-[48px]">
            <h2 className="mt-0 mb-[24px] text-[#ebb35a] text-[length:29px] leading-[1.12] font-thin max-[720px]:text-[length:25px]"><TypewriterText text="What Is DAXXIFY(TM) And How Is It Different?" startOnView /></h2>
            <p className="mt-0 mb-[28px] max-w-[840px]">
              DAXXIFY(TM) is FDA approved to help smooth moderate to severe lines between the brows. It is a long-lasting frown line treatment powered by a peptide, with results that last on average 6 months and up to 9 months for some patients.
            </p>
            <p className="mt-0 mb-[28px] max-w-[840px]">
              Conventional injectables typically last 3 to 4 months and can require up to 4 treatments a year to maintain results. With DAXXIFY(TM), some patients can keep frown lines smoother for a full year with as few as 2 treatments.
            </p>
            <Image
              className="w-full h-auto rounded-[8px] mt-[34px]"
              src="/images/services/daxxify/changes.jfif"
              alt="Daxxify before and after clinical result examples"
              width={1364}
              height={508}
            />
            <p className="mt-[34px] mb-0 max-w-[840px]">
              At least 50% of patients in clinical studies had no or minor frown lines 6 months after treatment.
            </p>
          </section>

          <section className="mb-[48px]">
            <h2 className="mt-0 mb-[24px] text-[#ebb35a] text-[length:29px] leading-[1.12] font-thin max-[720px]:text-[length:25px]"><TypewriterText text="Why Are Peptides Important?" startOnView /></h2>
            <p className="mt-0 mb-[28px] max-w-[840px]">
              All frown line treatments require a special ingredient to stabilize botulinum toxin A, the protein responsible for helping smooth moderate to severe frown lines.
            </p>
            <p className="m-0 max-w-[840px]">
              DAXXIFY(TM) is unique because it uses a novel peptide as a stabilizer and does not contain human or animal byproducts.
            </p>
          </section>

          <section className="mb-[58px]">
            <h2 className="mt-0 mb-[24px] text-[#ebb35a] text-[length:29px] leading-[1.12] font-thin max-[720px]:text-[length:25px]"><TypewriterText text="Is DAXXIFY(TM) Well Studied?" startOnView /></h2>
            <p className="mt-0 mb-[12px] max-w-[840px]">
              DAXXIFY(TM) was studied in a large clinical program for frown line treatment and included more than 2,400 people across different ages and skin types.
            </p>
            <ul className="mt-0 mb-[28px] pl-[30px]">
              {studyPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <p className="m-0 max-w-[840px]">
              96% of patients reported they were satisfied on a 7-point scale when evaluated at 4 weeks in clinical studies.
            </p>
          </section>

          <section className="[&>p]:max-w-[840px] [&>p]:mt-0 [&>p]:mb-[28px]">
            <h2 className="mt-0 mb-[24px] text-[#ebb35a] text-[length:29px] leading-[1.12] font-thin max-[720px]:text-[length:25px]"><TypewriterText text="Important Safety Information For DAXXIFY(TM)" startOnView /></h2>
            <p>
              <strong>DAXXIFY(TM) may cause serious side effects that can be life threatening.</strong> Get medical help right away if you have problems swallowing, speaking, or breathing, or symptoms of spread of toxin effects after injection.
            </p>
            <p>
              <strong>Do not receive DAXXIFY(TM)</strong> if you are allergic to any of its ingredients, had an allergic reaction to any other botulinum toxin product, or have a skin infection at the planned injection site.
            </p>
            <p>
              DAXXIFY(TM) dosing units are not the same as, or comparable to, any other botulinum toxin product. Tell your healthcare provider about all medical conditions and all medicines you take.
            </p>
            <p>
              These are not all possible side effects. For more information, talk with your provider. You may report side effects to the FDA at 1-800-FDA-1088 or visit <a className="text-[var(--gold)]" href="https://www.fda.gov/medwatch" target="_blank" rel="noopener noreferrer">www.fda.gov/medwatch</a>.
            </p>
            <h3 className="mt-[46px] mb-[12px] text-[#4b5663] text-[length:20px] leading-[1.25] font-bold">Approved Use</h3>
            <p>
              DAXXIFY(TM) is a prescription medicine injected into muscles and used in adults to temporarily improve the look of moderate to severe frown lines between the eyebrows.
            </p>
          </section>
        </article>

        <aside className="grid [align-content:start] gap-[35px] pt-[16px] [&_.about-side-card]:min-h-[269px] [&_.about-side-card]:rounded-[18px] [&_.about-side-card_span]:text-[length:30px] [&_.about-side-card_small]:text-[length:22px] max-[1050px]:grid-cols-[repeat(2,minmax(240px,390px))] max-[1050px]:justify-center max-[720px]:grid-cols-[1fr] max-[720px]:gap-[22px] max-[720px]:[&_.about-side-card]:min-h-[220px]" aria-label="Daxxify links">
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
