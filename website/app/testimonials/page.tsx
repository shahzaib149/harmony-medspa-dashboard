import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

const testimonials = [
  {
    quote:
      "I've been to a few Med Spas in Sarasota, and Jessica is absolutely the best. She truly cares about providing exceptional service and I am thrilled to have finally found a practitioner I can trust. Her staff is fantastic and I couldn't be happier with my decision.",
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
  },
  {
    quote:
      "I love detailed attention I get from Jessica on my weight loss journey. I am a 30 year nurse practitioner myself and feels she addresses all of my questions and concerns thoughtfully. I'm down almost 15 pounds. I highly recommend her and her delightful staff",
    author: "Debi D."
  },
  {
    quote:
      "Absolutely amazing services! The staff is always wonderful and so kind. I was very impressed with Jessica and her team's ability to get to the root cause of issues, which you'll find is a very rare thing these days! They are masters of their craft and show great integrity. For this reason, I would never go anywhere else!",
    author: "Michael L."
  },
  {
    quote:
      "Jessica and her staff are all very professional with a deep knowledge of their respective jobs and many that can fill in other places when needed. I have always been treated like family and their hormone therapy has helped me immensely.",
    author: "Richard L."
  }
];

export default function TestimonialsPage() {
  return (
    <main className="testimonials-page min-h-[100vh] bg-[#fff] text-[#000]">
      <SiteHeader className="contact-page-header" />

      <section className="testimonials-hero grid [place-items:center] min-h-[341px] [background:linear-gradient(rgba(0,0,0,0.62),rgba(0,0,0,0.62)),radial-gradient(circle_at_22%_38%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_70%_42%,rgba(255,255,255,0.06),transparent_24%),repeating-linear-gradient(29deg,rgba(255,255,255,0.025)_0_2px,transparent_2px_9px),linear-gradient(135deg,#252525,#101010_52%,#242424)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:text-[length:clamp(44px,3.5vw,58px)] [&_h1]:leading-[1] [&_h1]:font-thin max-[720px]:min-h-[230px]">
        <h1><TypewriterText text="testimonials" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="testimonials-content grid grid-cols-[minmax(0,820px)_390px] gap-[90px] w-[min(100%_-_48px,1300px)] my-0 mx-auto pt-[108px] pb-[142px] px-0 max-[1050px]:grid-cols-[minmax(0,680px)] max-[1050px]:justify-center max-[1050px]:gap-[46px] max-[1050px]:pt-[76px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:pt-[56px] max-[720px]:pb-[76px] max-[720px]:px-0">
        <article className="testimonials-main min-w-[0] [&_h2]:mt-0 [&_h2]:mb-[24px] [&_h2]:mx-0 [&_h2]:text-[#ebb35a] [&_h2]:text-[length:29px] [&_h2]:leading-[1.1] [&_h2]:font-thin max-[720px]:[&_h2]:text-[length:24px]" aria-labelledby="testimonials-title">
          <h2 id="testimonials-title"><TypewriterText text="Hear From Our Clients" startOnView /></h2>
          <p className="testimonials-intro mt-0 mb-[34px] mx-0 text-[#4f5966] text-[length:18px] leading-[1.85] font-normal max-[720px]:text-[length:16px]">
            Read what our clients say about our office and patient care. We're proud of our 5 star reviews and the reputation we've
            established in the community.
          </p>

          <Image
            className="testimonials-feature-image block w-full h-auto mb-[38px] rounded-[14px] object-cover"
            src="/images/about-us/Img_4.jpg"
            alt="Five star review on a phone"
            width={800}
            height={350}
            priority
          />

          <div className="testimonials-list grid">
            {testimonials.map((testimonial) => (
              <figure className="testimonial-entry m-0 pt-[32px] pb-[34px] px-0 [border-bottom:1px_solid_#ddd] first:pt-0 [&_blockquote]:m-0 [&_blockquote]:text-[#4f5966] [&_blockquote]:text-[length:18px] [&_blockquote]:leading-[1.72] [&_blockquote]:font-normal [&_figcaption]:mt-[18px] [&_figcaption]:text-[#1f2933] [&_figcaption]:text-[length:18px] [&_figcaption]:italic [&_figcaption]:font-bold max-[720px]:[&_blockquote]:text-[length:16px] max-[720px]:[&_figcaption]:text-[length:16px]" key={testimonial.author}>
                <blockquote>{testimonial.quote}</blockquote>
                <figcaption>By {testimonial.author}</figcaption>
              </figure>
            ))}
          </div>
        </article>

        <aside className="testimonials-sidebar grid [align-content:start] gap-[20px] [&_.about-search]:h-[70px] [&_.about-search]:mb-[15px] [&_.about-side-card]:min-h-[269px] [&_.about-side-card]:rounded-[18px] [&_.about-side-card_span]:text-[length:30px] [&_.about-side-card_small]:text-[length:22px] max-[1050px]:grid-cols-[repeat(2,minmax(240px,390px))] max-[1050px]:justify-center max-[1050px]:[&_.about-search]:col-[1_/_-1] max-[720px]:grid-cols-[1fr] max-[720px]:[&_.about-side-card]:min-h-[220px]" aria-label="Testimonials links">
          <label className="about-search flex items-center h-[56px] mb-[12px] py-0 pr-[20px] pl-[24px] [border:1px_solid_#c8d2dd] rounded-[8px] text-[var(--gold)] bg-[#fff] [&_input]:min-w-[0] [&_input]:flex-1 [&_input]:border-0 [&_input]:[outline:0] [&_input]:text-[#344356] [&_input]:bg-[transparent] [&_input]:[font:inherit] [&_input::placeholder]:text-[#425263] [&_input::placeholder]:opacity-[0.9] max-[1050px]:col-[1_/_-1]">
            <span className="sr-only">Search keyword</span>
            <input type="search" placeholder="Enter search keyword" />
            <Search size={18} />
          </label>

          <Link className="about-side-card relative grid [place-items:center] min-h-[184px] overflow-hidden rounded-[10px] text-[#fff] text-center isolate before:content-[''] before:absolute before:inset-0 before:z-[-1] before:[background:rgba(0,0,0,0.34)] [&_img]:z-[-2] [&_img]:object-cover [&_img]:[transition:transform_420ms_ease] [&_span]:text-[length:25px] [&_span]:leading-[1.1] [&_span]:font-normal [&_small]:inline-flex [&_small]:min-w-[146px] [&_small]:justify-center [&_small]:mt-[10px] [&_small]:py-[12px] [&_small]:px-[18px] [&_small]:[border-top:1px_solid_var(--gold)] [&_small]:[border-bottom:1px_solid_var(--gold)] [&_small]:text-[length:16px]" href="/services">
            <Image src="/images/about-us/img_1.png" alt="" fill sizes="390px" />
            <span>
              All
              <br />
              Services
            </span>
            <small>Learn More</small>
          </Link>

          <Link className="about-side-card relative grid [place-items:center] min-h-[184px] overflow-hidden rounded-[10px] text-[#fff] text-center isolate before:content-[''] before:absolute before:inset-0 before:z-[-1] before:[background:rgba(0,0,0,0.34)] [&_img]:z-[-2] [&_img]:object-cover [&_img]:[transition:transform_420ms_ease] [&_span]:text-[length:25px] [&_span]:leading-[1.1] [&_span]:font-normal [&_small]:inline-flex [&_small]:min-w-[146px] [&_small]:justify-center [&_small]:mt-[10px] [&_small]:py-[12px] [&_small]:px-[18px] [&_small]:[border-top:1px_solid_var(--gold)] [&_small]:[border-bottom:1px_solid_var(--gold)] [&_small]:text-[length:16px]" href="/contact-us">
            <Image src="/images/about-us/Img_2.png" alt="" fill sizes="390px" />
            <span>
              Keep
              <br />
              In Touch
            </span>
            <small>Contact Us</small>
          </Link>
        </aside>
      </section>

      <SiteFooter />
    </main>
  );
}
