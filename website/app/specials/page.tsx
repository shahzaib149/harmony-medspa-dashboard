import Image from "next/image";
import { Facebook, Instagram, Mail } from "lucide-react";
import { ONLINE_BOOKING_URL } from "@/lib/constants";
import TypewriterText from "@/components/ui/TypewriterText";
import SpecialsForm from "@/components/forms/SpecialsForm";

const specials = [
  {
    src: "/images/specials/summer-drips.jpg",
    alt: "Stars, Stripes and Summer Drips IV and vitamin injection specials",
    actions: [
      { label: "Book an IV Therapy Session or Vitamin Shot", href: ONLINE_BOOKING_URL, variant: "blue" }
    ]
  },
  {
    src: "/images/specials/memberships.jpg",
    alt: "Harmony Med Spa memberships built for your glow",
    actions: [
      { label: "Request a Membership", href: "#specials-interest", variant: "black" }
    ]
  },
  {
    src: "/images/specials/peptide-therapy.jpg",
    alt: "Peptide therapy at Harmony Med Spa",
    actions: [
      { label: "Book Now", href: ONLINE_BOOKING_URL, variant: "black" },
      { label: "Request Pricing on Peptides", href: "#specials-interest", variant: "black" }
    ]
  }
];

export default function SpecialsPage() {
  return (
    <main className="specials-page min-h-[100vh] bg-[#f5f1ea] text-[#111]">
      <header className="specials-header flex items-center justify-between gap-[32px] py-[22px] px-[clamp(18px,5vw,72px)] bg-[#050505] text-[#fff] max-[720px]:flex-col max-[720px]:gap-[14px] max-[720px]:text-center">
        <a className="specials-brand block w-[min(270px,70vw)] [&_img]:block [&_img]:w-full [&_img]:h-auto" href="/" aria-label="Harmony Med Spa home">
          <img src="/images/logo-transparent.png" alt="Harmony Med Spa" />
        </a>
        <address className="not-italic text-[length:14px] leading-[1.55] font-normal max-[720px]:text-[length:13px] [&_a]:text-[#efbd33]">
          2184 Gulf Gate Dr. Unit B Sarasota, FL 34231
          <br />
          <a href="tel:9419238990">(941)-923-8990</a> | Fax: <a href="tel:9419239024">(941)-923-9024</a> | <a href="https://harmonymedspafl.com">Harmonymedspafl.com</a>
        </address>
      </header>

      <section className="specials-list grid gap-[34px] w-[min(100%_-_40px,860px)] my-0 mx-auto py-[48px] px-0 max-[720px]:w-[min(100%_-_28px,640px)] max-[720px]:py-[32px]" aria-label="Current specials">
        {specials.map((special) => (
          <article className="specials-offer overflow-hidden rounded-[8px] bg-[#fff] shadow-[0_18px_42px_rgba(0,0,0,0.12)]" key={special.src}>
            <Image className="block w-full h-auto" src={special.src} alt={special.alt} width={720} height={486} priority={special.src.includes("summer")} />
            <div className="specials-actions flex flex-wrap justify-center gap-[12px] p-[20px] max-[520px]:grid max-[520px]:grid-cols-[1fr]">
              {special.actions.map((action) => (
                <a className={`specials-action specials-action-${action.variant} inline-flex min-h-[46px] items-center justify-center rounded-[4px] py-[12px] px-[18px] text-center text-[length:14px] leading-[1.2] font-bold uppercase tracking-[0.04em] ${action.variant === "blue" ? "bg-[#126c9a] text-[#fff]" : "bg-[#111] text-[#fff]"}`} href={action.href} key={action.label}>
                  {action.label}
                </a>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="specials-interest w-[min(100%_-_40px,760px)] mt-0 mb-[46px] mx-auto rounded-[8px] bg-[#fff] py-[42px] px-[44px] shadow-[0_18px_42px_rgba(0,0,0,0.1)] max-[720px]:w-[min(100%_-_28px,640px)] max-[720px]:py-[32px] max-[720px]:px-[22px]" id="specials-interest" aria-labelledby="specials-interest-title">
        <h1 className="m-0 text-center text-[#c99b13] text-[length:clamp(30px,5vw,42px)] leading-[1.05] font-thin" id="specials-interest-title"><TypewriterText text="Interested? Tell Us How to Contact You!" letterDelay={110} caret ignoreReducedMotion /></h1>
        <p className="mt-[18px] mb-0 mx-auto max-w-[650px] text-center text-[length:16px] leading-[1.55] font-normal">Please enter your email address (required) and your mobile number if you&apos;d like us to text you for the fastest response.</p>
        <p className="mt-[14px] mb-0 mx-auto max-w-[650px] text-center text-[length:16px] leading-[1.55] font-normal">A member of our team will follow up as soon as possible to help you choose the perfect package, answer any questions, and reserve your spot before these limited-time offers end.</p>

        <SpecialsForm />
      </section>

      <footer className="specials-footer flex justify-center gap-[12px] py-[28px] px-[18px] bg-[#111] text-[#fff]" aria-label="Social links">
        <a href="#" aria-label="Facebook"><Facebook size={14} fill="currentColor" /></a>
        <a href="#" aria-label="Instagram"><Instagram size={14} /></a>
        <a href="mailto:management@harmonymedspafl.com" aria-label="Email"><Mail size={14} /></a>
      </footer>
    </main>
  );
}
