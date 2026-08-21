import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

const programIncludes = [
  {
    label: "Initial Consultation:",
    text: "Meet with your practitioner to create a personalized plan."
  },
  {
    label: "GLP-1 Medications:",
    text: "All necessary medications, such as Semaglutide and Tirzepatide, are provided."
  },
  {
    label: "Regular Weigh-Ins:",
    text: "Ongoing sessions to monitor your progress."
  },
  {
    label: "Optional Upgrades:",
    text: "Additional services to enhance your weight loss results."
  }
];

const upgrades = [
  {
    label: "Bio-Boost Injections:",
    text: "Enhance fat burning with a combination of B-12, boosting metabolism, energy, weight loss, muscle function, mood, and appearance."
  },
  {
    label: "Methylated B-12 Injections:",
    text: "Increase fat burning, boost energy, aid in weight loss, restore muscle function, and improve mood and appearance."
  },
  {
    label: "MICC B-12 Injections:",
    text: "Containing Methionine, Inositol, Choline, and Cyanocobalamin (B-12), these injections boost metabolism, support liver function, and promote fat burning."
  }
];

const considerations = [
  {
    label: "Alcohol Consumption:",
    text: "Limit intake to avoid blood sugar fluctuations and potential hypoglycemia. Alcohol can also worsen gastrointestinal side effects."
  },
  {
    label: "Medication Interactions:",
    text: "Inform your provider of all medications you are taking. GLP-1 medications slow gastric emptying, potentially affecting the absorption of oral medications."
  }
];

const faqs = [
  {
    question: "What are GLP-1 medications?",
    answer: "GLP-1 medications are injectable drugs that help control blood sugar and aid in weight loss by mimicking the GLP-1 hormone in your body."
  },
  {
    question: "How do GLP-1 medications work for weight loss?",
    answer: "They slow gastric emptying, reduce appetite, and promote insulin release, helping to control blood sugar and reduce food intake."
  },
  {
    question: "How long should you take GLP-1 medications for weight loss?",
    answer: "The duration depends on individual goals and response, with clinical studies supporting use for extended periods for significant weight loss and health benefits."
  },
  {
    question: "Are GLP-1 medications a type of insulin?",
    answer: "No, they stimulate insulin release but are not a substitute for insulin."
  },
  {
    question: "Are GLP-1 medications stimulants?",
    answer: "No, they work differently from stimulants and do not have stimulating effects."
  },
  {
    question: "Are GLP-1 medications safe?",
    answer: "Yes, they are considered safe when used as indicated, though they carry some risks, including the potential for thyroid C-cell tumors in rodents and other effects."
  }
];

