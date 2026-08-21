import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import { ONLINE_BOOKING_URL } from "@/lib/constants";
import faqData from "@/Images/Services/Peptide/peptide_therapy_faqs.json";
import PeptideFaqAccordion from "./PeptideFaqAccordion";

const benefits = [
  "Support for recovery and tissue repair",
  "Support for energy, vitality, and performance",
  "Support for body composition and metabolic wellness",
  "Support for healthy aging goals",
  "A personalized wellness plan based on your goals and provider recommendations"
];

const peptideMenu = ["AOD 9604", "BPC-157", "CJC-1295/Ipamorelin", "GHK-Cu", "PT-141", "Sermorelin", "Thymosin Alpha-1"];

export default function PeptideTherapyPage() {
  return (
    <main className="peptide-therapy-page min-h-[100vh] bg-[#fff] text-[#4f5b68]">
      <SiteHeader className="team-header" servicesHref="/#services" contactHref="/#contact" />

      <section className="service-detail-hero grid [place-items:center] min-h-[320px] [background:linear-gradient(rgba(0,0,0,0.64),rgba(0,0,0,0.64)),radial-gradient(circle_at_28%_32%,rgba(255,255,255,0.08),transparent_22%),radial-gradient(circle_at_72%_46%,rgba(255,255,255,0.07),transparent_26%),repeating-linear-gradient(18deg,rgba(255,255,255,0.022)_0_2px,transparent_2px_8px),linear-gradient(135deg,#292929,#111_54%,#262626)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:text-[length:clamp(40px,4vw,58px)] [&_h1]:leading-[1.05] [&_h1]:font-thin max-[720px]:min-h-[230px] max-[720px]:px-[20px] max-[720px]:text-center">
        <h1>peptide therapy in sarasota, fl</h1>
      </section>

      <section className="grid grid-cols-[minmax(0,820px)_390px] gap-[78px] w-[min(100%_-_48px,1280px)] my-0 mx-auto pt-[92px] pb-[126px] px-0 max-[1050px]:grid-cols-[minmax(0,820px)] max-[1050px]:justify-center max-[1050px]:gap-[48px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:pt-[58px] max-[720px]:pb-[86px]">
        <article className="min-w-0 text-[length:20px] leading-[1.75] font-normal max-[720px]:text-[length:17px]">
          <section className="mb-[42px]">
            <h2 className="mt-0 mb-[22px] text-[#ebb35a] text-[length:29px] leading-[1.1] font-thin max-[720px]:text-[length:25px]">
              Personalized Wellness Support At Harmony Med Spa
            </h2>
            <p className="mt-0 mb-[34px] max-w-[840px]">
              At Harmony Med Spa, peptide therapy is designed for patients who want a more personalized approach to optimizing how they feel,
              function, and recover.
            </p>
            <p className="mt-0 mb-[34px] max-w-[840px]">
              Peptides are short chains of amino acids that act as signaling molecules in the body and may be used in medically guided
              wellness plans that support recovery, metabolic health, body composition, energy, and healthy aging goals.
            </p>
            <p className="m-0 max-w-[840px]">
              Our team creates individualized peptide therapy plans based on your health history, symptoms, and wellness priorities. Whether
              your goals include support for recovery, appetite control, vitality, performance, or overall optimization, peptide therapy can
              be part of a broader strategy tailored to your needs.
            </p>
          </section>

          <Image
            className="w-[min(808px,100%)] h-auto rounded-[14px] mb-[46px]"
            src="/images/services/peptide-therapy/1.jpg"
            alt="Harmony Med Spa peptides offered"
            width={818}
            height={460}
            priority
          />

          <section className="mb-[52px]">
            <h2 className="mt-0 mb-[20px] text-[#ebb35a] text-[length:29px] leading-[1.1] font-thin max-[720px]:text-[length:25px]">
              Why Patients Choose Peptide Therapy
            </h2>
            <p className="mt-0 mb-[4px] max-w-[840px]">
              Patients explore peptide therapy for a variety of wellness goals because it offers a targeted, personalized option within a
              medically supervised plan.
            </p>
            <p className="mt-0 mb-[4px] max-w-[840px]">Benefits of peptide therapy may include:</p>
            <ul className="mt-0 mb-[42px] pl-[30px]">
              {benefits.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>

            <h2 className="mt-0 mb-[20px] text-[#ebb35a] text-[length:29px] leading-[1.1] font-thin max-[720px]:text-[length:25px]">Peptide Therapy Menu</h2>
            <ul className="mt-0 mb-[34px] pl-[30px]">
              {peptideMenu.map((peptide) => (
                <li key={peptide}>{peptide}</li>
              ))}
            </ul>
          </section>

          <Image
            className="w-[min(808px,100%)] h-auto rounded-[14px] mb-[46px]"
            src="/images/services/peptide-therapy/2.jpg"
            alt="Peptide therapy wellness consultation"
            width={818}
            height={412}
          />

          <section className="mb-[44px]">
            <h2 className="mt-0 mb-[20px] text-[#ebb35a] text-[length:29px] leading-[1.1] font-thin max-[720px]:text-[length:25px]">Who May Be A Candidate</h2>
            <p className="mt-0 mb-[34px] max-w-[840px]">
              Peptide therapy may be a fit for adults who are looking for support with recovery, energy, healthy aging, weight management, or
              body composition as part of a personalized wellness plan.
            </p>
            <p className="m-0 max-w-[840px]">
              The best way to know whether peptide therapy is right for you is to schedule a consultation so your provider can review your
              goals, medical history, and current health needs.
            </p>
          </section>

          <section className="mb-[74px]">
            <PeptideFaqAccordion categories={faqData.faq_categories} />
          </section>

          <section>
            <h2 className="mt-0 mb-[54px] text-[#ebb35a] text-[length:29px] leading-[1.1] font-thin max-[720px]:text-[length:25px]">Call To Action</h2>
            <p className="mt-0 mb-[34px] max-w-[840px]">Ready to learn whether peptide therapy is right for you?</p>
            <p className="mt-0 mb-[34px] max-w-[840px]">
              Contact Harmony Med Spa in Sarasota to schedule your consultation and build a personalized wellness plan with our team.
            </p>
            <p className="mt-0 mb-[68px] max-w-[840px]">Call (941) 923-8990 to book your appointment.</p>
            <div className="text-center">
              <a
                className="inline-flex min-w-[146px] justify-center py-[14px] px-[24px] [border-top:1px_solid_var(--gold)] [border-bottom:1px_solid_var(--gold)] text-[#000] text-[length:18px]"
                href={ONLINE_BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Book Now
              </a>
            </div>
          </section>
        </article>

        <aside className="grid [align-content:start] gap-[35px] pt-[16px] [&_.about-side-card]:min-h-[269px] [&_.about-side-card]:rounded-[18px] [&_.about-side-card_span]:text-[length:30px] [&_.about-side-card_small]:text-[length:22px] max-[1050px]:grid-cols-[repeat(2,minmax(240px,390px))] max-[1050px]:justify-center max-[720px]:grid-cols-[1fr] max-[720px]:gap-[22px] max-[720px]:[&_.about-side-card]:min-h-[220px]" aria-label="Peptide therapy links">
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
