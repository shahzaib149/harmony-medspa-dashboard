import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ClipboardCheck, MapPin, Phone, ShieldCheck, Stethoscope } from "lucide-react";
import WeightLossForm from "@/components/landing/WeightLossForm";
import { ADDRESS_LINE_1, ADDRESS_LINE_2, PHONE_DISPLAY, PHONE_TEL } from "@/lib/constants";
import styles from "./page.module.css";

const socialImage = "https://harmony-medspa.vercel.app/images/blogs/harmony-editorial/med-spa-consultation-conversation-sarasota.png";

export const metadata: Metadata = {
  title: "Medical Weight Loss in Sarasota | Harmony Med Spa",
  description: "Explore individualized, medically supervised weight-loss care with Jessica Simone, AGNP-C, at Harmony Med Spa in Sarasota, Florida.",
  openGraph: {
    title: "Medical Weight Loss in Sarasota | Harmony Med Spa",
    description: "A medically guided plan built around your health, goals, and ongoing progress.",
    images: [socialImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Medical Weight Loss in Sarasota | Harmony Med Spa",
    description: "A medically guided plan built around your health, goals, and ongoing progress.",
    images: [socialImage],
  },
  robots: { index: false, follow: false },
};

const phoneHref = `tel:+1${PHONE_TEL}`;

const trustPoints = [
  { icon: Stethoscope, title: "Medical-provider led", detail: "Care with Jessica Simone, AGNP-C" },
  { icon: MapPin, title: "Local Sarasota care", detail: "In-person support at Gulf Gate" },
  { icon: ClipboardCheck, title: "Built around you", detail: "Evaluation, follow-up, and plan review" },
];

const pathway = [
  { number: "01", label: "Evaluate", title: "Start with your full picture", body: "Discuss your health history, current medications, previous approaches, and the outcomes that matter to you." },
  { number: "02", label: "Personalize", title: "Build the right plan", body: "Your provider explains the options that may fit your evaluation, including medication only when clinically appropriate." },
  { number: "03", label: "Monitor", title: "Keep care responsive", body: "Regular check-ins, weigh-ins, and progress reviews help your provider understand how you are responding and adjust the plan." },
];

const programItems = [
  "A one-to-one provider consultation",
  "Review of health history, medications, and goals",
  "Discussion of medication options when clinically appropriate",
  "Regular weigh-ins and progress reviews",
  "Plan adjustments based on your response",
  "Optional wellness support available through Harmony",
];

const articles = [
  {
    href: "/blog/restore-confidence-after-weight-loss-how-dermal-fillers-help-rebuild-volume",
    image: "/images/blogs/blog-2/5.jpg",
    category: "After weight loss",
    title: "Restoring Facial Volume After Weight Loss",
    description: "Learn why facial volume can change after significant weight loss and which aesthetic questions to ask.",
  },
];

const faqs = [
  { question: "What happens at the first appointment?", answer: "Your first visit begins with a conversation about your health history, medications, previous weight-loss efforts, and goals. Jessica will explain which options may be appropriate and what ongoing care could look like before you decide how to proceed." },
  { question: "Do I have to take weight-loss medication?", answer: "No. Medication is one possible part of care and is considered only when medically appropriate. Your consultation is designed to help you understand the available options, not pressure you into one approach." },
  { question: "Does Harmony offer medication options?", answer: "Medication options may be discussed as part of an individualized medical evaluation. Eligibility and recommendations depend on your health history and provider assessment." },
  { question: "How much does the program cost?", answer: "Cost depends on the care and options included in your individualized plan. The team will explain applicable pricing before you commit to treatment." },
  { question: "How quickly will I see results?", answer: "Response varies from person to person. Your provider can discuss realistic expectations after learning about your health, goals, and recommended plan. Individual results vary." },
  { question: "Where is Harmony Med Spa located?", answer: `${ADDRESS_LINE_1}, ${ADDRESS_LINE_2}. The office is open Monday through Friday, 9:00 a.m. to 5:00 p.m.` },
];

export default function MedicalWeightLossLandingPage() {
  return (
    <div className={styles.page}>
      <a className={styles.skipLink} href="#main-content">Skip to main content</a>

      <header className={styles.header}>
        <a className={styles.brand} href="#top" aria-label="Harmony Med Spa medical weight loss">
          <Image src="/images/logo-transparent.png" alt="Harmony Med Spa" width={180} height={74} priority />
        </a>
        <div className={styles.headerActions}>
          <a className={styles.phoneLink} href={phoneHref}><Phone size={15} aria-hidden="true" /><span>{PHONE_DISPLAY}</span></a>
          <a className={styles.headerCta} href="#consultation">Request a consultation <ArrowUpRight size={16} aria-hidden="true" /></a>
        </div>
      </header>

      <main id="main-content">
        <section className={styles.hero} id="top" aria-labelledby="hero-heading">
          <div className={styles.heroMedia}>
            <Image
              src="/images/blogs/harmony-editorial/med-spa-consultation-conversation-sarasota.png"
              alt="A private consultation with a Harmony Med Spa medical provider"
              fill
              sizes="(max-width: 900px) 100vw, 62vw"
              className={styles.heroImage}
              priority
            />
            <div className={styles.heroShade} />
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>Medical weight loss · Sarasota</p>
              <h1 id="hero-heading">A weight-loss plan built around your biology—not a template.</h1>
              <p className={styles.heroLead}>Meet one-to-one with Jessica Simone, AGNP-C, for individualized medical care, thoughtful options, and ongoing progress support.</p>
              <div className={styles.heroLinks}>
                <a className={styles.primaryCta} href="#consultation">Request a consultation <ArrowRight size={17} aria-hidden="true" /></a>
                <a className={styles.textLink} href={phoneHref}>Prefer to talk? {PHONE_DISPLAY}</a>
              </div>
            </div>
            <p className={styles.heroCaption}>Individualized care starts with listening.</p>
          </div>

          <div className={styles.formColumn} id="consultation">
            <WeightLossForm id="consultation-form" />
          </div>
        </section>

        <section className={styles.trustRail} aria-label="Program highlights">
          <div className={styles.awardItem} aria-label="Harmony Med Spa awards and accreditation">
            <Image className={styles.bnsBadge} src="/images/footer/main.png" alt="BNS Best in Business 2024" width={84} height={84} />
            <Image className={styles.bbbBadge} src="/images/footer/bbb.png" alt="BBB Accredited Business" width={132} height={28} />
          </div>
          {trustPoints.map(({ icon: Icon, title, detail }) => (
            <div className={styles.trustItem} key={title}>
              <Icon size={20} strokeWidth={1.6} aria-hidden="true" />
              <div><strong>{title}</strong><span>{detail}</span></div>
            </div>
          ))}
        </section>

        <section className={styles.introSection} aria-labelledby="different-heading">
          <div className={styles.sectionNumber} aria-hidden="true">01 / CARE, DIFFERENTLY</div>
          <div className={styles.introStatement}>
            <p className={styles.eyebrowDark}>Beyond a quick prescription</p>
            <h2 id="different-heading">The plan should fit the person. Not the other way around.</h2>
          </div>
          <div className={styles.introBody}>
            <p>Medical weight loss is not simply a product or a number on a scale. At Harmony, it begins with a provider understanding the larger picture—your history, your goals, and what you have already tried.</p>
            <p>From there, Jessica can help you consider medically appropriate options and stay involved as your plan progresses.</p>
          </div>
        </section>

        <section className={styles.pathwaySection} aria-labelledby="pathway-heading">
          <div className={styles.pathwayHeading}>
            <p className={styles.eyebrowLight}>Your care pathway</p>
            <h2 id="pathway-heading">Clear next steps.<br />Care that stays connected.</h2>
          </div>
          <ol className={styles.pathwayList} role="list">
            {pathway.map((step) => (
              <li className={styles.pathwayStep} key={step.number}>
                <div className={styles.pathMarker}><span>{step.number}</span></div>
                <p className={styles.pathLabel}>{step.label}</p>
                <h3>{step.title}</h3>
                <p className={styles.pathBody}>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.providerSection} aria-labelledby="provider-heading">
          <div className={styles.providerImageWrap}>
            <Image src="/images/providers/clear_team_1.jpg" alt="Jessica Simone, AGNP-C, owner and medical provider at Harmony Med Spa" fill sizes="(max-width: 760px) 100vw, 44vw" className={styles.providerImage} />
            <div className={styles.providerStamp}><ShieldCheck size={20} aria-hidden="true" /><span>Board-certified<br />provider care</span></div>
          </div>
          <div className={styles.providerCopy}>
            <p className={styles.sectionNumber}>02 / MEET YOUR PROVIDER</p>
            <p className={styles.eyebrowDark}>Jessica Simone, AGNP-C</p>
            <h2 id="provider-heading">One provider who sees the whole picture.</h2>
            <p>Jessica is the owner of Harmony Med Spa and an advanced practice nurse board-certified by the American Academy of Nurse Practitioners. She leads the medical weight-loss program with an emphasis on individualized care and ongoing support.</p>
            <p className={styles.providerPrinciple}>A thoughtful evaluation first. Clear options second. Ongoing care after that.</p>
            <a className={styles.inlineCta} href="#consultation">Request a consultation <ArrowUpRight size={17} aria-hidden="true" /></a>
          </div>
        </section>

        <section className={styles.includesSection} aria-labelledby="includes-heading">
          <div className={styles.includesHeading}>
            <p className={styles.sectionNumber}>03 / YOUR PROGRAM</p>
            <h2 id="includes-heading">What individualized care may include</h2>
            <p>Your care is based on your provider evaluation. Not every item is right for every patient.</p>
          </div>
          <ul className={styles.includesList}>
            {programItems.map((item, index) => <li key={item}><span className={styles.itemNumber}>{String(index + 1).padStart(2, "0")}</span><span className={styles.itemText}>{item}</span></li>)}
          </ul>
        </section>

        <section className={styles.testimonialSection} aria-labelledby="patient-heading">
          <div className={styles.quoteMark} aria-hidden="true">“</div>
          <div className={styles.testimonialCopy}>
            <p className={styles.eyebrowLight}>A patient perspective</p>
            <h2 id="patient-heading">Care that makes room for questions.</h2>
            <blockquote>“Jessica addresses all of my questions and concerns thoughtfully. I highly recommend her and her delightful staff.”</blockquote>
            <p className={styles.attribution}>Debi D. · Harmony patient</p>
            <p className={styles.resultsNote}>Individual results vary.</p>
          </div>
          <div className={styles.testimonialAside}><span>01</span><p>Real feedback from a medical weight-loss patient.</p></div>
        </section>

        <section className={styles.articlesSection} aria-labelledby="articles-heading">
          <div className={styles.articlesHeader}>
            <div><p className={styles.eyebrowDark}>Read before your visit</p><h2 id="articles-heading">Useful, not overwhelming.</h2></div>
            <Link className={styles.allArticles} href="/blog">Explore all articles <ArrowUpRight size={16} aria-hidden="true" /></Link>
          </div>
          <div className={`${styles.articleGrid} ${articles.length === 1 ? styles.articleGridSingle : ""}`}>
            {articles.map((article, index) => (
              <Link className={styles.articleCard} href={article.href} key={article.href}>
                <div className={styles.articleImageWrap}><Image src={article.image} alt="" fill sizes="(max-width: 760px) 100vw, 33vw" className={styles.articleImage} /></div>
                <div className={styles.articleContent}>
                  <p>{String(index + 1).padStart(2, "0")} · {article.category}</p>
                  <h3>{article.title}</h3>
                  <span>{article.description}</span>
                  <strong>Read guide <ArrowUpRight size={15} aria-hidden="true" /></strong>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.faqSection} aria-labelledby="faq-heading">
          <div className={styles.faqIntro}><p className={styles.sectionNumber}>04 / BEFORE YOU BEGIN</p><h2 id="faq-heading">Questions worth asking.</h2><p>Clear information matters. If your question is not here, call the Harmony team and ask directly.</p><a href={phoneHref}>{PHONE_DISPLAY}</a></div>
          <div className={styles.faqList}>
            {faqs.map((faq, index) => (
              <details className={styles.faqItem} key={faq.question}>
                <summary><span>{String(index + 1).padStart(2, "0")}</span>{faq.question}<i aria-hidden="true" /></summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={styles.finalCta} aria-labelledby="final-heading">
          <div><p className={styles.eyebrowLight}>A private first conversation</p><h2 id="final-heading">Ready to understand your options?</h2></div>
          <div><p>Request a consultation with Harmony&apos;s Sarasota team. No generic promises—just a thoughtful next step.</p><a className={styles.primaryCta} href="#consultation">Request a consultation <ArrowRight size={17} aria-hidden="true" /></a></div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}><Image src="/images/logo-transparent.png" alt="Harmony Med Spa" width={150} height={62} /><p>Medical aesthetics and wellness care in Sarasota, Florida.</p></div>
        <div><p className={styles.footerLabel}>Visit</p><address>{ADDRESS_LINE_1}<br />{ADDRESS_LINE_2}</address></div>
        <div><p className={styles.footerLabel}>Contact</p><a href={phoneHref}>{PHONE_DISPLAY}</a><span>Monday–Friday · 9:00 a.m.–5:00 p.m.</span></div>
        <div className={styles.footerLegal}><p>© {new Date().getFullYear()} Harmony Med Spa.</p><p>This page provides general information and is not medical advice. Recommendations follow an individual medical evaluation.</p></div>
      </footer>

      <nav className={styles.mobileBar} aria-label="Quick contact actions">
        <a href={phoneHref}><Phone size={17} aria-hidden="true" /> Call</a>
        <a href="#consultation">Request consultation <ArrowRight size={17} aria-hidden="true" /></a>
      </nav>
    </div>
  );
}