export default function MedicalWeightLossPage() {
  return (
    <main className="medical-weight-loss-page min-h-[100vh] bg-[#fff] text-[#000]">
      <SiteHeader className="team-header" servicesHref="/#services" contactHref="/#contact" />

      <section className="service-detail-hero grid [place-items:center] min-h-[320px] [background:linear-gradient(rgba(0,0,0,0.64),rgba(0,0,0,0.64)),radial-gradient(circle_at_28%_32%,rgba(255,255,255,0.08),transparent_22%),radial-gradient(circle_at_72%_46%,rgba(255,255,255,0.07),transparent_26%),repeating-linear-gradient(18deg,rgba(255,255,255,0.022)_0_2px,transparent_2px_8px),linear-gradient(135deg,#292929,#111_54%,#262626)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:text-[length:clamp(42px,4vw,58px)] [&_h1]:leading-[1.05] [&_h1]:font-thin max-[720px]:min-h-[230px] max-[720px]:px-[20px] max-[720px]:text-center">
        <h1><TypewriterText text="medical weight loss" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="grid grid-cols-[minmax(0,820px)_390px] gap-[78px] w-[min(100%_-_48px,1280px)] my-0 mx-auto pt-[92px] pb-[126px] px-0 max-[1050px]:grid-cols-[minmax(0,820px)] max-[1050px]:justify-center max-[1050px]:gap-[48px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:pt-[58px] max-[720px]:pb-[86px]">
        <article className="min-w-0 text-[length:20px] leading-[1.45] font-normal max-[720px]:text-[length:17px]">
          <section className="grid grid-cols-[298px_minmax(0,1fr)] items-start gap-[34px] mb-[42px] max-[760px]:grid-cols-[1fr] max-[760px]:gap-[26px]">
            <Image
              className="w-full h-auto rounded-[14px] max-[760px]:max-w-[340px]"
              src="/images/services/catalog/medical-weight-loss.jpg"
              alt="Medical weight loss program at Harmony Med Spa"
              width={700}
              height={700}
              priority
            />
            <div>
              <h2 className="mt-[18px] mb-[22px] text-[#ebb35a] text-[length:29px] leading-[1.1] font-thin max-[720px]:text-[length:25px]"><TypewriterText text="Medical Weight Loss Program Overview" startOnView /></h2>
              <h3 className="mt-0 mb-[24px] text-[#ebb35a] text-[length:27px] leading-[1.12] font-thin max-[720px]:text-[length:24px]">
                How The Medical Weight Loss Program Works:
              </h3>
              <p className="mt-0 mb-[8px]">Our comprehensive GLP-1 weight loss program includes:</p>
              <ul className="mt-0 mb-0 pl-[30px]">
                {programIncludes.slice(0, 2).map((item) => (
                  <li key={item.label}>
                    <strong>{item.label}</strong> {item.text}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <ul className="mt-0 mb-[58px] pl-[30px]">
            {programIncludes.slice(2).map((item) => (
              <li key={item.label}>
                <strong>{item.label}</strong> {item.text}
              </li>
            ))}
          </ul>

          <section className="mb-[40px]">
            <h2 className="mt-0 mb-[8px] text-[length:20px] leading-[1.35] font-bold"><TypewriterText text="Optional Upgrades:" startOnView /></h2>
            <ul className="mt-0 mb-0 pl-[30px]">
              {upgrades.map((item) => (
                <li key={item.label}>
                  <strong>{item.label}</strong> {item.text}
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-[40px]">
            <h2 className="mt-0 mb-[8px] text-[length:20px] leading-[1.35] font-bold"><TypewriterText text="Important Considerations While on GLP-1 Medications:" startOnView /></h2>
            <ul className="mt-0 mb-0 pl-[30px]">
              {considerations.map((item) => (
                <li key={item.label}>
                  <strong>{item.label}</strong> {item.text}
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-[54px]">
            <h2 className="mt-0 mb-[2px] text-[length:20px] leading-[1.35] font-bold"><TypewriterText text="Known Side Effects of GLP-1 Medications:" startOnView /></h2>
            <p className="mt-0 mb-[4px]">Common side effects include:</p>
            <ul className="mt-0 mb-0 pl-[30px]">
              <li>Nausea</li>
              <li>Constipation</li>
            </ul>
          </section>

          <section className="mb-[64px]">
            <h2 className="mt-0 mb-[24px] text-[#ebb35a] text-[length:27px] leading-[1.12] font-thin max-[720px]:text-[length:24px]"><TypewriterText text="How The Medical Weight Loss Program Works:" startOnView /></h2>
            {faqs.map((faq) => (
              <p className="mt-0 mb-[28px] max-w-[840px] last:mb-0" key={faq.question}>
                <strong>{faq.question}</strong> {faq.answer}
              </p>
            ))}
          </section>

          <section>
            <h2 className="mt-0 mb-[18px] text-[#ebb35a] text-[length:27px] leading-[1.12] font-thin max-[720px]:text-[length:24px]"><TypewriterText text="Learn More About Our GLP-1 Medications" startOnView /></h2>
            <div className="flex flex-wrap gap-[20px] mb-[38px]">
              <Link
                className="inline-flex min-w-[232px] justify-center py-[14px] px-[24px] [border-top:1px_solid_var(--gold)] [border-bottom:1px_solid_var(--gold)] text-[length:18px]"
                href="/book-now"
              >
                Semaglutide Service
              </Link>
              <Link
                className="inline-flex min-w-[222px] justify-center py-[14px] px-[24px] [border-top:1px_solid_var(--gold)] [border-bottom:1px_solid_var(--gold)] text-[length:18px]"
                href="/book-now"
              >
                Tirzepatide Service
              </Link>
            </div>
            <p className="m-0 max-w-[900px] text-[#4f5b68]">
              Experience the benefits of our Medical Weight Loss Program and achieve your health goals with the support of our expert team
              at Harmony Med Spa.
            </p>
          </section>
        </article>

        <aside className="grid [align-content:start] gap-[35px] pt-[16px] [&_.about-side-card]:min-h-[269px] [&_.about-side-card]:rounded-[18px] [&_.about-side-card_span]:text-[length:30px] [&_.about-side-card_small]:text-[length:22px] max-[1050px]:grid-cols-[repeat(2,minmax(240px,390px))] max-[1050px]:justify-center max-[720px]:grid-cols-[1fr] max-[720px]:gap-[22px] max-[720px]:[&_.about-side-card]:min-h-[220px]" aria-label="Medical weight loss links">
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
