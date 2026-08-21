import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

export default function SculptraPage() {
  return (
    <main className="sculptra-page min-h-[100vh] bg-[#fff] text-[#050505]">
      <SiteHeader className="team-header" servicesHref="/#services" contactHref="/#contact" />

      <section className="service-detail-hero grid [place-items:center] min-h-[320px] [background:linear-gradient(rgba(0,0,0,0.62),rgba(0,0,0,0.62)),radial-gradient(circle_at_28%_32%,rgba(255,255,255,0.08),transparent_22%),radial-gradient(circle_at_72%_46%,rgba(255,255,255,0.07),transparent_26%),repeating-linear-gradient(18deg,rgba(255,255,255,0.022)_0_2px,transparent_2px_8px),linear-gradient(135deg,#292929,#111_54%,#262626)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:text-[length:clamp(44px,4vw,60px)] [&_h1]:leading-[1.05] [&_h1]:font-thin max-[720px]:min-h-[230px] max-[720px]:px-[20px] max-[720px]:text-center">
        <h1><TypewriterText text="sculptra" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="grid grid-cols-[minmax(0,820px)_390px] gap-[78px] w-[min(100%_-_48px,1280px)] my-0 mx-auto pt-[92px] pb-[126px] px-0 max-[1050px]:grid-cols-[minmax(0,820px)] max-[1050px]:justify-center max-[1050px]:gap-[48px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:pt-[58px] max-[720px]:pb-[86px]">
        <article className="min-w-0 text-[length:20px] leading-[1.45] font-normal max-[720px]:text-[length:17px]">
          <div className="mb-[46px]">
            <Image
              className="w-[min(520px,100%)] h-auto"
              src="/images/services/sculptra/logo.png"
              alt="Sculptra"
              width={495}
              height={216}
              priority
            />
          </div>

          <div className="grid grid-cols-[300px_minmax(0,1fr)] gap-[30px] items-start mb-[34px] max-[720px]:grid-cols-[1fr]">
            <Image
              className="w-full h-auto rounded-[10px]"
              src="/images/services/sculptra/img.png"
              alt="Sculptra aesthetic injectable product"
              width={512}
              height={388}
            />
            <section>
              <h2 className="mt-0 mb-[20px] text-[#ebb35a] text-[length:29px] leading-[1.12] font-thin max-[720px]:text-[length:25px]"><TypewriterText text="Sculptra Treatment At Harmony Med Spa In Sarasota, FL" startOnView /></h2>
              <p className="mt-0 mb-0 max-w-[520px]">
                At Harmony Med Spa in Sarasota, FL, we&apos;re thrilled to introduce you to our revolutionary Injectable Sculptra treatment, designed to enhance your natural beauty and combat the signs of aging.
              </p>
            </section>
          </div>

          <Image
            className="float-left w-[300px] h-auto rounded-[10px] mr-[30px] mb-[24px] max-[720px]:float-none max-[720px]:w-full max-[720px]:mr-0"
            src="/images/services/sculptra/sculptra.jpg"
            alt="Sculptra facial injectable treatment"
            width={600}
            height={600}
          />

          <section className="mb-[48px]">
            <h2 className="mt-0 mb-[20px] text-[#ebb35a] text-[length:29px] leading-[1.12] font-thin max-[720px]:text-[length:25px]"><TypewriterText text="SCULPTRA AESTHETIC:" startOnView /></h2>
            <p className="mt-0 mb-[28px]">
              Sculptra is a remarkable injectable treatment that harnesses the power of your body&apos;s own collagen production to restore volume, smooth wrinkles, and rejuvenate your skin. With Sculptra, you can achieve long-lasting results and enjoy a more youthful and radiant appearance.
            </p>
            <p className="mt-0 mb-[28px]">
              Sculptra Aesthetic works subtly and gradually over time within the deep dermis layer of the skin, correcting shallow to deep facial wrinkles and folds such as smile lines for a more youthful-looking appearance. Unlike traditional hyaluronic acid (HA) fillers, which work immediately upon injection to fill in lines, wrinkles, and folds, Sculptra Aesthetic is made from Poly-L-lactic acid (PLLA), which helps stimulate your skin&apos;s own natural collagen production over time, helping to reinforce the skin&apos;s inner structure and increase facial volume that has been lost to aging. Poly-L-lactic acid (PLLA) is a biodegradable substance that has been proven safe and has been used in medical products, including dissolvable sutures, for more than 30 years.
            </p>
            <p className="mt-0 mb-[28px]">
              The typical treatment regimen for Sculptra Aesthetic consists of three injections over three to four months. Results appear gradually over a period of a few months and are long-lasting, more than two years. In contrast, HA fillers last until the HA is absorbed by the body and excreted, typically 6 to 12 months after injection.
            </p>
          </section>

          <section className="mb-[54px] clear-both">
            <h2 className="mt-0 mb-[20px] text-[#ebb35a] text-[length:29px] leading-[1.12] font-thin max-[720px]:text-[length:25px]"><TypewriterText text="Unlock The Benefits:" startOnView /></h2>
            <ul className="mt-0 mb-0 pl-[30px]">
              <li><strong>Boosts Natural Collagen:</strong> Sculptra stimulates collagen production deep within the skin, gradually restoring volume and improving texture.</li>
              <li><strong>Combat Facial Aging:</strong> Bid farewell to signs of aging and embrace a fresher, more youthful appearance with Sculptra.</li>
              <li><strong>Targeted Treatment Areas:</strong> Sculptra is effective for addressing multiple concerns, including:</li>
              <li className="ml-[30px]"><strong>Cheeks:</strong> Restore volume and contour to achieve a lifted and rejuvenated look.</li>
              <li className="ml-[30px]"><strong>Smile Lines:</strong> Smooth away lines and wrinkles around the mouth for a more youthful smile.</li>
              <li className="ml-[30px]"><strong>Fine Lines and Wrinkles:</strong> Reduce the appearance of fine lines and wrinkles, revealing smoother, firmer skin.</li>
              <li className="ml-[30px]"><strong>Sagging Skin:</strong> Lift and tighten sagging skin, restoring a youthful and rejuvenated appearance.</li>
            </ul>
          </section>

          <section>
            <h2 className="mt-0 mb-[20px] text-[#ebb35a] text-[length:29px] leading-[1.12] font-thin max-[720px]:text-[length:25px]"><TypewriterText text="Take The First Step Towards Radiant Skin:" startOnView /></h2>
            <p className="mt-0 mb-0 max-w-[820px]">
              Ready to experience the transformative effects of Injectable Sculptra? Schedule your consultation with our expert team at Harmony Med Spa today. Begin your journey towards glowing, youthful skin and rediscover your confidence. Contact us now to book your appointment. Your path to radiant skin starts here at Harmony Med Spa.
            </p>
          </section>
        </article>

        <aside className="grid [align-content:start] gap-[35px] pt-[16px] [&_.about-side-card]:min-h-[269px] [&_.about-side-card]:rounded-[18px] [&_.about-side-card_span]:text-[length:30px] [&_.about-side-card_small]:text-[length:22px] max-[1050px]:grid-cols-[repeat(2,minmax(240px,390px))] max-[1050px]:justify-center max-[720px]:grid-cols-[1fr] max-[720px]:gap-[22px] max-[720px]:[&_.about-side-card]:min-h-[220px]" aria-label="Sculptra links">
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
