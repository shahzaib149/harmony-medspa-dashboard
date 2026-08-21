import MembershipForm from "@/components/forms/MembershipForm";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TypewriterText from "@/components/ui/TypewriterText";
import { ONLINE_BOOKING_URL } from "@/lib/constants";

const facialMemberships = [
  {
    name: "Facial Membership",
    benefits: ["1 Monthly Facial (60mins)+1 Enhancement with Every Facial", "Get $10/unit tox while a Member", "Get 10% off Skincare while a Member"],
    monthly: "$149",
    semiAnnual: "$700",
    semiSavings: "Save $194",
    annual: "$1400",
    annualSavings: "Save $388"
  },
  {
    name: "Glo2 Facial Membership",
    benefits: ["1 Monthly Glo2Facial (45mins) with Red-Light Lymphatic Massage", "Get $10/unit tox while a Member", "Get 10% off Skincare while a Member"],
    monthly: "$199",
    semiAnnual: "$1000",
    annual: "$2000"
  }
];

const harmonyMemberships = [
  {
    name: "Vip Membership",
    details: ["$159/Month Beauty Bank", "Monthly Benefit: +1 Free Vitamin Shot per Month"],
    injectables: "10%",
    skincare: "10%",
    devices: "10%"
  },
  {
    name: "Vip Elite Membership",
    details: ["$259/Month Beauty Bank", "Monthly Benefit:+1 Free Vitamin Shot per Month", "Annual Benefit: 1 Free Device /Laser Treatment Per Year"],
    injectables: "10%",
    skincare: "10%",
    devices: "15%"
  }
];

