import Image from "next/image";
import { Facebook, Instagram } from "lucide-react";
import TypewriterText from "@/components/ui/TypewriterText";
import NewsletterForm from "@/components/forms/NewsletterForm";

export default function LearnMorePage() {
  return (
    <main className="learn-more-page min-h-[100vh] pt-[47px] pb-0 px-[18px] bg-[#f4f4f4] text-[#000] [font-family:Arial,'Helvetica_Neue',sans-serif] font-normal max-[720px]:pt-[24px]">
      <section className="learn-more-card w-[min(702px,100%)] min-h-[100vh] my-0 mx-auto pt-[55px] pb-[15px] px-[16px] bg-[#fff] max-[720px]:pt-[28px]" aria-labelledby="learn-more-title">
        <Image
          className="learn-more-image block w-full h-auto shadow-[0_18px_24px_rgba(0,0,0,0.28)]"
          src="/images/learn-more/newsletter-rewards.jpg"
          alt="Newsletter Rewards. Opt-in and get fifty dollars off first purchase."
          width={720}
          height={315}
          priority
        />

        <h1 id="learn-more-title" className="sr-only"><TypewriterText text="Join the Harmony Med Spa newsletter" letterDelay={110} caret ignoreReducedMotion /></h1>

        <NewsletterForm />

        <div className="learn-more-social flex justify-center gap-[17px] mt-[25px] [&_a]:grid [&_a]:[place-items:center] [&_a]:w-[44px] [&_a]:h-[44px] [&_a]:rounded-full [&_a]:text-[#fff]" aria-label="Social links">
          <a className="learn-more-facebook bg-[#5b84c9]" href="#" aria-label="Facebook"><Facebook size={28} fill="currentColor" /></a>
          <a className="learn-more-instagram bg-[#ef476f]" href="#" aria-label="Instagram"><Instagram size={28} /></a>
          <a className="learn-more-tiktok bg-[#000] text-[length:30px] font-bold" href="#" aria-label="TikTok">♪</a>
        </div>
      </section>
    </main>
  );
}
