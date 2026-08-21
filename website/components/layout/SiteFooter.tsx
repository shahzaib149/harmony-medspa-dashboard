import { Building2, Instagram, MapPin, Phone } from "lucide-react";
import {
  ADDRESS_LINE_1,
  ADDRESS_LINE_2,
  FACEBOOK_URL,
  FAX_DISPLAY,
  GOOGLE_MAPS_BUSINESS_URL,
  GOOGLE_MAPS_LOCATION_URL,
  INSTAGRAM_URL,
  PHONE_DISPLAY,
  SITE_NAME,
  TWITTER_X_URL,
  WEEKDAYS,
  YELP_URL
} from "@/lib/constants";

type SiteFooterProps = {
  /** Extra class appended to the base "footer" class. */
  variant?: "before-after-footer" | "contact-page-footer" | "membership-footer";
  /** "linked-name" prefixes the spa name, "plain" renders unlinked text. */
  address?: "linked" | "linked-name" | "plain";
  /** Renders the copyright line when set. */
  copyright?: "symbol" | "plain";
  social?: "default" | "compact" | "membership";
};

function FooterAddress({ address }: { address: NonNullable<SiteFooterProps["address"]> }) {
  if (address === "plain") {
    return (
      <p><MapPin size={20} />{ADDRESS_LINE_1}<br />{ADDRESS_LINE_2}</p>
    );
  }

  return (
    <p>
      <MapPin size={20} />
      <a className="footer-address hover:text-[var(--gold)] focus-visible:text-[var(--gold)]" href={GOOGLE_MAPS_LOCATION_URL} target="_blank" rel="noreferrer">
        {address === "linked-name" ? <>{SITE_NAME}<br /></> : null}
        {ADDRESS_LINE_1}<br />{ADDRESS_LINE_2}
      </a>
    </p>
  );
}

function YelpIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.18 10.95L15.34 2.8a.72.72 0 0 0-.96-.91l-7.23 4.8a.72.72 0 0 0-.17.97l3.2 5.08a.72.72 0 0 0 1-.79zm-2.47 2.05l-8.08-2.2a.72.72 0 0 0-.85 1.02l4.98 7.1a.72.72 0 0 0 .98.15l4.19-4.35a.72.72 0 0 0-1.22-1.72zm2.96 1.45l4.35 4.19a.72.72 0 0 0 1.13-.56l.46-8.67a.72.72 0 0 0-.82-.75l-6.3 1.83a.72.72 0 0 0 1.18 3.96z" />
    </svg>
  );
}

function FooterSocial() {
  return (
    <div className="flex flex-col items-end max-[720px]:items-center">
      <p className="footer-social-heading mb-3.5 text-[#6f6f6f] font-bold text-[15px] text-right">Follow Us On</p>
      <div className="footer-social-icons grid grid-cols-3 gap-3 w-fit">
        <a
          href={FACEBOOK_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Facebook"
          className="w-[46px] h-[46px] rounded-full bg-[#333] hover:bg-[#444] transition-colors flex items-center justify-center text-white text-[18px] font-bold font-sans"
        >
          f
        </a>
        <a
          href={GOOGLE_MAPS_BUSINESS_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Google Maps"
          className="w-[46px] h-[46px] rounded-full bg-[#333] hover:bg-[#444] transition-colors flex items-center justify-center text-white text-[17px] font-bold font-sans"
        >
          G
        </a>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Instagram"
          className="w-[46px] h-[46px] rounded-full bg-[#333] hover:bg-[#444] transition-colors flex items-center justify-center text-white"
        >
          <Instagram size={20} />
        </a>
        <a
          href={TWITTER_X_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="X (Twitter)"
          className="col-start-2 w-[46px] h-[46px] rounded-full bg-[#333] hover:bg-[#444] transition-colors flex items-center justify-center text-white text-[17px] font-bold font-sans"
        >
          X
        </a>
        <a
          href={YELP_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Yelp"
          className="col-start-3 w-[46px] h-[46px] rounded-full bg-[#333] hover:bg-[#444] transition-colors flex items-center justify-center text-white"
        >
          <YelpIcon size={20} />
        </a>
      </div>
    </div>
  );
}

export default function SiteFooter({ variant, address = "linked" }: SiteFooterProps) {
  return (
    <footer className={`footer ${variant ?? ""}`}>
      <div className="footer-inner grid grid-cols-[250px_280px_350px_200px] gap-[48px] [align-items:start] justify-between max-w-[1240px] mt-0 mb-[56px] mx-auto max-[1120px]:grid-cols-[repeat(2,minmax(240px,1fr))] max-[720px]:[justify-items:center] max-[720px]:text-left">
        <div className="awards">
          <div className="award-circle block w-[190px] h-[190px] overflow-hidden [background:url('/images/footer/main.png')_center_/_contain_no-repeat] text-[transparent] text-[length:0] [&_strong]:hidden [&_span]:hidden">2024<br /><strong>BNS</strong><span>Best in Business</span></div>
          <div className="bbb block w-[225px] h-[48px] mt-[20px] overflow-hidden [background:url('/images/footer/bbb.png')_center_/_contain_no-repeat] text-[transparent] text-[length:0]">BBB Accredited Business</div>
        </div>
        <div className="footer-contact text-[15px] [&_p]:grid [&_p]:grid-cols-[36px_1fr] [&_p]:gap-[14px] [&_p]:mt-0 [&_p]:mb-[28px] [&_p]:mx-0 [&_p]:font-bold [&_p]:leading-[1.4] [&_svg]:row-[span_2] [&_svg]:p-[8px] [&_svg]:w-[38px] [&_svg]:h-[38px] [&_svg]:rounded-full [&_svg]:bg-[#383838]">
          <FooterAddress address={address} />
          <p><Phone size={20} />Phone:<br />{PHONE_DISPLAY}</p>
          <p><Building2 size={20} />Fax:<br />{FAX_DISPLAY}</p>
        </div>
        <div className="hours text-[15px]">
          {WEEKDAYS.map((day) => (
            <p key={day}><span>{day}</span><strong>9:00am to 5:00pm</strong></p>
          ))}
          <p><span>Saturday</span><strong>Closed</strong></p>
          <p><span>Sunday</span><strong>Closed</strong></p>
        </div>
        <div className="social">
          <FooterSocial />
        </div>
      </div>
      <div className="copyright max-w-[1240px] mx-auto pt-[24px] border-t border-[var(--gold)] text-[#6f6f6f] font-bold text-[13px] leading-relaxed">
        © 2026 Harmony Med Spa. All rights Reserved. Accessibility Statement - Privacy Policy - Sitemap
      </div>
    </footer>
  );
}
