import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

const treatments = [
  {
    title: "Fractional CO2 Laser Treatments",
    image: "/images/services/lasers-and-lights/laser_new.jpg"
  },
  {
    title: "Laser Hair Removal",
    image: "/images/services/lasers-and-lights/Laser_Hair_Removal.jpg",
    href: "/laser-hair-removal"
  }
];

export default function LasersAndLightsPage() {
  return (
    <main className="service-detail-page min-h-[100vh] bg-[#fff]">
      <SiteHeader className="team-header" servicesHref="/#services" contactHref="/#contact" />

      <section className="service-detail-hero grid [place-items:center] min-h-[270px] [background:linear-gradient(rgba(0,0,0,0.58),rgba(0,0,0,0.58)),radial-gradient(circle_at_18%_22%,rgba(255,255,255,0.08),transparent_20%),radial-gradient(circle_at_72%_42%,rgba(255,255,255,0.07),transparent_24%),linear-gradient(135deg,#2a2a2a,#111_52%,#242424)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:text-[length:clamp(42px,3.4vw,56px)] [&_h1]:leading-[1] [&_h1]:font-thin">
        <h1><TypewriterText text="lasers and lights" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="service-detail-content min-h-[560px] pt-[94px] pb-[136px] px-[24px] max-[720px]:pt-[72px] max-[720px]:pb-[92px] max-[720px]:px-[20px]">
        <div className="service-detail-intro w-[min(1040px,100%)] my-0 mx-auto text-center [&_h2]:mt-0 [&_h2]:mb-[22px] [&_h2]:mx-0 [&_h2]:text-[#ebb35a] [&_h2]:text-[length:25px] [&_h2]:leading-[1.2] [&_h2]:font-thin [&_p]:max-w-[1030px] [&_p]:my-0 [&_p]:mx-auto [&_p]:text-[#3f4650] [&_p]:text-[length:16px] [&_p]:leading-[1.85] [&_p]:font-normal">
          <h2>Smooth, Brighten &amp; Rejuvenate</h2>
          <p>
            Transform your skin with cutting-edge laser and light treatments at Harmony Med Spa. Whether you want to remove unwanted hair,
            improve skin texture, or reduce pigmentation, our advanced technology delivers real results with minimal downtime. Our treatments
            are designed to target a variety of skin concerns, helping you achieve a smoother, more radiant complexion.
          </p>
        </div>

        <div className="treatment-card-grid grid grid-cols-[repeat(auto-fit,244px)] max-w-[504px] mx-auto justify-center gap-[16px] mt-[48px] max-[720px]:grid-cols-[minmax(244px,320px)] max-[720px]:gap-[22px]">
          {treatments.map((treatment) => (
            <Link className="treatment-card relative grid [place-items:end_center] w-[244px] h-[244px] overflow-hidden rounded-[14px] text-[var(--gold)] text-center shadow-[0_18px_42px_rgba(0,0,0,0.16)] [&_img]:object-cover [&_img]:[transition:transform_420ms_ease] after:content-[''] after:absolute after:inset-0 after:[background:linear-gradient(transparent_42%,rgba(0,0,0,0.76))] [&_span]:relative [&_span]:z-[1] [&_span]:max-w-[90%] [&_span]:pt-0 [&_span]:pb-[22px] [&_span]:px-[10px] [&_span]:text-[length:22px] [&_span]:leading-[1.05] [&_span]:font-thin max-[720px]:w-full" href={treatment.href ?? "/#contact"} key={treatment.title}>
              <Image src={treatment.image} alt="" fill sizes="(max-width: 720px) 82vw, 244px" />
              <span>{treatment.title}</span>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter address="linked-name" copyright="plain" />
    </main>
  );
}
