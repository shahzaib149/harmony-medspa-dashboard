import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";
import { ONLINE_BOOKING_URL } from "@/lib/constants";

const includes = [
  {
    label: "Medical-grade scalp microneedling",
    text: "to stimulate collagen production and follicular activation"
  },
  {
    label: "Application of KeraFactor growth factor serum",
    text: "to enhance follicle signaling"
  },
  {
    label: "Red light therapy",
    text: "to improve circulation, reduce inflammation, and support cellular energy"
  }
];

const reasons = [
  {
    label: "Dermatologist Developed:",
    text: "KeraFactor products have been expertly crafted by a dermatologist, ensuring their reliability and efficacy."
  },
  {
    label: "Fragrance and Irritant-Free:",
    text: "We care about your comfort. Our products are entirely free from fragrances and irritants."
  },
  {
    label: "Hormone-Free, Drug-Free:",
    text: "KeraFactor products are safe and free from hormones and drugs."
  },
  {
    label: "Free From Harmful Additives:",
    text: "Our products are SLS-free, paraben-free, sulfate-free, gluten-free, phthalates-free, and carcinogen-free, free of animal testing, ensuring the utmost safety and ethical standards."
  }
];

const products = [
  {
    title: "KeraFactorMD In-Office Serum",
    body:
      "Elevate your hair care routine with KeraFactor's professional-grade serum. Featuring a potent blend of six bioidentical growth factors, two skin proteins, and two revitalizing compounds, this serum targets common deficiencies associated with hair loss and scalp health. Experience rejuvenation at its finest as it promotes healthier, fuller-looking hair from the roots.",
    image: "5.jfif"
  },
  {
    title: "The KeraFactor Combo System",
    body:
      "Combines a growth factor-rich solution, a 2-in-1 exfoliating shampoo + conditioner, and a scalp-stimulating brush to promote circulation, target scalp deficiencies, and transform hair from root to tip.",
    image: "6.jfif"
  },
  {
    title: "KeraFactor Scalp Stimulating Solution",
    body:
      "Unlock the secret to stronger, thicker hair with KeraFactor's groundbreaking solution. Precisely formulated growth factors promote scalp and hair health, leading to a remarkable transformation in hair strength and thickness. Pair it with our KeraCap for an added boost in combating scalp issues.",
    image: "7.jfif"
  },
  {
    title: "KeraFactor Scalp Stimulating 2-in-1 Shampoo + Conditioner",
    body:
      "KeraFactor's dynamic duo of shampoo and conditioner gently exfoliates and stimulates the scalp, enhancing circulation and revitalizing your hair foundation. Say goodbye to dull, lifeless hair and hello to smoother, thicker locks.",
    image: "8.jfif"
  },
  {
    title: "KeraFactor Scalp Stimulating Brush",
    body:
      "Complement your hair care routine with KeraFactor's scalp-stimulating brush. Designed to enhance product effectiveness by promoting circulation, it ensures that our growth factors reach their destination for optimal results.",
    image: "9.jfif"
  },
  {
    title: "KeraFlex Laser Cap",
    body:
      "Harness the power of 302 diodes and a 650nm wavelength with our KeraCap Laser Cap. This treatment stimulates hair growth by reducing inflammation and increasing blood flow, effectively combating scalp issues like DHT.",
    image: "10.jfif"
  },
  {
    title: "Brows by KeraFactor",
    body:
      "Experience the revolution in brow care with KeraFactor's cutting-edge serum. Formulated with a potent blend of nine biomimetic growth factors, it nourishes brow follicles for fuller, thicker, and more defined looking brows. Activate dormant follicles and enhance existing ones with this powerful formula.",
    image: "11.jfif"
  },
  {
    title: "Lashes by KeraFactor",
    body:
      "Transform your lashes with our revolutionary serum, meticulously crafted to nourish, strengthen, and enhance like never before. It features a blend of scientifically proven ingredients and biomimetic growth factors for lashes that appear longer, fuller, and healthier for an irresistible look.",
    image: "12.jfif"
  },
  {
    title: "KeraSmooth Hair Brush",
    body:
      "Discover the ultimate solution for delicate detangling with the KeraSmooth Hair Brush. Designed specifically for thinning or fine hair, KeraSmooth features innovative soft-flex teeth that ensure minimal breakage and gentle care for your locks.",
    image: "13.jfif"
  }
];

