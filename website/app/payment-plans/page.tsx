import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import PaymentCalculator from "@/components/ui/PaymentCalculator";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";

const youtubeEmbedUrl = "https://www.youtube.com/embed/4gueRZVcjCs?start=26";

export default function PaymentPlansPage() {
  return (
    <main className="payment-plans-page min-h-[100vh] bg-[#fff] text-[#000]">
      <SiteHeader className="contact-page-header" />

      <section className="payment-plans-hero grid [place-items:center] min-h-[341px] [background:linear-gradient(rgba(0,0,0,0.62),rgba(0,0,0,0.62)),radial-gradient(circle_at_22%_38%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_70%_42%,rgba(255,255,255,0.06),transparent_24%),repeating-linear-gradient(29deg,rgba(255,255,255,0.025)_0_2px,transparent_2px_9px),linear-gradient(135deg,#252525,#101010_52%,#242424)] [&_h1]:m-0 [&_h1]:text-[var(--gold)] [&_h1]:text-[length:clamp(44px,3.5vw,58px)] [&_h1]:leading-[1] [&_h1]:font-thin max-[720px]:min-h-[230px]">
        <h1><TypewriterText text="payment plans" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="payment-plans-content grid grid-cols-[minmax(0,820px)_390px] gap-[90px] w-[min(100%_-_48px,1300px)] my-0 mx-auto pt-[108px] pb-[142px] px-0 max-[1050px]:grid-cols-[minmax(0,680px)] max-[1050px]:justify-center max-[1050px]:gap-[46px] max-[1050px]:pt-[76px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:pt-[56px] max-[720px]:pb-[76px] max-[720px]:px-0">
        <article className="payment-plans-main min-w-[0]">
          <section className="payment-section payment-cherry text-[#4f5966] text-[length:19px] leading-[1.58] font-normal [&_+_.payment-section]:mt-[70px] [&_h2]:mt-0 [&_h2]:mb-[20px] [&_h2]:mx-0 [&_h2]:text-[#ebb35a] [&_h2]:text-[length:27px] [&_h2]:leading-[1.14] [&_h2]:font-thin [&_h3]:mt-0 [&_h3]:mb-[20px] [&_h3]:mx-0 [&_h3]:text-[#ebb35a] [&_h3]:leading-[1.14] [&_h3]:font-thin [&_h3]:text-[length:25px] [&_p]:mt-0 [&_p]:mb-[8px] [&_p]:mx-0 [&_strong]:font-extrabold [&_ol]:mt-0 [&_ol]:mb-[28px] [&_ol]:mx-0 [&_ol]:pl-[22px] [&_ol]:text-[#000] [&_ol]:leading-[1.42] [&_ul]:mt-0 [&_ul]:mb-[28px] [&_ul]:mx-0 [&_ul]:pl-[22px] [&_ul]:text-[#000] [&_ul]:leading-[1.42] [&_li]:mb-[3px] max-[720px]:text-[length:16px] max-[720px]:[&_h2]:text-[length:24px] max-[720px]:[&_h3]:text-[length:24px]" aria-labelledby="cherry-title">
            <h2 id="cherry-title"><TypewriterText text="Cherry Payment Plans" startOnView /></h2>
            <p>Get treated now and pay over time with Cherry.</p>
            <p>
              Cherry is a payment plan designed for your health, beauty, and wellness needs and procedures and allows you to make
              convenient monthly payments.
            </p>
            <a
              className="line-button payment-line-button justify-center py-[13px] px-[18px] [border-top:1px_solid_var(--gold)] [border-bottom:1px_solid_var(--gold)] font-normal bg-[transparent] [border-left:0] [border-right:0] cursor-pointer flex w-[fit-content] min-w-[196px] mt-[16px] mb-[36px] mx-auto text-[#000] text-[length:21px] max-[720px]:text-[length:18px]"
              href="https://pay.withcherry.com/harmonymedspafl?utm_source=merchant&utm_medium=website*"
              target="_blank"
              rel="noreferrer"
            >
              Apply With Cherry
            </a>

            <div className="payment-cherry-grid grid grid-cols-[300px_minmax(0,1fr)] items-center gap-[30px] mt-[28px] [&_img]:block [&_img]:w-full [&_img]:h-auto max-[720px]:grid-cols-[1fr] max-[720px]:gap-[22px]">
              <Image src="/images/about-us/Img_3.jpg" alt="Cherry payment plans preview" width={460} height={307} />
              <div>
                <h3>3 Reasons Why Patients Love Cherry:</h3>
                <ol>
                  <li>Cherry qualifies patients for up to $10,000.00.</li>
                  <li>There is no hard credit check.</li>
                  <li>Cherry offers zero percent financing options*</li>
                </ol>
                <p className="payment-note text-[#000] leading-[1.45]">
                  *0% promo APR is subject to approval. Regular APR 9.99% - 35.99%. Down payment may be required.
                </p>
              </div>
            </div>

            <div className="payment-requirements [&_img]:block [&_img]:w-full [&_img]:h-auto grid grid-cols-[minmax(0,1fr)_300px] items-center gap-[36px] mt-[52px] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[22px] max-[720px]:[&_img]:[order:-1]">
              <div>
                <h3>Patient Requirements</h3>
                <ol>
                  <li>Patients must be at least 18 years of age</li>
                  <li>Patients must have a valid bank issued debit card</li>
                </ol>
              </div>
              <Image src="/images/about-us/Img_3.jpg" alt="" width={392} height={262} />
            </div>
          </section>

          <section className="payment-section payment-care-credit text-[#4f5966] text-[length:19px] leading-[1.58] font-normal [&_+_.payment-section]:mt-[70px] [&_h2]:mt-0 [&_h2]:mb-[20px] [&_h2]:mx-0 [&_h2]:text-[#ebb35a] [&_h2]:text-[length:27px] [&_h2]:leading-[1.14] [&_h2]:font-thin [&_h3]:mt-0 [&_h3]:mb-[20px] [&_h3]:mx-0 [&_h3]:text-[#ebb35a] [&_h3]:leading-[1.14] [&_h3]:font-thin [&_h3]:text-[length:25px] [&_p]:mt-0 [&_p]:mx-0 [&_strong]:font-extrabold [&_ol]:mt-0 [&_ol]:mb-[28px] [&_ol]:mx-0 [&_ol]:pl-[22px] [&_ol]:text-[#000] [&_ol]:leading-[1.42] [&_ul]:mt-0 [&_ul]:mb-[28px] [&_ul]:mx-0 [&_ul]:pl-[22px] [&_ul]:leading-[1.42] [&_li]:mb-[3px] pt-[2px] [&_p]:mb-[28px] [&_ul]:text-[#4f5966] max-[720px]:text-[length:16px] max-[720px]:[&_h2]:text-[length:24px] max-[720px]:[&_h3]:text-[length:24px]" aria-labelledby="care-credit-title">
            <h2 id="care-credit-title"><TypewriterText text="Care Credit" startOnView /></h2>
            <p>
              <strong>
                Harmony Med Spa proudly accepts the CareCredit credit card for all your health, wellness and beauty wants or needs.
              </strong>
            </p>
            <p>
              Help fit the care you want or need into your budget with the CareCredit health and wellness credit card. It offers flexible
              financing options that allow you to pay over time.*
            </p>
            <ul>
              <li>Promotional financing options available</li>
              <li>See if you prequalify with no impact to your credit score</li>
              <li>Instant credit decisions</li>
              <li>No annual fee&dagger;</li>
            </ul>
            <p>
              CareCredit also helps make care possible for you and your family. It&apos;s accepted at 266,000+ locations, so you can pay
              for chiropractic, dentistry, dermatology, cosmetic, hearing, prescriptions, pet care and more. It&apos;s a convenient way to
              help cover expenses not covered by insurance into your budget.
            </p>
            <p>Learn more by visiting carecredit.com or contacting our office.</p>
            <p className="payment-disclaimer leading-[1.5]">
              *Subject to credit approval. Visit carecredit.com for details.
              <br />
              &dagger; For new accounts as of 5/30/24: Purchase APR is 32.99%. Penalty APR is 39.99%. Minimum Interest Charge is $2.
              <br />
              CareCredit is a Synchrony solution. When you go to the CareCredit website you will be subject to the Synchrony privacy
              policy, which differs from the Harmony Med Spa privacy policy.
            </p>
            <a className="line-button payment-apply-button justify-center py-[13px] px-[18px] [border-top:1px_solid_var(--gold)] [border-bottom:1px_solid_var(--gold)] font-normal bg-[transparent] [border-left:0] [border-right:0] cursor-pointer flex w-[fit-content] mb-[36px] mx-auto text-[#000] text-[length:21px] min-w-[162px] mt-[28px] max-[720px]:text-[length:18px]" href="https://www.carecredit.com/" target="_blank" rel="noreferrer">
              Apply Now
            </a>
          </section>

          <div className="payment-video mt-[70px] w-[min(560px,100%)] [&_iframe]:block [&_iframe]:w-full [&_iframe]:aspect-[16_/_9] [&_iframe]:border-0 max-[720px]:ml-auto max-[720px]:mr-auto" aria-label="CareCredit video">
            <iframe
              src={youtubeEmbedUrl}
              title="CareCredit: Your Way to Pay for Health and Wellness"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          <section className="payment-section payment-calculator-section text-[#4f5966] text-[length:19px] leading-[1.58] font-normal [&_+_.payment-section]:mt-[70px] mt-[70px] [&_h2]:mt-0 [&_h2]:mx-0 [&_h2]:text-[#ebb35a] [&_h2]:text-[length:27px] [&_h2]:leading-[1.14] [&_h2]:font-thin [&_h3]:mt-0 [&_h3]:mb-[20px] [&_h3]:mx-0 [&_h3]:text-[#ebb35a] [&_h3]:leading-[1.14] [&_h3]:font-thin [&_h3]:text-[length:25px] [&_p]:mt-0 [&_p]:mb-[8px] [&_p]:mx-0 [&_strong]:font-extrabold [&_ol]:mt-0 [&_ol]:mb-[28px] [&_ol]:mx-0 [&_ol]:pl-[22px] [&_ol]:text-[#000] [&_ol]:leading-[1.42] [&_ul]:mt-0 [&_ul]:mb-[28px] [&_ul]:mx-0 [&_ul]:pl-[22px] [&_ul]:text-[#000] [&_ul]:leading-[1.42] [&_li]:mb-[3px] [&_h2]:mb-[30px] max-[720px]:text-[length:16px] max-[720px]:[&_h2]:text-[length:24px] max-[720px]:[&_h3]:text-[length:24px]" aria-labelledby="calculator-title">
            <h2 id="calculator-title"><TypewriterText text="Care Credit Calculator" startOnView /></h2>
            <PaymentCalculator />
          </section>
        </article>

        <aside className="payment-plans-sidebar grid [align-content:start] gap-[20px] [&_.about-search]:h-[70px] [&_.about-search]:mb-[15px] [&_.about-side-card]:min-h-[269px] [&_.about-side-card]:rounded-[18px] [&_.about-side-card_span]:text-[length:30px] [&_.about-side-card_small]:text-[length:22px] max-[1050px]:grid-cols-[repeat(2,minmax(240px,390px))] max-[1050px]:justify-center max-[1050px]:[&_.about-search]:col-[1_/_-1] max-[720px]:grid-cols-[1fr] max-[720px]:[&_.about-side-card]:min-h-[220px]" aria-label="Payment plans links">
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
