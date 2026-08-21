"use client";

import { Star } from "lucide-react";
import { useEffect, useState } from "react";

const testimonials = [
  {
    quote:
      "I've been to a few Med Spas in Sarasota, and Jessica is absolutely the best. She truly cares about providing exceptional service and I am thrilled to have finally found a practitioner I can trust.",
    author: "Ariel F."
  },
  {
    quote:
      "I was so pleased with my visit to Harmony Med Spa. Jessica and Haydon could not be more welcoming and professional. I felt an immediate rapport with Jessica. She is very knowledgeable and able to ask probing questions that helped me focus on the results I want to achieve. I highly recommend Harmony Med Spa.",
    author: "Leigh W."
  },
  {
    quote:
      "I absolutely love Harmony Med Spa! The staff is friendly, kind, professional and attentive. The ambiance is welcoming and beautiful. Jessica is very knowledgeable and explains everything in detail and honestly. I highly recommend them.",
    author: "Wanda A."
  }
];

export default function TestimonialCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % testimonials.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="testimonial">
      <div className="quote-mark text-[#e4e4e4] text-[length:150px] leading-[1] [font-family:Georgia,serif] max-[720px]:h-[70px]">&ldquo;</div>
      <div className="quote-content overflow-hidden [&_p]:mt-0 [&_p]:mb-[34px] [&_p]:mx-0 [&_p]:leading-[1.55] [&_p]:font-normal">
        <div
          className="flex [transition:transform_520ms_cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {testimonials.map((testimonial) => (
            <article className="min-w-full pr-[2px]" key={testimonial.author} aria-hidden={testimonial !== testimonials[activeIndex]}>
              <p>{testimonial.quote}</p>
              <div className="stars flex items-center gap-[3px] text-[#e1a71d] [&_span]:ml-[12px] [&_span]:text-[#111] [&_span]:[font-family:'Brush_Script_MT','Segoe_Script',cursive] [&_span]:text-[length:26px] max-[720px]:justify-center" aria-label="Five star review">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} fill="currentColor" size={22} />
                ))}
                <span>by {testimonial.author}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="slider-lines flex gap-[4px] [&_button]:w-[50px] [&_button]:h-[5px] [&_button]:p-0 [&_button]:border-0 [&_button]:bg-[#aaa] [&_button]:cursor-pointer [&_button.is-active]:bg-[#000] max-[720px]:justify-center" aria-label="Testimonial slides">
        {testimonials.map((testimonial, index) => (
          <button
            aria-label={`Show review by ${testimonial.author}`}
            className={index === activeIndex ? "is-active" : undefined}
            key={testimonial.author}
            type="button"
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </div>
    </section>
  );
}