export default function HairRestorationPage() {
  return (
    <main className="hair-restoration-page min-h-[100vh] bg-[#fff] text-[#000]">
      <SiteHeader className="team-header" servicesHref="/#services" contactHref="/#contact" />

      <section className="service-detail-hero grid [place-items:center] min-h-[320px] [background:linear-gradient(rgba(0,0,0,0.64),rgba(0,0,0,0.64)),radial-gradient(circle_at_28%_32%,rgba(255,255,255,0.08),transparent_22%),radial-gradient(circle_at_72%_46%,rgba(255,255,255,0.07),transparent_26%),repeating-linear-gradient(18deg,rgba(255,255,255,0.022)_0_2px,transparent_2px_8px),linear-gradient(135deg,#292929,#111_54%,#262626)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:text-[length:clamp(42px,4vw,58px)] [&_h1]:leading-[1.05] [&_h1]:font-thin max-[720px]:min-h-[230px] max-[720px]:px-[20px] max-[720px]:text-center">
        <h1><TypewriterText text="hair restoration" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="grid grid-cols-[minmax(0,820px)_390px] gap-[78px] w-[min(100%_-_48px,1280px)] my-0 mx-auto pt-[92px] pb-[126px] px-0 max-[1050px]:grid-cols-[minmax(0,820px)] max-[1050px]:justify-center max-[1050px]:gap-[48px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:pt-[58px] max-[720px]:pb-[86px]">
        <article className="min-w-0 text-[length:20px] leading-[1.45] font-normal text-[#4f5b68] max-[720px]:text-[length:17px]">
          <Image
            className="w-[min(808px,100%)] h-auto rounded-[14px] mb-[48px]"
            src="/images/services/hair-restoration/1.jfif"
            alt="Hair restoration clients"
            width={818}
            height={460}
            priority
          />

          <section className="mb-[34px] text-[#000]">
            <h2 className="mt-0 mb-[22px] text-[#ebb35a] text-[length:29px] leading-[1.1] font-thin max-[720px]:text-[length:25px]"><TypewriterText text="We Are Offering:" startOnView /></h2>
            <h3 className="mt-0 mb-[20px] text-[#4f5b68] text-[length:26px] leading-[1.18] font-thin max-[720px]:text-[length:23px]">
              Scalp Microneedling + KeraFactor<sup>&reg;</sup> Serum + Red Light Therapy
            </h3>
            <p className="mt-0 mb-[28px] max-w-[840px]">
              This advanced in-office treatment is designed to stimulate dormant hair follicles, improve scalp health, and promote new hair
              growth by combining three synergistic modalities in one session.
            </p>
            <p className="mt-0 mb-[4px] font-bold text-[#4f5b68]">Includes:</p>
            <ul className="mt-0 mb-[28px] pl-[30px] text-[#4f5b68]">
              {includes.map((item) => (
                <li key={item.label}>
                  <strong>{item.label}</strong> {item.text}
                </li>
              ))}
            </ul>
            <p className="mt-0 mb-[4px]">Additionally, patients will be able to purchase the Kerafactor Home Kit</p>
            <ul className="mt-0 mb-[28px] pl-[30px] text-[#4f5b68]">
              <li>Includes KeraFactor<sup>&reg;</sup> Shampoo &amp; Conditioner Bundle: 30 day supply</li>
              <li>Supports scalp health and prolongs in-office treatment results.</li>
            </ul>
            <div className="grid grid-cols-[1fr_1fr] gap-[40px] mb-[34px] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[22px]">
              <Image className="w-full h-auto rounded-[14px]" src="/images/services/hair-restoration/2.jfif" alt="KeraFactor home kit" width={400} height={325} />
              <Image className="w-full h-auto rounded-[14px]" src="/images/services/hair-restoration/3.jfif" alt="KeraFactor shampoo and conditioner" width={400} height={325} />
            </div>
            <p className="m-0 text-[#4f5b68]">Services and products will also be offered as part of packages for discounts.</p>
          </section>

          <div className="h-px bg-[#d9d9d9] mb-[70px]" />

          <Image
            className="w-[min(808px,100%)] h-auto rounded-[14px] mb-[48px]"
            src="/images/services/hair-restoration/4.jfif"
            alt="KeraFactor skincare for hair serum"
            width={818}
            height={412}
          />

          <section className="mb-[54px]">
            <h2 className="mt-0 mb-[24px] text-[#ebb35a] text-[length:29px] leading-[1.1] font-thin max-[720px]:text-[length:25px]">What Is KeraFactor<sup>&reg;</sup>?</h2>
            <p className="mt-0 mb-[28px] max-w-[840px]">
              KeraFactor<sup>&reg;</sup> is a science-driven hair wellness brand founded by renowned dermatologist Dr. Amy Forman Taub and biotech
              innovator James Bartholomeusz, combining clinical expertise and cutting-edge technology to tackle hair loss at the root.
            </p>
            <p className="m-0 max-w-[840px]">
              KeraFactor revolutionizes hair and scalp care with its patented formula, combining biomimetic growth factors and skin proteins
              in a nanoliposome delivery system. Designed to awaken dormant follicles and enhance scalp circulation, our innovative treatment
              targets key deficiencies to promote fuller, healthier hair.
            </p>
          </section>

          <section className="mb-[54px]">
            <h2 className="mt-0 mb-[18px] text-[#ebb35a] text-[length:29px] leading-[1.1] font-thin max-[720px]:text-[length:25px]"><TypewriterText text="Discover The KeraFactor Formula:" startOnView /></h2>
            <h3 className="mt-0 mb-[24px] text-[#4f5b68] text-[length:25px] leading-[1.2] font-thin max-[720px]:text-[length:22px]">
              Your Path To Healthier Hair And Scalp
            </h3>
            <p className="m-0 max-w-[840px]">
              The KeraFactor formula is a fusion of patented biomimetic growth factors and skin proteins. This potent blend is encapsulated
              in a nanoliposome delivery system, and it is poised to revolutionize the way we nurture and enhance hair health.
            </p>
          </section>

          <section className="mb-[54px]">
            <h2 className="mt-0 mb-[24px] text-[#ebb35a] text-[length:29px] leading-[1.1] font-thin max-[720px]:text-[length:25px]"><TypewriterText text="What KeraFactor Does:" startOnView /></h2>
            <p className="m-0 max-w-[840px]">
              Our cutting-edge treatment is designed to awaken dormant hair follicles and boost scalp circulation for lush, voluminous, and
              vibrant hair. Years of clinical research have shown that many hair and scalp issues stem from the deficiency of key growth
              factors. These growth factors were handpicked to be the heart of the formula, tailored specifically for hair and scalp
              revitalization.
            </p>
          </section>

          <section className="mb-[54px]">
            <h2 className="mt-0 mb-[24px] text-[#ebb35a] text-[length:29px] leading-[1.1] font-thin max-[720px]:text-[length:25px]"><TypewriterText text="Why KeraFactor?" startOnView /></h2>
            <p className="mt-0 mb-[8px] max-w-[840px]">
              This comprehensive range of products is the latest breakthrough in promoting hair that exudes strength, smoothness, thickness,
              and fullness.
            </p>
            <ul className="mt-0 mb-0 pl-[30px]">
              {reasons.map((item) => (
                <li key={item.label}>
                  <strong>{item.label}</strong> {item.text}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mt-0 mb-[24px] text-[#ebb35a] text-[length:29px] leading-[1.1] font-thin max-[720px]:text-[length:25px]"><TypewriterText text="Explore KeraFactor Products" startOnView /></h2>
            <p className="mt-0 mb-[34px] max-w-[840px]">
              KeraFactor offers an array of innovative solutions to address various hair and scalp concerns, providing professional-grade care
              both in-office and at home:
            </p>

            <div className="grid gap-[64px]">
              {products.map((product) => (
                <section className="grid grid-cols-[minmax(0,1fr)_250px] items-center gap-[58px] pb-[64px] border-b border-[#d9d9d9] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[22px]" key={product.title}>
                  <div>
                    <h3 className="mt-0 mb-[12px] text-[#4f5b68] text-[length:20px] leading-[1.35] font-bold">{product.title}</h3>
                    <p className="m-0 max-w-[580px]">{product.body}</p>
                  </div>
                  <Image
                    className="w-full h-auto rounded-[14px] max-[720px]:max-w-[301px]"
                    src={`/images/services/hair-restoration/${product.image}`}
                    alt={product.title}
                    width={301}
                    height={302}
                  />
                </section>
              ))}
            </div>
          </section>

          <section className="mt-[40px] rounded-[18px] bg-[#000] py-[58px] px-[28px] text-center">
            <h2 className="mt-0 mb-[34px] text-[var(--gold)] text-[length:29px] leading-[1.15] font-thin"><TypewriterText text="Book Your Hair Restoration Consult Today" startOnView /></h2>
            <a
              className="inline-flex min-w-[160px] justify-center py-[14px] px-[24px] [border-top:1px_solid_var(--gold)] [border-bottom:1px_solid_var(--gold)] text-[#fff] text-[length:18px]"
              href={ONLINE_BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              BOOK NOW
            </a>
          </section>
        </article>

        <aside className="grid [align-content:start] gap-[35px] pt-[16px] [&_.about-side-card]:min-h-[269px] [&_.about-side-card]:rounded-[18px] [&_.about-side-card_span]:text-[length:30px] [&_.about-side-card_small]:text-[length:22px] max-[1050px]:grid-cols-[repeat(2,minmax(240px,390px))] max-[1050px]:justify-center max-[720px]:grid-cols-[1fr] max-[720px]:gap-[22px] max-[720px]:[&_.about-side-card]:min-h-[220px]" aria-label="Hair restoration links">
          <label className="about-search flex items-center h-[70px] mb-0 py-0 pr-[24px] pl-[30px] [border:1px_solid_#c8d2dd] rounded-[8px] text-[var(--gold)] bg-[#fff] [&_input]:min-w-[0] [&_input]:flex-1 [&_input]:border-0 [&_input]:[outline:0] [&_input]:text-[#344356] [&_input]:bg-[transparent] [&_input]:[font:inherit] [&_input::placeholder]:text-[#425263] [&_input::placeholder]:opacity-[0.9] max-[1050px]:col-[1_/_-1]">
            <span className="sr-only">Search keyword</span>
            <input type="search" placeholder="Enter search keyword" />
            <Search size={22} />
          </label>

          <Link className="about-side-card relative grid [place-items:center] overflow-hidden text-[#fff] text-center isolate before:content-[''] before:absolute before:inset-0 before:z-[-1] before:[background:rgba(0,0,0,0.36)] [&_img]:z-[-2] [&_img]:object-cover [&_img]:[transition:transform_420ms_ease] [&_span]:text-[length:25px] [&_span]:leading-[1.1] [&_span]:font-normal [&_small]:inline-flex [&_small]:min-w-[146px] [&_small]:justify-center [&_small]:mt-[10px] [&_small]:py-[12px] [&_small]:px-[18px] [&_small]:[border-top:1px_solid_var(--gold)] [&_small]:[border-bottom:1px_solid_var(--gold)] [&_small]:text-[length:16px]" href="/services">
            <Image src="/images/about-us/img_1.png" alt="" fill sizes="390px" />
            <span>All<br />Services</span>
            <small>Learn More</small>
          </Link>

          <Link className="about-side-card relative grid [place-items:center] overflow-hidden text-[#fff] text-center isolate before:content-[''] before:absolute before:inset-0 before:z-[-1] before:[background:rgba(0,0,0,0.36)] [&_img]:z-[-2] [&_img]:object-cover [&_img]:[transition:transform_420ms_ease] [&_span]:text-[length:25px] [&_span]:leading-[1.1] [&_span]:font-normal [&_small]:inline-flex [&_small]:min-w-[146px] [&_small]:justify-center [&_small]:mt-[10px] [&_small]:py-[12px] [&_small]:px-[18px] [&_small]:[border-top:1px_solid_var(--gold)] [&_small]:[border-bottom:1px_solid_var(--gold)] [&_small]:text-[length:16px]" href="/contact-us">
            <Image src="/images/about-us/Img_2.png" alt="" fill sizes="390px" />
            <span>Keep<br />In Touch</span>
            <small>Contact Us</small>
          </Link>
        </aside>
      </section>

      <SiteFooter address="linked-name" copyright="plain" />
    </main>
  );
}
