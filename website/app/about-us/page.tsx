import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

const galleryImages = [
  "about_1.jpg",
  "about_2.jpg",
  "about_3.jpg",
  "about_4.jpg",
  "about_5.jpg",
  "about_6.jpg",
  "about_7.jpg",
  "about_8.jpg",
  "about_9.jpg",
  "about_10.jpg"
];

export default function AboutUsPage() {
  return (
    <main className="about-page min-h-[100vh] bg-[#fff]">
      <SiteHeader className="team-header" />

      <section className="about-hero grid [place-items:center] min-h-[272px] [background:linear-gradient(rgba(0,0,0,0.58),rgba(0,0,0,0.58)),radial-gradient(circle_at_22%_38%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_70%_42%,rgba(255,255,255,0.06),transparent_24%),repeating-linear-gradient(29deg,rgba(255,255,255,0.025)_0_2px,transparent_2px_9px),linear-gradient(135deg,#252525,#101010_52%,#242424)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:text-[length:clamp(42px,3.4vw,56px)] [&_h1]:leading-[1] [&_h1]:font-thin">
        <h1><TypewriterText text="about us" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="about-content grid grid-cols-[minmax(0,650px)_312px] gap-[88px] w-[min(100%_-_48px,1040px)] my-0 mx-auto pt-[84px] pb-[112px] px-0 max-[1050px]:grid-cols-[minmax(0,680px)] max-[1050px]:justify-center max-[1050px]:gap-[42px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:pt-[60px] max-[720px]:pb-[76px] max-[720px]:px-0">
        <article className="about-story [&_h2]:mt-0 [&_h2]:mb-[22px] [&_h2]:mx-0 [&_h2]:text-[#dfad39] [&_h2]:text-[length:20px] [&_h2]:font-thin [&_p]:mt-0 [&_p]:mb-[26px] [&_p]:mx-0 [&_p]:text-[#000] [&_p]:text-[length:16px] [&_p]:leading-[1.48]">
          <h2><TypewriterText text="Our Story" startOnView /></h2>
          <p>
            Harmony Med Spa is a full-service medical spa in Sarasota, Florida. Board-certified nurse practitioner Jessica Simone, APRN,
            and her team take a natural approach to beauty that provides men and women of all ages the most effective and innovative
            aesthetic treatments available in a relaxed and welcoming setting.
          </p>
          <p>
            Treatments available at Harmony Med Spa include Bio Identical Hormone Optimization, laser treatments, dermal fillers,
            Neuromodulators (Daxxify injections), customized facials, and medically supervised [GLP-1] weight loss programs. Injectable
            product lines available include RHA fillers, Daxxify, and Sculptra.
          </p>
          <p>
            Jessica and her team also provide regenerative medicine treatments such as Biocellulose recovery masks and RF microneedling
            that repair and rejuvenate the skin and body at the cellular level.
          </p>
          <p>
            As part of its commitment to overall health and well-being, Harmony Med Spa offers bioidentical hormone replacement therapy.
            Jessica is a certified Evexipel provider and works closely with her patients to design a customized plan that provides
            exceptional results.
          </p>
          <p>
            Clients appreciate the team&apos;s professional attitude and commitment to ensuring that treatment goals and expectations are
            fully understood before any procedure is undertaken.
          </p>
          <p>Schedule a visit at Harmony Med Spa by calling the office or requesting an appointment online today!</p>

          <a className="about-listing block w-[min(100%,590px)] mt-[52px] mb-[44px] mx-auto [&_img]:block [&_img]:w-full [&_img]:h-auto" href="#" aria-label="View Harmony Med Spa Sarasota Chamber listing">
            <Image
              src="/images/about-us/view_image/view our listing image.jpg"
              alt="Proud member of Sarasota Chamber 2026"
              width={740}
              height={370}
            />
          </a>

          <div className="about-gallery grid grid-cols-[repeat(2,minmax(0,1fr))] gap-[10px] w-[min(100%,640px)] my-0 mx-auto [&_img]:block [&_img]:w-full [&_img]:h-auto max-[720px]:grid-cols-[1fr]" aria-label="Harmony Med Spa office gallery">
            {galleryImages.map((file, index) => (
              <Image
                src={`/images/about-us/below_several_images/${file}`}
                alt={`Harmony Med Spa office view ${index + 1}`}
                width={410}
                height={274}
                key={file}
              />
            ))}
          </div>
        </article>

        <aside className="about-sidebar grid [align-content:start] gap-[16px] max-[1050px]:grid-cols-[repeat(2,minmax(240px,312px))] max-[1050px]:justify-center max-[720px]:grid-cols-[1fr]" aria-label="About page links">
          <label className="about-search flex items-center h-[56px] mb-[12px] py-0 pr-[20px] pl-[24px] [border:1px_solid_#c8d2dd] rounded-[8px] text-[var(--gold)] bg-[#fff] [&_input]:min-w-[0] [&_input]:flex-1 [&_input]:border-0 [&_input]:[outline:0] [&_input]:text-[#344356] [&_input]:bg-[transparent] [&_input]:[font:inherit] [&_input::placeholder]:text-[#425263] [&_input::placeholder]:opacity-[0.9] max-[1050px]:col-[1_/_-1]">
            <span className="sr-only">Search keyword</span>
            <input type="search" placeholder="Enter search keyword" />
            <Search size={18} />
          </label>

          <Link className="about-side-card relative grid [place-items:center] min-h-[184px] overflow-hidden rounded-[10px] text-[#fff] text-center isolate before:content-[''] before:absolute before:inset-0 before:z-[-1] before:[background:rgba(0,0,0,0.34)] [&_img]:z-[-2] [&_img]:object-cover [&_img]:[transition:transform_420ms_ease] [&_span]:text-[length:25px] [&_span]:leading-[1.1] [&_span]:font-normal [&_small]:inline-flex [&_small]:min-w-[146px] [&_small]:justify-center [&_small]:mt-[10px] [&_small]:py-[12px] [&_small]:px-[18px] [&_small]:[border-top:1px_solid_var(--gold)] [&_small]:[border-bottom:1px_solid_var(--gold)] [&_small]:text-[length:16px]" href="/services">
            <Image src="/images/about-us/img_1.png" alt="" fill sizes="320px" />
            <span>All<br />Services</span>
            <small>Learn More</small>
          </Link>

          <Link className="about-side-card relative grid [place-items:center] min-h-[184px] overflow-hidden rounded-[10px] text-[#fff] text-center isolate before:content-[''] before:absolute before:inset-0 before:z-[-1] before:[background:rgba(0,0,0,0.34)] [&_img]:z-[-2] [&_img]:object-cover [&_img]:[transition:transform_420ms_ease] [&_span]:text-[length:25px] [&_span]:leading-[1.1] [&_span]:font-normal [&_small]:inline-flex [&_small]:min-w-[146px] [&_small]:justify-center [&_small]:mt-[10px] [&_small]:py-[12px] [&_small]:px-[18px] [&_small]:[border-top:1px_solid_var(--gold)] [&_small]:[border-bottom:1px_solid_var(--gold)] [&_small]:text-[length:16px]" href="/contact-us">
            <Image src="/images/about-us/Img_2.png" alt="" fill sizes="320px" />
            <span>Keep<br />In Touch</span>
            <small>Contact Us</small>
          </Link>
        </aside>
      </section>

      <SiteFooter address="linked-name" copyright="symbol" />
    </main>
  );
}
