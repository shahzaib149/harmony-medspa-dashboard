"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { providers } from "@/lib/data/providers";

type Provider = (typeof providers)[number];

export default function TeamList() {
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  useEffect(() => {
    if (!selectedProvider) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedProvider(null);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedProvider]);

  return (
    <>
      <section className="team-list grid grid-cols-[repeat(3,minmax(260px,330px))] justify-center gap-[132px_clamp(80px,9vw,165px)] pt-[142px] pb-[146px] px-[28px] max-[1050px]:grid-cols-[repeat(2,minmax(260px,330px))] max-[1050px]:gap-y-[90px] max-[1050px]:gap-x-[80px] max-[720px]:grid-cols-[minmax(250px,330px)] max-[720px]:gap-[76px] max-[720px]:pt-[84px] max-[720px]:pb-[96px] max-[720px]:px-[24px]">
        {providers.map((member) => (
          <article className="team-card text-center [&_h2]:mt-0 [&_h2]:mb-[4px] [&_h2]:mx-0 [&_h2]:text-[#ebb35a] [&_h2]:text-[length:23px] [&_h2]:leading-[1.12] [&_h2]:font-thin" key={member.file}>
            <div className="team-photo relative w-[250px] h-[250px] mt-0 mb-[28px] mx-auto overflow-hidden [border:6px_solid_#e7eef3] rounded-full [&_img]:object-cover max-[720px]:w-[230px] max-[720px]:h-[230px]">
              <Image src={`/images/providers/${member.file}`} alt={member.name} fill sizes="250px" />
            </div>
            <h2>{member.name}</h2>
            {member.title ? <p className="team-role min-h-[32px] mt-0 mb-[28px] mx-auto text-[#303946] text-[length:14px] leading-[1.1] font-medium">{member.title}</p> : null}
            <p className="team-excerpt min-h-[136px] mt-0 mb-[28px] mx-0 text-[#4a5564] text-left text-[length:17px] leading-[1.46] font-normal">{member.bio}[..]</p>
            <button className="line-button team-read-more inline-flex justify-center py-[13px] px-[18px] [border-top:1px_solid_var(--gold)] [border-bottom:1px_solid_var(--gold)] font-normal bg-[transparent] [border-left:0] [border-right:0] cursor-pointer min-w-[144px] text-[#000] text-[length:18px]" type="button" onClick={() => setSelectedProvider(member)}>
              Read More
            </button>
          </article>
        ))}
      </section>

      {selectedProvider ? (
        <div className="team-modal-backdrop fixed inset-0 z-[100] grid [place-items:center] p-[32px] [background:rgba(0,0,0,0.76)] max-[720px]:p-[18px] max-[720px]:[align-items:start] max-[720px]:overflow-y-auto" role="presentation" onMouseDown={() => setSelectedProvider(null)}>
          <section
            className="team-modal relative grid grid-cols-[minmax(250px,335px)_minmax(360px,1fr)] gap-[48px] w-[min(1150px,100%)] max-h-[min(665px,calc(100vh_-_64px))] pt-[88px] pb-[84px] px-[54px] overflow-hidden rounded-[24px] bg-[#fff] text-[#666] shadow-[0_28px_90px_rgba(0,0,0,0.38)] max-[1050px]:grid-cols-[minmax(220px,300px)_minmax(320px,1fr)] max-[1050px]:gap-[34px] max-[1050px]:pt-[78px] max-[1050px]:pb-[58px] max-[1050px]:px-[38px] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[26px] max-[720px]:max-h-[none] max-[720px]:pt-[72px] max-[720px]:pb-[30px] max-[720px]:px-[24px] max-[720px]:rounded-[18px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="team-modal-close absolute top-[34px] right-[36px] grid [place-items:center] w-[42px] h-[42px] border-0 text-[#777] bg-[transparent] cursor-pointer hover:text-[#000] focus-visible:text-[#000] max-[720px]:top-[20px] max-[720px]:right-[20px]" type="button" aria-label="Close provider details" onClick={() => setSelectedProvider(null)}>
              <X size={34} strokeWidth={1.5} />
            </button>
            <div className="team-modal-photo relative w-full aspect-[1] [align-self:start] overflow-hidden bg-[#eee] [&_img]:object-cover [&_img]:object-[center_top] max-[720px]:w-[min(335px,100%)] max-[720px]:my-0 max-[720px]:mx-auto">
              <Image src={`/images/providers/${selectedProvider.file}`} alt={selectedProvider.name} fill sizes="360px" />
            </div>
            <div className="team-modal-copy grid grid-rows-[auto_auto_minmax(0,1fr)] min-h-[0] pt-[30px] [&_h2]:mt-0 [&_h2]:mb-[8px] [&_h2]:mx-0 [&_h2]:text-[#ebb35a] [&_h2]:text-[length:25px] [&_h2]:leading-[1.15] [&_h2]:font-thin max-[720px]:pt-0">
              <h2 id="team-modal-title">{selectedProvider.name}</h2>
              {selectedProvider.title ? <p className="team-modal-role mt-0 mb-[26px] mx-0 text-[#6b6b6b] uppercase text-[length:14px] leading-[1.25] font-bold">{selectedProvider.title}</p> : null}
              <div className="team-modal-scroll min-h-[0] max-h-[325px] overflow-y-auto pr-[34px] [scrollbar-color:#111_#d4d4d4] [scrollbar-width:thin] [&_p]:mt-0 [&_p]:mb-[24px] [&_p]:mx-0 [&_p]:text-[#666] [&_p]:text-[length:16px] [&_p]:leading-[1.48] [&_p]:font-normal max-[720px]:max-h-[42vh] max-[720px]:pr-[18px]">
                {selectedProvider.fullBio.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
