"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const testimonials = [
  "I absolutely love Harmony Med Spa! The staff is friendly, kind, professional and attentive. The ambiance is welcoming and beautiful. Jessica is very knowledgeable and explains everything in detail and honestly. I highly recommend them.",
  "I was so pleased with my visit to Harmony Med Spa. Jessica and Haydon could not be more welcoming and professional. The team listened carefully and helped me focus on the results I wanted to achieve.",
  "Harmony Med Spa is warm, professional, and trustworthy. Every visit feels personal, and the team takes time to explain the options clearly. I could not recommend them more highly."
];

export default function LandingTestimonials() {
  const [activeIndex, setActiveIndex] = useState(0);

  const move = (direction: number) => {
    setActiveIndex((current) => (current + direction + testimonials.length) % testimonials.length);
  };

  return (
    <section className="landing-testimonials" aria-labelledby="v1-landing-testimonial-title">
      <div className="landing-testimonial-heading">
        <h2 id="v1-landing-testimonial-title">what our<br />patients say</h2>
        <p className="landing-kicker">Trusted by patients<br />throughout Sarasota</p>
        <div className="landing-testimonial-controls">
          <button type="button" onClick={() => move(-1)} aria-label="Previous testimonial"><ChevronLeft /></button>
          <button type="button" onClick={() => move(1)} aria-label="Next testimonial"><ChevronRight /></button>
        </div>
      </div>
      <div className="landing-testimonial-quote" aria-live="polite">
        <span className="landing-open-quote" aria-hidden="true">"</span>
        <blockquote>{testimonials[activeIndex]}</blockquote>
        <span className="landing-close-quote" aria-hidden="true">"</span>
        <div className="landing-stars" aria-label="Five star review">★★★★★</div>
      </div>
    </section>
  );
}
