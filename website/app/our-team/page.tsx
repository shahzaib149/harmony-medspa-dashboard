import TeamList from "@/components/team/TeamList";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";

const teamTitleLetters = [
  { character: "o", offset: "132px" },
  { character: "u", offset: "92px" },
  { character: "r", offset: "54px" },
  { character: " ", offset: "0px" },
  { character: "t", offset: "-28px" },
  { character: "e", offset: "-68px" },
  { character: "a", offset: "-108px" },
  { character: "m", offset: "-150px" }
];

export default function OurTeamPage() {
  return (
    <main className="team-page bg-[#fff]">
      <SiteHeader className="team-header" servicesHref="/#services" contactHref="/#contact" />

      <section className="team-hero grid [place-items:center] min-h-[272px] overflow-hidden [background:linear-gradient(rgba(0,0,0,0.52),rgba(0,0,0,0.52)),radial-gradient(circle_at_12%_18%,rgba(255,255,255,0.1),transparent_18%),radial-gradient(circle_at_42%_58%,rgba(255,255,255,0.08),transparent_24%),radial-gradient(circle_at_80%_24%,rgba(255,255,255,0.09),transparent_20%),linear-gradient(135deg,#202020,#111_48%,#252525)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:text-[length:clamp(42px,3.4vw,58px)] [&_h1]:leading-[1] [&_h1]:font-thin [&_h1]:[transform:scaleX(0)] [&_h1]:origin-[center] [&_h1]:opacity-0 [&_h1]:[animation:teamTitleReveal_200ms_ease-out_120ms_forwards] max-[720px]:min-h-[220px]">
        <h1 aria-label="our team">
          {teamTitleLetters.map((letter, index) => (
            <span
              aria-hidden="true"
              className={letter.character === " " ? "team-title-space" : undefined}
              key={`${letter.character}-${index}`}
              style={
                {
                  "--letter-delay": `${index * 0.2}s`,
                  "--letter-start": letter.offset
                } as React.CSSProperties
              }
            >
              {letter.character === " " ? "\u00A0" : letter.character}
            </span>
          ))}
        </h1>
      </section>

      <TeamList />

      <SiteFooter address="plain" copyright="plain" />
    </main>
  );
}
