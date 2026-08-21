import Image from "next/image";
import { ArrowRight } from "lucide-react";
import ContactForm from "@/components/forms/ContactForm";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingServicesCarousel from "@/components/home/LandingServicesCarousel";
import LandingTestimonials from "@/components/home/LandingTestimonials";
import SiteFooter from "@/components/layout/SiteFooter";

const landingImages = "/images/landing";

export default function LandingPage() {
  return (
    <main id="main-content" className="landing-page">
      <LandingNavbar />

      <section className="landing-hero" id="home">
        <div className="landing-hero-grid">
          <div className="landing-hero-copy">
            <h1>
              advanced skin treatments you can trust
            </h1>
            <p className="landing-consultation-line">Book a Free Consultation Call Today</p>
            <p className="landing-eyebrow">LASER, THERMAL, AND MICRONEEDLING OPTIONS IN SARASOTA, FL</p>
            <p className="landing-hero-description">
              Harmony MedSpa offers personalized, non-surgical treatments to improve skin tone, texture, and elasticity.
              Our team uses advanced technology and evidence-based methods to help you achieve noticeable results without
              unnecessary downtime or aggressive procedures.
            </p>
          </div>

          <div className="landing-contact-card" id="contact">
            <h2>contact us</h2>
            <p>For non-urgent questions or to learn more about our services, contact us today!</p>
            <ContactForm variant="landing" />
          </div>
        </div>
      </section>

      <section className="landing-about" id="about">
        <div className="landing-section-shell landing-about-grid">
          <div className="landing-image-frame landing-about-image">
            <Image src={`${landingImages}/2.jpg`} alt="Woman touching healthy skin" fill sizes="(max-width: 800px) 100vw, 52vw" />
          </div>
          <div className="landing-about-copy">
            <h2>Why Choose Harmony Med Spa</h2>
            <p className="landing-kicker">Experienced providers focused on your skin&apos;s long-term health</p>
            <p>
              Our approach is centered around informed, individualized care. You&apos;ll receive straightforward guidance
              from trained professionals who take the time to understand your goals. We prioritize safety, clarity, and
              results, not sales tactics.
            </p>
          </div>
        </div>
      </section>

      <section className="landing-promoted" aria-labelledby="landing-promoted-title">
        <div className="landing-section-shell">
          <header className="landing-centered-heading">
            <h2 id="landing-promoted-title">Promoted Specific Service Here</h2>
            <p className="landing-kicker">Subheading Here</p>
          </header>
          <div className="landing-promoted-image">
            <Image src={`${landingImages}/3.jpg`} alt="Skin treatment consultation" fill sizes="(max-width: 900px) 100vw, 90vw" />
          </div>
        </div>
      </section>

      <section className="landing-services" id="services" aria-labelledby="landing-services-title">
        <div className="landing-services-angle" aria-hidden="true" />
        <div className="landing-section-shell">
          <header className="landing-services-heading">
            <h2 id="landing-services-title">List of Services Offered</h2>
            <p className="landing-kicker">At Harmony Med Spa</p>
          </header>
          <LandingServicesCarousel />
        </div>
      </section>

      <LandingTestimonials />

      <section className="landing-ready" id="get-started">
        <Image src={`${landingImages}/4.png`} alt="" fill sizes="100vw" />
        <div className="landing-ready-copy">
          <h2>Interested In Our Services?</h2>
          <a href="#contact" className="landing-ready-link">
            Contact Us Today
            <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
      </section>

      <SiteFooter address="plain" social="membership" />
    </main>
  );
}
