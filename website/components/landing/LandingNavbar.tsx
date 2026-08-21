"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Phone } from "lucide-react";
import { ONLINE_BOOKING_URL, PHONE_DISPLAY, PHONE_TEL } from "@/lib/constants";

export default function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 28) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    // Check on initial load
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`landing-navbar ${isScrolled ? "is-scrolled" : ""}`}>
      <div className="landing-navbar-inner">
        <Link className="landing-logo" href="#home" aria-label="Harmony Med Spa home">
          <img src="/images/logo-transparent.png" alt="Harmony Med Spa" />
        </Link>

        <div className="landing-hero-actions">
          <a
            className="landing-phone-link"
            href={`tel:${PHONE_TEL}`}
            aria-label={`Call ${PHONE_DISPLAY}`}
          >
            <Phone className="landing-phone-icon" size={17} aria-hidden="true" />
            <span className="landing-phone-text">{PHONE_TEL}</span>
          </a>
          <a
            className="landing-nav-cta"
            href={ONLINE_BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Request an Appointment"
          >
            <CalendarDays className="landing-calendar-icon" size={18} aria-hidden="true" />
            <span className="landing-nav-cta-text">Request an Appointment</span>
          </a>
        </div>
      </div>
    </header>
  );
}
