"use client";

import { FormEvent, useState } from "react";
import { ONLINE_BOOKING_URL } from "@/lib/constants";
import { submitLead } from "@/lib/submitLead";
import { trackLeadConversion } from "@/lib/analytics/gtag";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errors = {
  name?: string;
  email?: string;
  phone?: string;
};

type Status = "idle" | "submitting" | "success" | "error";

function validate(name: string, email: string, phone: string): Errors {
  const errors: Errors = {};

  if (!name.trim()) {
    errors.name = "Name is required.";
  }

  if (!email.trim()) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!phone.trim()) {
    errors.phone = "Phone is required.";
  }

  return errors;
}

export default function ContactForm({ variant }: { variant: "home" | "page" | "landing" }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validate(name, email, phone);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setStatus("submitting");

    try {
      await submitLead({
        name,
        email,
        phone,
        message,
        source: variant === "landing" ? "Landing Page Hero Form" : "Website Contact Form"
      });

      trackLeadConversion();

      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
      setErrors({});
      setStatus("success");

      if (variant === "landing") {
        if (typeof window !== "undefined") {
          window.location.assign("/book-now");
        }
      }
    } catch {
      setStatus("error");
    }
  }

  const formClassName = variant === "home" ? "contact-form" : variant === "landing" ? "landing-contact-form" : "contact-page-form";

  if (status === "success" && variant !== "landing") {
    return (
      <div className={formClassName}>
        {variant === "home" ? <h2>let&apos;s chat!</h2> : null}
        <p className="form-success-message">Thank you! We&apos;ll be in touch with you shortly.</p>
      </div>
    );
  }

  const bookNowButton = (
    <a className={variant === "home" ? "line-button inline-flex justify-center min-w-[116px] py-[13px] px-[18px] [border-top:1px_solid_var(--gold)] [border-bottom:1px_solid_var(--gold)] text-[inherit] text-[length:16px] font-normal bg-[transparent] [border-left:0] [border-right:0] cursor-pointer" : "form-book-now-button"} href={ONLINE_BOOKING_URL} target="_blank" rel="noopener noreferrer">
      Book Now
    </a>
  );

  const submitButton = (
    <button
      className={
        variant === "home"
          ? "line-button inline-flex justify-center min-w-[116px] py-[13px] px-[18px] [border-top:1px_solid_var(--gold)] [border-bottom:1px_solid_var(--gold)] text-[inherit] text-[length:16px] font-normal bg-[transparent] [border-left:0] [border-right:0] cursor-pointer"
          : variant === "landing"
          ? "landing-form-submit-btn"
          : undefined
      }
      type="submit"
      disabled={status === "submitting"}
    >
      {status === "submitting" ? "Sending..." : variant === "landing" ? "Request an Appointment" : "Send Message"}
    </button>
  );

  if (variant === "home") {
    return (
      <form className={formClassName} onSubmit={handleSubmit} noValidate>
        <h2>let&apos;s chat!</h2>
        <label>
          <span>name</span>
          <input type="text" name="name" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        {errors.name ? <p className="form-field-error">{errors.name}</p> : null}
        <div className="split grid grid-cols-[1fr_1fr] gap-[34px] max-[720px]:grid-cols-[1fr] max-[720px]:gap-[0]">
          <label>
            <span>email</span>
            <input type="email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>
            <span>phone</span>
            <input type="tel" name="phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>
        </div>
        {errors.email ? <p className="form-field-error">{errors.email}</p> : null}
        {errors.phone ? <p className="form-field-error">{errors.phone}</p> : null}
        <label>
          <span>message</span>
          <textarea name="message" rows={4} value={message} onChange={(event) => setMessage(event.target.value)} />
        </label>
        {status === "error" ? <p className="form-error-message">Something went wrong. Please try again or call us at (941) 306-3696.</p> : null}
        <div className="form-button-row">
          {submitButton}
          {bookNowButton}
        </div>
      </form>
    );
  }

  if (variant === "landing") {
    return (
      <form className={formClassName} onSubmit={handleSubmit} noValidate>
        <input type="text" name="name" placeholder="Enter Name *" aria-label="Name" value={name} onChange={(event) => setName(event.target.value)} />
        {errors.name ? <p className="form-field-error">{errors.name}</p> : null}
        <input type="email" name="email" placeholder="Enter Email *" aria-label="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
        {errors.email ? <p className="form-field-error">{errors.email}</p> : null}
        <input type="tel" name="phone" placeholder="Enter Number *" aria-label="Phone number" value={phone} onChange={(event) => setPhone(event.target.value)} />
        {errors.phone ? <p className="form-field-error">{errors.phone}</p> : null}
        <textarea name="message" placeholder="Enter message" aria-label="Message" rows={5} value={message} onChange={(event) => setMessage(event.target.value)} />
        {status === "error" ? <p className="form-error-message">Something went wrong. Please try again or call us at (941) 923-8990.</p> : null}
        <div className="form-button-row">{submitButton}</div>
      </form>
    );
  }

  return (
    <form className={formClassName} onSubmit={handleSubmit} noValidate>
      <input type="text" name="name" placeholder="Name" aria-label="Name" value={name} onChange={(event) => setName(event.target.value)} />
      {errors.name ? <p className="form-field-error">{errors.name}</p> : null}
      <input type="email" name="email" placeholder="Email" aria-label="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
      {errors.email ? <p className="form-field-error">{errors.email}</p> : null}
      <input type="tel" name="phone" placeholder="Phone" aria-label="Phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
      {errors.phone ? <p className="form-field-error">{errors.phone}</p> : null}
      <textarea
        name="message"
        placeholder="Message"
        aria-label="Message"
        rows={9}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />
      {status === "error" ? <p className="form-error-message">Something went wrong. Please try again or call us at (941) 306-3696.</p> : null}
      <div className="form-button-row">
        {submitButton}
        {bookNowButton}
      </div>
    </form>
  );
}
