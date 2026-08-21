import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

export default function EventsPage() {
  return (
    <main className="events-page min-h-[100vh] bg-[#fff] text-[#000]">
      <SiteHeader className="contact-page-header" />

      <section className="events-hero grid [place-items:center] min-h-[341px] [background:linear-gradient(rgba(0,0,0,0.62),rgba(0,0,0,0.62)),radial-gradient(circle_at_22%_38%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_70%_42%,rgba(255,255,255,0.06),transparent_24%),repeating-linear-gradient(29deg,rgba(255,255,255,0.025)_0_2px,transparent_2px_9px),linear-gradient(135deg,#252525,#101010_52%,#242424)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:text-[length:clamp(44px,3.5vw,58px)] [&_h1]:leading-[1] [&_h1]:font-thin max-[720px]:min-h-[230px]">
        <h1><TypewriterText text="events" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="events-content grid grid-cols-[minmax(0,820px)_390px] gap-[90px] w-[min(100%_-_48px,1300px)] my-0 mx-auto pt-[108px] pb-[142px] px-0 max-[1050px]:grid-cols-[minmax(0,680px)] max-[1050px]:justify-center max-[1050px]:gap-[46px] max-[1050px]:pt-[76px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:pt-[56px] max-[720px]:pb-[76px] max-[720px]:px-0">
        <article className="events-main min-w-[0] text-[#4f5966] text-[length:19px] leading-[1.74] [&_p]:mt-0 [&_p]:mb-[33px] [&_p]:mx-0 max-[720px]:text-[length:16px] max-[720px]:leading-[1.65]" aria-labelledby="events-title">
          <h2 id="events-title" className="sr-only"><TypewriterText text="Harmony Med Spa events" startOnView /></h2>
          <p>
            Harmony Med Spa is a full-service medical spa in Sarasota, Florida. Board-certified nurse practitioner Jessica Simone,
            AGNP-C, and her team take a natural approach to beauty that provides men and women of all ages the most effective and
            innovative aesthetic treatments available in a relaxed and welcoming setting.
          </p>
          <p>
            Therapies available at Harmony Med Spa include laser treatments, dermal fillers, neuromodulators (such as Botox and
            Daxxify), customized facials, and medically supervised weight loss programs. Injectable product lines available include RHA
            fillers, Daxxify, and Sculptra.
          </p>
          <p>
            Jessica and her team also provide regenerative medicine treatments such as Intense Pulse Light (IPL), Fractional CO2 Laser
            Resurfacing (FCO2), and RF microneedling that repair and rejuvenate skin at the cellular level.
          </p>
          <p>
            As part of its commitment to overall health and well-being, Harmony Med Spa offers bioidentical hormone replacement therapy.
            Jessica is a certified Evexipel provider and works closely with her patients to design a customized plan that yields
            exceptional results.
          </p>
          <p>
            Clients appreciate the team&apos;s professional attitude and commitment to ensuring that treatment goals and expectations are
            fully understood before any procedure is undertaken.
          </p>
          <p>Schedule a visit at Harmony Med Spa by calling the office or requesting an appointment online today!</p>

          <div className="events-actions flex justify-center gap-[clamp(42px,9vw,148px)] mt-[40px] max-[720px]:flex-wrap max-[720px]:gap-y-[22px] max-[720px]:gap-x-[48px] max-[720px]:justify-start" aria-label="Event links">
            <a className="line-button events-link inline-flex justify-center py-[13px] px-[18px] [border-top:1px_solid_var(--gold)] [border-bottom:1px_solid_var(--gold)] font-normal bg-[transparent] [border-left:0] [border-right:0] cursor-pointer min-w-[154px] text-[#000] text-[length:20px] max-[720px]:text-[length:18px]" href="https://www.eventbrite.com/o/harmony-med-spa-48146441313" target="_blank" rel="noreferrer">
              Eventbrite
            </a>
            <a className="line-button events-link inline-flex justify-center py-[13px] px-[18px] [border-top:1px_solid_var(--gold)] [border-bottom:1px_solid_var(--gold)] font-normal bg-[transparent] [border-left:0] [border-right:0] cursor-pointer min-w-[154px] text-[#000] text-[length:20px] max-[720px]:text-[length:18px]" href="https://www.facebook.com/harmonymedspaLLC/events" target="_blank" rel="noreferrer">
              Facebook Events
            </a>
          </div>
        </article>

        <aside className="events-sidebar grid [align-content:start] gap-[20px] [&_.about-search]:h-[70px] [&_.about-search]:mb-[15px] [&_.about-side-card]:min-h-[269px] [&_.about-side-card]:rounded-[18px] [&_.about-side-card_span]:text-[length:30px] [&_.about-side-card_small]:text-[length:22px] max-[1050px]:grid-cols-[repeat(2,minmax(240px,390px))] max-[1050px]:justify-center max-[1050px]:[&_.about-search]:col-[1_/_-1] max-[720px]:grid-cols-[1fr] max-[720px]:[&_.about-side-card]:min-h-[220px]" aria-label="Events page links">
          <label className="about-search flex items-center h-[56px] mb-[12px] py-0 pr-[20px] pl-[24px] [border:1px_solid_#c8d2dd] rounded-[8px] text-[var(--gold)] bg-[#fff] [&_input]:min-w-[0] [&_input]:flex-1 [&_input]:border-0 [&_input]:[outline:0] [&_input]:text-[#344356] [&_input]:bg-[transparent] [&_input]:[font:inherit] [&_input::placeholder]:text-[#425263] [&_input::placeholder]:opacity-[0.9] max-[1050px]:col-[1_/_-1]">
            <span className="sr-only">Search keyword</span>
            <input type="search" placeholder="Enter search keyword" />
            <Search size={18} />
          </label>

          <Link className="about-side-card relative grid [place-items:center] min-h-[184px] overflow-hidden rounded-[10px] text-[#fff] text-center isolate before:content-[''] before:absolute before:inset-0 before:z-[-1] before:[background:rgba(0,0,0,0.34)] [&_img]:z-[-2] [&_img]:object-cover [&_img]:[transition:transform_420ms_ease] [&_span]:text-[length:25px] [&_span]:leading-[1.1] [&_span]:font-normal [&_small]:inline-flex [&_small]:min-w-[146px] [&_small]:justify-center [&_small]:mt-[10px] [&_small]:py-[12px] [&_small]:px-[18px] [&_small]:[border-top:1px_solid_var(--gold)] [&_small]:[border-bottom:1px_solid_var(--gold)] [&_small]:text-[length:16px]" href="/services" target="_blank" rel="noopener noreferrer" >
            <Image src="/images/about-us/img_1.png" alt="" fill sizes="390px" />
            <span>
              All
              <br />
              Services
            </span>
            <small>Learn More</small>
          </Link>

          <Link className="about-side-card relative grid [place-items:center] min-h-[184px] overflow-hidden rounded-[10px] text-[#fff] text-center isolate before:content-[''] before:absolute before:inset-0 before:z-[-1] before:[background:rgba(0,0,0,0.34)] [&_img]:z-[-2] [&_img]:object-cover [&_img]:[transition:transform_420ms_ease] [&_span]:text-[length:25px] [&_span]:leading-[1.1] [&_span]:font-normal [&_small]:inline-flex [&_small]:min-w-[146px] [&_small]:justify-center [&_small]:mt-[10px] [&_small]:py-[12px] [&_small]:px-[18px] [&_small]:[border-top:1px_solid_var(--gold)] [&_small]:[border-bottom:1px_solid_var(--gold)] [&_small]:text-[length:16px]" href="/contact-us" target="_blank" rel="noopener noreferrer">
            <Image src="/images/about-us/Img_2.png" alt="" fill sizes="390px" />
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
