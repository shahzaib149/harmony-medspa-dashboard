import Link from "next/link";
import { ONLINE_BOOKING_URL } from "@/lib/constants";
import TypewriterText from "@/components/ui/TypewriterText";

const businessHours = [
  ["Sunday", "Closed"],
  ["Monday", "9:00 AM to 5:00 PM"],
  ["Tuesday", "9:00 AM to 5:00 PM"],
  ["Wednesday", "9:00 AM to 5:00 PM"],
  ["Thursday", "9:00 AM to 5:00 PM"],
  ["Friday", "9:00 AM to 5:00 PM"],
  ["Saturday", "Closed"]
];

const services = [
  "Botox / Daxxify",
  "Dermal Fillers",
  "Facials",
  "Laser Hair Removal",
  "Medical Weight Loss",
  "RF Microneedling"
];

const providers = [
  "Jessica Simone, APRN",
  "Elizabeth Emery",
  "Harmony Med Spa Team"
];

export default function BookNowPage() {
  return (
    <main className="booking-page min-h-[100vh] bg-[#fff] text-[#050505] [font-family:Arial,'Helvetica_Neue',sans-serif] font-normal">
      <header className="booking-header grid grid-cols-[1fr_auto_1fr] items-center min-h-[80px] py-0 px-[clamp(24px,22vw,420px)] bg-[#f3f3f3] max-[1050px]:py-0 max-[1050px]:px-[48px] max-[720px]:grid-cols-[1fr] max-[720px]:[justify-items:center] max-[720px]:gap-[8px] max-[720px]:py-[14px] max-[720px]:px-[18px]">
        <Link className="booking-logo col-[1] block w-[155px] [&_img]:block [&_img]:w-full [&_img]:h-auto max-[720px]:col-[auto]" href="/" aria-label="Harmony Med Spa home">
          <img src="/images/logo-transparent.png" alt="Harmony Med Spa" />
        </Link>
        <nav className="booking-nav col-[3] flex justify-end gap-[24px] text-[#111827] text-[length:15px] tracking-[0.02em] max-[720px]:col-[auto] max-[720px]:justify-center" aria-label="Booking navigation">
          <Link href="/">Home</Link>
          <a href={ONLINE_BOOKING_URL}>Online Booking</a>
        </nav>
      </header>

      <section className="booking-content grid grid-cols-[minmax(420px,680px)_350px] gap-[48px] w-[min(1064px,calc(100%_-_48px))] min-h-[612px] my-0 mx-auto pt-[60px] pb-[82px] px-0 max-[1050px]:grid-cols-[minmax(0,1fr)_350px] max-[720px]:grid-cols-[1fr] max-[720px]:min-h-[0] max-[720px]:pt-[42px] max-[720px]:pb-[64px] max-[720px]:px-0" aria-labelledby="booking-title">
        <div className="booking-form-panel pt-[14px] [&_h1]:m-0 [&_h1]:text-[#000] [&_h1]:text-[length:29px] [&_h1]:leading-[1.15] [&_h1]:font-bold [&_h1]:tracking-[0.02em] [&_p]:mt-[12px] [&_p]:mb-[54px] [&_p]:mx-0 [&_p]:text-[length:15px] [&_p]:italic [&_p]:font-normal [&_p]:tracking-[0.02em] max-[720px]:pt-0">
          <h1 id="booking-title"><TypewriterText text="Book Appointment" letterDelay={110} caret ignoreReducedMotion /></h1>
          <p>Type a few letters to help narrow your selection</p>

          <form className="booking-form grid gap-[14px] [&_label]:grid [&_label]:gap-[6px] [&_label]:max-w-[520px] [&_label]:text-[length:16px] [&_label]:font-bold [&_select]:w-full [&_select]:h-[34px] [&_select]:[border:1px_solid_#c9c9c9] [&_select]:rounded-[4px] [&_select]:bg-[#fff] [&_select]:text-[#111] [&_select]:[font:inherit] [&_button]:w-[244px] [&_button]:h-[33px] [&_button]:mt-[58px] [&_button]:border-0 [&_button]:rounded-[2px] [&_button]:bg-[#000] [&_button]:text-[#fff] [&_button]:text-[length:14px] [&_button]:font-bold [&_button]:cursor-pointer max-[720px]:[&_label]:max-w-none max-[720px]:[&_label]:w-full max-[720px]:[&_button]:max-w-none max-[720px]:[&_button]:w-full">
            <label>
              <span>Select a Service:</span>
              <select name="service" defaultValue="">
                <option value="" aria-label="No service selected" />
                {services.map((service) => (
                  <option value={service} key={service}>{service}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Select a Provider:</span>
              <select name="provider" defaultValue="">
                <option value="" aria-label="No provider selected" />
                {providers.map((provider) => (
                  <option value={provider} key={provider}>{provider}</option>
                ))}
              </select>
            </label>

            <button type="button">Show Available Appointments</button>
          </form>
        </div>

        <aside className="business-hours [&_h2]:m-0 [&_h2]:text-[#000] [&_h2]:text-[length:29px] [&_h2]:leading-[1.15] [&_h2]:font-bold [&_h2]:tracking-[0.02em] [align-self:start] pt-[40px] pb-[30px] px-[20px] rounded-[9px] bg-[#f4f4f4] [&_h2]:mb-[14px] [&_dl]:mt-0 [&_dl]:mb-[43px] [&_dl]:mx-0 [&_div]:grid [&_div]:grid-cols-[92px_1fr] [&_div]:gap-[14px] [&_div]:mb-[9px] [&_div]:text-[length:16px] [&_div]:leading-[1.18] [&_dt]:font-bold [&_dd]:m-0 max-[720px]:[&_div]:grid-cols-[96px_1fr]" aria-labelledby="business-hours-title">
          <h2 id="business-hours-title"><TypewriterText text="Business Hours" startOnView /></h2>
          <dl>
            {businessHours.map(([day, hours]) => (
              <div key={day}>
                <dt>{day}:</dt>
                <dd>{hours}</dd>
              </div>
            ))}
          </dl>
          <a className="booking-call-button grid [place-items:center] w-full min-h-[56px] text-[length:16px] font-bold mb-[10px] bg-[#000] text-[#fff]" href="tel:9419238990">Call Us</a>
          <a className="booking-email-button grid [place-items:center] w-full min-h-[56px] text-[length:16px] font-bold [border:1px_solid_#222] bg-[#fff] text-[#000]" href="mailto:management@harmonymedspafl.com">E-mail Us</a>
        </aside>
      </section>

      <footer className="booking-footer pt-[61px] pb-[18px] px-[24px] bg-[#f4f4f4] [&_h2]:mt-0 [&_h2]:mb-[10px] [&_h2]:mx-0 [&_h2]:text-[length:15px] [&_h2]:leading-[1.2] [&_h2]:font-normal [&_p]:block [&_p]:mt-0 [&_p]:mb-[8px] [&_p]:mx-0 [&_p]:text-[#020617] [&_p]:text-[length:15px] [&_p]:leading-[1.2] [&_p]:font-normal [&_a]:block [&_a]:mt-0 [&_a]:mb-[8px] [&_a]:mx-0 [&_a]:text-[#020617] [&_a]:text-[length:15px] [&_a]:leading-[1.2] [&_a]:font-normal [&_p_a]:inline [&_p_a]:text-[#3b82f6]">
        <div className="booking-footer-inner grid grid-cols-[260px_360px_130px] justify-between gap-[56px] w-[min(1060px,100%)] mt-0 mb-[48px] mx-auto max-[1050px]:grid-cols-[repeat(3,minmax(0,1fr))] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[28px]">
          <div>
            <h2><TypewriterText text="Address" startOnView /></h2>
            <p>Harmony Med Spa</p>
            <p>2184 Gulf Gate Dr. Unit B</p>
            <p>Sarasota, FL 34231</p>
          </div>
          <div>
            <h2><TypewriterText text="Contact" startOnView /></h2>
            <p>Email: <a href="mailto:management@harmonymedspafl.com">management@harmonymedspafl.com</a></p>
            <p>Phone: <a href="tel:9419238990">9419238990</a></p>
            <div className="booking-social flex gap-[8px] mt-[12px] [&_a]:grid [&_a]:[place-items:center] [&_a]:w-[30px] [&_a]:h-[30px] [&_a]:m-0! [&_a]:[border:2px_solid_#2563eb] [&_a]:rounded-[4px] [&_a]:text-[#2563eb] [&_a]:text-[length:22px] [&_a]:font-bold [&_a:last-child]:border-[color:#ff3366] [&_a:last-child]:text-[#ff3366]">
              <a href="#" aria-label="Facebook">f</a>
              <a href="#" aria-label="Instagram">ig</a>
            </div>
          </div>
          <div>
            <h2><TypewriterText text="Pages" startOnView /></h2>
            <a href={ONLINE_BOOKING_URL}>Online Booking</a>
            <a href="#">Booking Terms</a>
            <a href="#">Privacy Policy</a>
          </div>
        </div>
        <p className="booking-credit m-0 text-[#a8adb8] text-center text-[length:13px] tracking-[0.04em] max-[720px]:text-left">Website Made by PatientNow. Copyright (c) 2026 All rights reserved.</p>
      </footer>
    </main>
  );
}