export default function MembershipPage() {
  return (
    <main className="membership-page min-h-[100vh] bg-[#fff] text-[#000]">
      <SiteHeader className="contact-page-header" />

      <section className="membership-hero grid [place-items:center] min-h-[272px] [background:linear-gradient(rgba(0,0,0,0.66),rgba(0,0,0,0.66)),radial-gradient(circle_at_22%_38%,rgba(255,255,255,0.09),transparent_15%),radial-gradient(circle_at_58%_30%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_78%_70%,rgba(255,255,255,0.06),transparent_18%),repeating-linear-gradient(26deg,rgba(255,255,255,0.035)_0_2px,transparent_2px_9px),linear-gradient(135deg,#262626,#101010_52%,#242424)] [&_h1]:m-0 [&_h1]:text-[#d49d19] [&_h1]:text-[length:clamp(40px,3vw,52px)] [&_h1]:leading-[1] [&_h1]:font-thin max-[720px]:min-h-[210px]">
        <h1><TypewriterText text="membership" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="membership-section membership-facials w-[min(1220px,calc(100%_-_48px))] my-0 mx-auto text-center pt-[94px] pb-0 px-0 [&_h2]:mt-0 [&_h2]:mb-[14px] [&_h2]:mx-0 [&_h2]:text-[length:clamp(36px,3vw,44px)] [&_h2]:leading-[1] [&_h2]:font-thin [&>p]:m-0 [&>p]:text-[length:15px] [&>p]:leading-[1.45] [&>p]:font-normal max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:pt-[64px]" aria-labelledby="facial-memberships">
        <h2 id="facial-memberships"><TypewriterText text="facial memberships" startOnView /></h2>
        <p>Choose between our Signature Facials or the advanced Glo2Facial.</p>

        <div className="membership-pricing-table membership-facial-table mt-[30px] mb-0 mx-auto rounded-[14px] bg-[#f3f3f3] text-left max-w-[1220px] pt-[18px] pb-[38px] px-[66px] max-[1050px]:p-[30px] max-[720px]:p-[20px]">
          <div className="membership-table-head grid grid-cols-[170px_minmax(360px,1fr)_130px_150px_150px] gap-[28px] items-center min-h-[34px] text-[#575757] text-center text-[length:15px] font-bold max-[1050px]:hidden" aria-hidden="true">
            <span />
            <span />
            <strong>Monthly</strong>
            <strong>Semi-Annual</strong>
            <strong>Annual</strong>
          </div>
          {facialMemberships.map((membership) => (
            <article className="membership-table-row grid grid-cols-[170px_minmax(360px,1fr)_130px_150px_150px] gap-[28px] items-center min-h-[118px] [&_+_.membership-table-row]:mt-[12px] [&_h3]:m-0 [&_h3]:text-right [&_h3]:text-[length:25px] [&_h3]:leading-[0.98] [&_h3]:font-thin max-[1050px]:grid-cols-[1fr] max-[1050px]:gap-[14px] max-[1050px]:min-h-[0] max-[1050px]:py-[24px] max-[1050px]:px-0 max-[1050px]:text-center max-[1050px]:[&_+_.membership-table-row]:mt-0 max-[1050px]:[&_+_.membership-table-row]:[border-top:1px_solid_rgba(0,0,0,0.08)] max-[1050px]:[&_h3]:text-center max-[720px]:[&_h3]:text-[length:24px]" key={membership.name}>
              <h3>{membership.name}</h3>
              <div className="membership-details text-[length:15px] leading-[1.48] font-normal [&_p]:mt-0 [&_p]:mb-[4px] [&_p]:mx-0 [&_strong]:font-extrabold max-[720px]:text-[length:14px]">
                {membership.benefits.map((benefit) => (
                  <p key={benefit}>{benefit}</p>
                ))}
              </div>
              <div className="membership-price text-center [&_small]:hidden [&_strong]:block [&_strong]:text-[length:25px] [&_strong]:leading-[1.1] [&_strong]:font-thin [&_span]:block [&_span]:mt-[4px] [&_span]:text-[length:15px] [&_span]:leading-[1.2] [&_span]:font-normal max-[1050px]:[&_small]:block max-[1050px]:[&_small]:mb-[5px] max-[1050px]:[&_small]:text-[#575757] max-[1050px]:[&_small]:text-[length:13px] max-[1050px]:[&_small]:leading-[1.2] max-[1050px]:[&_small]:font-bold max-[720px]:[&_strong]:text-[length:24px]">
                <small>Monthly</small>
                <strong>{membership.monthly}</strong>
              </div>
              <div className="membership-price text-center [&_small]:hidden [&_strong]:block [&_strong]:text-[length:25px] [&_strong]:leading-[1.1] [&_strong]:font-thin [&_span]:block [&_span]:mt-[4px] [&_span]:text-[length:15px] [&_span]:leading-[1.2] [&_span]:font-normal max-[1050px]:[&_small]:block max-[1050px]:[&_small]:mb-[5px] max-[1050px]:[&_small]:text-[#575757] max-[1050px]:[&_small]:text-[length:13px] max-[1050px]:[&_small]:leading-[1.2] max-[1050px]:[&_small]:font-bold max-[720px]:[&_strong]:text-[length:24px]">
                <small>Semi-Annual</small>
                <strong>{membership.semiAnnual}</strong>
                {membership.semiSavings ? <span>{membership.semiSavings}</span> : null}
              </div>
              <div className="membership-price text-center [&_small]:hidden [&_strong]:block [&_strong]:text-[length:25px] [&_strong]:leading-[1.1] [&_strong]:font-thin [&_span]:block [&_span]:mt-[4px] [&_span]:text-[length:15px] [&_span]:leading-[1.2] [&_span]:font-normal max-[1050px]:[&_small]:block max-[1050px]:[&_small]:mb-[5px] max-[1050px]:[&_small]:text-[#575757] max-[1050px]:[&_small]:text-[length:13px] max-[1050px]:[&_small]:leading-[1.2] max-[1050px]:[&_small]:font-bold max-[720px]:[&_strong]:text-[length:24px]">
                <small>Annual</small>
                <strong>{membership.annual}</strong>
                {membership.annualSavings ? <span>{membership.annualSavings}</span> : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="membership-section membership-harmony w-[min(1220px,calc(100%_-_48px))] my-0 mx-auto text-center pt-[33px] pb-0 px-0 [&_h2]:mt-0 [&_h2]:mb-[14px] [&_h2]:mx-0 [&_h2]:text-[length:clamp(36px,3vw,44px)] [&_h2]:leading-[1] [&_h2]:font-thin [&>p]:m-0 [&>p]:text-[length:15px] [&>p]:leading-[1.45] [&>p]:font-normal max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:pt-[36px]" aria-labelledby="harmony-memberships">
        <h2 id="harmony-memberships"><TypewriterText text="harmony memberships" startOnView /></h2>
        <p>Exclusive member benefits and beauty bank for year-round beauty and wellness.</p>

        <div className="membership-discount-head grid grid-cols-[170px_minmax(360px,1fr)_130px_150px_150px] gap-[28px] items-center max-w-[1220px] mt-[22px] mb-[-28px] mx-auto py-0 px-[66px] text-center text-[length:12px] leading-[1.45] font-normal max-[1050px]:hidden" aria-hidden="true">
          <span />
          <span />
          <span>Discount on<br />Injectables &amp; Facials</span>
          <span>Discount on<br />Medical-Grade Skincare</span>
          <span>Discount on Device/<br />Laser Treatments</span>
        </div>

        <div className="membership-pricing-table membership-benefit-table mb-0 mx-auto rounded-[14px] text-left max-w-[1220px] mt-[52px] pt-[36px] pb-[42px] px-[66px] bg-[#f3f0e9] max-[1050px]:p-[30px] max-[720px]:p-[20px]">
          {harmonyMemberships.map((membership) => (
            <article className="membership-table-row grid grid-cols-[170px_minmax(360px,1fr)_130px_150px_150px] gap-[28px] items-center min-h-[118px] [&_+_.membership-table-row]:mt-[12px] [&_h3]:m-0 [&_h3]:text-right [&_h3]:text-[length:25px] [&_h3]:leading-[0.98] [&_h3]:font-thin max-[1050px]:grid-cols-[1fr] max-[1050px]:gap-[14px] max-[1050px]:min-h-[0] max-[1050px]:py-[24px] max-[1050px]:px-0 max-[1050px]:text-center max-[1050px]:[&_+_.membership-table-row]:mt-0 max-[1050px]:[&_+_.membership-table-row]:[border-top:1px_solid_rgba(0,0,0,0.08)] max-[1050px]:[&_h3]:text-center max-[720px]:[&_h3]:text-[length:24px]" key={membership.name}>
              <h3>{membership.name}</h3>
              <div className="membership-details text-[length:15px] leading-[1.48] font-normal [&_p]:mt-0 [&_p]:mb-[4px] [&_p]:mx-0 [&_strong]:font-extrabold max-[720px]:text-[length:14px]">
                {membership.details.map((detail, index) => (
                  <p key={detail}>{index === 0 ? <strong>{detail}</strong> : detail}</p>
                ))}
              </div>
              <div className="membership-price text-center [&_small]:hidden [&_strong]:block [&_strong]:text-[length:25px] [&_strong]:leading-[1.1] [&_strong]:font-thin [&_span]:block [&_span]:mt-[4px] [&_span]:text-[length:15px] [&_span]:leading-[1.2] [&_span]:font-normal max-[1050px]:[&_small]:block max-[1050px]:[&_small]:mb-[5px] max-[1050px]:[&_small]:text-[#575757] max-[1050px]:[&_small]:text-[length:13px] max-[1050px]:[&_small]:leading-[1.2] max-[1050px]:[&_small]:font-bold max-[720px]:[&_strong]:text-[length:24px]">
                <small>Injectables &amp; Facials</small>
                <strong>{membership.injectables}</strong>
              </div>
              <div className="membership-price text-center [&_small]:hidden [&_strong]:block [&_strong]:text-[length:25px] [&_strong]:leading-[1.1] [&_strong]:font-thin [&_span]:block [&_span]:mt-[4px] [&_span]:text-[length:15px] [&_span]:leading-[1.2] [&_span]:font-normal max-[1050px]:[&_small]:block max-[1050px]:[&_small]:mb-[5px] max-[1050px]:[&_small]:text-[#575757] max-[1050px]:[&_small]:text-[length:13px] max-[1050px]:[&_small]:leading-[1.2] max-[1050px]:[&_small]:font-bold max-[720px]:[&_strong]:text-[length:24px]">
                <small>Medical-Grade Skincare</small>
                <strong>{membership.skincare}</strong>
              </div>
              <div className="membership-price text-center [&_small]:hidden [&_strong]:block [&_strong]:text-[length:25px] [&_strong]:leading-[1.1] [&_strong]:font-thin [&_span]:block [&_span]:mt-[4px] [&_span]:text-[length:15px] [&_span]:leading-[1.2] [&_span]:font-normal max-[1050px]:[&_small]:block max-[1050px]:[&_small]:mb-[5px] max-[1050px]:[&_small]:text-[#575757] max-[1050px]:[&_small]:text-[length:13px] max-[1050px]:[&_small]:leading-[1.2] max-[1050px]:[&_small]:font-bold max-[720px]:[&_strong]:text-[length:24px]">
                <small>Device/Laser Treatments</small>
                <strong>{membership.devices}</strong>
              </div>
            </article>
          ))}
        </div>

        <div className="beauty-bank grid grid-cols-[310px_minmax(420px,640px)] justify-center gap-[18px] mt-[36px] mb-0 mx-auto text-left [&_h3]:m-0 [&_h3]:text-right [&_h3]:text-[length:24px] [&_h3]:leading-[1.03] [&_h3]:font-extrabold [&_p]:m-0 [&_p]:text-[length:15px] [&_p]:leading-[1.5] [&_p]:font-normal max-[1050px]:grid-cols-[minmax(0,720px)] max-[1050px]:gap-[16px] max-[1050px]:[&_h3]:text-center max-[720px]:mt-[30px] max-[720px]:[&_h3]:text-[length:23px] max-[720px]:[&_p]:text-[length:14px]">
          <h3>*What Is A<br />Beauty Bank?</h3>
          <p>
            Our Beauty Bank is a flexible savings program that lets you set aside money each month toward your favorite beauty services.
            Think of it as a personal beauty savings account- your monthly contribution builds up over time and can be used for any service
            or product.
          </p>
        </div>
      </section>

      <section className="membership-cta w-[min(1220px,calc(100%_-_48px))] mt-[234px] mb-0 mx-auto [&_a]:flex [&_a]:items-center [&_a]:justify-center [&_a]:min-h-[60px] [&_a]:rounded-[14px] [&_a]:bg-[#f3f3f3] [&_a]:text-[length:clamp(34px,3vw,42px)] [&_a]:leading-[1] [&_a]:font-thin [&_span]:ml-[10px] [&_span]:text-[#111] [&_span]:text-[length:34px] [&_span]:[transform:translateY(-1px)] max-[1050px]:mt-[96px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:mt-[72px]" aria-label="Book a membership consultation">
        <a href={ONLINE_BOOKING_URL} target="_blank" rel="noopener noreferrer">book now <span aria-hidden="true">&gt;</span></a>
      </section>

      <section className="membership-forms grid grid-cols-[repeat(2,minmax(0,1fr))] gap-[30px] w-[min(1220px,calc(100%_-_48px))] mt-[40px] mb-[144px] mx-auto max-[1050px]:grid-cols-[minmax(0,1fr)] max-[1050px]:max-w-[640px] max-[1050px]:mb-[88px] max-[720px]:w-[min(100%_-_32px,640px)] max-[720px]:mt-[32px] max-[720px]:mb-[72px] max-[720px]:mx-auto" aria-label="Membership forms">
        <MembershipForm kind="pricing" />
        <MembershipForm kind="membership" />
      </section>

      <SiteFooter variant="membership-footer" social="membership" />
    </main>
  );
}
