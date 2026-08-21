import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

const browLashMenu = ["Brow Tint", "Brow Lamination", "Lash Tint", "Brow Shaping / Maintenance"];

const facialMenu = [
  {
    title: "The Essential Facial (30mins)",
    text: "A results-oriented treatment that focuses on the essential needs of your skin. You will leave our office feeling refreshed and rejuvenated!"
  },
  {
    title: "The Signature Facial (60mins)",
    text: "This treatment goes beyond the essentials to correct and prevent multiple skin conditions, while allowing time to rest your mind and relax!"
  },
  {
    title: "The Purifying Back Treatment (45mins)",
    text: "When you're with us, we have your back! This treatment combines chemical and mechanical exfoliant with anti-bacterial peptides and anti-inflammatory botanicals to heal breakouts on the back!"
  },
  {
    title: "The Gentlemans Facial (45mins)",
    text: "An aromatic, deep cleansing and hydrating treatment designed specifically to address male skincare needs. Using a highly calibrated mixture of products that cleanse the skin all while clearing out the pores. You will leave refreshed and rejuvenated!"
  },
  {
    title: "The Teen Facial (45mins)",
    text: "This treatment combines powerful antibacterial ingredients with soothing botanicals that fight acne without irritating delicate skin!"
  }
];

const enhancements = ["Add-on to your Facial", "Hydro-Facial", "Dermaplane", "Diamond Micro-Dermabrasion"];

export default function FacialsPage() {
  return (
    <main className="facials-page min-h-[100vh] bg-[#fff] text-[#000]">
      <SiteHeader className="team-header" servicesHref="/#services" contactHref="/#contact" />

      <section className="service-detail-hero grid [place-items:center] min-h-[320px] [background:linear-gradient(rgba(0,0,0,0.64),rgba(0,0,0,0.64)),radial-gradient(circle_at_28%_32%,rgba(255,255,255,0.08),transparent_22%),radial-gradient(circle_at_72%_46%,rgba(255,255,255,0.07),transparent_26%),repeating-linear-gradient(18deg,rgba(255,255,255,0.022)_0_2px,transparent_2px_8px),linear-gradient(135deg,#292929,#111_54%,#262626)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:text-[length:clamp(44px,4vw,60px)] [&_h1]:leading-[1.05] [&_h1]:font-thin max-[720px]:min-h-[230px] max-[720px]:px-[20px] max-[720px]:text-center">
        <h1><TypewriterText text="facials" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="grid grid-cols-[minmax(0,820px)_390px] gap-[78px] w-[min(100%_-_48px,1280px)] my-0 mx-auto pt-[92px] pb-[126px] px-0 max-[1050px]:grid-cols-[minmax(0,820px)] max-[1050px]:justify-center max-[1050px]:gap-[48px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:pt-[58px] max-[720px]:pb-[86px]">
        <article className="min-w-0 text-[length:20px] leading-[1.45] font-normal text-[#4f5b68] max-[720px]:text-[length:17px]">
          <section className="mb-[34px]">
            <h2 className="mt-0 mb-[18px] text-[#ebb35a] text-[length:29px] leading-[1.12] font-thin max-[720px]:text-[length:25px]"><TypewriterText text="Treatment Menu" startOnView /></h2>
            <h3 className="mt-0 mb-[22px] text-[#ebb35a] text-[length:25px] leading-[1.16] font-thin max-[720px]:text-[length:22px]">Browns &amp; Lashes</h3>
            <ul className="m-0 grid gap-[8px] list-none p-0">
              {browLashMenu.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <Image
            className="w-full h-auto rounded-[16px] mb-[30px]"
            src="/images/services/facials/facial-treatment.jpg"
            alt="Facial treatment at Harmony Med Spa"
            width={1000}
            height={650}
            priority
          />

          <section className="mb-[48px]">
            <h2 className="mt-0 mb-[18px] text-[#ebb35a] text-[length:27px] leading-[1.12] font-thin max-[720px]:text-[length:24px]"><TypewriterText text="Facial Menu:" startOnView /></h2>
            {facialMenu.map((item) => (
              <div className="mb-[32px]" key={item.title}>
                <h3 className="mt-0 mb-[6px] text-[#ebb35a] text-[length:25px] leading-[1.16] font-thin max-[720px]:text-[length:22px]">{item.title}</h3>
                <p className="m-0 max-w-[840px]">{item.text}</p>
              </div>
            ))}
          </section>

          <section className="mb-[48px]">
            <h2 className="mt-0 mb-[22px] text-[#ebb35a] text-[length:27px] leading-[1.12] font-thin max-[720px]:text-[length:24px]"><TypewriterText text="Enhancements:" startOnView /></h2>
            <ul className="m-0 grid gap-[8px] list-none p-0">
              {enhancements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <Image
            className="w-full h-auto rounded-[16px] mb-[30px]"
            src="/images/services/facials/facial-menu.jpg"
            alt="Facial peel treatment at Harmony Med Spa"
            width={1000}
            height={650}
          />

          <section>
            <h2 className="mt-0 mb-[24px] text-[#ebb35a] text-[length:27px] leading-[1.12] font-thin max-[720px]:text-[length:24px]"><TypewriterText text="Chemical Peels: The Perfect Derma Peel" startOnView /></h2>
            <p className="mt-0 mb-[8px] max-w-[840px]">
              <strong>The Perfect Derma&trade;</strong> Peel is safe, effective medium depth peel for all skin types &amp; ethnicities.
            </p>
            <p className="mt-0 mb-[48px] max-w-[840px]">
              This product is virtually painless, with no pre-peel skin preparation and little downtime. <strong>The Perfect Derma&trade;</strong>{" "}
              Peel is the only peel that includes the powerful anti-oxidant Glutathione, which lightens and brightens the skin, slows down
              the aging process and helps prevent wrinkles.
            </p>
            <h2 className="mt-0 mb-[18px] text-[#ebb35a] text-[length:27px] leading-[1.12] font-thin max-[720px]:text-[length:24px]"><TypewriterText text="Save More When You Buy A Package Of 3 Or 6 Peels" startOnView /></h2>
            <a className="mx-auto inline-flex min-w-[248px] justify-center py-[14px] px-[24px] [border-top:1px_solid_var(--gold)] [border-bottom:1px_solid_var(--gold)] text-[#050505] text-[length:18px]" href="tel:9419238990">
              Call to Request Pricing
            </a>
          </section>
        </article>

        <aside className="grid [align-content:start] gap-[35px] pt-[16px] [&_.about-side-card]:min-h-[269px] [&_.about-side-card]:rounded-[18px] [&_.about-side-card_span]:text-[length:30px] [&_.about-side-card_small]:text-[length:22px] max-[1050px]:grid-cols-[repeat(2,minmax(240px,390px))] max-[1050px]:justify-center max-[720px]:grid-cols-[1fr] max-[720px]:gap-[22px] max-[720px]:[&_.about-side-card]:min-h-[220px]" aria-label="Facials links">
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
