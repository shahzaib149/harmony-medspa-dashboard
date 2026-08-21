"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const services = [
  { file: "services_1.jpg", title: "lasers +\nlights", href: "/lasers-and-lights" },
  { file: "services_2.jpg", title: "injectables", href: "/injectables" },
  { file: "services_3.jpg", title: "facials +\npeels", href: "/facials-and-peels" },
  { file: "services_4.jpg", title: "body", href: "/body" },
  { file: "services_5.jpg", title: "skincare", href: "/skincare" },
  { file: "services_6.jpg", title: "wellness", href: "/wellness" }
];

export default function ServicesGrid() {
  const gridRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const grid = gridRef.current;

    if (!grid) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.28,
        rootMargin: "0px 0px -8% 0px"
      }
    );

    observer.observe(grid);

    return () => observer.disconnect();
  }, []);

  return (
    <div className={`service-grid grid grid-cols-[repeat(3,300px)] justify-center gap-y-[64px] gap-x-[64px] [perspective:1200px] max-[1050px]:grid-cols-[repeat(2,300px)] max-[720px]:grid-cols-[repeat(2,minmax(0,1fr))] max-[720px]:gap-[10px] max-[720px]:w-full ${isVisible ? "is-visible" : ""}`} ref={gridRef}>
      {services.map((service, index) => (
        <a className="service-card [&_img]:object-cover relative w-[300px] aspect-[1] text-[#fff] [transform:rotateY(180deg)] [transform-style:preserve-3d] [transition:transform_900ms_cubic-bezier(0.2,0.78,0.22,1)] [transition-delay:var(--flip-delay,0ms)] [will-change:transform] max-[720px]:w-full max-[720px]:[&:nth-child(3)]:col-[1_/_-1] max-[720px]:[&:nth-child(3)]:aspect-[1.78] max-[720px]:[&:nth-child(4)]:col-[1_/_-1] max-[720px]:[&:nth-child(4)]:aspect-[1.78]" href={service.href} key={service.file} style={{ "--flip-delay": `${index * 95}ms` } as React.CSSProperties}>
          <span className="service-card-face service-card-back absolute inset-0 grid [place-items:center] overflow-hidden [backface-visibility:hidden] [border:1px_solid_rgba(201,155,19,0.75)] [background:linear-gradient(135deg,rgba(201,155,19,0.22),transparent_48%),#101010] [transform:rotateY(180deg)] before:content-[''] before:w-[46px] before:h-[46px] before:[border:1px_solid_var(--gold)] before:rounded-full" aria-hidden="true" />
          <span className="service-card-face service-card-front absolute inset-0 grid [place-items:center] overflow-hidden [backface-visibility:hidden] after:content-[''] after:absolute after:inset-0 after:[background:rgba(0,0,0,0.18)]">
            <Image src={`/images/services/${service.file}`} alt="" fill sizes="(max-width: 768px) 82vw, 300px" />
            <span className="service-title relative z-[1] whitespace-pre-line text-[length:42px] leading-[0.96] font-thin [transition:font-size_220ms_ease,transform_220ms_ease] max-[720px]:text-[length:18px] max-[720px]:leading-[1.05]">{service.title}</span>
          </span>
        </a>
      ))}
    </div>
  );
}
