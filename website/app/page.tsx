import ContactForm from "@/components/forms/ContactForm";
import HeroCarousel from "@/components/home/HeroCarousel";
import ServicesGrid from "@/components/home/ServicesGrid";
import ProvidersSection from "@/components/home/ProvidersSection";
import TestimonialCarousel from "@/components/home/TestimonialCarousel";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import InteractiveLocationMap from "@/components/ui/InteractiveLocationMap";
import TypewriterText from "@/components/ui/TypewriterText";

const monthlySpecialsUrl = "https://mailchi.mp/harmonymedspafl/monthly-specials";
const newsletterOptInUrl = "https://mailchi.mp/harmonymedspafl/newsletter-opt-in";

export default function Home() {
  return (
    <main>
      <SiteHeader className="site-header" homeHref="#home" />

      <HeroCarousel />

      <section id="about" className="intro section-dark bg-[var(--black)] text-[#fff] pt-[150px] pb-[180px] px-0 [&_h2]:text-[length:clamp(48px,4.6vw,70px)] [&_h2]:leading-[1.03] [&_h2_span]:block [&_h2_span]:text-[var(--gold)]">
        <div className="section-inner narrow w-[min(1060px,calc(100%_-_42px))] my-0 mx-auto text-center">
          <h2>
            harmony med spa is a
            <span>full-service medical spa</span>
            in sarasota, florida.
          </h2>
          <p>
            Board-certified nurse practitioner Jessica Simone, APRN, and her team take a natural approach to beauty that provides men and women
            of all ages the most effective and innovative aesthetic treatments available in a relaxed and welcoming setting.
          </p>
          <a className="line-button inline-flex justify-center min-w-[116px] py-[13px] px-[18px] [border-top:1px_solid_var(--gold)] [border-bottom:1px_solid_var(--gold)] text-[inherit] text-[length:16px] font-normal bg-[transparent] [border-left:0] [border-right:0] cursor-pointer" href={monthlySpecialsUrl}>Specials</a>
        </div>
      </section>

      <section id="services" className="services section-light bg-[var(--paper)] text-[var(--ink)]">
        <div className="section-inner w-[min(1060px,calc(100%_-_42px))] my-0 mx-auto text-center">
          <h2><TypewriterText text="our services" startOnView /></h2>
          <ServicesGrid />
        </div>
      </section>

      <section className="experience section-dark bg-[var(--black)] text-[#fff]">
        <div className="section-inner narrow w-[min(1060px,calc(100%_-_42px))] my-0 mx-auto text-center">
          <h2><TypewriterText text="the harmony experience" startOnView /></h2>
          <p>
            At Harmony Med Spa, our mission is to elevate the well-being and confidence of every patient through personalized,
            natural-looking aesthetic and wellness care in a warm, welcoming environment, guided by advanced, evidence-based treatments
            and a holistic, integrative approach.
          </p>
        </div>
      </section>

      <ProvidersSection />

      <section id="specials" className="newsletter section-dark bg-[var(--black)] text-[#fff]">
        <div className="section-inner narrow w-[min(1060px,calc(100%_-_42px))] my-0 mx-auto text-center">
          <h2><TypewriterText text="stay in the know" startOnView /></h2>
          <p>Opt into our newsletter and be the first to know about upcoming specials, exclusive events, and more.</p>
          <a className="line-button inline-flex justify-center min-w-[116px] py-[13px] px-[18px] [border-top:1px_solid_var(--gold)] [border-bottom:1px_solid_var(--gold)] text-[inherit] text-[length:16px] font-normal bg-[transparent] [border-left:0] [border-right:0] cursor-pointer" href={newsletterOptInUrl} target="_blank" rel="noopener noreferrer">Learn More</a>
        </div>
      </section>

      <TestimonialCarousel />

      <section id="contact" className="contact">
        <InteractiveLocationMap variant="home" />
        <ContactForm variant="home" />
      </section>

      <SiteFooter address="linked-name" copyright="symbol" />
    </main>
  );
}
