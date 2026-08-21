import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Phone } from "lucide-react";
import ContactForm from "@/components/forms/ContactForm";
import LandingTestimonials from "./LandingTestimonials";
import SiteFooter from "@/components/layout/SiteFooter";
import { ONLINE_BOOKING_URL, PHONE_DISPLAY, PHONE_TEL } from "@/lib/constants";
import image5 from "@/public/images/landing/5.jpg";
import image6 from "@/public/images/landing/6.jpg";

const landingImages = "/images/landing";

const GoldButton = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const external = href.startsWith("http");

  if (external) {
    return (
      <a className="landing-gold-button" href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return <Link className="landing-gold-button" href={href}>{children}</Link>;
};

export default function LandingV1() {
  return (
    <main id="main-content" className="landing-v1-page">
      <section className="landing-hero" id="home">
        <div className="landing-hero-top">
          <Link className="landing-logo" href="#home" aria-label="Harmony Med Spa home">
            <img src="/images/logo-transparent.png" alt="Harmony Med Spa" />
          </Link>
          <div className="landing-hero-actions">
            <a className="landing-phone" href={`tel:${PHONE_TEL}`} aria-label={`Call ${PHONE_DISPLAY}`}>
              <Phone className="landing-action-icon" size={22} fill="currentColor" aria-hidden="true" />
              <span>{PHONE_DISPLAY}</span>
            </a>
            <a className="landing-gold-button" href={ONLINE_BOOKING_URL} target="_blank" rel="noopener noreferrer" aria-label="Book an appointment">
              <CalendarDays className="landing-action-icon" size={22} aria-hidden="true" />
              <span>book an appointment</span>
            </a>
          </div>
        </div>

        <div className="landing-hero-grid">
          <div className="landing-hero-copy">
            <h1>
              <span>Advanced Skin and</span>
              <span>Wellness</span>
              <span>Treatments You Can</span>
              <span>Trust</span>
            </h1>
            <p className="landing-consultation-line">Book a Free Consultation Call Today</p>
            <p className="landing-eyebrow">Aesthetic and wellness care in Sarasota, FL</p>
            <p className="landing-hero-description">
              Harmony MedSpa provides personalized, non-surgical aesthetic and wellness services designed to support skin health,
              hormonal balance, metabolic health, and overall well-being. Our medical team uses advanced technology and evidence-based
              care to help patients achieve noticeable, natural-looking results while prioritizing safety, education, and long-term outcomes.
            </p>
          </div>
          <div className="landing-contact-card" id="contact">
            <h2>contact us</h2>
            <p>For non-urgent questions or to learn more<br />about our services, contact us today!</p>
            <ContactForm variant="landing" />
          </div>
        </div>
      </section>

      <section className="landing-about" id="about">
        <div className="landing-section-shell landing-about-grid">
          <div className="landing-image-frame landing-about-image">
            <Image src={image5} alt="Woman with hands touching face, healthy glowing skin" fill sizes="(max-width: 800px) 100vw, 48vw" />
          </div>
          <div className="landing-about-copy">
            <h2>why choose<br />harmony medspa</h2>
            <p className="landing-kicker">Experienced providers focused on<br />long-term health and natural results</p>
            <p>
              Harmony MedSpa takes a medically guided, individualized approach to both wellness and aesthetic care. Patients receive clear
              education, realistic expectations, and treatment plans tailored to their goals. Our focus is on safety, transparency, and
              sustainable results rather than aggressive procedures or sales-driven recommendations.
            </p>
            <div className="landing-button-row">
              <GoldButton href="/about-us">about harmony medspa</GoldButton>
              <GoldButton href="/our-team">meet the team</GoldButton>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-wellness" id="wellness">
        <div className="landing-section-shell">
          <header className="landing-section-heading landing-section-heading-dark">
            <h2>wellness services</h2>
            <p className="landing-kicker">Medically supervised care focused on energy, balance, and metabolic health</p>
            <p>Our wellness services are designed to position Harmony MedSpa as a trusted resource for patients seeking<br className="landing-desktop-break" /> medically guided solutions that support how they feel and function.</p>
          </header>

          <article className="landing-wellness-feature landing-hormone-feature">
            <div className="landing-wellness-copy">
              <h3>bioidentical hormone<br />replacement therapy<br />and nutraceuticals</h3>
              <p>
                Personalized hormone optimization programs using bioidentical hormones, including Evexipel pellet therapy, along with
                supportive nutraceuticals. Treatment plans are guided by medical evaluation and ongoing follow-up to address symptoms related
                to hormone imbalance such as fatigue, weight changes, and mood concerns.
              </p>
            </div>
            <div className="landing-image-frame landing-wellness-image">
              <Image src={image6} alt="Smiling mature couple embracing" fill sizes="(max-width: 800px) 100vw, 50vw" />
            </div>
          </article>

          <article className="landing-wellness-feature landing-weight-feature">
            <div className="landing-image-frame landing-wellness-image">
              <Image src={`${landingImages}/4.jpg`} alt="Woman representing healthy medical weight loss" fill sizes="(max-width: 800px) 100vw, 50vw" />
            </div>
            <div className="landing-wellness-copy">
              <h3>medical weight loss</h3>
              <p>
                Physician-supervised weight loss programs focused on metabolic health, sustainable lifestyle changes, and realistic
                expectations. Patients receive ongoing medical monitoring, education, and individualized plans designed to support long-term success.
              </p>
            </div>
          </article>

          <div className="landing-wellness-cta">
            <GoldButton href={ONLINE_BOOKING_URL}>Schedule a wellness consultation</GoldButton>
          </div>
        </div>
      </section>

      <section className="landing-aesthetics" id="aesthetics">
        <div className="landing-section-shell">
          <header className="landing-section-heading landing-section-heading-light">
            <h2>aesthetic skin and facial treatments</h2>
            <p className="landing-kicker">Non-invasive options focused on skin quality, texture, and safety</p>
            <p>Our aesthetic services emphasize natural-looking results, patient education, and evidence-based treatment selection.</p>
          </header>

          <article className="landing-treatment-row landing-treatment-copy-first">
            <div className="landing-treatment-copy">
              <h3>injectables and<br />biostimulators</h3>
              <ul>
                <li><strong>Dermal Fillers</strong> - RHA, Restylane, and other fillers we carry are used to restore volume, soften lines, and enhance facial balance with subtle, refreshed results. Treatment areas and product selection are guided by facial anatomy and patient goals.</li>
                <li><strong>Daxxify Neuromodulator</strong> - Long-lasting neuromodulator treatments for forehead lines, frown lines, and crow&apos;s feet. Daxxify is positioned for patients seeking extended treatment duration with natural facial movement.</li>
                <li><strong>Sculptra Biostimulator</strong> - Collagen-stimulating injectable designed to gradually improve skin firmness and structure over time. Ideal for patients seeking progressive, natural-looking improvement with proper education and planning.</li>
              </ul>
            </div>
            <div className="landing-image-frame landing-treatment-image landing-treatment-image-tall">
              <Image src={`${landingImages}/injectables.jpg`} alt="Aesthetic lip injection treatment" fill sizes="(max-width: 800px) 100vw, 50vw" />
            </div>
          </article>

          <article className="landing-treatment-row">
            <div className="landing-image-frame landing-treatment-image">
              <Image src={`${landingImages}/microneedling.jpg`} alt="Radiofrequency microneedling treatment" fill sizes="(max-width: 800px) 100vw, 50vw" />
            </div>
            <div className="landing-treatment-copy">
              <h3>energy-based and<br />regenerative<br />treatments</h3>
              <ul>
                <li><strong>RF Microneedling</strong> - Targets skin texture, fine lines, and acne scars while supporting collagen production. This regenerative approach is commonly used for overall skin quality improvement.</li>
                <li><strong>Fractional CO2 Laser</strong> - Laser resurfacing treatment for sun damage, uneven tone, and texture concerns. Education focuses on realistic outcomes, recovery expectations, and minimal downtime when appropriate.</li>
              </ul>
            </div>
          </article>

          <article className="landing-treatment-row landing-treatment-copy-first">
            <div className="landing-treatment-copy">
              <h3>facials and skin<br />maintenance</h3>
              <ul>
                <li><strong>Glo2Facial and Signature Facial</strong> - Customized facials designed to cleanse, exfoliate, and refresh the skin. Available add-ons include microdermabrasion, dermaplaning, and hydrofacial-style exfoliation.</li>
                <li><strong>Medical-Grade Skincare</strong> - We incorporate medical-grade skincare into both in-office treatments and home care recommendations. Brands include EltaMD, Skinbetter Science, and Revision Skincare, with guidance for pre- and post-procedure care.</li>
              </ul>
            </div>
            <div className="landing-image-frame landing-treatment-image">
              <Image src={`${landingImages}/7.jpg`} alt="Customized facial treatment" fill sizes="(max-width: 800px) 100vw, 50vw" />
            </div>
          </article>

          <div className="landing-services-cta">
            <GoldButton href="/services">our services</GoldButton>
          </div>
        </div>
      </section>

      <LandingTestimonials />

      <section className="landing-ready" id="get-started">
        <div className="landing-ready-image">
          <Image
            src={`${landingImages}/8.jpg`}
            alt="Woman with healthy, glowing skin"
            fill
            sizes="100vw"
          />
        </div>
        <div className="landing-ready-copy">
          <h2>ready to get started?</h2>
          <p className="landing-kicker">Schedule a consultation or learn more</p>
          <p>
            Whether you are researching treatment options or ready to begin care, our team is available to answer questions and help you
            determine the best next step. Schedule a consultation to discuss your goals and explore appropriate treatment options.
          </p>
          <GoldButton href={ONLINE_BOOKING_URL}>book now</GoldButton>
        </div>
      </section>

      <SiteFooter address="plain" social="membership" />
    </main>
  );
}
