import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

const services = [
  {
    title: "RF Microneedling",
    image: "/images/services/catalog/rf-microneedling.jpg",
    href: "/rf-microneedling"
  },
  {
    title: "Laser Hair Removal",
    image: "/images/services/catalog/laser-hair-removal.jpg",
    href: "/laser-hair-removal"
  },
  {
    title: "Daxxify",
    image: "/images/services/catalog/daxxify.jpg",
    href: "/daxxify"
  },
  {
    title: "Sculptra",
    image: "/images/services/catalog/sculptra.jpg",
    href: "/sculptra"
  },
  {
    title: "Dermal Fillers",
    image: "/images/services/catalog/dermal-fillers.jpg",
    href: "/dermal-fillers"
  },
  {
    title: "Glo2Facials",
    image: "/images/services/catalog/glo2facials.jpg",
    href: "/glo2facials"
  },
  {
    title: "Chemical Peels",
    image: "/images/services/catalog/chemical-peels.jpg",
    href: "/chemical-peels"
  },
  {
    title: "Hormone Replacement Therapy",
    image: "/images/services/catalog/hormone-replacement-therapy.jpg",
    href: "/hormone-replacement-therapy"
  },
  {
    title: "Skincare Products",
    image: "/images/services/catalog/skincare-products.jpg",
    href: "/skincare-products"
  },
  {
    title: "Facials",
    image: "/images/services/catalog/facials.jpg",
    href: "/facials"
  },
  {
    title: "Fractional CO2 Laser Treatments",
    image: "/images/services/catalog/fractional-co2-laser-treatments.jpg",
    href: "/fractional-co2-laser-treatments"
  },
  {
    title: "RevivaMask(TM)",
    image: "/images/services/catalog/revivamask.jpg",
    href: "/revivamask"
  },
  {
    title: "Medical Weight Loss",
    image: "/images/services/catalog/medical-weight-loss.jpg",
    href: "/medical-weight-loss"
  },
  {
    title: "Hair Restoration",
    image: "/images/services/catalog/hair-restoration.jpg",
    href: "/hair-restoration"
  },
  {
    title: "IV Therapy",
    image: "/images/services/catalog/iv-therapy.jpg",
    href: "/iv-therapy"
  },
  {
    title: "Peptide Therapy",
    image: "/images/services/catalog/peptide-therapy.jpg",
    href: "/peptide-therapy"
  }
];

export default function ServicesPage() {
  return (
    <main className="service-detail-page min-h-[100vh] bg-[#fff]">
      <SiteHeader className="team-header" contactHref="/#contact" />

      <section className="service-detail-hero grid [place-items:center] min-h-[270px] [background:linear-gradient(rgba(0,0,0,0.58),rgba(0,0,0,0.58)),radial-gradient(circle_at_18%_22%,rgba(255,255,255,0.08),transparent_20%),radial-gradient(circle_at_72%_42%,rgba(255,255,255,0.07),transparent_24%),linear-gradient(135deg,#2a2a2a,#111_52%,#242424)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:text-[length:clamp(42px,3.4vw,56px)] [&_h1]:leading-[1] [&_h1]:font-thin">
        <h1><TypewriterText text="services" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="service-detail-content services-catalog-content min-h-[560px] pt-[94px] px-[24px] pb-[128px] max-[720px]:pt-[72px] max-[720px]:pb-[92px] max-[720px]:px-[20px]">
        <div className="service-detail-intro w-[min(1040px,100%)] my-0 mx-auto text-center [&_h2]:mt-0 [&_h2]:mb-[22px] [&_h2]:mx-0 [&_h2]:text-[#ebb35a] [&_h2]:text-[length:25px] [&_h2]:leading-[1.2] [&_h2]:font-thin [&_p]:max-w-[1030px] [&_p]:my-0 [&_p]:mx-auto [&_p]:text-[#3f4650] [&_p]:text-[length:16px] [&_p]:leading-[1.85] [&_p]:font-normal">
          <h2>Aesthetic &amp; Wellness Services In Sarasota</h2>
          <p>
            We pride ourselves on offering a wide range of rejuvenating and revitalizing treatments tailored to meet your unique needs. Our
            team of experienced professionals is dedicated to providing you with the highest quality of care in a relaxing and luxurious
            environment.
          </p>
        </div>

        <div className="treatment-card-grid services-catalog-grid grid-cols-[repeat(2,244px)] justify-center gap-[16px] flex flex-wrap max-w-[1024px] gap-y-[30px] gap-x-[16px] mt-[50px] mb-0 mx-auto max-[720px]:grid-cols-[minmax(244px,320px)] max-[720px]:gap-[22px]">
          {services.map((service) => (
            <Link className="treatment-card relative grid [place-items:end_center] w-[244px] h-[244px] overflow-hidden rounded-[14px] text-[var(--gold)] text-center shadow-[0_18px_42px_rgba(0,0,0,0.16)] [&_img]:object-cover [&_img]:[transition:transform_420ms_ease] after:content-[''] after:absolute after:inset-0 after:[background:linear-gradient(transparent_42%,rgba(0,0,0,0.76))] [&_span]:relative [&_span]:z-[1] [&_span]:max-w-[90%] [&_span]:pt-0 [&_span]:pb-[22px] [&_span]:px-[10px] [&_span]:text-[length:22px] [&_span]:leading-[1.05] [&_span]:font-thin max-[720px]:w-full" href={service.href} key={service.title}>
              <Image src={service.image} alt="" fill sizes="(max-width: 720px) 82vw, 244px" />
              <span>{service.title}</span>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter address="linked-name" copyright="plain" />
    </main>
  );
}
