import Link from "next/link";

const monthlySpecialsUrl = "https://mailchi.mp/harmonymedspafl/monthly-specials";
const newsletterOptInUrl = "https://mailchi.mp/harmonymedspafl/newsletter-opt-in";
const giftCardsUrl = "https://mailchi.mp/harmonymedspafl/gift_cards";

const patientLinks = [
  { label: "patient forms", href: "/patient-forms" },
  { label: "payment plans", href: "/payment-plans" },
  { label: "gift cards", href: giftCardsUrl, newTab: true },
  { label: "testimonials", href: "/testimonials" },
  { label: "specials", href: monthlySpecialsUrl, newTab: true },
  { label: "events", href: "/events" },
  { label: "blog", href: "/blog" },
  { label: "newsletter", href: newsletterOptInUrl, newTab: true },
  { label: "membership", href: "/membership" }
];

export default function PatientCenterDropdown() {
  return (
    <div className="nav-dropdown patient-dropdown relative pb-[14px] mb-[-14px] after:content-[''] after:absolute after:left-[-18px] after:right-[-18px] after:top-[100%] after:h-[14px]">
      <button className="nav-dropdown-trigger inline-flex items-center gap-[6px] p-0 border-0 bg-[transparent] text-[inherit] cursor-pointer [font:inherit] list-none after:content-[''] after:w-[0] after:h-[0] after:[border-left:3px_solid_transparent] after:[border-right:3px_solid_transparent] after:[border-top:4px_solid_currentColor] after:[transform:translateY(1px)]" type="button" aria-haspopup="true">
        patient center
      </button>
      <div className="nav-dropdown-menu absolute top-[calc(100%_+_8px)] left-[50%] z-[30] grid w-[170px] bg-[#000] shadow-[0_16px_26px_rgba(0,0,0,0.32)] opacity-0 pointer-events-none [transform:translateX(calc(-50%_+_28px))] [transition:opacity_180ms_ease,transform_240ms_ease] [&_a]:flex [&_a]:items-center [&_a]:justify-center [&_a]:min-h-[48px] [&_a]:py-0 [&_a]:px-[24px] [&_a]:text-center [&_a]:text-[#fff] [&_a]:text-[length:14px] [&_a]:font-medium [&_a]:whitespace-nowrap [&_a]:opacity-0 [&_a]:[transform:translateX(34px)] [&_a]:[transition:opacity_220ms_ease,transform_260ms_ease] [&_a]:[transition-delay:0ms] [&_a:first-child]:text-[#000] [&_a:first-child]:bg-[#efbd33] [&_a:hover]:text-[#000] [&_a:hover]:bg-[var(--gold)] [&_a:focus-visible]:text-[#000] [&_a:focus-visible]:bg-[var(--gold)] [&_a:nth-child(1)]:[transition-delay:40ms] [&_a:nth-child(2)]:[transition-delay:85ms] [&_a:nth-child(3)]:[transition-delay:130ms] [&_a:nth-child(4)]:[transition-delay:175ms] [&_a:nth-child(5)]:[transition-delay:220ms] [&_a:nth-child(6)]:[transition-delay:265ms] [&_a:nth-child(7)]:[transition-delay:310ms] [&_a:nth-child(8)]:[transition-delay:355ms] [&_a:nth-child(9)]:[transition-delay:400ms]">
        {patientLinks.map((item) =>
          item.href.startsWith("/") ? (
            <Link href={item.href} key={item.label}>
              {item.label}
            </Link>
          ) : (
            <a href={item.href} key={item.label} target={item.newTab ? "_blank" : undefined} rel={item.newTab ? "noreferrer" : undefined}>
              {item.label}
            </a>
          )
        )}
      </div>
    </div>
  );
}
