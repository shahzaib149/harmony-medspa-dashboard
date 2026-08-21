"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import TypewriterText from "@/components/ui/TypewriterText";
import { ONLINE_BOOKING_URL } from "@/lib/constants";

const slides = ["/images/carousel/heroimage_1.jpg", "/images/carousel/heroimage_2.jpg"];

export default function HeroCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section id="home" className="hero relative h-[100svh] min-h-[520px] w-full overflow-hidden bg-[#1d1d1d]" aria-label="Harmony Med Spa image carousel">
      {slides.map((slide, index) => (
        <div className={`hero-slide absolute inset-0 opacity-0 [transform:scale(1.02)] [transition:opacity_1.1s_ease,transform_5.2s_ease] [&_img]:object-cover [&_img]:object-center [&_img]:[filter:grayscale(0.35)_brightness(1.16)_saturate(1.08)] ${index === active ? "is-active" : ""}`} key={slide}>
          <Image src={slide} alt="" fill priority={index === 0} sizes="100vw" />
        </div>
      ))}
      <div className="hero-shade absolute inset-0 [background:rgba(0,0,0,0.26)]" />
      {/* Title sizing is capped by vh as well as vw so it never overruns a short/landscape viewport. */}
      <div className="hero-content absolute z-[2] inset-x-0 bottom-0 grid justify-items-center content-end gap-[clamp(20px,4vh,34px)] w-full px-[24px] pb-[clamp(32px,7vh,60px)] pt-[120px] text-[#fff] text-center [&_h1]:m-0 [&_h1]:[font-family:'Segoe_UI_Light','Helvetica_Neue',Arial,sans-serif] [&_h1]:text-[length:clamp(44px,min(11vw,15vh),176px)] [&_h1]:leading-[0.95] [&_h1]:font-extralight [&_h1]:tracking-[0]">
        <h1>
          <TypewriterText text="harmony med spa" letterDelay={110} caret ignoreReducedMotion />
        </h1>
        <a className="line-button inline-flex justify-center min-w-[142px] py-[14px] px-[22px] [border-top:1px_solid_var(--gold)] [border-bottom:1px_solid_var(--gold)] text-[inherit] text-[length:18px] font-normal bg-[transparent] [border-left:0] [border-right:0] cursor-pointer max-[720px]:min-w-[124px] max-[720px]:text-[length:16px]" href={ONLINE_BOOKING_URL} target="_blank" rel="noopener noreferrer">book now</a>
      </div>
      <div className="hero-dots absolute right-[34px] bottom-[28px] flex gap-[8px] [&_button]:w-[32px] [&_button]:h-[3px] [&_button]:border-0 [&_button]:[background:rgba(255,255,255,0.42)] [&_button]:cursor-pointer [&_.is-active]:bg-[#fff]" aria-label="Carousel slides">
        {slides.map((_, index) => (
          <button
            className={index === active ? "is-active" : ""}
            type="button"
            aria-label={`Show slide ${index + 1}`}
            onClick={() => setActive(index)}
            key={index}
          />
        ))}
      </div>
    </section>
  );
}
