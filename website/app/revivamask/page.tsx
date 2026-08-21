import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

const uses = ["Micro-needling (with RF)", "Derma rolling", "Derma peel", "Laser treatments"];

export default function RevivaMaskPage() {
  return (
    <main className="revivamask-page min-h-[100vh] bg-[#fff] text-[#000]">
      <SiteHeader className="team-header" servicesHref="/#services" contactHref="/#contact" />

      <section className="service-detail-hero grid [place-items:center] min-h-[320px] [background:linear-gradient(rgba(0,0,0,0.64),rgba(0,0,0,0.64)),radial-gradient(circle_at_28%_32%,rgba(255,255,255,0.08),transparent_22%),radial-gradient(circle_at_72%_46%,rgba(255,255,255,0.07),transparent_26%),repeating-linear-gradient(18deg,rgba(255,255,255,0.022)_0_2px,transparent_2px_8px),linear-gradient(135deg,#292929,#111_54%,#262626)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:text-[length:clamp(42px,4vw,58px)] [&_h1]:leading-[1.05] [&_h1]:font-thin max-[720px]:min-h-[230px] max-[720px]:px-[20px] max-[720px]:text-center">
        <h1>revivamask<sup className="text-[0.42em] align-super">TM</sup></h1>
      </section>

      <section className="grid grid-cols-[minmax(0,820px)_390px] gap-[78px] w-[min(100%_-_48px,1280px)] my-0 mx-auto pt-[92px] pb-[126px] px-0 max-[1050px]:grid-cols-[minmax(0,820px)] max-[1050px]:justify-center max-[1050px]:gap-[48px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:pt-[58px] max-[720px]:pb-[86px]">
        <article className="min-w-0 text-[length:20px] leading-[1.45] font-normal max-[720px]:text-[length:17px]">
          <div className="mb-[30px]">
            <Image
              className="h-auto w-[min(800px,100%)]"
              src="/images/services/revivamask/logo.png"
              alt="RevivaMask logo"
              width={1100}
              height={280}
              priority
            />
          </div>

          <h2 className="mt-0 mb-[22px] text-[#ebb35a] text-[length:29px] leading-[1.1] font-thin max-[720px]:text-[length:25px]"><TypewriterText text="Advanced Rejuvenation For Optimal Skincare Results" startOnView /></h2>
          <p className="mt-0 mb-[36px] max-w-[840px]">
            RevivaMask<sup>TM</sup> introduces an innovative approach to skin rejuvenation, combining highly concentrated exosomes and
            UCT-MSC (umbilical cord tissue - mesenchymal stem cell) extracellular matrix to revitalize and repair the skin. At Harmony Med
            Spa in Sarasota, FL, we&apos;re proud to offer this cutting-edge treatment to enhance your skincare routine.
          </p>

          <Image
            className="w-[min(800px,100%)] h-auto rounded-[14px] mb-[58px]"
            src="/images/services/revivamask/product.jfif"
            alt="RevivaMask extracellular solution product jar"
            width={1100}
            height={750}
          />

          <section className="mb-[48px]">
            <h2 className="mt-0 mb-[24px] text-[#ebb35a] text-[length:27px] leading-[1.12] font-thin max-[720px]:text-[length:24px]">
              Understanding RevivaMask<sup>TM</sup>:
            </h2>
            <p className="mt-0 mb-[28px] max-w-[840px]">
              RevivaMask<sup>TM</sup> is a unique blend of regenerative factors carefully selected to promote skin rejuvenation, repair,
              collagen production, and improved skin elasticity. This powerful formula plays a critical role in enhancing the overall health
              of the dermis, resulting in visibly improved skin texture and appearance.
            </p>
            <p className="mt-0 mb-[28px] max-w-[840px]">
              Our exclusive compressed mask sheet ensures maximum absorption of the extracellular matrix solution, providing even and complete
              coverage for treated skin. With a combination of UCT-MSC derived growth factors, cytokines, proteins, extracellular vesicles
              including exosomes, and interleukins, RevivaMask<sup>TM</sup> delivers unparalleled results for skin rejuvenation.
            </p>
            <p className="m-0 max-w-[840px]">
              The cooling sensation of RevivaMask<sup>TM</sup> offers a soothing and calming effect, particularly beneficial for
              post-procedure skin that may be sensitive or uncomfortable. Whether used after micro-needling, derma peels, laser treatments,
              or other aesthetic procedures, RevivaMask<sup>TM</sup> enhances treatment effectiveness and accelerates recovery.
            </p>
          </section>

          <section>
            <h2 className="mt-0 mb-[24px] text-[#ebb35a] text-[length:27px] leading-[1.12] font-thin max-[720px]:text-[length:24px]">
              Many Uses Of RevivaMask<sup>TM</sup>:
            </h2>
            <p className="mt-0 mb-[8px] max-w-[840px]">
              RevivaMask<sup>TM</sup> is a versatile addition to any skincare regimen, suitable for various treatment options including:
            </p>
            <ul className="mt-0 mb-[34px] pl-[30px]">
              {uses.map((use) => (
                <li key={use}>{use}</li>
              ))}
            </ul>
            <p className="m-0 max-w-[840px]">
              Contact Harmony Med Spa today to learn more about RevivaMask<sup>TM</sup> and how it can elevate your skincare routine.
              Experience the transformative power of advanced rejuvenation and achieve optimal skincare results with RevivaMask<sup>TM</sup>
              at Harmony Med Spa in Sarasota, FL.
            </p>
          </section>
        </article>

        <aside className="grid [align-content:start] gap-[35px] pt-[16px] [&_.about-side-card]:min-h-[269px] [&_.about-side-card]:rounded-[18px] [&_.about-side-card_span]:text-[length:30px] [&_.about-side-card_small]:text-[length:22px] max-[1050px]:grid-cols-[repeat(2,minmax(240px,390px))] max-[1050px]:justify-center max-[720px]:grid-cols-[1fr] max-[720px]:gap-[22px] max-[720px]:[&_.about-side-card]:min-h-[220px]" aria-label="RevivaMask links">
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
