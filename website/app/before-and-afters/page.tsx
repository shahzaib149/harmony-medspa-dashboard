import Image from "next/image";
import Link from "next/link";
import { beforeAfterGalleries } from "@/lib/data/beforeAfterGalleries";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

export default function BeforeAndAftersPage() {
  return (
    <main className="before-after-page min-h-[100vh] bg-[#fff] text-[#000]">
      <SiteHeader className="contact-page-header" />

      <section className="before-after-hero grid [place-items:center] min-h-[306px] [background:linear-gradient(rgba(0,0,0,0.66),rgba(0,0,0,0.66)),radial-gradient(circle_at_22%_38%,rgba(255,255,255,0.09),transparent_15%),radial-gradient(circle_at_58%_30%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_78%_70%,rgba(255,255,255,0.06),transparent_18%),repeating-linear-gradient(26deg,rgba(255,255,255,0.035)_0_2px,transparent_2px_9px),linear-gradient(135deg,#262626,#101010_52%,#242424)] [&_h1]:m-0 [&_h1]:text-[#d49d19] [&_h1]:text-[length:clamp(42px,3.2vw,54px)] [&_h1]:leading-[1] [&_h1]:font-thin max-[720px]:min-h-[210px]">
        <h1><TypewriterText text="gallery" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="before-after-content pt-[91px] pb-[124px] px-[24px] max-[720px]:pt-[54px] max-[720px]:pb-[70px] max-[720px]:px-[16px]" aria-labelledby="before-after-title">
        <div className="before-after-scroll w-[min(1248px,100%)] my-0 mx-auto pt-[88px] pb-[92px] px-0 [&_h2]:w-[fit-content] [&_h2]:mt-0 [&_h2]:mb-[49px] [&_h2]:mx-auto [&_h2]:[border-bottom:1px_solid_#1b1b1b] [&_h2]:text-[#152131] [&_h2]:text-[length:24px] [&_h2]:leading-[1.2] [&_h2]:font-extrabold max-[1050px]:pt-[54px] max-[1050px]:pb-[76px] max-[1050px]:px-0 max-[720px]:p-0 max-[720px]:[&_h2]:mb-[36px] max-[720px]:[&_h2]:text-center max-[720px]:[&_h2]:text-[length:21px]">
          <h2 id="before-after-title">BEFORE &amp; AFTER GALLERY</h2>
          <div className="before-after-grid grid grid-cols-[repeat(2,minmax(320px,560px))] justify-center gap-y-[50px] gap-x-[32px] max-[1050px]:grid-cols-[minmax(280px,560px)] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[34px]">
            {beforeAfterGalleries.map((item) => (
              <article className="before-after-card grid gap-[14px] [&_img]:block [&_img]:w-full [&_img]:aspect-[560_/_265] [&_img]:h-auto [&_img]:object-cover [&_img]:shadow-[0_8px_18px_rgba(0,0,0,0.12)] [&_h3]:m-0 [&_h3]:text-[length:16px] [&_h3]:leading-[1.2] [&_h3]:font-normal max-[720px]:gap-[11px]" key={item.title}>
                <Link href={`/before-and-afters/${item.slug}`} aria-label={`Open ${item.title} before and after preview gallery`}>
                  <Image src={item.coverImage} alt={item.title} width={560} height={265} />
                </Link>
                <h3>{item.title}</h3>
              </article>
            ))}
          </div>
          <div className="before-after-logo flex justify-center mt-[54px] mb-0 mx-0 [&_img]:block [&_img]:w-[190px] [&_img]:h-auto max-[720px]:mt-[40px] max-[720px]:[&_img]:w-[160px]">
            <Image src="/images/before-and-afters/rxphoto-logo.png" alt="RxPhoto by PatientNow" width={190} height={82} />
          </div>
        </div>
      </section>

      <SiteFooter variant="before-after-footer" />
    </main>
  );
}
