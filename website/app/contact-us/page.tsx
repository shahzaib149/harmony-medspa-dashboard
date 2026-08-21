import { Building2, Facebook, Instagram, MapPin, Phone, Search } from "lucide-react";
import ContactForm from "@/components/forms/ContactForm";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import InteractiveLocationMap from "@/components/ui/InteractiveLocationMap";
import TypewriterText from "@/components/ui/TypewriterText";

export default function ContactUsPage() {
  return (
    <main className="contact-page min-h-[100vh] bg-[#fff] text-[#111]">
      <SiteHeader className="contact-page-header" />

      <section className="contact-page-hero grid [place-items:center] min-h-[255px] [background:linear-gradient(rgba(0,0,0,0.62),rgba(0,0,0,0.62)),radial-gradient(circle_at_22%_38%,rgba(255,255,255,0.09),transparent_15%),radial-gradient(circle_at_58%_30%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_78%_70%,rgba(255,255,255,0.06),transparent_18%),repeating-linear-gradient(26deg,rgba(255,255,255,0.035)_0_2px,transparent_2px_9px),linear-gradient(135deg,#252525,#111_52%,#242424)] [&_h1]:m-0 [&_h1]:text-[#d49d19] [&_h1]:text-[length:clamp(40px,3vw,52px)] [&_h1]:leading-[1] [&_h1]:font-thin max-[720px]:min-h-[210px]">
        <h1><TypewriterText text="contact us" letterDelay={110} caret ignoreReducedMotion /></h1>
      </section>

      <section className="contact-page-main grid grid-cols-[minmax(520px,660px)_313px] justify-center items-stretch w-[min(980px,calc(100%_-_48px))] mt-[75px] mb-[76px] mx-auto max-[1050px]:grid-cols-[minmax(0,660px)] max-[720px]:w-[min(100%_-_32px,560px)] max-[720px]:mt-[48px] max-[720px]:mb-[58px] max-[720px]:mx-auto" aria-labelledby="contact-page-title">
        <div className="contact-page-form-panel pt-[74px] pb-[82px] px-[78px] bg-[#f4f4f4] [&_h2]:mt-0 [&_h2]:mb-[8px] [&_h2]:mx-0 [&_h2]:text-[#ebb13d] [&_h2]:text-[length:38px] [&_h2]:leading-[1] [&_h2]:font-thin [&_p]:max-w-[500px] [&_p]:mt-0 [&_p]:mb-[27px] [&_p]:mx-0 [&_p]:uppercase [&_p]:text-[#000] [&_p]:text-[length:15px] [&_p]:leading-[1.38] [&_p]:font-normal [&_p]:tracking-[0.46em] max-[720px]:pt-[44px] max-[720px]:pb-[50px] max-[720px]:px-[24px] max-[720px]:[&_p]:tracking-[0.22em]">
          <h2 id="contact-page-title"><TypewriterText text="Contact Us" startOnView /></h2>
          <p>For non-urgent questions or to learn more about our services, contact us today!</p>
          <ContactForm variant="page" />
        </div>

        <aside className="contact-info-panel grid grid-rows-[313px_auto_1fr] [border:1px_solid_#e2e2e2] [border-left:0] bg-[#fff] max-[1050px]:grid-rows-[290px_auto_auto] max-[1050px]:[border-left:1px_solid_#e2e2e2] max-[1050px]:[border-top:0] max-[720px]:grid-rows-[250px_auto_auto]" aria-label="Harmony Med Spa contact details">
          <InteractiveLocationMap variant="contact" />

          <div className="contact-info-list pt-[36px] pb-[31px] px-[37px] [&_p]:grid [&_p]:grid-cols-[34px_1fr] [&_p]:gap-[15px] [&_p]:items-center [&_p]:mt-0 [&_p]:mb-[30px] [&_p]:mx-0 [&_p]:text-[#3e3e3e] [&_p]:text-[length:14px] [&_p]:leading-[1.45] [&_p]:font-normal [&_small]:block [&_small]:mb-[4px] [&_small]:uppercase [&_small]:text-[#3d3d3d] [&_small]:text-[length:11px] [&_small]:leading-[1] [&_small]:font-bold [&_a]:block [&_a]:text-[#3d3d3d] [&_a]:text-[length:19px] [&_a]:leading-[1] [&_a]:font-bold max-[720px]:pl-[24px] max-[720px]:pr-[24px] max-[720px]:ml-0 max-[720px]:mr-0">
            <p>
              <span className="contact-info-icon grid [place-items:center] w-[34px] h-[34px] rounded-full bg-[#333] text-[#fff]"><MapPin size={20} fill="currentColor" /></span>
              <span>2184 Gulf Gate Dr.<br />Sarasota, FL 34231</span>
            </p>
            <p>
              <span className="contact-info-icon grid [place-items:center] w-[34px] h-[34px] rounded-full bg-[#333] text-[#fff]"><Phone size={19} fill="currentColor" /></span>
              <span><small>Call</small><a href="tel:9419238990">(941) 923-8990</a></span>
            </p>
            <p>
              <span className="contact-info-icon grid [place-items:center] w-[34px] h-[34px] rounded-full bg-[#333] text-[#fff]"><Building2 size={18} /></span>
              <span><small>Fax</small><a href="tel:9419239024">(941) 923-9024</a></span>
            </p>
          </div>

          <div className="contact-page-social my-0 mx-[37px] pt-[34px] pb-0 px-0 [border-top:1px_solid_#e3e3e3] [&_p]:mt-0 [&_p]:mb-[18px] [&_p]:mx-0 [&_p]:uppercase [&_p]:text-[#222] [&_p]:text-[length:12px] [&_p]:font-normal [&_div]:flex [&_div]:flex-wrap [&_div]:gap-[6px] [&_a]:grid [&_a]:[place-items:center] [&_a]:w-[37px] [&_a]:h-[37px] [&_a]:rounded-full [&_a]:bg-[#333] [&_a]:text-[#fff] [&_a]:text-[length:14px] [&_a]:font-bold max-[720px]:pl-[24px] max-[720px]:pr-[24px] max-[720px]:ml-0 max-[720px]:mr-0">
            <p>Follow Us:</p>
            <div>
              <a href="#" aria-label="Facebook"><Facebook size={18} fill="currentColor" /></a>
              <a href="#" aria-label="Google"><Search size={18} /></a>
              <a href="#" aria-label="Instagram"><Instagram size={18} /></a>
              <a href="#" aria-label="X">X</a>
              <a href="#" aria-label="Yelp">Y</a>
            </div>
          </div>
        </aside>
      </section>

      <SiteFooter variant="contact-page-footer" social="compact" />
    </main>
  );
}
