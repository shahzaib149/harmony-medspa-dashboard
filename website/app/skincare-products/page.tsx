import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

const productLines = [
  {
    title: "Dermalogica",
    subtitle: "Revitalize Your Skin with Professional-Grade Products",
    text: "Discover Dermalogica's extensive range of skincare essentials, including cleansers, moisturizers, exfoliants, and treatments. Formulated with high-quality ingredients, Dermalogica products promote skin health and address a variety of skin concerns. Experience visible results and rejuvenate your complexion with Dermalogica."
  },
  {
    title: "Skinbetter Science",
    subtitle: "Advanced Skincare Solutions for Transformative Results",
    text: "Skinbetter Science offers scientifically advanced skincare solutions designed to target specific skin concerns. From aging and hyperpigmentation to acne, their products utilize innovative ingredients and technologies to deliver transformative results. Achieve healthier, more radiant skin with Skinbetter Science."
  },
  {
    title: "Elta MD",
    subtitle: "Protect Your Skin with Trusted Sunscreen Formulas",
    text: "Elta MD is your go-to brand for superior sun protection. Their range of broad-spectrum sunscreens offers lightweight, non-comedogenic formulas suitable for all skin types. With Elta MD, you can shield your skin from harmful UV rays and maintain a healthy complexion every day."
  },
  {
    title: "Revision Skincare",
    subtitle: "Disruptive Innovation, True Visible Results",
    text: "Revision Skincare offers clinically-proven, advanced skincare products designed to enhance and rejuvenate your skin. Using cutting-edge ingredients and revolutionary formulations, Revision Skincare targets a variety of skin concerns, from aging and discoloration to hydration and protection. Experience true, visible results and a healthier, more youthful complexion with Revision Skincare."
  }
];

export default function SkincareProductsPage() {
  return (
    <main className="skincare-products-page min-h-[100vh] bg-[#fff] text-[#000]">
      <SiteHeader className="team-header" servicesHref="/#services" contactHref="/#contact" />

      <section className="service-detail-hero grid [place-items:center] min-h-[320px] [background:linear-gradient(rgba(0,0,0,0.64),rgba(0,0,0,0.64)),radial-gradient(circle_at_28%_32%,rgba(255,255,255,0.08),transparent_22%),radial-gradient(circle_at_72%_46%,rgba(255,255,255,0.07),transparent_26%),repeating-linear-gradient(18deg,rgba(255,255,255,0.022)_0_2px,transparent_2px_8px),linear-gradient(135deg,#292929,#111_54%,#262626)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:text-[length:clamp(42px,4vw,58px)] [&_h1]:leading-[1.05] [&_h1]:font-thin max-[720px]:min-h-[230px] max-[720px]:px-[20px] max-[720px]:text-center">
        <h1><TypewriterText text="skincare products" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="grid grid-cols-[minmax(0,820px)_390px] gap-[78px] w-[min(100%_-_48px,1280px)] my-0 mx-auto pt-[92px] pb-[126px] px-0 max-[1050px]:grid-cols-[minmax(0,820px)] max-[1050px]:justify-center max-[1050px]:gap-[48px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:pt-[58px] max-[720px]:pb-[86px]">
        <article className="min-w-0 text-[length:20px] leading-[1.45] font-normal max-[720px]:text-[length:17px]">
          <section className="grid grid-cols-[300px_minmax(0,1fr)] gap-[30px] items-start mb-[48px] max-[760px]:grid-cols-[1fr]">
            <Image
              className="h-auto w-full rounded-[16px]"
              src="/images/services/skincare/skincareproducts_thumbnail_1.jpg"
              alt="Skincare products at Harmony Med Spa"
              width={700}
              height={520}
              priority
            />
            <div>
              <h2 className="mt-[18px] mb-[22px] text-[#ebb35a] text-[length:29px] leading-[1.1] font-thin max-[720px]:mt-0 max-[720px]:text-[length:25px]">
                Discover Your Skin&apos;s Perfect Match
              </h2>
              <p className="m-0">
                Our products at Harmony Med Spa are designed to nourish and rejuvenate your skin, with distinctive lines to suit different
                skin types and preferences.
              </p>
            </div>
          </section>

          {productLines.map((line) => (
            <section className="mb-[48px]" key={line.title}>
              <h2 className="mt-0 mb-[18px] text-[#ebb35a] text-[length:27px] leading-[1.12] font-thin max-[720px]:text-[length:24px]">{line.title}</h2>
              <p className="mt-0 mb-[14px] max-w-[840px] italic">{line.subtitle}</p>
              <p className="m-0 max-w-[840px]">{line.text}</p>
            </section>
          ))}

          <section className="mb-[28px]">
            <p className="mt-0 mb-[28px] max-w-[840px]">For inquiries or appointments, contact Harmony Med Spa at (941) 923-8990.</p>
            <Link className="mx-auto inline-flex min-w-[104px] justify-center py-[14px] px-[24px] [border-top:1px_solid_var(--gold)] [border-bottom:1px_solid_var(--gold)] text-[#050505] text-[length:18px]" href="/shop">
              Shop
            </Link>
          </section>
        </article>

        <aside className="grid [align-content:start] gap-[35px] pt-[16px] [&_.about-side-card]:min-h-[269px] [&_.about-side-card]:rounded-[18px] [&_.about-side-card_span]:text-[length:30px] [&_.about-side-card_small]:text-[length:22px] max-[1050px]:grid-cols-[repeat(2,minmax(240px,390px))] max-[1050px]:justify-center max-[720px]:grid-cols-[1fr] max-[720px]:gap-[22px] max-[720px]:[&_.about-side-card]:min-h-[220px]" aria-label="Skincare products links">
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
