"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { providers } from "@/lib/data/providers";

export default function ProvidersSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) {
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
        threshold: 0.22,
        rootMargin: "0px 0px -10% 0px"
      }
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  return (
    <section className={`providers section-light bg-[var(--paper)] text-[var(--ink)] ${isVisible ? "is-visible" : ""}`} ref={sectionRef}>
      <div className="section-inner w-[min(1060px,calc(100%_-_42px))] my-0 mx-auto text-center">
        <div className="provider-heading-motion opacity-0 [transform:translateY(-34px)] [transition:opacity_720ms_ease,transform_720ms_cubic-bezier(0.2,0.78,0.22,1)]">
          <h2>meet our providers</h2>
          <p className="provider-copy max-w-[770px] mt-0 mb-[50px] mx-auto text-[length:16px] leading-[1.45] font-normal">
            Harmony Med Spa provides the highest quality service to ensure that you are healthy and happy. Meet our caring and compassionate
            team committed to providing exceptional service to you.
          </p>
        </div>
        <div className="provider-grid [&_img]:object-cover grid grid-cols-[390px_295px_295px] grid-rows-[238px_238px] gap-[24px] justify-center max-[1050px]:grid-cols-[repeat(2,minmax(260px,1fr))] max-[1050px]:grid-rows-[auto] max-[1050px]:max-w-[760px] max-[720px]:grid-cols-[repeat(2,minmax(0,1fr))] max-[720px]:max-w-[430px] max-[720px]:gap-[10px]">
          <Link className="provider-large provider-card provider-motion-left relative overflow-hidden opacity-0 [transition:opacity_780ms_ease,transform_780ms_cubic-bezier(0.2,0.78,0.22,1)] [will-change:transform,opacity] text-[#fff] [outline:0] [&_img]:[filter:grayscale(1)] [&_img]:[transform:scale(1.01)] [&_img]:[transition:filter_320ms_ease,transform_420ms_ease] row-[1_/_span_2] [transform:translateX(-90px)] [transition-delay:140ms] max-[1050px]:aspect-[1.18] max-[1050px]:row-[auto] max-[720px]:col-[1_/_-1] max-[720px]:aspect-[1.05]" href="/our-team">
            <Image src={`/images/providers/${providers[0].file}`} alt={providers[0].name} fill sizes="390px" />
            <div className="provider-overlay absolute inset-[auto_0_0] z-[1] flex min-h-[46%] flex-col justify-end pt-[28px] pb-[34px] px-[30px] text-center [background:linear-gradient(transparent,rgba(0,0,0,0.88))] opacity-0 [transform:translateY(18px)] [transition:opacity_260ms_ease,transform_260ms_ease] [&_h3]:mt-0 [&_h3]:mb-[10px] [&_h3]:mx-0 [&_h3]:text-[var(--gold)] [&_h3]:text-[length:24px] [&_h3]:leading-[1.05] [&_h3]:font-light [&_p]:max-w-[330px] [&_p]:my-0 [&_p]:mx-auto [&_p]:text-[#fff] [&_p]:text-[length:15px] [&_p]:leading-[1.25] [&_p]:font-bold">
              <h3>{providers[0].name}</h3>
              <p>{providers[0].title}</p>
            </div>
          </Link>
          {providers.slice(1).map((provider, index) => (
            <Link
              className="provider-small provider-card provider-motion-right relative overflow-hidden opacity-0 [transition:opacity_780ms_ease,transform_780ms_cubic-bezier(0.2,0.78,0.22,1)] [will-change:transform,opacity] text-[#fff] [outline:0] [&_img]:[filter:grayscale(1)] [&_img]:[transform:scale(1.01)] [&_img]:[transition:filter_320ms_ease,transform_420ms_ease] [&_.provider-overlay]:min-h-[62%] [&_.provider-overlay]:pt-[22px] [&_.provider-overlay]:pb-[24px] [&_.provider-overlay]:px-[18px] [&_.provider-overlay_h3]:mb-[7px] [&_.provider-overlay_h3]:text-[length:18px] [&_.provider-overlay_p]:text-[length:12px] [transform:translateX(90px)] [transition-delay:calc(220ms_+_var(--provider-delay,0ms))] max-[1050px]:aspect-[1.18] max-[720px]:aspect-[1]"
              href="/our-team"
              key={provider.file}
              style={{ "--provider-delay": `${index * 90}ms` } as React.CSSProperties}
            >
              <Image src={`/images/providers/${provider.file}`} alt={provider.name} fill sizes="300px" />
              <div className="provider-overlay absolute inset-[auto_0_0] z-[1] flex min-h-[46%] flex-col justify-end pt-[28px] pb-[34px] px-[30px] text-center [background:linear-gradient(transparent,rgba(0,0,0,0.88))] opacity-0 [transform:translateY(18px)] [transition:opacity_260ms_ease,transform_260ms_ease] [&_h3]:mt-0 [&_h3]:mb-[10px] [&_h3]:mx-0 [&_h3]:text-[var(--gold)] [&_h3]:text-[length:24px] [&_h3]:leading-[1.05] [&_h3]:font-light [&_p]:max-w-[330px] [&_p]:my-0 [&_p]:mx-auto [&_p]:text-[#fff] [&_p]:text-[length:15px] [&_p]:leading-[1.25] [&_p]:font-bold">
                <h3>{provider.name}</h3>
                {provider.title ? <p>{provider.title}</p> : null}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
