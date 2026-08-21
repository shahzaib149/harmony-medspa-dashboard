"use client";

import { FormEvent, useState } from "react";
import { submitLead } from "@/lib/submitLead";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = "idle" | "submitting" | "success" | "error";
type FormKind = "pricing" | "membership";

type Errors = {
  name?: string;
  email?: string;
  phone?: string;
};

const formCopy: Record<FormKind, { title: string; source: string; interest: string }> = {
  pricing: {
    title: "contact us for pricing",
    source: "Membership Pricing Form",
    interest: "Membership Pricing"
  },
  membership: {
    title: "request a membership",
    source: "Membership Request Form",
    interest: "Membership"
  }
};

function validate(name: string, email: string, phone: string) {
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

export default function MembershipForm({ kind }: { kind: FormKind }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const copy = formCopy[kind];

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
        message: copy.title,
        source: copy.source,
        treatmentInterest: copy.interest
      });

      setName("");
      setEmail("");
      setPhone("");
      setErrors({});
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="membership-form-card grid [justify-items:center] [align-content:start] min-h-[342px] pt-[47px] pb-[38px] px-[84px] rounded-[14px] bg-[#f3f0e9] text-center [&_h2]:mt-0 [&_h2]:mb-[12px] [&_h2]:mx-0 [&_h2]:text-[length:26px] [&_h2]:leading-[1] [&_h2]:font-thin [&_p]:mt-0 [&_p]:mb-[24px] [&_p]:mx-0 [&_p]:text-[length:15px] [&_p]:leading-[1.35] [&_p]:font-normal [&_input]:w-full [&_input]:h-[48px] [&_input]:[border:1px_solid_#d8d8d8] [&_input]:bg-[#fff] [&_input]:text-[#333] [&_input]:[font:inherit] [&_input]:text-[length:15px]! [&_input]:font-normal! [&_input]:[outline:0] [&_input]:py-0 [&_input]:px-[24px] [&_input::placeholder]:text-[#b5b5b5] [&_button]:min-w-[98px] [&_button]:mt-[24px] [&_button]:py-[14px] [&_button]:px-[20px] [&_button]:border-0 [&_button]:[border-top:1px_solid_#d49d19] [&_button]:[border-bottom:1px_solid_#d49d19] [&_button]:bg-[transparent] [&_button]:text-[#000] [&_button]:[font:inherit] [&_button]:text-[length:16px]! [&_button]:cursor-pointer [&_button:disabled]:cursor-wait [&_button:disabled]:opacity-[0.64] max-[1050px]:pt-[42px] max-[1050px]:pb-[38px] max-[1050px]:px-[52px] max-[720px]:min-h-[0] max-[720px]:pt-[36px] max-[720px]:pb-[34px] max-[720px]:px-[22px] max-[720px]:[&_h2]:text-[length:25px]">
        <h2>{copy.title}</h2>
        <p>A staff member will respond within 24 hours</p>
        <p className="membership-form-success mt-[6px] mb-0 mx-0 text-[length:13px] font-normal [justify-self:center] text-[#111] text-center">Thank you! We&apos;ll be in touch with you shortly.</p>
      </div>
    );
  }

  return (
    <form className="membership-form-card grid [justify-items:center] [align-content:start] min-h-[342px] pt-[47px] pb-[38px] px-[84px] rounded-[14px] bg-[#f3f0e9] text-center [&_h2]:mt-0 [&_h2]:mb-[12px] [&_h2]:mx-0 [&_h2]:text-[length:26px] [&_h2]:leading-[1] [&_h2]:font-thin [&_p]:mt-0 [&_p]:mb-[24px] [&_p]:mx-0 [&_p]:text-[length:15px] [&_p]:leading-[1.35] [&_p]:font-normal [&_input]:w-full [&_input]:h-[48px] [&_input]:[border:1px_solid_#d8d8d8] [&_input]:bg-[#fff] [&_input]:text-[#333] [&_input]:[font:inherit] [&_input]:text-[length:15px]! [&_input]:font-normal! [&_input]:[outline:0] [&_input]:py-0 [&_input]:px-[24px] [&_input::placeholder]:text-[#b5b5b5] [&_button]:min-w-[98px] [&_button]:mt-[24px] [&_button]:py-[14px] [&_button]:px-[20px] [&_button]:border-0 [&_button]:[border-top:1px_solid_#d49d19] [&_button]:[border-bottom:1px_solid_#d49d19] [&_button]:bg-[transparent] [&_button]:text-[#000] [&_button]:[font:inherit] [&_button]:text-[length:16px]! [&_button]:cursor-pointer [&_button:disabled]:cursor-wait [&_button:disabled]:opacity-[0.64] max-[1050px]:pt-[42px] max-[1050px]:pb-[38px] max-[1050px]:px-[52px] max-[720px]:min-h-[0] max-[720px]:pt-[36px] max-[720px]:pb-[34px] max-[720px]:px-[22px] max-[720px]:[&_h2]:text-[length:25px]" onSubmit={handleSubmit} noValidate>
      <h2>{copy.title}</h2>
      <p>A staff member will respond within 24 hours</p>

      <input
        type="text"
        name={`${kind}-name`}
        placeholder="Enter Name *"
        aria-label="Name"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      {errors.name ? <span className="membership-form-error [justify-self:start] mt-[6px] mb-0 mx-0 text-[#c0392b] text-left text-[length:13px] font-normal">{errors.name}</span> : null}

      <div className="membership-form-split grid grid-cols-[1fr_1fr] gap-[8px] w-full mt-[8px] max-[720px]:grid-cols-[1fr]">
        <input
          type="email"
          name={`${kind}-email`}
          placeholder="Enter Email *"
          aria-label="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          type="tel"
          name={`${kind}-phone`}
          placeholder="Enter Phone *"
          aria-label="Phone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </div>
      {errors.email ? <span className="membership-form-error [justify-self:start] mt-[6px] mb-0 mx-0 text-[#c0392b] text-left text-[length:13px] font-normal">{errors.email}</span> : null}
      {errors.phone ? <span className="membership-form-error [justify-self:start] mt-[6px] mb-0 mx-0 text-[#c0392b] text-left text-[length:13px] font-normal">{errors.phone}</span> : null}
      {status === "error" ? <span className="membership-form-error [justify-self:start] mt-[6px] mb-0 mx-0 text-[#c0392b] text-left text-[length:13px] font-normal">Something went wrong. Please try again or call us.</span> : null}

      <button type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "sending..." : "submit"}
      </button>
    </form>
  );
}
