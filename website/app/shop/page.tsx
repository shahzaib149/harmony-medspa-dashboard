import Image from "next/image";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

const shopItems = [
  {
    title: "Skinbetter Science",
    image: "/images/shop/shop_skinbetter.jpg",
    href: "https://www.skinbetter.com/?businessPartner_id=0000249391&replika_param=eyJtZXJjaGlkIjoiZjM2MzI1ZDU3MDAxYWI2ZTI4ZWNjZTMxNTY1MmY3OWQiLCJ1c2VyaWQiOiIyNTAwNCIsImJvYXJkaWQiOiIyMTk0NjEwIiwidHJhY2tpZCI6IjczMTQwMyIsImlzc2hvcHVybCI6InRydWUifQ%3d%3d#PageName=harmonymedspafl"
  },
  {
    title: "Nutraceuticals",
    image: "/images/shop/shop_nutraceuticals.jpg",
    href: "https://onboarding.evexias.com/welcome/0090b3c0-17d6-4c75-919b-77f8958cf1ed/patient"
  },
  {
    title: "Revision Skincare",
    image: "/images/shop/shop_revision_skincare_thumbnail.jpg",
    href: "https://revisionskincare.com/?scpid=184249"
  },
  {
    title: "Calroy Health Sciences",
    image: "/images/shop/shop_calroy.jpg",
    href: "https://lowlipid.calroy.com/"
  }
];

export default function ShopPage() {
  return (
    <main className="shop-page min-h-[100vh] bg-[#fff]">
      <SiteHeader className="team-header" />

      <section className="shop-hero grid [place-items:center] min-h-[272px] [background:linear-gradient(rgba(0,0,0,0.58),rgba(0,0,0,0.58)),radial-gradient(circle_at_18%_22%,rgba(255,255,255,0.08),transparent_20%),radial-gradient(circle_at_72%_42%,rgba(255,255,255,0.07),transparent_24%),linear-gradient(135deg,#2a2a2a,#111_52%,#242424)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:text-[length:clamp(42px,3.4vw,56px)] [&_h1]:leading-[1] [&_h1]:font-thin">
        <h1><TypewriterText text="shop" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="shop-content min-h-[526px] pt-[84px] pb-[126px] px-[24px] text-center [&_p]:my-0 [&_p]:mx-auto [&_p]:text-[#3f4650] [&_p]:text-[length:15px] [&_p]:leading-[1.45] [&_p]:font-normal max-[720px]:pt-[68px] max-[720px]:pb-[92px] max-[720px]:px-[20px]" aria-labelledby="shop-intro">
        <p id="shop-intro">Explore Our Range of Skincare and Supplements - Elevate Your Beauty and Wellness Routine Today!</p>

        <div className="shop-card-grid grid grid-cols-[repeat(auto-fit,244px)] max-w-[1024px] mx-auto justify-center gap-[16px] mt-[52px] max-[720px]:grid-cols-[minmax(244px,320px)] max-[720px]:gap-[22px]">
          {shopItems.map((item) => (
            <a className="shop-card relative grid [place-items:end_center] w-[244px] h-[244px] overflow-hidden rounded-[14px] text-[var(--gold)] text-center shadow-[0_18px_42px_rgba(0,0,0,0.16)] [outline:0] [&_img]:object-cover [&_img]:[transition:transform_420ms_ease] after:content-[''] after:absolute after:inset-0 after:[background:linear-gradient(transparent_42%,rgba(0,0,0,0.76))] [&_span]:relative [&_span]:z-[1] [&_span]:max-w-[92%] [&_span]:pt-0 [&_span]:pb-[24px] [&_span]:px-[10px] [&_span]:text-[length:22px] [&_span]:leading-[1.05] [&_span]:font-thin max-[720px]:w-full" href={item.href} key={item.title} target="_blank" rel="noreferrer">
              <Image src={item.image} alt={item.title} fill sizes="(max-width: 720px) 82vw, 244px" />
              <span>{item.title}</span>
            </a>
          ))}
        </div>
      </section>

      <SiteFooter address="linked-name" copyright="plain" />
    </main>
  );
}
